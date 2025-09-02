import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { Request, Response } from 'express';
import { CONFIG } from '../config';
import { AuthRequest } from '../types';
import { logger } from '../utils/logger';

export interface ProxyRoute {
  path: string;
  target: string;
  pathRewrite?: Record<string, string>;
  requireAuth?: boolean;
  permissions?: string[];
}

export const createProxy = (target: string, options: Partial<Options> = {}) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    ...options,
    onError: (err: Error, req: Request, res: Response) => {
      logger.error('Proxy error:', {
        error: err.message,
        target,
        path: req.path,
        method: req.method
      });
      
      if (!res.headersSent) {
        res.status(502).json({
          error: 'Service temporarily unavailable',
          message: 'The requested service is currently unavailable. Please try again later.'
        });
      }
    },
    onProxyReq: (proxyReq, req: AuthRequest) => {
      // Add user context to forwarded request
      if (req.user) {
        proxyReq.setHeader('X-User-ID', req.user.id);
        proxyReq.setHeader('X-User-Email', req.user.email);
        proxyReq.setHeader('X-User-Permissions', JSON.stringify(req.user.permissions));
        
        if (req.user.tenantId) {
          proxyReq.setHeader('X-Tenant-ID', req.user.tenantId);
        }
      }
      
      if (req.tenantContext) {
        proxyReq.setHeader('X-Tenant-Context', req.tenantContext);
      }
      
      // Add forwarded headers
      proxyReq.setHeader('X-Forwarded-For', req.ip || '');
      proxyReq.setHeader('X-Forwarded-Proto', req.protocol);
      proxyReq.setHeader('X-Forwarded-Host', req.get('host') || '');
      
      logger.debug('Proxying request:', {
        method: req.method,
        path: req.path,
        target,
        userId: req.user?.id
      });
    },
    onProxyRes: (proxyRes, req, res) => {
      // Add response headers
      proxyRes.headers['X-Gateway'] = 'Nexus-API-Gateway';
      
      logger.debug('Proxy response:', {
        status: proxyRes.statusCode,
        method: req.method,
        path: req.path,
        target
      });
    }
  });
};

// Service-specific proxy configurations
export const identityProxy = createProxy(CONFIG.SERVICES.IDENTITY, {
  pathRewrite: {
    '^/api/v1/auth': '/auth',
    '^/api/v1/users': '/users'
  }
});

export const tenantProxy = createProxy(CONFIG.SERVICES.TENANT, {
  pathRewrite: {
    '^/api/v1/tenants': '/tenants',
    '^/api/v1/subscriptions': '/subscriptions'
  }
});

export const userProxy = createProxy(CONFIG.SERVICES.USER, {
  pathRewrite: {
    '^/api/v1/users': '/users',
    '^/api/v1/profiles': '/profiles'
  }
});

export const payrollProxy = createProxy(CONFIG.SERVICES.PAYROLL, {
  pathRewrite: {
    '^/api/v1/payroll': '/payroll',
    '^/api/v1/employees': '/employees'
  }
});
