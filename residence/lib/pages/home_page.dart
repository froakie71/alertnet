import 'dart:io';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:uuid/uuid.dart';
import '../services/local_store.dart';
import '../services/fire_residents.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'alerts_page.dart';
import '../services/fire_reports.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});
  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final _desc = TextEditingController();
  String _severity = 'Yellow';
  File? _imageFile; // local only, no Firebase upload
  Position? _pos;
  bool _saving = false;
  List<Map<String, dynamic>> _offline = [];
  Timer? _hbTimer;
  int _unread = 0;
  StreamSubscription<QuerySnapshot<Map<String, dynamic>>>? _alertsSub;
  bool _online = false;
  StreamSubscription<ConnectivityResult>? _connSub;
  StreamSubscription<QuerySnapshot<Map<String, dynamic>>>? _myReportSub;
  Map<String, dynamic>? _latestReport;

  @override
  void initState() {
    super.initState();
    _loadOffline();
    _heartbeatOnce();
    _hbTimer = Timer.periodic(const Duration(minutes: 1), (_) => _heartbeatOnce());
    _startAlertsSub();
    _initConnectivity();
    _listenMyReport();
  }

  Future<void> _loadOffline() async {
    final list = await LocalStore.getReports();
    setState(() { _offline = list; });
  }

  Future<void> _getLocation() async {
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) return;
    }
    if (permission == LocationPermission.deniedForever) return;
    final pos = await Geolocator.getCurrentPosition();
    setState(() { _pos = pos; });
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final x = await picker.pickImage(source: ImageSource.gallery);
    if (x != null) setState(() { _imageFile = File(x.path); });
  }

  Future<void> _heartbeatOnce() async {
    final profile = await LocalStore.getProfile();
    final id = ((profile?['email'] ?? profile?['phoneNumber']) as String?)?.toLowerCase();
    if (id == null || id.isEmpty) return;
    try {
      await FireResidents.heartbeat(id, profile);
    } catch (_) {}
  }

  Future<void> _startAlertsSub() async {
    final profile = await LocalStore.getProfile();
    final brgy = profile?['barangay'] as String?;
    final lastSeen = await LocalStore.getAlertsLastSeenAt();
    final stream = FirebaseFirestore.instance
        .collection('alerts')
        .orderBy('createdAt', descending: true)
        .limit(50)
        .snapshots();
    await _alertsSub?.cancel();
    _alertsSub = stream.listen((snap) {
      final count = snap.docs.where((d) {
        final data = d.data();
        final t = data['targets'];
        final list = (t is Map && t['barangays'] is List) ? List<String>.from(t['barangays']) : <String>[];
        final createdAt = data['createdAt'];
        final ts = createdAt is Timestamp ? createdAt.millisecondsSinceEpoch : 0;
        final targetOk = list.isEmpty || (brgy != null && list.contains(brgy));
        return targetOk && ts > lastSeen;
      }).length;
      if (mounted) setState(() { _unread = count; });
    });
  }

  Future<void> _initConnectivity() async {
    try {
      final res = await Connectivity().checkConnectivity();
      _updateOnline(res);
      _connSub = Connectivity().onConnectivityChanged.listen(_updateOnline);
    } catch (_) {}
  }

  void _updateOnline(ConnectivityResult r) {
    final on = r != ConnectivityResult.none;
    if (mounted) setState(() { _online = on; });
  }

  Future<void> _listenMyReport() async {
    final profile = await LocalStore.getProfile();
    final rid = ((profile?['email'] ?? profile?['phoneNumber']) as String?)?.toLowerCase();
    if (rid == null || rid.isEmpty) return;
    await _myReportSub?.cancel();
    final col = FirebaseFirestore.instance.collection('incidentReports');
    // No orderBy -> no composite index required. We'll pick the latest in _onMyReportSnap.
    _myReportSub = col.where('residentId', isEqualTo: rid).limit(25).snapshots().listen(_onMyReportSnap);
  }

  void _onMyReportSnap(QuerySnapshot<Map<String, dynamic>> snap) {
    if (snap.docs.isEmpty) {
      if (mounted) setState(() { _latestReport = null; });
      return;
    }
    QueryDocumentSnapshot<Map<String, dynamic>> best = snap.docs.first;
    int ts(QueryDocumentSnapshot<Map<String, dynamic>> d) {
      final t = d.data()['timestamp'];
      if (t is Timestamp) return t.millisecondsSinceEpoch;
      if (t is int) return t;
      return 0;
    }
    for (final d in snap.docs.skip(1)) {
      if (ts(d) > ts(best)) best = d;
    }
    if (mounted) setState(() { _latestReport = {'id': best.id, ...best.data()}; });
  }

  void _showRescueSheet() {
    final a = _latestReport;
    if (a == null) return;
    final status = (a['status'] ?? '').toString();
    showModalBottomSheet(
      context: context,
      builder: (_) => Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Responders', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            Text(status == 'dispatched' ? 'Responders dispatched' : 'Dispatch in progress'),
            const SizedBox(height: 8),
            Text('Severity: ${a['severity'] ?? ''}'),
            if (a['location'] is Map) Text('Location: ${(a['location']['lat'] ?? '').toString()}, ${(a['location']['lng'] ?? '').toString()}'),
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Close')),
            )
          ],
        ),
      ),
    );
  }

  Future<void> _saveReport() async {
    final id = const Uuid().v4();
    setState(() { _saving = true; });
    final report = {
      'id': id,
      'description': _desc.text.trim(),
      'severity': _severity,
      'timestamp': DateTime.now().millisecondsSinceEpoch,
      'location': _pos == null ? null : { 'lat': _pos!.latitude, 'lng': _pos!.longitude },
      // store image file path locally (no Firebase storage)
      'imagePath': _imageFile?.path,
    };
    // Online path: send to Firestore, do NOT save offline. Require GPS for map.
    if (_online) {
      if (_pos == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No GPS. Tap Get GPS then Send Online.')));
        }
        setState(() { _saving = false; });
        return;
      }
      try {
        final profile = await LocalStore.getProfile();
        final residentId = ((profile?['email'] ?? profile?['phoneNumber']) as String?)?.toLowerCase();
        final barangay = profile?['barangay'];
        await FireReports.submit({
          'type': 'Incident',
          'severity': _severity,
          'description': _desc.text.trim(),
          'location': { 'lat': _pos!.latitude, 'lng': _pos!.longitude },
          if (residentId != null) 'residentId': residentId,
          if (barangay != null) 'barangay': barangay,
          'source': 'resident_app',
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Report sent online')));
        }
      } catch (_) {
        // Fallback to offline save only if network send fails
        await LocalStore.addReport(report);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Network error. Saved offline.')));
        }
      }
    } else {
      // Offline path: save locally only
      await LocalStore.addReport(report);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Saved offline (no network)')));
      }
    }
    await _loadOffline();
    setState(() {
      _saving = false;
      _desc.clear();
      _imageFile = null;
    });
  }

  Future<void> _deleteReport(String id) async {
    await LocalStore.deleteReport(id);
    await _loadOffline();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Resident Home'),
        actions: [
          if (_latestReport != null && ['dispatching','dispatched'].contains((_latestReport!['status'] ?? '').toString()))
            IconButton(
              icon: const Icon(Icons.local_hospital, color: Colors.red),
              onPressed: _showRescueSheet,
            ),
          Stack(children: [
            IconButton(
              icon: const Icon(Icons.notifications),
              onPressed: () async {
                if (!mounted) return;
                await Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AlertsPage()));
                await LocalStore.setAlertsLastSeenNow();
                _startAlertsSub();
              },
            ),
            if (_unread > 0)
              Positioned(
                right: 10,
                top: 10,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: Colors.red, borderRadius: BorderRadius.circular(999)),
                  child: Text('$_unread', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                ),
              )
          ]),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await LocalStore.setLoggedIn(false);
              try { _hbTimer?.cancel(); _hbTimer = null; } catch (_) {}
              try { await _alertsSub?.cancel(); } catch (_) {}
              try { await _myReportSub?.cancel(); } catch (_) {}
              if (!mounted) return;
              Navigator.of(context).pushReplacementNamed('/login');
            },
          )
        ],
      ), 
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Report an Incident', style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _desc,
                      decoration: const InputDecoration(
                        labelText: 'Description',
                        border: OutlineInputBorder(),
                      ),
                      maxLines: 3,
                    ),
                    const SizedBox(height: 12),
                    InputDecorator(
                      decoration: const InputDecoration(labelText: 'Severity', border: OutlineInputBorder()),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _severity,
                          isExpanded: true,
                          onChanged: (v) => setState(() => _severity = v ?? _severity),
                          items: const ['Yellow','Orange','Red','Signal 1','Signal 2','Signal 3','Signal 4','Signal 5']
                            .map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(children: [
                      ElevatedButton.icon(onPressed: _getLocation, icon: const Icon(Icons.my_location), label: const Text('Get GPS')),
                      const SizedBox(width: 12),
                      Text(_pos == null ? 'No location yet' : '${_pos!.latitude.toStringAsFixed(5)}, ${_pos!.longitude.toStringAsFixed(5)}'),
                    ]),
                    const SizedBox(height: 12),
                    Row(children: [
                      ElevatedButton.icon(onPressed: _pickImage, icon: const Icon(Icons.image), label: const Text('Pick Image')), 
                      const SizedBox(width: 12),
                      Expanded(child: Text(_imageFile?.path ?? 'No image selected (kept local)')),
                    ]),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _saving ? null : _saveReport,
                        child: _saving
                            ? const CircularProgressIndicator(strokeWidth: 2)
                            : Text(_online && _pos != null ? 'Send Online' : 'Save Offline'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text('Offline Reports', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            ..._offline.map((r) => Card(
              child: ListTile(
                title: Text('${r['severity'] ?? ''} — ${DateTime.fromMillisecondsSinceEpoch(r['timestamp']).toLocal()}'),
                subtitle: Text(r['description'] ?? ''),
                trailing: IconButton(icon: const Icon(Icons.delete, color: Colors.red), onPressed: () => _deleteReport(r['id'] as String)),
              ),
            )),
            if (_offline.isEmpty) const Text('No offline reports yet.'),
            const SizedBox(height: 40),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12.0),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: const [
                  Text('Mobile App (Flutter) for Residents', style: TextStyle(fontWeight: FontWeight.bold)),
                  SizedBox(height: 8),
                  Text('• Receive typhoon/rainfall alerts via push notification or SMS fallback.'),
                  Text('• Send incident reports with GPS, photos, and descriptions.'),
                  Text('• Store reports offline when no internet is available (SharedPreferences).'),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _hbTimer?.cancel();
    _alertsSub?.cancel();
    _connSub?.cancel();
    _myReportSub?.cancel();
    super.dispose();
  }
}
