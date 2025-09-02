import { config } from 'dotenv';

config();

export const CONFIG = {
  PORT: parseInt(process.env.PORT || '3005'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432'),
  DB_NAME: process.env.DB_NAME || 'nexus_tenant',
  DB_USER: process.env.DB_USER || 'nexus',
  DB_PASSWORD: process.env.DB_PASSWORD || 'nexus_dev_password',
  
  // Redis
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379'),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
  
  // RabbitMQ
  RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://nexus:nexus_dev_password@localhost:5672',
  
  // Identity Service
  IDENTITY_SERVICE_URL: process.env.IDENTITY_SERVICE_URL || 'http://localhost:3001',
  JWT_SECRET: process.env.JWT_SECRET || 'nexus_jwt_secret_key_2024',
  
  // Service Settings
  DEFAULT_MAX_USERS: parseInt(process.env.DEFAULT_MAX_USERS || '50'),
  TRIAL_PERIOD_DAYS: parseInt(process.env.TRIAL_PERIOD_DAYS || '14'),
};
