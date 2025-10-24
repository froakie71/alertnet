import 'package:cloud_firestore/cloud_firestore.dart';

class FireReports {
  static Future<void> submit(Map<String, dynamic> data) async {
    await FirebaseFirestore.instance.collection('incidentReports').add({
      ...data,
      'status': data['status'] ?? 'open',
      'timestamp': FieldValue.serverTimestamp(),
    });
  }
}
