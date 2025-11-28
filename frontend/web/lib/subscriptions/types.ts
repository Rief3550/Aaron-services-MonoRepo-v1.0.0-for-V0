/**
 * Subscription Types
 * Domain layer - Tipos del dominio de gestión de suscripciones
 * Estructura replicable desde usuarios
 */

export type SubscriptionStatus = 'ACTIVE' | 'REVISION' | 'GRACE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELED' | 'PAUSED';

export interface Subscription {
  id: string;
  userId: string;
  clientId?: string;
  propertyId?: string;
  planId: string;
  status: SubscriptionStatus;
  fechaInicio: string;
  fechaFin?: string;
  montoMensual?: number;
  moneda: string;
  cicloFacturacion?: string;
  diaCobro?: number;
  startDate: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  graceUntil?: string;
  nextChargeAt?: string;
  billingDay?: number;
  suspendedAt?: string;
  canceledAt?: string;
  cancelReason?: string;
  planSnapshot?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  // Relaciones (cuando se incluyan)
  client?: {
    id: string;
    nombreCompleto?: string;
    email: string;
  };
  plan?: {
    id: string;
    name: string;
    price: number;
    currency: string;
  };
  property?: {
    id: string;
    address: string;
    alias?: string;
  };
}

export interface SubscriptionFormData {
  userId: string;
  planId: string;
  propertyId?: string;
  billingDay?: number;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
}

