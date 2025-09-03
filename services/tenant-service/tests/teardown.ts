import { DatabaseService } from '../src/services/DatabaseService';
import { RedisService } from '../src/services/RedisService';

export default async function globalTeardown() {
  try {
    // Close DB connection if initialized
    const db = DatabaseService.getInstance();
    if (db) {
      try {
        await db.close();
        // eslint-disable-next-line no-console
        console.log('Test teardown: Database connection closed');
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error closing DB in teardown:', err);
      }
    }

    // Disconnect Redis if initialized
    const redis = RedisService.getInstance();
    if (redis) {
      try {
        await redis.disconnect();
        // eslint-disable-next-line no-console
        console.log('Test teardown: Redis disconnected');
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error disconnecting Redis in teardown:', err);
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Global teardown error:', error);
  }
}
