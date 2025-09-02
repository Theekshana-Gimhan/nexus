import { Response } from 'express';
import bcrypt from 'bcrypt';
import { DatabaseService } from '../services/DatabaseService';
import { PermissionService } from '../services/PermissionService';
import { ApiResponse, CreateUserRequest, UpdateUserRequest } from '../types';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

export class UserController {
  private static readonly BCRYPT_ROUNDS = 12;

  /**
   * Get all users (admin only)
   */
  public static async getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const db = DatabaseService.getInstance();
      const { tenantId } = req.query;
      
      let query = db('users')
          .select(
            'id',
            'email',
            'first_name as firstName',
            'last_name as lastName',
            'tenant_id as tenantId',
            'is_active as isActive',
            'last_login_at as lastLoginAt',
            'created_at as createdAt'
          );

      // If not admin, filter by user's tenant
      if (!req.user?.roles.includes('admin')) {
          query = query.where('tenant_id', req.user?.tenantId);
      } else if (tenantId) {
          query = query.where('tenant_id', tenantId as string);
      }

  // Order by actual column name (avoid relying on alias in order by)
  const users = await query.orderBy('created_at', 'desc');

      // Get roles for each user
      const usersWithRoles = await Promise.all(
        users.map(async (user) => {
          const roles = await db('user_roles')
            .join('roles', 'user_roles.role_id', 'roles.id')
            .where('user_roles.user_id', user.id)
            .select('roles.name', 'roles.description');

          return {
            ...user,
            roles: roles.map(role => ({ name: role.name, description: role.description }))
          };
        })
      );

      const response: ApiResponse = {
        success: true,
        data: { users: usersWithRoles }
      };

      res.json(response);
    } catch (error) {
      logger.error('Get users error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch users'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get user by ID
   */
  public static async getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const db = DatabaseService.getInstance();

      let query = db('users')
          .select(
            'id',
            'email',
            'first_name as firstName',
            'last_name as lastName',
            'tenant_id as tenantId',
            'is_active as isActive',
            'last_login_at as lastLoginAt',
            'created_at as createdAt'
          )
          .where('id', id);

      // If not admin, ensure user can only access their own data or same tenant
      if (!req.user?.roles.includes('admin')) {
        if (req.user?.id !== id) {
            query = query.where('tenant_id', req.user?.tenantId);
        }
      }

      const user = await query.first();

      if (!user) {
        const response: ApiResponse = {
          success: false,
          error: 'User not found'
        };
        res.status(404).json(response);
        return;
      }

      // Get user roles
      const roles = await db('user_roles')
        .join('roles', 'user_roles.role_id', 'roles.id')
        .where('user_roles.user_id', user.id)
        .select('roles.id', 'roles.name', 'roles.description');

      const response: ApiResponse = {
        success: true,
        data: {
          user: {
            ...user,
            roles
          }
        }
      };

      res.json(response);
    } catch (error) {
      logger.error('Get user by ID error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch user'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Create new user (admin only)
   */
  public static async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName, roleId }: CreateUserRequest = req.body;
      
      // Validation
      if (!email || !password || !firstName || !lastName) {
        const response: ApiResponse = {
          success: false,
          error: 'All fields are required'
        };
        res.status(400).json(response);
        return;
      }

      // Use the requesting user's tenant ID
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid tenant'
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
      const passwordHash = await bcrypt.hash(password, UserController.BCRYPT_ROUNDS);

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

      // Assign role
      if (roleId) {
        // Verify role exists and belongs to the same tenant
  const role = await db('roles').where({ id: roleId, tenant_id: tenantId }).first();
        if (role) {
            await db('user_roles').insert({
              user_id: newUser.id,
              role_id: roleId,
              created_at: new Date()
          });
            // Invalidate permission cache for this user
            try {
              await PermissionService.invalidateUserPermissions(newUser.id);
            } catch {
              // ignore cache invalidation errors
            }
        }
      } else {
        // Assign default user role
  const defaultRole = await db('roles').where({ name: 'user', tenant_id: tenantId }).first();
        if (defaultRole) {
            await db('user_roles').insert({
              user_id: newUser.id,
              role_id: defaultRole.id,
              created_at: new Date()
          });
            // Invalidate permission cache for this user
            try {
              await PermissionService.invalidateUserPermissions(newUser.id);
            } catch {
              // ignore cache invalidation errors
            }
        }
      }

      logger.info(`User created successfully: ${email}`, { 
        userId: newUser.id, 
        createdBy: req.user?.id,
        tenantId 
      });

      const response: ApiResponse = {
        success: true,
        data: {
          message: 'User created successfully',
          user: {
            id: newUser.id,
            email: newUser.email,
              firstName: newUser.first_name,
              lastName: newUser.last_name,
              tenantId: newUser.tenant_id,
              isActive: newUser.is_active
          }
        }
      };

  res.status(201).json(response);
    } catch (error) {
      logger.error('Create user error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to create user'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Update user
   */
  public static async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { firstName, lastName, isActive }: UpdateUserRequest = req.body;

      if (!firstName && !lastName && isActive === undefined) {
        const response: ApiResponse = {
          success: false,
          error: 'At least one field is required for update'
        };
        res.status(400).json(response);
        return;
      }

      const db = DatabaseService.getInstance();

      // Check if user exists and permissions
      let query = db('users').where('id', id);
      
      // If not admin, ensure user can only update their own data or same tenant
      if (!req.user?.roles.includes('admin')) {
        if (req.user?.id !== id) {
        query = query.where('tenant_id', req.user?.tenantId);
        }
        // Non-admin users cannot change isActive status
        if (isActive !== undefined && req.user?.id !== id) {
          const response: ApiResponse = {
            success: false,
            error: 'Insufficient permissions to change user status'
          };
          res.status(403).json(response);
          return;
        }
      }

      const existingUser = await query.first();
      if (!existingUser) {
        const response: ApiResponse = {
          success: false,
          error: 'User not found'
        };
        res.status(404).json(response);
        return;
      }

      // Prepare update data
  const updateData: any = { updated_at: new Date() };
      if (firstName) updateData.first_name = firstName;
      if (lastName) updateData.last_name = lastName;
      if (isActive !== undefined) updateData.is_active = isActive;

      // Update user
      await db('users').where('id', id).update(updateData);

      logger.info(`User updated successfully: ${existingUser.email}`, { 
        userId: id, 
        updatedBy: req.user?.id,
        changes: Object.keys(updateData)
      });

      const response: ApiResponse = {
        success: true,
        data: { message: 'User updated successfully' }
      };

      res.json(response);
    } catch (error) {
      logger.error('Update user error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to update user'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Delete user (admin only)
   */
  public static async deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const db = DatabaseService.getInstance();

      // Check if user exists
      const user = await db('users').where('id', id).first();
      if (!user) {
        const response: ApiResponse = {
          success: false,
          error: 'User not found'
        };
        res.status(404).json(response);
        return;
      }

      // Prevent self-deletion
      if (req.user?.id === id) {
        const response: ApiResponse = {
          success: false,
          error: 'Cannot delete your own account'
        };
        res.status(400).json(response);
        return;
      }

      // Delete user roles first (foreign key constraint)
    await db('user_roles').where('user_id', id).del();
      // Invalidate permission cache for this user (best-effort)
      try {
        await PermissionService.invalidateUserPermissions(id);
      } catch {
        // ignore
      }

      // Delete user
      await db('users').where('id', id).del();

      logger.info(`User deleted successfully: ${user.email}`, { 
        userId: id, 
        deletedBy: req.user?.id
      });

      const response: ApiResponse = {
        success: true,
        data: { message: 'User deleted successfully' }
      };

      res.json(response);
    } catch (error) {
      logger.error('Delete user error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to delete user'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Assign a role to a user (admin/role-manage permission required)
   */
  public static async assignRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params; // user id
      const { roleId } = req.body;
      const tenantId = req.user?.tenantId;

      if (!roleId) {
        const response: ApiResponse = { success: false, error: 'roleId is required' };
        res.status(400).json(response);
        return;
      }

      const db = DatabaseService.getInstance();

      // Verify user exists
      const user = await db('users').where({ id, tenant_id: tenantId }).first();
      if (!user) {
        const response: ApiResponse = { success: false, error: 'User not found' };
        res.status(404).json(response);
        return;
      }

      // Verify role exists
      const role = await db('roles').where({ id: roleId, tenant_id: tenantId }).first();
      if (!role) {
        const response: ApiResponse = { success: false, error: 'Role not found' };
        res.status(404).json(response);
        return;
      }

      // Check if already assigned
      const existing = await db('user_roles').where({ user_id: id, role_id: roleId }).first();
      if (existing) {
        const response: ApiResponse = { success: false, error: 'Role already assigned to user' };
        res.status(409).json(response);
        return;
      }

      await db('user_roles').insert({ user_id: id, role_id: roleId, created_at: new Date() });

      // Invalidate user's permission cache
      try {
        await PermissionService.invalidateUserPermissions(id);
      } catch {
        // ignore
      }

      logger.info(`Assigned role ${role.name} to user ${user.email}`, { userId: id, roleId, assignedBy: req.user?.id });

      const response: ApiResponse = { success: true, data: { message: 'Role assigned successfully' } };
      res.status(200).json(response);
    } catch (error) {
      logger.error('Assign role error:', error);
      const response: ApiResponse = { success: false, error: 'Failed to assign role' };
      res.status(500).json(response);
    }
  }

  /**
   * Remove a role from a user
   */
  public static async removeRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id, roleId } = req.params; // user id and role id
      const tenantId = req.user?.tenantId;

      const db = DatabaseService.getInstance();

      // Verify user exists
      const user = await db('users').where({ id, tenant_id: tenantId }).first();
      if (!user) {
        const response: ApiResponse = { success: false, error: 'User not found' };
        res.status(404).json(response);
        return;
      }

      // Verify role exists
      const role = await db('roles').where({ id: roleId, tenant_id: tenantId }).first();
      if (!role) {
        const response: ApiResponse = { success: false, error: 'Role not found' };
        res.status(404).json(response);
        return;
      }

      await db('user_roles').where({ user_id: id, role_id: roleId }).del();

      // Invalidate user's permission cache
      try {
        await PermissionService.invalidateUserPermissions(id);
      } catch {
        // ignore
      }

      logger.info(`Removed role ${role.name} from user ${user.email}`, { userId: id, roleId, removedBy: req.user?.id });

      const response: ApiResponse = { success: true, data: { message: 'Role removed successfully' } };
      res.json(response);
    } catch (error) {
      logger.error('Remove role error:', error);
      const response: ApiResponse = { success: false, error: 'Failed to remove role' };
      res.status(500).json(response);
    }
  }

  /**
   * Change user password
   */
  public static async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.id;

      if (!currentPassword || !newPassword) {
        const response: ApiResponse = {
          success: false,
          error: 'Current password and new password are required'
        };
        res.status(400).json(response);
        return;
      }

      if (newPassword.length < 6) {
        const response: ApiResponse = {
          success: false,
          error: 'New password must be at least 6 characters long'
        };
        res.status(400).json(response);
        return;
      }

      const db = DatabaseService.getInstance();

      // Get current user
      const user = await db('users').where('id', userId).first();
      if (!user) {
        const response: ApiResponse = {
          success: false,
          error: 'User not found'
        };
        res.status(404).json(response);
        return;
      }

      // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isCurrentPasswordValid) {
        const response: ApiResponse = {
          success: false,
          error: 'Current password is incorrect'
        };
        res.status(400).json(response);
        return;
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, UserController.BCRYPT_ROUNDS);

      // Update password
      await db('users').where('id', userId).update({
          password_hash: newPasswordHash,
          updated_at: new Date()
      });

      logger.info(`Password changed successfully for user: ${user.email}`, { 
        userId: userId
      });

      const response: ApiResponse = {
        success: true,
        data: { message: 'Password changed successfully' }
      };

      res.json(response);
    } catch (error) {
      logger.error('Change password error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to change password'
      };
      res.status(500).json(response);
    }
  }
}
