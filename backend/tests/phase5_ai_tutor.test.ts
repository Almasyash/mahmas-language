import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/database/prisma';

const app = createApp();

describe('Phase 5 — AI Conversational Tutor Test Suite', () => {
  const testEmail = 'phase5.tester@example.com';
  const testPassword = 'Password123!';
  let token = '';
  let userId = '';
  let characterId = 'char-mateo';

  beforeAll(async () => {
    // Clean up test user from previous runs
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });

    // Register user
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        displayName: 'Phase 5 Tester',
      });

    userId = regRes.body.data.user.id;
    token = regRes.body.data.accessToken || regRes.body.data.tokens?.accessToken;

    // Complete onboarding to set target language to Spanish (es)
    await request(app)
      .post('/api/v1/users/me/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nativeLanguageId: 'en',
        targetLanguageId: 'es',
        dailyMinutesGoal: 15,
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

  describe('1. Character Discovery', () => {
    it('should reject unauthenticated request to /characters', async () => {
      const res = await request(app).get('/api/v1/ai/characters');
      expect(res.status).toBe(401);
    });

    it('should list all active AI characters', async () => {
      const res = await request(app)
        .get('/api/v1/ai/characters')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const chars = res.body.data.characters;
      expect(Array.isArray(chars)).toBe(true);
      expect(chars.length).toBeGreaterThanOrEqual(4);

      const mateo = chars.find((c: any) => c.name === 'Mateo');
      expect(mateo).toBeDefined();
      expect(mateo.targetLanguageCode).toBe('es');
      expect(mateo.difficultyCEFR).toBe('A1');
      expect(mateo.suggestedTopics).toBeDefined();
    });

    it('should filter characters by language and CEFR level', async () => {
      const res = await request(app)
        .get('/api/v1/ai/characters?targetLanguage=es&level=A1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const chars = res.body.data.characters;
      expect(chars.length).toBeGreaterThanOrEqual(1);
      expect(chars.every((c: any) => c.difficultyCEFR === 'A1' && c.targetLanguageCode === 'es')).toBe(true);
    });

    it('should retrieve a single character by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/ai/characters/${characterId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.character.id).toBe(characterId);
      expect(res.body.data.character.name).toBe('Mateo');
    });

    it('should return 404 for nonexistent character ID', async () => {
      const res = await request(app)
        .get('/api/v1/ai/characters/non-existent-character-id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('2. Conversation Lifecycle', () => {
    let conversationId = '';

    it('should start a new conversation and generate initial assistant greeting', async () => {
      const res = await request(app)
        .post('/api/v1/ai/conversations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          characterId: 'char-mateo',
          topic: 'Pedir un café con leche',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const conv = res.body.data.conversation;
      expect(conv.id).toBeDefined();
      expect(conv.character.name).toBe('Mateo');
      expect(conv.messages.length).toBe(1);
      expect(conv.messages[0].senderRole).toBe('ASSISTANT');
      expect(conv.messages[0].content).toContain('café');
      conversationId = conv.id;
    });

    it('should retrieve active conversation with messages and memories', async () => {
      const res = await request(app)
        .get(`/api/v1/ai/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.conversation.id).toBe(conversationId);
      expect(res.body.data.conversation.endedAt).toBeNull();
    });

    it('should send user message and receive AI response with micro XP', async () => {
      const xpBefore = (
        await request(app)
          .get('/api/v1/progression/xp')
          .set('Authorization', `Bearer ${token}`)
      ).body.data.totalXp;

      const res = await request(app)
        .post(`/api/v1/ai/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: '¡Hola Mateo! Quiero un café con leche y un croissant, por favor. Me gusta viajar por España.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userMessage.content).toContain('Quiero un café');
      expect(res.body.data.assistantMessage.content).toBeDefined();
      expect(res.body.data.xpAwarded).toBe(3);

      // Verify memory extraction
      expect(res.body.data.newMemories.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.newMemories[0].key).toBe('LIKES');

      const xpAfter = (
        await request(app)
          .get('/api/v1/progression/xp')
          .set('Authorization', `Bearer ${token}`)
      ).body.data.totalXp;

      expect(xpAfter).toBe(xpBefore + 3);
    });

    it('should extract non-intrusive pedagogical correction when user makes error', async () => {
      const res = await request(app)
        .post(`/api/v1/ai/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Yo querer café en el casa grande.',
        });

      expect(res.status).toBe(200);
      const correction = res.body.data.assistantMessage.correctionNote;
      expect(correction).toBeDefined();
      expect(correction).toContain('Pedagogical tip');
    });

    it('should reject empty message submission', async () => {
      const res = await request(app)
        .post(`/api/v1/ai/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: '   ',
        });

      expect(res.status).toBe(400);
    });

    it('should end conversation, award completion rewards, and trigger achievements & quests', async () => {
      const xpBefore = (
        await request(app)
          .get('/api/v1/progression/xp')
          .set('Authorization', `Bearer ${token}`)
      ).body.data.totalXp;

      const gemsBefore = (
        await request(app)
          .get('/api/v1/progression/currency')
          .set('Authorization', `Bearer ${token}`)
      ).body.data.gems;

      const res = await request(app)
        .post(`/api/v1/ai/conversations/${conversationId}/end`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          durationSec: 180,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const debrief = res.body.data.debrief;
      expect(debrief.conversationId).toBe(conversationId);
      expect(debrief.characterName).toBe('Mateo');
      expect(debrief.xpAwarded).toBe(15);
      expect(debrief.gemsAwarded).toBe(2);
      expect(debrief.correctionsCount).toBeGreaterThanOrEqual(1);

      // Verify XP and Gems (15 conversation completion XP + 50 FIRST_AI_CONVERSATION achievement XP)
      const xpAfter = (
        await request(app)
          .get('/api/v1/progression/xp')
          .set('Authorization', `Bearer ${token}`)
      ).body.data.totalXp;
      expect(xpAfter).toBe(xpBefore + 15 + 50);

      const gemsAfter = (
        await request(app)
          .get('/api/v1/progression/currency')
          .set('Authorization', `Bearer ${token}`)
      ).body.data.gems;
      expect(gemsAfter).toBe(gemsBefore + 2);

      // Verify FIRST_AI_CONVERSATION achievement was unlocked
      const achRes = await request(app)
        .get('/api/v1/progression/achievements')
        .set('Authorization', `Bearer ${token}`);
      const unlocked = achRes.body.data.filter((a: any) => a.isUnlocked).map((a: any) => a.code);
      expect(unlocked).toContain('FIRST_AI_CONVERSATION');

      // Verify quest progress for AI_CHAT
      const questsRes = await request(app)
        .get('/api/v1/progression/quests')
        .set('Authorization', `Bearer ${token}`);
      const aiQuest = questsRes.body.data.find((q: any) => q.questType === 'AI_CHAT');
      expect(aiQuest).toBeDefined();
      expect(aiQuest.isCompleted).toBe(true);
    });

    it('should preserve idempotency on duplicate conversation end call', async () => {
      const xpBefore = (
        await request(app)
          .get('/api/v1/progression/xp')
          .set('Authorization', `Bearer ${token}`)
      ).body.data.totalXp;

      const res = await request(app)
        .post(`/api/v1/ai/conversations/${conversationId}/end`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          durationSec: 60,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.debrief.xpAwarded).toBe(0);
      expect(res.body.data.debrief.gemsAwarded).toBe(0);

      const xpAfter = (
        await request(app)
          .get('/api/v1/progression/xp')
          .set('Authorization', `Bearer ${token}`)
      ).body.data.totalXp;
      expect(xpAfter).toBe(xpBefore);
    });

    it('should reject new messages after conversation has ended', async () => {
      const res = await request(app)
        .post(`/api/v1/ai/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: '¿Estás ahí?',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('already ended');
    });
  });
});
