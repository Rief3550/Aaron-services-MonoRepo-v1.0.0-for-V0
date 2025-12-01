import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

import { TrackingService } from '../ping/tracking.service';
import { WsGateway } from '../ws/ws.gateway';

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

export interface LocationUpdateEvent {
  orderId: string;
  crewId: string;
  lat: number;
  lng: number;
  source?: string;
  timestamp: string;
}

type IncomingTrackingEvent =
  | { type: 'ORDER_EN_CAMINO'; data: WorkOrderEnCaminoEvent }
  | { type: 'ORDER_STATUS'; data: WorkOrderStatusEvent }
  | { type: 'LOCATION_UPDATE'; data: LocationUpdateEvent }
  | WorkOrderEnCaminoEvent;

@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis | null = null;
  private subscriber: Redis | null = null;
  private readonly logger = new Logger(EventsService.name);
  private readonly channel: string;

  constructor(
    private configService: ConfigService,
    private wsGateway: WsGateway,
    private trackingService: TrackingService,
  ) {
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
      this.logger.log(`Using explicit REDIS_HOST: ${redisHost}:${redisPort || 6379}`);
    } else if (redisUrlEnv) {
      connectionOptions = redisUrlEnv;
      this.logger.log(`Using REDIS_URL: ${redisUrlEnv}`);
    } else {
      connectionOptions = {
        host: 'localhost',
        port: 6379,
      };
      this.logger.log(`Using default localhost Redis`);
    }

    try {
      // @ts-ignore
      this.redis = new Redis(connectionOptions);
      // @ts-ignore
      this.subscriber = new Redis(connectionOptions);

      this.redis.on('connect', () => {
        this.logger.log('Connected to Redis');
      });

      this.subscriber.on('connect', () => {
        this.logger.log('Subscriber connected to Redis');
      });

      this.redis.on('error', (err) => {
        this.logger.error('Redis error', err);
      });

      this.subscriber.on('error', (err) => {
        this.logger.error('Subscriber error', err);
      });

      // Subscribe to tracking events
      await this.subscribeToTrackingEvents();
    } catch (error) {
      this.logger.error('Failed to connect to Redis', error);
    }
  }

  async onModuleDestroy() {
    if (this.subscriber) {
      await this.subscriber.quit();
      this.logger.log('Subscriber disconnected from Redis');
    }
    if (this.redis) {
      await this.redis.quit();
      this.logger.log('Disconnected from Redis');
    }
  }

  async subscribeToTrackingEvents() {
    if (!this.subscriber) {
      this.logger.warn('Redis subscriber not initialized');
      return;
    }

    try {
      await this.subscriber.subscribe(this.channel);

      this.subscriber.on('message', (channel, message) => {
        if (channel !== this.channel) return;

        try {
          const parsed: IncomingTrackingEvent = JSON.parse(message);

          if (this.isTypedEvent(parsed)) {
            if (!parsed.data.orderId) {
              this.logger.warn(`Invalid ${parsed.type} event: missing orderId`);
              return;
            }

            switch (parsed.type) {
              case 'ORDER_EN_CAMINO':
                this.handleOrderEnCaminoEvent(parsed.data);
                return;
              case 'ORDER_STATUS':
                this.handleOrderStatusEvent(parsed.data);
                return;
              case 'LOCATION_UPDATE':
                this.handleLocationUpdateEvent(parsed.data);
                return;
              default:
                this.logger.warn(`Unknown tracking event type: ${(parsed as any).type}`);
                return;
            }
          }

          // Legacy payload without type field
          const legacy = parsed as WorkOrderEnCaminoEvent;
          if (!legacy.orderId) {
            this.logger.warn('Invalid legacy ORDER_EN_CAMINO event: missing orderId');
            return;
          }
          this.handleOrderEnCaminoEvent(legacy);
        } catch (error) {
          this.logger.error('Error parsing tracking event', error);
        }
      });

      this.logger.log(`Subscribed to Redis channel: ${this.channel}`);
    } catch (error) {
      this.logger.error('Failed to subscribe to Redis channel', error);
    }
  }

  private handleOrderEnCaminoEvent(event: WorkOrderEnCaminoEvent) {
    this.logger.log(`Received ORDER_EN_CAMINO event: orderId=${event.orderId}, crewId=${event.crewId}`);

    if (!event.targetLocation?.lat || !event.targetLocation?.lng) {
      this.logger.warn('ORDER_EN_CAMINO without targetLocation lat/lng. Destination should be property coords.');
    }

    // Suggest/prepare rooms
    const orderRoom = `order:${event.orderId}`;
    this.wsGateway.suggestRoom(orderRoom);

    if (event.crewId) {
      const crewRoom = `crew:${event.crewId}`;
      this.wsGateway.suggestRoom(crewRoom);
    }

    // Broadcast event to rooms
    this.wsGateway.broadcastToRoom(orderRoom, 'order_en_camino', {
      orderId: event.orderId,
      crewId: event.crewId,
      targetLocation: event.targetLocation,
      timestamp: event.timestamp,
    });

    if (event.crewId) {
      this.wsGateway.broadcastToRoom(`crew:${event.crewId}`, 'order_en_camino', {
        orderId: event.orderId,
        crewId: event.crewId,
        targetLocation: event.targetLocation,
        timestamp: event.timestamp,
      });
    }
  }

  private handleOrderStatusEvent(event: WorkOrderStatusEvent) {
    this.logger.log(`Received ORDER_STATUS event: orderId=${event.orderId}, state=${event.state}`);

    const orderRoom = `order:${event.orderId}`;
    this.wsGateway.suggestRoom(orderRoom);

    if (event.crewId) {
      this.wsGateway.suggestRoom(`crew:${event.crewId}`);
    }

    const payload = {
      orderId: event.orderId,
      crewId: event.crewId,
      state: event.state,
      note: event.note,
      timestamp: event.timestamp,
    };

    this.wsGateway.broadcastToRoom(orderRoom, 'order_status', payload);
    if (event.crewId) {
      this.wsGateway.broadcastToRoom(`crew:${event.crewId}`, 'order_status', payload);
    }
  }

  private async handleLocationUpdateEvent(event: LocationUpdateEvent) {
    this.logger.log(`Received LOCATION_UPDATE event: orderId=${event.orderId}, crewId=${event.crewId}`);

    await this.trackingService.savePing({
      crewId: event.crewId,
      orderId: event.orderId,
      lat: event.lat,
      lng: event.lng,
      source: (event.source || 'operations_event') as any, // Casteo temporal para permitir operations_event
    });

    const payload = {
      orderId: event.orderId,
      crewId: event.crewId,
      lat: event.lat,
      lng: event.lng,
      timestamp: event.timestamp,
    };

    this.wsGateway.broadcastToRoom(`crew:${event.crewId}`, 'location_update', payload);
    this.wsGateway.broadcastToRoom(`order:${event.orderId}`, 'location_update', payload);
  }

  private isTypedEvent(event: IncomingTrackingEvent): event is Extract<IncomingTrackingEvent, { type: string }> {
    return typeof (event as any)?.type === 'string' && typeof (event as any)?.data === 'object';
  }
}
