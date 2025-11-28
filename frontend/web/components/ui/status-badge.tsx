/**
 * Status Badge Component
 * Presentation layer - Badge compacto para mostrar estados en tablas
 * Adaptado desde diseño de referencia, optimizado para uso en tablas
 */

'use client';

import React from 'react';
import { type OrderState, type SubscriptionState, type StateType } from './budget-card';

export interface StatusBadgeProps {
  /** Estado a mostrar */
  state: StateType;
  /** Si es clickeable */
  onClick?: () => void;
  /** Clase CSS adicional */
  className?: string;
}

// Configuración de estilos para badges compactos
const badgeStyles: Record<string, {
  bgColor: string;
  textColor: string;
  dotColor: string;
}> = {
  // Estados de órdenes
  PENDIENTE: {
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    dotColor: 'bg-yellow-500',
  },
  ASIGNADA: {
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    dotColor: 'bg-blue-500',
  },
  EN_PROGRESO: {
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    dotColor: 'bg-purple-500',
  },
  FINALIZADA: {
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    dotColor: 'bg-emerald-500',
  },
  CANCELADA: {
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    dotColor: 'bg-red-500',
  },
  // Estados de suscripciones
  ACTIVE: {
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    dotColor: 'bg-emerald-500',
  },
  PAST_DUE: {
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    dotColor: 'bg-orange-500',
  },
  SUSPENDED: {
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    dotColor: 'bg-amber-500',
  },
  CANCELLED: {
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    dotColor: 'bg-gray-500',
  },
  // Estados de usuarios
  INACTIVE: {
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-600',
    dotColor: 'bg-gray-400',
  },
  BAJA: {
    bgColor: 'bg-red-50',
    textColor: 'text-red-600',
    dotColor: 'bg-red-400',
  },
};

// Labels para mostrar
const stateLabels: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  ASIGNADA: 'Asignada',
  EN_PROGRESO: 'En Progreso',
  FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada',
  ACTIVE: 'Activa',
  PAST_DUE: 'Vencida',
  SUSPENDED: 'Suspendida',
  CANCELLED: 'Cancelada',
  INACTIVE: 'Inactivo',
  BAJA: 'De Baja',
};

/**
 * StatusBadge - Badge compacto para estados en tablas
 */
export function StatusBadge({ state, onClick, className = '' }: StatusBadgeProps) {
  const config = badgeStyles[state];

  if (!config) {
    console.warn(`StatusBadge: Invalid state "${state}"`);
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 ${className}`}>
        {state}
      </span>
    );
  }

  const label = stateLabels[state] || state;
  const isClickable = onClick !== undefined;

  const badgeClasses = `
    inline-flex items-center justify-center
    ${config.bgColor} ${config.textColor}
    text-xs font-medium
    px-2.5 pr-3 rounded-full py-1
    transition-all duration-200
    ${isClickable ? 'cursor-pointer hover:opacity-80 hover:shadow-sm' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const content = (
    <>
      <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${config.dotColor} flex`}></span>
      {label}
    </>
  );

  if (isClickable) {
    return (
      <button
        onClick={onClick}
        className={badgeClasses}
        aria-label={`Estado: ${label}. Click para cambiar.`}
      >
        {content}
      </button>
    );
  }

  return (
    <span className={badgeClasses}>
      {content}
    </span>
  );
}

