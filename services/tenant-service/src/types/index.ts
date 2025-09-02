export interface Tenant {
  id: string;
  name: string;
  domain: string;
  status: 'active' | 'suspended' | 'pending';
  settings: TenantSettings;
  subscriptionId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantSettings {
  maxUsers: number;
  features: string[];
  timezone: string;
  currency: string;
  dateFormat: string;
  language: string;
}

export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'suspended' | 'trial';
  startDate: Date;
  endDate: Date | null;
  billingCycle: 'monthly' | 'yearly';
  pricePerMonth: number;
  features: string[];
  maxUsers: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantUser {
  id: string;
  tenantId: string;
  userId: string; // Reference to identity service user
  role: string;
  status: 'active' | 'inactive' | 'pending';
  invitedBy: string | null;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTenantRequest {
  name: string;
  domain: string;
  adminEmail: string;
  planId: string;
  settings?: Partial<TenantSettings>;
}

export interface UpdateTenantRequest {
  name?: string;
  domain?: string;
  status?: 'active' | 'suspended';
  settings?: Partial<TenantSettings>;
}

export interface InviteUserRequest {
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

export interface TenantContext {
  tenantId: string;
  userId: string;
  userRole: string;
  permissions: string[];
}
