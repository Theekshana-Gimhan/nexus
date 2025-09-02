import { Request, Response, NextFunction } from 'express';
import { AuthController } from '../controllers/AuthController';
import { DatabaseService } from '../services/DatabaseService';
import { ApiResponse } from '../types';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    tenantId: string;
    roles: string[];
    permissions: string[];
  };
}

/**
 * Middleware to verify JWT token and add user info to request
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      const response: ApiResponse = {
        success: false,
        error: 'Access token is required'
      };
      res.status(401).json(response);
      return;
    }

    // Verify token
    const decoded = AuthController.verifyToken(token);
    if (!decoded) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid or expired token'
      };
      res.status(401).json(response);
      return;
    }

    // Get fresh user data from database
    const db = DatabaseService.getInstance();
    const user = await db('users')
      .where({ id: decoded.userId, is_active: true })
      .first();

    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: 'User not found or inactive'
      };
      res.status(401).json(response);
      return;
    }

    // Add user info to request
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      tenantId: user.tenant_id,
      roles: decoded.roles,
      permissions: decoded.permissions
    };

    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Authentication failed'
    };
    res.status(500).json(response);
  }
};

/**
 * Middleware to check if user has required role
 */
export const requireRole = (requiredRole: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: 'Authentication required'
      };
      res.status(401).json(response);
      return;
    }

    if (!req.user.roles.includes(requiredRole)) {
      const response: ApiResponse = {
        success: false,
        error: 'Insufficient permissions'
      };
  logger.warn('Role check failed', { userId: req.user.id, requiredRole, roles: req.user.roles, path: req.path });
      res.status(403).json(response);
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user has required permission
 */
export const requirePermission = (requiredPermission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: 'Authentication required'
      };
      res.status(401).json(response);
      return;
    }

    if (!req.user.permissions.includes(requiredPermission)) {
      const response: ApiResponse = {
        success: false,
        error: 'Insufficient permissions'
      };
  logger.warn('Permission check failed', { userId: req.user.id, requiredPermission, permissions: req.user.permissions.length, path: req.path });
      res.status(403).json(response);
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user belongs to the same tenant or is admin
 */
export const requireSameTenant = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    const response: ApiResponse = {
      success: false,
      error: 'Authentication required'
    };
    res.status(401).json(response);
    return;
  }

  // Extract tenantId from request parameters or body
  const requestTenantId = req.params.tenantId || req.body.tenantId;
  
  // Admin can access any tenant
  if (req.user.roles.includes('admin')) {
    next();
    return;
  }

  // Check if user belongs to the requested tenant
  if (requestTenantId && req.user.tenantId !== requestTenantId) {
    const response: ApiResponse = {
      success: false,
      error: 'Access denied for this tenant'
    };
    res.status(403).json(response);
    return;
  }

  next();
};
