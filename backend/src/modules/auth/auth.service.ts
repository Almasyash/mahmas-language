import bcrypt from 'bcryptjs';
import prisma from '../../database/prisma';
import { RegisterInput, LoginInput } from './auth.dto';
import { AppError, UnauthorizedError, ValidationError, NotFoundError } from '../../common/errors';
import { generateAccessToken, generateRefreshToken, hashToken, verifyRefreshToken } from '../../utils/token.utils';
import { UserRole } from '@prisma/client';

export interface ClientMeta {
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  deviceName?: string;
  platform?: string;
}

export class AuthService {
  private readonly saltRounds = 12;

  async register(input: RegisterInput, clientMeta: ClientMeta) {
    const normalizedEmail = input.email.trim().toLowerCase();

    // Check duplicate email
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ValidationError('An account with this email address already exists');
    }

    // Hash password securely with bcrypt >= 12 rounds
    const passwordHash = await bcrypt.hash(input.password, this.saltRounds);

    // Create user and profile in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role: UserRole.LEARNER,
          onboardingCompleted: false,
          profile: {
            create: {
              displayName: input.displayName.trim(),
              timezone: 'UTC',
            },
          },
        },
        include: {
          profile: true,
        },
      });

      return user;
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: newUser.id,
      role: newUser.role,
      email: newUser.email ?? undefined,
    });
    const refreshToken = generateRefreshToken(newUser.id);
    const refreshTokenHash = hashToken(refreshToken);

    // Persist device session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.deviceSession.create({
      data: {
        userId: newUser.id,
        refreshTokenHash,
        ipAddress: clientMeta.ipAddress,
        userAgent: clientMeta.userAgent,
        deviceId: clientMeta.deviceId,
        deviceName: clientMeta.deviceName,
        platform: clientMeta.platform,
        expiresAt,
      },
    });

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.profile?.displayName,
        avatarUrl: newUser.profile?.avatarUrl,
        onboardingCompleted: newUser.onboardingCompleted,
        createdAt: newUser.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }

  async login(input: LoginInput, clientMeta: ClientMeta) {
    const normalizedEmail = input.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        profile: {
          include: {
            nativeLanguage: {
              select: { id: true, code: true, name: true, flagEmoji: true },
            },
            targetLanguage: {
              select: { id: true, code: true, name: true, flagEmoji: true },
            },
          },
        },
      },
    });

    // Timing attack mitigation & generic error message
    if (!user || !user.passwordHash || !user.isActive) {
      // Fake compare to prevent timing side-channel
      await bcrypt.compare(input.password, '$2a$12$e80yqZ65UjK1NlK4q1iKee8F5wzRj0eY5w7gP3F1q2w3e4r5t6y7u');
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate token pair
    const accessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
      email: user.email ?? undefined,
    });
    const refreshToken = generateRefreshToken(user.id);
    const refreshTokenHash = hashToken(refreshToken);

    // Save session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.deviceSession.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        ipAddress: clientMeta.ipAddress,
        userAgent: clientMeta.userAgent,
        deviceId: input.deviceId ?? clientMeta.deviceId,
        deviceName: input.deviceName ?? clientMeta.deviceName,
        platform: input.platform ?? clientMeta.platform,
        expiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.profile?.displayName,
        avatarUrl: user.profile?.avatarUrl,
        onboardingCompleted: user.onboardingCompleted,
        nativeLanguage: user.profile?.nativeLanguage ?? null,
        targetLanguage: user.profile?.targetLanguage ?? null,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string, clientMeta: ClientMeta) {
    try {
      verifyRefreshToken(refreshToken);
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const tokenHash = hashToken(refreshToken);

    const session = await prisma.deviceSession.findUnique({
      where: { refreshTokenHash: tokenHash },
      include: { user: true },
    });

    if (!session) {
      throw new UnauthorizedError('Invalid or revoked session');
    }

    // REUSE DETECTION: If this session was already revoked, someone is replaying an old refresh token
    if (session.revokedAt !== null) {
      // Invalidate all active sessions for this user as a security safeguard
      await prisma.deviceSession.updateMany({
        where: { userId: session.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedError('Session has been revoked due to reuse detection. Please log in again.');
    }

    // Check expiration
    if (new Date() > session.expiresAt) {
      await prisma.deviceSession.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedError('Refresh token expired. Please log in again.');
    }

    // ROTATE: Revoke old session and issue new token pair
    await prisma.deviceSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    const newAccessToken = generateAccessToken({
      userId: session.user.id,
      role: session.user.role,
      email: session.user.email ?? undefined,
    });
    const newRefreshToken = generateRefreshToken(session.user.id);
    const newRefreshTokenHash = hashToken(newRefreshToken);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.deviceSession.create({
      data: {
        userId: session.user.id,
        refreshTokenHash: newRefreshTokenHash,
        ipAddress: clientMeta.ipAddress,
        userAgent: clientMeta.userAgent,
        deviceId: session.deviceId,
        deviceName: session.deviceName,
        platform: session.platform,
        expiresAt,
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await prisma.deviceSession.updateMany({
        where: { refreshTokenHash: tokenHash, userId },
        data: { revokedAt: new Date() },
      });
    } else {
      await prisma.deviceSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return { success: true };
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            nativeLanguage: {
              select: { id: true, code: true, name: true, nativeName: true, flagEmoji: true },
            },
            targetLanguage: {
              select: { id: true, code: true, name: true, nativeName: true, flagEmoji: true },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new NotFoundError('User not found or inactive');
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.profile?.displayName ?? '',
      avatarUrl: user.profile?.avatarUrl ?? null,
      nativeLanguage: user.profile?.nativeLanguage ?? null,
      targetLanguage: user.profile?.targetLanguage ?? null,
      learningGoal: user.profile?.learningGoal ?? null,
      dailyMinutesGoal: user.profile?.dailyMinutesGoal ?? 15,
      currentLevel: user.profile?.currentLevel ?? 'A1',
      onboardingCompleted: user.onboardingCompleted,
      timezone: user.profile?.timezone ?? 'UTC',
      createdAt: user.createdAt,
    };
  }
}

export const authService = new AuthService();
