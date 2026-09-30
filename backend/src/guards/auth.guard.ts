import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { UnauthorizedError } from '../common/errors';
import { UserSessionPayload } from '../common/types';

declare global {
  namespace Express {
    interface Request {
      user?: UserSessionPayload;
    }
  }
}

export const authenticateToken = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    throw new UnauthorizedError('Missing or malformed Authorization header');
  }

  try {
    const decoded = jwt.verify(token, config.jwtAccessSecret) as UserSessionPayload;
    req.user = decoded;
    next();
  } catch (err) {
    throw new UnauthorizedError('Invalid or expired authentication token');
  }
};
