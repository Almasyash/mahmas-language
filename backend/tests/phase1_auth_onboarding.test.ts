import request from 'supertest';
import { createApp } from '../src/app';
import prisma from '../src/database/prisma';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/environment';

describe('Phase 1 — Authentication, Onboarding & User Profile Suite', () => {
  const app = createApp();

  const testUser = {
    email: 'TEST.Phase1@example.com',
    password: 'Password123!',
    displayName: 'Phase1 Learner',
  };

  let accessToken: string;
  let refreshToken: string;
  let userId: string;

  beforeAll(async () => {
    // Clean up test users from previous runs
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['test.phase1@example.com', 'test.phase1.dup@example.com'],
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['test.phase1@example.com', 'test.phase1.dup@example.com'],
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('1. Registration Flow', () => {
    it('should successfully register a new user and return tokens and sanitized user', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
      expect(res.body.data.user.displayName).toBe(testUser.displayName);
      expect(res.body.data.user.onboardingCompleted).toBe(false);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();

      // Check security: sensitive fields never exposed
      expect(res.body.data.user.passwordHash).toBeUndefined();
      expect(res.body.data.refreshTokenHash).toBeUndefined();

      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
      userId = res.body.data.user.id;

      // Verify database record
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
      });
      expect(dbUser).not.toBeNull();
      expect(dbUser!.passwordHash).not.toBe(testUser.password);
      expect(dbUser!.passwordHash).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash format
    });

    it('should reject registration with duplicate email (case-insensitive)', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'test.phase1@example.com',
        password: 'Password123!',
        displayName: 'Duplicate Learner',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message).toMatch(/already exists/i);
    });

    it('should reject registration with invalid email format', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'not-an-email',
        password: 'Password123!',
        displayName: 'Invalid Email',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration with weak password (missing uppercase or number)', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'weakpass@example.com',
        password: 'weak',
        displayName: 'Weak Password',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Login Flow', () => {
    it('should successfully log in with valid credentials (case-insensitive email)', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'TEST.PHASE1@EXAMPLE.COM',
        password: testUser.password,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();

      // Update tokens for further tests
      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it('should reject login with wrong password and generic message', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: testUser.email,
        password: 'WrongPassword!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message).toBe('Invalid email or password');
    });

    it('should reject login with non-existent email and generic message', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'SomePassword123!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message).toBe('Invalid email or password');
    });
  });

  describe('3. Token Refresh and Rotation', () => {
    it('should rotate refresh token and issue new token pair', async () => {
      const oldRefreshToken = refreshToken;

      const res = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken: oldRefreshToken,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.refreshToken).not.toBe(oldRefreshToken);

      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;

      // Old refresh token must be revoked now
      const reuseRes = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken: oldRefreshToken,
      });

      expect(reuseRes.status).toBe(401);
      expect(reuseRes.body.success).toBe(false);
      expect(reuseRes.body.error?.message).toMatch(/revoked/i);
    });

    it('should reject malformed or expired refresh token', async () => {
      const res = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken: 'invalid.jwt.token',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('4. Auth Middleware and /api/v1/auth/me', () => {
    it('should get current user profile when authenticated', async () => {
      // Re-login to get clean active tokens after reuse detection test
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });
      accessToken = loginRes.body.data.accessToken;

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(userId);
      expect(res.body.data.email).toBe(testUser.email.toLowerCase());
      expect(res.body.data.displayName).toBe(testUser.displayName);
      expect(res.body.data.onboardingCompleted).toBe(false);
      expect(res.body.data.passwordHash).toBeUndefined();
    });

    it('should reject /auth/me when token is missing', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject /auth/me when token is malformed', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject /auth/me when token is expired', async () => {
      const expiredToken = jwt.sign(
        { userId, role: 'LEARNER' },
        config.jwtAccessSecret,
        { expiresIn: '-1s' }
      );

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('5. Language Catalog Endpoint', () => {
    it('GET /api/v1/languages should return active languages list', async () => {
      const res = await request(app).get('/api/v1/languages');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(12);

      const english = res.body.data.find((l: any) => l.code === 'en');
      expect(english).toBeDefined();
      expect(english.name).toBe('English');
    });
  });

  describe('6. Onboarding Flow', () => {
    it('should reject onboarding with invalid target language', async () => {
      const res = await request(app)
        .post('/api/v1/users/me/onboarding')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          nativeLanguageId: 'hi',
          targetLanguageId: 'non-existent-language',
          learningGoal: 'DAILY_CONVERSATION',
          dailyMinutesGoal: 15,
          initialLevel: 'A1',
          timezone: 'Asia/Kolkata',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject onboarding when native and target languages are identical', async () => {
      const res = await request(app)
        .post('/api/v1/users/me/onboarding')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          nativeLanguageId: 'en',
          targetLanguageId: 'en',
          learningGoal: 'DAILY_CONVERSATION',
          dailyMinutesGoal: 15,
          initialLevel: 'A1',
          timezone: 'UTC',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message).toMatch(/cannot be the same/i);
    });

    it('should successfully complete onboarding and persist preferences', async () => {
      const res = await request(app)
        .post('/api/v1/users/me/onboarding')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          nativeLanguageId: 'hi',
          targetLanguageId: 'en',
          learningGoal: 'SPEAKING',
          dailyMinutesGoal: 20,
          initialLevel: 'B1',
          timezone: 'Asia/Kolkata',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.onboardingCompleted).toBe(true);
      expect(res.body.data.nativeLanguage.code).toBe('hi');
      expect(res.body.data.targetLanguage.code).toBe('en');
      expect(res.body.data.learningGoal).toBe('SPEAKING');
      expect(res.body.data.dailyMinutesGoal).toBe(20);
      expect(res.body.data.currentLevel).toBe('B1');
      expect(res.body.data.timezone).toBe('Asia/Kolkata');

      // Verify in DB directly
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });
      expect(dbUser!.onboardingCompleted).toBe(true);
      expect(dbUser!.profile!.timezone).toBe('Asia/Kolkata');
      expect(dbUser!.profile!.learningGoal).toBe('SPEAKING');
    });
  });

  describe('7. Profile Management', () => {
    it('GET /api/v1/users/me/profile should return complete profile', async () => {
      const res = await request(app)
        .get('/api/v1/users/me/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.displayName).toBe(testUser.displayName);
      expect(res.body.data.onboardingCompleted).toBe(true);
      expect(res.body.data.nativeLanguage.code).toBe('hi');
      expect(res.body.data.targetLanguage.code).toBe('en');
    });

    it('PATCH /api/v1/users/me/profile should update profile fields', async () => {
      const res = await request(app)
        .patch('/api/v1/users/me/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          displayName: 'Updated Almas',
          bio: 'Learning languages every day!',
          dailyMinutesGoal: 30,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.displayName).toBe('Updated Almas');
      expect(res.body.data.bio).toBe('Learning languages every day!');
      expect(res.body.data.dailyMinutesGoal).toBe(30);
    });
  });

  describe('8. Logout Flow', () => {
    it('should revoke session on logout', async () => {
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });

      const userAccessToken = loginRes.body.data.accessToken;
      const userRefreshToken = loginRes.body.data.refreshToken;

      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ refreshToken: userRefreshToken });

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      // Attempting to refresh with the logged out token should fail
      const refreshRes = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken: userRefreshToken,
      });

      expect(refreshRes.status).toBe(401);
      expect(refreshRes.body.success).toBe(false);
    });
  });
});
