import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mahmas_language/core/auth/auth_notifier.dart';
import 'package:mahmas_language/core/auth/auth_scope.dart';
import 'package:mahmas_language/core/network/api_client.dart';
import 'package:mahmas_language/core/storage/token_storage.dart';
import 'package:mahmas_language/features/auth/login_screen.dart';
import 'package:mahmas_language/features/auth/signup_screen.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'dart:convert';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late AuthNotifier authNotifier;

  setUp(() {
    final tokenStorage = TokenStorage(inMemory: true);
    final mockClient = MockClient((request) async {
      return http.Response(jsonEncode({'success': true}), 200);
    });
    final apiClient = ApiClient(
      baseUrl: 'http://localhost:4000/api/v1',
      tokenStorage: tokenStorage,
      client: mockClient,
    );
    authNotifier = AuthNotifier(
      apiClient: apiClient,
      tokenStorage: tokenStorage,
    );
  });

  group('LoginScreen Widget Tests', () {
    testWidgets('renders login screen components correctly', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: AuthScope(
            notifier: authNotifier,
            child: const LoginScreen(),
          ),
        ),
      );

      expect(find.widgetWithText(ElevatedButton, 'Sign In'), findsOneWidget);
      expect(find.byType(TextFormField), findsNWidgets(2));
      expect(find.text('Forgot Password?'), findsOneWidget);
      expect(find.text('Create Account'), findsOneWidget);
    });

    testWidgets('validates empty email and password inputs', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: AuthScope(
            notifier: authNotifier,
            child: const LoginScreen(),
          ),
        ),
      );

      // Tap Sign In without filling inputs
      await tester.tap(find.widgetWithText(ElevatedButton, 'Sign In'));
      await tester.pump();

      expect(find.text('Please enter your email'), findsOneWidget);
      expect(find.text('Please enter your password'), findsOneWidget);
    });

    testWidgets('validates invalid email format', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: AuthScope(
            notifier: authNotifier,
            child: const LoginScreen(),
          ),
        ),
      );

      await tester.enterText(find.byType(TextFormField).first, 'invalidemail');
      await tester.enterText(find.byType(TextFormField).last, 'Password123!');
      await tester.tap(find.widgetWithText(ElevatedButton, 'Sign In'));
      await tester.pump();

      expect(find.text('Please enter a valid email address'), findsOneWidget);
    });
  });

  group('SignupScreen Widget Tests', () {
    testWidgets('renders signup screen components and validates empty inputs', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: AuthScope(
            notifier: authNotifier,
            child: const SignupScreen(),
          ),
        ),
      );

      expect(find.text('Create Account'), findsOneWidget);
      expect(find.byType(TextFormField), findsNWidgets(4)); // Name, Email, Password, Confirm Password

      await tester.tap(find.widgetWithText(ElevatedButton, 'Sign Up'));
      await tester.pump();

      expect(find.text('Please enter your name'), findsOneWidget);
      expect(find.text('Please enter your email'), findsOneWidget);
      expect(find.text('Please enter a password'), findsOneWidget);
    });

    testWidgets('validates password mismatch on signup', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: AuthScope(
            notifier: authNotifier,
            child: const SignupScreen(),
          ),
        ),
      );

      final fields = find.byType(TextFormField);
      await tester.enterText(fields.at(0), 'Almas');
      await tester.enterText(fields.at(1), 'almas@example.com');
      await tester.enterText(fields.at(2), 'Password123!');
      await tester.enterText(fields.at(3), 'DifferentPassword!');
      await tester.tap(find.widgetWithText(ElevatedButton, 'Sign Up'));
      await tester.pump();

      expect(find.text('Passwords do not match'), findsOneWidget);
    });
  });
}
