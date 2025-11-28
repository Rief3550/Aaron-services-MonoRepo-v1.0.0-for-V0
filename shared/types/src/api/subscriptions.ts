/**
 * Tipos compartidos para suscripciones
 */

export interface SubscriptionResponse {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  nextCharge: string;
  daysLeft: number;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionStatus = 
  | 'active' 
  | 'cancelled' 
  | 'expired' 
  | 'pending';

export interface PlanResponse {
  id: string;
  name: string;
  price: number;
  currency: string;
  active: boolean;
}

