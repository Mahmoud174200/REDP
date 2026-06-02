import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/acquisition_models.dart';

/// ─────────────────────────────────────────────────────────
/// REDP — Acquisition & Sales Engine (Sales & Acquisition Engine)
/// Remote Data Source: Dio HTTP Client
/// Clean Architecture — Data Layer
/// ─────────────────────────────────────────────────────────

class AcquisitionRemoteDataSource {
  late final Dio _dio;

  AcquisitionRemoteDataSource() {
    _dio = Dio(BaseOptions(
      baseUrl: 'http://10.0.2.2:8000/api/v1', // Android emulator → localhost
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    // Token interceptor
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('redp_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) {
        if (error.response?.statusCode == 401) {
          // Token expired — handle re-authentication
        }
        handler.next(error);
      },
    ));
  }

  /// Get assigned leads for the current sales agent.
  Future<List<LeadModel>> getAssignedLeads() async {
    final response = await _dio.get('/acquisition/leads');
    final data = response.data['data']['data'] as List? ??
                 response.data['data'] as List? ?? [];
    return data.map((json) => LeadModel.fromJson(json)).toList();
  }

  /// Get a single lead by ID.
  Future<LeadModel> getLeadById(String id) async {
    final response = await _dio.get('/acquisition/leads/$id');
    return LeadModel.fromJson(response.data['data']);
  }

  /// Log an interaction (call, meeting, etc.) for a lead.
  Future<void> logInteraction({
    required String leadId,
    required String type,
    String? notes,
    DateTime? followUpDate,
  }) async {
    await _dio.post('/acquisition/crm/interactions', data: {
      'lead_id': leadId,
      'type': type,
      'notes': notes,
      'follow_up_date': followUpDate?.toIso8601String(),
    });
  }

  /// Get broker profile data.
  Future<BrokerModel> getBrokerProfile(String brokerId) async {
    final response = await _dio.get('/acquisition/brokers/$brokerId/referral-links');
    return BrokerModel.fromJson(response.data);
  }

  /// Get broker commissions list.
  Future<List<CommissionModel>> getBrokerCommissions(String brokerId) async {
    final response = await _dio.get('/acquisition/brokers/$brokerId/commissions');
    final data = response.data['commissions']['data'] as List? ??
                 response.data['commissions'] as List? ?? [];
    return data.map((json) => CommissionModel.fromJson(json)).toList();
  }

  /// Get broker referral link.
  Future<String> getReferralLink(String brokerId) async {
    final response = await _dio.get('/acquisition/brokers/$brokerId/referral-links');
    return response.data['referral_url'] ?? '';
  }
}
