/**
 * Eventos para tracking-service
 * Publica eventos cuando una orden de trabajo cambia de estado a "en_camino"
 */
import { Logger } from '@aaron/common';
import Redis from 'ioredis';

import { config } from '../config/env';

const logger = new Logger('TrackingEvent');

let redis: Redis | null = null;

export function initRedis() {
  if (!redis) {
    redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
    });

    redis.on('connect', () => {
      logger.info('Connected to Redis');
    });

    redis.on('error', (err) => {
      logger.error('Redis error', err);
    });
  }
  return redis;
}

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

/**
 * Publica evento cuando una orden pasa a estado "en_camino"
 */
export async function publishWorkOrderEnCamino(event: WorkOrderEnCaminoEvent): Promise<void> {
  try {
    if (!redis) {
      initRedis();
    }

    const channel = config.trackingService.eventChannel;
    const message = JSON.stringify(event);

    await redis!.publish(channel, message);
    
    logger.info(`Published event to ${channel}:`, event);
  } catch (error) {
    logger.error('Failed to publish tracking event', error);
    // No lanzar error, solo loggear (fail gracefully)
  }
}

/**
 * Envía evento vía HTTP al tracking-service (alternativa a Redis pub/sub)
 */
export async function sendTrackingEventHttp(event: WorkOrderEnCaminoEvent): Promise<void> {
  try {
    const response = await fetch(`${config.trackingService.url}/events/work-order-en-camino`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    logger.info('Sent tracking event via HTTP:', event);
  } catch (error) {
    logger.error('Failed to send tracking event via HTTP', error);
    // No lanzar error, solo loggear
  }
}

