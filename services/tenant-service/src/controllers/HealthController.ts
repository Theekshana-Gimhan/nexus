import { Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';

export const healthCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    const db = DatabaseService.getInstance();
    const isDbHealthy = await db.testConnection();
    
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'tenant-service',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: isDbHealthy ? 'healthy' : 'unhealthy'
      }
    };

    const statusCode = isDbHealthy ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'tenant-service',
      error: 'Health check failed'
    });
  }
};
