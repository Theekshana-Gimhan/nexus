import { logger } from '../utils/logger';

export class MessageBrokerService {
  private static connection: any = null;
  private static channel: any = null;

  public static async initialize(): Promise<void> {
    try {
      // Dynamic import to avoid type issues for now
      const amqp = await import('amqplib');
      const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
      
      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      // Setup exchanges
      await this.channel.assertExchange('nexus.events', 'topic', { durable: true });

      logger.info('Message broker connected');
      
    } catch (error) {
      logger.warn('Message broker initialization failed, continuing without it:', error);
      // Don't throw error for now, as RabbitMQ might not be available in dev
    }
  }

  public static getChannel(): any {
    if (!this.channel) {
      throw new Error('Message broker not initialized. Call initialize() first.');
    }
    return this.channel;
  }

  public static async disconnect(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
      this.channel = null;
    }
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }

  // Helper method to publish events
  public static async publishEvent(
    routingKey: string, 
    data: any, 
    options?: any
  ): Promise<void> {
    if (!this.channel) {
      logger.warn('Message broker not available, skipping event publish');
      return;
    }

    const channel = this.getChannel();
    const message = Buffer.from(JSON.stringify(data));
    
    await channel.publish('nexus.events', routingKey, message, {
      persistent: true,
      timestamp: Date.now(),
      ...options
    });

    logger.info('Event published', { routingKey, data });
  }

  // Helper method to subscribe to events
  public static async subscribeToEvents(
    pattern: string,
    callback: (data: any) => Promise<void>
  ): Promise<void> {
    if (!this.channel) {
      logger.warn('Message broker not available, skipping event subscription');
      return;
    }

    const channel = this.getChannel();
    
    const queue = await channel.assertQueue('', { exclusive: true });
    await channel.bindQueue(queue.queue, 'nexus.events', pattern);

    await channel.consume(queue.queue, async (msg: any) => {
      if (msg) {
        try {
          const data = JSON.parse(msg.content.toString());
          await callback(data);
          channel.ack(msg);
        } catch (error) {
          logger.error('Error processing message:', error);
          channel.nack(msg, false, false);
        }
      }
    });

    logger.info('Subscribed to events', { pattern });
  }
}
