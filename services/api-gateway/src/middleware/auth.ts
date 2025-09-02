import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { CONFIG } from '../config';
import { AuthRequest, User } from '../types';
import { logger } from '../utils/logger';

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.get('authorization');
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as any;
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      permissions: decoded.permissions || [],
      tenantId: decoded.tenantId
    };
    
    logger.debug('User authenticated:', { userId: req.user.id, permissions: req.user.permissions });
    next();
  } catch (error) {
    logger.warn('Invalid token:', error);
    res.status(403).json({ error: 'Invalid or expired token' });
    return;
  }
};

export const requirePermissions = (requiredPermissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      logger.warn('Insufficient permissions:', { 
        userId: req.user.id, 
        required: requiredPermissions, 
        available: userPermissions 
      });
      res.status(403).json({ 
        error: 'Insufficient permissions',
        required: requiredPermissions 
      });
      return;
    }

    next();
  };
};

export const requireTenantContext = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const tenantId = req.get('x-tenant-id') || req.user.tenantId;
  
  if (!tenantId) {
    res.status(400).json({ error: 'Tenant context required' });
    return;
  }

  req.tenantContext = tenantId;
  next();
};

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as any;
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      permissions: decoded.permissions || [],
      tenantId: decoded.tenantId
    };
    next();
  } catch (error) {
    // Invalid token, but continue without authentication
    logger.debug('Optional auth failed:', error);
    next();
  }
};
