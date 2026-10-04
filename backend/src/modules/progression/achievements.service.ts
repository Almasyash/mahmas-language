// ==============================================================================
// MAHMAS LANGUAGE — ACHIEVEMENTS SERVICE
// Server-authoritative achievement verification, unlocking, and rewards
// ==============================================================================

import { prisma } from '../../database/prisma';
import { xpService } from './xp.service';
import { ProgressionConfig } from './progression.config';

export interface AchievementItem {
  id: string;
  code: string;
  title: string;
  description: string;
  badgeIcon: string;
  isUnlocked: boolean;
  unlockedAt: string | null;
  progress: number;
}

export class AchievementsService {
  /**
   * Evaluates and unlocks an achievement for a user if conditions are met.
   * Completely idempotent: if already unlocked, does nothing and returns null.
   */
  async unlockAchievement(userId: string, achievementCode: string): Promise<AchievementItem | null> {
    const achievement = await prisma.achievement.findUnique({
      where: { code: achievementCode },
    });

    if (!achievement) {
      return null;
    }

    // Check if already unlocked
    const existing = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id,
        },
      },
    });

    const now = new Date();
    if (existing) {
      if (existing.isUnlocked) {
        return null; // Already unlocked, no duplicate rewards
      }
      await prisma.userAchievement.update({
        where: { id: existing.id },
        data: {
          isUnlocked: true,
          progress: 100,
          unlockedAt: now,
        },
      });
    } else {
      try {
        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
            isUnlocked: true,
            progress: 100,
            unlockedAt: now,
          },
        });
      } catch (err: any) {
        if (err.code === 'P2002') {
          // Concurrent race condition: already created/unlocked by another request
          return null;
        }
        throw err;
      }
    }

    // Award achievement bonus XP
    await xpService.awardXp({
      userId,
      amount: ProgressionConfig.XP_REWARDS.ACHIEVEMENT_UNLOCKED,
      reason: 'ACHIEVEMENT_UNLOCKED',
      idempotencyKey: `achievement:${achievementCode}:${userId}`,
      referenceId: achievement.id,
    });

    return {
      id: achievement.id,
      code: achievement.code,
      title: achievement.title,
      description: achievement.description,
      badgeIcon: achievement.badgeIcon,
      isUnlocked: true,
      unlockedAt: now.toISOString(),
      progress: 100,
    };
  }

  /**
   * Retrieves all achievements with the user's current unlock status.
   */
  async getUserAchievements(userId: string): Promise<AchievementItem[]> {
    const allAchievements = await prisma.achievement.findMany({
      orderBy: { createdAt: 'asc' },
    });

    const userUnlocks = await prisma.userAchievement.findMany({
      where: { userId },
    });

    const unlockMap = new Map(userUnlocks.map((u) => [u.achievementId, u]));

    return allAchievements.map((ach) => {
      const userState = unlockMap.get(ach.id);
      const isUnlocked = userState?.isUnlocked ?? false;

      return {
        id: ach.id,
        code: ach.code,
        title: ach.title,
        description: ach.description,
        badgeIcon: ach.badgeIcon,
        isUnlocked,
        unlockedAt: userState?.unlockedAt ? userState.unlockedAt.toISOString() : null,
        progress: isUnlocked ? 100 : userState?.progress ?? 0,
      };
    });
  }
}

export const achievementsService = new AchievementsService();
