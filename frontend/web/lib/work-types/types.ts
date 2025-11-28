/**
 * WorkType Types
 * Domain layer - Tipos del dominio de gestión de tipos de trabajo
 * Estructura replicable desde usuarios
 */

export interface WorkType {
  id: string;
  nombre: string;
  descripcion?: string;
  costoBase?: number;
  unidad?: string; // "por visita", "por hora", etc.
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkTypeFormData {
  nombre: string;
  descripcion?: string;
  costoBase?: number;
  unidad?: string;
  activo: boolean;
}

