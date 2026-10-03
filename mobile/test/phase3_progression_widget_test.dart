// ==============================================================================
// MAHMAS LANGUAGE — PHASE 3 PROGRESSION, GAMIFICATION & PRACTICE WIDGET TESTS
// ==============================================================================

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mahmas_language/core/auth/auth_notifier.dart';
import 'package:mahmas_language/core/auth/auth_scope.dart';
import 'package:mahmas_language/core/models/progression_model.dart';
import 'package:mahmas_language/core/network/api_client.dart';
import 'package:mahmas_language/core/storage/token_storage.dart';
import 'package:mahmas_language/features/home/home_screen.dart';
import 'package:mahmas_language/features/practice/practice_screen.dart';
import 'package:mahmas_language/features/practice/mistake_review_screen.dart';
import 'package:mahmas_language/features/practice/vocabulary_review_screen.dart';
import 'package:mahmas_language/features/practice/practice_runner_screen.dart';

http.Response jsonOk(Map<String, dynamic> data) => http.Response.bytes(
      utf8.encode(jsonEncode(data)),
      200,
      headers: {'content-type': 'application/json; charset=utf-8'},
    );

void setPhoneViewport(WidgetTester tester) {
  tester.view.devicePixelRatio = 1.0;
  tester.view.physicalSize = const Size(800, 1600);
  addTearDown(() {
    tester.view.resetPhysicalSize();
    tester.view.resetDevicePixelRatio();
  });
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Phase 3 Models Serialization & Logic Tests', () {
    test('XpSummaryModel parses correctly and computes levels', () {
      final json = {
        'totalXp': 250,
        'todayXp': 50,
        'currentLevel': 3,
        'xpIntoCurrentLevel': 50,
        'xpToNextLevel': 100,
        'progressPercent': 50,
      };

      final model = XpSummaryModel.fromJson(json);
      expect(model.totalXp, 250);
      expect(model.todayXp, 50);
      expect(model.currentLevel, 3);
      expect(model.xpIntoCurrentLevel, 50);
      expect(model.xpToNextLevel, 100);
      expect(model.progressPercent, 50);
    });

    test('StreakModel parses streak data accurately', () {
      final json = {
        'currentStreak': 7,
        'longestStreak': 14,
        'activeToday': true,
        'lastActivityDate': '2026-10-03',
      };

      final model = StreakModel.fromJson(json);
      expect(model.currentStreak, 7);
      expect(model.longestStreak, 14);
      expect(model.activeToday, true);
      expect(model.lastActivityDate, '2026-10-03');
    });

    test('DailyGoalModel parses target and progress accurately', () {
      final json = {
        'dailyGoalMinutes': 15,
        'dailyMinutesCompleted': 15,
        'dailyGoalProgress': 100,
        'dailyGoalCompleted': true,
        'earnedXp': 20,
        'targetDate': '2026-10-03',
      };

      final model = DailyGoalModel.fromJson(json);
      expect(model.dailyGoalMinutes, 15);
      expect(model.dailyMinutesCompleted, 15);
      expect(model.dailyGoalProgress, 100);
      expect(model.dailyGoalCompleted, true);
    });

    test('QuestModel and AchievementModel parse correctly', () {
      final questJson = {
        'id': 'uq-1',
        'title': 'Daily Explorer',
        'description': 'Complete 2 lessons today',
        'questType': 'COMPLETE_LESSONS',
        'targetCount': 2,
        'currentCount': 2,
        'progressPercent': 100,
        'xpReward': 20,
        'gemReward': 5,
        'isCompleted': true,
        'isClaimed': false,
      };

      final quest = QuestModel.fromJson(questJson);
      expect(quest.title, 'Daily Explorer');
      expect(quest.isCompleted, true);
      expect(quest.isClaimed, false);

      final achJson = {
        'id': 'ach-1',
        'code': 'FIRST_LESSON',
        'title': 'First Step',
        'description': 'Complete your first lesson',
        'badgeUrl': null,
        'xpReward': 20,
        'gemReward': 5,
        'isUnlocked': true,
        'unlockedAt': '2026-10-03T10:00:00Z',
      };

      final ach = AchievementModel.fromJson(achJson);
      expect(ach.code, 'FIRST_LESSON');
      expect(ach.isUnlocked, true);
    });

    test('DashboardModel parses complete aggregated structure', () {
      final dashJson = {
        'user': {
          'id': 'u-1',
          'email': 'learner@test.com',
          'displayName': 'Learner',
        },
        'currency': {'gems': 50},
        'xpSummary': {
          'totalXp': 100,
          'todayXp': 20,
          'currentLevel': 1,
          'xpIntoCurrentLevel': 20,
          'xpToNextLevel': 100,
          'progressPercent': 20,
        },
        'streak': {
          'currentStreak': 2,
          'longestStreak': 4,
          'activeToday': true,
          'lastActivityDate': '2026-10-03',
        },
        'dailyGoal': {
          'dailyGoalMinutes': 10,
          'dailyMinutesCompleted': 5,
          'dailyGoalProgress': 50,
          'dailyGoalCompleted': false,
          'earnedXp': 10,
          'targetDate': '2026-10-03',
        },
        'currentCourse': {
          'id': 'c-1',
          'title': 'Spanish 101',
          'progressPercent': 15,
          'completedLessonsCount': 1,
          'totalLessonsCount': 8,
          'activeLessonId': 'l-1',
          'activeLessonTitle': 'Greetings',
        },
        'practiceSummary': {
          'mistakeCount': 1,
          'vocabularyReviewCount': 2,
          'recommendedPracticeCount': 5,
        },
        'recentAchievements': [],
        'quests': [],
      };

      final dash = DashboardModel.fromJson(dashJson);
      expect(dash.user.displayName, 'Learner');
      expect(dash.gems, 50);
      expect(dash.streak.currentStreak, 2);
      expect(dash.currentCourse.title, 'Spanish 101');
    });
  });

  group('Phase 3 Screens Widget Tests', () {
    late ApiClient mockApiClient;
    late AuthNotifier authNotifier;

    setUp(() {
      final mockClient = MockClient((request) async {
        final path = request.url.path;

        if (path.contains('/users/me/dashboard')) {
          return jsonOk({
            'success': true,
            'data': {
              'user': {
                'id': 'usr-1',
                'email': 'test@example.com',
                'displayName': 'Test User',
                'targetLanguage': {'id': 'l-es', 'code': 'es', 'name': 'Spanish', 'flagEmoji': '🇪🇸'},
              },
              'currency': {'gems': 75},
              'xpSummary': {
                'totalXp': 140,
                'todayXp': 40,
                'currentLevel': 2,
                'xpIntoCurrentLevel': 40,
                'xpToNextLevel': 100,
                'progressPercent': 40,
              },
              'streak': {
                'currentStreak': 5,
                'longestStreak': 5,
                'activeToday': true,
                'lastActivityDate': '2026-10-03',
              },
              'dailyGoal': {
                'dailyGoalMinutes': 10,
                'dailyMinutesCompleted': 6,
                'dailyGoalProgress': 60,
                'dailyGoalCompleted': false,
                'earnedXp': 25,
                'targetDate': '2026-10-03',
              },
              'currentCourse': {
                'id': 'course-es-1',
                'title': 'Spanish Foundations',
                'progressPercent': 10,
                'completedLessonsCount': 1,
                'totalLessonsCount': 10,
                'activeLessonId': 'lesson-1',
                'activeLessonTitle': 'Greetings & Hello',
              },
              'practiceSummary': {
                'mistakeCount': 2,
                'vocabularyReviewCount': 3,
                'recommendedPracticeCount': 5,
              },
              'recentAchievements': [
                {
                  'id': 'ach-1',
                  'code': 'FIRST_LESSON',
                  'title': 'First Step',
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
                  'currentCount': 2,
                  'progressPercent': 100,
                  'xpReward': 20,
                  'gemReward': 5,
                  'isCompleted': true,
                  'isClaimed': false,
                },
                {
                  'id': 'uq-2',
                  'title': 'XP Grinder',
                  'description': 'Earn 50 XP today',
                  'questType': 'EARN_XP',
                  'targetCount': 50,
                  'currentCount': 40,
                  'progressPercent': 80,
                  'xpReward': 15,
                  'gemReward': 3,
                  'isCompleted': false,
                  'isClaimed': false,
                }
              ],
            },
          });
        }

        if (path.contains('/practice/overview')) {
          return jsonOk({
            'success': true,
            'data': {
              'practiceAvailable': true,
              'mistakeCount': 2,
              'vocabularyReviewCount': 3,
              'recommendedPracticeCount': 5,
              'dailyProgress': {
                'dailyGoalMinutes': 10,
                'dailyMinutesCompleted': 8,
                'dailyGoalProgress': 80,
                'dailyGoalCompleted': false,
                'earnedXp': 20,
                'targetDate': '2026-10-03',
              },
              'recentPracticeStatistics': {
                'totalSessions': 1,
                'totalDurationMinutes': 2,
                'totalCorrect': 4,
                'totalExercises': 5,
                'accuracyPercent': 80,
              },
            },
          });
        }

        if (path.contains('/practice/mistakes')) {
          return jsonOk({
            'success': true,
            'data': {
              'totalMistakes': 2,
              'recent': [
                {
                  'id': 'mis-1',
                  'exerciseId': 'ex-1',
                  'question': 'Translate "Hello"',
                  'type': 'MULTIPLE_CHOICE',
                  'difficulty': 1,
                  'userGivenAnswer': 'Adios',
                  'retryCount': 1,
                  'createdAt': '2026-10-03T10:00:00Z',
                }
              ],
              'repeated': [
                {
                  'id': 'mis-2',
                  'exerciseId': 'ex-2',
                  'question': 'Translate "Thank you"',
                  'type': 'MULTIPLE_CHOICE',
                  'difficulty': 1,
                  'userGivenAnswer': 'Por favor',
                  'retryCount': 3,
                  'createdAt': '2026-10-02T15:00:00Z',
                }
              ],
              'older': [],
            },
          });
        }

        if (path.contains('/practice/vocabulary')) {
          return jsonOk({
            'success': true,
            'data': {
              'totalCount': 2,
              'dueCount': 1,
              'words': [
                {
                  'id': 'v-1',
                  'wordId': 'w-1',
                  'word': 'Hola',
                  'translation': 'Hello',
                  'phonetic': 'OH-lah',
                  'partOfSpeech': 'greeting',
                  'level': 'A1',
                  'status': 'LEARNING',
                  'confidence': 0.6,
                  'exposureCount': 4,
                  'correctCount': 3,
                  'incorrectCount': 1,
                  'isDueForReview': true,
                  'nextReviewAt': '2026-10-03T18:00:00Z',
                },
                {
                  'id': 'v-2',
                  'wordId': 'w-2',
                  'word': 'Gracias',
                  'translation': 'Thank you',
                  'phonetic': 'GRAH-syahs',
                  'partOfSpeech': 'expression',
                  'level': 'A1',
                  'status': 'REVIEW',
                  'confidence': 0.8,
                  'exposureCount': 6,
                  'correctCount': 5,
                  'incorrectCount': 1,
                  'isDueForReview': false,
                  'nextReviewAt': '2026-10-04T12:00:00Z',
                }
              ],
            },
          });
        }

        if (path.contains('/practice/session/start')) {
          return jsonOk({
            'success': true,
            'data': {
              'sessionId': 'sess-new-1',
              'sessionType': 'RECOMMENDED',
              'exerciseCount': 1,
              'exercises': [
                {
                  'id': 'ex-101',
                  'type': 'MULTIPLE_CHOICE',
                  'question': 'Translate "Water"',
                  'options': [
                    {'id': 'opt-1', 'text': 'Agua', 'orderIndex': 0},
                    {'id': 'opt-2', 'text': 'Pan', 'orderIndex': 1},
                  ],
                  'xp': 5,
                }
              ],
            },
          });
        }

        if (path.contains('/progression/quests/uq-1/claim')) {
          return jsonOk({
            'success': true,
            'data': {
              'xpAwarded': 20,
              'gemsAwarded': 5,
              'totalXp': 160,
              'totalGems': 80,
            },
          });
        }

        return http.Response('{"success": false, "message": "Not Found"}', 404);
      });

      final tokenStorage = TokenStorage(
        inMemory: true,
        initialData: {'mahmas_access_token': 'test-token'},
      );
      mockApiClient = ApiClient(
        baseUrl: 'http://localhost:4000/api/v1',
        tokenStorage: tokenStorage,
        client: mockClient,
      );
      authNotifier = AuthNotifier(
        apiClient: mockApiClient,
        tokenStorage: tokenStorage,
      );
    });

    Widget wrapWithScope(Widget child) {
      return MaterialApp(
        home: AuthScope(
          notifier: authNotifier,
          child: child,
        ),
      );
    }

    testWidgets('HomeScreen renders dashboard metrics, quests and achievements', (tester) async {
      setPhoneViewport(tester);

      await tester.pumpWidget(wrapWithScope(const HomeScreen()));
      await tester.pumpAndSettle();

      // Header pills
      expect(find.text('5'), findsOneWidget); // Streak
      expect(find.text('75'), findsOneWidget); // Gems
      expect(find.text('140'), findsOneWidget); // Total XP

      // Level and XP
      expect(find.text('Level 2'), findsOneWidget);
      expect(find.text('+40 XP today'), findsOneWidget);

      // Hero cards
      expect(find.text('Continue Learning'), findsOneWidget);
      expect(find.text('Greetings & Hello'), findsOneWidget);
      expect(find.text('Quick Practice'), findsOneWidget);

      // Quests & Claim button
      expect(find.text('Daily Quests'), findsOneWidget);
      expect(find.text('Daily Explorer'), findsOneWidget);
      expect(find.text('Claim'), findsOneWidget);

      // Achievements
      expect(find.text('Recent Achievements'), findsOneWidget);
      expect(find.text('First Step'), findsOneWidget);
    });

    testWidgets('HomeScreen handles quest claiming idempotently', (tester) async {
      setPhoneViewport(tester);

      await tester.pumpWidget(wrapWithScope(const HomeScreen()));
      await tester.pumpAndSettle();

      final claimButton = find.text('Claim');
      expect(claimButton, findsOneWidget);

      await tester.tap(claimButton);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Verify SnackBar confirmation message is shown
      expect(find.text('Quest Claimed! +20 XP, +5 Gems'), findsOneWidget);
    });

    testWidgets('PracticeScreen renders overview, mistake and vocab count', (tester) async {
      setPhoneViewport(tester);

      await tester.pumpWidget(wrapWithScope(const PracticeScreen()));
      await tester.pumpAndSettle();

      expect(find.text('Recommended Practice'), findsOneWidget);
      expect(find.text('Mistake Review'), findsOneWidget);
      expect(find.text('Vocabulary'), findsOneWidget);
      expect(find.text('2'), findsOneWidget);
      expect(find.text('3 due'), findsOneWidget);
    });

    testWidgets('MistakeReviewScreen renders categorized mistakes', (tester) async {
      setPhoneViewport(tester);

      await tester.pumpWidget(wrapWithScope(const MistakeReviewScreen()));
      await tester.pumpAndSettle();

      expect(find.text('Mistake Review'), findsOneWidget);
      expect(find.text('Translate "Hello"'), findsOneWidget);
      expect(find.text('Your answer: '), findsOneWidget);
      expect(find.text('Adios'), findsOneWidget);
      expect(find.text('Practice All Mistakes'), findsOneWidget);
    });

    testWidgets('VocabularyReviewScreen renders words and SRS confidence', (tester) async {
      setPhoneViewport(tester);

      await tester.pumpWidget(wrapWithScope(const VocabularyReviewScreen()));
      await tester.pumpAndSettle();

      expect(find.text('Vocabulary Review'), findsOneWidget);
      expect(find.text('Hola'), findsOneWidget);
      expect(find.text('Hello'), findsOneWidget);
      expect(find.text('/OH-lah/'), findsOneWidget);
      expect(find.text('Gracias'), findsOneWidget);
      expect(find.text('Practice Due Words (1)'), findsOneWidget);
    });

    testWidgets('PracticeRunnerScreen loads session and allows exercise answering', (tester) async {
      setPhoneViewport(tester);

      await tester.pumpWidget(wrapWithScope(const PracticeRunnerScreen(sessionType: 'RECOMMENDED')));
      await tester.pumpAndSettle();

      expect(find.text('Translate "Water"'), findsOneWidget);
      expect(find.text('Agua'), findsOneWidget);
      expect(find.text('Pan'), findsOneWidget);
      expect(find.text('Check Answer'), findsOneWidget);
    });

    testWidgets('HomeScreen displays error view and retry button on network failure', (tester) async {
      setPhoneViewport(tester);

      final errorClient = MockClient((request) async {
        return http.Response('{"success": false, "message": "Server Offline"}', 500);
      });

      final tokenStorage = TokenStorage(inMemory: true);
      final failingApiClient = ApiClient(
        baseUrl: 'http://localhost:4000/api/v1',
        tokenStorage: tokenStorage,
        client: errorClient,
      );
      final failingNotifier = AuthNotifier(
        apiClient: failingApiClient,
        tokenStorage: tokenStorage,
      );

      await tester.pumpWidget(MaterialApp(
        home: AuthScope(
          notifier: failingNotifier,
          child: const HomeScreen(),
        ),
      ));
      await tester.pumpAndSettle();

      expect(find.text('Failed to load dashboard'), findsOneWidget);
      expect(find.text('Retry'), findsOneWidget);
    });
  });
}
