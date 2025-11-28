/**
 * Instancias de ApiClient configuradas por microservicio
 * Infrastructure layer - Clientes HTTP específicos para cada servicio
 */

import { ApiClient } from './client';

/**
 * Helper para obtener el token de acceso desde localStorage
 */
const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
};

/**
 * Cliente para Auth Service
 * Base URL: http://localhost:3100/auth (o NEXT_PUBLIC_AUTH_URL)
 * El gateway enruta /auth/* al auth-service (puerto 3001)
 */
export const authApi = new ApiClient(
  process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3100/auth',
  getAccessToken
);

/**
 * Cliente para Operations Service
 * Base URL: http://localhost:3100/ops (o NEXT_PUBLIC_OPS_URL)
 * El gateway enruta /ops/* al operations-service (puerto 3002)
 */
export const opsApi = new ApiClient(
  process.env.NEXT_PUBLIC_OPS_URL || 'http://localhost:3100/ops',
  getAccessToken
);

/**
 * Cliente para Tracking Service
 * Base URL: http://localhost:3000/track (o NEXT_PUBLIC_TRACKING_URL)
 * El gateway enruta /track/* al tracking-service (puerto 3003)
 */
export const trackingApi = new ApiClient(
  process.env.NEXT_PUBLIC_TRACKING_URL || 'http://localhost:3000/tracking',
  getAccessToken
);
