// ==============================================================================
// MAHMAS LANGUAGE — PRACTICE SERVICE
// Authoritative practice session runner, exercise selection, mistake & vocab review
// Strict Target Language Isolation Enforced
// ==============================================================================

import { PracticeSessionStatus, PracticeSessionType, VocabularyStatus, ExerciseType } from '@prisma/client';
import { prisma } from '../../database/prisma';
import { xpService } from '../progression/xp.service';
import { streakService } from '../progression/streak.service';
import { dailyGoalService } from '../progression/daily-goal.service';
import { currencyService } from '../progression/currency.service';
import { questsService } from '../progression/quests.service';
import { achievementsService } from '../progression/achievements.service';
import { ProgressionConfig } from '../progression/progression.config';

export class PracticeService {
  /**
   * Retrieves practice overview statistics for the user filtered by active target language.
   */
  async getOverview(userId: string) {
    const now = new Date();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    const targetLangId = user?.profile?.targetLanguageId;

    // 1. Unresolved mistakes count (filtered by target language)
    const mistakeWhere: any = { userId, isResolved: false };
    if (targetLangId) {
      mistakeWhere.exercise = {
        lesson: {
          unit: {
            section: {
              course: {
                languageId: targetLangId,
              },
            },
          },
        },
      };
    }
    const mistakeCount = await prisma.mistake.count({ where: mistakeWhere });

    // 2. Vocabulary words due for review (filtered by target language)
    const vocabWhere: any = { userId, nextReviewAt: { lte: now } };
    if (targetLangId) {
      vocabWhere.word = { languageId: targetLangId };
    }
    const vocabularyReviewCount = await prisma.userVocabulary.count({ where: vocabWhere });

    // 3. Recommended practice count
    const recommendedPracticeCount = Math.max(5, Math.min(15, mistakeCount + vocabularyReviewCount + 5));

    // 4. Recent practice statistics
    const completedSessions = await prisma.practiceSession.findMany({
      where: {
        userId,
        status: PracticeSessionStatus.COMPLETED,
      },
      orderBy: { completedAt: 'desc' },
      take: 10,
    });

    const totalSessions = completedSessions.length;
    const totalDurationSec = completedSessions.reduce((acc, s) => acc + s.durationSec, 0);
    const totalCorrect = completedSessions.reduce((acc, s) => acc + s.correctCount, 0);
    const totalExercises = completedSessions.reduce((acc, s) => acc + s.exerciseCount, 0);
    const accuracyPercent = totalExercises > 0 ? Math.round((totalCorrect / totalExercises) * 100) : 0;

    // 5. Daily progress
    const dailyProgress = await dailyGoalService.getDailyGoalProgress(userId);

    return {
      practiceAvailable: true,
      mistakeCount,
      vocabularyReviewCount,
      recommendedPracticeCount,
      recentPracticeStatistics: {
        totalSessions,
        totalDurationMinutes: Math.round(totalDurationSec / 60),
        totalCorrect,
        totalExercises,
        accuracyPercent,
      },
      dailyProgress,
    };
  }

  /**
   * Starts a new authoritative practice session and selects priority exercises for active target language.
   */
  async startSession(userId: string, sessionType: PracticeSessionType = PracticeSessionType.RECOMMENDED) {
    const selectedExercises: any[] = [];
    const exerciseIdSet = new Set<string>();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    const targetLangId = user?.profile?.targetLanguageId;

    // 1. Prioritize unresolved mistakes for user's active target language
    const mistakeWhere: any = { userId, isResolved: false };
    if (targetLangId) {
      mistakeWhere.exercise = {
        lesson: {
          unit: {
            section: {
              course: {
                languageId: targetLangId,
              },
            },
          },
        },
      };
    }

    const unresolvedMistakes = await prisma.mistake.findMany({
      where: mistakeWhere,
      include: {
        exercise: {
          include: {
            options: {
              select: { id: true, text: true, orderIndex: true },
            },
          },
        },
      },
      orderBy: [{ retryCount: 'desc' }, { createdAt: 'desc' }],
      take: 6,
    });

    for (const m of unresolvedMistakes) {
      if (!exerciseIdSet.has(m.exercise.id)) {
        exerciseIdSet.add(m.exercise.id);
        selectedExercises.push(m.exercise);
      }
    }

    // 2. Add course exercises to fulfill practice size (up to 5 exercises) for active target language
    if (selectedExercises.length < 5) {
      const exerciseWhere: any = {
        id: { notIn: Array.from(exerciseIdSet) },
      };
      if (targetLangId) {
        exerciseWhere.lesson = {
          unit: {
            section: {
              course: {
                languageId: targetLangId,
              },
            },
          },
        };
      }

      const additionalExercises = await prisma.exercise.findMany({
        where: exerciseWhere,
        include: {
          options: {
            select: { id: true, text: true, orderIndex: true },
          },
        },
        take: 5 - selectedExercises.length,
      });

      for (const ex of additionalExercises) {
        if (!exerciseIdSet.has(ex.id)) {
          exerciseIdSet.add(ex.id);
          selectedExercises.push(ex);
        }
      }
    }

    // Create persistent PracticeSession record
    const session = await prisma.practiceSession.create({
      data: {
        userId,
        sessionType,
        status: PracticeSessionStatus.ACTIVE,
        exerciseCount: selectedExercises.length,
      },
    });

    // Sanitize exercises before returning to client (NO expectedAnswer, NO isCorrect in options)
    const sanitizedExercises = selectedExercises.map((ex) => ({
      id: ex.id,
      type: ex.type,
      question: ex.question,
      promptAudioUrl: ex.promptAudioUrl,
      explanation: ex.explanation,
      hint: ex.hint,
      orderIndex: ex.orderIndex,
      xp: ex.xp,
      options: ex.options.map((opt: any) => ({
        id: opt.id,
        text: opt.text,
        orderIndex: opt.orderIndex,
      })),
    }));

    return {
      sessionId: session.id,
      sessionType: session.sessionType,
      status: session.status,
      exerciseCount: session.exerciseCount,
      startedAt: session.startedAt,
      exercises: sanitizedExercises,
      session: {
        id: session.id,
        sessionId: session.id,
        sessionType: session.sessionType,
        status: session.status,
        exerciseCount: session.exerciseCount,
        startedAt: session.startedAt,
        exercises: sanitizedExercises,
      },
    };
  }

  /**
   * Authoritatively evaluates a single exercise attempt during an active practice session.
   */
  async submitExercise(params: {
    sessionId: string;
    userId: string;
    exerciseId: string;
    userAnswer: string;
    timeSpentMs?: number;
  }) {
    return this.submitAnswer(params);
  }

  async submitAnswer(params: {
    sessionId: string;
    userId: string;
    exerciseId: string;
    userAnswer: string;
    timeSpentMs?: number;
  }) {
    const { sessionId, userId, exerciseId, userAnswer } = params;

    const session = await prisma.practiceSession.findFirst({
      where: {
        id: sessionId,
        userId,
        status: PracticeSessionStatus.ACTIVE,
      },
    });

    if (!session) {
      throw new Error('Active practice session not found.');
    }

    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
      include: { lesson: true, options: true },
    });

    if (!exercise) {
      throw new Error('Exercise not found.');
    }

    const cleanUser = userAnswer.trim().toLowerCase();
    const cleanExpected = exercise.expectedAnswer.trim().toLowerCase();
    const cleanAlternatives = exercise.acceptableAlternatives.map((a) => a.trim().toLowerCase());

    const matchedOption = exercise.options?.find(
      (o) => o.id === userAnswer || o.text.trim().toLowerCase() === cleanUser
    );

    const isCorrect =
      (matchedOption && matchedOption.isCorrect) ||
      cleanUser === cleanExpected ||
      cleanAlternatives.includes(cleanUser);

    const recordedAnswer = matchedOption ? matchedOption.text : userAnswer;

    if (isCorrect) {
      await prisma.practiceSession.update({
        where: { id: sessionId },
        data: { correctCount: { increment: 1 } },
      });

      // If resolving an active mistake, mark as resolved
      const activeMistake = await prisma.mistake.findFirst({
        where: {
          userId,
          exerciseId,
          isResolved: false,
        },
      });

      if (activeMistake) {
        await prisma.mistake.update({
          where: { id: activeMistake.id },
          data: {
            isResolved: true,
            resolvedAt: new Date(),
            lastReviewedAt: new Date(),
            retryCount: { increment: 1 },
          },
        });
      }
    } else {
      await prisma.practiceSession.update({
        where: { id: sessionId },
        data: { incorrectCount: { increment: 1 } },
      });

      // Record / update persistent mistake
      const existing = await prisma.mistake.findFirst({
        where: {
          userId,
          exerciseId,
          isResolved: false,
        },
      });

      if (existing) {
        await prisma.mistake.update({
          where: { id: existing.id },
          data: {
            userGivenAnswer: recordedAnswer,
            retryCount: { increment: 1 },
            practiceSessionId: sessionId,
            lastReviewedAt: new Date(),
          },
        });
      } else {
        await prisma.mistake.create({
          data: {
            userId,
            exerciseId,
            userGivenAnswer: recordedAnswer,
            practiceSessionId: sessionId,
            retryCount: 0,
            isResolved: false,
          },
        });
      }
    }

    return {
      exerciseId,
      isCorrect,
      expectedAnswer: exercise.expectedAnswer,
      explanation: exercise.explanation,
    };
  }

  /**
   * Completes a practice session and awards authoritative XP, gems, and records activity.
   */
  async completeSession(params: {
    sessionId: string;
    userId: string;
    durationSec: number;
  }) {
    const { sessionId, userId, durationSec } = params;

    const session = await prisma.practiceSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      throw new Error('Practice session not found.');
    }

    if (session.status === PracticeSessionStatus.COMPLETED) {
      return {
        sessionId: session.id,
        status: session.status,
        xpAwarded: session.xpAwarded,
        alreadyCompleted: true,
      };
    }

    // Calculate Practice Session XP: Base 15 XP + 3 XP per correct exercise
    const baseXp = ProgressionConfig.XP_REWARDS.PRACTICE_COMPLETED;
    const bonusXp = session.correctCount * ProgressionConfig.XP_REWARDS.PRACTICE_EXERCISE_CORRECT;
    const totalXpAward = baseXp + bonusXp;
    const gemsAward = ProgressionConfig.GEM_REWARDS.PRACTICE_COMPLETED;

    // Idempotently award XP
    const xpResult = await xpService.awardXp({
      userId,
      amount: totalXpAward,
      reason: 'PRACTICE_SESSION',
      idempotencyKey: `practice_session:${sessionId}`,
      referenceId: sessionId,
    });

    // Award Gems
    await currencyService.credit({
      userId,
      amount: gemsAward,
      reason: 'PRACTICE_SESSION',
      idempotencyKey: `practice_session_gem:${sessionId}`,
      referenceId: sessionId,
    });

    // Update Session
    const updated = await prisma.practiceSession.update({
      where: { id: sessionId },
      data: {
        status: PracticeSessionStatus.COMPLETED,
        completedAt: new Date(),
        durationSec: Math.max(1, durationSec),
        xpAwarded: totalXpAward,
      },
    });

    // Record activity time in Daily Goal (duration in minutes, min 1)
    const minutes = Math.max(1, Math.round(durationSec / 60));
    const dailyGoal = await dailyGoalService.recordActivityTime(userId, minutes);

    // Update Streak
    const streak = await streakService.recordActivity(userId);

    // Trigger Quest updates
    await questsService.recordQuestProgress(userId, 'COMPLETE_PRACTICE', 1);
    await questsService.recordQuestProgress(userId, 'COMPLETE_EXERCISES', session.correctCount);
    await questsService.recordQuestProgress(userId, 'EARN_XP', totalXpAward);

    // Trigger Achievement checks
    await achievementsService.unlockAchievement(userId, 'FIRST_PRACTICE');

    return {
      sessionId: updated.id,
      status: updated.status,
      xpAwarded: totalXpAward,
      gemsAwarded: gemsAward,
      totalXp: xpResult.totalXp,
      correctCount: updated.correctCount,
      incorrectCount: updated.incorrectCount,
      exerciseCount: updated.exerciseCount,
      durationSec: updated.durationSec,
      streak,
      dailyGoal,
    };
  }

  /**
   * Retrieves categorized mistakes for user review without revealing answer keys before attempt.
   * Resolves option IDs to human-readable strings if applicable.
   */
  async getMistakes(userId: string) {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    const targetLangId = user?.profile?.targetLanguageId;

    const mistakeWhere: any = { userId, isResolved: false };
    if (targetLangId) {
      mistakeWhere.exercise = {
        lesson: {
          unit: {
            section: {
              course: {
                languageId: targetLangId,
              },
            },
          },
        },
      };
    }

    const mistakes = await prisma.mistake.findMany({
      where: mistakeWhere,
      include: {
        exercise: {
          select: {
            id: true,
            question: true,
            type: true,
            difficulty: true,
            options: {
              select: { id: true, text: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const recent: any[] = [];
    const repeated: any[] = [];
    const older: any[] = [];

    for (const m of mistakes) {
      let displayAnswer = m.userGivenAnswer;
      // If user given answer was a raw option UUID, resolve it to option label text
      const matchedOption = m.exercise.options?.find((o: any) => o.id === m.userGivenAnswer);
      if (matchedOption) {
        displayAnswer = matchedOption.text;
      }

      const item = {
        id: m.id,
        exerciseId: m.exerciseId,
        question: m.exercise.question,
        type: m.exercise.type,
        difficulty: m.exercise.difficulty,
        userGivenAnswer: displayAnswer,
        retryCount: m.retryCount,
        lastReviewedAt: m.lastReviewedAt ? m.lastReviewedAt.toISOString() : null,
        createdAt: m.createdAt.toISOString(),
      };

      if (m.retryCount >= 1) {
        repeated.push(item);
      } else if (m.createdAt >= threeDaysAgo) {
        recent.push(item);
      } else {
        older.push(item);
      }
    }

    return {
      totalMistakes: mistakes.length,
      recent,
      repeated,
      older,
    };
  }

  /**
   * Retrieves vocabulary items for the user, tracking review intervals and confidence.
   * Strictly filtered by user's active target language.
   */
  async getVocabulary(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    const targetLangId = user?.profile?.targetLanguageId;

    const vocabWhere: any = { userId };
    if (targetLangId) {
      vocabWhere.word = { languageId: targetLangId };
    }

    const vocab = await prisma.userVocabulary.findMany({
      where: vocabWhere,
      include: { word: true },
      orderBy: { nextReviewAt: 'asc' },
    });

    const now = new Date();

    const items = vocab.map((uv) => ({
      id: uv.id,
      wordId: uv.wordId,
      word: uv.word.word,
      phonetic: uv.word.phonetic,
      translation: uv.word.translation,
      partOfSpeech: uv.word.partOfSpeech,
      level: uv.word.level,
      status: uv.status,
      confidence: uv.confidence,
      exposureCount: uv.exposureCount,
      correctCount: uv.correctCount,
      incorrectCount: uv.incorrectCount,
      repetitions: uv.repetitions,
      isDueForReview: uv.nextReviewAt <= now,
      nextReviewAt: uv.nextReviewAt.toISOString(),
      lastReviewedAt: uv.lastReviewedAt ? uv.lastReviewedAt.toISOString() : null,
    }));

    return {
      totalCount: items.length,
      dueCount: items.filter((i) => i.isDueForReview).length,
      words: items,
    };
  }
}

export const practiceService = new PracticeService();
