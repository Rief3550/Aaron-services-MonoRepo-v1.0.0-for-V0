/**
 * Plan Form Component
 * Presentation layer - Formulario de creación/edición de planes
 * Estructura simplificada, replicable desde usuarios
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  createPlan,
  updatePlan,
  fetchPlanById,
  type Plan,
  type CreatePlanDto,
  type UpdatePlanDto,
} from '@/lib/plans/api';
import { ErrorMessage } from '@/components/ui/error-message';

interface PlanFormProps {
  plan?: Plan;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  description: string;
  price: number;
  currency: string;
  billingPeriod: string;
  active: boolean;
}

export function PlanForm({ plan, onSuccess, onCancel }: PlanFormProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    price: 0,
    currency: 'ARS',
    billingPeriod: 'MONTHLY',
    active: true,
  });

  useEffect(() => {
    if (plan) {
      loadPlanData();
    }
  }, [plan]);

  const loadPlanData = async () => {
    if (!plan?.id) return;
    try {
      const planData = await fetchPlanById(plan.id, { admin: true });
      setFormData({
        name: planData.name || '',
        description: planData.description || '',
        price: Number(planData.price) || 0,
        currency: planData.currency || 'ARS',
        billingPeriod: planData.billingPeriod || 'MONTHLY',
        active: planData.active ?? true,
      });
    } catch (err) {
      console.error('Error loading plan data:', err);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (formData.price <= 0) {
      newErrors.price = 'El precio debe ser mayor a 0';
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
      if (plan) {
        // Actualizar
        const updateData: UpdatePlanDto = {
          name: formData.name,
          description: formData.description || undefined,
          price: formData.price,
          currency: formData.currency,
          billingPeriod: formData.billingPeriod || undefined,
          active: formData.active,
        };

        await updatePlan(plan.id, updateData);
      } else {
        // Crear
        const createData: CreatePlanDto = {
          name: formData.name,
          description: formData.description || undefined,
          price: formData.price,
          currency: formData.currency,
          billingPeriod: formData.billingPeriod || undefined,
          active: formData.active,
        };

        await createPlan(createData);
      }

      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar plan';
      setErrors({ general: message });
      console.error('Error saving plan:', err);
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
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del Plan <span className="text-red-500">*</span>
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
            placeholder="Plan Básico"
          />
          <ErrorMessage message={errors.name} variant="inline" className="mt-1" />
        </div>

        {/* Precio */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            Precio <span className="text-red-500">*</span>
          </label>
          <input
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }));
              if (errors.price) {
                setErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors.price;
                  return newErrors;
                });
              }
            }}
            className={`w-full rounded-md border px-3 py-2 text-sm ${
              errors.price ? 'border-red-300' : 'border-gray-300'
            } focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
            placeholder="0.00"
          />
          <ErrorMessage message={errors.price} variant="inline" className="mt-1" />
        </div>

        {/* Moneda */}
        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
            Moneda
          </label>
          <select
            id="currency"
            value={formData.currency}
            onChange={(e) => setFormData((prev) => ({ ...prev, currency: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ARS">ARS (Pesos Argentinos)</option>
            <option value="USD">USD (Dólares)</option>
          </select>
        </div>

        {/* Período de Facturación */}
        <div>
          <label htmlFor="billingPeriod" className="block text-sm font-medium text-gray-700 mb-1">
            Período de Facturación
          </label>
          <select
            id="billingPeriod"
            value={formData.billingPeriod}
            onChange={(e) => setFormData((prev) => ({ ...prev, billingPeriod: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="MONTHLY">Mensual</option>
          </select>
        </div>

        {/* Estado Activo */}
        <div className="md:col-span-2">
          <div className="flex items-center">
            <input
              id="active"
              type="checkbox"
              checked={formData.active}
              onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
            />
            <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
              Plan activo (disponible para nuevas suscripciones)
            </label>
          </div>
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Descripción
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Descripción del plan..."
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
            <span>{plan ? 'Actualizar Plan' : 'Crear Plan'}</span>
          )}
        </button>
      </div>
    </form>
  );
}
