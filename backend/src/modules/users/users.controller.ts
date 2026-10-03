import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { onboardingSchema, updateProfileSchema } from './users.dto';
import { ApiResponse } from '../../common/types';
import { UnauthorizedError } from '../../common/errors';

export class UsersController {
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const profile = await usersService.getProfile(userId);
      const response: ApiResponse = {
        success: true,
        data: profile,
        meta: { timestamp: new Date().toISOString() },
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const validated = updateProfileSchema.parse(req.body);
      const updated = await usersService.updateProfile(userId, validated);

      const response: ApiResponse = {
        success: true,
        data: updated,
        meta: { timestamp: new Date().toISOString() },
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async completeOnboarding(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const validated = onboardingSchema.parse(req.body);
      const result = await usersService.completeOnboarding(userId, validated);

      const response: ApiResponse = {
        success: true,
        data: result,
        meta: { timestamp: new Date().toISOString() },
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }
}

export const usersController = new UsersController();
