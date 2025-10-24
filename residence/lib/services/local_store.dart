import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class LocalStore {
  static const String profileKey = 'resident_profile_v1';
  static const String reportsKey = 'offline_reports_v1';
  static const String loginKey = 'resident_logged_in_v1';
  static const String alertsSeenKey = 'alerts_seen_at_v1';

  static Future<Map<String, dynamic>?> getProfile() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(profileKey);
    if (raw == null || raw.isEmpty) return null;
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  static Future<void> setProfile(Map<String, dynamic> profile) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(profileKey, jsonEncode(profile));
  }

  static Future<List<Map<String, dynamic>>> getReports() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(reportsKey);
    if (raw == null || raw.isEmpty) return [];
    try {
      final list = jsonDecode(raw) as List<dynamic>;
      return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    } catch (_) {
      return [];
    }
  }

  static Future<void> setReports(List<Map<String, dynamic>> reports) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(reportsKey, jsonEncode(reports));
  }

  static Future<void> addReport(Map<String, dynamic> report) async {
    final list = await getReports();
    list.insert(0, report);
    await setReports(list);
  }

  static Future<void> deleteReport(String id) async {
    final list = await getReports();
    list.removeWhere((e) => e['id'] == id);
    await setReports(list);
  }

  static Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(loginKey) ?? false;
  }

  static Future<void> setLoggedIn(bool v) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(loginKey, v);
  }

  static Future<int> getAlertsLastSeenAt() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt(alertsSeenKey) ?? 0;
  }

  static Future<void> setAlertsLastSeenNow() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(alertsSeenKey, DateTime.now().millisecondsSinceEpoch);
  }
}
