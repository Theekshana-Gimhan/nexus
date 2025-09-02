import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { RedisService } from '../services/RedisService';
import { ApiResponse } from '../types';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'identity-service',
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: false,
        redis: false
      }
    };

    // Check database connection
    try {
      const db = DatabaseService.getInstance();
      await db.raw('SELECT 1');
      health.checks.database = true;
    } catch (error) {
      health.checks.database = false;
    }

    // Check Redis connection
    try {
      const redis = RedisService.getClient();
      await redis.ping();
      health.checks.redis = true;
    } catch (error) {
      health.checks.redis = false;
    }

    // Determine overall status
    const allHealthy = Object.values(health.checks).every(check => check === true);
    health.status = allHealthy ? 'healthy' : 'unhealthy';

    const response: ApiResponse = {
      success: true,
      data: health
    };

    res.status(allHealthy ? 200 : 503).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Health check failed'
    };
    res.status(503).json(response);
  }
});

export default router;
