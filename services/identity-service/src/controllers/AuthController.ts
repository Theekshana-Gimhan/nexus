import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { DatabaseService } from '../services/DatabaseService';
import { PermissionService } from '../services/PermissionService';
import { JWTPayload, ApiResponse, LoginRequest, RegisterRequest } from '../types';
import { logger } from '../utils/logger';

export class AuthController {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'nexus_jwt_secret_key_dev_only';
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
  private static readonly BCRYPT_ROUNDS = 12;

  /**
   * User login with email and password
   */
  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password }: LoginRequest = req.body;

      // Basic validation
      if (!email || !password) {
        const response: ApiResponse = {
          success: false,
          error: 'Email and password are required'
        };
        res.status(400).json(response);
        return;
      }

      // Get user from database
      const db = DatabaseService.getInstance();
      const user = await db('users')
        .where({ email, is_active: true })
        .first();

      if (!user) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid credentials'
        };
        res.status(401).json(response);
        return;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid credentials'
        };
        res.status(401).json(response);
        return;
      }

  // Resolve roles & permissions via central service
  const accessProfile = await PermissionService.getUserAccessProfile(user.id);

      // Generate JWT token
      const tokenPayload: JWTPayload = {
        userId: user.id,
        tenantId: user.tenant_id,
        email: user.email,
  roles: accessProfile.roles,
  permissions: accessProfile.permissionStrings
      };

      const accessToken = jwt.sign(tokenPayload, AuthController.JWT_SECRET as string, {
        expiresIn: AuthController.JWT_EXPIRES_IN
      } as jwt.SignOptions);

      // Update last login timestamp
      await db('users')
        .where({ id: user.id })
        .update({ last_login_at: new Date() });

      // Return success response
      const response: ApiResponse = {
        success: true,
        data: {
          accessToken,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            tenantId: user.tenant_id,
            roles: accessProfile.roles,
            permissions: accessProfile.permissionObjects
          }
        }
      };

      logger.info(`User logged in successfully: ${user.email}`, { 
        userId: user.id, 
        tenantId: user.tenant_id 
      });

      res.json(response);
    } catch (error) {
      logger.error('Login error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Login failed'
      };
      res.status(500).json(response);
    }
  }

  /**
   * User registration
   */
  public static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName, tenantId }: RegisterRequest = req.body;

      // Basic validation
      if (!email || !password || !firstName || !lastName || !tenantId) {
        const response: ApiResponse = {
          success: false,
          error: 'All fields are required'
        };
        res.status(400).json(response);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid email format'
        };
        res.status(400).json(response);
        return;
      }

      // Validate password strength
      if (password.length < 6) {
        const response: ApiResponse = {
          success: false,
          error: 'Password must be at least 6 characters long'
        };
        res.status(400).json(response);
        return;
      }

      const db = DatabaseService.getInstance();

      // Check if user already exists
      const existingUser = await db('users').where({ email }).first();
      if (existingUser) {
        const response: ApiResponse = {
          success: false,
          error: 'User with this email already exists'
        };
        res.status(409).json(response);
        return;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, AuthController.BCRYPT_ROUNDS);

      // Create user
      const [newUser] = await db('users')
        .insert({
          email,
          password_hash: passwordHash,
          first_name: firstName,
          last_name: lastName,
          tenant_id: tenantId,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');

      // Assign default user role
      const defaultRole = await db('roles')
        .where({ name: 'user', tenant_id: tenantId })
        .first();

      if (defaultRole) {
        await db('user_roles').insert({
          user_id: newUser.id,
          role_id: defaultRole.id,
          created_at: new Date()
        });
        // Invalidate permission cache for this user (best-effort)
        try {
          await PermissionService.invalidateUserPermissions(newUser.id);
        } catch {
          // ignore cache errors
        }
      }

      logger.info(`User registered successfully: ${email}`, { 
        userId: newUser.id, 
        tenantId 
      });

      const response: ApiResponse = {
        success: true,
        data: {
          message: 'User registered successfully',
          user: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.first_name,
            lastName: newUser.last_name,
            tenantId: newUser.tenant_id
          }
        }
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Registration error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Registration failed'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Verify JWT token
   */
  public static verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, AuthController.JWT_SECRET as string) as JWTPayload;
      return decoded;
    } catch (error) {
      logger.warn('Token verification failed:', error);
      return null;
    }
  }

  /**
   * Token refresh endpoint
   */
  public static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        const response: ApiResponse = {
          success: false,
          error: 'Refresh token is required'
        };
        res.status(400).json(response);
        return;
      }

      // Verify refresh token (for now, using same secret - in production, use different secret)
      const decoded = AuthController.verifyToken(refreshToken);
      if (!decoded) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid refresh token'
        };
        res.status(401).json(response);
        return;
      }

      // Recompute permissions from DB/cache to ensure fresh view
      const accessProfile = await PermissionService.getUserAccessProfile(decoded.userId);

      const newTokenPayload: JWTPayload = {
        userId: decoded.userId,
        tenantId: decoded.tenantId,
        email: decoded.email,
        roles: accessProfile.roles,
        permissions: accessProfile.permissionStrings
      };

      const accessToken = jwt.sign(newTokenPayload, AuthController.JWT_SECRET as string, {
        expiresIn: AuthController.JWT_EXPIRES_IN
      } as jwt.SignOptions);

      const response: ApiResponse = {
        success: true,
        data: {
          accessToken,
          user: {
            id: decoded.userId,
            email: decoded.email,
            tenantId: decoded.tenantId,
            roles: accessProfile.roles,
            permissions: accessProfile.permissionObjects
          }
        }
      };

      res.json(response);
    } catch (error) {
      logger.error('Token refresh error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Token refresh failed'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Issue a service token via client credentials (simple implementation for dev)
   */
  public static async serviceToken(req: Request, res: Response): Promise<void> {
    try {
      const { clientId, clientSecret } = req.body as { clientId?: string; clientSecret?: string };
  if (!clientId || !clientSecret) { res.status(400).json({ success: false, error: 'clientId and clientSecret required' }); return; }

      const configured = (process.env.SERVICE_CLIENTS || '').split(',').map(s => s.split(':'));
      const match = configured.find(([id, secret]) => id === clientId && secret === clientSecret);
  if (!match) { res.status(401).json({ success: false, error: 'Invalid client credentials' }); return; }

      // For service tokens, issue an access token with service-level roles/permissions
      const payload = {
        userId: `service:${clientId}`,
        tenantId: null,
        email: `${clientId}@services.nexus.local`,
        roles: ['service'],
        permissions: ['integrations:manage:connectors']
      };

  const token = jwt.sign(payload as any, AuthController.JWT_SECRET as string, { expiresIn: '1h' });
  res.json({ success: true, data: { accessToken: token, expiresIn: 3600 } });
  return;
    } catch (error) {
      logger.error('Service token error:', error);
      res.status(500).json({ success: false, error: 'Service token error' });
    }
  }

  /**
   * Get current user profile
   */
  public static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user; // Added by auth middleware

      const response: ApiResponse = {
        success: true,
        data: { user }
      };

      res.json(response);
    } catch (error) {
      logger.error('Get profile error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to get user profile'
      };
      res.status(500).json(response);
    }
  }
}
