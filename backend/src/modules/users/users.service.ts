import prisma from '../../database/prisma';
import { OnboardingInput, UpdateProfileInput } from './users.dto';
import { ValidationError, NotFoundError } from '../../common/errors';

export class UsersService {
  async getProfile(userId: string) {
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

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      userId: user.id,
      email: user.email,
      displayName: user.profile?.displayName ?? '',
      avatarUrl: user.profile?.avatarUrl ?? null,
      bio: user.profile?.bio ?? null,
      nativeLanguage: user.profile?.nativeLanguage ?? null,
      targetLanguage: user.profile?.targetLanguage ?? null,
      currentLevel: user.profile?.currentLevel ?? 'A1',
      learningGoal: user.profile?.learningGoal ?? 'DAILY_CONVERSATION',
      dailyMinutesGoal: user.profile?.dailyMinutesGoal ?? 15,
      hearts: user.profile?.hearts ?? 5,
      maxHearts: user.profile?.maxHearts ?? 5,
      timezone: user.profile?.timezone ?? 'UTC',
      onboardingCompleted: user.onboardingCompleted,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundError('Profile not found for this user');
    }

    const updated = await prisma.profile.update({
      where: { userId },
      data: {
        ...(input.displayName && { displayName: input.displayName.trim() }),
        ...(input.bio !== undefined && { bio: input.bio?.trim() ?? null }),
        ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
        ...(input.timezone && { timezone: input.timezone }),
        ...(input.dailyMinutesGoal && { dailyMinutesGoal: input.dailyMinutesGoal }),
      },
      include: {
        nativeLanguage: {
          select: { id: true, code: true, name: true, nativeName: true, flagEmoji: true },
        },
        targetLanguage: {
          select: { id: true, code: true, name: true, nativeName: true, flagEmoji: true },
        },
      },
    });

    return {
      userId,
      displayName: updated.displayName,
      avatarUrl: updated.avatarUrl,
      bio: updated.bio,
      nativeLanguage: updated.nativeLanguage,
      targetLanguage: updated.targetLanguage,
      currentLevel: updated.currentLevel,
      learningGoal: updated.learningGoal,
      dailyMinutesGoal: updated.dailyMinutesGoal,
      hearts: updated.hearts,
      timezone: updated.timezone,
      updatedAt: updated.updatedAt,
    };
  }

  async completeOnboarding(userId: string, input: OnboardingInput) {
    // Validate native language exists (can be ID or code)
    const nativeLang = await prisma.language.findFirst({
      where: {
        OR: [{ id: input.nativeLanguageId }, { code: input.nativeLanguageId }],
        isActive: true,
      },
    });

    if (!nativeLang) {
      throw new ValidationError(`Native language '${input.nativeLanguageId}' not found or inactive`);
    }

    // Validate target language exists (can be ID or code)
    const targetLang = await prisma.language.findFirst({
      where: {
        OR: [{ id: input.targetLanguageId }, { code: input.targetLanguageId }],
        isActive: true,
      },
    });

    if (!targetLang) {
      throw new ValidationError(`Target language '${input.targetLanguageId}' not found or inactive`);
    }

    if (nativeLang.id === targetLang.id) {
      throw new ValidationError('Native language and target language cannot be the same');
    }

    // Update profile & user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Upsert profile
      const profile = await tx.profile.upsert({
        where: { userId },
        update: {
          nativeLanguageId: nativeLang.id,
          targetLanguageId: targetLang.id,
          learningGoal: input.learningGoal,
          dailyMinutesGoal: input.dailyMinutesGoal,
          currentLevel: input.initialLevel,
          timezone: input.timezone || 'UTC',
        },
        create: {
          userId,
          displayName: 'Learner',
          nativeLanguageId: nativeLang.id,
          targetLanguageId: targetLang.id,
          learningGoal: input.learningGoal,
          dailyMinutesGoal: input.dailyMinutesGoal,
          currentLevel: input.initialLevel,
          timezone: input.timezone || 'UTC',
        },
        include: {
          nativeLanguage: {
            select: { id: true, code: true, name: true, nativeName: true, flagEmoji: true },
          },
          targetLanguage: {
            select: { id: true, code: true, name: true, nativeName: true, flagEmoji: true },
          },
        },
      });

      // Mark onboarding as completed
      const user = await tx.user.update({
        where: { id: userId },
        data: { onboardingCompleted: true },
        select: {
          id: true,
          email: true,
          onboardingCompleted: true,
          createdAt: true,
        },
      });

      return { user, profile };
    });

    return {
      userId: result.user.id,
      email: result.user.email,
      displayName: result.profile.displayName,
      avatarUrl: result.profile.avatarUrl,
      nativeLanguage: result.profile.nativeLanguage,
      targetLanguage: result.profile.targetLanguage,
      learningGoal: result.profile.learningGoal,
      dailyMinutesGoal: result.profile.dailyMinutesGoal,
      currentLevel: result.profile.currentLevel,
      timezone: result.profile.timezone,
      onboardingCompleted: result.user.onboardingCompleted,
      updatedAt: result.profile.updatedAt,
    };
  }
}

export const usersService = new UsersService();
