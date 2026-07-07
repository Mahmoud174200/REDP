import 'package:flutter/material.dart';
import 'core/api_client.dart';
import 'features/homeowner/login_screen.dart';
import 'features/homeowner/dashboard_screen.dart';

void main() {
  runApp(const REDPHomeownerApp());
}

class REDPHomeownerApp extends StatelessWidget {
  const REDPHomeownerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'REDP Homeowner',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.light().copyWith(
        primaryColor: const Color(0xFF10B981),
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        cardColor: Colors.white,
        colorScheme: const ColorScheme.light(
          primary: Color(0xFF10B981),
          secondary: Color(0xFF3B82F6),
          surface: Colors.white,
        ),
      ),
      home: const _AuthGate(),
    );
  }
}

/// On launch, send the owner straight to their dashboard if a saved token
/// exists, otherwise to the login screen.
class _AuthGate extends StatefulWidget {
  const _AuthGate();

  @override
  State<_AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<_AuthGate> {
  bool _checking = true;
  bool _hasToken = false;

  @override
  void initState() {
    super.initState();
    ApiClient.instance.loadToken().then((token) {
      setState(() {
        _hasToken = token != null && token.isNotEmpty;
        _checking = false;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_checking) {
      return const Scaffold(
        backgroundColor: Color(0xFFF8FAFC),
        body: Center(child: CircularProgressIndicator(color: Color(0xFF10B981))),
      );
    }
    return _hasToken ? const HomeownerDashboardScreen() : const HomeownerLoginScreen();
  }
}
