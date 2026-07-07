import 'package:dio/dio.dart';
import '../../core/api_client.dart';
import 'form_sheet.dart';

/// Talks to the Laravel homeowner endpoints.
class HomeownerRepository {
  /// POST /auth/login → { success, token, user }
  Future<Map<String, dynamic>> login(String email, String password) async {
    final dio = await ApiClient.instance.dio;
    final res = await dio.post('/auth/login', data: {
      'email': email.trim(),
      'password': password,
    });
    return Map<String, dynamic>.from(res.data as Map);
  }

  /// GET /delivery/homeowner/dashboard[?contract_id=] → full portal payload.
  Future<Map<String, dynamic>> dashboard({String? contractId}) async {
    final dio = await ApiClient.instance.dio;
    final res = await dio.get(
      '/delivery/homeowner/dashboard',
      queryParameters: contractId != null ? {'contract_id': contractId} : null,
    );
    return Map<String, dynamic>.from(res.data as Map);
  }

  /// Generic authenticated POST returning the JSON body.
  Future<Map<String, dynamic>> post(String path, Map<String, dynamic> body) async {
    final dio = await ApiClient.instance.dio;
    final res = await dio.post(path, data: body);
    return Map<String, dynamic>.from(res.data as Map);
  }

  /// Family member add — sends multipart when a [PickedFile] photo is attached,
  /// otherwise a plain POST. The photo appears on the member's ID card.
  Future<void> addFamily(Map<String, dynamic> b) async {
    final dio = await ApiClient.instance.dio;
    final photo = b.remove('photo');
    if (photo is PickedFile) {
      // Explicit content-type is required on web — otherwise dio sends
      // application/octet-stream and Laravel's `image` rule rejects it.
      final ext = photo.name.contains('.') ? photo.name.split('.').last.toLowerCase() : 'jpeg';
      final sub = (ext == 'jpg') ? 'jpeg' : ext;
      final form = FormData.fromMap({
        ...b,
        'photo': MultipartFile.fromBytes(
          photo.bytes,
          filename: photo.name,
          contentType: DioMediaType('image', sub),
        ),
      });
      await dio.post('/delivery/homeowner/family', data: form);
    } else {
      await dio.post('/delivery/homeowner/family', data: b);
    }
  }
  Future<void> addVehicle(Map<String, dynamic> b) => post('/delivery/homeowner/vehicles', b);
  Future<void> addService(Map<String, dynamic> b) => post('/delivery/homeowner/service-requests', b);
  Future<void> requestResale(Map<String, dynamic> b) => post('/delivery/homeowner/resale', b);
  Future<Map<String, dynamic>> requestGatePass(Map<String, dynamic> b) => post('/delivery/gate-code', b);

  /// Extracts a friendly message from a Dio error.
  static String errorMessage(Object e) {
    if (e is DioException) {
      final data = e.response?.data;
      if (data is Map && data['message'] != null) return data['message'].toString();
      if (e.type == DioExceptionType.connectionError ||
          e.type == DioExceptionType.connectionTimeout) {
        return 'Cannot reach the server. Check your connection.';
      }
    }
    return 'Something went wrong. Please try again.';
  }
}
