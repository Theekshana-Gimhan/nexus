import { Router } from 'express';
import { TenantController } from '../controllers/TenantController';
import { 
  authenticateToken, 
  requirePermission, 
  requireTenantContext,
  requireTenantPermission 
} from '../middleware/auth';

const router = Router();
const tenantController = new TenantController();

// Public routes (no authentication required)
router.get('/domain/:domain', tenantController.getTenantByDomain);

// Protected routes (authentication required)
router.use(authenticateToken);

// Tenant CRUD operations
router.post('/', 
  requirePermission('tenant:create'),
  tenantController.createTenant
);

router.get('/', 
  requirePermission('tenant:read'),
  tenantController.listTenants
);

router.get('/:id', 
  requirePermission('tenant:read'),
  tenantController.getTenant
);

router.put('/:id', 
  requirePermission('tenant:update'),
  tenantController.updateTenant
);

router.delete('/:id', 
  requirePermission('tenant:delete'),
  tenantController.deleteTenant
);

// Subscription management
router.get('/:id/subscription', 
  requirePermission('tenant:read'),
  tenantController.getSubscription
);

router.put('/:id/subscription', 
  requirePermission('tenant:update'),
  tenantController.updateSubscription
);

// Tenant user management
router.post('/:id/users', 
  requireTenantContext,
  requireTenantPermission('tenant:manage:users'),
  tenantController.addUser
);

router.delete('/:id/users/:userId', 
  requireTenantContext,
  requireTenantPermission('tenant:manage:users'),
  tenantController.removeUser
);

router.get('/:id/users', 
  requireTenantContext,
  requireTenantPermission('tenant:read:users'),
  tenantController.getTenantUsers
);

// User's tenants
router.get('/user/tenants', tenantController.getUserTenants);

export default router;
