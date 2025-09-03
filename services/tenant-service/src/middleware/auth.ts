import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { CONFIG } from '../config';
import { TenantContext } from '../types';
import { DatabaseService } from '../services/DatabaseService';

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

export const requireTenantContext = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const tenantId = (req.headers['x-tenant-id'] as string) || (req.params.id as string) || (req.params.tenantId as string);

  if (!tenantId) {
    res.status(400).json({ error: 'Tenant ID required' });
    return;
  }

  // Require authenticated user for tenant-scoped operations
  if (!req.user || !req.user.userId) {
    res.status(401).json({ error: 'Authentication required for tenant operations' });
    return;
  }

  try {
    const knex = DatabaseService.getInstance().getKnex();

    // Verify tenant exists
    const tenant = await knex('tenants').where('id', tenantId).first();
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    // Lookup tenant user role if present
    const tenantUser = await knex('tenant_users')
      .where({ tenant_id: tenantId, user_id: req.user.userId })
      .first();

    const userRole = tenantUser?.role || 'member';

    req.tenantContext = {
      tenantId,
      userId: req.user.userId,
      userRole,
      permissions: req.user.permissions || []
    } as TenantContext;

    next();
  } catch (error) {
    console.error('Tenant context resolution error:', error);
    res.status(500).json({ error: 'Failed to validate tenant context' });
    return;
  }
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
