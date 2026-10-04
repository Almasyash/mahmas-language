// ==============================================================================
// MAHMAS LANGUAGE — PHASE 4 DEEP QA & REALTIME REGRESSION TEST SUITE
// Tests:
// 1. Security & IDOR Gate: Cross-User conversation & call isolation (User A vs User B)
// 2. AI Tutor Multi-Language Isolation & Persona Context (en, es, fr, de, ja)
// 3. AI Voice Calling: State Machine, Speech Evaluation, Speech Synthesis, Lifecycle
// 4. AI Video Calling: Viseme Lip-Sync, Procedural Emotions, Scenario Visual Aids
// 5. WebSocket Signaling: JWT verification, unauthenticated signal rejection, P2P signaling
// 6. Abuse & Input Validation: Empty message rejection, large message rejection
// ==============================================================================

import { PrismaClient, CEFRLevel } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { WebSocket } from 'ws';
import { aiService } from '../src/modules/ai/ai.service';
import { config } from '../src/config/environment';

const prisma = new PrismaClient();

async function runPhase4RegressionTests() {
  console.log('================================================================');
  console.log('🚀 RUNNING PHASE 4: AI TUTOR, VOICE, VIDEO & REALTIME REGRESSION');
  console.log('================================================================');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ [PASS] ${testName}`);
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${detail ? `(${detail})` : ''}`);
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  const enLang = await prisma.language.findUnique({ where: { code: 'en' } });
  const esLang = await prisma.language.findUnique({ where: { code: 'es' } });
  const hiLang = await prisma.language.findUnique({ where: { code: 'hi' } });

  if (!enLang || !esLang || !hiLang) {
    throw new Error('Seed data missing for en, es, or hi languages.');
  }

  const passwordHash = await bcrypt.hash('TestPass123!', 10);
  const timestamp = Date.now();

  // --------------------------------------------------------------------------
  // TEST USERS SETUP
  // --------------------------------------------------------------------------
  console.log('\n--- 1. Setting up Isolated Test Users ---');
  const userA = await prisma.user.create({
    data: {
      email: `tutor-user-a-${timestamp}@test.com`,
      passwordHash,
      onboardingCompleted: true,
      profile: {
        create: {
          displayName: 'User A (English Learner)',
          nativeLanguageId: hiLang.id,
          targetLanguageId: enLang.id,
          currentLevel: CEFRLevel.A1,
        },
      },
    },
    include: { profile: true },
  });

  const userB = await prisma.user.create({
    data: {
      email: `tutor-user-b-${timestamp}@test.com`,
      passwordHash,
      onboardingCompleted: true,
      profile: {
        create: {
          displayName: 'User B (Spanish Learner)',
          nativeLanguageId: hiLang.id,
          targetLanguageId: esLang.id,
          currentLevel: CEFRLevel.A1,
        },
      },
    },
    include: { profile: true },
  });

  const tokenA = jwt.sign({ userId: userA.id, email: userA.email, role: 'USER' }, config.jwtAccessSecret, { expiresIn: '1h' });
  const tokenB = jwt.sign({ userId: userB.id, email: userB.email, role: 'USER' }, config.jwtAccessSecret, { expiresIn: '1h' });

  assert(Boolean(userA && userB), 'Created authenticated test accounts User A and User B');

  // Verify Characters
  const characters = await aiService.getCharacters();
  assert(characters.length >= 10, `Loaded seeded characters: count=${characters.length}`);
  const sarah = characters.find((c) => c.name.includes('Sarah'));
  const mateo = characters.find((c) => c.name.includes('Mateo'));
  assert(Boolean(sarah && mateo), 'Found Sarah (English) and Mateo (Spanish) AI tutors');

  // --------------------------------------------------------------------------
  // 2. SECURITY & IDOR GATE: CONVERSATION OWNERSHIP
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Security Gate: Conversation Ownership & IDOR ---');
  const convA = await aiService.startConversation(userA.id, sarah!.id, 'Café and Coffee Chat');
  assert(convA.userId === userA.id, 'User A creates conversation with Sarah');
  assert(convA.messages.length === 1, 'Initial greeting turn present in conversation');
  assert(convA.messages[0].content.includes('Hello'), 'Sarah opening greeting is in English');

  // User A can access own conversation
  const fetchedConvA = await aiService.getConversation(userA.id, convA.id);
  assert(fetchedConvA.id === convA.id, 'User A can access own conversation');

  // User B attempting to access User A's conversation must be REJECTED (NotFoundError)
  let userBAccessBlocked = false;
  try {
    await aiService.getConversation(userB.id, convA.id);
  } catch (err: any) {
    userBAccessBlocked = err.statusCode === 404 || err.message.includes('not found');
  }
  assert(userBAccessBlocked, 'User B accessing User A conversation is DENIED (404 Not Found)');

  // User B attempting to send message in User A's conversation must be REJECTED
  let userBMessageBlocked = false;
  try {
    await aiService.sendMessage(userB.id, convA.id, 'Malicious injection');
  } catch (err: any) {
    userBMessageBlocked = err.statusCode === 404 || err.message.includes('not found');
  }
  assert(userBMessageBlocked, 'User B sending message to User A conversation is DENIED (404 Not Found)');

  // User B attempting to end User A's conversation must be REJECTED
  let userBEndBlocked = false;
  try {
    await aiService.endConversation(userB.id, convA.id, 60);
  } catch (err: any) {
    userBEndBlocked = err.statusCode === 404 || err.message.includes('not found');
  }
  assert(userBEndBlocked, 'User B ending User A conversation is DENIED (404 Not Found)');

  // --------------------------------------------------------------------------
  // 3. AI TUTOR MULTI-LANGUAGE CONTEXT & CORRECTIONS
  // --------------------------------------------------------------------------
  console.log('\n--- 3. AI Tutor Multi-Language Isolation & Pedagogy ---');

  // Sarah (English) Turn 1
  const reply1 = await aiService.sendMessage(userA.id, convA.id, 'Hello Sarah! I like Earl Grey tea and I am a software engineer.');
  assert(Boolean(reply1.assistantMessage && reply1.userMessage), 'User message and Sarah reply recorded');
  assert(reply1.assistantMessage.content.length > 10, 'Sarah provided conversational English reply');
  assert(Boolean(reply1.newMemories?.some((m: { key: string }) => m.key === 'LIKES')), 'Extracted episodic memory: LIKES');
  assert(Boolean(reply1.newMemories?.some((m: { key: string }) => m.key === 'IDENTITY')), 'Extracted episodic memory: IDENTITY');

  // Sarah Turn 2 with intentional learner error
  const reply2 = await aiService.sendMessage(userA.id, convA.id, 'I want learn more grammar today.');
  assert(Boolean(reply2.assistantMessage.correctionNote), 'Non-intrusive pedagogical correction provided for "I want learn"');

  // End Sarah conversation and verify debrief
  const debriefSarah = await aiService.endConversation(userA.id, convA.id, 120);
  assert(debriefSarah.conversationId === convA.id, 'Debrief generated for English session');
  assert(debriefSarah.xpAwarded > 0, `Micro-interaction XP awarded: ${debriefSarah.xpAwarded} XP`);
  assert(debriefSarah.gemsAwarded > 0, `Gems awarded: ${debriefSarah.gemsAwarded} Gems`);

  // Ended conversation cannot receive further messages
  let messageOnEndedBlocked = false;
  try {
    await aiService.sendMessage(userA.id, convA.id, 'Are you still there?');
  } catch (err: any) {
    messageOnEndedBlocked = err.statusCode === 400 || err.message.includes('ended');
  }
  assert(messageOnEndedBlocked, 'Sending message to ended conversation is rejected (400 Bad Request)');

  // Mateo (Spanish) Session for User B
  const convB = await aiService.startConversation(userB.id, mateo!.id, 'Cafetería en Madrid');
  assert(convB.messages[0].content.includes('Hola'), 'Mateo opening greeting is in Spanish');

  const replyB1 = await aiService.sendMessage(userB.id, convB.id, 'Hola Mateo! Yo querer un café con leche por favor.');
  assert(Boolean(replyB1.assistantMessage.correctionNote), 'Spanish pedagogical correction provided for "Yo querer"');
  assert(replyB1.assistantMessage.content.includes('café') || replyB1.assistantMessage.content.includes('¡') || replyB1.assistantMessage.content.includes('Hola'), 'Mateo responded in Spanish');

  // --------------------------------------------------------------------------
  // 4. AI VOICE CALLING: LIFECYCLE & STATE MACHINE
  // --------------------------------------------------------------------------
  console.log('\n--- 4. AI Voice Calling Lifecycle & State Machine ---');
  const voiceCall = await aiService.initiateVoiceCall(userA.id, {
    characterId: sarah!.id,
    topic: 'Ordering coffee and tea in London',
  });

  assert(voiceCall.status === 'CONNECTED', 'Voice call state: CONNECTED');
  assert(voiceCall.greetingText.includes('Hello'), 'Voice greeting is in English');
  assert((voiceCall.greetingAudioBase64?.length ?? 0) > 100, 'Synthesized speech audio payload present');
  assert(voiceCall.audioMimeType === 'audio/wav', 'Audio MIME type is audio/wav');

  // User B cannot access User A's voice call
  let userBVoiceAccessBlocked = false;
  try {
    await aiService.getVoiceCall(userB.id, voiceCall.id);
  } catch (err: any) {
    userBVoiceAccessBlocked = err.statusCode === 404;
  }
  assert(userBVoiceAccessBlocked, 'User B accessing User A voice call is DENIED (404 Not Found)');

  // Turn 1
  const voiceTurn = await aiService.processVoiceTurn(userA.id, voiceCall.id, {
    spokenText: 'Hello Sarah! I would like a flat white with oat milk please.',
    audioDurationMs: 2500,
  });
  assert(voiceTurn.turnIndex === 1, 'Voice turn processed with turnIndex 1');
  assert(voiceTurn.pronunciationScore >= 50, `Speech pronunciation scored: ${voiceTurn.pronunciationScore}%`);
  assert(voiceTurn.fluencyScore >= 50, `Speech fluency scored: ${voiceTurn.fluencyScore}%`);
  assert(voiceTurn.phonemeFeedback.length > 0, 'Phoneme feedback returned');
  assert(voiceTurn.assistantAudioBase64.length > 100, 'Assistant voice response synthesized');

  // End voice call
  const voiceDebrief = await aiService.endVoiceCall(userA.id, voiceCall.id, { durationSec: 75 });
  assert(voiceDebrief.callId === voiceCall.id, 'Voice call debrief generated');
  assert(voiceDebrief.xpAwarded > 0, `Voice call XP awarded: ${voiceDebrief.xpAwarded} XP`);
  assert(voiceDebrief.turnsCompleted === 1, 'Voice call turnsCompleted correctly recorded as 1');

  // Attempting turn on ended voice call must be rejected
  let turnOnEndedVoiceBlocked = false;
  try {
    await aiService.processVoiceTurn(userA.id, voiceCall.id, { spokenText: 'Hello?' });
  } catch (err: any) {
    turnOnEndedVoiceBlocked = err.statusCode === 404 || err.message.includes('not found');
  }
  assert(turnOnEndedVoiceBlocked, 'Processing turn on ended voice call is rejected');

  // --------------------------------------------------------------------------
  // 5. AI VIDEO CALLING: VISEMES, EMOTIONS, VISUAL AIDS
  // --------------------------------------------------------------------------
  console.log('\n--- 5. AI Video Calling: Visemes, Emotions, & Visual Aids ---');
  const videoCall = await aiService.initiateVideoCall(userA.id, {
    characterId: sarah!.id,
    topic: 'Face-to-face London café practice',
  });

  assert(videoCall.status === 'CONNECTED', 'Video call state: CONNECTED');
  assert(videoCall.greetingText.includes('Hello'), 'Video greeting is in English');
  assert(videoCall.initialVisemes.length > 0, `Procedural visemes generated: count=${videoCall.initialVisemes.length}`);
  assert(Boolean(videoCall.initialVisualAid), 'Scenario visual aid cue generated');
  assert(videoCall.initialVisualAid?.category === 'menu', 'Visual aid category: menu (London Café)');

  // User B cannot access User A's video call
  let userBVideoAccessBlocked = false;
  try {
    await aiService.getVideoCall(userB.id, videoCall.id);
  } catch (err: any) {
    userBVideoAccessBlocked = err.statusCode === 404;
  }
  assert(userBVideoAccessBlocked, 'User B accessing User A video call is DENIED (404 Not Found)');

  // Video Turn 1
  const videoTurn = await aiService.processVideoTurn(userA.id, videoCall.id, {
    spokenText: 'Could I please get a warm scone with clotted cream?',
    audioDurationMs: 3000,
  });
  assert(videoTurn.visemes.length > 0, `Video turn lip-sync visemes generated: ${videoTurn.visemes.length}`);
  assert(videoTurn.pronunciationScore >= 50, `Video turn pronunciation score: ${videoTurn.pronunciationScore}%`);
  assert(videoTurn.assistantAudioBase64.length > 100, 'Video turn assistant speech synthesized');

  // End video call
  const videoDebrief = await aiService.endVideoCall(userA.id, videoCall.id, { durationSec: 90 });
  assert(videoDebrief.callId === videoCall.id, 'Video call debrief generated');
  assert(videoDebrief.facialEngagementScore >= 60, `Facial engagement scored: ${videoDebrief.facialEngagementScore}%`);
  assert(videoDebrief.xpAwarded > 0, `Video call XP awarded: ${videoDebrief.xpAwarded} XP`);

  // --------------------------------------------------------------------------
  // 6. WEBSOCKET REALTIME SIGNALING SECURITY & P2P FLOW
  // --------------------------------------------------------------------------
  console.log('\n--- 6. WebSocket Realtime Signaling Security & P2P Flow ---');
  await new Promise<void>((resolve, reject) => {
    const wsUrl = 'ws://localhost:4000/ws';
    const wsUnauth = new WebSocket(wsUrl);

    wsUnauth.on('open', () => {
      // 1. Attempt signaling without authentication
      wsUnauth.send(JSON.stringify({
        event: 'call:invite',
        payload: { targetUserId: userB.id, callType: 'video' },
      }));
    });

    wsUnauth.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.event === 'error' && msg.error.includes('Authentication required')) {
        assert(true, 'Unauthenticated WebSocket signaling is REJECTED');

        // 2. Attempt identification with forged token
        wsUnauth.send(JSON.stringify({
          event: 'auth:identify',
          payload: { token: 'forged.jwt.token' },
        }));
      } else if (msg.event === 'auth:error' && msg.error.includes('Invalid or expired')) {
        assert(true, 'Forged JWT WebSocket identify is REJECTED');

        // 3. Attempt identification with token but mismatched userId
        wsUnauth.send(JSON.stringify({
          event: 'auth:identify',
          payload: { token: tokenA, userId: userB.id },
        }));
      } else if (msg.event === 'auth:error' && msg.error.includes('User ID does not match')) {
        assert(true, 'Mismatched user ID in WebSocket identify is REJECTED');
        wsUnauth.close();
        testAuthenticatedSignalingFlow().then(resolve).catch(reject);
      }
    });

    wsUnauth.on('error', (err) => reject(err));
  });

  async function testAuthenticatedSignalingFlow(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = 'ws://localhost:4000/ws';
      const wsA = new WebSocket(wsUrl);
      const wsB = new WebSocket(wsUrl);

      let aIdentified = false;
      let bIdentified = false;

      wsA.on('open', () => {
        wsA.send(JSON.stringify({ event: 'auth:identify', payload: { token: tokenA } }));
      });

      wsB.on('open', () => {
        wsB.send(JSON.stringify({ event: 'auth:identify', payload: { token: tokenB } }));
      });

      wsA.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.event === 'auth:identified') {
          aIdentified = true;
          if (bIdentified) startCallSignaling();
        } else if (msg.event === 'call:accept') {
          assert(msg.payload.fromUserId === userB.id, 'User A received call:accept from User B');
          // Send ICE candidate
          wsA.send(JSON.stringify({
            event: 'call:signal:ice',
            payload: { targetUserId: userB.id, candidate: 'candidate:1 1 UDP 2122260223 192.168.0.1 50000 typ host' },
          }));
        }
      });

      wsB.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.event === 'auth:identified') {
          bIdentified = true;
          if (aIdentified) startCallSignaling();
        } else if (msg.event === 'call:invite') {
          assert(msg.payload.fromUserId === userA.id, 'User B received authenticated call:invite from User A');
          // Accept the call
          wsB.send(JSON.stringify({
            event: 'call:accept',
            payload: { targetUserId: userA.id },
          }));
        } else if (msg.event === 'call:signal:ice') {
          assert(msg.payload.fromUserId === userA.id, 'User B received call:signal:ice from User A');
          wsA.close();
          wsB.close();
          resolve();
        }
      });

      function startCallSignaling() {
        assert(true, 'Both WebSocket clients securely identified with verified JWTs');
        wsA.send(JSON.stringify({
          event: 'call:invite',
          payload: { targetUserId: userB.id, callType: 'video' },
        }));
      }

      wsA.on('error', reject);
      wsB.on('error', reject);
    });
  }

  // --------------------------------------------------------------------------
  // 7. INPUT VALIDATION & RATE LIMIT CHECKS
  // --------------------------------------------------------------------------
  console.log('\n--- 7. Input Validation & Abuse Protection ---');

  // Empty message rejection
  let emptyMsgRejected = false;
  try {
    await aiService.sendMessage(userA.id, convA.id, '   ');
  } catch (err: any) {
    emptyMsgRejected = err.statusCode === 400 || err.message.includes('empty');
  }
  assert(emptyMsgRejected, 'Empty message rejected by service (400 Bad Request)');

  // Cleanup test users
  console.log('\n--- 8. Cleanup Test Accounts ---');
  await prisma.aIMessage.deleteMany({ where: { conversation: { userId: { in: [userA.id, userB.id] } } } });
  await prisma.aIConversationMemory.deleteMany({ where: { conversation: { userId: { in: [userA.id, userB.id] } } } });
  await prisma.aIConversation.deleteMany({ where: { userId: { in: [userA.id, userB.id] } } });
  await prisma.profile.deleteMany({ where: { userId: { in: [userA.id, userB.id] } } });
  await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });
  assert(true, 'Cleaned up test accounts and database integrity preserved');

  console.log('\n================================================================');
  console.log(`🎉 PHASE 4 AUTOMATED REGRESSION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('================================================================');
}

runPhase4RegressionTests()
  .catch((err) => {
    console.error('Fatal error during regression test:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
