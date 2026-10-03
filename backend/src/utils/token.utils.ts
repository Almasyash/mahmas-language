import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/environment';
import { UserSessionPayload } from '../common/types';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const generateAccessToken = (payload: UserSessionPayload): string => {
  return jwt.sign(payload, config.jwtAccessSecret, {
    expiresIn: config.jwtAccessExpiration as any,
  });
};

export const generateRefreshToken = (userId: string): string => {
  // Use crypto random bytes combined with JWT for uniqueness and security
  const randomEntropy = crypto.randomBytes(16).toString('hex');
  return jwt.sign({ userId, entropy: randomEntropy }, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiration as any,
  });
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  return jwt.verify(token, config.jwtRefreshSecret) as { userId: string };
};
