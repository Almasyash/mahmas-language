import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/environment';
import { requestLogger } from './middleware/logger.middleware';
import { errorHandler } from './middleware/error.middleware';
import { ApiResponse } from './common/types';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import languagesRoutes from './modules/languages/languages.routes';
import coursesRoutes from './modules/courses/courses.routes';
import lessonsRoutes from './modules/lessons/lessons.routes';
import practiceRoutes from './modules/practice/practice.routes';
import progressionRoutes from './modules/progression/progression.routes';

export const createApp = (): Application => {
  const app = express();

  // Global Middleware
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // Health & Service Discovery
  app.get('/api/v1/health', (_req: Request, res: Response) => {
    const response: ApiResponse = {
      success: true,
      data: {
        status: 'UP',
        appName: config.appName,
        environment: config.nodeEnv,
        timestamp: new Date().toISOString(),
      },
      meta: { timestamp: new Date().toISOString() },
    };
    res.status(200).json(response);
  });

  app.get('/api/v1/info', (_req: Request, res: Response) => {
    const response: ApiResponse = {
      success: true,
      data: {
        name: config.appName,
        version: '0.1.0-alpha',
        targetLanguageCount: 12,
        capabilities: [
          'COURSES',
          'GAMIFICATION',
          'PROGRESSION',
          'PRACTICE',
          'AI_TUTOR',
          'AI_VOICE_CALL',
          'AI_VIDEO_CALL',
          'HUMAN_AUDIO_CALL',
          'HUMAN_VIDEO_CALL',
          'LANGUAGE_EXCHANGE',
        ],
      },
      meta: { timestamp: new Date().toISOString() },
    };
    res.status(200).json(response);
  });

  // API Modules
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', usersRoutes);
  app.use('/api/v1/languages', languagesRoutes);
  app.use('/api/v1/courses', coursesRoutes);
  app.use('/api/v1/lessons', lessonsRoutes);
  app.use('/api/v1/practice', practiceRoutes);
  app.use('/api/v1/progression', progressionRoutes);
  app.use('/api/v1/quests', progressionRoutes);
  app.use('/api/v1/achievements', progressionRoutes);

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
};
