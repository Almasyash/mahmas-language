// ==============================================================================
// MAHMAS LANGUAGE — PRACTICE ROUTES
// Endpoints for practice sessions, exercise submission, mistakes, and vocabulary
// ==============================================================================

import { Router } from 'express';
import { authenticateToken } from '../../guards/auth.guard';
import { practiceController } from './practice.controller';

const router = Router();

router.use(authenticateToken);

router.get('/overview', (req, res, next) => practiceController.getOverview(req, res, next));
router.post('/session/start', (req, res, next) => practiceController.startSession(req, res, next));
router.post('/exercises/:exerciseId/submit', (req, res, next) => practiceController.submitExercise(req, res, next));
router.post('/session/:sessionId/complete', (req, res, next) => practiceController.completeSession(req, res, next));
router.get('/mistakes', (req, res, next) => practiceController.getMistakes(req, res, next));
router.get('/vocabulary', (req, res, next) => practiceController.getVocabulary(req, res, next));

export default router;
