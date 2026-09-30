import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, _res: Response, next: NextFunction): void => {
  const start = Date.now();
  const method = req.method;
  const path = req.originalUrl;

  _res.on('finish', () => {
    const duration = Date.now() - start;
    const status = _res.statusCode;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[${new Date().toISOString()}] ${method} ${path} -> ${status} (${duration}ms)`);
    }
  });

  next();
};
