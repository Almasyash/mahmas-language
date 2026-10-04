// ==============================================================================
// MAHMAS LANGUAGE — LESSONS SERVICE
// Server-authoritative lesson runner, exercise delivery, and evaluation engine
// ==============================================================================

import { prisma } from '../../database/prisma';
import { xpService } from '../progression/xp.service';
import { streakService } from '../progression/streak.service';
import { dailyGoalService } from '../progression/daily-goal.service';
import { currencyService } from '../progression/currency.service';
import { questsService } from '../progression/quests.service';
import { achievementsService } from '../progression/achievements.service';
import { ProgressionConfig } from '../progression/progression.config';
import { VocabularyStatus } from '@prisma/client';

export interface AnswerSubmission {
  exerciseId: string;
  userAnswer: string;
  timeSpentMs?: number;
}

export class LessonsService {
  /**
   * Fetches exercises for a lesson.
   * STRICT SECURITY: Never leaks expectedAnswer or option correctness to the client.
   */
  async getLessonExercises(lessonId: string, _userId: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        exercises: {
          orderBy: { orderIndex: 'asc' },
          include: {
            options: {
              select: {
                id: true,
                text: true,
                orderIndex: true,
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      throw new Error('Lesson not found.');
    }

    const sanitizedExercises = lesson.exercises.map((ex) => ({
      id: ex.id,
      type: ex.type,
      question: ex.question,
      promptAudioUrl: ex.promptAudioUrl,
      explanation: ex.explanation,
      hint: ex.hint,
      orderIndex: ex.orderIndex,
      xp: ex.xp,
      options: ex.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        orderIndex: opt.orderIndex,
      })),
    }));

    return {
      lesson: {
        id: lesson.id,
        title: lesson.title,
        xpReward: lesson.xpReward,
        gemReward: lesson.gemReward,
        exercises: sanitizedExercises,
      },
    };
  }

  /**
   * Authoritatively evaluates a lesson attempt submission.
   */
  async submitLessonAttempt(params: {
    lessonId: string;
    userId: string;
    answers: AnswerSubmission[];
    durationSec: number;
  }) {
    const { lessonId, userId, answers, durationSec } = params;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        exercises: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new Error('Lesson not found.');
    }

    const exerciseMap = new Map(lesson.exercises.map((e) => [e.id, e]));

    let correctCount = 0;
    let exerciseXpTotal = 0;
    const mistakesToRecord: { exerciseId: string; userGivenAnswer: string }[] = [];
    const evaluationResults: any[] = [];

    for (const ans of answers) {
      const exercise = exerciseMap.get(ans.exerciseId);
      if (!exercise) continue;

      const cleanUser = (ans.userAnswer || '').trim().toLowerCase();
      const cleanExpected = (exercise.expectedAnswer || '').trim().toLowerCase();
      const cleanAlternatives = (exercise.acceptableAlternatives || []).map((a: string) => (a || '').trim().toLowerCase());

      const matchedOption = exercise.options?.find(
        (o) => o.id === ans.userAnswer || o.text.trim().toLowerCase() === cleanUser
      );

      const isCorrect =
        (matchedOption && matchedOption.isCorrect) ||
        cleanUser === cleanExpected ||
        cleanAlternatives.includes(cleanUser);

      const recordedAnswer = matchedOption ? matchedOption.text : ans.userAnswer;

      if (isCorrect) {
        correctCount += 1;
        exerciseXpTotal += ProgressionConfig.XP_REWARDS.CORRECT_EXERCISE;
      } else {
        mistakesToRecord.push({
          exerciseId: exercise.id,
          userGivenAnswer: recordedAnswer,
        });
      }

      evaluationResults.push({
        exerciseId: exercise.id,
        isCorrect,
        expectedAnswer: exercise.expectedAnswer,
        explanation: exercise.explanation,
      });
    }

    const totalQuestions = answers.length > 0 ? answers.length : lesson.exercises.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const isSuccessful = score >= ProgressionConfig.LESSON_PASSING_SCORE_PERCENT;

    // Check if this lesson was already completed successfully before
    const previousSuccessfulAttempts = await prisma.lessonAttempt.count({
      where: {
        userId,
        lessonId,
        isSuccessful: true,
      },
    });
    const isFirstTimeCompletion = isSuccessful && previousSuccessfulAttempts === 0;

    let lessonCompletionXp = 0;
    let gemsAwarded = 0;

    if (isFirstTimeCompletion) {
      lessonCompletionXp = lesson.xpReward || ProgressionConfig.XP_REWARDS.LESSON_COMPLETED;
      gemsAwarded = lesson.gemReward || ProgressionConfig.GEM_REWARDS.LESSON_COMPLETED;
    }

    const totalXpAwarded = exerciseXpTotal + lessonCompletionXp;

    // Create persistent LessonAttempt record
    const attempt = await prisma.lessonAttempt.create({
      data: {
        userId,
        lessonId,
        score,
        durationSec: Math.max(1, durationSec),
        isSuccessful,
        xpEarned: totalXpAwarded,
        gemsEarned: gemsAwarded,
      },
    });

    // Award Exercise XP (idempotent per attempt)
    if (exerciseXpTotal > 0) {
      await xpService.awardXp({
        userId,
        amount: exerciseXpTotal,
        reason: 'EXERCISE_CORRECT',
        idempotencyKey: `attempt_exercise_xp:${attempt.id}`,
        referenceId: attempt.id,
      });
    }

    // Award Lesson Completion XP (idempotent per lesson)
    if (lessonCompletionXp > 0) {
      await xpService.awardXp({
        userId,
        amount: lessonCompletionXp,
        reason: 'LESSON_COMPLETED',
        idempotencyKey: `lesson_completion_xp:${lessonId}:${userId}`,
        referenceId: lessonId,
      });

      // Award Gems
      await currencyService.credit({
        userId,
        amount: gemsAwarded,
        reason: 'LESSON_COMPLETED',
        idempotencyKey: `lesson_completion_gem:${lessonId}:${userId}`,
        referenceId: lessonId,
      });

      // Quest progress
      await questsService.recordQuestProgress(userId, 'COMPLETE_LESSONS', 1);

      // Achievement unlock
      await achievementsService.unlockAchievement(userId, 'FIRST_LESSON');
    }

    // Record Mistakes in DB
    for (const m of mistakesToRecord) {
      const existing = await prisma.mistake.findFirst({
        where: {
          userId,
          exerciseId: m.exerciseId,
          isResolved: false,
        },
      });

      if (existing) {
        await prisma.mistake.update({
          where: { id: existing.id },
          data: {
            userGivenAnswer: m.userGivenAnswer,
            retryCount: { increment: 1 },
            lessonAttemptId: attempt.id,
            lastReviewedAt: new Date(),
          },
        });
      } else {
        await prisma.mistake.create({
          data: {
            userId,
            exerciseId: m.exerciseId,
            userGivenAnswer: m.userGivenAnswer,
            lessonAttemptId: attempt.id,
            retryCount: 0,
            isResolved: false,
          },
        });
      }
    }

    // Update Daily Goal (learning minutes)
    const minutes = Math.max(1, Math.round(durationSec / 60));
    const dailyGoal = await dailyGoalService.recordActivityTime(userId, minutes);

    // Update Streak
    const streak = await streakService.recordActivity(userId);

    // Update Quests for exercises and XP
    if (correctCount > 0) {
      await questsService.recordQuestProgress(userId, 'COMPLETE_EXERCISES', correctCount);
    }
    if (totalXpAwarded > 0) {
      await questsService.recordQuestProgress(userId, 'EARN_XP', totalXpAwarded);
    }

    // Check for XP-based achievements
    const xpSummary = await xpService.getXpSummary(userId);
    if (xpSummary.totalXp >= 100) {
      await achievementsService.unlockAchievement(userId, 'FIRST_100_XP');
    }

    // Expose vocabulary words for the language if not already exposed
    const lessonUnit = await prisma.courseUnit.findUnique({
      where: { id: lesson.unitId },
      include: { section: { include: { course: true } } },
    });
    const languageId = lessonUnit?.section?.course?.languageId;

    if (languageId) {
      const words = await prisma.vocabularyWord.findMany({
        where: { languageId },
        take: 5,
      });

      for (const w of words) {
        await prisma.userVocabulary.upsert({
          where: {
            userId_wordId: {
              userId,
              wordId: w.id,
            },
          },
          update: {
            exposureCount: { increment: 1 },
            correctCount: isSuccessful ? { increment: 1 } : undefined,
            confidence: isSuccessful ? 0.7 : 0.4,
            status: isSuccessful ? VocabularyStatus.LEARNING : VocabularyStatus.NEW,
            lastReviewedAt: new Date(),
            nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
          create: {
            userId,
            wordId: w.id,
            status: isSuccessful ? VocabularyStatus.LEARNING : VocabularyStatus.NEW,
            exposureCount: 1,
            correctCount: isSuccessful ? 1 : 0,
            incorrectCount: isSuccessful ? 0 : 1,
            confidence: isSuccessful ? 0.7 : 0.3,
            lastReviewedAt: new Date(),
            nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });
      }
    }

    // Determine next lesson ID
    const nextLesson = await prisma.lesson.findFirst({
      where: {
        unitId: lesson.unitId,
        orderIndex: { gt: lesson.orderIndex },
      },
      orderBy: { orderIndex: 'asc' },
    });

    return {
      attemptId: attempt.id,
      isSuccessful,
      score,
      xpAwarded: totalXpAwarded,
      gemsAwarded,
      totalXp: xpSummary.totalXp,
      streak,
      dailyGoal,
      evaluations: evaluationResults,
      mistakesCount: mistakesToRecord.length,
      nextLessonId: nextLesson?.id || null,
    };
  }
}

export const lessonsService = new LessonsService();
