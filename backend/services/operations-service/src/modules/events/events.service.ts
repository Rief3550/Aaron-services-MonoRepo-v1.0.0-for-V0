import { Logger } from '@aaron/common';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

export interface WorkOrderEnCaminoEvent {
  orderId: string;
  crewId: string | null;
  targetLocation: {
    address: string;
    lat?: number;
    lng?: number;
  };
  timestamp: string;
}

export interface WorkOrderStatusEvent {
  orderId: string;
  crewId: string | null;
  state: string;
  note?: string;
  timestamp: string;
}

export interface WorkOrderLocationEvent {
  orderId: string;
  crewId: string;
  lat: number;
  lng: number;
  source?: string;
  sessionId?: string;
  timestamp: string;
}

type TrackingEvent =
  | { type: 'ORDER_EN_CAMINO'; data: WorkOrderEnCaminoEvent }
  | { type: 'ORDER_STATUS'; data: WorkOrderStatusEvent }
  | { type: 'LOCATION_UPDATE'; data: WorkOrderLocationEvent };

@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis | null = null;
  private readonly logger = new Logger('EventsService');
  private readonly channel: string;

  constructor(private configService: ConfigService) {
    this.channel = this.configService.get<string>('TRACKING_EVENT_CHANNEL') || 'work_order_events';
  }

  async onModuleInit() {
    const redisHost = this.configService.get<string>('REDIS_HOST');
    const redisPort = this.configService.get<number>('REDIS_PORT');
    const redisUrlEnv = this.configService.get<string>('REDIS_URL');

    let connectionOptions: RedisOptions | string;

    if (redisHost && redisHost !== 'localhost') {
      connectionOptions = {
        host: redisHost,
        port: redisPort || 6379,
      };
      this.logger.info(`Using explicit REDIS_HOST: ${redisHost}:${redisPort || 6379}`);
    } else if (redisUrlEnv) {
      connectionOptions = redisUrlEnv;
      this.logger.info(`Using REDIS_URL: ${redisUrlEnv}`);
    } else {
      connectionOptions = {
        host: 'localhost',
        port: 6379,
      };
      this.logger.info(`Using default localhost Redis`);
    }
    
    try {
      // @ts-ignore
      this.redis = new Redis(connectionOptions);
      
      this.redis.on('connect', () => {
        this.logger.info('Connected to Redis');
      });

      this.redis.on('error', (err) => {
        this.logger.error('Redis error', err);
      });
    } catch (error) {
      this.logger.error('Failed to connect to Redis', error);
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
      this.logger.info('Disconnected from Redis');
    }
  }

  async publishWorkOrderEnCamino(event: WorkOrderEnCaminoEvent): Promise<void> {
    return this.publishTrackingEvent({
      type: 'ORDER_EN_CAMINO',
      data: event,
    });
  }

  async publishWorkOrderStatus(event: WorkOrderStatusEvent): Promise<void> {
    return this.publishTrackingEvent({
      type: 'ORDER_STATUS',
      data: event,
    });
  }

  async publishLocationUpdate(event: WorkOrderLocationEvent): Promise<void> {
    return this.publishTrackingEvent({
      type: 'LOCATION_UPDATE',
      data: event,
    });
  }

  private async publishTrackingEvent(event: TrackingEvent): Promise<void> {
    try {
      if (!this.redis) {
        this.logger.warn('Redis not connected, skipping event publication');
        return;
      }

      const message = JSON.stringify(event);
      await this.redis.publish(this.channel, message);
      
      this.logger.info(`Published ${event.type} event to ${this.channel}:`, event.data);
    } catch (error) {
      this.logger.error('Failed to publish tracking event', error);
      // Fail gracefully - don't throw error
    }
  }
}
