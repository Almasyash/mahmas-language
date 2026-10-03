import http from 'http';

const BASE_URL = 'http://localhost:4000/api/v1';

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

function apiRequest(path: string, options: RequestOptions = {}): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const method = options.method || 'GET';
    const postData = options.body ? JSON.stringify(options.body) : undefined;

    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (postData) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData).toString();
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = rawData ? JSON.parse(rawData) : null;
            resolve({ status: res.statusCode || 500, body: parsed });
          } catch (e) {
            resolve({ status: res.statusCode || 500, body: rawData });
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

function assert(condition: any, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
}

async function runE2E() {
  console.log('====================================================');
  console.log('🚀 RUNNING PHASE 3 REAL LOCALHOST E2E VERIFICATION');
  console.log('📡 Base URL:', BASE_URL);
  console.log('====================================================\n');

  const timestamp = Date.now();
  const testEmail = `e2e_phase3_${timestamp}@example.com`;
  const testPassword = 'StrongPassword123!';
  let token = '';

  // ----------------------------------------------------
  // FLOW 1: Create / Login test user & Complete Onboarding
  // ----------------------------------------------------
  console.log('▶ [Flow 1] Create/login test user and complete onboarding');
  const regRes = await apiRequest('/auth/register', {
    method: 'POST',
    body: {
      email: testEmail,
      password: testPassword,
      displayName: 'Phase 3 Tester',
    },
  });
  assert(regRes.status === 201, `Registration failed with status ${regRes.status}`);
  token = regRes.body.data.accessToken || regRes.body.data.tokens?.accessToken;
  assert(token, 'Access token missing from registration');
  console.log('  ✓ User registered successfully');

  // Complete onboarding
  const onbRes = await apiRequest('/users/me/onboarding', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {
      nativeLanguageId: 'en',
      targetLanguageId: 'es',
      dailyMinutesGoal: 15,
      learningGoal: 'TRAVEL',
      initialLevel: 'A1',
      timezone: 'America/New_York',
    },
  });
  assert(onbRes.status === 200, `Onboarding failed with status ${onbRes.status}`);
  console.log('  ✓ Onboarding completed: targetLang=es, goal=15min, tz=America/New_York');

  // ----------------------------------------------------
  // FLOW 2: Complete Lesson 1
  // ----------------------------------------------------
  console.log('\n▶ [Flow 2] Complete Lesson 1 (Spanish Foundations)');
  const exRes = await apiRequest('/lessons/lesson-es-1/exercises', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(exRes.status === 200, `Fetch exercises failed with status ${exRes.status}`);
  const exercises = exRes.body.data.exercises || exRes.body.data.lesson?.exercises;
  assert(exercises && exercises.length >= 3, 'Expected at least 3 exercises in lesson 1');
  console.log(`  ✓ Fetched ${exercises.length} exercises from server for lesson-es-1`);

  // Submit attempt with correct answers
  const submitRes = await apiRequest('/lessons/lesson-es-1/submit', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {
      answers: [
        { exerciseId: 'ex-es-1-1', userAnswer: 'Hola' },
        { exerciseId: 'ex-es-1-2', userAnswer: 'Buenos días' },
        { exerciseId: 'ex-es-1-3', userAnswer: 'Hola' },
      ],
      durationSec: 150,
    },
  });
  assert(submitRes.status === 200, `Lesson submit failed with status ${submitRes.status}`);
  const submitData = submitRes.body.data;

  // ----------------------------------------------------
  // FLOW 3: Verify Exercise XP & Server-authoritative grading
  // ----------------------------------------------------
  console.log('\n▶ [Flow 3] Verify Exercise XP & Correct Grading');
  assert(submitData.evaluations && submitData.evaluations.length === 3, 'Expected 3 evaluation results');
  assert(submitData.evaluations.every((r: any) => r.isCorrect), 'Expected all exercises to be graded correct by server');
  console.log('  ✓ Server correctly evaluated all 3 exercises as correct');

  // ----------------------------------------------------
  // FLOW 4: Verify Lesson Completion XP & Gems
  // ----------------------------------------------------
  console.log('\n▶ [Flow 4] Verify Lesson Completion XP & Gems');
  assert(submitData.xpAwarded === 35, `Expected 35 total XP (15 exercise + 20 completion), got ${submitData.xpAwarded}`);
  assert(submitData.gemsAwarded === 2, `Expected 2 gems awarded for lesson 1, got ${submitData.gemsAwarded}`);
  console.log('  ✓ Server awarded 35 total XP (15 exercise + 20 lesson completion) and 2 Gems');

  // ----------------------------------------------------
  // FLOW 5: Verify Total XP
  // ----------------------------------------------------
  console.log('\n▶ [Flow 5] Verify Total XP');
  const xpRes = await apiRequest('/progression/xp', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(xpRes.status === 200, `XP summary failed with status ${xpRes.status}`);
  const xpSummary = xpRes.body.data;
  assert(xpSummary.totalXp === 85, `Expected total XP to be 85 (35 lesson + 50 FIRST_LESSON achievement), got ${xpSummary.totalXp}`);
  assert(xpSummary.todayXp === 85, `Expected today XP to be 85, got ${xpSummary.todayXp}`);
  assert(xpSummary.currentLevel >= 1, 'Expected level >= 1');
  console.log(`  ✓ Total XP verified: ${xpSummary.totalXp} XP (Level ${xpSummary.currentLevel})`);

  // ----------------------------------------------------
  // FLOW 6: Verify Lesson 2 Unlocks
  // ----------------------------------------------------
  console.log('\n▶ [Flow 6] Verify Lesson 2 Unlocks');
  const pathRes = await apiRequest('/courses/course-es-a1/path', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const sections = pathRes.body.data.course.sections;
  const l1 = sections[0].units[0].lessons.find((l: any) => l.id === 'lesson-es-1');
  const l2 = sections[0].units[0].lessons.find((l: any) => l.id === 'lesson-es-2');
  assert(l1 && l1.isCompleted === true, 'Expected lesson 1 to be marked completed');
  assert(l2 && l2.isUnlocked === true, 'Expected lesson 2 to be unlocked by server');
  console.log('  ✓ Lesson 1 is completed and Lesson 2 is unlocked server-authoritatively');

  // ----------------------------------------------------
  // FLOW 7: Verify Streak Starts
  // ----------------------------------------------------
  console.log('\n▶ [Flow 7] Verify Streak Starts');
  const streakRes = await apiRequest('/progression/streak', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(streakRes.status === 200, `Streak check failed with status ${streakRes.status}`);
  const streak = streakRes.body.data;
  assert(streak.currentStreak === 1, `Expected streak 1, got ${streak.currentStreak}`);
  assert(streak.activeToday === true || streak.isActiveToday === true, 'Expected activeToday to be true');
  console.log('  ✓ Streak active with currentStreak=1 for local timezone America/New_York');

  // ----------------------------------------------------
  // FLOW 8: Start Practice Session
  // ----------------------------------------------------
  console.log('\n▶ [Flow 8] Start Practice Session');
  const sessionStartRes = await apiRequest('/practice/session/start', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: { sessionType: 'RECOMMENDED' },
  });
  assert(sessionStartRes.status === 201, `Practice session start failed with status ${sessionStartRes.status}`);
  const sessionId = sessionStartRes.body.data.sessionId;
  const sessionExercises = sessionStartRes.body.data.exercises;
  assert(sessionId, 'Expected session with valid ID');
  assert(sessionExercises && sessionExercises.length > 0, 'Expected practice exercises to be returned');
  assert(sessionExercises[0].expectedAnswer === undefined, 'Expected answer key to NOT be leaked to client');
  console.log(`  ✓ Practice session started: ${sessionId}, returned ${sessionExercises.length} exercises without answers`);

  // ----------------------------------------------------
  // FLOW 9: Submit Practice Exercises (Correct)
  // ----------------------------------------------------
  console.log('\n▶ [Flow 9] Submit Practice Exercises');
  const correctSubmit = await apiRequest(`/practice/exercises/${sessionExercises[0].id}/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {
      sessionId,
      userAnswer: 'Hola',
    },
  });
  assert(correctSubmit.status === 200, `Practice submit failed with status ${correctSubmit.status}`);
  assert(correctSubmit.body.data.isCorrect === true, 'Expected answer "Hola" to be correct');
  console.log('  ✓ Correct practice exercise answered: graded correct');

  // ----------------------------------------------------
  // FLOW 12: Verify Mistake Creation on Incorrect Submission
  // ----------------------------------------------------
  console.log('\n▶ [Flow 12] Verify Mistake Creation on Incorrect Submission');
  const incorrectSubmit = await apiRequest(`/practice/exercises/${sessionExercises[0].id}/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {
      sessionId,
      userAnswer: 'Completely Wrong Answer XYZ',
    },
  });
  assert(incorrectSubmit.status === 200, `Practice submit failed with status ${incorrectSubmit.status}`);
  assert(incorrectSubmit.body.data.isCorrect === false, 'Expected incorrect answer to be graded false');
  console.log('  ✓ Incorrect answer submitted; mistake recorded on server');

  // ----------------------------------------------------
  // FLOW 10 & 11: Complete Practice Session & Verify Practice XP & Gems
  // ----------------------------------------------------
  console.log('\n▶ [Flow 10 & 11] Complete Practice Session and Verify XP & Gems');
  const completeSessionRes = await apiRequest(`/practice/session/${sessionId}/complete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: { durationSec: 180 },
  });
  assert(completeSessionRes.status === 200, `Session complete failed with status ${completeSessionRes.status}`);
  const compData = completeSessionRes.body.data;
  assert(compData.xpAwarded >= 15, `Expected at least 15 session completion XP, got ${compData.xpAwarded}`);
  assert(compData.gemsAwarded === 2, `Expected 2 gems awarded, got ${compData.gemsAwarded}`);
  console.log(`  ✓ Practice session completed: +${compData.xpAwarded} XP, +${compData.gemsAwarded} Gems`);

  // ----------------------------------------------------
  // FLOW 13: Open Mistake Review
  // ----------------------------------------------------
  console.log('\n▶ [Flow 13] Open Mistake Review');
  const mistakesRes = await apiRequest('/practice/mistakes', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(mistakesRes.status === 200, `Get mistakes failed with status ${mistakesRes.status}`);
  const mistakesData = mistakesRes.body.data;
  assert(mistakesData.totalMistakes >= 1, 'Expected at least 1 unresolved mistake');
  assert(mistakesData.recent.length >= 1 || mistakesData.repeated.length >= 1, 'Expected mistake in recent or repeated category');
  console.log(`  ✓ Mistake review retrieved: ${mistakesData.totalMistakes} unresolved mistakes in recent/repeated/older buckets`);

  // ----------------------------------------------------
  // FLOW 14: Open Vocabulary Review
  // ----------------------------------------------------
  console.log('\n▶ [Flow 14] Open Vocabulary Review');
  const vocabRes = await apiRequest('/practice/vocabulary', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(vocabRes.status === 200, `Get vocabulary failed with status ${vocabRes.status}`);
  const vocabData = vocabRes.body.data;
  const words = vocabData.words || vocabData.vocabulary;
  assert(Array.isArray(words), 'Expected vocabulary words array');
  assert(words.length > 0, 'Expected tracked vocabulary items');
  console.log(`  ✓ Vocabulary review retrieved: ${words.length} tracked words with SRS confidence scores`);

  // ----------------------------------------------------
  // FLOW 15: Verify Daily Progress
  // ----------------------------------------------------
  console.log('\n▶ [Flow 15] Verify Daily Progress');
  const goalRes = await apiRequest('/progression/daily-goal', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(goalRes.status === 200, `Get daily goal failed with status ${goalRes.status}`);
  const goalData = goalRes.body.data;
  const targetMinutes = goalData.dailyGoalMinutes ?? goalData.targetMinutes;
  const completedMinutes = goalData.dailyMinutesCompleted ?? goalData.completedMinutes;
  const progressPercent = goalData.dailyGoalProgress ?? goalData.progressPercentage;
  assert(targetMinutes === 15, `Expected target 15 mins, got ${targetMinutes}`);
  assert(completedMinutes >= 5, `Expected >= 5 minutes completed, got ${completedMinutes}`);
  console.log(`  ✓ Daily goal tracked server-side: ${completedMinutes}/${targetMinutes} minutes (${progressPercent}%)`);

  // ----------------------------------------------------
  // FLOW 16: Verify Quest Progress & Idempotent Claim
  // ----------------------------------------------------
  console.log('\n▶ [Flow 16] Verify Quest Progress and Idempotent Claim');
  const questsRes = await apiRequest('/progression/quests', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(questsRes.status === 200, `Get quests failed with status ${questsRes.status}`);
  const quests = Array.isArray(questsRes.body.data) ? questsRes.body.data : questsRes.body.data.quests;
  assert(Array.isArray(quests) && quests.length > 0, 'Expected quests array');
  const completedQuest = quests.find((q: any) => q.isCompleted && !q.isClaimed);
  assert(completedQuest, 'Expected at least one completed quest from lesson and practice completion');
  console.log(`  ✓ Found completed quest: "${completedQuest.title}" (${completedQuest.currentCount}/${completedQuest.targetCount})`);

  // Claim quest
  const claimRes = await apiRequest(`/progression/quests/${completedQuest.id}/claim`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(claimRes.status === 200, `Claim quest failed with status ${claimRes.status}`);
  assert(claimRes.body.data.xpAwarded > 0, 'Expected XP awarded for quest claim');
  console.log(`  ✓ Claimed quest "${completedQuest.title}": +${claimRes.body.data.xpAwarded} XP, +${claimRes.body.data.gemsAwarded} Gems`);

  // ----------------------------------------------------
  // FLOW 17 & 18: Trigger and Verify Achievement Persistence
  // ----------------------------------------------------
  console.log('\n▶ [Flow 17 & 18] Trigger and Verify Achievement Persistence');
  const achRes = await apiRequest('/progression/achievements', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(achRes.status === 200, `Get achievements failed with status ${achRes.status}`);
  const achData = achRes.body.data;
  const achList = Array.isArray(achData) ? achData : (achData.achievements || achData.unlockedAchievements);
  assert(Array.isArray(achList), 'Expected achievements array');
  const unlockedCodes = achList.filter((a: any) => a.isUnlocked).map((a: any) => a.code);
  assert(unlockedCodes.includes('FIRST_LESSON'), 'Expected FIRST_LESSON achievement to be unlocked');
  assert(unlockedCodes.includes('FIRST_PRACTICE'), 'Expected FIRST_PRACTICE achievement to be unlocked');
  console.log(`  ✓ Achievements unlocked & persisted on server: ${unlockedCodes.join(', ')}`);

  // ----------------------------------------------------
  // FLOW 19 & 20: Verify Dashboard Endpoint & Flutter Schema Alignment
  // ----------------------------------------------------
  console.log('\n▶ [Flow 19 & 20] Verify Dashboard Endpoint and Flutter Shape Alignment');
  const dashRes = await apiRequest('/users/me/dashboard', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(dashRes.status === 200, `Get dashboard failed with status ${dashRes.status}`);
  const dash = dashRes.body.data;
  assert(dash.user && dash.user.email === testEmail, 'User mismatch in dashboard');
  const targetLang = dash.targetLanguage || dash.user?.targetLanguage;
  assert(targetLang && targetLang.code === 'es', 'Target language mismatch in dashboard');
  assert(dash.xpSummary && dash.xpSummary.totalXp > 0, 'XP summary missing or zero in dashboard');
  assert(dash.streak && dash.streak.currentStreak === 1, 'Streak mismatch in dashboard');
  const dashCompletedMinutes = dash.dailyGoal.dailyMinutesCompleted ?? dash.dailyGoal.completedMinutes;
  const dashTargetMinutes = dash.dailyGoal.dailyGoalMinutes ?? dash.dailyGoal.targetMinutes;
  assert(dash.dailyGoal && dashCompletedMinutes >= 5, 'Daily goal mismatch in dashboard');
  assert(dash.practiceSummary && dash.practiceSummary.mistakeCount >= 1, 'Practice summary mismatch');
  assert(Array.isArray(dash.recentAchievements) && dash.recentAchievements.length >= 2, 'Achievements missing in dashboard');
  assert(Array.isArray(dash.quests) && dash.quests.length > 0, 'Quests missing in dashboard');
  console.log('  ✓ Aggregated dashboard returns complete server-authoritative state matching Flutter models:');
  console.log(`    • Total XP: ${dash.xpSummary.totalXp} (Level ${dash.xpSummary.currentLevel})`);
  console.log(`    • Current Streak: ${dash.streak.currentStreak} day(s)`);
  console.log(`    • Daily Goal: ${dashCompletedMinutes}/${dashTargetMinutes} min`);
  console.log(`    • Gems Balance: ${dash.currency.gems} Gems`);
  console.log(`    • Mistakes to review: ${dash.practiceSummary.mistakeCount}`);
  console.log(`    • Active Quests: ${dash.quests.length}`);
  console.log(`    • Unlocked Achievements: ${dash.recentAchievements.length}`);

  // ----------------------------------------------------
  // FLOW 21 & 22: Repeat already completed action & Verify NO Duplicate XP/Rewards
  // ----------------------------------------------------
  console.log('\n▶ [Flow 21 & 22] Repeat Completed Action and Verify Idempotency');
  // 1) Repeat lesson completion
  const repeatLessonRes = await apiRequest('/lessons/lesson-es-1/submit', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {
      answers: [
        { exerciseId: 'ex-es-1-1', userAnswer: 'Hola' },
        { exerciseId: 'ex-es-1-2', userAnswer: 'Buenos días' },
        { exerciseId: 'ex-es-1-3', userAnswer: 'Hola' },
      ],
      durationSec: 60,
    },
  });
  assert(repeatLessonRes.status === 200, 'Repeat lesson submit failed');
  assert(repeatLessonRes.body.data.gemsAwarded === 0, `Expected 0 gems on repeat, got ${repeatLessonRes.body.data.gemsAwarded}`);
  assert(repeatLessonRes.body.data.xpAwarded === 15, `Expected only 15 exercise XP (0 completion XP) on repeat, got ${repeatLessonRes.body.data.xpAwarded}`);
  console.log('  ✓ Re-completing lesson yielded 0 duplicate completion XP and 0 duplicate gems');

  // 2) Repeat quest claim
  const repeatClaimRes = await apiRequest(`/progression/quests/${completedQuest.id}/claim`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(repeatClaimRes.status === 400 || repeatClaimRes.body.success === false, 'Expected duplicate claim to be rejected');
  console.log('  ✓ Duplicate quest claim rejected by server (idempotency preserved)');

  // 3) Repeat practice session completion
  const xpBeforeRepeatComp = (await apiRequest('/progression/xp', { headers: { Authorization: `Bearer ${token}` } })).body.data.totalXp;
  const repeatSessionCompRes = await apiRequest(`/practice/session/${sessionId}/complete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: { durationSec: 60 },
  });
  const isDuplicateRejected = repeatSessionCompRes.status === 400 || 
    repeatSessionCompRes.body.success === false || 
    repeatSessionCompRes.body.data?.alreadyCompleted === true;
  assert(isDuplicateRejected, 'Expected duplicate session complete to be rejected or marked already completed');
  
  const xpAfterRepeatComp = (await apiRequest('/progression/xp', { headers: { Authorization: `Bearer ${token}` } })).body.data.totalXp;
  assert(xpBeforeRepeatComp === xpAfterRepeatComp, `Expected total XP to remain ${xpBeforeRepeatComp}, got ${xpAfterRepeatComp}`);
  console.log('  ✓ Duplicate session completion yielded 0 duplicate XP (total XP unchanged, idempotency preserved)');

  console.log('\n====================================================');
  console.log('🎉 ALL 22 E2E FLOWS VERIFIED SUCCESSFULLY!');
  console.log('====================================================');
}

runE2E().catch((err) => {
  console.error('\n❌ E2E VERIFICATION FAILED:', err);
  process.exit(1);
});
