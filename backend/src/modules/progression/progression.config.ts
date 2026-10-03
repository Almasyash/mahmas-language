// ==============================================================================
// MAHMAS LANGUAGE — PROGRESSION & GAMIFICATION CONFIGURATION
// Central authoritative configuration for XP, Streaks, Daily Goals, and Levels
// ==============================================================================

export const ProgressionConfig = {
  // Base XP Rewards
  XP_REWARDS: {
    CORRECT_EXERCISE: 5,
    LESSON_COMPLETED: 20,
    PRACTICE_COMPLETED: 15,
    PRACTICE_EXERCISE_CORRECT: 3,
    AI_MESSAGE_SENT: 3,
    AI_CONVERSATION_COMPLETED: 15,
    DAILY_QUEST_DEFAULT: 20,
    ACHIEVEMENT_UNLOCKED: 50,
  },

  // Virtual Currency (Gems) Rewards
  GEM_REWARDS: {
    LESSON_COMPLETED: 2,
    PRACTICE_COMPLETED: 2,
    AI_CONVERSATION_COMPLETED: 2,
    DAILY_QUEST_DEFAULT: 5,
    INITIAL_BALANCE: 10,
  },

  // Daily Goal options (in minutes)
  DAILY_GOAL_MINUTES_OPTIONS: [5, 10, 15, 20],
  DEFAULT_DAILY_GOAL_MINUTES: 15,

  // Lesson evaluation thresholds
  LESSON_PASSING_SCORE_PERCENT: 70,

  // Spaced Repetition / Vocabulary Review Delays (in hours)
  SRS_REVIEW_INTERVALS_HOURS: {
    NEW: 4,         // 4 hours
    LEARNING: 24,   // 1 day
    REVIEW: 72,     // 3 days
    MASTERED: 168,  // 7 days
  },
};

/**
 * Deterministic Level Progression Formula
 * Level 1: 0 - 99 XP (100 needed)
 * Level 2: 100 - 299 XP (200 needed)
 * Level 3: 300 - 599 XP (300 needed)
 * Level N requires 100 * N XP to reach Level N+1
 */
export function calculateLevel(totalXp: number): {
  level: number;
  xpIntoCurrentLevel: number;
  xpToNextLevel: number;
  progressPercent: number;
} {
  const safeXp = Math.max(0, totalXp);

  let level = 1;
  let accumulatedXp = 0;
  let xpForNextLevel = 100;

  while (safeXp >= accumulatedXp + xpForNextLevel) {
    accumulatedXp += xpForNextLevel;
    level += 1;
    xpForNextLevel = level * 100;
  }

  const xpIntoCurrentLevel = safeXp - accumulatedXp;
  const xpToNextLevel = xpForNextLevel - xpIntoCurrentLevel;
  const progressPercent = Math.min(100, Math.round((xpIntoCurrentLevel / xpForNextLevel) * 100));

  return {
    level,
    xpIntoCurrentLevel,
    xpToNextLevel,
    progressPercent,
  };
}
