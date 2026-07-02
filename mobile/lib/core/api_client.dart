import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Shared HTTP client for the REDP Homeowner app.
///
/// Picks the right host automatically:
///  - Web / iOS simulator / Windows-macOS desktop → 127.0.0.1 (same machine)
///  - Android emulator                            → 10.0.2.2 (maps to host localhost)
/// Override for a physical device with your LAN IP:
///   flutter run --dart-define=REDP_HOST=http://192.168.1.20:8000/api/v1
class ApiClient {
  ApiClient._();
  static final ApiClient instance = ApiClient._();

  static String get baseUrl {
    const override = String.fromEnvironment('REDP_HOST', defaultValue: '');
    if (override.isNotEmpty) return override;
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:8000/api/v1';
    }
    return 'http://127.0.0.1:8000/api/v1';
  }

  static const String _tokenKey = 'redp_token';
  static const String _nameKey = 'redp_user_name';
  static const String _emailKey = 'redp_user_email';

  String? _token;
  Dio? _dio;

  Future<Dio> get dio async {
    if (_dio != null) return _dio!;
    _token ??= (await SharedPreferences.getInstance()).getString(_tokenKey);
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      headers: {'Accept': 'application/json'},
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 20),
    ));
    // Attach the bearer token (read live so it applies right after login).
    _dio!.interceptors.add(InterceptorsWrapper(onRequest: (options, handler) {
      if (_token != null && _token!.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $_token';
      }
      handler.next(options);
    }));
    return _dio!;
  }

  Future<String?> loadToken() async {
    _token = (await SharedPreferences.getInstance()).getString(_tokenKey);
    return _token;
  }

  Future<void> setToken(String? token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    if (token == null || token.isEmpty) {
      await prefs.remove(_tokenKey);
    } else {
      await prefs.setString(_tokenKey, token);
    }
  }

  /// Persist the logged-in owner's display info (shown in the side menu).
  Future<void> setUser({String? name, String? email}) async {
    final prefs = await SharedPreferences.getInstance();
    if (name == null) {
      await prefs.remove(_nameKey);
      await prefs.remove(_emailKey);
    } else {
      await prefs.setString(_nameKey, name);
      await prefs.setString(_emailKey, email ?? '');
    }
  }

  Future<(String, String)> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    return (prefs.getString(_nameKey) ?? 'Homeowner', prefs.getString(_emailKey) ?? '');
  }
}
