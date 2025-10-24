import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import '../firebase_options.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Ensure Firebase is initialized for background isolates
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  // No-op: notification messages are displayed by Android automatically
  // You can add custom handling for data-only messages here if needed.
}
