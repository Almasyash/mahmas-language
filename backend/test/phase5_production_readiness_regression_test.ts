import { UserRole, CEFRLevel, LearningGoal } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { WebSocket } from 'ws';
import { Server as HttpServer } from 'http';
import { prisma } from '../src/database/prisma';
import { aiService } from '../src/modules/ai/ai.service';
import { xpService } from '../src/modules/progression/xp.service';
import { achievementsService } from '../src/modules/progression/achievements.service';
import { config } from '../src/config/environment';
import { SignalingServer } from '../src/websocket/signaling';

async function runPhase5ProductionReadinessSuite() {
  console.log('================================================================');
  console.log('🚀 PHASE 5: PRODUCTION READINESS & RELEASE REGRESSION SUITE');
  console.log('================================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failedTests++;
    }
  }

  const timestamp = Date.now();
  const testUserEmails = [
    `prod_qa_user_a_${timestamp}@test.com`,
    `prod_qa_user_b_${timestamp}@test.com`,
    `prod_qa_user_c_${timestamp}@test.com`,
    `prod_qa_user_d_${timestamp}@test.com`,
  ];

  const users: any[] = [];
  const tokens: string[] = [];

  try {
    // ---------------------------------------------------------
    // SETUP: Provision Test Users A, B, C, D with Full Profiles
    // ---------------------------------------------------------
    console.log('--- 1. Provisioning Multi-User Test Accounts (A, B, C, D) ---');
    const esLang = await prisma.language.findUnique({ where: { code: 'es' } });
    const hiLang = await prisma.language.findUnique({ where: { code: 'hi' } });
    const enLang = await prisma.language.findUnique({ where: { code: 'en' } });
    if (!esLang || !hiLang || !enLang) {
      throw new Error('Required languages (es, hi, en) missing from database');
    }

    for (let i = 0; i < testUserEmails.length; i++) {
      const email = testUserEmails[i];
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: 'hashed_pw_prod_qa',
          isVerified: true,
          role: UserRole.LEARNER,
          profile: {
            create: {
              displayName: `User ${String.fromCharCode(65 + i)}`,
              nativeLanguageId: i % 2 === 0 ? hiLang.id : enLang.id,
              targetLanguageId: esLang.id,
              currentLevel: CEFRLevel.A1,
              learningGoal: LearningGoal.DAILY_CONVERSATION,
              dailyMinutesGoal: 20,
              hearts: 5,
              maxHearts: 5,
            },
          },
        },
        include: { profile: true },
      });

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        config.jwtAccessSecret,
        { expiresIn: '1h' }
      );

      users.push(user);
      tokens.push(token);
    }
    assert(users.length === 4, 'Successfully provisioned 4 isolated test users');

    const character = await prisma.aICharacter.findFirst({
      where: { targetLanguageCode: 'es', isActive: true },
    });
    if (!character) {
      throw new Error('No active Spanish AI tutor character found in DB');
    }

    // ---------------------------------------------------------
    // 2. CONCURRENCY TESTING (Section 4)
    // ---------------------------------------------------------
    console.log('\n--- 2. Concurrency Stress: 4 Simultaneous Users ---');
    
    // 2.1 Simultaneous AI Conversations
    const convPromises = users.map((u) =>
      aiService.startConversation(u.id, character.id, 'Hobbies & Weekend')
    );
    const conversations = await Promise.all(convPromises);
    assert(conversations.length === 4, 'All 4 simultaneous conversation creations succeeded');
    const uniqueConvIds = new Set(conversations.map((c) => c.id));
    assert(uniqueConvIds.size === 4, 'All 4 conversations received globally unique IDs');
    conversations.forEach((c, idx) => {
      assert(c.userId === users[idx].id, `Conversation ${idx} is strictly owned by User ${String.fromCharCode(65 + idx)}`);
    });

    // 2.2 Simultaneous AI Messages
    const msgPromises = conversations.map((c, idx) =>
      aiService.sendMessage(users[idx].id, c.id, `Hola amigo, soy el usuario ${idx}`)
    );
    const msgResults = await Promise.all(msgPromises);
    assert(msgResults.length === 4, 'All 4 simultaneous AI message turns succeeded');
    msgResults.forEach((res, idx) => {
      assert(res.userMessage.content.includes(`usuario ${idx}`), `Message turn ${idx} correctly reflected user prompt`);
      assert(res.assistantMessage.content.length > 0, `Message turn ${idx} returned non-empty pedagogical reply`);
    });

    // 2.3 Simultaneous Voice Calls
    const voicePromises = users.map((u) =>
      aiService.initiateVoiceCall(u.id, {
        characterId: character.id,
        topic: 'Coffee & Drinks',
      })
    );
    const voiceCalls = await Promise.all(voicePromises);
    assert(voiceCalls.length === 4, 'All 4 simultaneous voice calls initiated successfully');
    const uniqueVoiceIds = new Set(voiceCalls.map((v) => v.id));
    assert(uniqueVoiceIds.size === 4, 'All 4 voice calls have distinct call IDs');

    // 2.4 Simultaneous Voice Turns
    const voiceTurnPromises = voiceCalls.map((v, idx) =>
      aiService.processVoiceTurn(users[idx].id, v.id, {
        spokenText: 'Un café con leche por favor',
        audioDurationMs: 2500,
      })
    );
    const voiceTurnResults = await Promise.all(voiceTurnPromises);
    assert(voiceTurnResults.length === 4, 'All 4 simultaneous voice turns processed successfully');
    voiceTurnResults.forEach((res, idx) => {
      assert(res.pronunciationScore >= 50, `Voice turn ${idx} scored pronunciation >= 50% (${res.pronunciationScore}%)`);
      assert(res.assistantAudioBase64.length > 100, `Voice turn ${idx} produced valid synthesized audio`);
    });

    // 2.5 Simultaneous Video Calls & Lip-Sync
    const videoPromises = users.map((u) =>
      aiService.initiateVideoCall(u.id, {
        characterId: character.id,
        topic: 'Business & Planning',
      })
    );
    const videoCalls = await Promise.all(videoPromises);
    assert(videoCalls.length === 4, 'All 4 simultaneous video calls initiated successfully');
    const uniqueVideoIds = new Set(videoCalls.map((v) => v.id));
    assert(uniqueVideoIds.size === 4, 'All 4 video calls have distinct call IDs');

    // 2.6 Simultaneous Video Turns with Visemes
    const videoTurnPromises = videoCalls.map((v, idx) =>
      aiService.processVideoTurn(users[idx].id, v.id, {
        spokenText: 'Buenos días equipo',
        audioDurationMs: 2000,
      })
    );
    const videoTurnResults = await Promise.all(videoTurnPromises);
    assert(videoTurnResults.length === 4, 'All 4 simultaneous video turns processed successfully');
    videoTurnResults.forEach((res, idx) => {
      assert(res.visemes.length > 0, `Video turn ${idx} generated ${res.visemes.length} lip-sync visemes`);
      assert(res.facialEngagementScore >= 50, `Video turn ${idx} scored facial engagement: ${res.facialEngagementScore}%`);
    });

    // 2.7 Simultaneous End Calls & Debriefs
    const endVoicePromises = voiceCalls.map((v, idx) =>
      aiService.endVoiceCall(users[idx].id, v.id, { durationSec: 60 })
    );
    const endVoiceResults = await Promise.all(endVoicePromises);
    assert(endVoiceResults.length === 4, 'All 4 simultaneous voice calls ended cleanly with debrief');

    const endVideoPromises = videoCalls.map((v, idx) =>
      aiService.endVideoCall(users[idx].id, v.id, { durationSec: 90 })
    );
    const endVideoResults = await Promise.all(endVideoPromises);
    assert(endVideoResults.length === 4, 'All 4 simultaneous video calls ended cleanly with debrief');

    // ---------------------------------------------------------
    // 3. XP & ACHIEVEMENT IDEMPOTENCY STRESS (Section 7)
    // ---------------------------------------------------------
    console.log('\n--- 3. XP & Achievement Idempotency Under Extreme Concurrency ---');

    const idempotencyKey1 = `prod_test_xp_single:${timestamp}`;
    
    // 3.1 Single request
    const singleResult = await xpService.awardXp({
      userId: users[0].id,
      amount: 25,
      reason: 'PRACTICE_COMPLETED',
      idempotencyKey: idempotencyKey1,
    });
    assert(singleResult.awarded === true && singleResult.amount === 25, 'Single XP award request granted 25 XP');

    // 3.2 Burst of 5 identical concurrent requests
    const burst5Promises = Array.from({ length: 5 }, () =>
      xpService.awardXp({
        userId: users[0].id,
        amount: 25,
        reason: 'PRACTICE_COMPLETED',
        idempotencyKey: idempotencyKey1,
      })
    );
    const burst5Results = await Promise.all(burst5Promises);
    const duplicateAwards5 = burst5Results.filter((r: any) => r.awarded === true);
    assert(duplicateAwards5.length === 0, '5 identical concurrent XP requests resulted in 0 duplicate awards');

    // 3.3 Burst of 10 identical concurrent requests with new key
    const idempotencyKey10 = `prod_test_xp_10:${timestamp}`;
    const burst10Promises = Array.from({ length: 10 }, () =>
      xpService.awardXp({
        userId: users[1].id,
        amount: 50,
        reason: 'LESSON_COMPLETED',
        idempotencyKey: idempotencyKey10,
      })
    );
    const burst10Results = await Promise.all(burst10Promises);
    const granted10 = burst10Results.filter((r: any) => r.awarded === true);
    assert(granted10.length === 1, '10 simultaneous identical XP requests granted EXACTLY 1 award');

    // 3.4 Burst of 20 identical concurrent requests with new key
    const idempotencyKey20 = `prod_test_xp_20:${timestamp}`;
    const burst20Promises = Array.from({ length: 20 }, () =>
      xpService.awardXp({
        userId: users[2].id,
        amount: 100,
        reason: 'AI_VIDEO_CALL_COMPLETED',
        idempotencyKey: idempotencyKey20,
      })
    );
    const burst20Results = await Promise.all(burst20Promises);
    const granted20 = burst20Results.filter((r: any) => r.awarded === true);
    assert(granted20.length === 1, '20 simultaneous identical XP requests granted EXACTLY 1 award');

    // 3.5 Achievement unlock idempotency
    const achv1Promises = Array.from({ length: 10 }, () =>
      achievementsService.unlockAchievement(users[3].id, 'THREE_DAY_STREAK')
    );
    const achv1Results = await Promise.all(achv1Promises);
    const unlockedList = achv1Results.filter((r: any) => r !== null);
    const userAchvCount = await prisma.userAchievement.count({
      where: { userId: users[3].id, achievement: { code: 'THREE_DAY_STREAK' } },
    });
    assert(unlockedList.length === 1 && userAchvCount === 1, '10 simultaneous unlockAchievement calls unlocked EXACTLY 1 achievement record');

    // ---------------------------------------------------------
    // 4. SECURITY & IDOR AUDIT (Section 8)
    // ---------------------------------------------------------
    console.log('\n--- 4. Comprehensive Cross-User IDOR Security Gate ---');

    // 4.1 User B attempting to read User A's conversation
    let idorConvReadBlocked = false;
    try {
      await aiService.getConversation(users[1].id, conversations[0].id);
    } catch (e: any) {
      idorConvReadBlocked = e.statusCode === 403 || e.statusCode === 404;
    }
    assert(idorConvReadBlocked, 'User B reading User A conversation is REJECTED (403/404)');

    // 4.2 User B attempting to post message to User A's conversation
    let idorMsgBlocked = false;
    try {
      await aiService.sendMessage(users[1].id, conversations[0].id, 'Injected cross-user message');
    } catch (e: any) {
      idorMsgBlocked = e.statusCode === 403 || e.statusCode === 404;
    }
    assert(idorMsgBlocked, 'User B posting message to User A conversation is REJECTED (403/404)');

    // 4.3 User B attempting to end User A's conversation
    let idorEndConvBlocked = false;
    try {
      await aiService.endConversation(users[1].id, conversations[0].id);
    } catch (e: any) {
      idorEndConvBlocked = e.statusCode === 403 || e.statusCode === 404;
    }
    assert(idorEndConvBlocked, 'User B ending User A conversation is REJECTED (403/404)');

    // 4.4 User B attempting to execute voice turn on User A's call
    let idorVoiceTurnBlocked = false;
    try {
      await aiService.processVoiceTurn(users[1].id, voiceCalls[0].id, { spokenText: 'Cross-user audio turn' });
    } catch (e: any) {
      idorVoiceTurnBlocked = e.statusCode === 403 || e.statusCode === 404;
    }
    assert(idorVoiceTurnBlocked, 'User B executing turn on User A voice call is REJECTED (403/404)');

    // 4.5 User B attempting to end User A's voice call
    let idorEndVoiceBlocked = false;
    try {
      await aiService.endVoiceCall(users[1].id, voiceCalls[0].id, { durationSec: 10 });
    } catch (e: any) {
      idorEndVoiceBlocked = e.statusCode === 403 || e.statusCode === 404;
    }
    assert(idorEndVoiceBlocked, 'User B ending User A voice call is REJECTED (403/404)');

    // 4.6 User B attempting to execute video turn on User A's video call
    let idorVideoTurnBlocked = false;
    try {
      await aiService.processVideoTurn(users[1].id, videoCalls[0].id, { spokenText: 'Cross-user video turn' });
    } catch (e: any) {
      idorVideoTurnBlocked = e.statusCode === 403 || e.statusCode === 404;
    }
    assert(idorVideoTurnBlocked, 'User B executing turn on User A video call is REJECTED (403/404)');

    // 4.7 User B attempting to end User A's video call
    let idorEndVideoBlocked = false;
    try {
      await aiService.endVideoCall(users[1].id, videoCalls[0].id, { durationSec: 10 });
    } catch (e: any) {
      idorEndVideoBlocked = e.statusCode === 403 || e.statusCode === 404;
    }
    assert(idorEndVideoBlocked, 'User B ending User A video call is REJECTED (403/404)');

    // ---------------------------------------------------------
    // 5. JWT & WEBSOCKET SESSION SECURITY (Section 9)
    // ---------------------------------------------------------
    console.log('\n--- 5. JWT & WebSocket Realtime Session Security ---');

    const httpServer = new HttpServer();
    const signalingServer = new SignalingServer(httpServer);
    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    const port = (httpServer.address() as any).port;
    const wsUrl = `ws://127.0.0.1:${port}/ws`;

    // 5.1 Expired Access Token
    const expiredToken = jwt.sign(
      { userId: users[0].id, email: users[0].email, role: users[0].role },
      config.jwtAccessSecret,
      { expiresIn: '-1s' }
    );
    let expiredWsRejected = false;
    const wsExpired = new WebSocket(wsUrl);
    await new Promise<void>((resolve) => {
      wsExpired.on('open', () => {
        wsExpired.send(JSON.stringify({
          event: 'auth:identify',
          payload: { userId: users[0].id, token: expiredToken },
        }));
      });
      wsExpired.on('message', (raw) => {
        const msg = JSON.parse(raw.toString());
        if (msg.event === 'auth:error' && msg.error.includes('expired')) {
          expiredWsRejected = true;
          wsExpired.close();
          resolve();
        }
      });
      setTimeout(() => { wsExpired.close(); resolve(); }, 1500);
    });
    assert(expiredWsRejected, 'WebSocket identify with expired JWT is REJECTED (auth:error)');

    // 5.2 Forged Token (signed with invalid secret)
    const forgedToken = jwt.sign(
      { userId: users[0].id, email: users[0].email, role: users[0].role },
      'completely_wrong_secret_1234567890'
    );
    let forgedWsRejected = false;
    const wsForged = new WebSocket(wsUrl);
    await new Promise<void>((resolve) => {
      wsForged.on('open', () => {
        wsForged.send(JSON.stringify({
          event: 'auth:identify',
          payload: { userId: users[0].id, token: forgedToken },
        }));
      });
      wsForged.on('message', (raw) => {
        const msg = JSON.parse(raw.toString());
        if (msg.event === 'auth:error') {
          forgedWsRejected = true;
          wsForged.close();
          resolve();
        }
      });
      setTimeout(() => { wsForged.close(); resolve(); }, 1500);
    });
    assert(forgedWsRejected, 'WebSocket identify with forged JWT is REJECTED (auth:error)');

    // 5.3 User ID Mismatch (Token userId != payload userId)
    let mismatchWsRejected = false;
    const wsMismatch = new WebSocket(wsUrl);
    await new Promise<void>((resolve) => {
      wsMismatch.on('open', () => {
        wsMismatch.send(JSON.stringify({
          event: 'auth:identify',
          payload: { userId: users[1].id, token: tokens[0] }, // User A token with User B ID
        }));
      });
      wsMismatch.on('message', (raw) => {
        const msg = JSON.parse(raw.toString());
        if (msg.event === 'auth:error' && msg.error.includes('match')) {
          mismatchWsRejected = true;
          wsMismatch.close();
          resolve();
        }
      });
      setTimeout(() => { wsMismatch.close(); resolve(); }, 1500);
    });
    assert(mismatchWsRejected, 'WebSocket identify with mismatched User ID vs Token is REJECTED');

    // 5.4 Unauthenticated Signaling Attempt
    let unauthSignalingBlocked = false;
    const wsUnauth = new WebSocket(wsUrl);
    await new Promise<void>((resolve) => {
      wsUnauth.on('open', () => {
        wsUnauth.send(JSON.stringify({
          event: 'call:invite',
          payload: { targetUserId: users[1].id, callId: 'fake-call' },
        }));
      });
      wsUnauth.on('message', (raw) => {
        const msg = JSON.parse(raw.toString());
        if (msg.event === 'error' && msg.error.includes('Authentication required')) {
          unauthSignalingBlocked = true;
          wsUnauth.close();
          resolve();
        }
      });
      setTimeout(() => { wsUnauth.close(); resolve(); }, 1500);
    });
    assert(unauthSignalingBlocked, 'Unauthenticated call signaling is strictly BLOCKED');

    // 5.5 Clean Disconnect & Logout
    const wsAuth = new WebSocket(wsUrl);
    let loggedOutCleanly = false;
    await new Promise<void>((resolve) => {
      wsAuth.on('open', () => {
        wsAuth.send(JSON.stringify({
          event: 'auth:identify',
          payload: { userId: users[0].id, token: tokens[0] },
        }));
      });
      wsAuth.on('message', (raw) => {
        const msg = JSON.parse(raw.toString());
        if (msg.event === 'auth:identified') {
          wsAuth.send(JSON.stringify({ event: 'auth:logout' }));
        } else if (msg.event === 'auth:logged_out') {
          loggedOutCleanly = true;
          wsAuth.close();
          resolve();
        }
      });
      setTimeout(() => { wsAuth.close(); resolve(); }, 1500);
    });
    assert(loggedOutCleanly, 'WebSocket auth:logout cleans up active session immediately');
    httpServer.close();

    // ---------------------------------------------------------
    // 6. AI PROVIDER FAILURE & INPUT VALIDATION (Section 10)
    // ---------------------------------------------------------
    console.log('\n--- 6. AI Provider Failure & Input Validation ---');

    // 6.1 Empty message rejection
    let emptyMsgRejected = false;
    try {
      await aiService.sendMessage(users[0].id, conversations[0].id, '');
    } catch (e: any) {
      emptyMsgRejected = e.statusCode === 400;
    }
    assert(emptyMsgRejected, 'Empty AI message is REJECTED with 400 Bad Request');

    // 6.2 Excessively long message
    const hugeMessage = 'A'.repeat(5000);
    let hugeMsgRejected = false;
    try {
      await aiService.sendMessage(users[0].id, conversations[0].id, hugeMessage);
    } catch (e: any) {
      hugeMsgRejected = e.statusCode === 400;
    }
    assert(hugeMsgRejected, 'Oversized prompt (>4000 chars) is REJECTED with 400 Bad Request');

    // 6.3 Nonexistent Character ID
    let invalidCharRejected = false;
    try {
      await aiService.startConversation(users[0].id, 'non-existent-character-id', 'Test Topic');
    } catch (e: any) {
      invalidCharRejected = e.statusCode === 404;
    }
    assert(invalidCharRejected, 'Nonexistent AI character ID is REJECTED with 404 Not Found');

    // 6.4 Nonexistent Call ID on Turn
    let invalidCallRejected = false;
    try {
      await aiService.processVoiceTurn(users[0].id, 'non-existent-call-id', { spokenText: 'Test Speech' });
    } catch (e: any) {
      invalidCallRejected = e.statusCode === 404;
    }
    assert(invalidCallRejected, 'Nonexistent call ID turn is REJECTED with 404 Not Found');

    // ---------------------------------------------------------
    // 7. RESOURCE LEAK STRESS: 10 CONSECUTIVE CALL CYCLES (Section 11)
    // ---------------------------------------------------------
    console.log('\n--- 7. Resource Leak Stress: 10 Rapid Consecutive Call Cycles ---');
    let consecutiveCyclesPassed = true;
    for (let c = 0; c < 10; c++) {
      try {
        const vcall = await aiService.initiateVoiceCall(users[0].id, {
          characterId: character.id,
          topic: `Rapid Cycle ${c}`,
        });
        await aiService.processVoiceTurn(users[0].id, vcall.id, { spokenText: 'Rapid phrase' });
        const debrief = await aiService.endVoiceCall(users[0].id, vcall.id, { durationSec: 15 });
        if (!debrief || debrief.turnsCompleted === undefined) {
          consecutiveCyclesPassed = false;
        }
      } catch (err) {
        consecutiveCyclesPassed = false;
        break;
      }
    }
    assert(consecutiveCyclesPassed, '10 consecutive Call -> Turn -> Hangup cycles completed with 0 leaks');

    // ---------------------------------------------------------
    // 8. DATABASE INTEGRITY VERIFICATION (Section 6)
    // ---------------------------------------------------------
    console.log('\n--- 8. Database Integrity Verification ---');
    
    // Check for orphan messages
    const orphanMessages: any[] = await prisma.$queryRaw`
      SELECT id FROM "public"."AIMessage" 
      WHERE "conversationId" NOT IN (SELECT id FROM "public"."AIConversation");
    `;
    assert(orphanMessages.length === 0, 'Found 0 orphan AIMessage records in database');

    // Check for orphan memories
    const orphanMemories: any[] = await prisma.$queryRaw`
      SELECT id FROM "public"."AIConversationMemory" 
      WHERE "conversationId" NOT IN (SELECT id FROM "public"."AIConversation");
    `;
    assert(orphanMemories.length === 0, 'Found 0 orphan AIConversationMemory records in database');

    // Check for duplicate XP transaction idempotency keys
    const rawDuplicateXP: any[] = await prisma.$queryRaw`
      SELECT "idempotencyKey", COUNT(*) as cnt 
      FROM "public"."XPTransaction" 
      WHERE "idempotencyKey" IS NOT NULL 
      GROUP BY "idempotencyKey" 
      HAVING COUNT(*) > 1;
    `;
    assert(rawDuplicateXP.length === 0, 'Found 0 duplicate idempotency keys in XP transactions');

    // Check for duplicate achievements per user
    const rawDuplicateAchievements: any[] = await prisma.$queryRaw`
      SELECT "userId", "achievementId", COUNT(*) as cnt 
      FROM "public"."UserAchievement" 
      GROUP BY "userId", "achievementId" 
      HAVING COUNT(*) > 1;
    `;
    assert(rawDuplicateAchievements.length === 0, 'Found 0 duplicate UserAchievement records');

    // ---------------------------------------------------------
    // 9. CLEANUP
    // ---------------------------------------------------------
    console.log('\n--- 9. Cleaning Up Test Data ---');
    for (const u of users) {
      await prisma.user.delete({ where: { id: u.id } });
    }
    assert(true, 'Cleaned up all 4 temporary test accounts');

  } catch (error) {
    console.error('Fatal regression suite error:', error);
    failedTests++;
  }

  console.log('\n================================================================');
  console.log(`🎉 PHASE 5 PRODUCTION REGRESSION COMPLETE: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runPhase5ProductionReadinessSuite()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
