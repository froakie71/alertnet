import 'package:flutter/material.dart';
import '../services/local_store.dart';
import '../services/fire_residents.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});
  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    final ok = _formKey.currentState?.validate() ?? false;
    if (!ok) return;
    final profile = await LocalStore.getProfile();
    if (profile == null) {
      setState(() { _error = 'No profile found. Please create one first.'; });
      return;
    }
    // Check approval status from Firestore
    final id = ((profile['email'] ?? profile['phoneNumber']) as String).toLowerCase();
    try {
      final snap = await FireResidents.getById(id);
      final status = (snap.data()?['status'] ?? 'pending').toString();
      if (status != 'approved') {
        setState(() {
          _error = status == 'rejected'
              ? 'Your application was rejected. Please edit your profile or contact the barangay.'
              : 'Waiting for approval by the barangay. Please try again later.';
        });
        return;
      }
    } catch (e) {
      setState(() { _error = 'Unable to verify approval. Check internet and try again.'; });
      return;
    }
    final lastName = (profile['lastName'] ?? '').toString().trim();
    if (_password.text.trim() != lastName || _email.text.trim().isEmpty) {
      setState(() { _error = 'Invalid email or password.'; });
      return;
    }
    await LocalStore.setLoggedIn(true);
    if (!mounted) return;
    Navigator.of(context).pushReplacementNamed('/home');
  }

  Future<void> _gotoCreate() async {
    await LocalStore.setLoggedIn(false);
    if (!mounted) return;
    Navigator.of(context).pushReplacementNamed('/sign-in');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Login')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            TextFormField(
              controller: _email,
              decoration: const InputDecoration(labelText: 'Email', border: OutlineInputBorder()),
              keyboardType: TextInputType.emailAddress,
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _password,
              decoration: const InputDecoration(labelText: 'Password (resident last name)', border: OutlineInputBorder()),
              obscureText: true,
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(_error!, style: const TextStyle(color: Colors.red)),
            ],
            const SizedBox(height: 16),
            SizedBox(width: double.infinity, child: ElevatedButton(onPressed: _login, child: const Text('Login'))),
            const SizedBox(height: 8),
            TextButton(onPressed: _gotoCreate, child: const Text('Create/Update Profile')),
          ]),
        ),
      ),
    );
  }
}
