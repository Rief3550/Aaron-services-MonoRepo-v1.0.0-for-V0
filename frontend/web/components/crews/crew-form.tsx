/**
 * Crew Form Component
 * Presentation layer - Formulario de creación/edición de cuadrillas
 * Estructura simplificada, replicable desde usuarios
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { createCrew, updateCrew, fetchCrewById, type Crew, type CreateCrewDto, type UpdateCrewDto } from '@/lib/crews/service';

interface CrewFormProps {
  crew?: Crew;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  members: string[];
  zona: string;
  notes: string;
  availability: string;
}

export function CrewForm({ crew, onSuccess, onCancel }: CrewFormProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<FormData>({
    name: '',
    members: [],
    zona: '',
    notes: '',
    availability: 'AVAILABLE',
  });
  const [memberInput, setMemberInput] = useState('');

  useEffect(() => {
    if (crew) {
      loadCrewData();
    }
  }, [crew]);

  const loadCrewData = async () => {
    if (!crew?.id) return;
    try {
      const crewData = await fetchCrewById(crew.id);
      const members = crewData.members || [];
      const memberIds = Array.isArray(members)
        ? members.map((m) => (typeof m === 'string' ? m : m.id || ''))
        : [];

      setFormData({
        name: crewData.name || '',
        members: memberIds,
        zona: crewData.zona || '',
        notes: crewData.notes || '',
        availability: crewData.availability || 'AVAILABLE',
      });
    } catch (err) {
      console.error('Error loading crew data:', err);
    }
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
      const memberObjects = formData.members.map((id) => ({ id }));

      if (crew) {
        // Actualizar
        const updateData: UpdateCrewDto = {
          name: formData.name,
          members: memberObjects,
          zona: formData.zona || undefined,
          notes: formData.notes || undefined,
          availability: formData.availability || undefined,
        };

        await updateCrew(crew.id, updateData);
      } else {
        // Crear
        const createData: CreateCrewDto = {
          name: formData.name,
          members: memberObjects,
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

  const addMember = () => {
    if (memberInput.trim() && !formData.members.includes(memberInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        members: [...prev.members, memberInput.trim()],
      }));
      setMemberInput('');
    }
  };

  const removeMember = (memberId: string) => {
    setFormData((prev) => ({
      ...prev,
      members: prev.members.filter((id) => id !== memberId),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.general && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-800">{errors.general}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nombre */}
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
            className={`w-full rounded-md border px-3 py-2 text-sm ${errors.name ? 'border-red-300' : 'border-gray-300'
              } focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
            placeholder="Cuadrilla Alpha"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        {/* Zona */}
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

        {/* Disponibilidad */}
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

      {/* Miembros */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Miembros (IDs de usuarios)
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={memberInput}
            onChange={(e) => setMemberInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addMember();
              }
            }}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="ID del usuario"
          />
          <Button
            text="Agregar"
            onClick={() => addMember()}
            variant="secondary"
            size="sm"
            type="button"
          />
        </div>
        {formData.members.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.members.map((memberId) => (
              <span
                key={memberId}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {memberId}
                <button
                  type="button"
                  onClick={() => removeMember(memberId)}
                  className="text-blue-600 hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Notas */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notas
        </label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Notas adicionales sobre la cuadrilla"
        />
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
            <span>{crew ? 'Actualizar Cuadrilla' : 'Crear Cuadrilla'}</span>
          )}
        </button>
      </div>
    </form>
  );
}

