// ==============================================================================
// MAHMAS LANGUAGE — LESSONS CONTROLLER
// Handles lesson exercises delivery and authoritative attempt submission
// ==============================================================================

import { Request, Response, NextFunction } from 'express';
import { lessonsService } from './lessons.service';
import { ApiResponse } from '../../common/types';

export class LessonsController {
  async getExercises(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { lessonId } = req.params;

      const data = await lessonsService.getLessonExercises(lessonId, userId);

      const response: ApiResponse = {
        success: true,
        data,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async submitAttempt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { lessonId } = req.params;
      const { answers, durationSec } = req.body;

      if (!Array.isArray(answers)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'answers array is required.',
          },
        });
        return;
      }

      const data = await lessonsService.submitLessonAttempt({
        lessonId,
        userId,
        answers,
        durationSec: Number(durationSec) || 60,
      });

      const response: ApiResponse = {
        success: true,
        data,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const lessonsController = new LessonsController();
