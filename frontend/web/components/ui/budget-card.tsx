/**
 * Budget Card Component
 * Presentation layer - Tarjeta de presupuesto/estado con contador
 * Adaptado a diseño unificado (fila única con divisores)
 */

'use client';

import React from 'react';

// Tipos de estados para órdenes
export type OrderState = 'PENDIENTE' | 'ASIGNADA' | 'EN_PROGRESO' | 'FINALIZADA' | 'CANCELADA';

// Tipos de estados para suscripciones
export type SubscriptionState = 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELLED';

// Tipos de estados para usuarios
export type UserState = 'ACTIVE' | 'INACTIVE' | 'BAJA';

// Union type para todos los estados
export type StateType = OrderState | SubscriptionState | UserState;

// Tipo de contexto (para determinar qué estados mostrar)
export type ContextType = 'orders' | 'subscriptions' | 'users';

// --- ICONOS SVG ---
const ClockIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const PlayIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AlertIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

const PauseIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);


// Configuración de estilos por estado (adaptada a colores de Aaron)
type StateStyleConfig = {
  [K in StateType]: {
    bgClass: string;
    textClass: string;
    icon: React.ReactNode;
  };
};

const stateStyles: StateStyleConfig = {
  // Estados de órdenes
  PENDIENTE: {
    bgClass: 'bg-yellow-50',
    textClass: 'text-yellow-600',
    icon: <ClockIcon />,
  },
  ASIGNADA: {
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-600',
    icon: <UserIcon />,
  },
  EN_PROGRESO: {
    bgClass: 'bg-purple-50',
    textClass: 'text-purple-600',
    icon: <PlayIcon />,
  },
  FINALIZADA: {
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-600',
    icon: <CheckCircleIcon />,
  },
  CANCELADA: {
    bgClass: 'bg-red-50',
    textClass: 'text-red-600',
    icon: <XCircleIcon />,
  },
  // Estados de suscripciones
  ACTIVE: {
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-600',
    icon: <CheckCircleIcon />,
  },
  PAST_DUE: {
    bgClass: 'bg-orange-50',
    textClass: 'text-orange-600',
    icon: <AlertIcon />,
  },
  SUSPENDED: {
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-600',
    icon: <PauseIcon />,
  },
  CANCELLED: {
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-600',
    icon: <XCircleIcon />,
  },
  // Estados de usuarios
  INACTIVE: {
    bgClass: 'bg-gray-50',
    textClass: 'text-gray-500',
    icon: <PauseIcon />,
  },
  BAJA: {
    bgClass: 'bg-red-50',
    textClass: 'text-red-600',
    icon: <XCircleIcon />,
  },
};

// Mapeo de labels para mostrar
const stateLabels: Record<StateType, string> = {
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

export interface BudgetCardProps {
  /** Estado a mostrar */
  state: StateType;
  /** Cantidad/conteo del estado */
  count: number;
  /** Contexto para determinar los colores apropiados */
  context?: ContextType;
  /** Si es clickeable */
  onClick?: () => void;
  /** Clase CSS adicional */
  className?: string;
}

/**
 * BudgetCard (Legacy wrapper for individual usage if needed, though Grid is preferred)
 */
export function BudgetCard({
  state,
  count,
  onClick,
  className = '',
}: BudgetCardProps) {
  // Implementación simplificada si se usa individualmente, 
  // aunque el foco ahora es el Grid unificado.
    const config = stateStyles[state];
    const label = stateLabels[state] || state;

    return (
        <div 
            onClick={onClick}
            className={`flex items-center p-4 rounded-xl border border-gray-100 bg-white shadow-sm ${className} ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
        >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${config.bgClass} ${config.textClass}`}>
                {config.icon}
            </div>
            <div>
                <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
                <p className="text-xl font-bold text-gray-900">{count}</p>
            </div>
        </div>
    );
}

/**
 * BudgetCardGrid - Componente unificado tipo "Row" con divisores
 */
export interface BudgetCardGridProps {
  budgets: Array<{
    state: StateType;
    count: number;
    onClick?: () => void;
  }>;
  context?: ContextType;
  className?: string;
}

export function BudgetCardGrid({ budgets, className = '' }: BudgetCardGridProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 w-full overflow-hidden ${className}`}>
        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {budgets.map((budget) => {
                const config = stateStyles[budget.state];
                const label = stateLabels[budget.state] || budget.state;

                return (
                    <div 
                        key={budget.state}
                        onClick={budget.onClick}
                        className="flex-1 p-6 flex items-center hover:bg-gray-50/50 transition-colors cursor-pointer group"
                    >
                         {/* Icono Circular con color de fondo del estado */}
                        <div className={`
                            w-12 h-12 rounded-full flex items-center justify-center mr-4 
                            ${config.bgClass} ${config.textClass} 
                            group-hover:scale-110 transition-transform duration-300
                            shadow-sm
                        `}>
                            {config.icon}
                        </div>
                        
                         {/* Info */}
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
                            <h3 className="text-2xl font-bold text-gray-900">{budget.count}</h3>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  );
}
