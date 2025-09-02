import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data
  await knex('tenant_users').del();
  await knex('subscriptions').del();
  await knex('tenants').del();

  const now = new Date();

  // Insert sample tenants
  const tenants = [
    {
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      name: 'Acme Corporation',
      domain: 'acme',
      status: 'active',
      settings: JSON.stringify({
        maxUsers: 100,
        features: ['basic_features', 'advanced_features'],
        timezone: 'Asia/Colombo',
        currency: 'LKR',
        dateFormat: 'DD/MM/YYYY',
        language: 'en'
      }),
      created_at: now,
      updated_at: now
    },
    {
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d480',
      name: 'TechStart Solutions',
      domain: 'techstart',
      status: 'active',
      settings: JSON.stringify({
        maxUsers: 25,
        features: ['basic_features'],
        timezone: 'Asia/Colombo',
        currency: 'LKR',
        dateFormat: 'DD/MM/YYYY',
        language: 'en'
      }),
      created_at: now,
      updated_at: now
    }
  ];

  await knex('tenants').insert(tenants);

  // Insert sample subscriptions
  const subscriptions = [
    {
      id: 'a47ac10b-58cc-4372-a567-0e02b2c3d479',
      tenant_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      plan_id: 'enterprise',
      status: 'active',
      start_date: now,
      end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      billing_cycle: 'yearly',
      price_per_month: 99.99,
      features: JSON.stringify(['basic_features', 'advanced_features', 'api_access', 'custom_integration']),
      max_users: 500,
      created_at: now,
      updated_at: now
    },
    {
      id: 'a47ac10b-58cc-4372-a567-0e02b2c3d480',
      tenant_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d480',
      plan_id: 'professional',
      status: 'trial',
      start_date: now,
      end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
      billing_cycle: 'monthly',
      price_per_month: 29.99,
      features: JSON.stringify(['basic_features', 'advanced_features', 'api_access']),
      max_users: 50,
      created_at: now,
      updated_at: now
    }
  ];

  await knex('subscriptions').insert(subscriptions);

  // Update tenants with subscription IDs
  await knex('tenants')
    .where('id', 'f47ac10b-58cc-4372-a567-0e02b2c3d479')
    .update({ subscription_id: 'a47ac10b-58cc-4372-a567-0e02b2c3d479' });

  await knex('tenants')
    .where('id', 'f47ac10b-58cc-4372-a567-0e02b2c3d480')
    .update({ subscription_id: 'a47ac10b-58cc-4372-a567-0e02b2c3d480' });

  // Insert sample tenant users (assuming these user IDs exist in identity service)
  const tenantUsers = [
    {
      id: 'b47ac10b-58cc-4372-a567-0e02b2c3d479',
      tenant_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      user_id: '123e4567-e89b-12d3-a456-426614174000', // Admin user from identity service
      role: 'admin',
      status: 'active',
      joined_at: now,
      created_at: now,
      updated_at: now
    },
    {
      id: 'b47ac10b-58cc-4372-a567-0e02b2c3d480',
      tenant_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d480',
      user_id: '123e4567-e89b-12d3-a456-426614174000', // Same admin user
      role: 'admin',
      status: 'active',
      joined_at: now,
      created_at: now,
      updated_at: now
    }
  ];

  await knex('tenant_users').insert(tenantUsers);
}
