/**
 * Users API Service
 * Infrastructure layer - Servicio de API para gestión de usuarios
 * Adaptado a nuestro sistema de microservicios
 * 
 * Estructura replicable para otros CRUDs:
 * - Cada CRUD tiene su propio api.ts en lib/{domain}/
 * - Usa el mismo patrón: funciones async que retornan tipos del dominio
 * - Maneja errores de forma consistente
 */

import type { User } from './types';
export type { User };

export interface CreateUserDto {
  email: string;
  fullName: string;
  password?: string;
  phone?: string;
  zone?: string;
  roleIds?: string[];
}

export interface UpdateUserDto {
  email?: string;
  fullName?: string;
  password?: string;
  phone?: string;
  zone?: string;
  roleIds?: string[];
}

/**
 * Helper para hacer requests al gateway (usuarios están en /users, no en /auth/users)
 */
async function gatewayRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3000/auth';
  const gatewayBase = baseUrl.replace('/auth', '');
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${gatewayBase}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ 
      message: `HTTP ${response.status}: ${response.statusText}` 
    }));
    throw new Error(error.message || 'Error en la petición');
  }

  const result = await response.json();
  
  // El backend retorna { success: true, data: T }
  if (result && typeof result === 'object' && 'data' in result) {
    return result.data;
  }
  
  // Fallback: retornar directamente si no tiene el formato esperado
  return result;
}

/**
 * Obtener lista de usuarios (solo ADMIN)
 * Nota: Los usuarios están en /users, no en /auth/users
 * Necesitamos acceder directamente al gateway
 */
/**
 * Obtener lista de usuarios (solo ADMIN)
 */
export async function fetchUsers(): Promise<User[]> {
  const users = await gatewayRequest<User[]>('/users');
  return Array.isArray(users) ? users : [users];
}

/**
 * Obtener usuario por ID (solo ADMIN)
 */
export async function fetchUserById(id: string): Promise<User> {
  return gatewayRequest<User>(`/users/${id}`);
}

/**
 * Crear nuevo usuario (solo ADMIN)
 */
export async function createUser(data: CreateUserDto): Promise<User> {
  return gatewayRequest<User>('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Actualizar usuario (solo ADMIN)
 */
export async function updateUser(id: string, data: UpdateUserDto): Promise<User> {
  return gatewayRequest<User>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Eliminar usuario (solo ADMIN)
 */
export async function deleteUser(id: string): Promise<void> {
  await gatewayRequest(`/users/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Obtener roles disponibles
 */
export async function fetchRoles(): Promise<Array<{ id: string; name: string }>> {
  const roles = await gatewayRequest<Array<{ id: string; name: string }>>('/roles');
  return Array.isArray(roles) ? roles : [roles];
}

