// ==============================================================================
// MAHMAS LANGUAGE — COURSES ROUTES
// ==============================================================================

import { Router } from 'express';
import { authenticateToken } from '../../guards/auth.guard';
import { coursesController } from './courses.controller';

const router = Router();

router.use(authenticateToken);

router.get('/:courseId/path', (req, res, next) => coursesController.getCoursePath(req, res, next));

export default router;
