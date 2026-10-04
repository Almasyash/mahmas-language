// ==============================================================================
// MAHMAS LANGUAGE — PROGRESSION & PRACTICE MODELS
// Client models mapped directly to authoritative Phase 3 backend schemas
// ==============================================================================

import 'user_model.dart';

class XpSummaryModel {
  final int totalXp;
  final int todayXp;
  final int currentLevel;
  final int xpIntoCurrentLevel;
  final int xpToNextLevel;
  final int progressPercent;

  const XpSummaryModel({
    required this.totalXp,
    required this.todayXp,
    required this.currentLevel,
    required this.xpIntoCurrentLevel,
    required this.xpToNextLevel,
    required this.progressPercent,
  });

  factory XpSummaryModel.fromJson(Map<String, dynamic> json) {
    return XpSummaryModel(
      totalXp: json['totalXp'] as int? ?? 0,
      todayXp: json['todayXp'] as int? ?? 0,
      currentLevel: json['currentLevel'] as int? ?? 1,
      xpIntoCurrentLevel: json['xpIntoCurrentLevel'] as int? ?? 0,
      xpToNextLevel: json['xpToNextLevel'] as int? ?? 100,
      progressPercent: json['progressPercent'] as int? ?? 0,
    );
  }
}

class StreakModel {
  final int currentStreak;
  final int longestStreak;
  final bool activeToday;
  final String? lastActivityDate;

  const StreakModel({
    required this.currentStreak,
    required this.longestStreak,
    required this.activeToday,
    this.lastActivityDate,
  });

  factory StreakModel.fromJson(Map<String, dynamic> json) {
    return StreakModel(
      currentStreak: json['currentStreak'] as int? ?? 0,
      longestStreak: json['longestStreak'] as int? ?? 0,
      activeToday: json['activeToday'] as bool? ?? false,
      lastActivityDate: json['lastActivityDate'] as String?,
    );
  }
}

class DailyGoalModel {
  final int dailyGoalMinutes;
  final int dailyMinutesCompleted;
  final int dailyGoalProgress;
  final bool dailyGoalCompleted;
  final int earnedXp;
  final String targetDate;

  const DailyGoalModel({
    required this.dailyGoalMinutes,
    required this.dailyMinutesCompleted,
    required this.dailyGoalProgress,
    required this.dailyGoalCompleted,
    required this.earnedXp,
    required this.targetDate,
  });

  factory DailyGoalModel.fromJson(Map<String, dynamic> json) {
    return DailyGoalModel(
      dailyGoalMinutes: json['dailyGoalMinutes'] as int? ?? 15,
      dailyMinutesCompleted: json['dailyMinutesCompleted'] as int? ?? 0,
      dailyGoalProgress: json['dailyGoalProgress'] as int? ?? 0,
      dailyGoalCompleted: json['dailyGoalCompleted'] as bool? ?? false,
      earnedXp: json['earnedXp'] as int? ?? 0,
      targetDate: json['targetDate'] as String? ?? '',
    );
  }
}

class CurrentCourseModel {
  final String id;
  final String title;
  final int progressPercent;
  final int completedLessonsCount;
  final int totalLessonsCount;
  final String activeLessonId;
  final String activeLessonTitle;

  const CurrentCourseModel({
    required this.id,
    required this.title,
    required this.progressPercent,
    required this.completedLessonsCount,
    required this.totalLessonsCount,
    required this.activeLessonId,
    required this.activeLessonTitle,
  });

  factory CurrentCourseModel.fromJson(Map<String, dynamic> json) {
    return CurrentCourseModel(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? 'Language Course',
      progressPercent: json['progressPercent'] as int? ?? 0,
      completedLessonsCount: json['completedLessonsCount'] as int? ?? 0,
      totalLessonsCount: json['totalLessonsCount'] as int? ?? 0,
      activeLessonId: json['activeLessonId'] as String? ?? '',
      activeLessonTitle: json['activeLessonTitle'] as String? ?? 'Lesson 1',
    );
  }
}

class PracticeSummaryModel {
  final int mistakeCount;
  final int vocabularyReviewCount;
  final int recommendedPracticeCount;

  const PracticeSummaryModel({
    required this.mistakeCount,
    required this.vocabularyReviewCount,
    required this.recommendedPracticeCount,
  });

  factory PracticeSummaryModel.fromJson(Map<String, dynamic> json) {
    return PracticeSummaryModel(
      mistakeCount: json['mistakeCount'] as int? ?? 0,
      vocabularyReviewCount: json['vocabularyReviewCount'] as int? ?? 0,
      recommendedPracticeCount: json['recommendedPracticeCount'] as int? ?? 5,
    );
  }
}

class QuestModel {
  final String id;
  final String title;
  final String description;
  final String questType;
  final int targetCount;
  final int currentCount;
  final int progressPercent;
  final int xpReward;
  final int gemReward;
  final bool isCompleted;
  final bool isClaimed;

  const QuestModel({
    required this.id,
    required this.title,
    required this.description,
    required this.questType,
    required this.targetCount,
    required this.currentCount,
    required this.progressPercent,
    required this.xpReward,
    required this.gemReward,
    required this.isCompleted,
    required this.isClaimed,
  });

  factory QuestModel.fromJson(Map<String, dynamic> json) {
    return QuestModel(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      questType: json['questType'] as String? ?? '',
      targetCount: json['targetCount'] as int? ?? 1,
      currentCount: json['currentCount'] as int? ?? 0,
      progressPercent: json['progressPercent'] as int? ?? 0,
      xpReward: json['xpReward'] as int? ?? 15,
      gemReward: json['gemReward'] as int? ?? 3,
      isCompleted: json['isCompleted'] as bool? ?? false,
      isClaimed: json['isClaimed'] as bool? ?? false,
    );
  }
}

class AchievementModel {
  final String id;
  final String code;
  final String title;
  final String description;
  final String? badgeUrl;
  final int xpReward;
  final int gemReward;
  final bool isUnlocked;
  final String? unlockedAt;

  const AchievementModel({
    required this.id,
    required this.code,
    required this.title,
    required this.description,
    this.badgeUrl,
    required this.xpReward,
    required this.gemReward,
    required this.isUnlocked,
    this.unlockedAt,
  });

  factory AchievementModel.fromJson(Map<String, dynamic> json) {
    return AchievementModel(
      id: json['id'] as String? ?? '',
      code: json['code'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      badgeUrl: json['badgeUrl'] as String?,
      xpReward: json['xpReward'] as int? ?? 50,
      gemReward: json['gemReward'] as int? ?? 10,
      isUnlocked: json['isUnlocked'] as bool? ?? false,
      unlockedAt: json['unlockedAt'] as String?,
    );
  }
}

class DashboardModel {
  final UserModel user;
  final XpSummaryModel xpSummary;
  final StreakModel streak;
  final DailyGoalModel dailyGoal;
  final CurrentCourseModel currentCourse;
  final PracticeSummaryModel practiceSummary;
  final List<AchievementModel> recentAchievements;
  final List<QuestModel> quests;
  final int gems;

  const DashboardModel({
    required this.user,
    required this.xpSummary,
    required this.streak,
    required this.dailyGoal,
    required this.currentCourse,
    required this.practiceSummary,
    required this.recentAchievements,
    required this.quests,
    required this.gems,
  });

  factory DashboardModel.fromJson(Map<String, dynamic> json) {
    final userJson = json['user'] as Map<String, dynamic>? ?? {};
    final xpJson = json['xpSummary'] as Map<String, dynamic>? ?? {};
    final streakJson = json['streak'] as Map<String, dynamic>? ?? {};
    final dailyGoalJson = json['dailyGoal'] as Map<String, dynamic>? ?? {};
    final currentCourseJson = json['currentCourse'] as Map<String, dynamic>? ?? {};
    final practiceSummaryJson = json['practiceSummary'] as Map<String, dynamic>? ?? {};
    final currencyJson = json['currency'] as Map<String, dynamic>? ?? {};

    final achievementsList = (json['recentAchievements'] as List<dynamic>? ?? [])
        .map((a) => AchievementModel.fromJson(a as Map<String, dynamic>))
        .toList();

    final questsList = (json['quests'] as List<dynamic>? ?? [])
        .map((q) => QuestModel.fromJson(q as Map<String, dynamic>))
        .toList();

    return DashboardModel(
      user: UserModel.fromJson(userJson),
      xpSummary: XpSummaryModel.fromJson(xpJson),
      streak: StreakModel.fromJson(streakJson),
      dailyGoal: DailyGoalModel.fromJson(dailyGoalJson),
      currentCourse: CurrentCourseModel.fromJson(currentCourseJson),
      practiceSummary: PracticeSummaryModel.fromJson(practiceSummaryJson),
      recentAchievements: achievementsList,
      quests: questsList,
      gems: currencyJson['gems'] as int? ?? 10,
    );
  }
}

// ------------------------------------------------------------------------------
// PRACTICE ENGINE CLIENT MODELS
// ------------------------------------------------------------------------------

class PracticeOverviewModel {
  final bool practiceAvailable;
  final int mistakeCount;
  final int vocabularyReviewCount;
  final int recommendedPracticeCount;
  final DailyGoalModel? dailyProgress;
  final int totalSessions;
  final int totalDurationMinutes;
  final int totalCorrect;
  final int totalExercises;
  final int accuracyPercent;

  const PracticeOverviewModel({
    required this.practiceAvailable,
    required this.mistakeCount,
    required this.vocabularyReviewCount,
    required this.recommendedPracticeCount,
    this.dailyProgress,
    this.totalSessions = 0,
    this.totalDurationMinutes = 0,
    this.totalCorrect = 0,
    this.totalExercises = 0,
    this.accuracyPercent = 0,
  });

  factory PracticeOverviewModel.fromJson(Map<String, dynamic> json) {
    final stats = json['recentPracticeStatistics'] as Map<String, dynamic>? ?? {};
    final dailyJson = json['dailyProgress'] as Map<String, dynamic>?;

    return PracticeOverviewModel(
      practiceAvailable: json['practiceAvailable'] as bool? ?? true,
      mistakeCount: json['mistakeCount'] as int? ?? 0,
      vocabularyReviewCount: json['vocabularyReviewCount'] as int? ?? 0,
      recommendedPracticeCount: json['recommendedPracticeCount'] as int? ?? 5,
      dailyProgress: dailyJson != null ? DailyGoalModel.fromJson(dailyJson) : null,
      totalSessions: stats['totalSessions'] as int? ?? 0,
      totalDurationMinutes: stats['totalDurationMinutes'] as int? ?? 0,
      totalCorrect: stats['totalCorrect'] as int? ?? 0,
      totalExercises: stats['totalExercises'] as int? ?? 0,
      accuracyPercent: stats['accuracyPercent'] as int? ?? 0,
    );
  }
}

class PracticeOptionModel {
  final String id;
  final String text;
  final int orderIndex;

  const PracticeOptionModel({
    required this.id,
    required this.text,
    required this.orderIndex,
  });

  factory PracticeOptionModel.fromJson(Map<String, dynamic> json) {
    return PracticeOptionModel(
      id: json['id'] as String? ?? '',
      text: json['text'] as String? ?? '',
      orderIndex: json['orderIndex'] as int? ?? 0,
    );
  }
}

class PracticeExerciseModel {
  final String id;
  final String type;
  final String question;
  final String? promptAudioUrl;
  final String? explanation;
  final String? hint;
  final int xp;
  final List<PracticeOptionModel> options;

  const PracticeExerciseModel({
    required this.id,
    required this.type,
    required this.question,
    this.promptAudioUrl,
    this.explanation,
    this.hint,
    this.xp = 5,
    this.options = const [],
  });

  factory PracticeExerciseModel.fromJson(Map<String, dynamic> json) {
    final opts = (json['options'] as List<dynamic>? ?? [])
        .map((o) => PracticeOptionModel.fromJson(o as Map<String, dynamic>))
        .toList();

    return PracticeExerciseModel(
      id: json['id'] as String? ?? '',
      type: json['type'] as String? ?? 'MULTIPLE_CHOICE',
      question: json['question'] as String? ?? '',
      promptAudioUrl: json['promptAudioUrl'] as String?,
      explanation: json['explanation'] as String?,
      hint: json['hint'] as String?,
      xp: json['xp'] as int? ?? 5,
      options: opts,
    );
  }
}

class PracticeSessionModel {
  final String sessionId;
  final String sessionType;
  final int exerciseCount;
  final List<PracticeExerciseModel> exercises;

  const PracticeSessionModel({
    required this.sessionId,
    required this.sessionType,
    required this.exerciseCount,
    required this.exercises,
  });

  factory PracticeSessionModel.fromJson(Map<String, dynamic> rawJson) {
    final json = rawJson.containsKey('session') && rawJson['session'] is Map<String, dynamic>
        ? (rawJson['session'] as Map<String, dynamic>)
        : rawJson;

    final exList = (json['exercises'] as List<dynamic>? ?? [])
        .map((e) => PracticeExerciseModel.fromJson(e as Map<String, dynamic>))
        .toList();

    return PracticeSessionModel(
      sessionId: json['sessionId'] as String? ?? json['id'] as String? ?? '',
      sessionType: json['sessionType'] as String? ?? 'RECOMMENDED',
      exerciseCount: json['exerciseCount'] as int? ?? exList.length,
      exercises: exList,
    );
  }
}

class PracticeMistakeModel {
  final String id;
  final String exerciseId;
  final String question;
  final String type;
  final int difficulty;
  final String userGivenAnswer;
  final int retryCount;
  final String? lastReviewedAt;
  final String createdAt;

  const PracticeMistakeModel({
    required this.id,
    required this.exerciseId,
    required this.question,
    required this.type,
    required this.difficulty,
    required this.userGivenAnswer,
    required this.retryCount,
    this.lastReviewedAt,
    required this.createdAt,
  });

  factory PracticeMistakeModel.fromJson(Map<String, dynamic> json) {
    return PracticeMistakeModel(
      id: json['id'] as String? ?? '',
      exerciseId: json['exerciseId'] as String? ?? '',
      question: json['question'] as String? ?? '',
      type: json['type'] as String? ?? '',
      difficulty: json['difficulty'] as int? ?? 1,
      userGivenAnswer: json['userGivenAnswer'] as String? ?? '',
      retryCount: json['retryCount'] as int? ?? 0,
      lastReviewedAt: json['lastReviewedAt'] as String?,
      createdAt: json['createdAt'] as String? ?? '',
    );
  }
}

class MistakesOverviewModel {
  final int totalMistakes;
  final List<PracticeMistakeModel> recent;
  final List<PracticeMistakeModel> repeated;
  final List<PracticeMistakeModel> older;

  const MistakesOverviewModel({
    required this.totalMistakes,
    required this.recent,
    required this.repeated,
    required this.older,
  });

  factory MistakesOverviewModel.fromJson(Map<String, dynamic> json) {
    return MistakesOverviewModel(
      totalMistakes: json['totalMistakes'] as int? ?? 0,
      recent: (json['recent'] as List<dynamic>? ?? [])
          .map((m) => PracticeMistakeModel.fromJson(m as Map<String, dynamic>))
          .toList(),
      repeated: (json['repeated'] as List<dynamic>? ?? [])
          .map((m) => PracticeMistakeModel.fromJson(m as Map<String, dynamic>))
          .toList(),
      older: (json['older'] as List<dynamic>? ?? [])
          .map((m) => PracticeMistakeModel.fromJson(m as Map<String, dynamic>))
          .toList(),
    );
  }
}

class VocabularyItemModel {
  final String id;
  final String wordId;
  final String word;
  final String? phonetic;
  final String translation;
  final String? partOfSpeech;
  final String level;
  final String status;
  final double confidence;
  final int exposureCount;
  final int correctCount;
  final int incorrectCount;
  final bool isDueForReview;
  final String nextReviewAt;
  final String? lastReviewedAt;

  const VocabularyItemModel({
    required this.id,
    required this.wordId,
    required this.word,
    this.phonetic,
    required this.translation,
    this.partOfSpeech,
    required this.level,
    required this.status,
    required this.confidence,
    required this.exposureCount,
    required this.correctCount,
    required this.incorrectCount,
    required this.isDueForReview,
    required this.nextReviewAt,
    this.lastReviewedAt,
  });

  factory VocabularyItemModel.fromJson(Map<String, dynamic> json) {
    return VocabularyItemModel(
      id: json['id'] as String? ?? '',
      wordId: json['wordId'] as String? ?? '',
      word: json['word'] as String? ?? '',
      phonetic: json['phonetic'] as String?,
      translation: json['translation'] as String? ?? '',
      partOfSpeech: json['partOfSpeech'] as String?,
      level: json['level'] as String? ?? 'A1',
      status: json['status'] as String? ?? 'NEW',
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0.0,
      exposureCount: json['exposureCount'] as int? ?? 0,
      correctCount: json['correctCount'] as int? ?? 0,
      incorrectCount: json['incorrectCount'] as int? ?? 0,
      isDueForReview: json['isDueForReview'] as bool? ?? false,
      nextReviewAt: json['nextReviewAt'] as String? ?? '',
      lastReviewedAt: json['lastReviewedAt'] as String?,
    );
  }
}

class VocabularyOverviewModel {
  final int totalCount;
  final int dueCount;
  final List<VocabularyItemModel> words;

  const VocabularyOverviewModel({
    required this.totalCount,
    required this.dueCount,
    required this.words,
  });

  factory VocabularyOverviewModel.fromJson(Map<String, dynamic> json) {
    return VocabularyOverviewModel(
      totalCount: json['totalCount'] as int? ?? 0,
      dueCount: json['dueCount'] as int? ?? 0,
      words: (json['words'] as List<dynamic>? ?? [])
          .map((w) => VocabularyItemModel.fromJson(w as Map<String, dynamic>))
          .toList(),
    );
  }
}
