import knex, { Knex } from 'knex';
import config from '../knexfile';

const env = process.env.NODE_ENV || 'development';
const knexConfig = (config as any)[env] as Knex.Config;

const db = knex(knexConfig);

export function getKnex(): Knex {
  return db;
}

export default db;
