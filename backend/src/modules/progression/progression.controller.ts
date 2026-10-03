// ==============================================================================
// MAHMAS LANGUAGE — PROGRESSION CONTROLLER
// Handles requests for dashboard, quests, achievements, and rewards
// ==============================================================================

import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';
import { questsService } from './quests.service';
import { achievementsService } from './achievements.service';
import { xpService } from './xp.service';
import { streakService } from './streak.service';
import { dailyGoalService } from './daily-goal.service';
import { ApiResponse } from '../../common/types';

export class ProgressionController {
  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const data = await dashboardService.getDashboard(userId);

      const response: ApiResponse = {
        success: true,
        data,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getXpSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const data = await xpService.getXpSummary(userId);

      const response: ApiResponse = {
        success: true,
        data,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getStreak(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const data = await streakService.getStreak(userId);

      const response: ApiResponse = {
        success: true,
        data,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getDailyGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const data = await dailyGoalService.getDailyGoalProgress(userId);

      const response: ApiResponse = {
        success: true,
        data,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getQuests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const data = await questsService.getUserQuests(userId);

      const response: ApiResponse = {
        success: true,
        data,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async claimQuest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { questId } = req.params;
      const result = await questsService.claimQuest(userId, questId);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'CLAIM_FAILED',
            message: result.message || 'Cannot claim quest.',
          },
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getAchievements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const data = await achievementsService.getUserAchievements(userId);

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

export const progressionController = new ProgressionController();
