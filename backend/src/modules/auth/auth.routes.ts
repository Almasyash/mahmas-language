import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticateToken } from '../../guards/auth.guard';
import { rateLimiter } from '../../middleware/rate-limit.middleware';

const router = Router();

// Rate limited auth operations: 30 requests per minute
const authRateLimit = rateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: 'Too many authentication attempts. Please try again in a minute.',
});

router.post('/register', authRateLimit, (req, res, next) => authController.register(req, res, next));
router.post('/login', authRateLimit, (req, res, next) => authController.login(req, res, next));
router.post('/refresh', authRateLimit, (req, res, next) => authController.refresh(req, res, next));
router.post('/logout', authenticateToken, (req, res, next) => authController.logout(req, res, next));
router.get('/me', authenticateToken, (req, res, next) => authController.getCurrentUser(req, res, next));

export default router;
