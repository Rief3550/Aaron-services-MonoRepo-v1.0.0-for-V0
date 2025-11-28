/**
 * Plan Types
 * Domain layer - Tipos del dominio de gestión de planes
 * Estructura replicable desde usuarios
 */

export interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  billingPeriod?: string;
  active: boolean;
  restrictions?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  workTypes?: Array<{ id: string; nombre: string }>;
}

export interface PlanFormData {
  name: string;
  description?: string;
  price: number;
  currency: string;
  billingPeriod?: string;
  active: boolean;
  restrictions?: Record<string, unknown>;
}

