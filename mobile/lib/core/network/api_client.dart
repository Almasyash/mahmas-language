import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../storage/token_storage.dart';

class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? errorMessage;
  final int? statusCode;

  ApiResponse({
    required this.success,
    this.data,
    this.errorMessage,
    this.statusCode,
  });
}

class ApiClient {
  String baseUrl;
  final TokenStorage tokenStorage;
  final http.Client _client;
  final VoidCallback? onAuthExpired;

  bool _isRefreshing = false;
  Completer<bool>? _refreshCompleter;

  ApiClient({
    required this.baseUrl,
    required this.tokenStorage,
    http.Client? client,
    this.onAuthExpired,
  }) : _client = client ?? http.Client();

  void setBaseUrl(String newBaseUrl) {
    baseUrl = newBaseUrl;
  }

  Future<Map<String, String>> _buildHeaders({bool includeAuth = true}) async {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (includeAuth) {
      final token = await tokenStorage.getAccessToken();
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }

    return headers;
  }

  Future<ApiResponse<T>> get<T>(String path) async {
    return _sendRequest<T>('GET', path);
  }

  Future<ApiResponse<T>> post<T>(String path, {dynamic body}) async {
    return _sendRequest<T>('POST', path, body: body);
  }

  Future<ApiResponse<T>> patch<T>(String path, {dynamic body}) async {
    return _sendRequest<T>('PATCH', path, body: body);
  }

  Future<ApiResponse<T>> delete<T>(String path) async {
    return _sendRequest<T>('DELETE', path);
  }

  Future<ApiResponse<T>> _sendRequest<T>(
    String method,
    String path, {
    dynamic body,
    bool retryOn401 = true,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl$path');
      final headers = await _buildHeaders();

      http.Response response;
      final encodedBody = body != null ? jsonEncode(body) : null;

      switch (method) {
        case 'GET':
          response = await _client.get(uri, headers: headers).timeout(const Duration(seconds: 15));
          break;
        case 'POST':
          response = await _client.post(uri, headers: headers, body: encodedBody).timeout(const Duration(seconds: 15));
          break;
        case 'PATCH':
          response = await _client.patch(uri, headers: headers, body: encodedBody).timeout(const Duration(seconds: 15));
          break;
        case 'DELETE':
          response = await _client.delete(uri, headers: headers).timeout(const Duration(seconds: 15));
          break;
        default:
          throw UnsupportedError('HTTP method $method is not supported');
      }

      // Check if 401 Unauthorized and retry allowed
      if (response.statusCode == 401 && retryOn401 && !path.contains('/auth/')) {
        final refreshed = await _attemptTokenRefresh();
        if (refreshed) {
          // Retry original request once with new token
          return await _sendRequest<T>(method, path, body: body, retryOn401: false);
        } else {
          onAuthExpired?.call();
          return ApiResponse<T>(
            success: false,
            errorMessage: 'Session expired. Please log in again.',
            statusCode: 401,
          );
        }
      }

      return _parseResponse<T>(response);
    } on TimeoutException {
      return ApiResponse<T>(
        success: false,
        errorMessage: 'Network timeout. Please check your connection.',
      );
    } catch (e) {
      return ApiResponse<T>(
        success: false,
        errorMessage: e.toString(),
      );
    }
  }

  Future<bool> _attemptTokenRefresh() async {
    if (_isRefreshing) {
      // If another request is currently refreshing, wait for it
      return await (_refreshCompleter?.future ?? Future.value(false));
    }

    _isRefreshing = true;
    _refreshCompleter = Completer<bool>();

    try {
      final refreshToken = await tokenStorage.getRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) {
        _isRefreshing = false;
        _refreshCompleter?.complete(false);
        return false;
      }

      final uri = Uri.parse('$baseUrl/auth/refresh');
      final response = await _client.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refreshToken': refreshToken}),
      );

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body) as Map<String, dynamic>;
        final data = json['data'] as Map<String, dynamic>?;
        if (data != null && data['accessToken'] != null && data['refreshToken'] != null) {
          await tokenStorage.saveTokens(
            accessToken: data['accessToken'] as String,
            refreshToken: data['refreshToken'] as String,
          );
          _isRefreshing = false;
          _refreshCompleter?.complete(true);
          return true;
        }
      }

      // Refresh failed
      await tokenStorage.clearTokens();
      _isRefreshing = false;
      _refreshCompleter?.complete(false);
      return false;
    } catch (e) {
      await tokenStorage.clearTokens();
      _isRefreshing = false;
      _refreshCompleter?.complete(false);
      return false;
    }
  }

  ApiResponse<T> _parseResponse<T>(http.Response response) {
    try {
      final json = jsonDecode(utf8.decode(response.bodyBytes)) as Map<String, dynamic>;
      final success = json['success'] as bool? ?? (response.statusCode >= 200 && response.statusCode < 300);
      final data = json['data'] as T?;
      final errorMap = json['error'] as Map<String, dynamic>?;
      final errorMessage = errorMap?['message'] as String? ?? (success ? null : 'Request failed');

      return ApiResponse<T>(
        success: success,
        data: data,
        errorMessage: errorMessage,
        statusCode: response.statusCode,
      );
    } catch (e) {
      final isSuccess = response.statusCode >= 200 && response.statusCode < 300;
      return ApiResponse<T>(
        success: isSuccess,
        data: null,
        errorMessage: isSuccess ? null : 'Unexpected server response (HTTP ${response.statusCode})',
        statusCode: response.statusCode,
      );
    }
  }

  void dispose() {
    _client.close();
  }
}
