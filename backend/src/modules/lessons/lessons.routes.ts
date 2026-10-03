// ==============================================================================
// MAHMAS LANGUAGE — LESSONS ROUTES
// ==============================================================================

import { Router } from 'express';
import { authenticateToken } from '../../guards/auth.guard';
import { lessonsController } from './lessons.controller';

const router = Router();

router.use(authenticateToken);

router.get('/:lessonId/exercises', (req, res, next) => lessonsController.getExercises(req, res, next));
router.post('/:lessonId/submit', (req, res, next) => lessonsController.submitAttempt(req, res, next));

export default router;
