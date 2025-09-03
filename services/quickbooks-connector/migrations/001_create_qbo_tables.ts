import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('qbo_tokens', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('realm_id').notNullable();
    table.string('access_token').notNullable();
    table.string('refresh_token').notNullable();
    table.integer('expires_in').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('qbo_tenant_mappings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('realm_id').notNullable().unique();
    table.uuid('tenant_id').notNullable();
    table.string('company_name').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('qbo_tenant_mappings');
  await knex.schema.dropTableIfExists('qbo_tokens');
}
