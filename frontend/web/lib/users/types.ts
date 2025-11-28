/**
 * User Types
 * Domain layer - Tipos del dominio de gestión de usuarios
 * Adaptados a la estructura del backend real
 */

export interface User {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  zone?: string;
  roles: Array<{ id: string; name: string }>;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  isEmailVerified?: boolean;
}

export interface UserFormData {
  email: string;
  fullName: string;
  password?: string;
  phone?: string;
  zone?: string;
  roleIds: string[];
}

export interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

