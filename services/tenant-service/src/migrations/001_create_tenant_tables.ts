import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create tenants table
  await knex.schema.createTable('tenants', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.string('domain').unique().notNullable();
    table.enum('status', ['active', 'suspended', 'pending']).defaultTo('pending');
    table.jsonb('settings').notNullable().defaultTo('{}');
    table.uuid('subscription_id').nullable();
    table.timestamps(true, true);
    
    table.index(['domain']);
    table.index(['status']);
  });

  // Create subscriptions table
  await knex.schema.createTable('subscriptions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.string('plan_id').notNullable();
    table.enum('status', ['active', 'cancelled', 'suspended', 'trial']).defaultTo('trial');
    table.timestamp('start_date').notNullable().defaultTo(knex.fn.now());
    table.timestamp('end_date').nullable();
    table.enum('billing_cycle', ['monthly', 'yearly']).defaultTo('monthly');
    table.decimal('price_per_month', 10, 2).notNullable().defaultTo(0);
    table.jsonb('features').notNullable().defaultTo('[]');
    table.integer('max_users').notNullable().defaultTo(50);
    table.timestamps(true, true);
    
    table.index(['tenant_id']);
    table.index(['status']);
    table.index(['plan_id']);
  });

  // Create tenant_users table
  await knex.schema.createTable('tenant_users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.uuid('user_id').notNullable(); // Reference to identity service
    table.string('role').notNullable();
    table.enum('status', ['active', 'inactive', 'pending']).defaultTo('pending');
    table.uuid('invited_by').nullable();
    table.timestamp('joined_at').nullable();
    table.timestamps(true, true);
    
    table.unique(['tenant_id', 'user_id']);
    table.index(['tenant_id']);
    table.index(['user_id']);
    table.index(['status']);
  });

  // Add foreign key constraint for subscription_id in tenants
  await knex.schema.alterTable('tenants', (table) => {
    table.foreign('subscription_id').references('id').inTable('subscriptions').onDelete('SET NULL');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('tenant_users');
  await knex.schema.dropTableIfExists('subscriptions');
  await knex.schema.dropTableIfExists('tenants');
}
