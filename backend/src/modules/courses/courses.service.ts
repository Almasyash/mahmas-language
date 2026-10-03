// ==============================================================================
// MAHMAS LANGUAGE — COURSES SERVICE
// Server-authoritative course tree, units, lessons, and unlock state calculation
// ==============================================================================

import { prisma } from '../../database/prisma';

export class CoursesService {
  /**
   * Retrieves the course path for a specific course or the user's active target language course.
   * Authoritatively determines lesson unlock and completion states.
   */
  async getCoursePath(courseIdOrNull: string | null, userId: string) {
    let course;

    if (courseIdOrNull && courseIdOrNull !== 'default') {
      course = await prisma.course.findUnique({
        where: { id: courseIdOrNull },
        include: {
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
      // Find course matching user's target language
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });

      const targetLangId = user?.profile?.targetLanguageId;
      if (targetLangId) {
        course = await prisma.course.findFirst({
          where: { languageId: targetLangId },
          include: {
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

    if (!course) {
      // Fallback to first available course
      course = await prisma.course.findFirst({
        include: {
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
      return null;
    }

    // Get all completed lesson attempts for this user in this course
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
        currentLessonId,
        sections,
      },
    };
  }
}

export const coursesService = new CoursesService();
