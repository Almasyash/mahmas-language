// ==============================================================================
// MAHMAS LANGUAGE — DASHBOARD SERVICE
// Aggregated, server-calculated dashboard for home screen
// Strict Target/Native Language Isolation
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
    let activeLessonTitle = course ? 'Lesson 1' : 'No lessons available yet';
    let activeLessonId = course?.currentLessonId || '';
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

    const targetLangName = user.profile.targetLanguage?.name || 'Selected language';

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
              nativeName: user.profile.targetLanguage.nativeName,
              flagEmoji: user.profile.targetLanguage.flagEmoji,
            }
          : null,
        nativeLanguage: user.profile.nativeLanguage
          ? {
              id: user.profile.nativeLanguage.id,
              code: user.profile.nativeLanguage.code,
              name: user.profile.nativeLanguage.name,
              nativeName: user.profile.nativeLanguage.nativeName,
              flagEmoji: user.profile.nativeLanguage.flagEmoji,
            }
          : null,
      },
      xpSummary,
      streak,
      dailyGoal,
      currentCourse: {
        id: course?.id || '',
        title: course?.title || `${targetLangName} Course`,
        progressPercent: courseProgressPercent,
        completedLessonsCount,
        totalLessonsCount,
        activeLessonId,
        activeLessonTitle,
        isAvailable: !!course,
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
