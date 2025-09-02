import knex, { Knex } from 'knex';
import { CONFIG } from '../config';

class DatabaseService {
  private static instance: DatabaseService;
  private knex: Knex;

  private constructor() {
    this.knex = knex({
      client: 'postgresql',
      connection: {
        host: CONFIG.DB_HOST,
        port: CONFIG.DB_PORT,
        user: CONFIG.DB_USER,
        password: CONFIG.DB_PASSWORD,
        database: CONFIG.DB_NAME,
      },
      pool: {
        min: 2,
        max: 10,
      },
      migrations: {
        directory: './src/migrations',
        extension: 'ts',
      },
      seeds: {
        directory: './src/seeds',
        extension: 'ts',
      },
    });
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public getKnex(): Knex {
    return this.knex;
  }

  public async testConnection(): Promise<boolean> {
    try {
      await this.knex.raw('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }

  public async close(): Promise<void> {
    await this.knex.destroy();
  }
}

export { DatabaseService };
