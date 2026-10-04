import { Request, Response, NextFunction } from 'express';
import { AppError } from '../common/errors';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export const rateLimiter = (options: { windowMs: number; maxRequests: number; message?: string }) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // In test environment, bypass rate limits to avoid flakiness
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const userOrIp = (req as any).user?.userId
      ? `user:${(req as any).user.userId}`
      : `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
    const routePath = req.baseUrl ? `${req.baseUrl}${req.route?.path || req.path}` : req.path;
    const now = Date.now();
    const key = `${routePath}:${userOrIp}`;

    const record = rateLimitStore.get(key);

    if (!record || now > record.resetAt) {
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + options.windowMs,
      });
      return next();
    }

    if (record.count >= options.maxRequests) {
      const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
      _res.setHeader('Retry-After', retryAfterSec);
      throw new AppError(
        429,
        'TOO_MANY_REQUESTS',
        options.message || 'Too many requests. Please slow down and try again later.'
      );
    }

    record.count += 1;
    next();
  };
};
