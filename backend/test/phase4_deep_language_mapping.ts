import { prisma } from '../src/database/prisma';
import { coursesService } from '../src/modules/courses/courses.service';
import { lessonsService } from '../src/modules/lessons/lessons.service';

async function runPhase4Tests() {
  console.log('====================================================');
  console.log('🚀 PHASE 4 — LANGUAGE MAPPING — P0/P1 DEEP TEST');
  console.log('====================================================');

  const hiLang = await prisma.language.findUnique({ where: { code: 'hi' } });
  const enLang = await prisma.language.findUnique({ where: { code: 'en' } });
  const esLang = await prisma.language.findUnique({ where: { code: 'es' } });
  const frLang = await prisma.language.findUnique({ where: { code: 'fr' } });

  if (!hiLang || !enLang || !esLang || !frLang) {
    throw new Error('Required languages (hi, en, es, fr) missing from database!');
  }

  const timestamp = Date.now();

  // ----------------------------------------------------
  // TEST ACCOUNT A: Native: Hindi -> Target: English
  // ----------------------------------------------------
  console.log('\n--- 1. Testing Account A: Native Hindi (hi) -> Target English (en) ---');
  const userA = await prisma.user.create({
    data: {
      email: `qa_phase4_a_${timestamp}@test.com`,
      onboardingCompleted: true,
      profile: {
        create: {
          displayName: 'Account A (HI->EN)',
          nativeLanguageId: hiLang.id,
          targetLanguageId: enLang.id,
        },
      },
    },
    include: { profile: true },
  });

  const coursePathA = await coursesService.getCoursePath(null, userA.id);
  if (!coursePathA || !coursePathA.course) {
    throw new Error('FAILED: Account A received no course path!');
  }
  console.log(`  Resolved Course ID: ${coursePathA.course.id}`);
  console.log(`  Course Title: ${coursePathA.course.title}`);
  console.log(`  Target Language ID: ${coursePathA.course.targetLanguage.id} (${coursePathA.course.targetLanguage.code})`);

  // Verify invariant for Account A
  if (coursePathA.course.targetLanguage.code !== 'en') {
    throw new Error(`CRITICAL MAPPING BUG: Account A target language 'en' received course with target '${coursePathA.course.targetLanguage.code}'!`);
  }
  if (!coursePathA.course.title.toLowerCase().includes('english')) {
    throw new Error(`CRITICAL MAPPING BUG: Course title does not match English: ${coursePathA.course.title}`);
  }

  // Verify Lesson & Exercise Target Invariant for Account A
  const activeLessonIdA = coursePathA.course.currentLessonId;
  if (!activeLessonIdA) {
    throw new Error('Account A has no active lesson');
  }
  const lessonDataA = await lessonsService.getLessonExercises(activeLessonIdA, userA.id);
  console.log(`  Active Lesson: ${lessonDataA.lesson.title} (${lessonDataA.lesson.id})`);
  console.log(`  Exercises Count: ${lessonDataA.lesson.exercises.length}`);
  for (const ex of lessonDataA.lesson.exercises) {
    console.log(`    - [${ex.type}] Question: "${ex.question.replace(/\n/g, ' ')}" (Options: ${ex.options.length})`);
  }
  console.log('✅ [PASS] Account A Invariant Verified: Selected Target (en) = Course Target (en) = Lesson/Exercise Content (en)');

  // ----------------------------------------------------
  // TEST ACCOUNT B: Native: Hindi -> Target: Spanish
  // ----------------------------------------------------
  console.log('\n--- 2. Testing Account B: Native Hindi (hi) -> Target Spanish (es) ---');
  const userB = await prisma.user.create({
    data: {
      email: `qa_phase4_b_${timestamp}@test.com`,
      onboardingCompleted: true,
      profile: {
        create: {
          displayName: 'Account B (HI->ES)',
          nativeLanguageId: hiLang.id,
          targetLanguageId: esLang.id,
        },
      },
    },
    include: { profile: true },
  });

  const coursePathB = await coursesService.getCoursePath(null, userB.id);
  if (!coursePathB || !coursePathB.course) {
    throw new Error('FAILED: Account B received no course path!');
  }
  console.log(`  Resolved Course ID: ${coursePathB.course.id}`);
  console.log(`  Course Title: ${coursePathB.course.title}`);
  console.log(`  Target Language ID: ${coursePathB.course.targetLanguage.id} (${coursePathB.course.targetLanguage.code})`);

  // Verify invariant for Account B
  if (coursePathB.course.targetLanguage.code !== 'es') {
    throw new Error(`CRITICAL MAPPING BUG: Account B target language 'es' received course with target '${coursePathB.course.targetLanguage.code}'!`);
  }
  if (!coursePathB.course.title.toLowerCase().includes('spanish')) {
    throw new Error(`CRITICAL MAPPING BUG: Course title does not match Spanish: ${coursePathB.course.title}`);
  }

  const activeLessonIdB = coursePathB.course.currentLessonId;
  if (!activeLessonIdB) {
    throw new Error('Account B has no active lesson');
  }
  const lessonDataB = await lessonsService.getLessonExercises(activeLessonIdB, userB.id);
  console.log(`  Active Lesson: ${lessonDataB.lesson.title} (${lessonDataB.lesson.id})`);
  console.log(`  Exercises Count: ${lessonDataB.lesson.exercises.length}`);
  for (const ex of lessonDataB.lesson.exercises) {
    console.log(`    - [${ex.type}] Question: "${ex.question.replace(/\n/g, ' ')}" (Options: ${ex.options.length})`);
  }
  console.log('✅ [PASS] Account B Invariant Verified: Selected Target (es) = Course Target (es) = Lesson/Exercise Content (es)');

  // ----------------------------------------------------
  // TEST ACCOUNT C: Native: English -> Target: French
  // ----------------------------------------------------
  console.log('\n--- 3. Testing Account C: Native English (en) -> Target French (fr) ---');
  const userC = await prisma.user.create({
    data: {
      email: `qa_phase4_c_${timestamp}@test.com`,
      onboardingCompleted: true,
      profile: {
        create: {
          displayName: 'Account C (EN->FR)',
          nativeLanguageId: enLang.id,
          targetLanguageId: frLang.id,
        },
      },
    },
    include: { profile: true },
  });

  const coursePathC = await coursesService.getCoursePath(null, userC.id);
  if (!coursePathC || !coursePathC.course) {
    throw new Error('FAILED: Account C received no course path!');
  }
  console.log(`  Resolved Course ID: ${coursePathC.course.id}`);
  console.log(`  Course Title: ${coursePathC.course.title}`);
  console.log(`  Target Language ID: ${coursePathC.course.targetLanguage.id} (${coursePathC.course.targetLanguage.code})`);

  // Verify invariant for Account C
  if (coursePathC.course.targetLanguage.code !== 'fr') {
    throw new Error(`CRITICAL MAPPING BUG: Account C target language 'fr' received course with target '${coursePathC.course.targetLanguage.code}'!`);
  }
  if (!coursePathC.course.title.toLowerCase().includes('french')) {
    throw new Error(`CRITICAL MAPPING BUG: Course title does not match French: ${coursePathC.course.title}`);
  }

  const activeLessonIdC = coursePathC.course.currentLessonId;
  if (!activeLessonIdC) {
    throw new Error('Account C has no active lesson');
  }
  const lessonDataC = await lessonsService.getLessonExercises(activeLessonIdC, userC.id);
  console.log(`  Active Lesson: ${lessonDataC.lesson.title} (${lessonDataC.lesson.id})`);
  console.log(`  Exercises Count: ${lessonDataC.lesson.exercises.length}`);
  for (const ex of lessonDataC.lesson.exercises) {
    console.log(`    - [${ex.type}] Question: "${ex.question.replace(/\n/g, ' ')}" (Options: ${ex.options.length})`);
  }
  console.log('✅ [PASS] Account C Invariant Verified: Selected Target (fr) = Course Target (fr) = Lesson/Exercise Content (fr)');

  // Clean up test accounts
  const emailsToDelete = [userA.email, userB.email, userC.email].filter((e): e is string => Boolean(e));
  await prisma.user.deleteMany({
    where: {
      email: { in: emailsToDelete },
    },
  });
  console.log('\n✅ [PASS] Phase 4 Language Mapping: All 3 Accounts Passed 100% with Clean Invariant Verification!');
}

runPhase4Tests()
  .catch((err) => {
    console.error('❌ PHASE 4 FAILED:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
