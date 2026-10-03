// ==============================================================================
// MAHMAS LANGUAGE — STREAK SERVICE
// Timezone-aware, server-authoritative streak calculation engine
// ==============================================================================

import { prisma } from '../../database/prisma';
import { getLocalDateString, getCalendarDayDifference } from '../../utils/date.utils';

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  isMaintained: boolean;
  isNewDay: boolean;
  lastActivityDate: string | null;
}

export class StreakService {
  /**
   * Records a qualifying activity (lesson or practice session completion)
   * in the user's local timezone and updates streak counters.
   */
  async recordActivity(userId: string, activityTimestamp: Date = new Date()): Promise<StreakResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    const timezone = user?.profile?.timezone || 'UTC';
    const currentLocalDateStr = getLocalDateString(activityTimestamp, timezone);
    const currentLocalDate = new Date(`${currentLocalDateStr}T00:00:00.000Z`);

    const streak = await prisma.streak.findUnique({
      where: { userId },
    });

    // 1. First qualifying activity ever
    if (!streak || !streak.lastActivityDate) {
      const created = await prisma.streak.upsert({
        where: { userId },
        update: {
          currentStreak: 1,
          longestStreak: Math.max(1, streak?.longestStreak || 0),
          lastActivityDate: currentLocalDate,
        },
        create: {
          userId,
          currentStreak: 1,
          longestStreak: 1,
          lastActivityDate: currentLocalDate,
        },
      });

      return {
        currentStreak: created.currentStreak,
        longestStreak: created.longestStreak,
        isMaintained: true,
        isNewDay: true,
        lastActivityDate: currentLocalDateStr,
      };
    }

    const lastDateStr = streak.lastActivityDate.toISOString().split('T')[0];
    const dayDiff = getCalendarDayDifference(lastDateStr, currentLocalDateStr);

    // 2. Activity on the same local calendar day
    if (dayDiff === 0) {
      return {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        isMaintained: true,
        isNewDay: false,
        lastActivityDate: currentLocalDateStr,
      };
    }

    // 3. Activity on the next consecutive local calendar day
    if (dayDiff === 1) {
      const newStreak = streak.currentStreak + 1;
      const newLongest = Math.max(streak.longestStreak, newStreak);

      const updated = await prisma.streak.update({
        where: { userId },
        data: {
          currentStreak: newStreak,
          longestStreak: newLongest,
          lastActivityDate: currentLocalDate,
        },
      });

      return {
        currentStreak: updated.currentStreak,
        longestStreak: updated.longestStreak,
        isMaintained: true,
        isNewDay: true,
        lastActivityDate: currentLocalDateStr,
      };
    }

    // 4. One or more missed local days (dayDiff > 1) -> Reset to 1
    const resetStreak = 1;
    const updated = await prisma.streak.update({
      where: { userId },
      data: {
        currentStreak: resetStreak,
        lastActivityDate: currentLocalDate,
      },
    });

    return {
      currentStreak: updated.currentStreak,
      longestStreak: updated.longestStreak,
      isMaintained: true,
      isNewDay: true,
      lastActivityDate: currentLocalDateStr,
    };
  }

  /**
   * Retrieves current streak details for a user, evaluating whether the streak
   * is still alive today based on the user's local timezone.
   */
  async getStreak(userId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    activeToday: boolean;
    lastActivityDate: string | null;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    const timezone = user?.profile?.timezone || 'UTC';
    const currentLocalDateStr = getLocalDateString(new Date(), timezone);

    const streak = await prisma.streak.findUnique({
      where: { userId },
    });

    if (!streak || !streak.lastActivityDate) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        activeToday: false,
        lastActivityDate: null,
      };
    }

    const lastDateStr = streak.lastActivityDate.toISOString().split('T')[0];
    const dayDiff = getCalendarDayDifference(lastDateStr, currentLocalDateStr);

    // If more than 1 day has passed without activity, current streak is broken (0 for today)
    const effectiveStreak = dayDiff <= 1 ? streak.currentStreak : 0;
    const activeToday = dayDiff === 0;

    return {
      currentStreak: effectiveStreak,
      longestStreak: streak.longestStreak,
      activeToday,
      lastActivityDate: lastDateStr,
    };
  }
}

export const streakService = new StreakService();
