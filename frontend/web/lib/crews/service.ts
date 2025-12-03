/**
 * Crews API Service
 * Infrastructure layer - Servicio de API para gestión de cuadrillas
 * Estructura replicable desde usuarios
 */

import { opsApi } from '../api/services';
import type { Crew, CrewMember } from './types';
export type { Crew };

export interface CreateCrewDto {
  name: string;
  members?: Array<CrewMember | string>;
  zona?: string;
  notes?: string;
  availability?: string;
}

export interface UpdateCrewDto {
  name?: string;
  members?: Array<CrewMember | string>;
  state?: string;
  progress?: number;
  zona?: string;
  notes?: string;
  availability?: string;
}

/**
 * Obtener lista de cuadrillas
 */
export async function fetchCrews(filters?: { state?: string }): Promise<Crew[]> {
  const query = filters?.state ? `?state=${filters.state}` : '';
  const result = await opsApi.get<Crew[]>(`/crews${query}`);
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Error al cargar cuadrillas');
  }
  return Array.isArray(result.data) ? result.data : [result.data];
}

/**
 * Obtener cuadrilla por ID
 */
export async function fetchCrewById(id: string): Promise<Crew> {
  const result = await opsApi.get<Crew>(`/crews/${id}`);
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Error al cargar cuadrilla');
  }
  return result.data;
}

/**
 * Crear nueva cuadrilla
 */
export async function createCrew(data: CreateCrewDto): Promise<Crew> {
  const result = await opsApi.post<Crew>('/crews', data);
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Error al crear cuadrilla');
  }
  return result.data;
}

/**
 * Actualizar cuadrilla
 */
export async function updateCrew(id: string, data: UpdateCrewDto): Promise<Crew> {
  const result = await opsApi.patch<Crew>(`/crews/${id}`, data);
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Error al actualizar cuadrilla');
  }
  return result.data;
}

/**
 * Cambiar estado de cuadrilla
 */
export async function updateCrewState(
  id: string,
  state: string,
  progress?: number
): Promise<Crew> {
  const result = await opsApi.patch<Crew>(`/crews/${id}/state`, { state, progress });
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Error al actualizar estado de cuadrilla');
  }
  return result.data;
}

/**
 * Eliminar cuadrilla (si el backend lo soporta)
 */
export async function deleteCrew(id: string): Promise<void> {
  // Nota: Verificar si el backend tiene endpoint DELETE
  // Por ahora asumimos que no, pero dejamos la función por consistencia
  throw new Error('Delete crew not implemented in backend');
}
