import { Request, Response } from 'express';
import { TenantService } from '../services/TenantService';
import { CreateTenantRequest, UpdateTenantRequest } from '../types';
import { AuthenticatedRequest } from '../middleware/auth';

class TenantController {
  private tenantService = new TenantService();

  // Create a new tenant
  createTenant = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const data: CreateTenantRequest = req.body;
      
      // Validate required fields
      if (!data.name || !data.domain || !data.adminEmail || !data.planId) {
        res.status(400).json({ 
          error: 'Missing required fields: name, domain, adminEmail, planId' 
        });
        return;
      }

      // Check if domain already exists
      const existingTenant = await this.tenantService.getTenantByDomain(data.domain);
      if (existingTenant) {
        res.status(409).json({ error: 'Domain already exists' });
        return;
      }

      const tenant = await this.tenantService.createTenant(data);
      
      res.status(201).json({
        success: true,
        data: tenant,
        message: 'Tenant created successfully'
      });
    } catch (error) {
      console.error('Create tenant error:', error);
      res.status(500).json({ error: 'Failed to create tenant' });
    }
  };

  // Get tenant by ID
  getTenant = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenant = await this.tenantService.getTenantById(id);
      
      if (!tenant) {
        res.status(404).json({ error: 'Tenant not found' });
        return;
      }

      res.json({
        success: true,
        data: tenant
      });
    } catch (error) {
      console.error('Get tenant error:', error);
      res.status(500).json({ error: 'Failed to get tenant' });
    }
  };

  // Get tenant by domain
  getTenantByDomain = async (req: Request, res: Response): Promise<void> => {
    try {
      const { domain } = req.params;
      const tenant = await this.tenantService.getTenantByDomain(domain);
      
      if (!tenant) {
        res.status(404).json({ error: 'Tenant not found' });
        return;
      }

      res.json({
        success: true,
        data: tenant
      });
    } catch (error) {
      console.error('Get tenant by domain error:', error);
      res.status(500).json({ error: 'Failed to get tenant' });
    }
  };

  // Update tenant
  updateTenant = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data: UpdateTenantRequest = req.body;
      
      const tenant = await this.tenantService.updateTenant(id, data);
      
      if (!tenant) {
        res.status(404).json({ error: 'Tenant not found' });
        return;
      }

      res.json({
        success: true,
        data: tenant,
        message: 'Tenant updated successfully'
      });
    } catch (error) {
      console.error('Update tenant error:', error);
      res.status(500).json({ error: 'Failed to update tenant' });
    }
  };

  // Delete tenant
  deleteTenant = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const deleted = await this.tenantService.deleteTenant(id);
      
      if (!deleted) {
        res.status(404).json({ error: 'Tenant not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Tenant deleted successfully'
      });
    } catch (error) {
      console.error('Delete tenant error:', error);
      res.status(500).json({ error: 'Failed to delete tenant' });
    }
  };

  // List tenants
  listTenants = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await this.tenantService.listTenants(page, limit);
      
      res.json({
        success: true,
        data: result.tenants,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: Math.ceil(result.total / limit)
        }
      });
    } catch (error) {
      console.error('List tenants error:', error);
      res.status(500).json({ error: 'Failed to list tenants' });
    }
  };

  // Get tenant subscription
  getSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const subscription = await this.tenantService.getSubscription(id);
      
      if (!subscription) {
        res.status(404).json({ error: 'Subscription not found' });
        return;
      }

      res.json({
        success: true,
        data: subscription
      });
    } catch (error) {
      console.error('Get subscription error:', error);
      res.status(500).json({ error: 'Failed to get subscription' });
    }
  };

  // Update tenant subscription
  updateSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { planId } = req.body;
      
      if (!planId) {
        res.status(400).json({ error: 'Plan ID is required' });
        return;
      }

      const subscription = await this.tenantService.updateSubscription(id, planId);
      
      if (!subscription) {
        res.status(404).json({ error: 'Subscription not found' });
        return;
      }

      res.json({
        success: true,
        data: subscription,
        message: 'Subscription updated successfully'
      });
    } catch (error) {
      console.error('Update subscription error:', error);
      res.status(500).json({ error: 'Failed to update subscription' });
    }
  };

  // Add user to tenant
  addUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { userId, role } = req.body;
      
      if (!userId || !role) {
        res.status(400).json({ error: 'User ID and role are required' });
        return;
      }

      const tenantUser = await this.tenantService.addUserToTenant(
        id, 
        userId, 
        role, 
        req.user?.userId
      );
      
      res.status(201).json({
        success: true,
        data: tenantUser,
        message: 'User added to tenant successfully'
      });
    } catch (error) {
      console.error('Add user to tenant error:', error);
      res.status(500).json({ error: 'Failed to add user to tenant' });
    }
  };

  // Remove user from tenant
  removeUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, userId } = req.params;
      
      const removed = await this.tenantService.removeUserFromTenant(id, userId);
      
      if (!removed) {
        res.status(404).json({ error: 'User not found in tenant' });
        return;
      }

      res.json({
        success: true,
        message: 'User removed from tenant successfully'
      });
    } catch (error) {
      console.error('Remove user from tenant error:', error);
      res.status(500).json({ error: 'Failed to remove user from tenant' });
    }
  };

  // Get tenant users
  getTenantUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const users = await this.tenantService.getTenantUsers(id);
      
      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('Get tenant users error:', error);
      res.status(500).json({ error: 'Failed to get tenant users' });
    }
  };

  // Get user tenants
  getUserTenants = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User ID not found in token' });
        return;
      }

      const tenants = await this.tenantService.getUserTenants(userId);
      
      res.json({
        success: true,
        data: tenants
      });
    } catch (error) {
      console.error('Get user tenants error:', error);
      res.status(500).json({ error: 'Failed to get user tenants' });
    }
  };
}

export { TenantController };
