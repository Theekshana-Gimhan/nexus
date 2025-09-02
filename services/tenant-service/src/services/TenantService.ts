import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from './DatabaseService';
import { RedisService } from './RedisService';
import { 
  Tenant, 
  Subscription, 
  TenantUser, 
  CreateTenantRequest, 
  UpdateTenantRequest,
  TenantSettings,
  InviteUserRequest 
} from '../types';
import { CONFIG } from '../config';

class TenantService {
  private db = DatabaseService.getInstance().getKnex();
  private redis = RedisService.getInstance();

  // Tenant Management
  async createTenant(data: CreateTenantRequest): Promise<Tenant> {
    const trx = await this.db.transaction();
    
    try {
      const tenantId = uuidv4();
      const subscriptionId = uuidv4();

      // Default tenant settings
      const defaultSettings: TenantSettings = {
        maxUsers: CONFIG.DEFAULT_MAX_USERS,
        features: ['basic_features'],
        timezone: 'Asia/Colombo',
        currency: 'LKR',
        dateFormat: 'DD/MM/YYYY',
        language: 'en',
        ...data.settings
      };

      // Create subscription first
      const subscription = await trx('subscriptions').insert({
        id: subscriptionId,
        tenant_id: tenantId,
        plan_id: data.planId,
        status: 'trial',
        start_date: new Date(),
        end_date: new Date(Date.now() + CONFIG.TRIAL_PERIOD_DAYS * 24 * 60 * 60 * 1000),
        billing_cycle: 'monthly',
        price_per_month: this.getPlanPrice(data.planId),
        features: JSON.stringify(this.getPlanFeatures(data.planId)),
        max_users: this.getPlanMaxUsers(data.planId)
      }).returning('*');

      // Create tenant
      const tenant = await trx('tenants').insert({
        id: tenantId,
        name: data.name,
        domain: data.domain,
        status: 'pending',
        settings: JSON.stringify(defaultSettings),
        subscription_id: subscriptionId
      }).returning('*');

      await trx.commit();

      // Invalidate cache
      await this.invalidateTenantCache(tenantId);

      return this.mapTenantFromDb(tenant[0]);
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  async getTenantById(id: string): Promise<Tenant | null> {
    // Try cache first
    const cached = await this.getCachedTenant(id);
    if (cached) return cached;

    const tenant = await this.db('tenants')
      .where('id', id)
      .first();

    if (!tenant) return null;

    const mappedTenant = this.mapTenantFromDb(tenant);
    await this.cacheTenant(mappedTenant);
    return mappedTenant;
  }

  async getTenantByDomain(domain: string): Promise<Tenant | null> {
    const tenant = await this.db('tenants')
      .where('domain', domain)
      .first();

    if (!tenant) return null;
    return this.mapTenantFromDb(tenant);
  }

  async updateTenant(id: string, data: UpdateTenantRequest): Promise<Tenant | null> {
    const updated = await this.db('tenants')
      .where('id', id)
      .update({
        ...data,
        updated_at: new Date()
      })
      .returning('*');

    if (!updated.length) return null;

    await this.invalidateTenantCache(id);
    return this.mapTenantFromDb(updated[0]);
  }

  async deleteTenant(id: string): Promise<boolean> {
    const deleted = await this.db('tenants')
      .where('id', id)
      .delete();

    if (deleted > 0) {
      await this.invalidateTenantCache(id);
      return true;
    }
    return false;
  }

  async listTenants(page: number = 1, limit: number = 20): Promise<{ tenants: Tenant[], total: number }> {
    const offset = (page - 1) * limit;
    
    const [tenants, totalCount] = await Promise.all([
      this.db('tenants')
        .select('*')
        .limit(limit)
        .offset(offset)
        .orderBy('created_at', 'desc'),
      this.db('tenants').count('* as count').first()
    ]);

    return {
      tenants: tenants.map(t => this.mapTenantFromDb(t)),
      total: parseInt(totalCount?.count as string || '0')
    };
  }

  // Subscription Management
  async getSubscription(tenantId: string): Promise<Subscription | null> {
    const subscription = await this.db('subscriptions')
      .where('tenant_id', tenantId)
      .first();

    if (!subscription) return null;
    return this.mapSubscriptionFromDb(subscription);
  }

  async updateSubscription(tenantId: string, planId: string): Promise<Subscription | null> {
    const updated = await this.db('subscriptions')
      .where('tenant_id', tenantId)
      .update({
        plan_id: planId,
        features: this.getPlanFeatures(planId),
        max_users: this.getPlanMaxUsers(planId),
        price_per_month: this.getPlanPrice(planId),
        updated_at: new Date()
      })
      .returning('*');

    if (!updated.length) return null;
    
    await this.invalidateTenantCache(tenantId);
    return this.mapSubscriptionFromDb(updated[0]);
  }

  // Tenant User Management
  async addUserToTenant(tenantId: string, userId: string, role: string, invitedBy?: string): Promise<TenantUser> {
    const tenantUser = await this.db('tenant_users').insert({
      id: uuidv4(),
      tenant_id: tenantId,
      user_id: userId,
      role,
      status: 'active',
      invited_by: invitedBy,
      joined_at: new Date()
    }).returning('*');

    await this.invalidateTenantUsersCache(tenantId);
    return this.mapTenantUserFromDb(tenantUser[0]);
  }

  async removeUserFromTenant(tenantId: string, userId: string): Promise<boolean> {
    const deleted = await this.db('tenant_users')
      .where({ tenant_id: tenantId, user_id: userId })
      .delete();

    if (deleted > 0) {
      await this.invalidateTenantUsersCache(tenantId);
      return true;
    }
    return false;
  }

  async getTenantUsers(tenantId: string): Promise<TenantUser[]> {
    const users = await this.db('tenant_users')
      .where('tenant_id', tenantId)
      .orderBy('created_at', 'desc');

    return users.map(u => this.mapTenantUserFromDb(u));
  }

  async getUserTenants(userId: string): Promise<TenantUser[]> {
    const tenantUsers = await this.db('tenant_users')
      .where('user_id', userId)
      .where('status', 'active');

    return tenantUsers.map(tu => this.mapTenantUserFromDb(tu));
  }

  // Cache Management
  private async getCachedTenant(id: string): Promise<Tenant | null> {
    try {
      const cached = await this.redis.get(`tenant:${id}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  private async cacheTenant(tenant: Tenant): Promise<void> {
    try {
      await this.redis.set(`tenant:${tenant.id}`, JSON.stringify(tenant), 300); // 5 minutes TTL
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  private async invalidateTenantCache(tenantId: string): Promise<void> {
    try {
      await Promise.all([
        this.redis.del(`tenant:${tenantId}`),
        this.redis.del(`tenant_users:${tenantId}`)
      ]);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  private async invalidateTenantUsersCache(tenantId: string): Promise<void> {
    try {
      await this.redis.del(`tenant_users:${tenantId}`);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  // Helper Methods
  private mapTenantFromDb(dbTenant: any): Tenant {
    return {
      id: dbTenant.id,
      name: dbTenant.name,
      domain: dbTenant.domain,
      status: dbTenant.status,
      settings: dbTenant.settings,
      subscriptionId: dbTenant.subscription_id,
      createdAt: dbTenant.created_at,
      updatedAt: dbTenant.updated_at
    };
  }

  private mapSubscriptionFromDb(dbSubscription: any): Subscription {
    return {
      id: dbSubscription.id,
      tenantId: dbSubscription.tenant_id,
      planId: dbSubscription.plan_id,
      status: dbSubscription.status,
      startDate: dbSubscription.start_date,
      endDate: dbSubscription.end_date,
      billingCycle: dbSubscription.billing_cycle,
      pricePerMonth: parseFloat(dbSubscription.price_per_month),
      features: dbSubscription.features,
      maxUsers: dbSubscription.max_users,
      createdAt: dbSubscription.created_at,
      updatedAt: dbSubscription.updated_at
    };
  }

  private mapTenantUserFromDb(dbTenantUser: any): TenantUser {
    return {
      id: dbTenantUser.id,
      tenantId: dbTenantUser.tenant_id,
      userId: dbTenantUser.user_id,
      role: dbTenantUser.role,
      status: dbTenantUser.status,
      invitedBy: dbTenantUser.invited_by,
      joinedAt: dbTenantUser.joined_at,
      createdAt: dbTenantUser.created_at,
      updatedAt: dbTenantUser.updated_at
    };
  }

  private getPlanPrice(planId: string): number {
    const plans: Record<string, number> = {
      'basic': 0,
      'professional': 29.99,
      'enterprise': 99.99
    };
    return plans[planId] || 0;
  }

  private getPlanFeatures(planId: string): string[] {
    const features: Record<string, string[]> = {
      'basic': ['basic_features', 'limited_users'],
      'professional': ['basic_features', 'advanced_features', 'api_access'],
      'enterprise': ['basic_features', 'advanced_features', 'api_access', 'custom_integration', 'priority_support']
    };
    return features[planId] || ['basic_features'];
  }

  private getPlanMaxUsers(planId: string): number {
    const maxUsers: Record<string, number> = {
      'basic': 10,
      'professional': 50,
      'enterprise': 500
    };
    return maxUsers[planId] || 10;
  }
}

export { TenantService };
