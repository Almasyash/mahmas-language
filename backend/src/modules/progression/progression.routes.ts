// ==============================================================================
// MAHMAS LANGUAGE — PROGRESSION ROUTES
// Protected progression endpoints for dashboard, quests, achievements, and goals
// ==============================================================================

import { Router } from 'express';
import { authenticateToken } from '../../guards/auth.guard';
import { progressionController } from './progression.controller';

const router = Router();

// All progression endpoints require valid JWT authentication
router.use(authenticateToken);

router.get('/dashboard', (req, res, next) => progressionController.getDashboard(req, res, next));
router.get('/xp', (req, res, next) => progressionController.getXpSummary(req, res, next));
router.get('/streak', (req, res, next) => progressionController.getStreak(req, res, next));
router.get('/daily-goal', (req, res, next) => progressionController.getDailyGoal(req, res, next));
router.get('/quests', (req, res, next) => progressionController.getQuests(req, res, next));
router.post('/quests/:questId/claim', (req, res, next) => progressionController.claimQuest(req, res, next));
router.get('/achievements', (req, res, next) => progressionController.getAchievements(req, res, next));
router.get('/currency', (req, res, next) => progressionController.getCurrency(req, res, next));

export default router;
