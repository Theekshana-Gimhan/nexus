import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface ConnectorReq extends Request {
  user?: any;
}

export const authenticateToken = (req: ConnectorReq, res: Response, next: NextFunction) => {
  try {
  const authHeader = req.headers['authorization'];
  let token = authHeader && (Array.isArray(authHeader) ? authHeader[0] : authHeader.split(' ')[1]);
  // fallback to cookie set by server-to-server session
  if (!token && req.cookies && req.cookies.connector_token) token = req.cookies.connector_token;
    if (!token) return res.status(401).json({ error: 'Access token required' });

    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ error: 'Server misconfigured: JWT_SECRET' });

    const decoded = jwt.verify(token, secret as string) as any;
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const requirePermission = (perm: string) => {
  return (req: ConnectorReq, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const permissions = req.user.permissions || [];
    const roles = req.user.roles || [];
    if (roles.includes('admin') || permissions.includes(perm)) return next();
    return res.status(403).json({ error: 'Insufficient permissions' });
  };
};
