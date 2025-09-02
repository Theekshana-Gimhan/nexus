import { Express } from 'express';
import { authenticateToken, requirePermissions, requireTenantContext, optionalAuth } from '../middleware/auth';
import { strictRateLimit, createRateLimit } from '../middleware/rateLimit';
import { logger } from '../utils/logger';
import jwt from 'jsonwebtoken';

// For now, let's create simple proxy routing without the http-proxy-middleware dependency
import axios from 'axios';
import { CONFIG } from '../config';
import { AuthRequest } from '../types';

// Simple proxy function using axios
const proxyRequest = async (req: AuthRequest, targetUrl: string) => {
  const headers: any = {
    'Content-Type': req.get('Content-Type') || 'application/json',
    'X-Forwarded-For': req.ip,
    'X-Forwarded-Proto': req.protocol,
    'X-Forwarded-Host': req.get('host') || ''
  };

  // Add user context headers
  if (req.user) {
    headers['X-User-ID'] = req.user.id;
    headers['X-User-Email'] = req.user.email;
    headers['X-User-Permissions'] = JSON.stringify(req.user.permissions);
    
    if (req.user.tenantId) {
      headers['X-Tenant-ID'] = req.user.tenantId;
    }
  }

  if (req.tenantContext) {
    headers['X-Tenant-Context'] = req.tenantContext;
  }

  // Forward authorization header
  if (req.get('authorization')) {
    headers['Authorization'] = req.get('authorization');
  }

  const config = {
    method: req.method.toLowerCase() as any,
    url: targetUrl,
    headers,
    ...(req.body && Object.keys(req.body).length > 0 ? { data: req.body } : {}),
    ...(req.query && Object.keys(req.query).length > 0 ? { params: req.query } : {})
  };

  return await axios(config);
};

export function setupRoutes(app: Express): void {
  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      service: 'Nexus API Gateway',
      version: '1.0.0',
      status: 'operational',
      endpoints: {
        health: '/health',
        identity: '/api/v1/auth/*',
        tenants: '/api/v1/tenants/*',
        users: '/api/v1/users/*',
        payroll: '/api/v1/payroll/*'
      }
    });
  });

  // Authentication routes (public)
  app.use('/api/v1/auth/login', strictRateLimit);
  app.use('/api/v1/auth/register', strictRateLimit);
  
  app.all('/api/v1/auth/*', async (req: AuthRequest, res) => {
    try {
      const targetPath = req.path.replace('/api/v1/auth', '');
      const targetUrl = `${CONFIG.SERVICES.IDENTITY}${targetPath}`;
      
      logger.debug('Proxying auth request:', { path: req.path, target: targetUrl });
      
      const response = await proxyRequest(req, targetUrl);
      res.status(response.status).json(response.data);
    } catch (error: any) {
      logger.error('Auth proxy error:', error.message);
      const status = error.response?.status || 500;
      const data = error.response?.data || { error: 'Service unavailable' };
      res.status(status).json(data);
    }
  });

  // Tenant routes (authenticated)
  app.use('/api/v1/tenants*', authenticateToken);
  app.use('/api/v1/tenants', requirePermissions(['tenant:read']));
  app.post('/api/v1/tenants', requirePermissions(['tenant:create']));
  app.put('/api/v1/tenants/*', requirePermissions(['tenant:update']));
  app.delete('/api/v1/tenants/*', requirePermissions(['tenant:delete']));
  
  app.all('/api/v1/tenants*', async (req: AuthRequest, res) => {
    try {
      const targetPath = req.path.replace('/api/v1/tenants', '/tenants');
      const targetUrl = `${CONFIG.SERVICES.TENANT}${targetPath}`;
      
      logger.debug('Proxying tenant request:', { path: req.path, target: targetUrl });
      
      const response = await proxyRequest(req, targetUrl);
      res.status(response.status).json(response.data);
    } catch (error: any) {
      logger.error('Tenant proxy error:', error.message);
      const status = error.response?.status || 500;
      const data = error.response?.data || { error: 'Service unavailable' };
      res.status(status).json(data);
    }
  });

  // User routes (authenticated, tenant-scoped)
  app.use('/api/v1/users*', authenticateToken, requireTenantContext);
  app.use('/api/v1/users', requirePermissions(['user:read']));
  app.post('/api/v1/users', requirePermissions(['user:create']));
  app.put('/api/v1/users/*', requirePermissions(['user:update']));
  app.delete('/api/v1/users/*', requirePermissions(['user:delete']));
  
  app.all('/api/v1/users*', async (req: AuthRequest, res) => {
    try {
      const targetPath = req.path.replace('/api/v1/users', '/users');
      const targetUrl = `${CONFIG.SERVICES.USER}${targetPath}`;
      
      logger.debug('Proxying user request:', { path: req.path, target: targetUrl });
      
      const response = await proxyRequest(req, targetUrl);
      res.status(response.status).json(response.data);
    } catch (error: any) {
      logger.error('User proxy error:', error.message);
      const status = error.response?.status || 500;
      const data = error.response?.data || { error: 'Service unavailable' };
      res.status(status).json(data);
    }
  });

  // Payroll routes (authenticated, tenant-scoped)
  app.use('/api/v1/payroll*', authenticateToken, requireTenantContext);
  app.use('/api/v1/payroll', requirePermissions(['payroll:read']));
  app.post('/api/v1/payroll*', requirePermissions(['payroll:create']));
  app.put('/api/v1/payroll*', requirePermissions(['payroll:update']));
  app.delete('/api/v1/payroll*', requirePermissions(['payroll:delete']));
  
  app.all('/api/v1/payroll*', async (req: AuthRequest, res) => {
    try {
      const targetPath = req.path.replace('/api/v1/payroll', '/payroll');
      const targetUrl = `${CONFIG.SERVICES.PAYROLL}${targetPath}`;
      
      logger.debug('Proxying payroll request:', { path: req.path, target: targetUrl });
      
      const response = await proxyRequest(req, targetUrl);
      res.status(response.status).json(response.data);
    } catch (error: any) {
      logger.error('Payroll proxy error:', error.message);
      const status = error.response?.status || 500;
      const data = error.response?.data || { error: 'Service unavailable' };
      res.status(status).json(data);
    }
  });

  // Development-only debug endpoint: proxy tenants using internally-generated JWT and return JSON
  app.get('/internal/debug/proxy-tenants', async (req, res) => {
    // Only allow in non-production and only from localhost
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ error: 'Not found' });
    }

    const clientIp = (req.ip || '').toString();
    if (!(clientIp === '127.0.0.1' || clientIp === '::1' || (req.get('host') || '').startsWith('localhost'))) {
      return res.status(403).json({ error: 'Forbidden - debug endpoint restricted to localhost' });
    }

    try {
      const payload = {
        id: 'debug-user',
        email: 'debug@nexus.local',
        permissions: ['tenant:read'],
        tenantId: undefined
      } as any;

      const token = jwt.sign(payload, (process.env.JWT_SECRET || (require('../config').CONFIG.JWT_SECRET)), { expiresIn: '5m' });

      const fakeReq: any = {
        method: 'GET',
        path: '/api/v1/tenants',
        ip: clientIp || '127.0.0.1',
        protocol: req.protocol || 'http',
        body: {},
        query: {},
        user: payload,
        tenantContext: undefined,
        get: (h: string) => {
          if (h.toLowerCase() === 'authorization') return `Bearer ${token}`;
          if (h.toLowerCase() === 'content-type') return 'application/json';
          if (h.toLowerCase() === 'host') return req.get('host') || 'localhost';
          return req.get(h);
        }
      } as any;

      const targetUrl = `${require('../config').CONFIG.SERVICES.TENANT}/tenants`;
      const response = await proxyRequest(fakeReq, targetUrl);
      return res.status(response.status).json(response.data);
    } catch (error: any) {
      logger.error('Debug proxy error:', error?.message || error);
      const status = error.response?.status || 500;
      const data = error.response?.data || { error: 'Service unavailable' };
      return res.status(status).json(data);
    }
  });

  logger.info('API Gateway routes configured');
}
