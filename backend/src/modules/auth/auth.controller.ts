import { Request, Response, NextFunction } from 'express';
import { authService, ClientMeta } from './auth.service';
import { registerSchema, loginSchema, refreshSchema, logoutSchema } from './auth.dto';
import { ApiResponse } from '../../common/types';
import { UnauthorizedError } from '../../common/errors';

export class AuthController {
  private extractClientMeta(req: Request): ClientMeta {
    return {
      ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      deviceId: req.body.deviceId,
      deviceName: req.body.deviceName,
      platform: req.body.platform,
    };
  }

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = registerSchema.parse(req.body);
      const meta = this.extractClientMeta(req);
      const result = await authService.register(validated, meta);

      const response: ApiResponse = {
        success: true,
        data: result,
        meta: { timestamp: new Date().toISOString() },
      };
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = loginSchema.parse(req.body);
      const meta = this.extractClientMeta(req);
      const result = await authService.login(validated, meta);

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

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = refreshSchema.parse(req.body);
      const meta = this.extractClientMeta(req);
      const result = await authService.refresh(validated.refreshToken, meta);

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

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }
      const validated = logoutSchema.parse(req.body || {});
      const result = await authService.logout(userId, validated.refreshToken);

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

  async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }
      const user = await authService.getCurrentUser(userId);

      const response: ApiResponse = {
        success: true,
        data: user,
        meta: { timestamp: new Date().toISOString() },
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
