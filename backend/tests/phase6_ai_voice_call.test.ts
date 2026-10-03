import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/database/prisma';
import { currencyService } from '../src/modules/progression/currency.service';

const app = createApp();

describe('Phase 6 — AI Voice Calling Test Suite', () => {
  const testEmail = 'phase6.voice.tester@example.com';
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
        displayName: 'Phase 6 Voice Tester',
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

  describe('1. Voice Call Initiation & Signaling', () => {
    it('should reject unauthenticated request to /calls/initiate', async () => {
      const res = await request(app)
        .post('/api/v1/ai/calls/initiate')
        .send({ characterId });
      expect(res.status).toBe(401);
    });

    it('should reject call initiation with invalid characterId', async () => {
      const res = await request(app)
        .post('/api/v1/ai/calls/initiate')
        .set('Authorization', `Bearer ${token}`)
        .send({ characterId: 'non-existent-character-id' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should successfully initiate a live voice call with Mateo', async () => {
      const res = await request(app)
        .post('/api/v1/ai/calls/initiate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          characterId,
          topic: 'Práctica de pedidos en el café',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const call = res.body.data.call;
      expect(call).toBeDefined();
      expect(call.id).toMatch(/^call-/);
      expect(call.characterId).toBe('char-mateo');
      expect(call.character.name).toBe('Mateo');
      expect(call.status).toBe('CONNECTED');
      expect(call.greetingText).toContain('¡Hola');
      expect(call.greetingAudioBase64).toBeDefined();
      expect(call.audioMimeType).toBe('audio/wav');
      expect(call.turnCount).toBe(0);

      activeCallId = call.id;
    });

    it('should retrieve active voice call details via GET /calls/:id', async () => {
      const res = await request(app)
        .get(`/api/v1/ai/calls/${activeCallId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.call.id).toBe(activeCallId);
      expect(res.body.data.call.status).toBe('CONNECTED');
    });
  });

  describe('2. Spoken Turn Interaction & Pronunciation Scoring', () => {
    it('should process a user spoken turn and award speaking micro-XP', async () => {
      const res = await request(app)
        .post(`/api/v1/ai/calls/${activeCallId}/turn`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          spokenText: 'Hola Mateo, buenos días. ¿Qué tal estás hoy?',
          audioDurationMs: 2500,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const turn = res.body.data;
      expect(turn.turnIndex).toBe(1);
      expect(turn.userTranscription).toContain('Hola Mateo');
      expect(turn.pronunciationScore).toBeGreaterThanOrEqual(80);
      expect(turn.fluencyScore).toBeGreaterThanOrEqual(75);
      expect(Array.isArray(turn.phonemeFeedback)).toBe(true);
      expect(turn.phonemeFeedback.length).toBeGreaterThan(0);
      expect(turn.assistantReply).toBeDefined();
      expect(turn.assistantAudioBase64).toBeDefined();
      expect(turn.audioMimeType).toBe('audio/wav');
      expect(turn.xpAwarded).toBe(5);
    });

    it('should detect alveolar trill (rr) and provide specific phoneme feedback', async () => {
      const res = await request(app)
        .post(`/api/v1/ai/calls/${activeCallId}/turn`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          spokenText: 'Mi perro corre muy rápido por el parque de la ciudad.',
          audioDurationMs: 3200,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const turn = res.body.data;
      expect(turn.turnIndex).toBe(2);
      expect(turn.pronunciationScore).toBeGreaterThanOrEqual(90);

      const trillFeedback = turn.phonemeFeedback.find((p: any) => p.phoneme.includes('trill'));
      expect(trillFeedback).toBeDefined();
      expect(trillFeedback.status).toBe('EXCELLENT');
    });

    it('should detect grammar mistakes in spoken turns and provide correction notes', async () => {
      const res = await request(app)
        .post(`/api/v1/ai/calls/${activeCallId}/turn`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          spokenText: 'Yo querer un café solo por favor.',
          audioDurationMs: 2100,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const turn = res.body.data;
      expect(turn.turnIndex).toBe(3);
      expect(turn.correctionNote).toBeDefined();
      expect(turn.correctionNote).toContain('Yo quiero');
    });
  });

  describe('3. Voice Call Completion, Debriefing & Authoritative Rewards', () => {
    it('should end voice call, calculate aggregates and award XP, Gems, and achievements', async () => {
      // Check currency balance before ending call
      const gemsBefore = await currencyService.getBalance(userId);

      const res = await request(app)
        .post(`/api/v1/ai/calls/${activeCallId}/end`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          durationSec: 180,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const debrief = res.body.data.debrief;
      expect(debrief.callId).toBe(activeCallId);
      expect(debrief.characterName).toBe('Mateo');
      expect(debrief.totalDurationSec).toBe(180);
      expect(debrief.turnsCompleted).toBe(3);
      expect(debrief.overallAccuracy).toBeGreaterThan(0);
      expect(debrief.overallFluency).toBeGreaterThan(0);
      expect(debrief.wordsPerMinute).toBeGreaterThan(0);
      expect(debrief.xpAwarded).toBe(25);
      expect(debrief.gemsAwarded).toBe(3);
      expect(Array.isArray(debrief.pronunciationHighlights)).toBe(true);
      expect(debrief.unlockedAchievements).toContain('FIRST_AI_VOICE_CALL');

      // Verify Gems credited (+3)
      const gemsAfter = await currencyService.getBalance(userId);
      expect(gemsAfter - gemsBefore).toBe(3);

      // Verify FIRST_AI_VOICE_CALL achievement unlocked in DB
      const userAch = await prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
      });
      const unlockedCodes = userAch.map((ua) => ua.achievement.code);
      expect(unlockedCodes).toContain('FIRST_AI_VOICE_CALL');

      // Verify call is marked ended
      const callStateRes = await request(app)
        .get(`/api/v1/ai/calls/${activeCallId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(callStateRes.body.data.call.status).toBe('ENDED');
    });

    it('should reject turns on an already ended call', async () => {
      const res = await request(app)
        .post(`/api/v1/ai/calls/${activeCallId}/turn`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          spokenText: '¿Hola?',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
