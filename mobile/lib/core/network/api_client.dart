import 'dart:convert';
import 'dart:io';

class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? errorMessage;

  ApiResponse({required this.success, this.data, this.errorMessage});
}

class ApiClient {
  final String baseUrl;
  String? _authToken;

  ApiClient({required this.baseUrl});

  void setAuthToken(String token) {
    _authToken = token;
  }

  Map<String, String> _buildHeaders() {
    final headers = {
      HttpHeaders.contentTypeHeader: 'application/json',
      HttpHeaders.acceptHeader: 'application/json',
    };
    if (_authToken != null) {
      headers[HttpHeaders.authorizationHeader] = 'Bearer $_authToken';
    }
    return headers;
  }

  Future<ApiResponse<Map<String, dynamic>>> get(String path) async {
    final client = HttpClient();
    try {
      final uri = Uri.parse('$baseUrl$path');
      final request = await client.getUrl(uri);
      _buildHeaders().forEach((k, v) => request.headers.set(k, v));
      final response = await request.close();
      final body = await response.transform(utf8.decoder).join();
      final json = jsonDecode(body) as Map<String, dynamic>;
      return ApiResponse(success: response.statusCode == 200, data: json);
    } catch (e) {
      return ApiResponse(success: false, errorMessage: e.toString());
    } finally {
      client.close();
    }
  }
}
