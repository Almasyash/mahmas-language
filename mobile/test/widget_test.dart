import 'package:flutter_test/flutter_test.dart';
import 'package:mahmas_language/core/auth/auth_notifier.dart';
import 'package:mahmas_language/core/network/api_client.dart';
import 'package:mahmas_language/core/storage/token_storage.dart';
import 'package:mahmas_language/main.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'dart:convert';

void main() {
  testWidgets('App smoke test renders home dashboard and branding when authenticated', (tester) async {

    final mockClient = MockClient((request) async {
      if (request.url.path.contains('/auth/me')) {
        return http.Response(
          jsonEncode({
            'success': true,
            'data': {
              'id': 'usr-test-1',
              'email': 'tester@example.com',
              'displayName': 'Test Learner',
              'onboardingCompleted': true,
              'targetLanguage': {
                'id': 'lang-es',
                'code': 'es',
                'name': 'Spanish',
                'flagEmoji': '🇪🇸',
              },
            },
          }),
          200,
        );
      }
      return http.Response('Not Found', 404);
    });

    final tokenStorage = TokenStorage(
      inMemory: true,
      initialData: {'mahmas_access_token': 'dummy-token'},
    );
    final apiClient = ApiClient(
      baseUrl: 'http://localhost:4000/api/v1',
      tokenStorage: tokenStorage,
      client: mockClient,
    );

    final authNotifier = AuthNotifier(
      apiClient: apiClient,
      tokenStorage: tokenStorage,
    );

    await authNotifier.initialize();

    await tester.pumpWidget(MahmasLanguageApp(authNotifier: authNotifier));
    await tester.pumpAndSettle();

    // Verify brand, navigation, and dashboard
    expect(find.text('Learn Path'), findsOneWidget);
    expect(find.text('Learn'), findsOneWidget);
    expect(find.text('Practice'), findsOneWidget);
    expect(find.text('AI Tutor'), findsOneWidget);
    expect(find.text('Exchange'), findsOneWidget);
    expect(find.text('Profile'), findsOneWidget);
  });
}
