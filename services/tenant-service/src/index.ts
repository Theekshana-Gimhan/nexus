import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { CONFIG } from './config';
import { DatabaseService } from './services/DatabaseService';
import { RedisService } from './services/RedisService';

// Routes
import healthRoutes from './routes/health';
import tenantRoutes from './routes/tenants';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/health', healthRoutes);
app.use('/tenants', tenantRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Nexus Tenant Service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: CONFIG.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received, shutting down gracefully`);
  
  try {
    // Close database connection
    await DatabaseService.getInstance().close();
    console.log('Database connection closed');
    
    // Close Redis connection
    await RedisService.getInstance().disconnect();
    console.log('Redis connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Test database connection
    const db = DatabaseService.getInstance();
    const isDbConnected = await db.testConnection();
    
    if (!isDbConnected) {
      throw new Error('Database connection failed');
    }
    console.log(`info: Database connection established {"service":"tenant-service","timestamp":"${new Date().toISOString()}"}`);

    // Connect to Redis
    await RedisService.getInstance().connect();
    console.log(`info: Redis connection established {"service":"tenant-service","timestamp":"${new Date().toISOString()}"}`);

    // Start HTTP server
    app.listen(CONFIG.PORT, () => {
      console.log(`info: Tenant Service started on port ${CONFIG.PORT} {"service":"tenant-service","timestamp":"${new Date().toISOString()}"}`);
      console.log(`info: Environment: ${CONFIG.NODE_ENV} {"service":"tenant-service","timestamp":"${new Date().toISOString()}"}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server when not running under the test runner
if (typeof process.env.JEST_WORKER_ID === 'undefined') {
  startServer();
}

export default app;
