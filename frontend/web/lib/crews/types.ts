/**
 * Crew Types
 * Domain layer - Tipos del dominio de gestión de cuadrillas
 * Estructura replicable desde usuarios
 */

export interface CrewMember {
  id?: string;
  name?: string;
  email?: string;
  userId?: string;
  user?: { id?: string; fullName?: string; email?: string };
}

export interface Crew {
  id: string;
  name: string;
  members?: Array<CrewMember | string>;
  state: string; // 'desocupado', 'ocupado', etc.
  progress?: number; // 0-100
  zona?: string;
  notes?: string;
  availability?: string; // 'AVAILABLE', 'BUSY', 'OFFLINE'
  lat?: number;
  lng?: number;
  lastLocationAt?: string;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    workOrders: number;
  };
  workOrders?: Array<{
    id: string;
    titulo?: string;
    serviceCategory: string;
    state: string;
    address: string;
    createdAt: string;
    completedAt?: string;
    client?: {
      nombreCompleto?: string;
      razonSocial?: string;
    };
    property?: {
      alias?: string;
      address?: string;
    };
    workType?: {
      nombre?: string;
    };
  }>;
}

export interface CrewFormData {
  name: string;
  members: string[];
  state: string;
  progress?: number;
  zona?: string;
  notes?: string;
  availability?: string;
}
