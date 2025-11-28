/**
 * Configuración de variables de entorno
 */
import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3003', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },

  // Events
  events: {
    channel: process.env.TRACKING_EVENT_CHANNEL || 'work_order_events',
  },

  // WebSocket
  ws: {
    pingInterval: parseInt(process.env.WS_PING_INTERVAL || '30000', 10), // 30s
    pingTimeout: parseInt(process.env.WS_PING_TIMEOUT || '60000', 10), // 60s
  },
} as const;

