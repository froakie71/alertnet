import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import '../services/local_store.dart';

class AlertsPage extends StatelessWidget {
  const AlertsPage({super.key});

  String _fmtTime(Map<String, dynamic> a) {
    final c = a['createdAt'];
    DateTime? dt;
    if (c is Timestamp) dt = c.toDate();
    if (c is int) dt = DateTime.fromMillisecondsSinceEpoch(c);
    if (dt == null) return '';
    dt = dt.toLocal();
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inMinutes < 1) return 'now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    final h = dt.hour % 12 == 0 ? 12 : dt.hour % 12;
    final m = dt.minute.toString().padLeft(2, '0');
    final ampm = dt.hour >= 12 ? 'PM' : 'AM';
    return '${dt.month}/${dt.day} $h:$m $ampm';
  }

  Stream<QuerySnapshot<Map<String, dynamic>>> _stream(String? barangay) {
    final col = FirebaseFirestore.instance.collection('alerts');
    // When barangay is known, you can filter client-side for now.
    return col.orderBy('createdAt', descending: true).limit(50).snapshots();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>?>(
      future: LocalStore.getProfile(),
      builder: (context, prof) {
        final brgy = prof.data?['barangay'] as String?;
        return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
          stream: _stream(brgy),
          builder: (context, snap) {
            if (!snap.hasData) {
              return const Scaffold(body: Center(child: CircularProgressIndicator()));
            }
            final docs = snap.data!.docs.where((d) {
              final m = d.data();
              final t = m['targets'];
              final list = (t is Map && t['barangays'] is List) ? List<String>.from(t['barangays']) : <String>[];
              return list.isEmpty || (brgy != null && list.contains(brgy));
            }).toList()
              ..sort((a, b) {
                int ts(DocumentSnapshot<Map<String, dynamic>> x) {
                  final map = x.data() ?? <String, dynamic>{};
                  final c = map['createdAt'];
                  if (c is Timestamp) return c.millisecondsSinceEpoch;
                  if (c is int) return c;
                  return 0;
                }
                return ts(b).compareTo(ts(a));
              });
            return Scaffold(
              appBar: AppBar(title: const Text('Alerts')),
              body: ListView.separated(
                padding: const EdgeInsets.all(12),
                itemCount: docs.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (context, i) {
                  final a = docs[i].data();
                  return ListTile(
                    tileColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: Color(0xFFE5E7EB))),
                    title: Text(a['title'] ?? 'Alert', style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text(a['body'] ?? ''),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(a['severity'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                        const SizedBox(height: 4),
                        Text(_fmtTime(a), style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                      ],
                    ),
                  );
                },
              ),
            );
          },
        );
      },
    );
  }
}
