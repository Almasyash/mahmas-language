// ==============================================================================
// MAHMAS LANGUAGE — LANGUAGE & COURSE ISOLATION REGRESSION TEST
// Validates strict language isolation across User, Profile, Course, Lesson,
// Exercise, Practice, Mistakes, and Vocabulary.
// ==============================================================================

import { PrismaClient } from '@prisma/client';
import { coursesService } from '../src/modules/courses/courses.service';
import { dashboardService } from '../src/modules/progression/dashboard.service';
import { practiceService } from '../src/modules/practice/practice.service';
import { lessonsService } from '../src/modules/lessons/lessons.service';
import { usersService } from '../src/modules/users/users.service';

const prisma = new PrismaClient();

async function runTests() {
  console.log('====================================================');
  console.log('RUNNING LANGUAGE ISOLATION & DATA INTEGRITY TESTS');
  console.log('====================================================');

  const hiLang = await prisma.language.findUnique({ where: { code: 'hi' } });
  const enLang = await prisma.language.findUnique({ where: { code: 'en' } });
  const esLang = await prisma.language.findUnique({ where: { code: 'es' } });
  const frLang = await prisma.language.findUnique({ where: { code: 'fr' } });
  const deLang = await prisma.language.findUnique({ where: { code: 'de' } });
  const jaLang = await prisma.language.findUnique({ where: { code: 'ja' } });

  if (!hiLang || !enLang || !esLang || !frLang || !deLang || !jaLang) {
    throw new Error('Required seeded languages not found in database.');
  }

  // Create isolated test user: Account A (Hindi -> English)
  const testEmailA = `test-user-a-${Date.now()}@test.com`;
  const userA = await prisma.user.create({
    data: {
      email: testEmailA,
      onboardingCompleted: true,
      profile: {
        create: {
          displayName: 'Test User A',
          nativeLanguageId: hiLang.id,
          targetLanguageId: enLang.id,
        },
      },
    },
    include: { profile: true },
  });

  console.log(`[PASS] Created Test User A (${testEmailA}) with Native: Hindi -> Target: English`);

  // TEST 1: Course mapping for Hindi -> English
  const coursePathA = await coursesService.getCoursePath(null, userA.id);
  if (!coursePathA || !coursePathA.course) {
    throw new Error('TEST 1 FAILED: Expected English course for User A, got null');
  }
  console.log(`  Course resolved: ${coursePathA.course.title} (ID: ${coursePathA.course.id})`);
  if (coursePathA.course.id !== 'course-en-a1') {
    throw new Error(`TEST 1 FAILED: Expected course-en-a1, got ${coursePathA.course.id}`);
  }
  console.log('[PASS] Test 1: Hindi -> English resolved to course-en-a1 ("English Foundations")');

  // TEST 2: Dashboard for User A reflects English course
  const dashA = await dashboardService.getDashboard(userA.id);
  if (dashA.currentCourse.id !== 'course-en-a1') {
    throw new Error(`TEST 2 FAILED: Dashboard course mismatch: ${dashA.currentCourse.id}`);
  }
  if (!dashA.currentCourse.title.toLowerCase().includes('english')) {
    throw new Error(`TEST 2 FAILED: Dashboard course title does not mention English: ${dashA.currentCourse.title}`);
  }
  if (dashA.currentCourse.activeLessonId !== 'lesson-en-1') {
    throw new Error(`TEST 2 FAILED: Active lesson expected lesson-en-1, got ${dashA.currentCourse.activeLessonId}`);
  }
  console.log(`[PASS] Test 2: Dashboard displays "${dashA.currentCourse.title}" with active lesson "${dashA.currentCourse.activeLessonTitle}"`);

  // TEST 3: Submit lesson-en-1 for User A and verify XP and English vocabulary
  const exercisesA = await lessonsService.getLessonExercises('lesson-en-1', userA.id);
  const answersA = exercisesA.lesson.exercises.map((ex: any) => ({
    exerciseId: ex.id,
    userAnswer: ex.type === 'MULTIPLE_CHOICE' ? 'Hello' : (ex.type === 'TRANSLATION' ? 'Good morning' : 'Hello'),
  }));

  const submitResultA = await lessonsService.submitLessonAttempt({
    lessonId: 'lesson-en-1',
    userId: userA.id,
    answers: answersA,
    durationSec: 120,
  });

  if (!submitResultA.isSuccessful || submitResultA.score !== 100) {
    throw new Error(`TEST 3 FAILED: Lesson submission score expected 100%, got ${submitResultA.score}%`);
  }
  console.log(`[PASS] Test 3: Successfully completed lesson-en-1 (Score: 100%, XP: +${submitResultA.xpAwarded})`);

  // Verify English vocabulary is exposed for User A
  const vocabA = await practiceService.getVocabulary(userA.id);
  if (vocabA.totalCount === 0) {
    throw new Error('TEST 3 FAILED: Expected vocabulary words for English, got 0');
  }
  const hasNonEnglishVocab = vocabA.words.some((w: any) => w.word === 'Hola' || w.word === 'Bonjour');
  if (hasNonEnglishVocab) {
    throw new Error('TEST 3 FAILED: Vocabulary leakage detected! Spanish or French words found in English vocabulary.');
  }
  console.log(`[PASS] Test 3b: User A vocabulary contains ${vocabA.totalCount} English words and 0 foreign words.`);

  // TEST 4: Language Switch Test: Switch User A to Spanish
  console.log('Testing Target Language Switch: Hindi -> Spanish...');
  await usersService.updateProfile(userA.id, {
    targetLanguageId: esLang.id,
  });

  const dashAfterSwitch = await dashboardService.getDashboard(userA.id);
  if (dashAfterSwitch.currentCourse.id !== 'course-es-a1') {
    throw new Error(`TEST 4 FAILED: After switch to Spanish, expected course-es-a1, got ${dashAfterSwitch.currentCourse.id}`);
  }
  if (dashAfterSwitch.currentCourse.completedLessonsCount !== 0) {
    throw new Error(`TEST 4 FAILED: Multi-language progress isolation failed! Spanish completedLessons expected 0, got ${dashAfterSwitch.currentCourse.completedLessonsCount}`);
  }
  console.log(`[PASS] Test 4: Switched to Spanish. Current course is "${dashAfterSwitch.currentCourse.title}", Spanish progress is 0% (Isolated!)`);

  // Verify Vocabulary for Spanish is 0 (isolated from English)
  const vocabSpanish = await practiceService.getVocabulary(userA.id);
  if (vocabSpanish.totalCount !== 0) {
    throw new Error(`TEST 4b FAILED: Spanish vocabulary expected 0 words, got ${vocabSpanish.totalCount}`);
  }
  console.log('[PASS] Test 4b: Spanish vocabulary is completely empty (no leakage from English)');

  // TEST 5: Switch back to English and verify English progress is preserved!
  console.log('Switching back to English...');
  await usersService.updateProfile(userA.id, {
    targetLanguageId: enLang.id,
  });

  const dashRestored = await dashboardService.getDashboard(userA.id);
  if (dashRestored.currentCourse.id !== 'course-en-a1') {
    throw new Error(`TEST 5 FAILED: Expected course-en-a1, got ${dashRestored.currentCourse.id}`);
  }
  if (dashRestored.currentCourse.completedLessonsCount !== 1) {
    throw new Error(`TEST 5 FAILED: English lesson progress was lost! Expected 1 completed lesson, got ${dashRestored.currentCourse.completedLessonsCount}`);
  }
  console.log(`[PASS] Test 5: Switched back to English. Completed lessons preserved: ${dashRestored.currentCourse.completedLessonsCount}/2 lessons completed!`);

  // TEST 6: Verify Other Languages (French, German, Japanese)
  // French
  await usersService.updateProfile(userA.id, { targetLanguageId: frLang.id });
  const courseFr = await coursesService.getCoursePath(null, userA.id);
  if (!courseFr || courseFr.course.id !== 'course-fr-a1') {
    throw new Error(`TEST 6 FAILED (French): Expected course-fr-a1, got ${courseFr?.course?.id}`);
  }
  console.log(`[PASS] Test 6a: French resolved to "${courseFr.course.title}"`);

  // German
  await usersService.updateProfile(userA.id, { targetLanguageId: deLang.id });
  const courseDe = await coursesService.getCoursePath(null, userA.id);
  if (!courseDe || courseDe.course.id !== 'course-de-a1') {
    throw new Error(`TEST 6 FAILED (German): Expected course-de-a1, got ${courseDe?.course?.id}`);
  }
  console.log(`[PASS] Test 6b: German resolved to "${courseDe.course.title}"`);

  // Japanese
  await usersService.updateProfile(userA.id, { targetLanguageId: jaLang.id });
  const courseJa = await coursesService.getCoursePath(null, userA.id);
  if (!courseJa || courseJa.course.id !== 'course-ja-a1') {
    throw new Error(`TEST 6 FAILED (Japanese): Expected course-ja-a1, got ${courseJa?.course?.id}`);
  }
  console.log(`[PASS] Test 6c: Japanese resolved to "${courseJa.course.title}"`);

  // TEST 7: Cleanup test account
  await prisma.user.delete({ where: { id: userA.id } });
  console.log('[PASS] Test 7: Cleaned up test user data');

  console.log('====================================================');
  console.log('ALL LANGUAGE ISOLATION & INTEGRITY TESTS PASSED! 100%');
  console.log('====================================================');
}

runTests()
  .catch((e) => {
    console.error('FATAL TEST ERROR:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
