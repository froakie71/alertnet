import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'fcm_background.dart';

class FcmService {
  static final _messaging = FirebaseMessaging.instance;
  static final _fln = FlutterLocalNotificationsPlugin();

  static Future<void> init() async {
    // Request permissions (Android 13+ not required for notifications, but iOS is)
    await _messaging.requestPermission();
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

    // Local notifications init for foreground display
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const init = InitializationSettings(android: android);
    await _fln.initialize(init);

    // Ensure the channel used by server-sent notifications exists on Android (O+)
    const channel = AndroidNotificationChannel(
      'alerts',
      'Alerts',
      description: 'Barangay alerts',
      importance: Importance.high,
    );
    final androidImpl = _fln.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
    await androidImpl?.createNotificationChannel(channel);

    // Foreground messages
    FirebaseMessaging.onMessage.listen((msg) async {
      final n = msg.notification;
      if (n != null) {
        const details = AndroidNotificationDetails(
          'alerts', 'Alerts', channelDescription: 'Barangay alerts',
          importance: Importance.max, priority: Priority.high,
        );
        await _fln.show(
          n.hashCode,
          n.title,
          n.body,
          const NotificationDetails(android: details),
        );
      }
    });

    // Get FCM token (you can send it to Firestore later)
    await _messaging.getToken();
  }

  static Future<String?> token() => _messaging.getToken();
}
