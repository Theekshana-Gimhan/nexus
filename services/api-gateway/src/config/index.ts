import { config } from 'dotenv';

config();

export const CONFIG = {
  // Server
  PORT: parseInt(process.env.PORT || '3006'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'nexus_jwt_secret_key_2024',
  
  // Service URLs
  SERVICES: {
    IDENTITY: process.env.IDENTITY_SERVICE_URL || 'http://localhost:3001',
    TENANT: process.env.TENANT_SERVICE_URL || 'http://localhost:3005',
    USER: process.env.USER_SERVICE_URL || 'http://localhost:3003',
    PAYROLL: process.env.PAYROLL_SERVICE_URL || 'http://localhost:3004'
  },
  
  // Redis
  REDIS: {
    HOST: process.env.REDIS_HOST || 'localhost',
    PORT: parseInt(process.env.REDIS_PORT || '6379'),
    PASSWORD: process.env.REDIS_PASSWORD || ''
  },
  
  // Rate Limiting
  RATE_LIMIT: {
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000, // 15 minutes
    MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
  },
  
  // Security
  CORS_ORIGINS: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
  HELMET_CSP_ENABLED: process.env.HELMET_CSP_ENABLED === 'true',
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FORMAT: process.env.LOG_FORMAT || 'json'
};
