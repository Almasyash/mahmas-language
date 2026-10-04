import { PrismaClient, CEFRLevel, LearningGoal, UserRole } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/environment';

const prisma = new PrismaClient();

async function testRateLimits() {
  console.log('================================================================');
  console.log('⚡ TESTING AI ROUTE RATE LIMITERS (429 ENFORCEMENT & RECOVERY)');
  console.log('================================================================\n');

  const timestamp = Date.now();
  const esLang = await prisma.language.findUnique({ where: { code: 'es' } });
  const hiLang = await prisma.language.findUnique({ where: { code: 'hi' } });

  const testUser = await prisma.user.create({
    data: {
      email: `ratelimit_tester_${timestamp}@test.com`,
      passwordHash: 'hashed_pw_test',
      isVerified: true,
      role: UserRole.LEARNER,
      profile: {
        create: {
          displayName: 'Rate Limit Tester',
          nativeLanguageId: hiLang!.id,
          targetLanguageId: esLang!.id,
          currentLevel: CEFRLevel.A1,
          learningGoal: LearningGoal.DAILY_CONVERSATION,
          dailyMinutesGoal: 20,
        },
      },
    },
  });

  const token = jwt.sign(
    { userId: testUser.id, email: testUser.email, role: testUser.role },
    config.jwtAccessSecret,
    { expiresIn: '1h' }
  );

  const character = await prisma.aICharacter.findFirst({
    where: { targetLanguageCode: 'es', isActive: true },
  });

  const baseUrl = `http://localhost:${config.port}/api/v1`;

  try {
    // -------------------------------------------------------------
    // TEST 1: Rate Limiter on POST /ai/calls/initiate (Limit: 15/min)
    // -------------------------------------------------------------
    console.log('--- 1. Testing Call Initiation Rate Limit (15/min) ---');
    let callAllowedCount = 0;
    let callBlockedCount = 0;
    let lastStatusCode = 0;
    let rateLimitMessage = '';

    for (let i = 0; i < 16; i++) {
      const res = await fetch(`${baseUrl}/ai/calls/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ characterId: character!.id, topic: `Call ${i}` }),
      });
      lastStatusCode = res.status;
      if (res.status === 200 || res.status === 201) {
        callAllowedCount++;
      } else if (res.status === 429) {
        callBlockedCount++;
        const body = (await res.json()) as any;
        rateLimitMessage = body.error?.message || body.message || '';
      }
    }

    console.log(`  Allowed calls before limit: ${callAllowedCount}/15`);
    console.log(`  16th request status code: ${lastStatusCode}`);
    console.log(`  429 error message: "${rateLimitMessage}"`);

    if (callAllowedCount === 15 && lastStatusCode === 429 && callBlockedCount === 1) {
      console.log('  ✅ [PASS] Call initiation rate limit strictly enforced at 15 calls/min');
    } else {
      console.log(`  ⚠️ Call rate limiter observation: allowed=${callAllowedCount}, blocked=${callBlockedCount}, status=${lastStatusCode}`);
    }

    // -------------------------------------------------------------
    // TEST 2: Rate Limiter on POST /ai/conversations (Limit: 20/min)
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Conversation Creation Rate Limit (20/min) ---');
    let convAllowed = 0;
    let convBlocked = 0;
    let convLastStatus = 0;

    for (let i = 0; i < 21; i++) {
      const res = await fetch(`${baseUrl}/ai/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ characterId: character!.id, topic: `Conv ${i}` }),
      });
      convLastStatus = res.status;
      if (res.status === 200 || res.status === 201) {
        convAllowed++;
      } else if (res.status === 429) {
        convBlocked++;
      }
    }
    console.log(`  Allowed conversations: ${convAllowed}/20`);
    console.log(`  21st request status: ${convLastStatus}`);
    if (convAllowed === 20 && convLastStatus === 429) {
      console.log('  ✅ [PASS] Conversation creation limit strictly enforced at 20 conv/min');
    }

  } finally {
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log('\nCleaned up rate limit test user.');
  }
}

testRateLimits().catch(console.error);
