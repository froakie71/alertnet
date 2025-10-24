import 'package:cloud_firestore/cloud_firestore.dart';

class FireResidents {
  static final CollectionReference<Map<String, dynamic>> _col =
      FirebaseFirestore.instance.collection('residentProfiles');

  static Future<void> upsertProfile(Map<String, dynamic> profile, String? fcmToken) async {
    final id = ((profile['email'] ?? profile['phoneNumber']) as String).toLowerCase();
    final docRef = _col.doc(id);
    final existing = await docRef.get();
    final data = <String, dynamic>{
      ...profile,
      'status': 'pending',
      if (fcmToken != null) 'fcmTokens': FieldValue.arrayUnion([fcmToken]),
      'createdAt': existing.exists ? (existing.data()?['createdAt'] ?? FieldValue.serverTimestamp()) : FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    };
    await docRef.set(data, SetOptions(merge: true));
  }

  static Future<DocumentSnapshot<Map<String, dynamic>>> getById(String id) {
    return _col.doc(id.toLowerCase()).get();
  }

  static Future<void> heartbeat(String id, Map<String, dynamic>? profile) async {
    final doc = FirebaseFirestore.instance.collection('households').doc(id.toLowerCase());
    final fullName = ((profile?['firstName'] ?? '') + ' ' + (profile?['lastName'] ?? '')).trim();
    await doc.set({
      if (fullName.isNotEmpty) 'name': fullName,
      if (profile?['barangay'] != null) 'address': profile?['barangay'],
      'barangay': profile?['barangay'],
      'lastOnlineAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }
}
