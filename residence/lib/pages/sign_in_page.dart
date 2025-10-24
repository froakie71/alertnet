import 'package:flutter/material.dart';
import '../services/local_store.dart';
import '../services/fcm_service.dart';
import '../services/fire_residents.dart';

const liloanBarangays = [
  'Cabadiangan','Calero','Catarman','Cotcot','Jubay','Lataban','Mulao','Poblacion','San Roque','Santa Cruz','Tabla','Tayud','Yati'
];

class SignInPage extends StatefulWidget {
  const SignInPage({super.key});

  @override
  State<SignInPage> createState() => _SignInPageState();
}

class _SignInPageState extends State<SignInPage> {
  final _formKey = GlobalKey<FormState>();
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  String _barangay = 'Tayud';
  int _familyCount = 1;
  List<TextEditingController> _members = [TextEditingController()];

  @override
  void dispose() {
    _firstName.dispose();
    _lastName.dispose();
    _email.dispose();
    _phone.dispose();
    for (final c in _members) { c.dispose(); }
    super.dispose();
  }

  void _setFamilyCount(int n) {
    setState(() {
      _familyCount = n;
      if (_members.length < n) {
        final toAdd = n - _members.length;
        for (int i = 0; i < toAdd; i++) { _members.add(TextEditingController()); }
      } else if (_members.length > n) {
        _members = _members.sublist(0, n);
      }
    });
  }

  Future<void> _save() async {
    final isValid = _formKey.currentState?.validate() ?? false;
    if (!isValid) return;
    final profile = {
      'role': 'resident',
      'fullName': '${_firstName.text.trim()} ${_lastName.text.trim()}',
      'lastName': _lastName.text.trim(),
      'email': _email.text.trim(),
      'phoneNumber': _phone.text.trim(),
      'barangay': _barangay,
      'familyCount': _familyCount,
      'familyMembers': _members.map((c) => c.text.trim()).where((e) => e.isNotEmpty).toList(),
      'channelPrefs': { 'push': true, 'sms': true },
      'createdAt': DateTime.now().millisecondsSinceEpoch,
      'updatedAt': DateTime.now().millisecondsSinceEpoch,
    };
    await LocalStore.setProfile(profile);
    final token = await FcmService.token();
    try {
      await FireResidents.upsertProfile(profile, token);
    } catch (_) {}
    await LocalStore.setLoggedIn(false);
    if (!mounted) return;
    await showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Application Submitted'),
        content: const Text('Please wait for officials to approve your account. You will receive a notification.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('OK')),
        ],
      ),
    );
    if (!mounted) return;
    Navigator.of(context).pushReplacementNamed('/waiting');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Resident Sign In')), 
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Basic Info', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _firstName,
                decoration: const InputDecoration(labelText: 'First Name', border: OutlineInputBorder()),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _lastName,
                decoration: const InputDecoration(labelText: 'Last Name', border: OutlineInputBorder()),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _email,
                decoration: const InputDecoration(labelText: 'Email', border: OutlineInputBorder()),
                keyboardType: TextInputType.emailAddress,
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _phone,
                decoration: const InputDecoration(labelText: 'Phone (+63...)', border: OutlineInputBorder()),
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 12),
              InputDecorator(
                decoration: const InputDecoration(labelText: 'Barangay', border: OutlineInputBorder()),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _barangay,
                    isExpanded: true,
                    onChanged: (v) => setState(() => _barangay = v ?? _barangay),
                    items: liloanBarangays.map((b) => DropdownMenuItem(value: b, child: Text(b))).toList(),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              const Text('Family Members', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Row(children: [
                const Text('How many?'),
                const SizedBox(width: 12),
                DropdownButton<int>(
                  value: _familyCount,
                  onChanged: (v) { if (v != null) _setFamilyCount(v); },
                  items: List.generate(15, (i) => i+1).map((n) => DropdownMenuItem(value: n, child: Text('$n'))).toList(),
                ),
              ]),
              const SizedBox(height: 8),
              ...List.generate(_familyCount, (i) => Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: TextField(
                  controller: _members[i],
                  decoration: InputDecoration(
                    labelText: 'Member ${i+1} name',
                    border: const OutlineInputBorder(),
                  ),
                ),
              )),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(onPressed: _save, child: const Text('Save and Continue')),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
