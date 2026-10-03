import { Router } from 'express';
import { usersController } from './users.controller';
import { progressionController } from '../progression/progression.controller';
import { authenticateToken } from '../../guards/auth.guard';

const router = Router();

router.use(authenticateToken);

router.get('/me/dashboard', (req, res, next) => progressionController.getDashboard(req, res, next));
router.get('/me/profile', (req, res, next) => usersController.getProfile(req, res, next));
router.patch('/me/profile', (req, res, next) => usersController.updateProfile(req, res, next));
router.post('/me/onboarding', (req, res, next) => usersController.completeOnboarding(req, res, next));

export default router;

