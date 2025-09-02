import { Router } from 'express';
import { RoleController } from '../controllers/RoleController';
import { authenticateToken, requirePermission } from '../middleware/auth';

const router = Router();

// GET /roles - Get all roles for tenant (permission based)
router.get('/', 
  authenticateToken, 
  requirePermission('identity:manage:roles'),
  RoleController.getRoles
);

// GET /roles/:id - Get role by ID
router.get('/:id', 
  authenticateToken, 
  requirePermission('identity:manage:roles'),
  RoleController.getRoleById
);

// POST /roles - Create new role (admin only)
router.post('/', 
  authenticateToken, 
  requirePermission('identity:manage:roles'),
  RoleController.createRole
);

// PUT /roles/:id - Update role (admin only)
router.put('/:id', 
  authenticateToken, 
  requirePermission('identity:manage:roles'),
  RoleController.updateRole
);

// DELETE /roles/:id - Delete role (admin only)
router.delete('/:id', 
  authenticateToken, 
  requirePermission('identity:manage:roles'),
  RoleController.deleteRole
);

// GET /permissions - Get all available permissions
router.get('/permissions/all', 
  authenticateToken, 
  requirePermission('identity:manage:roles'),
  RoleController.getPermissions
);

export default router;
