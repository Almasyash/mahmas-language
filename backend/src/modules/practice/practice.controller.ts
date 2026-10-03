// ==============================================================================
// MAHMAS LANGUAGE — PRACTICE CONTROLLER
// Handles practice sessions, exercise submission, and mistake/vocab retrieval
// ==============================================================================

import { Request, Response, NextFunction } from 'express';
import { practiceService } from './practice.service';
import { ApiResponse } from '../../common/types';
import { PracticeSessionType } from '@prisma/client';

export class PracticeController {
  async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const data = await practiceService.getOverview(userId);

      const response: ApiResponse = {
        success: true,
        data,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async startSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const sessionType = (req.body.sessionType as PracticeSessionType) || PracticeSessionType.RECOMMENDED;
      const data = await practiceService.startSession(userId, sessionType);

      const response: ApiResponse = {
        success: true,
        data,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async submitExercise(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { exerciseId } = req.params;
      const { sessionId, userAnswer } = req.body;

      if (!sessionId || userAnswer === undefined) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'sessionId and userAnswer are required.',
          },
        });
        return;
      }

      const data = await practiceService.submitExercise({
        sessionId,
        exerciseId,
        userId,
        userAnswer,
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

  async completeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { sessionId } = req.params;
      const durationSec = Number(req.body.durationSec) || 60;

      const data = await practiceService.completeSession({
        sessionId,
        userId,
        durationSec,
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

  async getMistakes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const data = await practiceService.getMistakes(userId);

      const response: ApiResponse = {
        success: true,
        data,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getVocabulary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const data = await practiceService.getVocabulary(userId);

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

export const practiceController = new PracticeController();
