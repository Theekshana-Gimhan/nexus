import knex, { Knex } from 'knex';

const env = process.env.NODE_ENV || 'development';

const knexConfig: Knex.Config = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'nexus',
    password: process.env.DB_PASSWORD || 'nexus_dev_password',
    database: process.env.DB_NAME || 'nexus_qbo_connector'
  },
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations'
  }
};

const db = knex(knexConfig);

export function getKnex(): Knex {
  return db;
}

export default db;
