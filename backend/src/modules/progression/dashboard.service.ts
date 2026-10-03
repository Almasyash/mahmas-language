// ==============================================================================
// MAHMAS LANGUAGE — DASHBOARD SERVICE
// Aggregated, server-calculated dashboard for home screen
// ==============================================================================

import { prisma } from '../../database/prisma';
import { xpService } from './xp.service';
import { streakService } from './streak.service';
import { dailyGoalService } from './daily-goal.service';
import { practiceService } from '../practice/practice.service';
import { achievementsService } from './achievements.service';
import { questsService } from './quests.service';
import { currencyService } from './currency.service';
import { coursesService } from '../courses/courses.service';

export class DashboardService {
  /**
   * Authoritatively computes the complete user dashboard snapshot.
   */
  async getDashboard(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            targetLanguage: true,
            nativeLanguage: true,
          },
        },
      },
    });

    if (!user || !user.profile) {
      throw new Error('User profile not found.');
    }

    // Execute domain services in parallel for performance
    const [
      xpSummary,
      streak,
      dailyGoal,
      practiceOverview,
      achievements,
      quests,
      gemsBalance,
      coursePathResult,
    ] = await Promise.all([
      xpService.getXpSummary(userId),
      streakService.getStreak(userId),
      dailyGoalService.getDailyGoalProgress(userId),
      practiceService.getOverview(userId),
      achievementsService.getUserAchievements(userId),
      questsService.getUserQuests(userId),
      currencyService.getBalance(userId),
      coursesService.getCoursePath(null, userId),
    ]);

    // Calculate current course & active lesson
    const course = coursePathResult?.course;
    let activeLessonTitle = 'Lesson 1: Saying Hello';
    let activeLessonId = course?.currentLessonId || 'lesson-es-1';
    let completedLessonsCount = 0;
    let totalLessonsCount = 0;

    if (course) {
      for (const s of course.sections) {
        for (const u of s.units) {
          for (const l of u.lessons) {
            totalLessonsCount += 1;
            if (l.isCompleted) completedLessonsCount += 1;
            if (l.id === activeLessonId) {
              activeLessonTitle = l.title;
            }
          }
        }
      }
    }

    const courseProgressPercent = totalLessonsCount > 0 ? Math.round((completedLessonsCount / totalLessonsCount) * 100) : 0;

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.profile.displayName,
        avatarUrl: user.profile.avatarUrl,
        currentLevel: user.profile.currentLevel,
        targetLanguage: user.profile.targetLanguage
          ? {
              id: user.profile.targetLanguage.id,
              code: user.profile.targetLanguage.code,
              name: user.profile.targetLanguage.name,
              flagEmoji: user.profile.targetLanguage.flagEmoji,
            }
          : null,
      },
      xpSummary,
      streak,
      dailyGoal,
      currentCourse: {
        id: course?.id || 'course-es-a1',
        title: course?.title || 'Spanish Foundations',
        progressPercent: courseProgressPercent,
        completedLessonsCount,
        totalLessonsCount,
        activeLessonId,
        activeLessonTitle,
      },
      practiceSummary: {
        mistakeCount: practiceOverview.mistakeCount,
        vocabularyReviewCount: practiceOverview.vocabularyReviewCount,
        recommendedPracticeCount: practiceOverview.recommendedPracticeCount,
      },
      recentAchievements: achievements.slice(0, 4),
      quests: quests.slice(0, 3),
      currency: {
        gems: gemsBalance,
      },
    };
  }
}

export const dashboardService = new DashboardService();
