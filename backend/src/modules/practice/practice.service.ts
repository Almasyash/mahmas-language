// ==============================================================================
// MAHMAS LANGUAGE — PRACTICE SERVICE
// Authoritative practice session runner, exercise selection, mistake & vocab review
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
   * Retrieves practice overview statistics for the user.
   */
  async getOverview(userId: string) {
    const now = new Date();

    // 1. Unresolved mistakes count
    const mistakeCount = await prisma.mistake.count({
      where: {
        userId,
        isResolved: false,
      },
    });

    // 2. Vocabulary words due for review
    const vocabularyReviewCount = await prisma.userVocabulary.count({
      where: {
        userId,
        nextReviewAt: { lte: now },
      },
    });

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
   * Starts a new authoritative practice session and selects priority exercises.
   */
  async startSession(userId: string, sessionType: PracticeSessionType = PracticeSessionType.RECOMMENDED) {
    const selectedExercises: any[] = [];
    const exerciseIdSet = new Set<string>();

    // 1. Prioritize unresolved mistakes
    const unresolvedMistakes = await prisma.mistake.findMany({
      where: {
        userId,
        isResolved: false,
      },
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

    // 2. Add course exercises to fulfill practice size (up to 5 exercises)
    if (selectedExercises.length < 5) {
      const additionalExercises = await prisma.exercise.findMany({
        where: {
          id: { notIn: Array.from(exerciseIdSet) },
        },
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
      exerciseCount: sanitizedExercises.length,
      exercises: sanitizedExercises,
    };
  }

  /**
   * Authoritatively evaluates an individual exercise submission during a practice session.
   */
  async submitExercise(params: {
    sessionId: string;
    exerciseId: string;
    userId: string;
    userAnswer: string;
  }) {
    const { sessionId, exerciseId, userId, userAnswer } = params;

    const session = await prisma.practiceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId || session.status !== PracticeSessionStatus.ACTIVE) {
      throw new Error('Active practice session not found.');
    }

    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
    });

    if (!exercise) {
      throw new Error('Exercise not found.');
    }

    // Evaluate answer correctness server-side
    const cleanUser = userAnswer.trim().toLowerCase();
    const cleanExpected = exercise.expectedAnswer.trim().toLowerCase();
    const cleanAlternatives = exercise.acceptableAlternatives.map((a) => a.trim().toLowerCase());

    const isCorrect = cleanUser === cleanExpected || cleanAlternatives.includes(cleanUser);

    if (isCorrect) {
      // Increment session correct count
      await prisma.practiceSession.update({
        where: { id: sessionId },
        data: { correctCount: { increment: 1 } },
      });

      // If an existing mistake existed for this exercise, mark as resolved
      const existingMistake = await prisma.mistake.findFirst({
        where: {
          userId,
          exerciseId,
          isResolved: false,
        },
      });

      if (existingMistake) {
        await prisma.mistake.update({
          where: { id: existingMistake.id },
          data: {
            isResolved: true,
            resolvedAt: new Date(),
            lastReviewedAt: new Date(),
          },
        });
      }
    } else {
      // Increment session incorrect count
      await prisma.practiceSession.update({
        where: { id: sessionId },
        data: { incorrectCount: { increment: 1 } },
      });

      // Record mistake
      const existingMistake = await prisma.mistake.findFirst({
        where: {
          userId,
          exerciseId,
          isResolved: false,
        },
      });

      if (existingMistake) {
        await prisma.mistake.update({
          where: { id: existingMistake.id },
          data: {
            userGivenAnswer: userAnswer,
            retryCount: { increment: 1 },
            lastReviewedAt: new Date(),
            practiceSessionId: sessionId,
          },
        });
      } else {
        await prisma.mistake.create({
          data: {
            userId,
            exerciseId,
            userGivenAnswer: userAnswer,
            practiceSessionId: sessionId,
            retryCount: 0,
            isResolved: false,
          },
        });
      }
    }

    return {
      isCorrect,
      expectedAnswer: exercise.expectedAnswer,
      explanation: exercise.explanation,
      hint: exercise.hint,
    };
  }

  /**
   * Completes a practice session, computes duration, awards XP/Gems with idempotency,
   * and updates user streaks and daily goals.
   */
  async completeSession(params: {
    sessionId: string;
    userId: string;
    durationSec: number;
  }) {
    const { sessionId, userId, durationSec } = params;

    const session = await prisma.practiceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new Error('Practice session not found.');
    }

    if (session.status === PracticeSessionStatus.COMPLETED) {
      return {
        sessionId: session.id,
        status: session.status,
        xpAwarded: session.xpAwarded,
        gemsAwarded: 0,
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
   */
  async getMistakes(userId: string) {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const mistakes = await prisma.mistake.findMany({
      where: {
        userId,
        isResolved: false,
      },
      include: {
        exercise: {
          select: {
            id: true,
            question: true,
            type: true,
            difficulty: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const recent: any[] = [];
    const repeated: any[] = [];
    const older: any[] = [];

    for (const m of mistakes) {
      const item = {
        id: m.id,
        exerciseId: m.exerciseId,
        question: m.exercise.question,
        type: m.exercise.type,
        difficulty: m.exercise.difficulty,
        userGivenAnswer: m.userGivenAnswer,
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
   */
  async getVocabulary(userId: string) {
    const vocab = await prisma.userVocabulary.findMany({
      where: { userId },
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
