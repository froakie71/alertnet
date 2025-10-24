import 'package:flutter/material.dart';
import 'services/local_store.dart';
import 'pages/sign_in_page.dart';
import 'pages/home_page.dart';
import 'pages/login_page.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'services/fcm_service.dart';
import 'services/fire_residents.dart';
import 'pages/waiting_approval_page.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  await FcmService.init();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>?>(
      future: LocalStore.getProfile(),
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return const MaterialApp(
            home: Scaffold(body: Center(child: CircularProgressIndicator())),
          );
        }
        final hasProfile = (snap.data != null && snap.data!.isNotEmpty);
        return FutureBuilder<bool>(
          future: LocalStore.isLoggedIn(),
          builder: (context, ls) {
            if (ls.connectionState != ConnectionState.done) {
              return const MaterialApp(
                home: Scaffold(body: Center(child: CircularProgressIndicator())),
              );
            }
            final loggedIn = ls.data == true;
            if (!hasProfile) {
              return MaterialApp(
                title: 'Residence',
                theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo)),
                home: const LoginPage(),
                routes: {
                  '/sign-in': (_) => const SignInPage(),
                  '/login': (_) => const LoginPage(),
                  '/home': (_) => const HomePage(),
                  '/waiting': (_) => const WaitingApprovalPage(),
                },
              );
            }

            // If profile exists but not logged in, check approval status first
            return FutureBuilder<Map<String, dynamic>?>(
              future: LocalStore.getProfile(),
              builder: (context, profSnap) {
                if (profSnap.connectionState != ConnectionState.done) {
                  return const MaterialApp(
                    home: Scaffold(body: Center(child: CircularProgressIndicator())),
                  );
                }
                final profile = profSnap.data ?? {};
                final id = ((profile['email'] ?? profile['phoneNumber']) as String?)?.toLowerCase();
                if (id == null || id.isEmpty) {
                  return MaterialApp(
                    title: 'Residence',
                    theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo)),
                    home: const SignInPage(),
                    routes: {
                      '/sign-in': (_) => const SignInPage(),
                      '/login': (_) => const LoginPage(),
                      '/home': (_) => const HomePage(),
                      '/waiting': (_) => const WaitingApprovalPage(),
                    },
                  );
                }
                return FutureBuilder(
                  future: FireResidents.getById(id),
                  builder: (context, docSnap) {
                    if (docSnap.connectionState != ConnectionState.done) {
                      return const MaterialApp(
                        home: Scaffold(body: Center(child: CircularProgressIndicator())),
                      );
                    }
                    final exists = docSnap.data?.exists ?? false;
                    final data = exists ? docSnap.data!.data() : null;
                    final status = exists ? (data?['status'] ?? 'pending').toString() : 'rejected';
                    final Widget start = loggedIn
                        ? const HomePage()
                        : (status == 'approved' ? const LoginPage() : WaitingApprovalPage(status: status));
                    return MaterialApp(
                      title: 'Residence',
                      theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo)),
                      home: start,
                      routes: {
                        '/sign-in': (_) => const SignInPage(),
                        '/login': (_) => const LoginPage(),
                        '/home': (_) => const HomePage(),
                        '/waiting': (_) => const WaitingApprovalPage(),
                      },
                    );
                  },
                );
              },
            );
          },
        );
      },
    );
  }
}
