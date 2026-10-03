// ==============================================================================
// MAHMAS LANGUAGE — PROGRESSION REPOSITORY
// Communicates with backend progression, practice, quests, and achievements APIs
// ==============================================================================

import '../models/progression_model.dart';
import '../network/api_client.dart';

class ProgressionRepository {
  final ApiClient apiClient;

  ProgressionRepository({required this.apiClient});

  /// Fetches complete aggregated dashboard data from `/users/me/dashboard`
  Future<DashboardModel> getDashboard() async {
    final res = await apiClient.get<Map<String, dynamic>>('/users/me/dashboard');
    if (!res.success || res.data == null) {
      throw Exception(res.errorMessage ?? 'Failed to load dashboard data.');
    }
    return DashboardModel.fromJson(res.data!);
  }

  /// Fetches practice overview statistics from `/practice/overview`
  Future<PracticeOverviewModel> getPracticeOverview() async {
    final res = await apiClient.get<Map<String, dynamic>>('/practice/overview');
    if (!res.success || res.data == null) {
      throw Exception(res.errorMessage ?? 'Failed to load practice overview.');
    }
    return PracticeOverviewModel.fromJson(res.data!);
  }

  /// Starts a new practice session from `/practice/session/start`
  Future<PracticeSessionModel> startPracticeSession({String sessionType = 'RECOMMENDED'}) async {
    final res = await apiClient.post<Map<String, dynamic>>(
      '/practice/session/start',
      body: {'sessionType': sessionType},
    );
    if (!res.success || res.data == null) {
      throw Exception(res.errorMessage ?? 'Failed to start practice session.');
    }
    return PracticeSessionModel.fromJson(res.data!);
  }

  /// Authoritatively submits an exercise attempt in a practice session
  Future<Map<String, dynamic>> submitPracticeExercise({
    required String exerciseId,
    required String sessionId,
    required String userAnswer,
  }) async {
    final res = await apiClient.post<Map<String, dynamic>>(
      '/practice/exercises/$exerciseId/submit',
      body: {
        'sessionId': sessionId,
        'userAnswer': userAnswer,
      },
    );
    if (!res.success || res.data == null) {
      throw Exception(res.errorMessage ?? 'Failed to submit practice exercise.');
    }
    return res.data!;
  }

  /// Completes a practice session and receives server-calculated XP & rewards
  Future<Map<String, dynamic>> completePracticeSession({
    required String sessionId,
    required int durationSec,
  }) async {
    final res = await apiClient.post<Map<String, dynamic>>(
      '/practice/session/$sessionId/complete',
      body: {'durationSec': durationSec},
    );
    if (!res.success || res.data == null) {
      throw Exception(res.errorMessage ?? 'Failed to complete practice session.');
    }
    return res.data!;
  }

  /// Fetches categorized mistakes from `/practice/mistakes`
  Future<MistakesOverviewModel> getMistakes() async {
    final res = await apiClient.get<Map<String, dynamic>>('/practice/mistakes');
    if (!res.success || res.data == null) {
      throw Exception(res.errorMessage ?? 'Failed to load mistakes.');
    }
    return MistakesOverviewModel.fromJson(res.data!);
  }

  /// Fetches vocabulary items and review confidence from `/practice/vocabulary`
  Future<VocabularyOverviewModel> getVocabulary() async {
    final res = await apiClient.get<Map<String, dynamic>>('/practice/vocabulary');
    if (!res.success || res.data == null) {
      throw Exception(res.errorMessage ?? 'Failed to load vocabulary.');
    }
    return VocabularyOverviewModel.fromJson(res.data!);
  }

  /// Fetches user quests from `/progression/quests`
  Future<List<QuestModel>> getQuests() async {
    final res = await apiClient.get<List<dynamic>>('/progression/quests');
    if (!res.success || res.data == null) {
      throw Exception(res.errorMessage ?? 'Failed to load quests.');
    }
    return res.data!.map((q) => QuestModel.fromJson(q as Map<String, dynamic>)).toList();
  }

  /// Claims reward for completed quest from `/progression/quests/:id/claim`
  Future<Map<String, dynamic>> claimQuest(String questId) async {
    final res = await apiClient.post<Map<String, dynamic>>(
      '/progression/quests/$questId/claim',
      body: {},
    );
    if (!res.success || res.data == null) {
      throw Exception(res.errorMessage ?? 'Failed to claim quest reward.');
    }
    return res.data!;
  }

  /// Fetches all achievements from `/progression/achievements`
  Future<List<AchievementModel>> getAchievements() async {
    final res = await apiClient.get<List<dynamic>>('/progression/achievements');
    if (!res.success || res.data == null) {
      throw Exception(res.errorMessage ?? 'Failed to load achievements.');
    }
    return res.data!.map((a) => AchievementModel.fromJson(a as Map<String, dynamic>)).toList();
  }

  /// Fetches course path tree with unlock statuses from `/courses/:courseId/path`
  Future<Map<String, dynamic>> getCoursePath(String courseId) async {
    final res = await apiClient.get<Map<String, dynamic>>('/courses/$courseId/path');
    if (!res.success || res.data == null) {
      throw Exception(res.errorMessage ?? 'Failed to load course path.');
    }
    return res.data!;
  }

  /// Fetches sanitized exercises for a lesson from `/lessons/:lessonId/exercises`
  Future<Map<String, dynamic>> getLessonExercises(String lessonId) async {
    final res = await apiClient.get<Map<String, dynamic>>('/lessons/$lessonId/exercises');
    if (!res.success || res.data == null) {
      throw Exception(res.errorMessage ?? 'Failed to load lesson exercises.');
    }
    return res.data!;
  }

  /// Submits lesson attempt authoritatively to `/lessons/:lessonId/submit`
  Future<Map<String, dynamic>> submitLessonAttempt({
    required String lessonId,
    required List<Map<String, dynamic>> answers,
    required int durationSec,
  }) async {
    final res = await apiClient.post<Map<String, dynamic>>(
      '/lessons/$lessonId/submit',
      body: {
        'answers': answers,
        'durationSec': durationSec,
      },
    );
    if (!res.success || res.data == null) {
      throw Exception(res.errorMessage ?? 'Failed to submit lesson attempt.');
    }
    return res.data!;
  }
}
