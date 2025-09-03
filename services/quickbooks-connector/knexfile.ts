import type { Knex } from 'knex';
import { config } from 'dotenv';

config();

const connection: Knex.PgConnectionConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'nexus',
  password: process.env.DB_PASSWORD || 'nexus_dev_password',
  database: process.env.DB_NAME || 'nexus_qbo_connector'
};

const configKnex: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection,
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    }
  }
};

export default configKnex;
