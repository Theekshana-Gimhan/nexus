import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

export class RedisService {
  private static client: RedisClientType | null = null;

  public static async initialize(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = createClient({
        url: redisUrl
      });

      this.client.on('error', (error) => {
        logger.error('Redis error:', error);
      });

      this.client.on('connect', () => {
        logger.info('Redis connected');
      });

      await this.client.connect();
      
    } catch (error) {
      throw new Error(`Redis initialization failed: ${error}`);
    }
  }

  public static getClient() {
    if (!this.client) {
      throw new Error('Redis not initialized. Call initialize() first.');
    }
    return this.client;
  }

  public static async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  // Helper methods
  public static async set(key: string, value: string, ttl?: number): Promise<void> {
    const client = this.getClient();
    if (ttl) {
      await client.setEx(key, ttl, value);
    } else {
      await client.set(key, value);
    }
  }

  public static async get(key: string): Promise<string | null> {
    const client = this.getClient();
    return await client.get(key);
  }

  public static async del(key: string): Promise<void> {
    const client = this.getClient();
    await client.del(key);
  }

  public static async exists(key: string): Promise<boolean> {
    const client = this.getClient();
    const result = await client.exists(key);
    return result === 1;
  }
}
