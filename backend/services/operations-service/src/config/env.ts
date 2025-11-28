/**
 * Configuración de variables de entorno
 */
import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3002', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },

  // Tracking Service (para eventos)
  trackingService: {
    url: process.env.TRACKING_SERVICE_URL || 'http://tracking-service:3003',
    eventChannel: process.env.TRACKING_EVENT_CHANNEL || 'work_order_events',
  },
} as const;

