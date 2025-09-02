import { DatabaseService } from './DatabaseService';
import { RedisService } from './RedisService';

interface PermissionRecord {
  id: string;
  name: string;
  description?: string;
  module: string;
  action: string;
  resource: string;
}

export interface UserAccessProfile {
  roles: string[];
  permissionObjects: PermissionRecord[];
  permissionStrings: string[]; // module:action:resource
}

/**
 * Centralized helper for resolving a user's roles & permissions from DB.
 * Keeps all join logic in one place so controllers & middleware stay lean.
 */
export class PermissionService {
  /**
   * Fetch roles and permissions for a user (deduplicated)
   */
  static async getUserAccessProfile(userId: string): Promise<UserAccessProfile> {
    const cacheKey = `perms:user:${userId}`;
    try {
      // Try cache first
      const cached = await RedisService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as UserAccessProfile;
      }
    } catch {
      // Cache failure is non-fatal; continue to DB
    }

    const db = DatabaseService.getInstance();

    // Roles
    const roleRows = await db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where('user_roles.user_id', userId)
      .select('roles.name');
    const roles = [...new Set(roleRows.map(r => r.name))];

    // Permissions (via roles)
    const permissionRows: PermissionRecord[] = await db('role_permissions')
      .join('permissions', 'role_permissions.permission_id', 'permissions.id')
      .join('user_roles', 'role_permissions.role_id', 'user_roles.role_id')
      .where('user_roles.user_id', userId)
      .select(
        'permissions.id',
        'permissions.name',
        'permissions.description',
        'permissions.module',
        'permissions.action',
        'permissions.resource'
      );

    // Deduplicate permission objects by id
    const seen = new Set<string>();
    const permissionObjects: PermissionRecord[] = [];
    for (const p of permissionRows) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        permissionObjects.push(p);
      }
    }

    const permissionStrings = permissionObjects.map(p => `${p.module}:${p.action}:${p.resource}`);

    const profile: UserAccessProfile = { roles, permissionObjects, permissionStrings };

    // Store in cache (5 min TTL)
    try {
      await RedisService.set(cacheKey, JSON.stringify(profile), 300);
    } catch {
      // Ignore caching errors
    }

    return profile;
  }

  /** Invalidate cached permissions for a user */
  static async invalidateUserPermissions(userId: string): Promise<void> {
    try {
      await RedisService.del(`perms:user:${userId}`);
    } catch {
      // Ignore
    }
  }
}
