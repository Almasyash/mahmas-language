import { z } from 'zod';
import { CEFRLevel, LearningGoal } from '@prisma/client';

export const onboardingSchema = z.object({
  nativeLanguageId: z.string({ required_error: 'Native language is required' }).min(1),
  targetLanguageId: z.string({ required_error: 'Target language is required' }).min(1),
  learningGoal: z.nativeEnum(LearningGoal, {
    errorMap: () => ({ message: 'Invalid learning goal selection' }),
  }),
  dailyMinutesGoal: z
    .number({ required_error: 'Daily commitment target is required' })
    .int()
    .min(5, 'Minimum commitment is 5 minutes')
    .max(120, 'Maximum commitment is 120 minutes'),
  initialLevel: z.nativeEnum(CEFRLevel, {
    errorMap: () => ({ message: 'Invalid CEFR level selection' }),
  }),
  timezone: z.string().optional().default('UTC'),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  timezone: z.string().optional(),
  dailyMinutesGoal: z.number().int().min(5).max(120).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
