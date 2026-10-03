// ==============================================================================
// MAHMAS LANGUAGE — XP SERVICE
// Server-authoritative, idempotent XP calculation and transaction tracking
// ==============================================================================

import { prisma } from '../../database/prisma';
import { calculateLevel } from './progression.config';
import { getLocalDateString, getLocalDayTimeRange } from '../../utils/date.utils';

export interface AwardXpParams {
  userId: string;
  amount: number;
  reason: string;
  idempotencyKey?: string;
  referenceId?: string;
}

export interface XpSummary {
  totalXp: number;
  todayXp: number;
  currentLevel: number;
  xpIntoCurrentLevel: number;
  xpToNextLevel: number;
  progressPercent: number;
}

export class XpService {
  /**
   * Authoritatively awards XP to a user with strict idempotency.
   * If an idempotencyKey has already been processed, the award is safely ignored.
   */
  async awardXp(params: {
    userId: string;
    amount: number;
    reason: string;
    idempotencyKey?: string;
    referenceId?: string;
  }): Promise<{ awarded: boolean; amount: number; totalXp: number }> {
    const { userId, amount, reason, idempotencyKey, referenceId } = params;

    if (amount <= 0) {
      const summary = await this.getXpSummary(userId);
      return { awarded: false, amount: 0, totalXp: summary.totalXp };
    }

    // Check for duplicate award if idempotencyKey is supplied
    if (idempotencyKey) {
      const existing = await prisma.xPTransaction.findUnique({
        where: { idempotencyKey },
      });

      if (existing) {
        const summary = await this.getXpSummary(userId);
        return {
          awarded: false,
          amount: existing.amount,
          totalXp: summary.totalXp,
        };
      }
    }

    // Record XP Transaction
    await prisma.$transaction(async (tx) => {
      await tx.xPTransaction.create({
        data: {
          userId,
          amount,
          reason,
          referenceId,
          idempotencyKey,
        },
      });

      // Update Daily Goal earned XP if goal exists for today
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });

      const userTimezone = user?.profile?.timezone || 'UTC';
      const todayDateStr = getLocalDateString(new Date(), userTimezone);
      const todayDate = new Date(`${todayDateStr}T00:00:00.000Z`);

      await tx.dailyGoal.upsert({
        where: {
          userId_targetDate: {
            userId,
            targetDate: todayDate,
          },
        },
        update: {
          earnedXP: { increment: amount },
        },
        create: {
          userId,
          targetDate: todayDate,
          earnedXP: amount,
          targetXP: 30,
          targetMinutes: user?.profile?.dailyMinutesGoal || 15,
        },
      });
    });

    const summary = await this.getXpSummary(userId);
    return {
      awarded: true,
      amount,
      totalXp: summary.totalXp,
    };
  }

  /**
   * Computes the complete XP summary, including today's XP and deterministic level progression.
   */
  async getXpSummary(userId: string): Promise<XpSummary> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    const userTimezone = user?.profile?.timezone || 'UTC';
    const { start, end } = getLocalDayTimeRange(new Date(), userTimezone);

    // Aggregate Total XP
    const totalAggregate = await prisma.xPTransaction.aggregate({
      where: { userId },
      _sum: { amount: true },
    });
    const totalXp = totalAggregate._sum.amount || 0;

    // Aggregate Today's XP within user's local day
    const todayAggregate = await prisma.xPTransaction.aggregate({
      where: {
        userId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      _sum: { amount: true },
    });
    const todayXp = todayAggregate._sum.amount || 0;

    const levelData = calculateLevel(totalXp);

    return {
      totalXp,
      todayXp,
      currentLevel: levelData.level,
      xpIntoCurrentLevel: levelData.xpIntoCurrentLevel,
      xpToNextLevel: levelData.xpToNextLevel,
      progressPercent: levelData.progressPercent,
    };
  }
}

export const xpService = new XpService();
