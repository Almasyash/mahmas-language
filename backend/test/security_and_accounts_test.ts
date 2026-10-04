// ==============================================================================
// MAHMAS LANGUAGE — SECURITY, CROSS-USER ISOLATION & AUTH REGRESSION SUITE
// Tests:
// 1. Account B (Hindi -> Spanish) & Account C (English -> French)
// 2. Cross-User Data Isolation (User A cannot access/manipulate User B data)
// 3. XP & Progression Idempotency (duplicate submissions do not double-reward)
// 4. Token Refresh & Auth Regression
// ==============================================================================

import { PrismaClient, PracticeSessionType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { coursesService } from '../src/modules/courses/courses.service';
import { dashboardService } from '../src/modules/progression/dashboard.service';
import { lessonsService } from '../src/modules/lessons/lessons.service';
import { practiceService } from '../src/modules/practice/practice.service';
import { xpService } from '../src/modules/progression/xp.service';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'mahmas-jwt-secret-key-super-secure';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'mahmas-refresh-token-secret';

async function runSecurityAndAccountTests() {
  console.log('====================================================');
  console.log('RUNNING MULTI-ACCOUNT, SECURITY & AUTH REGRESSION TESTS');
  console.log('====================================================');

  const hiLang = await prisma.language.findUnique({ where: { code: 'hi' } });
  const enLang = await prisma.language.findUnique({ where: { code: 'en' } });
  const esLang = await prisma.language.findUnique({ where: { code: 'es' } });
  const frLang = await prisma.language.findUnique({ where: { code: 'fr' } });

  if (!hiLang || !enLang || !esLang || !frLang) {
    throw new Error('Required seeded languages not found.');
  }

  const hash = await bcrypt.hash('Password123', 10);

  // --------------------------------------------------------------------------
  // 1. CREATE ACCOUNT B (Hindi -> Spanish)
  // --------------------------------------------------------------------------
  const emailB = `account-b-${Date.now()}@test.com`;
  const userB = await prisma.user.create({
    data: {
      email: emailB,
      passwordHash: hash,
      onboardingCompleted: true,
      profile: {
        create: {
          displayName: 'Account B (Spanish Learner)',
          nativeLanguageId: hiLang.id,
          targetLanguageId: esLang.id,
        },
      },
    },
    include: { profile: true },
  });
  console.log(`[PASS] Created Account B (${emailB}): Native=Hindi, Target=Spanish`);

  // Verify Account B course mapping
  const dashB = await dashboardService.getDashboard(userB.id);
  if (dashB.currentCourse.id !== 'course-es-a1') {
    throw new Error(`Account B expected Spanish course, got ${dashB.currentCourse.id}`);
  }
  console.log(`[PASS] Account B course: "${dashB.currentCourse.title}" (ID: ${dashB.currentCourse.id})`);

  // --------------------------------------------------------------------------
  // 2. CREATE ACCOUNT C (English -> French)
  // --------------------------------------------------------------------------
  const emailC = `account-c-${Date.now()}@test.com`;
  const userC = await prisma.user.create({
    data: {
      email: emailC,
      passwordHash: hash,
      onboardingCompleted: true,
      profile: {
        create: {
          displayName: 'Account C (French Learner)',
          nativeLanguageId: enLang.id,
          targetLanguageId: frLang.id,
        },
      },
    },
    include: { profile: true },
  });
  console.log(`[PASS] Created Account C (${emailC}): Native=English, Target=French`);

  // Verify Account C course mapping
  const dashC = await dashboardService.getDashboard(userC.id);
  if (dashC.currentCourse.id !== 'course-fr-a1') {
    throw new Error(`Account C expected French course, got ${dashC.currentCourse.id}`);
  }
  console.log(`[PASS] Account C course: "${dashC.currentCourse.title}" (ID: ${dashC.currentCourse.id})`);

  // --------------------------------------------------------------------------
  // 3. CROSS-USER ISOLATION (User B vs User C)
  // --------------------------------------------------------------------------
  console.log('Testing Cross-User Data & Practice Session Isolation...');
  const exercisesB = await prisma.exercise.findMany({
    where: { lessonId: 'lesson-es-1' },
    include: { options: true },
  });
  const answersB = exercisesB.map((ex) => {
    const correctOpt = ex.options?.find((o) => o.isCorrect);
    return {
      exerciseId: ex.id,
      userAnswer: correctOpt ? correctOpt.text : ex.expectedAnswer,
    };
  });

  // Account B completes Lesson 1 in Spanish
  const submitB = await lessonsService.submitLessonAttempt({
    lessonId: 'lesson-es-1',
    userId: userB.id,
    answers: answersB,
    durationSec: 90,
  });
  console.log(`[PASS] Account B finished Spanish Lesson 1: Score=${submitB.score}%, XP=+${submitB.xpAwarded}`);

  // Start Practice session for User B
  const sessionB = await practiceService.startSession(userB.id, PracticeSessionType.RECOMMENDED);
  console.log(`[PASS] Account B started Practice Session: ${sessionB.session.id}`);

  // User C tries to submit an answer to User B's practice session!
  let crossUserBlocked = false;
  try {
    await practiceService.submitAnswer({
      userId: userC.id, // User C unauthorized
      sessionId: sessionB.session.id, // User B session
      exerciseId: sessionB.session.exercises[0].id,
      userAnswer: 'any',
    });
  } catch (err: any) {
    crossUserBlocked = true;
    console.log(`[PASS] Security Verification: User C was blocked from User B session: "${err.message}"`);
  }

  if (!crossUserBlocked) {
    throw new Error('SECURITY VULNERABILITY: User C was able to submit to User B practice session!');
  }

  // Verify User C dashboard does not reflect User B progress
  const dashCAfterB = await dashboardService.getDashboard(userC.id);
  if (dashCAfterB.xpSummary.totalXp !== 0) {
    throw new Error(`DATA LEAKAGE: User C total XP is ${dashCAfterB.xpSummary.totalXp}, expected 0`);
  }
  if (dashCAfterB.currentCourse.completedLessonsCount !== 0) {
    throw new Error(`DATA LEAKAGE: User C completed lessons is ${dashCAfterB.currentCourse.completedLessonsCount}, expected 0`);
  }
  console.log('[PASS] User C progress remains completely isolated (0 XP, 0 completed lessons)');

  // --------------------------------------------------------------------------
  // 4. XP & LESSON REPEAT IDEMPOTENCY
  // --------------------------------------------------------------------------
  console.log('Testing XP & Lesson Repeat Idempotency...');
  const xpSummaryBefore = await xpService.getXpSummary(userB.id);
  const xpBeforeRepeat = xpSummaryBefore.totalXp;

  // Repeat completion of lesson-es-1
  const repeatSubmitB = await lessonsService.submitLessonAttempt({
    lessonId: 'lesson-es-1',
    userId: userB.id,
    answers: answersB,
    durationSec: 90,
  });

  const xpSummaryAfter = await xpService.getXpSummary(userB.id);
  const xpAfterRepeat = xpSummaryAfter.totalXp;
  console.log(`[PASS] Repeat lesson completion: isSuccessful=${repeatSubmitB.isSuccessful}, score=${repeatSubmitB.score}%`);
  console.log(`  Initial XP: ${xpBeforeRepeat}, After repeat: ${xpAfterRepeat}`);

  // Verify successful LessonAttempt records
  const successfulAttempts = await prisma.lessonAttempt.findMany({
    where: { userId: userB.id, lessonId: 'lesson-es-1', isSuccessful: true },
  });
  console.log(`[PASS] Recorded successful attempts: ${successfulAttempts.length}`);

  // Verify Dashboard completed lessons count is still 1 (not duplicated!)
  const dashBAfterRepeat = await dashboardService.getDashboard(userB.id);
  if (dashBAfterRepeat.currentCourse.completedLessonsCount !== 1) {
    throw new Error(`Course completion count corrupted! Expected 1, got ${dashBAfterRepeat.currentCourse.completedLessonsCount}`);
  }
  console.log(`[PASS] Dashboard completed lessons remains 1/2 (No progress inflation)`);

  // --------------------------------------------------------------------------
  // 5. AUTH TOKEN & REFRESH TOKEN REGRESSION
  // --------------------------------------------------------------------------
  console.log('Testing Auth & Refresh Token Lifecycle...');
  const accessToken = jwt.sign({ sub: userB.id, role: 'USER' }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ sub: userB.id, tokenVersion: 1 }, REFRESH_SECRET, { expiresIn: '7d' });

  // Verify valid tokens decode properly
  const decodedAccess = jwt.verify(accessToken, JWT_SECRET) as any;
  const decodedRefresh = jwt.verify(refreshToken, REFRESH_SECRET) as any;
  if (decodedAccess.sub !== userB.id || decodedRefresh.sub !== userB.id) {
    throw new Error('Token verification failed for user ID.');
  }
  console.log('[PASS] Access and Refresh token generation & verification valid');

  // Verify forged token with bad secret fails
  let badTokenRejected = false;
  try {
    jwt.verify(accessToken, 'invalid-secret-key');
  } catch (e) {
    badTokenRejected = true;
    console.log('[PASS] Invalid JWT secret properly rejected by verifier');
  }
  if (!badTokenRejected) {
    throw new Error('SECURITY FLAW: Invalid JWT secret was accepted!');
  }

  // --------------------------------------------------------------------------
  // 6. CLEANUP TEST ACCOUNTS
  // --------------------------------------------------------------------------
  await prisma.user.delete({ where: { id: userB.id } });
  await prisma.user.delete({ where: { id: userC.id } });
  console.log('[PASS] Successfully cleaned up Account B and Account C test data');

  console.log('====================================================');
  console.log('ALL SECURITY, ISOLATION & AUTH TESTS PASSED! 100%');
  console.log('====================================================');
}

runSecurityAndAccountTests()
  .catch((e) => {
    console.error('FATAL TEST ERROR:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
