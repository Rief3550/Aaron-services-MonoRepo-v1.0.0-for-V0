/**
 * Metric Card Component
 * Presentation layer - Tarjeta de métricas mejorada
 * Adaptado desde diseño de referencia, manteniendo estructura pero con colores de Aaron
 */

'use client';

import React from 'react';

export interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  actionButton?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'warning' | 'error' | 'success' | 'info';
  iconBgColor?: string;
  cardBgColor?: string;
  className?: string;
}

const defaultVariantConfig = {
  default: {
    iconBg: 'bg-blue-500',
    cardBg: 'bg-blue-50',
    textColor: 'text-gray-900',
  },
  warning: {
    iconBg: 'bg-orange-500',
    cardBg: 'bg-orange-50',
    textColor: 'text-gray-900',
  },
  error: {
    iconBg: 'bg-red-500',
    cardBg: 'bg-red-50',
    textColor: 'text-gray-900',
  },
  success: {
    iconBg: 'bg-emerald-500',
    cardBg: 'bg-emerald-50',
    textColor: 'text-gray-900',
  },
  info: {
    iconBg: 'bg-purple-500',
    cardBg: 'bg-purple-50',
    textColor: 'text-gray-900',
  },
};

/**
 * MetricCard - Componente mejorado para mostrar métricas
 * Adaptado desde diseño de referencia con mejoras visuales
 */
export function MetricCard({
  title,
  value,
  icon,
  trend,
  actionButton,
  variant = 'default',
  iconBgColor,
  cardBgColor,
  className = '',
}: MetricCardProps) {
  const config = defaultVariantConfig[variant];
  const finalIconBg = iconBgColor || config.iconBg;
  const finalCardBg = cardBgColor || config.cardBg;

  return (
    <div
      className={`
        flex flex-col p-4 rounded-xl shadow-lg 
        transition-transform duration-300 hover:scale-[1.02] 
        ${finalCardBg} ${className}
      `}
      style={{ minHeight: '135px' }}
    >
      <div className="flex items-center justify-center h-full">
        {/* Icono en círculo */}
        {icon && (
          <div
            className={`
              flex items-center justify-center 
              w-12 h-12 rounded-full p-3 mr-4 
              ${finalIconBg} text-white
              flex-shrink-0
            `}
          >
            <div className="w-6 h-6">{icon}</div>
          </div>
        )}

        {/* Contenido */}
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-xs text-gray-700 font-medium mb-1">{title}</span>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-light ${config.textColor}`}>
              {value !== null && value !== undefined ? value : '-'}
            </span>
            {trend && (
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '+' : ''}{trend.value}
              </span>
            )}
          </div>
          {actionButton && (
            <button
              onClick={actionButton.onClick}
              className="mt-3 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors self-start"
            >
              {actionButton.label} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


