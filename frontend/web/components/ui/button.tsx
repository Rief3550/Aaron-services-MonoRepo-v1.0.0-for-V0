/**
 * Button Component
 * Presentation layer - Botón reutilizable mejorado
 * Adaptado desde diseño de referencia, manteniendo estructura pero con estilos de Aaron
 */

'use client';

import React from 'react';

export interface ButtonProps {
  /** Texto del botón */
  text: string;
  /** Función onClick */
  onClick?: () => void;
  /** Icono opcional */
  icon?: React.ReactNode;
  /** Color de fondo personalizado */
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  /** Si está deshabilitado */
  disabled?: boolean;
  /** Si está cargando */
  loading?: boolean;
  /** Tamaño del botón */
  size?: 'sm' | 'md' | 'lg';
  /** Clase CSS adicional */
  className?: string;
  /** Tipo de botón HTML */
  type?: 'button' | 'submit' | 'reset';
}

const variantClasses = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  warning: 'bg-orange-600 hover:bg-orange-700 text-white',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

/**
 * Button - Componente de botón reutilizable mejorado
 */
export function Button({
  text,
  onClick,
  icon,
  variant = 'primary',
  disabled = false,
  loading = false,
  size = 'md',
  className = '',
  type = 'button',
}: ButtonProps) {
  const baseClasses = `
    flex items-center justify-center gap-2
    rounded-lg
    font-medium
    transition-colors duration-200
    shadow-md
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={baseClasses}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Cargando...</span>
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span>{text}</span>
        </>
      )}
    </button>
  );
}

