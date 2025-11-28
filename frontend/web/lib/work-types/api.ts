/**
 * Work Types API Service
 * Infrastructure layer - Servicio de API para tipos de trabajo
 */

import { opsApi } from '../api/services';

export interface WorkType {
  id: string;
  nombre: string;
  descripcion?: string;
  costoBase?: number;
  unidad?: string;
  activo?: boolean; // Puede no venir en listActive()
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    workOrders: number;
  };
}

export interface CreateWorkTypeDto {
  nombre: string;
  descripcion?: string;
  costoBase?: number;
  unidad?: string;
  activo?: boolean;
}

export interface UpdateWorkTypeDto {
  nombre?: string;
  descripcion?: string;
  costoBase?: number;
  unidad?: string;
  activo?: boolean;
}

/**
 * Obtener lista de tipos de trabajo activos
 * El endpoint /work-types solo devuelve tipos activos con campos limitados
 */
export async function fetchWorkTypes(activeOnly: boolean = true): Promise<WorkType[]> {
  const result = await opsApi.get<WorkType[]>('/work-types');
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Error al cargar tipos de trabajo');
  }
  
  const workTypes = Array.isArray(result.data) ? result.data : [result.data];
  
  // El endpoint ya devuelve solo activos, pero marcamos activo=true para consistencia
  return workTypes.map(wt => ({
    ...wt,
    activo: true, // El endpoint solo devuelve activos
  }));
}

/**
 * Obtener tipo de trabajo por ID (admin)
 */
export async function fetchWorkTypeById(id: string): Promise<WorkType> {
  const result = await opsApi.get<WorkType>(`/admin/work-types/${id}`);
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Error al cargar tipo de trabajo');
  }
  return result.data;
}

/**
 * Crear nuevo tipo de trabajo (admin)
 */
export async function createWorkType(data: CreateWorkTypeDto): Promise<WorkType> {
  const result = await opsApi.post<WorkType>('/admin/work-types', data);
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Error al crear tipo de trabajo');
  }
  return result.data;
}

/**
 * Actualizar tipo de trabajo (admin)
 */
export async function updateWorkType(id: string, data: UpdateWorkTypeDto): Promise<WorkType> {
  const result = await opsApi.put<WorkType>(`/admin/work-types/${id}`, data);
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Error al actualizar tipo de trabajo');
  }
  return result.data;
}

/**
 * Eliminar tipo de trabajo (admin)
 */
export async function deleteWorkType(id: string): Promise<void> {
  const result = await opsApi.delete(`/admin/work-types/${id}`);
  if (!result.success) {
    throw new Error(result.error || 'Error al eliminar tipo de trabajo');
  }
}
