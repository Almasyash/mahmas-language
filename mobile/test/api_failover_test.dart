import 'dart:async';
import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mahmas_language/core/config/app_config.dart';
import 'package:mahmas_language/core/network/api_client.dart';
import 'package:mahmas_language/core/storage/token_storage.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Phase 2 — API Failover & Endpoint Resilience Tests', () {
    late TokenStorage tokenStorage;

    setUp(() {
      tokenStorage = TokenStorage(inMemory: true);
    });

    test('1. Primary endpoint succeeds without triggering fallback', () async {
      int primaryCalls = 0;
      int fallbackCalls = 0;

      final mockClient = MockClient((request) async {
        if (request.url.toString().startsWith(AppConfig.defaultApiBaseUrl)) {
          primaryCalls++;
          return http.Response(
            jsonEncode({'success': true, 'data': {'status': 'UP'}}),
            200,
          );
        } else {
          fallbackCalls++;
          return http.Response(jsonEncode({'success': false}), 500);
        }
      });

      final client = ApiClient(
        baseUrl: AppConfig.defaultApiBaseUrl,
        tokenStorage: tokenStorage,
        client: mockClient,
      );

      final res = await client.get<Map<String, dynamic>>('/health');
      expect(res.success, true);
      expect(res.data?['status'], 'UP');
      expect(primaryCalls, 1);
      expect(fallbackCalls, 0);
      expect(client.baseUrl, AppConfig.defaultApiBaseUrl);
    });

    test('2. Primary connection fails (HTTP 500/403/network) and fallback succeeds', () async {
      int primaryCalls = 0;
      int fallbackCalls = 0;

      final mockClient = MockClient((request) async {
        if (request.url.toString().startsWith(AppConfig.defaultApiBaseUrl)) {
          primaryCalls++;
          // Simulate Cloudflare Error 1000 / 403 Forbidden on primary
          return http.Response('DNS points to prohibited IP', 403);
        } else if (request.url.toString().startsWith(AppConfig.fallbackApiBaseUrl)) {
          fallbackCalls++;
          return http.Response(
            jsonEncode({'success': true, 'data': {'status': 'UP', 'server': 'render'}}),
            200,
          );
        }
        return http.Response('Not Found', 404);
      });

      final client = ApiClient(
        baseUrl: AppConfig.defaultApiBaseUrl,
        tokenStorage: tokenStorage,
        client: mockClient,
      );

      final res = await client.get<Map<String, dynamic>>('/health');
      expect(res.success, true);
      expect(res.data?['server'], 'render');
      expect(primaryCalls, 1);
      expect(fallbackCalls, 1);
      expect(client.baseUrl, AppConfig.fallbackApiBaseUrl);
    });

    test('3. Primary times out and fallback succeeds', () async {
      int primaryCalls = 0;
      int fallbackCalls = 0;

      final mockClient = MockClient((request) async {
        if (request.url.toString().startsWith(AppConfig.defaultApiBaseUrl)) {
          primaryCalls++;
          throw TimeoutException('Connection timed out after 15s');
        } else if (request.url.toString().startsWith(AppConfig.fallbackApiBaseUrl)) {
          fallbackCalls++;
          return http.Response(
            jsonEncode({'success': true, 'data': {'recovered': true}}),
            200,
          );
        }
        return http.Response('Not Found', 404);
      });

      final client = ApiClient(
        baseUrl: AppConfig.defaultApiBaseUrl,
        tokenStorage: tokenStorage,
        client: mockClient,
      );

      final res = await client.get<Map<String, dynamic>>('/languages');
      expect(res.success, true);
      expect(res.data?['recovered'], true);
      expect(primaryCalls, 1);
      expect(fallbackCalls, 1);
      expect(client.baseUrl, AppConfig.fallbackApiBaseUrl);
    });

    test('4. Both endpoints fail gracefully without unhandled exception', () async {
      int totalCalls = 0;

      final mockClient = MockClient((request) async {
        totalCalls++;
        return http.Response('Service Unavailable', 503);
      });

      final client = ApiClient(
        baseUrl: AppConfig.defaultApiBaseUrl,
        tokenStorage: tokenStorage,
        client: mockClient,
      );

      final res = await client.get<Map<String, dynamic>>('/health');
      expect(res.success, false);
      expect(res.statusCode, 503);
      expect(res.errorMessage, contains('503'));
      // Bounded retries: 1 primary + 1 fallback = 2 calls
      expect(totalCalls, 2);
    });

    test('5. Primary returns a validation error (400) and does NOT failover to fallback', () async {
      int primaryCalls = 0;
      int fallbackCalls = 0;

      final mockClient = MockClient((request) async {
        if (request.url.toString().startsWith(AppConfig.defaultApiBaseUrl)) {
          primaryCalls++;
          return http.Response(
            jsonEncode({
              'success': false,
              'error': {'message': 'Invalid email address format'},
            }),
            400,
          );
        } else {
          fallbackCalls++;
          return http.Response('Fallback should not be called on validation error', 500);
        }
      });

      final client = ApiClient(
        baseUrl: AppConfig.defaultApiBaseUrl,
        tokenStorage: tokenStorage,
        client: mockClient,
      );

      final res = await client.post<Map<String, dynamic>>(
        '/auth/register',
        body: {'email': 'invalid-email'},
      );

      expect(res.success, false);
      expect(res.statusCode, 400);
      expect(res.errorMessage, 'Invalid email address format');
      expect(primaryCalls, 1);
      expect(fallbackCalls, 0); // Must NOT switch to fallback on 400!
      expect(client.baseUrl, AppConfig.defaultApiBaseUrl);
    });

    test('6. Primary returns an authentication error (401) with refresh token handling', () async {
      await tokenStorage.saveTokens(
        accessToken: 'expired-access-token',
        refreshToken: 'valid-refresh-token',
      );

      int protectedCalls = 0;
      int refreshCalls = 0;

      final mockClient = MockClient((request) async {
        if (request.url.path.contains('/auth/refresh')) {
          refreshCalls++;
          return http.Response(
            jsonEncode({
              'success': true,
              'data': {
                'accessToken': 'fresh-token-new',
                'refreshToken': 'fresh-refresh-new',
              },
            }),
            200,
          );
        }

        if (request.url.path.contains('/users/me')) {
          protectedCalls++;
          if (protectedCalls == 1) {
            return http.Response(
              jsonEncode({'success': false, 'error': {'message': 'Unauthorized'}}),
              401,
            );
          } else {
            // Second call with refreshed token
            expect(request.headers['Authorization'], 'Bearer fresh-token-new');
            return http.Response(
              jsonEncode({'success': true, 'data': {'displayName': 'Verified User'}}),
              200,
            );
          }
        }

        return http.Response('Not Found', 404);
      });

      final client = ApiClient(
        baseUrl: AppConfig.defaultApiBaseUrl,
        tokenStorage: tokenStorage,
        client: mockClient,
      );

      final res = await client.get<Map<String, dynamic>>('/users/me');
      expect(res.success, true);
      expect(res.data?['displayName'], 'Verified User');
      expect(protectedCalls, 2);
      expect(refreshCalls, 1);
    });

    test('7. Fallback returns an unexpected response (non-JSON HTML error page)', () async {
      final mockClient = MockClient((request) async {
        if (request.url.toString().startsWith(AppConfig.defaultApiBaseUrl)) {
          return http.Response('Gateway Timeout', 504);
        } else {
          // Fallback server returns raw HTML 502 bad gateway
          return http.Response('<html><body>502 Bad Gateway</body></html>', 502);
        }
      });

      final client = ApiClient(
        baseUrl: AppConfig.defaultApiBaseUrl,
        tokenStorage: tokenStorage,
        client: mockClient,
      );

      final res = await client.get<Map<String, dynamic>>('/health');
      expect(res.success, false);
      expect(res.statusCode, 502);
      expect(res.errorMessage, contains('HTTP 502'));
    });

    test('8. Both endpoints return compatible language catalogue responses', () async {
      final mockCatalogue = [
        {'id': 'lang-en', 'code': 'en', 'name': 'English', 'flagEmoji': '🇬🇧'},
        {'id': 'lang-es', 'code': 'es', 'name': 'Spanish', 'flagEmoji': '🇪🇸'},
        {'id': 'lang-fr', 'code': 'fr', 'name': 'French', 'flagEmoji': '🇫🇷'},
      ];

      final mockClient = MockClient((request) async {
        return http.Response.bytes(
          utf8.encode(jsonEncode({'success': true, 'data': mockCatalogue})),
          200,
          headers: {'content-type': 'application/json; charset=utf-8'},
        );
      });

      // Test against primary contract
      final clientPrimary = ApiClient(
        baseUrl: AppConfig.defaultApiBaseUrl,
        tokenStorage: tokenStorage,
        client: mockClient,
      );
      final resPrimary = await clientPrimary.get<List<dynamic>>('/languages');
      expect(resPrimary.success, true);
      expect(resPrimary.data?.length, 3);
      expect(resPrimary.data?[0]['code'], 'en');

      // Test against fallback contract
      final clientFallback = ApiClient(
        baseUrl: AppConfig.fallbackApiBaseUrl,
        tokenStorage: tokenStorage,
        client: mockClient,
      );
      final resFallback = await clientFallback.get<List<dynamic>>('/languages');
      expect(resFallback.success, true);
      expect(resFallback.data?.length, 3);
      expect(resFallback.data?[1]['code'], 'es');
    });

    test('9. Authenticated requests use the expected credentials on failover', () async {
      await tokenStorage.saveTokens(
        accessToken: 'authenticated-session-jwt-token',
        refreshToken: 'refresh-jwt-token',
      );

      String? capturedAuthHeaderPrimary;
      String? capturedAuthHeaderFallback;

      final mockClient = MockClient((request) async {
        if (request.url.toString().startsWith(AppConfig.defaultApiBaseUrl)) {
          capturedAuthHeaderPrimary = request.headers['Authorization'];
          return http.Response('Server Error', 500);
        } else {
          capturedAuthHeaderFallback = request.headers['Authorization'];
          return http.Response(
            jsonEncode({'success': true, 'data': {'authenticated': true}}),
            200,
          );
        }
      });

      final client = ApiClient(
        baseUrl: AppConfig.defaultApiBaseUrl,
        tokenStorage: tokenStorage,
        client: mockClient,
      );

      final res = await client.get<Map<String, dynamic>>('/users/me');
      expect(res.success, true);
      expect(capturedAuthHeaderPrimary, 'Bearer authenticated-session-jwt-token');
      expect(capturedAuthHeaderFallback, 'Bearer authenticated-session-jwt-token');
    });

    test('10. Retries remain strictly bounded to 1 fallback attempt', () async {
      int executionCount = 0;

      final mockClient = MockClient((request) async {
        executionCount++;
        throw http.ClientException('Network unreachable');
      });

      final client = ApiClient(
        baseUrl: AppConfig.defaultApiBaseUrl,
        tokenStorage: tokenStorage,
        client: mockClient,
      );

      final res = await client.get<Map<String, dynamic>>('/courses/default/path');
      expect(res.success, false);
      // Strictly bounded: exactly 1 try on primary, exactly 1 try on fallback = 2 total
      expect(executionCount, 2);
    });

    test('11. Token refresh does not loop infinitely on repeated 401', () async {
      await tokenStorage.saveTokens(
        accessToken: 'bad-token',
        refreshToken: 'revoked-refresh-token',
      );

      int authCalls = 0;
      bool onAuthExpiredTriggered = false;

      final mockClient = MockClient((request) async {
        if (request.url.path.contains('/auth/refresh')) {
          return http.Response(
            jsonEncode({'success': false, 'error': {'message': 'Refresh token revoked'}}),
            401,
          );
        }
        authCalls++;
        return http.Response(
          jsonEncode({'success': false, 'error': {'message': 'Unauthorized'}}),
          401,
        );
      });

      final client = ApiClient(
        baseUrl: AppConfig.defaultApiBaseUrl,
        tokenStorage: tokenStorage,
        client: mockClient,
        onAuthExpired: () => onAuthExpiredTriggered = true,
      );

      final res = await client.get<Map<String, dynamic>>('/dashboard');
      expect(res.success, false);
      expect(res.statusCode, 401);
      expect(res.errorMessage, 'Session expired. Please log in again.');
      expect(onAuthExpiredTriggered, true);
      expect(authCalls, 1); // Never loops!
    });

    test('12. User-facing errors are correct and clean when no server is reachable', () async {
      final mockClient = MockClient((request) async {
        throw TimeoutException('Socket connection timeout');
      });

      final client = ApiClient(
        baseUrl: AppConfig.defaultApiBaseUrl,
        tokenStorage: tokenStorage,
        client: mockClient,
      );

      final res = await client.get<Map<String, dynamic>>('/health');
      expect(res.success, false);
      expect(res.errorMessage, 'Network timeout. Please check your connection.');
    });
  });
}
