import { Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { PermissionService } from '../services/PermissionService';
import { ApiResponse, CreateRoleRequest } from '../types';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

export class RoleController {
  /**
   * Get all roles for a tenant
   */
  public static async getRoles(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const db = DatabaseService.getInstance();
  const tenantId = req.user?.tenantId;

      if (!tenantId) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid tenant'
        };
        res.status(400).json(response);
        return;
      }

      const roles = await db('roles')
        .where('tenant_id', tenantId)
        .select(
          'id',
          'name',
          'description',
          'tenant_id as tenantId',
          'created_at as createdAt',
          'updated_at as updatedAt'
        )
        .orderBy('name');

      // Get permissions for each role
      const rolesWithPermissions = await Promise.all(
        roles.map(async (role) => {
          const permissions = await db('role_permissions')
            .join('permissions', 'role_permissions.permission_id', 'permissions.id')
            .where('role_permissions.role_id', role.id)
            .select(
              'permissions.id',
              'permissions.name',
              'permissions.description',
              'permissions.module',
              'permissions.action',
              'permissions.resource'
            );

          return {
            ...role,
            permissions
          };
        })
      );

      const response: ApiResponse = {
        success: true,
        data: { roles: rolesWithPermissions }
      };

      res.json(response);
    } catch (error) {
      logger.error('Get roles error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch roles'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get role by ID
   */
  public static async getRoleById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const db = DatabaseService.getInstance();
      const tenantId = req.user?.tenantId;

      const role = await db('roles')
        .where({ id, tenant_id: tenantId })
        .select(
          'id',
          'name',
          'description',
          'tenant_id as tenantId',
          'created_at as createdAt',
          'updated_at as updatedAt'
        )
        .first();

      if (!role) {
        const response: ApiResponse = {
          success: false,
          error: 'Role not found'
        };
        res.status(404).json(response);
        return;
      }

      // Get permissions for this role
      const permissions = await db('role_permissions')
        .join('permissions', 'role_permissions.permission_id', 'permissions.id')
        .where('role_permissions.role_id', role.id)
        .select(
          'permissions.id',
          'permissions.name',
          'permissions.description',
          'permissions.module',
          'permissions.action',
          'permissions.resource'
        );

      const response: ApiResponse = {
        success: true,
        data: {
          role: {
            ...role,
            permissions
          }
        }
      };

      res.json(response);
    } catch (error) {
      logger.error('Get role by ID error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch role'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Create new role (admin only)
   */
  public static async createRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name, description, permissionIds }: CreateRoleRequest = req.body;
      const tenantId = req.user?.tenantId;

      if (!name || !tenantId) {
        const response: ApiResponse = {
          success: false,
          error: 'Role name is required'
        };
        res.status(400).json(response);
        return;
      }

      const db = DatabaseService.getInstance();

      // Check if role already exists
  const existingRole = await db('roles').where({ name, tenant_id: tenantId }).first();
      if (existingRole) {
        const response: ApiResponse = {
          success: false,
          error: 'Role with this name already exists'
        };
        res.status(409).json(response);
        return;
      }

      // Create role
      const [newRole] = await db('roles')
        .insert({
          name,
            description,
            tenant_id: tenantId,
            created_at: new Date(),
            updated_at: new Date()
        })
        .returning('*');

      // Assign permissions if provided
      if (permissionIds && permissionIds.length > 0) {
        const rolePermissions = permissionIds.map((permissionId: string) => ({
          role_id: newRole.id,
          permission_id: permissionId,
          created_at: new Date()
        }));

        await db('role_permissions').insert(rolePermissions);
        // No users yet typically for a new role, but invalidate any cached users who might have been assigned
        try {
          const users = await db('user_roles').where('role_id', newRole.id).select('user_id');
          for (const u of users) {
            await PermissionService.invalidateUserPermissions(u.user_id);
          }
        } catch (err) {
          // ignore cache invalidation failure
        }
      }

      logger.info(`Role created successfully: ${name}`, { 
        roleId: newRole.id, 
        createdBy: req.user?.id,
        tenantId 
      });

      const response: ApiResponse = {
        success: true,
        data: {
          message: 'Role created successfully',
          role: {
            id: newRole.id,
            name: newRole.name,
            description: newRole.description,
            tenantId: newRole.tenant_id
          }
        }
      };

  res.status(201).json(response);
    } catch (error) {
      logger.error('Create role error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to create role'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Update role (admin only)
   */
  public static async updateRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, permissionIds } = req.body;
      const tenantId = req.user?.tenantId;

      if (!name && !description && !permissionIds) {
        const response: ApiResponse = {
          success: false,
          error: 'At least one field is required for update'
        };
        res.status(400).json(response);
        return;
      }

      const db = DatabaseService.getInstance();

      // Check if role exists
  const existingRole = await db('roles').where({ id, tenant_id: tenantId }).first();
      if (!existingRole) {
        const response: ApiResponse = {
          success: false,
          error: 'Role not found'
        };
        res.status(404).json(response);
        return;
      }

      // Check if new name conflicts (if name is being updated)
      if (name && name !== existingRole.name) {
  const conflictingRole = await db('roles').where({ name, tenant_id: tenantId }).first();
        if (conflictingRole) {
          const response: ApiResponse = {
            success: false,
            error: 'Role with this name already exists'
          };
          res.status(409).json(response);
          return;
        }
      }

      // Prepare update data
  const updateData: any = { updated_at: new Date() };
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;

      // Update role
  await db('roles').where({ id, tenant_id: tenantId }).update(updateData);

      // Update permissions if provided
      if (permissionIds) {
        // Remove existing permissions
  await db('role_permissions').where('role_id', id).del();

        // Add new permissions
        if (permissionIds.length > 0) {
          const rolePermissions = permissionIds.map((permissionId: string) => ({
            role_id: id,
            permission_id: permissionId,
            created_at: new Date()
          }));

          await db('role_permissions').insert(rolePermissions);
        }
        // Invalidate permissions cache for all users who have this role
        try {
          const users = await db('user_roles').where('role_id', id).select('user_id');
          for (const u of users) {
            await PermissionService.invalidateUserPermissions(u.user_id);
          }
        } catch (err) {
          // ignore cache invalidation failure
        }
      }

      logger.info(`Role updated successfully: ${existingRole.name}`, { 
        roleId: id, 
        updatedBy: req.user?.id,
        changes: Object.keys(updateData)
      });

      const response: ApiResponse = {
        success: true,
        data: { message: 'Role updated successfully' }
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Update role error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to update role'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Delete role (admin only)
   */
  public static async deleteRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      const db = DatabaseService.getInstance();

      // Check if role exists
  const role = await db('roles').where({ id, tenant_id: tenantId }).first();
      if (!role) {
        const response: ApiResponse = {
          success: false,
          error: 'Role not found'
        };
        res.status(404).json(response);
        return;
      }

      // Check if role is being used by users
  const usersWithRole = await db('user_roles').where('role_id', id).count('* as count').first();
      if (usersWithRole && parseInt(usersWithRole.count as string) > 0) {
        const response: ApiResponse = {
          success: false,
          error: 'Cannot delete role that is assigned to users'
        };
        res.status(400).json(response);
        return;
      }

      // Delete role permissions first
  await db('role_permissions').where('role_id', id).del();

      // Delete role
  await db('roles').where({ id, tenant_id: tenantId }).del();

      logger.info(`Role deleted successfully: ${role.name}`, { 
        roleId: id, 
        deletedBy: req.user?.id
      });

      const response: ApiResponse = {
        success: true,
        data: { message: 'Role deleted successfully' }
      };

      res.json(response);
    } catch (error) {
      logger.error('Delete role error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to delete role'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get all available permissions
   */
  public static async getPermissions(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const db = DatabaseService.getInstance();

      const permissions = await db('permissions')
        .select('id', 'name', 'description', 'module', 'action', 'resource')
        .orderBy(['module', 'action', 'resource']);

      // Group permissions by module
      const groupedPermissions = permissions.reduce((acc, permission) => {
        if (!acc[permission.module]) {
          acc[permission.module] = [];
        }
        acc[permission.module].push(permission);
        return acc;
      }, {} as Record<string, any[]>);

      const response: ApiResponse = {
        success: true,
        data: { 
          permissions,
          groupedPermissions
        }
      };

      res.json(response);
    } catch (error) {
      logger.error('Get permissions error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch permissions'
      };
      res.status(500).json(response);
    }
  }
}
