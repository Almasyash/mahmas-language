import dotenv from 'dotenv';
dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: string;
  appName: string;
  jwtAccessSecret: string;
  jwtAccessExpiration: string;
  jwtRefreshSecret: string;
  jwtRefreshExpiration: string;
  databaseUrl: string;
  corsOrigins: string[];
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  appName: process.env.APP_NAME || 'Mahmas Language Platform',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'dev_jwt_access_secret_min_32_chars_long',
  jwtAccessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_min_32_chars_long',
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mahmas_language',
  corsOrigins: (process.env.CORS_ORIGIN || '*').split(',').map((origin) => origin.trim()),
};
