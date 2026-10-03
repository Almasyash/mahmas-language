// ==============================================================================
// MAHMAS LANGUAGE — LEADERBOARD FOUNDATION SERVICE
// Backend aggregation foundation for weekly leagues, tiers, and friend rankings
// ==============================================================================

import { prisma } from '../../database/prisma';

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  weeklyXp: number;
  tier: string;
  rank: number;
}

export class LeaderboardService {
  /**
   * Helper to get ISO week number and year.
   */
  private getIsoWeekAndYear(date: Date = new Date()): { week: number; year: number } {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
    }
    const week = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
    return { week, year: target.getFullYear() };
  }

  /**
   * Authoritatively records weekly XP in the current week's leaderboard bucket.
   */
  async recordWeeklyXp(userId: string, xpAmount: number): Promise<void> {
    if (xpAmount <= 0) return;

    const { week, year } = this.getIsoWeekAndYear();

    await prisma.leaderboard.upsert({
      where: {
        userId_weekNumber_year: {
          userId,
          weekNumber: week,
          year,
        },
      },
      update: {
        weeklyXP: { increment: xpAmount },
      },
      create: {
        userId,
        weekNumber: week,
        year,
        weeklyXP: xpAmount,
        tier: 'Bronze',
      },
    });
  }

  /**
   * Retrieves top entries for a given tier in the current week.
   */
  async getTierLeaderboard(tier: string = 'Bronze', limit: number = 25): Promise<LeaderboardEntry[]> {
    const { week, year } = this.getIsoWeekAndYear();

    const entries = await prisma.leaderboard.findMany({
      where: {
        weekNumber: week,
        year,
        tier,
      },
      include: {
        user: {
          include: { profile: true },
        },
      },
      orderBy: { weeklyXP: 'desc' },
      take: limit,
    });

    return entries.map((entry, index) => ({
      userId: entry.userId,
      displayName: entry.user.profile?.displayName || 'Learner',
      avatarUrl: entry.user.profile?.avatarUrl || null,
      weeklyXp: entry.weeklyXP,
      tier: entry.tier,
      rank: index + 1,
    }));
  }
}

export const leaderboardService = new LeaderboardService();
