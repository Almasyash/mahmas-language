import { PrismaClient } from '@prisma/client';

const API_BASE = 'http://localhost:4000/api/v1';
const prisma = new PrismaClient();

async function runRateLimitStressTest() {
  console.log('=== PHASE 5: SECTION 5 - AI RATE LIMIT & ABUSE STRESS TEST ===\n');

  const character = await prisma.aICharacter.findFirst({
    where: { targetLanguageCode: 'es', isActive: true },
  });
  if (!character) throw new Error('No active ES AICharacter found in DB');

  // 1. Create a dedicated test user
  const email = `ratelimit_stress_${Date.now()}@example.com`;
  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'Password123!',
      displayName: 'Rate Limit Tester',
      nativeLanguageId: 'en',
      targetLanguageId: 'es',
    }),
  });
  const regData: any = await regRes.json();
  if (!regData.success) throw new Error('Registration failed: ' + JSON.stringify(regData));
  const token = regData.data.accessToken;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // TEST 1: aiCallRateLimit (Max: 15/min)
  console.log('--- Testing aiCallRateLimit: 15 calls/min ---');
  let allowedCalls = 0;
  let rejectedAtCall16 = false;

  for (let i = 1; i <= 16; i++) {
    const res = await fetch(`${API_BASE}/ai/calls/initiate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ characterId: character.id, topic: 'Rate limit test' }),
    });

    if (res.status === 201) {
      allowedCalls++;
    } else if (res.status === 429) {
      const data: any = await res.json();
      console.log(`  Call #${i} correctly returned 429: ${data.error?.message}`);
      if (i === 16) rejectedAtCall16 = true;
    } else {
      const data: any = await res.json();
      console.error(`  Call #${i} returned unexpected status: ${res.status}`, data);
    }
  }

  console.log(`  Result: ${allowedCalls} calls allowed, call #16 rejected: ${rejectedAtCall16}`);
  if (allowedCalls === 15 && rejectedAtCall16) {
    console.log('  ✅ [PASS] aiCallRateLimit enforced accurately at 15 calls/min\n');
  } else {
    throw new Error(`aiCallRateLimit mismatch: allowed ${allowedCalls}, rejectedAtCall16: ${rejectedAtCall16}`);
  }

  // TEST 2: aiConversationRateLimit (Max: 20/min)
  console.log('--- Testing aiConversationRateLimit: 20 conversations/min ---');
  let allowedConvs = 0;
  let rejectedAtConv21 = false;

  for (let i = 1; i <= 21; i++) {
    const res = await fetch(`${API_BASE}/ai/conversations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ characterId: character.id, topic: `Topic ${i}` }),
    });

    if (res.status === 201) {
      allowedConvs++;
    } else if (res.status === 429) {
      const data: any = await res.json();
      console.log(`  Conversation #${i} correctly returned 429: ${data.error?.message}`);
      if (i === 21) rejectedAtConv21 = true;
    } else {
      const data: any = await res.json();
      console.error(`  Conversation #${i} returned unexpected status: ${res.status}`, data);
    }
  }

  console.log(`  Result: ${allowedConvs} conversations allowed, conv #21 rejected: ${rejectedAtConv21}`);
  if (allowedConvs === 20 && rejectedAtConv21) {
    console.log('  ✅ [PASS] aiConversationRateLimit enforced accurately at 20 conv/min\n');
  } else {
    throw new Error(`aiConversationRateLimit mismatch: allowed ${allowedConvs}, rejectedAtConv21: ${rejectedAtConv21}`);
  }

  // TEST 3: aiMessageRateLimit (Max: 40/min)
  console.log('--- Testing aiMessageRateLimit: 40 messages/min ---');
  // First, get one active conversation
  const activeConv = await prisma.aIConversation.findFirst({
    where: { userId: regData.data.user.id },
  });
  if (!activeConv) throw new Error('No active conversation found for user');

  let allowedMsgs = 0;
  let rejectedAtMsg41 = false;

  for (let i = 1; i <= 41; i++) {
    const res = await fetch(`${API_BASE}/ai/conversations/${activeConv.id}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content: `Test message ${i}` }),
    });

    if (res.status === 200 || res.status === 201) {
      allowedMsgs++;
    } else if (res.status === 429) {
      const data: any = await res.json();
      console.log(`  Message #${i} correctly returned 429: ${data.error?.message}`);
      if (i === 41) rejectedAtMsg41 = true;
    } else {
      const data: any = await res.json();
      console.error(`  Message #${i} returned unexpected status: ${res.status}`, data);
    }
  }

  console.log(`  Result: ${allowedMsgs} messages allowed, msg #41 rejected: ${rejectedAtMsg41}`);
  if (allowedMsgs === 40 && rejectedAtMsg41) {
    console.log('  ✅ [PASS] aiMessageRateLimit enforced accurately at 40 messages/min\n');
  } else {
    throw new Error(`aiMessageRateLimit mismatch: allowed ${allowedMsgs}, rejectedAtMsg41: ${rejectedAtMsg41}`);
  }

  // Cleanup
  await prisma.user.delete({ where: { email } });
  console.log('  Cleaned up rate limit test user.');

  console.log('================================================================');
  console.log('🎉 SECTION 5 AI RATE LIMIT STRESS TESTS ALL PASSED!');
  console.log('================================================================');
}

runRateLimitStressTest()
  .catch(err => {
    console.error('Rate limit test failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
