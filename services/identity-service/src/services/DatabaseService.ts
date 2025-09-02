import knex, { Knex } from 'knex';
import * as dotenv from 'dotenv';

dotenv.config();

export class DatabaseService {
  private static instance: Knex | null = null;

  public static async initialize(): Promise<void> {
    try {
      const dbConfig: Knex.Config = {
        client: 'postgresql',
        connection: process.env.DATABASE_URL || {
          host: 'localhost',
          port: 5432,
          user: 'nexus',
          password: 'nexus_dev_password',
          database: 'nexus_identity'
        },
        pool: {
          min: 2,
          max: 10
        }
      };
      
      this.instance = knex(dbConfig);
      
      // Test connection
      await this.instance.raw('SELECT 1');
      
    } catch (error) {
      throw new Error(`Database initialization failed: ${error}`);
    }
  }

  public static getInstance(): Knex {
    if (!this.instance) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.instance;
  }

  public static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.destroy();
      this.instance = null;
    }
  }

  // Helper method for transactions
  public static async transaction<T>(
    callback: (trx: Knex.Transaction) => Promise<T>
  ): Promise<T> {
    const db = this.getInstance();
    return db.transaction(callback);
  }
}
