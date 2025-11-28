/**
 * WorkType Form Component
 * Presentation layer - Formulario de creación/edición de tipos de trabajo
 * Estructura simplificada, replicable desde usuarios
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  createWorkType,
  updateWorkType,
  fetchWorkTypeById,
  type WorkType,
  type CreateWorkTypeDto,
  type UpdateWorkTypeDto,
} from '@/lib/work-types/api';
import { ErrorMessage } from '@/components/ui/error-message';

interface WorkTypeFormProps {
  workType?: WorkType;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  nombre: string;
  descripcion: string;
  costoBase: number;
  unidad: string;
  activo: boolean;
}

export function WorkTypeForm({ workType, onSuccess, onCancel }: WorkTypeFormProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    descripcion: '',
    costoBase: 0,
    unidad: '',
    activo: true,
  });

  useEffect(() => {
    if (workType) {
      loadWorkTypeData();
    }
  }, [workType]);

  const loadWorkTypeData = async () => {
    if (!workType?.id) return;
    try {
      const workTypeData = await fetchWorkTypeById(workType.id);
      setFormData({
        nombre: workTypeData.nombre || '',
        descripcion: workTypeData.descripcion || '',
        costoBase: workTypeData.costoBase ? Number(workTypeData.costoBase) : 0,
        unidad: workTypeData.unidad || '',
        activo: workTypeData.activo ?? true,
      });
    } catch (err) {
      console.error('Error loading work type data:', err);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
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
      if (workType) {
        // Actualizar
        const updateData: UpdateWorkTypeDto = {
          nombre: formData.nombre,
          descripcion: formData.descripcion || undefined,
          costoBase: formData.costoBase || undefined,
          unidad: formData.unidad || undefined,
          activo: formData.activo,
        };

        await updateWorkType(workType.id, updateData);
      } else {
        // Crear
        const createData: CreateWorkTypeDto = {
          nombre: formData.nombre,
          descripcion: formData.descripcion || undefined,
          costoBase: formData.costoBase || undefined,
          unidad: formData.unidad || undefined,
          activo: formData.activo,
        };

        await createWorkType(createData);
      }

      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar tipo de trabajo';
      setErrors({ general: message });
      console.error('Error saving work type:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ErrorMessage message={errors.general} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nombre */}
        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            id="nombre"
            type="text"
            value={formData.nombre}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, nombre: e.target.value }));
              if (errors.nombre) {
                setErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors.nombre;
                  return newErrors;
                });
              }
            }}
            className={`w-full rounded-md border px-3 py-2 text-sm ${
              errors.nombre ? 'border-red-300' : 'border-gray-300'
            } focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
            placeholder="Plomería Básica"
          />
          <ErrorMessage message={errors.nombre} variant="inline" className="mt-1" />
        </div>

        {/* Unidad */}
        <div>
          <label htmlFor="unidad" className="block text-sm font-medium text-gray-700 mb-1">
            Unidad
          </label>
          <select
            id="unidad"
            value={formData.unidad}
            onChange={(e) => setFormData((prev) => ({ ...prev, unidad: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Seleccionar unidad</option>
            <option value="por visita">Por visita</option>
            <option value="por hora">Por hora</option>
            <option value="por día">Por día</option>
            <option value="fijo">Fijo</option>
          </select>
        </div>

        {/* Costo Base */}
        <div>
          <label htmlFor="costoBase" className="block text-sm font-medium text-gray-700 mb-1">
            Costo Base
          </label>
          <input
            id="costoBase"
            type="number"
            min="0"
            step="0.01"
            value={formData.costoBase}
            onChange={(e) => setFormData((prev) => ({ ...prev, costoBase: parseFloat(e.target.value) || 0 }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="0.00"
          />
        </div>

        {/* Estado Activo */}
        <div>
          <div className="flex items-center pt-6">
            <input
              id="activo"
              type="checkbox"
              checked={formData.activo}
              onChange={(e) => setFormData((prev) => ({ ...prev, activo: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
            />
            <label htmlFor="activo" className="ml-2 block text-sm text-gray-900">
              Activo (disponible para órdenes)
            </label>
          </div>
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
          Descripción
        </label>
        <textarea
          id="descripcion"
          value={formData.descripcion}
          onChange={(e) => setFormData((prev) => ({ ...prev, descripcion: e.target.value }))}
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Descripción del tipo de trabajo..."
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
            <span>{workType ? 'Actualizar Tipo de Trabajo' : 'Crear Tipo de Trabajo'}</span>
          )}
        </button>
      </div>
    </form>
  );
}

