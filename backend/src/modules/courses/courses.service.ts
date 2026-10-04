// ==============================================================================
// MAHMAS LANGUAGE — COURSES SERVICE
// Server-authoritative course tree, units, lessons, and unlock state calculation
// Strict Language & Native/Target Isolation Enforced
// ==============================================================================

import { prisma } from '../../database/prisma';

export class CoursesService {
  /**
   * Retrieves all available published courses, optionally filtered by target and native language.
   */
  async getCourses(filters: { targetLanguageId?: string; nativeLanguageId?: string }, userId?: string) {
    let targetLangId = filters.targetLanguageId;
    let nativeLangId = filters.nativeLanguageId;

    if (userId && (!targetLangId || !nativeLangId)) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });
      if (!targetLangId) targetLangId = user?.profile?.targetLanguageId || undefined;
      if (!nativeLangId) nativeLangId = user?.profile?.nativeLanguageId || undefined;
    }

    const whereClause: any = { isPublished: true };
    if (targetLangId) {
      whereClause.languageId = targetLangId;
    }
    if (nativeLangId) {
      whereClause.OR = [
        { sourceLanguageId: nativeLangId },
        { sourceLanguageId: null },
      ];
    }

    const courses = await prisma.course.findMany({
      where: whereClause,
      include: {
        language: { select: { id: true, code: true, name: true, flagEmoji: true } },
        sourceLanguage: { select: { id: true, code: true, name: true, flagEmoji: true } },
        languageLevel: { select: { id: true, level: true, name: true } },
        sections: {
          select: {
            id: true,
            title: true,
            units: {
              select: {
                id: true,
                title: true,
                lessons: {
                  select: { id: true, title: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return courses.map((c) => {
      let totalLessons = 0;
      for (const s of c.sections) {
        for (const u of s.units) {
          totalLessons += u.lessons.length;
        }
      }
      return {
        id: c.id,
        title: c.title,
        description: c.description,
        bannerUrl: c.bannerUrl,
        targetLanguage: c.language,
        sourceLanguage: c.sourceLanguage,
        level: c.languageLevel.level,
        levelName: c.languageLevel.name,
        totalLessons,
      };
    });
  }

  /**
   * Retrieves the course path for a specific course or the user's active target language course.
   * Authoritatively determines lesson unlock and completion states.
   * STRICT ISOLATION: Never silently substitutes a different language course!
   */
  async getCoursePath(courseIdOrNull: string | null, userId: string) {
    let course;

    if (courseIdOrNull && courseIdOrNull !== 'default') {
      course = await prisma.course.findUnique({
        where: { id: courseIdOrNull },
        include: {
          language: true,
          sourceLanguage: true,
          sections: {
            orderBy: { orderIndex: 'asc' },
            include: {
              units: {
                orderBy: { orderIndex: 'asc' },
                include: {
                  lessons: {
                    orderBy: { orderIndex: 'asc' },
                  },
                },
              },
            },
          },
        },
      });
    }

    if (!course) {
      // Find user profile
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });

      const targetLangId = user?.profile?.targetLanguageId;
      const nativeLangId = user?.profile?.nativeLanguageId;

      if (targetLangId) {
        // Priority 1: Match targetLanguage AND specific sourceLanguage
        if (nativeLangId) {
          course = await prisma.course.findFirst({
            where: {
              languageId: targetLangId,
              sourceLanguageId: nativeLangId,
              isPublished: true,
            },
            include: {
              language: true,
              sourceLanguage: true,
              sections: {
                orderBy: { orderIndex: 'asc' },
                include: {
                  units: {
                    orderBy: { orderIndex: 'asc' },
                    include: {
                      lessons: {
                        orderBy: { orderIndex: 'asc' },
                      },
                    },
                  },
                },
              },
            },
          });
        }

        // Priority 2: Match targetLanguage (universal course where source is null or generic)
        if (!course) {
          course = await prisma.course.findFirst({
            where: {
              languageId: targetLangId,
              isPublished: true,
            },
            include: {
              language: true,
              sourceLanguage: true,
              sections: {
                orderBy: { orderIndex: 'asc' },
                include: {
                  units: {
                    orderBy: { orderIndex: 'asc' },
                    include: {
                      lessons: {
                        orderBy: { orderIndex: 'asc' },
                      },
                    },
                  },
                },
              },
            },
          });
        }
      }
    }

    // STRICT LANGUAGE ISOLATION:
    // If no course exists for the requested/target language, return null!
    // Never silently substitute another language's course!
    if (!course) {
      return null;
    }

    // Get all completed lesson attempts for this user
    const completedAttempts = await prisma.lessonAttempt.findMany({
      where: {
        userId,
        isSuccessful: true,
      },
      select: { lessonId: true },
    });

    const completedLessonIds = new Set(completedAttempts.map((a) => a.lessonId));

    // Flatten lessons in order to determine unlocking
    let previousLessonCompleted = true; // First lesson is always unlocked
    let activeLessonFound = false;
    let currentLessonId: string | null = null;

    const sections = course.sections.map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      orderIndex: section.orderIndex,
      units: section.units.map((unit) => ({
        id: unit.id,
        title: unit.title,
        description: unit.description,
        guideBook: unit.guideBook,
        orderIndex: unit.orderIndex,
        lessons: unit.lessons.map((lesson) => {
          const isCompleted = completedLessonIds.has(lesson.id);
          const isUnlocked = previousLessonCompleted;

          if (isUnlocked && !isCompleted && !activeLessonFound) {
            currentLessonId = lesson.id;
            activeLessonFound = true;
          }

          // Advance previousLessonCompleted for the next lesson
          previousLessonCompleted = isCompleted;

          return {
            id: lesson.id,
            title: lesson.title,
            orderIndex: lesson.orderIndex,
            xpReward: lesson.xpReward,
            gemReward: lesson.gemReward,
            isUnlocked,
            isCompleted,
          };
        }),
      })),
    }));

    // If all completed, current lesson is the last one
    if (!currentLessonId && sections.length > 0) {
      const lastUnit = sections[sections.length - 1].units[sections[sections.length - 1].units.length - 1];
      if (lastUnit && lastUnit.lessons.length > 0) {
        currentLessonId = lastUnit.lessons[lastUnit.lessons.length - 1].id;
      }
    }

    return {
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        targetLanguage: course.language,
        sourceLanguage: course.sourceLanguage,
        currentLessonId,
        sections,
      },
    };
  }
}

export const coursesService = new CoursesService();
