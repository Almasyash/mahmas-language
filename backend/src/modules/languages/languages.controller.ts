import { Request, Response, NextFunction } from 'express';
import { languagesService } from './languages.service';
import { ApiResponse } from '../../common/types';

export class LanguagesController {
  async getLanguages(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const languages = await languagesService.getActiveLanguages();
      const response: ApiResponse = {
        success: true,
        data: languages,
        meta: { timestamp: new Date().toISOString() },
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }
}

export const languagesController = new LanguagesController();
