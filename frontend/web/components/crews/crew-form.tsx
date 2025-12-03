/**
 * Crew Form Component
 * Presentation layer - Formulario de creación/edición de cuadrillas
 * Permite vincular usuarios con rol CREW mediante un selector
 * y opcionalmente agregar entradas manuales (backward compatibility)
 */

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  createCrew,
  updateCrew,
  fetchCrewById,
  type Crew,
  type CreateCrewDto,
  type UpdateCrewDto,
} from '@/lib/crews/service';
import { fetchUsers, type User } from '@/lib/users/api';

interface CrewFormProps {
  crew?: Crew;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  zona: string;
  notes: string;
  availability: string;
}

export function CrewForm({ crew, onSuccess, onCancel }: CrewFormProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<FormData>({
    name: '',
    zona: '',
    notes: '',
    availability: 'AVAILABLE',
  });

  const [crewUsers, setCrewUsers] = useState<User[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [manualMembers, setManualMembers] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState('');

  useEffect(() => {
    void loadCrewUsers();
  }, []);

  useEffect(() => {
    if (crew) {
      void loadCrewData();
    } else {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crew]);

  const loadCrewUsers = async () => {
    setLoadingMembers(true);
    setMembersError(null);
    try {
      const users = await fetchUsers();
      const crewOnly = users.filter((user) =>
        user.roles?.some((role) => role.name === 'CREW')
      );
      setCrewUsers(crewOnly);
    } catch (error) {
      console.error('Error loading crew users:', error);
      setMembersError('Error al cargar usuarios con rol Cuadrilla');
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadCrewData = async () => {
    if (!crew?.id) return;
    try {
      const crewData = await fetchCrewById(crew.id);
      const rawMembers = crewData.members || [];
      const nextSelected: string[] = [];
      const nextManual: string[] = [];

      rawMembers.forEach((member) => {
        if (typeof member === 'string') {
          nextManual.push(member);
          return;
        }

        if (member && typeof member === 'object') {
          const candidate = member as {
            id?: string;
            userId?: string;
            user?: { id?: string };
            name?: string;
            email?: string;
          };

          const resolvedId = candidate.id || candidate.userId || candidate.user?.id;
          if (resolvedId) {
            nextSelected.push(resolvedId);
            return;
          }

          // No había ID. Mantener texto para no perder data.
          nextManual.push(candidate.name || candidate.email || '');
        }
      });

      setFormData({
        name: crewData.name || '',
        zona: crewData.zona || '',
        notes: crewData.notes || '',
        availability: crewData.availability || 'AVAILABLE',
      });
      setSelectedUserIds(Array.from(new Set(nextSelected)));
      setManualMembers(nextManual.filter(Boolean));
    } catch (err) {
      console.error('Error loading crew data:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      zona: '',
      notes: '',
      availability: 'AVAILABLE',
    });
    setSelectedUserIds([]);
    setManualMembers([]);
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
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
      const memberObjects = selectedUserIds.map((userId) => {
        const user = crewUsers.find((u) => u.id === userId);
        return {
          id: userId,
          name: user?.fullName,
          email: user?.email,
        };
      });

      const manualEntries = manualMembers
        .map((member) => member.trim())
        .filter(Boolean);

      const membersPayload: Array<{ id: string; name?: string; email?: string } | string> = [
        ...memberObjects,
        ...manualEntries,
      ];

      if (crew) {
        const updateData: UpdateCrewDto = {
          name: formData.name,
          members: membersPayload,
          zona: formData.zona || undefined,
          notes: formData.notes || undefined,
          availability: formData.availability || undefined,
        };
        await updateCrew(crew.id, updateData);
      } else {
        const createData: CreateCrewDto = {
          name: formData.name,
          members: membersPayload,
          zona: formData.zona || undefined,
          notes: formData.notes || undefined,
          availability: formData.availability || undefined,
        };
        await createCrew(createData);
      }

      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar cuadrilla';
      setErrors({ general: message });
      console.error('Error saving crew:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const addManualMember = () => {
    const value = manualInput.trim();
    if (!value) return;
    if (!manualMembers.includes(value)) {
      setManualMembers((prev) => [...prev, value]);
    }
    setManualInput('');
  };

  const removeManualMember = (member: string) => {
    setManualMembers((prev) => prev.filter((item) => item !== member));
  };

  const selectedUsers = useMemo(() => {
    return selectedUserIds
      .map((id) => crewUsers.find((user) => user.id === id))
      .filter((user): user is User => Boolean(user));
  }, [selectedUserIds, crewUsers]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.general && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-800">{errors.general}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de la Cuadrilla <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, name: e.target.value }));
              if (errors.name) {
                setErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors.name;
                  return newErrors;
                });
              }
            }}
            className={`w-full rounded-md border px-3 py-2 text-sm ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            } focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
            placeholder="Cuadrilla Alpha"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="zona" className="block text-sm font-medium text-gray-700 mb-1">
            Zona
          </label>
          <input
            id="zona"
            type="text"
            value={formData.zona}
            onChange={(e) => setFormData((prev) => ({ ...prev, zona: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Zona Norte"
          />
        </div>

        <div>
          <label htmlFor="availability" className="block text-sm font-medium text-gray-700 mb-1">
            Disponibilidad
          </label>
          <select
            id="availability"
            value={formData.availability}
            onChange={(e) => setFormData((prev) => ({ ...prev, availability: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="AVAILABLE">Disponible</option>
            <option value="BUSY">Ocupado</option>
            <option value="OFFLINE">Offline</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Usuarios con rol Cuadrilla
          </label>
          {membersError && <p className="text-sm text-red-600 mb-2">{membersError}</p>}
          <div className="rounded-md border border-gray-200 max-h-60 overflow-y-auto divide-y divide-gray-100">
            {loadingMembers ? (
              <div className="p-4 text-sm text-gray-500">Cargando usuarios...</div>
            ) : crewUsers.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">
                No hay usuarios con rol Cuadrilla disponibles
              </div>
            ) : (
              crewUsers.map((user) => {
                const selected = selectedUserIds.includes(user.id);
                return (
                  <label
                    key={user.id}
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleUserSelection(user.id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user.fullName || user.email}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Agregar miembro manual (opcional)
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addManualMember();
                }
              }}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Ej: Juan Pérez"
            />
            <Button type="button" text="Agregar" onClick={addManualMember} variant="secondary" />
          </div>

          {manualMembers.length > 0 ? (
            <div className="space-y-2">
              {manualMembers.map((member) => (
                <div
                  key={member}
                  className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2"
                >
                  <span className="text-sm text-gray-700">{member}</span>
                  <button
                    type="button"
                    onClick={() => removeManualMember(member)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">No hay miembros manuales</p>
          )}
        </div>

        {selectedUsers.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Miembros seleccionados</p>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <span
                  key={user.id}
                  className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-800"
                >
                  {user.fullName || user.email}
                  <button
                    type="button"
                    onClick={() => toggleUserSelection(user.id)}
                    className="ml-2 text-blue-500 hover:text-blue-700"
                    aria-label={`Quitar ${user.fullName || user.email}`}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" text="Cancelar" onClick={onCancel} variant="secondary" />
        <Button type="submit" text={loading ? 'Guardando...' : crew ? 'Actualizar' : 'Crear'} disabled={loading} />
      </div>
    </form>
  );
}
