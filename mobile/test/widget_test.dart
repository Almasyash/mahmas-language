import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mahmas_language/core/auth/auth_notifier.dart';
import 'package:mahmas_language/core/network/api_client.dart';
import 'package:mahmas_language/core/storage/token_storage.dart';
import 'package:mahmas_language/main.dart';

http.Response jsonOk(Map<String, dynamic> data) => http.Response.bytes(
      utf8.encode(jsonEncode(data)),
      200,
      headers: {'content-type': 'application/json; charset=utf-8'},
    );

void main() {
  testWidgets('App smoke test renders home dashboard and branding when authenticated', (tester) async {
    tester.view.devicePixelRatio = 1.0;
    tester.view.physicalSize = const Size(800, 1600);
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    final mockClient = MockClient((request) async {
      if (request.url.path.contains('/auth/me')) {
        return jsonOk({
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
        });
      }
      if (request.url.path.contains('/users/me/dashboard')) {
        return jsonOk({
          'success': true,
          'data': {
            'user': {
              'id': 'usr-test-1',
              'email': 'tester@example.com',
              'displayName': 'Test Learner',
              'targetLanguage': {
                'id': 'lang-es',
                'code': 'es',
                'name': 'Spanish',
                'flagEmoji': '🇪🇸',
              },
            },
            'currency': {'gems': 100},
            'xpSummary': {
              'totalXp': 120,
              'todayXp': 40,
              'currentLevel': 2,
              'xpIntoCurrentLevel': 20,
              'xpToNextLevel': 100,
              'progressPercent': 20,
            },
            'streak': {
              'currentStreak': 3,
              'longestStreak': 5,
              'activeToday': true,
              'lastActivityDate': '2026-10-03',
            },
            'dailyGoal': {
              'dailyGoalMinutes': 10,
              'dailyMinutesCompleted': 8,
              'dailyGoalProgress': 80,
              'dailyGoalCompleted': false,
              'earnedXp': 20,
              'targetDate': '2026-10-03',
            },
            'currentCourse': {
              'id': 'course-1',
              'title': 'Spanish Foundations',
              'progressPercent': 20,
              'completedLessonsCount': 2,
              'totalLessonsCount': 10,
              'activeLessonId': 'les-1',
              'activeLessonTitle': 'Greetings & Basics',
            },
            'practiceSummary': {
              'recommendedPracticeCount': 5,
              'mistakeCount': 2,
              'vocabularyReviewCount': 3,
            },
            'recentAchievements': [
              {
                'id': 'ach-1',
                'code': 'FIRST_LESSON',
                'title': 'First Steps',
                'description': 'Complete your first lesson',
                'badgeUrl': null,
                'xpReward': 20,
                'gemReward': 5,
                'isUnlocked': true,
                'unlockedAt': '2026-10-03T10:00:00Z',
              }
            ],
            'quests': [
              {
                'id': 'uq-1',
                'title': 'Daily Explorer',
                'description': 'Complete 2 lessons today',
                'questType': 'COMPLETE_LESSONS',
                'targetCount': 2,
                'currentCount': 1,
                'progressPercent': 50,
                'xpReward': 25,
                'gemReward': 5,
                'isCompleted': false,
                'isClaimed': false,
              }
            ],
          },
        });
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

    // Verify brand, navigation, and Phase 3 dashboard widgets
    expect(find.text('Learn'), findsOneWidget);
    expect(find.text('Practice'), findsOneWidget);
    expect(find.text('AI Tutor'), findsOneWidget);
    expect(find.text('Exchange'), findsOneWidget);
    expect(find.text('Profile'), findsOneWidget);
    expect(find.text('Continue Learning'), findsOneWidget);
    expect(find.text('Daily Quests'), findsOneWidget);
    expect(find.text('Recent Achievements'), findsOneWidget);
    expect(find.text('Level 2'), findsOneWidget);
    expect(find.text('Greetings & Basics'), findsOneWidget);
  });
}
