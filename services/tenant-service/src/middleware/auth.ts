import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { CONFIG } from '../config';
import { TenantContext } from '../types';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    roles: string[];
    permissions: string[];
  };
  tenantContext?: TenantContext;
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as any;
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      roles: decoded.roles || [],
      permissions: decoded.permissions || []
    };
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
    return;
  }
};

export const requireTenantContext = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const tenantId = req.headers['x-tenant-id'] as string || req.params.tenantId;
  
  if (!tenantId) {
    res.status(400).json({ error: 'Tenant ID required' });
    return;
  }

  // TODO: Validate user has access to this tenant
  // This would typically involve checking the tenant_users table
  
  req.tenantContext = {
    tenantId,
    userId: req.user!.userId,
    userRole: 'admin', // TODO: Get from tenant_users table
    permissions: req.user!.permissions
  };

  next();
};

export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const hasPermission = req.user.permissions.includes(permission) || 
                         req.user.roles.includes('admin');

    if (!hasPermission) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission,
        userPermissions: req.user.permissions
      });
      return;
    }

    next();
  };
};

export const requireTenantPermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.tenantContext) {
      res.status(400).json({ error: 'Tenant context required' });
      return;
    }

    // TODO: Check tenant-specific permissions
    // For now, use global permissions
    const hasPermission = req.user!.permissions.includes(permission) || 
                         req.tenantContext.userRole === 'admin';

    if (!hasPermission) {
      res.status(403).json({ 
        error: 'Insufficient tenant permissions',
        required: permission,
        tenantId: req.tenantContext.tenantId
      });
      return;
    }

    next();
  };
};

export { AuthenticatedRequest };
