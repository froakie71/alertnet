import 'package:flutter/material.dart';

class WaitingApprovalPage extends StatelessWidget {
  final String status; // pending or rejected
  const WaitingApprovalPage({super.key, this.status = 'pending'});

  @override
  Widget build(BuildContext context) {
    final isRejected = status == 'rejected';
    return Scaffold(
      appBar: AppBar(title: const Text('Account Review')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Icon(isRejected ? Icons.cancel : Icons.hourglass_empty, size: 64, color: isRejected ? Colors.red : Colors.amber),
              const SizedBox(height: 16),
              Text(
                isRejected ? 'Your application was declined.' : 'Your application is awaiting approval.',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                isRejected
                    ? 'Please update your details and resubmit, or contact the barangay office.'
                    : 'You will receive a notification once approved. Please check back later.',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              FilledButton(
                onPressed: () => Navigator.of(context).pushReplacementNamed('/sign-in'),
                child: Text(isRejected ? 'Edit Profile' : 'Update Details'),
              ),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () => Navigator.of(context).pushReplacementNamed('/login'),
                child: const Text('Refresh Status'),
              )
            ],
          ),
        ),
      ),
    );
  }
}
