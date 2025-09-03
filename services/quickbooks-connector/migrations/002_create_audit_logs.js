exports.up = function(knex) {
  return knex.schema.createTable('audit_logs', function(table) {
    table.increments('id').primary();
    table.string('actor_id').notNullable();
    table.string('actor_type').notNullable().defaultTo('service');
    table.string('action').notNullable();
    table.jsonb('payload');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('audit_logs');
};
