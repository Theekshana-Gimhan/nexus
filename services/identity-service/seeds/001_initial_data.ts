import { Knex } from 'knex';
import bcrypt from 'bcrypt';

export async function seed(knex: Knex): Promise<void> {
  // Delete existing entries
  await knex('role_permissions').del();
  await knex('user_roles').del();
  await knex('permissions').del();
  await knex('users').del();
  await knex('roles').del();

  // Create default tenant ID
  const defaultTenantId = 'b0a8c6b0-5c3e-4d7f-8b9a-1e2f3a4b5c6d';

  // Insert default roles
  const roles = [
    {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      tenant_id: defaultTenantId,
      name: 'admin',
      description: 'System Administrator with full access'
    },
    {
      id: 'b1c2d3e4-f5a6-7890-bcde-f12345678901',
      tenant_id: defaultTenantId,
      name: 'manager',
      description: 'Manager with limited administrative access'
    },
    {
      id: 'c1d2e3f4-a5b6-7890-cdef-123456789012',
      tenant_id: defaultTenantId,
      name: 'employee',
      description: 'Regular employee with basic access'
    }
  ];

  await knex('roles').insert(roles);

  // Create admin user
  const passwordHash = await bcrypt.hash('admin123', 12);
  
  const adminUser = {
    id: 'd1e2f3a4-b5c6-7890-defa-234567890123',
    tenant_id: defaultTenantId,
    email: 'admin@nexus.lk',
    password_hash: passwordHash,
    first_name: 'Admin',
    last_name: 'User',
    is_active: true
  };

  await knex('users').insert(adminUser);

  // Assign admin role to admin user
  await knex('user_roles').insert({
    user_id: adminUser.id,
    role_id: roles[0].id // admin role
  });

  // Insert granular identity permissions
  const permissions = [
    { id: 'e1f2a3b4-c5d6-7890-abcd-1234567890ef', name: 'identity_read_users', description: 'Read user list/details', module: 'identity', action: 'read', resource: 'users' },
    { id: 'f2a3b4c5-d6e7-8901-abcd-2345678901ef', name: 'identity_create_users', description: 'Create new users', module: 'identity', action: 'create', resource: 'users' },
    { id: 'a3b4c5d6-e7f8-9012-abcd-3456789012ef', name: 'identity_update_users', description: 'Update existing users', module: 'identity', action: 'update', resource: 'users' },
    { id: 'b4c5d6e7-f8a9-0123-abcd-4567890123ef', name: 'identity_delete_users', description: 'Delete users', module: 'identity', action: 'delete', resource: 'users' },
    { id: 'c5d6e7f8-a9b0-1234-abcd-5678901234ef', name: 'identity_manage_roles', description: 'Manage roles and permissions', module: 'identity', action: 'manage', resource: 'roles' }
  ];

  await knex('permissions').insert(permissions);

  // Map permissions to roles (admin gets all, manager gets read/update, employee gets read)
  const adminRoleId = roles[0].id;
  const managerRoleId = roles[1].id;
  const employeeRoleId = roles[2].id;

  const rolePermissions = [
    // Admin - all permissions
    ...permissions.map(p => ({ role_id: adminRoleId, permission_id: p.id })),
    // Manager - read + update users
    { role_id: managerRoleId, permission_id: permissions[0].id }, // read users
    { role_id: managerRoleId, permission_id: permissions[2].id }, // update users
    // Employee - read users only
    { role_id: employeeRoleId, permission_id: permissions[0].id }
  ];

  await knex('role_permissions').insert(rolePermissions);

  console.log('✅ Seed data (roles, users, granular permissions) created successfully!');
  console.log('📧 Admin login: admin@nexus.lk');
  console.log('🔑 Password: admin123');
}
