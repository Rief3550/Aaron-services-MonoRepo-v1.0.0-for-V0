/**
 * User Form Component
 * Presentation layer - Formulario de creación/edición de usuarios
 * Estructura simplificada pero funcional, replicable para otros CRUDs
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { fetchRoles, createUser, updateUser, fetchUserById, type User, type CreateUserDto, type UpdateUserDto } from '@/lib/users/api';
import { Loader } from '@/components/ui/loader';
import { ErrorMessage } from '@/components/ui/error-message';
import { formatRoleLabel } from '@/lib/auth/role-labels';

interface UserFormProps {
  user?: User;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  email: string;
  fullName: string;
  password: string;
  phone: string;
  zone: string;
  roleIds: string[];
}

export function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    fullName: '',
    password: '',
    phone: '',
    zone: '',
    roleIds: [],
  });

  useEffect(() => {
    loadRoles();
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadRoles = async () => {
    try {
      const rolesData = await fetchRoles();
      setRoles(rolesData);
    } catch (err) {
      console.error('Error loading roles:', err);
    }
  };

  const loadUserData = async () => {
    if (!user?.id) return;
    try {
      const userData = await fetchUserById(user.id);
      setFormData({
        email: userData.email || '',
        fullName: userData.fullName || '',
        password: '', // No cargar contraseña
        phone: userData.phone || '',
        zone: userData.zone || '',
        roleIds: userData.roles?.map((r) => r.id) || [],
      });
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'El nombre completo es requerido';
    }

    if (!user && !formData.password.trim()) {
      newErrors.password = 'La contraseña es requerida para nuevos usuarios';
    } else if (formData.password && formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    if (formData.roleIds.length === 0) {
      newErrors.roleIds = 'Debe seleccionar al menos un rol';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const trimmedEmail = formData.email.trim().toLowerCase();
      const trimmedName = formData.fullName.trim();
      const trimmedPhone = formData.phone.trim();
      const trimmedZone = formData.zone.trim();
      const trimmedPassword = formData.password.trim();

      if (user) {
        const updateData: UpdateUserDto = {
          email: trimmedEmail,
          fullName: trimmedName,
          phone: trimmedPhone,
          zone: trimmedZone,
          roleIds: formData.roleIds,
        };

        if (trimmedPassword) {
          updateData.password = trimmedPassword;
        }

        await updateUser(user.id, updateData);
      } else {
        const createData: CreateUserDto = {
          email: trimmedEmail,
          fullName: trimmedName,
          password: trimmedPassword,
          phone: trimmedPhone || undefined,
          zone: trimmedZone || undefined,
          roleIds: formData.roleIds,
        };

        await createUser(createData);
      }

      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar usuario';
      setErrors({ general: message });
      console.error('Error saving user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = (roleId: string) => {
    setFormData((prev) => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter((id) => id !== roleId)
        : [...prev.roleIds, roleId],
    }));
    // Limpiar error al cambiar
    if (errors.roleIds) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.roleIds;
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ErrorMessage message={errors.general} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, email: e.target.value }));
              if (errors.email) {
                setErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors.email;
                  return newErrors;
                });
              }
            }}
            className={`w-full rounded-md border px-3 py-2 text-sm ${
              errors.email ? 'border-red-300' : 'border-gray-300'
            } focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
            placeholder="usuario@ejemplo.com"
          />
          <ErrorMessage message={errors.email} variant="inline" className="mt-1" />
        </div>

        {/* Nombre Completo */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre Completo <span className="text-red-500">*</span>
          </label>
          <input
            id="fullName"
            type="text"
            value={formData.fullName}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, fullName: e.target.value }));
              if (errors.fullName) {
                setErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors.fullName;
                  return newErrors;
                });
              }
            }}
            className={`w-full rounded-md border px-3 py-2 text-sm ${
              errors.fullName ? 'border-red-300' : 'border-gray-300'
            } focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
            placeholder="Juan Pérez"
          />
          <ErrorMessage message={errors.fullName} variant="inline" className="mt-1" />
        </div>

        {/* Teléfono */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono
          </label>
          <input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="+54 11 1234-5678"
          />
        </div>

        {/* Zona */}
        <div>
          <label htmlFor="zone" className="block text-sm font-medium text-gray-700 mb-1">
            Zona
          </label>
          <input
            id="zone"
            type="text"
            value={formData.zone}
            onChange={(e) => setFormData((prev) => ({ ...prev, zone: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Buenos Aires"
          />
        </div>

        {/* Contraseña */}
        <div className="relative">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña {!user && <span className="text-red-500">*</span>}
            {user && <span className="text-gray-500 text-xs">(dejar vacío para mantener la actual)</span>}
          </label>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, password: e.target.value }));
              if (errors.password) {
                setErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors.password;
                  return newErrors;
                });
              }
            }}
            className={`w-full rounded-md border px-3 py-2 text-sm ${
              errors.password ? 'border-red-300' : 'border-gray-300'
            } focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
            placeholder={user ? 'Nueva contraseña (opcional)' : 'Mínimo 8 caracteres'}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5"
            >
              {showPassword ? (
                <>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 15.338 6.244 18 12 18c1.41 0 2.67-.184 3.79-.502M6.228 6.228A10.451 10.451 0 0112 6c5.756 0 8.774 2.662 10.066 6-.325.888-.77 1.712-1.312 2.454M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                </>
              ) : (
                <>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M1.934 12C3.226 8.662 6.244 6 12 6c5.756 0 8.774 2.662 10.066 6-1.292 3.338-4.31 6-10.066 6-5.756 0-8.774-2.662-10.066-6z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </>
              )}
            </svg>
          </button>
          <ErrorMessage message={errors.password} variant="inline" className="mt-1" />
        </div>
      </div>

      {/* Roles */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Roles <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {roles.map((role) => (
            <label
              key={role.id}
              className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <input
                type="checkbox"
                checked={formData.roleIds.includes(role.id)}
                onChange={() => handleRoleToggle(role.id)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{formatRoleLabel(role.name)}</span>
            </label>
          ))}
        </div>
        <ErrorMessage message={errors.roleIds} variant="inline" className="mt-1" />
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          text="Cancelar"
          onClick={onCancel}
          variant="secondary"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Guardando...</span>
            </>
          ) : (
            <span>{user ? 'Actualizar Usuario' : 'Crear Usuario'}</span>
          )}
        </button>
      </div>
    </form>
  );
}
