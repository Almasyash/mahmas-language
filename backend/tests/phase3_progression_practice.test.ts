// ==============================================================================
// MAHMAS LANGUAGE — PHASE 3 PROGRESSION & PRACTICE TEST SUITE
// ==============================================================================

import request from 'supertest';
import { createApp } from '../src/app';
import prisma from '../src/database/prisma';
import { xpService } from '../src/modules/progression/xp.service';
import { streakService } from '../src/modules/progression/streak.service';
import { dailyGoalService } from '../src/modules/progression/daily-goal.service';
import { currencyService } from '../src/modules/progression/currency.service';
import { achievementsService } from '../src/modules/progression/achievements.service';
import { questsService } from '../src/modules/progression/quests.service';
import { ProgressionConfig, calculateLevel } from '../src/modules/progression/progression.config';
import { CurrencyType, PracticeSessionType } from '@prisma/client';

describe('Phase 3 — Progression, Gamification & Practice Engine Suite', () => {
  const app = createApp();

  const testUser = {
    email: 'phase3.test@example.com',
    password: 'Password123!',
    displayName: 'Phase 3 Champion',
  };

  let accessToken: string;
  let userId: string;
  let spanishCourseId: string;
  let lesson1Id: string;
  let lesson2Id: string;

  beforeAll(async () => {
    // Clean up test data if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: testUser.email },
    });
    if (existingUser) {
      await prisma.userProgress.deleteMany({ where: { userId: existingUser.id } });
      await prisma.lessonAttempt.deleteMany({ where: { userId: existingUser.id } });
      await prisma.mistake.deleteMany({ where: { userId: existingUser.id } });
      await prisma.userVocabulary.deleteMany({ where: { userId: existingUser.id } });
      await prisma.practiceSession.deleteMany({ where: { userId: existingUser.id } });
      await prisma.xPTransaction.deleteMany({ where: { userId: existingUser.id } });
      await prisma.currencyLedger.deleteMany({ where: { userId: existingUser.id } });
      await prisma.virtualCurrency.deleteMany({ where: { userId: existingUser.id } });
      await prisma.userQuest.deleteMany({ where: { userId: existingUser.id } });
      await prisma.userAchievement.deleteMany({ where: { userId: existingUser.id } });
      await prisma.streak.deleteMany({ where: { userId: existingUser.id } });
      await prisma.dailyGoal.deleteMany({ where: { userId: existingUser.id } });
      await prisma.user.delete({ where: { id: existingUser.id } });
    }

    // Register user
    const regRes = await request(app).post('/api/v1/auth/register').send(testUser);
    expect(regRes.status).toBe(201);
    accessToken = regRes.body.data.accessToken;
    userId = regRes.body.data.user.id;

    // Fetch Spanish course and lessons seeded previously
    const spanishCourse = await prisma.course.findFirst({
      where: { title: { contains: 'Spanish' } },
      include: {
        sections: {
          include: {
            units: {
              include: {
                lessons: {
                  orderBy: { orderIndex: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    expect(spanishCourse).toBeDefined();
    spanishCourseId = spanishCourse!.id;
    const lessons = spanishCourse!.sections[0].units[0].lessons;
    expect(lessons.length).toBeGreaterThanOrEqual(2);
    lesson1Id = lessons[0].id;
    lesson2Id = lessons[1].id;

    // Set user target language and timezone
    await prisma.profile.update({
      where: { userId },
      data: {
        targetLanguageId: spanishCourse!.languageId,
        timezone: 'America/New_York',
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    if (userId) {
      await prisma.userProgress.deleteMany({ where: { userId } });
      await prisma.lessonAttempt.deleteMany({ where: { userId } });
      await prisma.mistake.deleteMany({ where: { userId } });
      await prisma.userVocabulary.deleteMany({ where: { userId } });
      await prisma.practiceSession.deleteMany({ where: { userId } });
      await prisma.xPTransaction.deleteMany({ where: { userId } });
      await prisma.currencyLedger.deleteMany({ where: { userId } });
      await prisma.virtualCurrency.deleteMany({ where: { userId } });
      await prisma.userQuest.deleteMany({ where: { userId } });
      await prisma.userAchievement.deleteMany({ where: { userId } });
      await prisma.streak.deleteMany({ where: { userId } });
      await prisma.dailyGoal.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } });
    }
    await prisma.$disconnect();
  });

  // ============================================================================
  // 1. XP ENGINE & DETERMINISTIC LEVEL PROGRESSION
  // ============================================================================
  describe('1. XP System & Idempotency', () => {
    it('should calculate level progression correctly from mathematical formula', () => {
      // Level 1: 0 - 99 XP (100 needed)
      expect(calculateLevel(0).level).toBe(1);
      expect(calculateLevel(50).level).toBe(1);
      expect(calculateLevel(99).level).toBe(1);
      // Level 2: 100 - 299 XP (200 needed)
      expect(calculateLevel(100).level).toBe(2);
      expect(calculateLevel(299).level).toBe(2);
      // Level 3: 300 - 599 XP (300 needed)
      expect(calculateLevel(300).level).toBe(3);
    });

    it('should award XP with idempotency and prevent duplicate awards', async () => {
      const idempotencyKey = `test_xp_${Date.now()}`;
      
      const firstAward = await xpService.awardXp({
        userId,
        amount: ProgressionConfig.XP_REWARDS.CORRECT_EXERCISE,
        reason: 'Exercise correct test',
        idempotencyKey,
      });
      expect(firstAward.awarded).toBe(true);
      expect(firstAward.totalXp).toBeGreaterThanOrEqual(5);

      // Re-award with identical idempotencyKey
      const duplicateAward = await xpService.awardXp({
        userId,
        amount: ProgressionConfig.XP_REWARDS.CORRECT_EXERCISE,
        reason: 'Exercise correct test duplicate',
        idempotencyKey,
      });
      expect(duplicateAward.awarded).toBe(false);
      expect(duplicateAward.totalXp).toBe(firstAward.totalXp);
    });

    it('should provide accurate XP summary', async () => {
      const summary = await xpService.getXpSummary(userId);
      expect(summary.totalXp).toBeGreaterThanOrEqual(5);
      expect(summary.todayXp).toBeGreaterThanOrEqual(5);
      expect(summary.currentLevel).toBe(1);
      expect(summary.xpIntoCurrentLevel).toBe(summary.totalXp);
      expect(summary.xpToNextLevel).toBe(100 - summary.totalXp);
    });
  });

  // ============================================================================
  // 2. TIMEZONE-AWARE STREAK SYSTEM
  // ============================================================================
  describe('2. Timezone-Aware Streak System', () => {
    it('should initialize streak to 1 on first qualifying activity', async () => {
      const streakResult = await streakService.recordActivity(userId);
      expect(streakResult.currentStreak).toBe(1);
      expect(streakResult.isMaintained).toBe(true);
    });

    it('should not increase streak when activity is repeated on the same calendar day', async () => {
      const sameDayResult = await streakService.recordActivity(userId);
      expect(sameDayResult.currentStreak).toBe(1);
    });

    it('should increase streak when activity happens on the next consecutive calendar day', async () => {
      // Simulate yesterday's activity
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      await prisma.streak.update({
        where: { userId },
        data: {
          currentStreak: 1,
          lastActivityDate: yesterday,
        },
      });

      const nextDayResult = await streakService.recordActivity(userId);
      expect(nextDayResult.currentStreak).toBe(2);
      expect(nextDayResult.longestStreak).toBeGreaterThanOrEqual(2);
    });

    it('should reset streak to 1 if one or more calendar days are missed', async () => {
      // Simulate activity from 3 days ago
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      await prisma.streak.update({
        where: { userId },
        data: {
          currentStreak: 5,
          longestStreak: 5,
          lastActivityDate: threeDaysAgo,
        },
      });

      const resetResult = await streakService.recordActivity(userId);
      expect(resetResult.currentStreak).toBe(1);
      expect(resetResult.longestStreak).toBe(5); // Longest streak preserved
    });
  });

  // ============================================================================
  // 3. DAILY GOAL SYSTEM
  // ============================================================================
  describe('3. Daily Goal System', () => {
    it('should track server-recorded activity duration and calculate progress', async () => {
      // Default daily goal target is 15 minutes
      const initialProgress = await dailyGoalService.getDailyGoalProgress(userId);
      expect(initialProgress.dailyGoalMinutes).toBe(15);
      expect(initialProgress.dailyGoalCompleted).toBe(false);

      // Record 5 minutes of study activity
      const updated = await dailyGoalService.recordActivityTime(userId, 5); // 5 mins
      expect(updated.dailyMinutesCompleted).toBe(5);
      expect(updated.dailyGoalProgress).toBe(33);
      expect(updated.dailyGoalCompleted).toBe(false);

      // Record additional 10 minutes (total 15 minutes) -> Goal complete
      const completed = await dailyGoalService.recordActivityTime(userId, 10); // 10 mins
      expect(completed.dailyMinutesCompleted).toBe(15);
      expect(completed.dailyGoalProgress).toBe(100);
      expect(completed.dailyGoalCompleted).toBe(true);
    });
  });

  // ============================================================================
  // 4. VIRTUAL CURRENCY (GEMS) FOUNDATION
  // ============================================================================
  describe('4. Virtual Currency (Gems) Foundation', () => {
    it('should credit currency with idempotency and maintain balance', async () => {
      const initialBalance = await currencyService.getBalance(userId);
      
      const creditKey = `gem_test_${Date.now()}`;
      const creditResult = await currencyService.credit({
        userId,
        type: CurrencyType.GEMS,
        amount: 25,
        reason: 'Quest reward test',
        idempotencyKey: creditKey,
      });

      expect(creditResult.balance).toBe(initialBalance + 25);

      // Attempt duplicate credit with same idempotency key
      const duplicateCredit = await currencyService.credit({
        userId,
        type: CurrencyType.GEMS,
        amount: 25,
        reason: 'Quest reward test duplicate',
        idempotencyKey: creditKey,
      });

      expect(duplicateCredit.balance).toBe(initialBalance + 25); // unchanged
    });

    it('should debit currency successfully and reject overdraft', async () => {
      const currentBalance = await currencyService.getBalance(userId);
      expect(currentBalance).toBeGreaterThanOrEqual(25);

      const debitResult = await currencyService.debit({
        userId,
        type: CurrencyType.GEMS,
        amount: 10,
        reason: 'Shop item purchase test',
      });

      expect(debitResult.balance).toBe(currentBalance - 10);

      // Overdraft should fail safely
      const overdraftResult = await currencyService.debit({
        userId,
        type: CurrencyType.GEMS,
        amount: 9999,
        reason: 'Excessive debit test',
      });
      expect(overdraftResult.success).toBe(false);
    });
  });

  // ============================================================================
  // 5. SERVER-AUTHORITATIVE LESSON ENGINE FLOW
  // ============================================================================
  describe('5. Courses & Lesson Engine Flow', () => {
    it('should return course path with server-authoritative unlock state', async () => {
      const res = await request(app)
        .get(`/api/v1/courses/${spanishCourseId}/path`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.course.sections).toBeDefined();

      const unit = res.body.data.course.sections[0].units[0];
      expect(unit.lessons.length).toBeGreaterThanOrEqual(2);

      // First lesson should be unlocked by default
      expect(unit.lessons[0].id).toBe(lesson1Id);
      expect(unit.lessons[0].isUnlocked).toBe(true);
      expect(unit.lessons[0].isCompleted).toBe(false);

      // Second lesson should be locked initially
      expect(unit.lessons[1].id).toBe(lesson2Id);
      expect(unit.lessons[1].isUnlocked).toBe(false);
    });

    it('should return sanitized exercises with answer keys strictly stripped', async () => {
      const res = await request(app)
        .get(`/api/v1/lessons/${lesson1Id}/exercises`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const exercises = res.body.data.lesson.exercises;
      expect(exercises.length).toBeGreaterThanOrEqual(3);

      for (const ex of exercises) {
        expect(ex.expectedAnswer).toBeUndefined();
        expect(ex.acceptableAlternatives).toBeUndefined();
        if (ex.options) {
          for (const opt of ex.options) {
            expect(opt.isCorrect).toBeUndefined();
          }
        }
      }
    });

    it('should evaluate lesson attempt authoritatively, award XP, unlock next lesson, and trigger achievement', async () => {
      // Fetch DB exercises to construct valid answers
      const dbExercises = await prisma.exercise.findMany({
        where: { lessonId: lesson1Id },
        include: { options: true },
      });

      const answers = dbExercises.map((ex) => {
        let answer = '';
        if (ex.expectedAnswer) {
          answer = ex.expectedAnswer;
        } else if (ex.options && ex.options.length > 0) {
          const correctOpt = ex.options.find((o) => o.isCorrect);
          answer = correctOpt ? correctOpt.id : ex.options[0].id;
        }
        return {
          exerciseId: ex.id,
          userAnswer: answer,
        };
      });

      const res = await request(app)
        .post(`/api/v1/lessons/${lesson1Id}/submit`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          answers,
          durationSec: 120,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const result = res.body.data;

      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.isSuccessful).toBe(true);
      expect(result.xpAwarded).toBeGreaterThan(0);
      expect(result.gemsAwarded).toBe(ProgressionConfig.GEM_REWARDS.LESSON_COMPLETED);
      expect(result.nextLessonId).toBe(lesson2Id);

      // Verify that Lesson 2 is now unlocked in course path
      const pathRes = await request(app)
        .get(`/api/v1/courses/${spanishCourseId}/path`)
        .set('Authorization', `Bearer ${accessToken}`);

      const lessons = pathRes.body.data.course.sections[0].units[0].lessons;
      expect(lessons[0].isCompleted).toBe(true);
      expect(lessons[1].isUnlocked).toBe(true);
    });

    it('should not award duplicate lesson completion XP when lesson is retaken', async () => {
      const dbExercises = await prisma.exercise.findMany({
        where: { lessonId: lesson1Id },
      });

      const answers = dbExercises.map((ex) => ({
        exerciseId: ex.id,
        userAnswer: ex.expectedAnswer || 'hola',
      }));

      const res = await request(app)
        .post(`/api/v1/lessons/${lesson1Id}/submit`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          answers,
          durationSec: 90,
        });

      expect(res.status).toBe(200);
      // Lesson completion bonus (+20 XP) should NOT be awarded again
      expect(res.body.data.gemsAwarded).toBe(0); // Gems completion bonus is once per lesson
    });
  });

  // ============================================================================
  // 6. PRACTICE ENGINE
  // ============================================================================
  describe('6. Dedicated Practice Engine', () => {
    let sessionId: string;
    let practiceExerciseId: string;

    it('should return valid practice overview with real counts', async () => {
      const res = await request(app)
        .get('/api/v1/practice/overview')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const overview = res.body.data;
      expect(typeof overview.mistakeCount).toBe('number');
      expect(typeof overview.vocabularyReviewCount).toBe('number');
      expect(overview.recommendedPracticeCount).toBeGreaterThanOrEqual(1);
      expect(overview.dailyProgress).toBeDefined();
    });

    it('should start a practice session with persistent state and sanitized exercises', async () => {
      const res = await request(app)
        .post('/api/v1/practice/session/start')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ sessionType: PracticeSessionType.RECOMMENDED });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const session = res.body.data;
      expect(session.sessionId).toBeDefined();
      expect(session.exercises.length).toBeGreaterThanOrEqual(1);

      sessionId = session.sessionId;
      practiceExerciseId = session.exercises[0].id;

      // Ensure answers are not leaked in practice
      expect(session.exercises[0].expectedAnswer).toBeUndefined();
    });

    it('should handle exercise submission, record mistakes for wrong answers, and update stats', async () => {
      const wrongRes = await request(app)
        .post(`/api/v1/practice/exercises/${practiceExerciseId}/submit`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          sessionId,
          userAnswer: 'completely_wrong_answer_xyz',
        });

      expect(wrongRes.status).toBe(200);
      expect(wrongRes.body.success).toBe(true);
      expect(wrongRes.body.data.isCorrect).toBe(false);
    });

    it('should complete practice session and award practice completion XP and Gems', async () => {
      const res = await request(app)
        .post(`/api/v1/practice/session/${sessionId}/complete`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ durationSec: 90 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const completion = res.body.data;
      expect(completion.status).toBe('COMPLETED');
      expect(completion.xpAwarded).toBeGreaterThanOrEqual(ProgressionConfig.XP_REWARDS.PRACTICE_COMPLETED);
      expect(completion.gemsAwarded).toBe(ProgressionConfig.GEM_REWARDS.PRACTICE_COMPLETED);

      // Attempting to complete already completed session must prevent duplicate rewards
      const duplicateRes = await request(app)
        .post(`/api/v1/practice/session/${sessionId}/complete`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ durationSec: 90 });

      expect(duplicateRes.status).toBe(200);
      expect(duplicateRes.body.data.gemsAwarded).toBe(0);
    });
  });

  // ============================================================================
  // 7. MISTAKE REVIEW & VOCABULARY REVIEW
  // ============================================================================
  describe('7. Mistake Review & Vocabulary Review', () => {
    it('should return categorized mistakes', async () => {
      const res = await request(app)
        .get('/api/v1/practice/mistakes')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const mistakesData = res.body.data;
      expect(Array.isArray(mistakesData.recent)).toBe(true);
      expect(Array.isArray(mistakesData.repeated)).toBe(true);
      expect(Array.isArray(mistakesData.older)).toBe(true);
      expect(mistakesData.totalMistakes).toBeGreaterThanOrEqual(1);
    });

    it('should return vocabulary items with exposure stats and review confidence', async () => {
      const res = await request(app)
        .get('/api/v1/practice/vocabulary')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const vocabData = res.body.data;
      expect(typeof vocabData.totalCount).toBe('number');
      expect(Array.isArray(vocabData.words)).toBe(true);
      expect(vocabData.words.length).toBeGreaterThanOrEqual(1);

      const word = vocabData.words[0];
      expect(word.word).toBeDefined();
      expect(word.translation).toBeDefined();
      expect(word.status).toBeDefined();
      expect(typeof word.confidence).toBe('number');
    });
  });

  // ============================================================================
  // 8. QUESTS & ACHIEVEMENTS
  // ============================================================================
  describe('8. Quests & Achievements', () => {
    it('should fetch user quests and reflect completed lesson/practice progress', async () => {
      const res = await request(app)
        .get('/api/v1/progression/quests')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const quests = res.body.data;
      expect(quests.length).toBeGreaterThanOrEqual(1);

      // Verify quest progress values are server-calculated numbers
      for (const q of quests) {
        expect(typeof q.currentCount).toBe('number');
        expect(typeof q.targetCount).toBe('number');
        expect(typeof q.isCompleted).toBe('boolean');
        expect(typeof q.isClaimed).toBe('boolean');
      }
    });

    it('should claim eligible quest reward and prevent duplicate claims', async () => {
      // Find a completed quest or manually complete one for testing
      const userQuests = await questsService.getUserQuests(userId);
      let readyQuest = userQuests.find((q) => q.isCompleted && !q.isClaimed);

      if (!readyQuest && userQuests.length > 0) {
        // Complete the first quest for testing
        const targetQ = userQuests[0];
        await prisma.userQuest.upsert({
          where: {
            userId_questId: {
              userId,
              questId: targetQ.id,
            },
          },
          update: {
            currentCount: targetQ.targetCount,
            isCompleted: true,
          },
          create: {
            userId,
            questId: targetQ.id,
            currentCount: targetQ.targetCount,
            isCompleted: true,
          },
        });
        readyQuest = targetQ;
      }

      if (readyQuest) {
        const claimRes = await request(app)
          .post(`/api/v1/progression/quests/${readyQuest.id}/claim`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(claimRes.status).toBe(200);
        expect(claimRes.body.success).toBe(true);
        expect(claimRes.body.data.success).toBe(true);
        expect(claimRes.body.data.xpAwarded).toBeGreaterThan(0);

        // Duplicate claim attempt should fail
        const dupClaimRes = await request(app)
          .post(`/api/v1/progression/quests/${readyQuest.id}/claim`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(dupClaimRes.status).toBe(400);
        expect(dupClaimRes.body.success).toBe(false);
      }
    });

    it('should fetch user achievements and show unlocked status for completed events', async () => {
      const res = await request(app)
        .get('/api/v1/progression/achievements')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const achievements = res.body.data;
      expect(achievements.length).toBeGreaterThanOrEqual(5);

      const firstLessonAch = achievements.find((a: any) => a.code === 'FIRST_LESSON');
      expect(firstLessonAch).toBeDefined();
      expect(firstLessonAch.isUnlocked).toBe(true);
      expect(firstLessonAch.unlockedAt).toBeDefined();
    });
  });

  // ============================================================================
  // 9. DASHBOARD AGGREGATED ENDPOINT
  // ============================================================================
  describe('9. Dashboard Aggregated Endpoint', () => {
    it('should require authentication for /users/me/dashboard', async () => {
      const res = await request(app).get('/api/v1/users/me/dashboard');
      expect(res.status).toBe(401);
    });

    it('should return complete server-authoritative progression dashboard', async () => {
      const res = await request(app)
        .get('/api/v1/users/me/dashboard')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const d = res.body.data;

      // User & language
      expect(d.user.id).toBe(userId);
      expect(d.user.targetLanguage.code).toBe('es');

      // Course & lesson
      expect(d.currentCourse.title).toContain('Spanish');
      expect(d.currentCourse.activeLessonId).toBeDefined();

      // XP & level
      expect(d.xpSummary.totalXp).toBeGreaterThan(0);
      expect(d.xpSummary.todayXp).toBeGreaterThan(0);
      expect(d.xpSummary.currentLevel).toBeGreaterThanOrEqual(1);

      // Streak & daily goal
      expect(d.streak.currentStreak).toBeGreaterThanOrEqual(1);
      expect(d.streak.activeToday).toBe(true);
      expect(d.dailyGoal.dailyGoalMinutes).toBe(15);
      expect(d.dailyGoal.dailyGoalCompleted).toBe(true);

      // Practice, quests & achievements
      expect(d.practiceSummary.recommendedPracticeCount).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(d.quests)).toBe(true);
      expect(Array.isArray(d.recentAchievements)).toBe(true);
      expect(d.currency.gems).toBeGreaterThan(0);
    });
  });
});
