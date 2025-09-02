import { Request } from 'express';

export interface User {
  id: string;
  email: string;
  permissions: string[];
  tenantId?: string;
}

export interface AuthRequest extends Request {
  user?: User;
  tenantContext?: string;
}

export interface ServiceRoute {
  path: string;
  target: string;
  requireAuth: boolean;
  requireTenant?: boolean;
  permissions?: string[];
  rateLimit?: {
    windowMs: number;
    max: number;
  };
}

export interface ProxyConfig {
  target: string;
  changeOrigin: boolean;
  pathRewrite?: Record<string, string>;
  onError?: (err: Error, req: any, res: any) => void;
  onProxyReq?: (proxyReq: any, req: any, res: any) => void;
  onProxyRes?: (proxyRes: any, req: any, res: any) => void;
}

export interface RateLimitStore {
  incr(key: string): Promise<number>;
  decrement(key: string): Promise<void>;
  resetKey(key: string): Promise<void>;
}
