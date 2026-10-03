// ==============================================================================
// MAHMAS LANGUAGE — DAILY GOAL SERVICE
// Server-authoritative daily goal tracking in the user's local timezone
// ==============================================================================

import { prisma } from '../../database/prisma';
import { getLocalDateString } from '../../utils/date.utils';

export interface DailyGoalProgress {
  dailyGoalMinutes: number;
  dailyMinutesCompleted: number;
  dailyGoalProgress: number; // 0 to 100 percentage
  dailyGoalCompleted: boolean;
  earnedXp: number;
  targetDate: string;
}

export class DailyGoalService {
  /**
   * Records learning time (in minutes) for today's local calendar day.
   */
  async recordActivityTime(userId: string, minutes: number): Promise<DailyGoalProgress> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    const timezone = user?.profile?.timezone || 'UTC';
    const targetDateStr = getLocalDateString(new Date(), timezone);
    const targetDate = new Date(`${targetDateStr}T00:00:00.000Z`);
    const targetMinutes = user?.profile?.dailyMinutesGoal || 15;

    const existing = await prisma.dailyGoal.findUnique({
      where: {
        userId_targetDate: {
          userId,
          targetDate,
        },
      },
    });

    const newCompletedMinutes = (existing?.completedMinutes || 0) + Math.max(0, minutes);
    const isCompleted = newCompletedMinutes >= (existing?.targetMinutes || targetMinutes);

    const updated = await prisma.dailyGoal.upsert({
      where: {
        userId_targetDate: {
          userId,
          targetDate,
        },
      },
      update: {
        completedMinutes: newCompletedMinutes,
        isCompleted,
      },
      create: {
        userId,
        targetDate,
        targetMinutes,
        completedMinutes: newCompletedMinutes,
        targetXP: 30,
        isCompleted,
      },
    });

    const goalProgress = Math.min(100, Math.round((updated.completedMinutes / updated.targetMinutes) * 100));

    return {
      dailyGoalMinutes: updated.targetMinutes,
      dailyMinutesCompleted: updated.completedMinutes,
      dailyGoalProgress: goalProgress,
      dailyGoalCompleted: updated.isCompleted,
      earnedXp: updated.earnedXP,
      targetDate: targetDateStr,
    };
  }

  /**
   * Retrieves today's daily goal progress in the user's local timezone.
   */
  async getDailyGoalProgress(userId: string): Promise<DailyGoalProgress> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    const timezone = user?.profile?.timezone || 'UTC';
    const targetDateStr = getLocalDateString(new Date(), timezone);
    const targetDate = new Date(`${targetDateStr}T00:00:00.000Z`);
    const targetMinutes = user?.profile?.dailyMinutesGoal || 15;

    const goal = await prisma.dailyGoal.findUnique({
      where: {
        userId_targetDate: {
          userId,
          targetDate,
        },
      },
    });

    const completedMinutes = goal?.completedMinutes || 0;
    const currentTargetMinutes = goal?.targetMinutes || targetMinutes;
    const progressPercent = Math.min(100, Math.round((completedMinutes / currentTargetMinutes) * 100));
    const isCompleted = completedMinutes >= currentTargetMinutes;

    return {
      dailyGoalMinutes: currentTargetMinutes,
      dailyMinutesCompleted: completedMinutes,
      dailyGoalProgress: progressPercent,
      dailyGoalCompleted: isCompleted,
      earnedXp: goal?.earnedXP || 0,
      targetDate: targetDateStr,
    };
  }
}

export const dailyGoalService = new DailyGoalService();
