import 'package:flutter_test/flutter_test.dart';
import 'package:mahmas_language/core/auth/auth_notifier.dart';
import 'package:mahmas_language/core/auth/auth_state.dart';
import 'package:mahmas_language/core/models/user_model.dart';
import 'package:mahmas_language/core/network/api_client.dart';
import 'package:mahmas_language/core/storage/token_storage.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'dart:convert';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('TokenStorage & Auth State Tests', () {
    test('AuthState factory constructors return expected status flags', () {
      final init = AuthState.initializing();
      expect(init.isInitializing, true);
      expect(init.isAuthenticated, false);

      final unauth = AuthState.unauthenticated();
      expect(unauth.isUnauthenticated, true);

      final auth = AuthState.authenticated();
      expect(auth.isAuthenticated, true);

      final onboarding = AuthState.onboardingRequired();
      expect(onboarding.isOnboardingRequired, true);

      final err = AuthState.error('Network failure');
      expect(err.hasError, true);
      expect(err.errorMessage, 'Network failure');
    });

    test('UserModel parses from backend JSON and handles copyWith', () {
      final json = {
        'id': 'usr-123',
        'email': 'learner@example.com',
        'displayName': 'Test Learner',
        'onboardingCompleted': false,
        'learningGoal': 'TRAVEL',
        'dailyMinutesGoal': 20,
        'currentLevel': 'B1',
        'timezone': 'Asia/Kolkata',
        'nativeLanguage': {
          'id': 'lang-hi',
          'code': 'hi',
          'name': 'Hindi',
          'flagEmoji': '🇮🇳',
        },
        'targetLanguage': {
          'id': 'lang-en',
          'code': 'en',
          'name': 'English',
          'flagEmoji': '🇬🇧',
        },
      };

      final user = UserModel.fromJson(json);
      expect(user.id, 'usr-123');
      expect(user.email, 'learner@example.com');
      expect(user.displayName, 'Test Learner');
      expect(user.onboardingCompleted, false);
      expect(user.nativeLanguage?.code, 'hi');
      expect(user.targetLanguage?.code, 'en');

      final updated = user.copyWith(onboardingCompleted: true, displayName: 'Master Learner');
      expect(updated.onboardingCompleted, true);
      expect(updated.displayName, 'Master Learner');
      expect(updated.email, 'learner@example.com');
    });

    test('ApiClient attaches Bearer token when available', () async {
      final tokenStorage = TokenStorage(
        inMemory: true,
        initialData: {'mahmas_access_token': 'mock-access-token-xyz'},
      );

      final mockClient = MockClient((request) async {
        expect(request.headers['Authorization'], 'Bearer mock-access-token-xyz');
        expect(request.headers['Content-Type'], 'application/json');
        return http.Response(
          jsonEncode({
            'success': true,
            'data': {'status': 'OK'},
          }),
          200,
        );
      });

      final apiClient = ApiClient(
        baseUrl: 'http://localhost:4000/api/v1',
        tokenStorage: tokenStorage,
        client: mockClient,
      );

      final res = await apiClient.get<Map<String, dynamic>>('/test');
      expect(res.success, true);
      expect(res.data?['status'], 'OK');
    });

    test('ApiClient automatically attempts token refresh on 401 response', () async {
      final tokenStorage = TokenStorage(
        inMemory: true,
        initialData: {
          'mahmas_access_token': 'expired-access-token',
          'mahmas_refresh_token': 'valid-refresh-token',
        },
      );

      int attempts = 0;
      final mockClient = MockClient((request) async {
        if (request.url.path.contains('/auth/refresh')) {
          return http.Response(
            jsonEncode({
              'success': true,
              'data': {
                'accessToken': 'new-access-token-456',
                'refreshToken': 'new-refresh-token-789',
              },
            }),
            200,
          );
        }

        if (request.url.path.contains('/protected')) {
          attempts++;
          if (attempts == 1) {
            // First call fails with 401
            return http.Response(jsonEncode({'success': false, 'message': 'Token expired'}), 401);
          } else {
            // Second call succeeds with new token
            expect(request.headers['Authorization'], 'Bearer new-access-token-456');
            return http.Response(jsonEncode({'success': true, 'data': {'secret': 'data'}}), 200);
          }
        }

        return http.Response('Not Found', 404);
      });

      final apiClient = ApiClient(
        baseUrl: 'http://localhost:4000/api/v1',
        tokenStorage: tokenStorage,
        client: mockClient,
      );

      final res = await apiClient.get<Map<String, dynamic>>('/protected');
      expect(res.success, true);
      expect(res.data?['secret'], 'data');

      // Verify new tokens saved
      expect(await tokenStorage.getAccessToken(), 'new-access-token-456');
      expect(await tokenStorage.getRefreshToken(), 'new-refresh-token-789');
    });

    test('AuthNotifier logout clears tokens and transitions to unauthenticated', () async {
      final tokenStorage = TokenStorage(
        inMemory: true,
        initialData: {
          'mahmas_access_token': 'active-token',
          'mahmas_refresh_token': 'active-refresh',
        },
      );

      final mockClient = MockClient((request) async {
        return http.Response(jsonEncode({'success': true}), 200);
      });

      final apiClient = ApiClient(
        baseUrl: 'http://localhost:4000/api/v1',
        tokenStorage: tokenStorage,
        client: mockClient,
      );

      final authNotifier = AuthNotifier(
        apiClient: apiClient,
        tokenStorage: tokenStorage,
      );

      await authNotifier.logout();
      expect(authNotifier.state.isUnauthenticated, true);
      expect(authNotifier.currentUser, null);
      expect(await tokenStorage.getAccessToken(), null);
    });
  });
}
