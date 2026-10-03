import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/database/prisma';
import { currencyService } from '../src/modules/progression/currency.service';

const app = createApp();

describe('Phase 7 — AI Video Calling Test Suite', () => {
  const testEmail = 'phase7.video.tester@example.com';
  const testPassword = 'Password123!';
  let token = '';
  let userId = '';
  let characterId = 'char-mateo';
  let activeCallId = '';

  beforeAll(async () => {
    // Clean up test user from previous runs
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });

    // Register test user
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        displayName: 'Phase 7 Video Tester',
      });

    userId = regRes.body.data.user.id;
    token = regRes.body.data.accessToken || regRes.body.data.tokens?.accessToken;

    // Complete onboarding
    await request(app)
      .post('/api/v1/users/me/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nativeLanguageId: 'en',
        targetLanguageId: 'es',
        dailyMinutesGoal: 20,
        learningGoal: 'SPEAKING',
        initialLevel: 'A1',
        timezone: 'UTC',
      });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });
    await prisma.$disconnect();
  });

  describe('1. Video Call Initiation & Avatar Signaling', () => {
    it('should reject unauthenticated request to /video-calls/initiate', async () => {
      const res = await request(app)
        .post('/api/v1/ai/video-calls/initiate')
        .send({ characterId });
      expect(res.status).toBe(401);
    });

    it('should reject call initiation with invalid characterId', async () => {
      const res = await request(app)
        .post('/api/v1/ai/video-calls/initiate')
        .set('Authorization', `Bearer ${token}`)
        .send({ characterId: 'non-existent-character-id' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should initiate video call with Mateo and return initial avatar animation and scene visual aid', async () => {
      const res = await request(app)
        .post('/api/v1/ai/video-calls/initiate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          characterId,
          topic: 'Pedir café y desayuno en Madrid',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const call = res.body.data.call;
      expect(call).toBeDefined();
      expect(call.id).toMatch(/^vcall-/);
      expect(call.character.name).toBe('Mateo');
      expect(call.status).toBe('CONNECTED');
      expect(call.greetingText).toContain('café');
      expect(call.greetingAudioBase64).toBeDefined();
      expect(call.audioMimeType).toBe('audio/wav');
      expect(call.currentEmotion).toBe('happy');
      expect(Array.isArray(call.initialVisemes)).toBe(true);
      expect(call.initialVisemes.length).toBeGreaterThan(0);

      // Verify scene visual aid prop
      expect(call.initialVisualAid).toBeDefined();
      expect(call.initialVisualAid.title).toBe('Menú del Café Central');
      expect(call.initialVisualAid.category).toBe('menu');
      expect(call.initialVisualAid.targetVocab).toContain('Café con leche');
      expect(call.sceneSetting).toContain('Madrid');

      activeCallId = call.id;
    });

    it('should fetch active video call state by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/ai/video-calls/${activeCallId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.call.id).toBe(activeCallId);
      expect(res.body.data.call.status).toBe('CONNECTED');
      expect(res.body.data.call.sceneSetting).toBeDefined();
    });
  });

  describe('2. Interactive Video Turns, Visemes & Scaffolding', () => {
    it('should process user speech turn with synchronized mouth visemes and emotion', async () => {
      const res = await request(app)
        .post(`/api/v1/ai/video-calls/${activeCallId}/turn`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          spokenText: 'Hola Mateo, me gustaría pedir un café con leche por favor.',
          audioDurationMs: 2500,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const turn = res.body.data;
      expect(turn.turnIndex).toBe(1);
      expect(turn.userTranscription).toContain('café con leche');
      expect(turn.pronunciationScore).toBeGreaterThanOrEqual(80);
      expect(turn.fluencyScore).toBeGreaterThanOrEqual(80);
      expect(turn.facialEngagementScore).toBeGreaterThanOrEqual(80);
      expect(turn.assistantReply).toBeDefined();
      expect(turn.assistantAudioBase64).toBeDefined();
      expect(turn.audioMimeType).toBe('audio/wav');

      // Verify animation visemes sequence
      expect(Array.isArray(turn.visemes)).toBe(true);
      expect(turn.visemes.length).toBeGreaterThan(0);
      expect(turn.visemes[0].viseme).toBe('rest');
      expect(['nod', 'smile', 'wave', 'tilt', 'rest']).toContain(turn.gesture);
      expect(['happy', 'celebrating', 'encouraging', 'thoughtful', 'neutral']).toContain(turn.emotion);

      // Verify micro-XP awarded
      expect(turn.xpAwarded).toBe(7);
    });

    it('should provide dynamic visual aid hint card when user requests help', async () => {
      const res = await request(app)
        .post(`/api/v1/ai/video-calls/${activeCallId}/turn`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          spokenText: '¿Cómo puedo pedir la cuenta?',
          requestHelpHint: true,
        });

      expect(res.status).toBe(200);
      const turn = res.body.data;
      expect(turn.emotion).toBe('encouraging');
      expect(turn.visualAid).toBeDefined();
      expect(turn.visualAid.title).toContain('Guía de Ayuda');
      expect(turn.visualAid.category).toBe('flashcard');
      expect(turn.visualAid.targetVocab).toContain('La cuenta');
    });

    it('should adapt avatar emotion to celebrating when user articulates Spanish with high accuracy', async () => {
      const res = await request(app)
        .post(`/api/v1/ai/video-calls/${activeCallId}/turn`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          spokenText: 'El perro corre rápido por el parque.',
          audioDurationMs: 2200,
        });

      expect(res.status).toBe(200);
      const turn = res.body.data;
      expect(turn.pronunciationScore).toBeGreaterThanOrEqual(95);
      expect(turn.emotion).toBe('celebrating');
      expect(turn.gesture).toBe('smile');
    });
  });

  describe('3. Video Call Conclusion, Debrief & Authoritative Rewards', () => {
    it('should conclude video call and award XP, Gems, and FIRST_AI_VIDEO_CALL achievement', async () => {
      const initialBalance = await currencyService.getBalance(userId);

      const res = await request(app)
        .post(`/api/v1/ai/video-calls/${activeCallId}/end`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          durationSec: 160,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const debrief = res.body.data.debrief;
      expect(debrief.callId).toBe(activeCallId);
      expect(debrief.characterName).toBe('Mateo');
      expect(debrief.totalDurationSec).toBe(160);
      expect(debrief.turnsCompleted).toBe(3);
      expect(debrief.overallAccuracy).toBeGreaterThanOrEqual(85);
      expect(debrief.overallFluency).toBeGreaterThanOrEqual(80);
      expect(debrief.facialEngagementScore).toBeGreaterThanOrEqual(85);
      expect(debrief.wordsSpokenEstimate).toBeGreaterThan(0);
      expect(debrief.wordsPerMinute).toBeGreaterThan(0);
      expect(debrief.xpAwarded).toBe(35);
      expect(debrief.gemsAwarded).toBe(5);
      expect(debrief.visualAidsExplored).toBeGreaterThanOrEqual(1);

      // Verify FIRST_AI_VIDEO_CALL achievement was unlocked
      expect(debrief.unlockedAchievements).toContain('FIRST_AI_VIDEO_CALL');

      // Verify gems credited to user balance
      const newBalance = await currencyService.getBalance(userId);
      expect(newBalance - initialBalance).toBe(5);
    });

    it('should reject turns on an already ended video call', async () => {
      const res = await request(app)
        .post(`/api/v1/ai/video-calls/${activeCallId}/turn`)
        .set('Authorization', `Bearer ${token}`)
        .send({ spokenText: '¿Hola?' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
