import 'package:flutter/material.dart';
import '../../core/api_client.dart';
import '../../core/branding.dart';
import 'homeowner_repository.dart';
import 'dashboard_screen.dart';

/// Mountain View branded homeowner login — full-bleed compound photo,
/// brand logo, and a frosted glass sign-in card.
class HomeownerLoginScreen extends StatefulWidget {
  const HomeownerLoginScreen({super.key});

  @override
  State<HomeownerLoginScreen> createState() => _HomeownerLoginScreenState();
}

class _HomeownerLoginScreenState extends State<HomeownerLoginScreen> {
  final _repo = HomeownerRepository();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _loading = false;
  bool _obscure = true;
  String? _error;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    final email = _emailCtrl.text.trim();
    final pass = _passCtrl.text;
    if (email.isEmpty || pass.isEmpty) {
      setState(() => _error = 'Please enter your email and password.');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      final data = await _repo.login(email, pass);
      if (data['success'] == true && data['token'] != null) {
        final role = (data['user']?['role'] ?? '').toString();
        if (role != 'client') {
          setState(() { _loading = false; _error = 'This app is for homeowners only.'; });
          return;
        }
        await ApiClient.instance.setToken(data['token'].toString());
        await ApiClient.instance.setUser(
          name: (data['user']?['name'] ?? 'Homeowner').toString(),
          email: (data['user']?['email'] ?? '').toString(),
        );
        if (!mounted) return;
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const HomeownerDashboardScreen()),
        );
      } else {
        setState(() { _loading = false; _error = data['message']?.toString() ?? 'Login failed.'; });
      }
    } catch (e) {
      setState(() { _loading = false; _error = HomeownerRepository.errorMessage(e); });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.royalDark,
      body: Stack(fit: StackFit.expand, children: [
        // Full-bleed compound hero photo
        Image.network(Branding.heroImage, fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => const SizedBox()),
        // Brand gradient overlay (royal → gold, matching web hero)
        Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft, end: Alignment.bottomRight,
              colors: [
                AppColors.royalDark.withValues(alpha: 0.92),
                AppColors.royal.withValues(alpha: 0.72),
                AppColors.royalDark.withValues(alpha: 0.94),
              ],
            ),
          ),
        ),
        SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 34),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 430),
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  const MountainViewLogo(size: 40, onDark: true),
                  const SizedBox(height: 34),
                  _glassCard(),
                  const SizedBox(height: 22),
                  Text('© 2026 Mountain View Developments · REDP',
                      style: TextStyle(color: Colors.white.withValues(alpha: 0.6), fontSize: 10.5)),
                ]),
              ),
            ),
          ),
        ),
      ]),
    );
  }

  Widget _glassCard() {
    return Container(
      padding: const EdgeInsets.all(26),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.97),
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: Colors.white.withValues(alpha: 0.6), width: 1.5),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.35), blurRadius: 40, offset: const Offset(0, 20)),
          BoxShadow(color: AppColors.gold.withValues(alpha: 0.12), blurRadius: 60, spreadRadius: 2),
        ],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, mainAxisSize: MainAxisSize.min, children: [
        Center(
          child: Container(
            width: 66, height: 66,
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [AppColors.green, AppColors.greenDark]),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [BoxShadow(color: AppColors.green.withValues(alpha: 0.4), blurRadius: 20, offset: const Offset(0, 8))],
            ),
            child: const Icon(Icons.home_rounded, color: Colors.white, size: 34),
          ),
        ),
        const SizedBox(height: 18),
        const Text('Homeowner Portal',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 23, fontWeight: FontWeight.w800, color: AppColors.textMain, letterSpacing: 0.3)),
        const SizedBox(height: 5),
        const Text('بوابة الملاك — Welcome home',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12.5, color: AppColors.textMuted)),
        const SizedBox(height: 10),
        Center(
          child: Container(
            width: 54, height: 3,
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [AppColors.royal, AppColors.gold]),
              borderRadius: BorderRadius.circular(3),
            ),
          ),
        ),
        const SizedBox(height: 24),

        if (_error != null)
          Container(
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0x14EF4444),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0x33EF4444)),
            ),
            child: Row(children: [
              const Icon(Icons.error_outline, color: Color(0xFFDC2626), size: 18),
              const SizedBox(width: 8),
              Expanded(child: Text(_error!, style: const TextStyle(color: Color(0xFFDC2626), fontSize: 13))),
            ]),
          ),

        _field(_emailCtrl, 'Email Address', Icons.mail_outline, keyboard: TextInputType.emailAddress),
        const SizedBox(height: 14),
        _field(_passCtrl, 'Password', Icons.lock_outline,
            obscure: _obscure,
            suffix: IconButton(
              icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility, color: AppColors.textMuted, size: 20),
              onPressed: () => setState(() => _obscure = !_obscure),
            )),
        const SizedBox(height: 24),

        SizedBox(
          height: 52,
          child: ElevatedButton(
            onPressed: _loading ? null : _login,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.royal,
              foregroundColor: Colors.white,
              elevation: 8,
              shadowColor: AppColors.royal.withValues(alpha: 0.45),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: _loading
                ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                : const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Text('Sign In', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                    SizedBox(width: 8),
                    Icon(Icons.arrow_forward_rounded, size: 18),
                  ]),
          ),
        ),
      ]),
    );
  }

  Widget _field(TextEditingController ctrl, String hint, IconData icon,
      {bool obscure = false, TextInputType? keyboard, Widget? suffix}) {
    return TextField(
      controller: ctrl,
      obscureText: obscure,
      keyboardType: keyboard,
      style: const TextStyle(color: AppColors.textMain, fontWeight: FontWeight.w600),
      onSubmitted: (_) => _login(),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: AppColors.textFaint),
        prefixIcon: Icon(icon, color: AppColors.textMuted, size: 20),
        suffixIcon: suffix,
        filled: true,
        fillColor: const Color(0xFFF1F5F9),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
        enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppColors.borderSoft)),
        focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppColors.royal, width: 1.6)),
      ),
    );
  }
}
