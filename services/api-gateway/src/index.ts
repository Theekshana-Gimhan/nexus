import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { CONFIG } from './config';
import { logger } from './utils/logger';
import { redisService } from './services/RedisService';
import { defaultRateLimit } from './middleware/rateLimit';
import { setupRoutes } from './routes';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: CONFIG.HELMET_CSP_ENABLED,
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: CONFIG.CORS_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Requested-With']
}));

// Compression and parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(defaultRateLimit);

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Health check endpoint
app.get('/health', (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: CONFIG.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    services: {
      redis: redisService.isHealthy()
    }
  };
  
  res.json(health);
});

// API routes
setupRoutes(app);

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });
  
  if (!res.headersSent) {
    res.status(500).json({
      error: 'Internal server error',
      message: CONFIG.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

async function startServer() {
  try {
    // Connect to Redis (optional)
    await redisService.connect();
    
    app.listen(CONFIG.PORT, () => {
      logger.info(`API Gateway started on port ${CONFIG.PORT}`, {
        environment: CONFIG.NODE_ENV,
        cors: CONFIG.CORS_ORIGINS,
        services: CONFIG.SERVICES
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await redisService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await redisService.disconnect();
  process.exit(0);
});

if (require.main === module) {
  startServer();
}

export { app };
