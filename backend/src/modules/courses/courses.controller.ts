// ==============================================================================
// MAHMAS LANGUAGE — COURSES CONTROLLER
// Handles course path, listing, and section/unit/lesson hierarchy queries
// ==============================================================================

import { Request, Response, NextFunction } from 'express';
import { coursesService } from './courses.service';
import { ApiResponse } from '../../common/types';

export class CoursesController {
  async getCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const targetLanguageId = req.query.targetLanguageId as string | undefined;
      const nativeLanguageId = req.query.nativeLanguageId as string | undefined;

      const courses = await coursesService.getCourses({ targetLanguageId, nativeLanguageId }, userId);

      const response: ApiResponse = {
        success: true,
        data: { courses },
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getCoursePath(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { courseId } = req.params;

      const data = await coursesService.getCoursePath(courseId, userId);

      if (!data) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Course not found or no published course available for this language configuration.',
          },
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        data,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const coursesController = new CoursesController();
