// ==============================================================================
// MAHMAS LANGUAGE — QUESTS SERVICE
// Server-authoritative daily & periodic quest tracking and reward claiming
// ==============================================================================

import { prisma } from '../../database/prisma';
import { xpService } from './xp.service';
import { currencyService } from './currency.service';

export interface QuestItem {
  id: string;
  title: string;
  description: string;
  questType: string;
  targetCount: number;
  currentCount: number;
  progressPercent: number;
  xpReward: number;
  gemReward: number;
  isCompleted: boolean;
  isClaimed: boolean;
}

export class QuestsService {
  /**
   * Increments progress for all active quests matching the given questType.
   */
  async recordQuestProgress(userId: string, questType: string, increment: number = 1): Promise<void> {
    if (increment <= 0) return;

    const now = new Date();
    const activeQuests = await prisma.quest.findMany({
      where: {
        questType,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    for (const quest of activeQuests) {
      const userQuest = await prisma.userQuest.findUnique({
        where: {
          userId_questId: {
            userId,
            questId: quest.id,
          },
        },
      });

      const currentCount = (userQuest?.currentCount || 0) + increment;
      const isCompleted = currentCount >= quest.targetCount;

      await prisma.userQuest.upsert({
        where: {
          userId_questId: {
            userId,
            questId: quest.id,
          },
        },
        update: {
          currentCount,
          isCompleted: userQuest?.isCompleted || isCompleted,
          completedAt: userQuest?.completedAt || (isCompleted ? new Date() : null),
        },
        create: {
          userId,
          questId: quest.id,
          currentCount,
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
        },
      });
    }
  }

  /**
   * Claims rewards for a completed quest authoritatively.
   * Completely idempotent: duplicate claims are rejected.
   */
  async claimQuest(userId: string, questId: string): Promise<{ success: boolean; xpAwarded: number; gemsAwarded: number; message?: string }> {
    const quest = await prisma.quest.findUnique({
      where: { id: questId },
    });

    if (!quest) {
      return { success: false, xpAwarded: 0, gemsAwarded: 0, message: 'Quest not found' };
    }

    const userQuest = await prisma.userQuest.findUnique({
      where: {
        userId_questId: {
          userId,
          questId,
        },
      },
    });

    if (!userQuest || !userQuest.isCompleted) {
      return { success: false, xpAwarded: 0, gemsAwarded: 0, message: 'Quest is not yet completed' };
    }

    if (userQuest.isClaimed) {
      return { success: false, xpAwarded: 0, gemsAwarded: 0, message: 'Quest reward already claimed' };
    }

    // Mark claimed in database
    await prisma.userQuest.update({
      where: {
        userId_questId: {
          userId,
          questId,
        },
      },
      data: {
        isClaimed: true,
        claimedAt: new Date(),
      },
    });

    // Authoritatively award XP and Gems
    await xpService.awardXp({
      userId,
      amount: quest.xpReward,
      reason: 'QUEST_COMPLETED',
      idempotencyKey: `quest_xp:${questId}:${userId}`,
      referenceId: questId,
    });

    await currencyService.credit({
      userId,
      amount: quest.gemReward,
      reason: 'QUEST_COMPLETED',
      idempotencyKey: `quest_gem:${questId}:${userId}`,
      referenceId: questId,
    });

    return {
      success: true,
      xpAwarded: quest.xpReward,
      gemsAwarded: quest.gemReward,
    };
  }

  /**
   * Retrieves all active quests with user progress.
   */
  async getUserQuests(userId: string): Promise<QuestItem[]> {
    const now = new Date();
    const quests = await prisma.quest.findMany({
      where: {
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { createdAt: 'asc' },
    });

    const userQuests = await prisma.userQuest.findMany({
      where: { userId },
    });

    const userQuestMap = new Map(userQuests.map((uq) => [uq.questId, uq]));

    return quests.map((q) => {
      const uq = userQuestMap.get(q.id);
      const currentCount = uq?.currentCount || 0;
      const isCompleted = uq?.isCompleted || currentCount >= q.targetCount;
      const isClaimed = uq?.isClaimed || false;
      const progressPercent = Math.min(100, Math.round((currentCount / q.targetCount) * 100));

      return {
        id: q.id,
        title: q.title,
        description: q.description,
        questType: q.questType,
        targetCount: q.targetCount,
        currentCount,
        progressPercent,
        xpReward: q.xpReward,
        gemReward: q.gemReward,
        isCompleted,
        isClaimed,
      };
    });
  }
}

export const questsService = new QuestsService();
