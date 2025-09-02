import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticateToken, requireRole, requirePermission } from '../middleware/auth';

const router = Router();

// GET /users - Get all users (retain admin role restriction to avoid exposing list to basic readers)
router.get('/', 
  authenticateToken, 
  requireRole('admin'), 
  UserController.getUsers
);

// GET /users/:id - Get user by ID
router.get('/:id', 
  authenticateToken, 
  UserController.getUserById
);

// POST /users - Create new user (permission based)
router.post('/', 
  authenticateToken, 
  requirePermission('identity:create:users'), 
  UserController.createUser
);

// PUT /users/:id - Update user
router.put('/:id', 
  authenticateToken, 
  UserController.updateUser
);

// DELETE /users/:id - Delete user (permission based)
router.delete('/:id', 
  authenticateToken, 
  requirePermission('identity:delete:users'), 
  UserController.deleteUser
);

// POST /users/change-password - Change own password
router.post('/change-password', 
  authenticateToken, 
  UserController.changePassword
);

// POST /users/:id/roles - Assign a role to a user
router.post('/:id/roles',
  authenticateToken,
  requirePermission('identity:manage:roles'),
  UserController.assignRole
);

// DELETE /users/:id/roles/:roleId - Remove a role from a user
router.delete('/:id/roles/:roleId',
  authenticateToken,
  requirePermission('identity:manage:roles'),
  UserController.removeRole
);

export default router;
