/**
 * Subscription Form Component
 * Presentation layer - Formulario de creación/edición de suscripciones
 * Estructura simplificada, replicable desde usuarios
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  createSubscription,
  updateSubscriptionStatus,
  fetchSubscriptionById,
  type Subscription,
  type CreateSubscriptionDto,
} from '@/lib/subscriptions/service';
import { fetchUsers } from '@/lib/users/api';
import { fetchPlans, type Plan } from '@/lib/plans/api';
import { ErrorMessage } from '@/components/ui/error-message';

interface SubscriptionFormProps {
  subscription?: Subscription;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  userId: string;
  planId: string;
  propertyId: string;
  billingDay: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

export function SubscriptionForm({ subscription, onSuccess, onCancel }: SubscriptionFormProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; email: string; fullName?: string }>>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<FormData>({
    userId: '',
    planId: '',
    propertyId: '',
    billingDay: 1,
    currentPeriodStart: new Date().toISOString().split('T')[0],
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  useEffect(() => {
    loadUsers();
    loadPlans();
    if (subscription) {
      loadSubscriptionData();
    }
  }, [subscription]);

  const loadUsers = async () => {
    try {
      const usersData = await fetchUsers();
      setUsers(usersData);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const loadPlans = async () => {
    try {
      const plansData = await fetchPlans({ activeOnly: true }); // Solo planes activos
      setPlans(plansData);
    } catch (err) {
      console.error('Error loading plans:', err);
    }
  };

  const loadSubscriptionData = async () => {
    if (!subscription?.id) return;
    try {
      const subData = await fetchSubscriptionById(subscription.id);
      setFormData({
        userId: subData.userId || '',
        planId: subData.planId || '',
        propertyId: subData.propertyId || '',
        billingDay: subData.billingDay || 1,
        currentPeriodStart: subData.currentPeriodStart
          ? new Date(subData.currentPeriodStart).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        currentPeriodEnd: subData.currentPeriodEnd
          ? new Date(subData.currentPeriodEnd).toISOString().split('T')[0]
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
    } catch (err) {
      console.error('Error loading subscription data:', err);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.userId) {
      newErrors.userId = 'El usuario es requerido';
    }

    if (!formData.planId) {
      newErrors.planId = 'El plan es requerido';
    }

    if (!formData.currentPeriodStart) {
      newErrors.currentPeriodStart = 'La fecha de inicio es requerida';
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
      if (subscription) {
        // Actualizar estado (las suscripciones solo se actualiza el estado)
        await updateSubscriptionStatus(subscription.id, {
          status: subscription.status,
        });
      } else {
        // Crear
        const createData: CreateSubscriptionDto = {
          userId: formData.userId,
          planId: formData.planId,
          propertyId: formData.propertyId || undefined,
          billingDay: formData.billingDay || undefined,
          currentPeriodStart: formData.currentPeriodStart || undefined,
          currentPeriodEnd: formData.currentPeriodEnd || undefined,
        };

        await createSubscription(createData);
      }

      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar suscripción';
      setErrors({ general: message });
      console.error('Error saving subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ErrorMessage message={errors.general} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Usuario */}
        <div>
          <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
            Usuario <span className="text-red-500">*</span>
          </label>
          <select
            id="userId"
            value={formData.userId}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, userId: e.target.value }));
              if (errors.userId) {
                setErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors.userId;
                  return newErrors;
                });
              }
            }}
            disabled={!!subscription}
            className={`w-full rounded-md border px-3 py-2 text-sm ${errors.userId ? 'border-red-300' : 'border-gray-300'
              } ${subscription ? 'bg-gray-100' : 'bg-white'} focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
          >
            <option value="">Seleccionar usuario</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.fullName || user.email} ({user.email})
              </option>
            ))}
          </select>
          <ErrorMessage message={errors.userId} variant="inline" className="mt-1" />
        </div>

        {/* Plan */}
        <div>
          <label htmlFor="planId" className="block text-sm font-medium text-gray-700 mb-1">
            Plan <span className="text-red-500">*</span>
          </label>
          <select
            id="planId"
            value={formData.planId}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, planId: e.target.value }));
              if (errors.planId) {
                setErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors.planId;
                  return newErrors;
                });
              }
            }}
            disabled={!!subscription}
            className={`w-full rounded-md border px-3 py-2 text-sm ${errors.planId ? 'border-red-300' : 'border-gray-300'
              } ${subscription ? 'bg-gray-100' : 'bg-white'} focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
          >
            <option value="">Seleccionar plan</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} - {new Intl.NumberFormat('es-AR', {
                  style: 'currency',
                  currency: plan.currency || 'ARS',
                }).format(Number(plan.price))}
              </option>
            ))}
          </select>
          <ErrorMessage message={errors.planId} variant="inline" className="mt-1" />
        </div>

        {/* Propiedad (opcional) */}
        <div>
          <label htmlFor="propertyId" className="block text-sm font-medium text-gray-700 mb-1">
            Propiedad
          </label>
          <input
            id="propertyId"
            type="text"
            value={formData.propertyId}
            onChange={(e) => setFormData((prev) => ({ ...prev, propertyId: e.target.value }))}
            placeholder="ID de propiedad (opcional)"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Día de facturación */}
        <div>
          <label htmlFor="billingDay" className="block text-sm font-medium text-gray-700 mb-1">
            Día de Facturación
          </label>
          <input
            id="billingDay"
            type="number"
            min="1"
            max="28"
            value={formData.billingDay}
            onChange={(e) => setFormData((prev) => ({ ...prev, billingDay: parseInt(e.target.value) || 1 }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Fecha de inicio */}
        <div>
          <label htmlFor="currentPeriodStart" className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de Inicio <span className="text-red-500">*</span>
          </label>
          <input
            id="currentPeriodStart"
            type="date"
            value={formData.currentPeriodStart}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, currentPeriodStart: e.target.value }));
              if (errors.currentPeriodStart) {
                setErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors.currentPeriodStart;
                  return newErrors;
                });
              }
            }}
            className={`w-full rounded-md border px-3 py-2 text-sm ${errors.currentPeriodStart ? 'border-red-300' : 'border-gray-300'
              } focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
          />
          <ErrorMessage message={errors.currentPeriodStart} variant="inline" className="mt-1" />
        </div>

        {/* Fecha de fin */}
        <div>
          <label htmlFor="currentPeriodEnd" className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de Fin
          </label>
          <input
            id="currentPeriodEnd"
            type="date"
            value={formData.currentPeriodEnd}
            onChange={(e) => setFormData((prev) => ({ ...prev, currentPeriodEnd: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
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
            <span>{subscription ? 'Actualizar Suscripción' : 'Crear Suscripción'}</span>
          )}
        </button>
      </div>
    </form>
  );
}
