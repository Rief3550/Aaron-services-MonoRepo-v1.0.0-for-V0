/**
 * Componente de Loader con Logo
 * Presentation layer - Componente reutilizable para mostrar carga con logo de la marca
 */

'use client';

import Image from 'next/image';
import { useState } from 'react';

interface LoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: {
    logo: 32,
    spinner: 'h-6 w-6',
    text: 'text-sm',
    gap: 'gap-3',
  },
  md: {
    logo: 64,
    spinner: 'h-8 w-8',
    text: 'text-base',
    gap: 'gap-4',
  },
  lg: {
    logo: 400,
    spinner: 'h-32 w-32',
    text: 'text-2xl',
    gap: 'gap-8',
  },
};

export function Loader({ 
  message = 'Cargando...', 
  size = 'md',
  fullScreen = false 
}: LoaderProps) {
  const [logoError, setLogoError] = useState(false);
  const sizes = sizeClasses[size];
  const containerClasses = fullScreen
    ? 'flex min-h-screen items-center justify-center'
    : 'flex items-center justify-center py-8';

  return (
    <div className={containerClasses}>
      <div className={`flex flex-col items-center ${sizes.gap}`}>
        {!logoError ? (
          /* Logo con animación de pulso */
          <div className="relative">
            <div className="absolute inset-0 animate-ping opacity-20">
              <Image
                src="/images/brand/Loader-logo.png"
                alt="Aaron Services"
                width={sizes.logo}
                height={sizes.logo}
                className="object-contain"
                priority
                onError={() => setLogoError(true)}
              />
            </div>
            <Image
              src="/images/brand/Loader-logo.png"
              alt="Aaron Services"
              width={sizes.logo}
              height={sizes.logo}
              className="relative object-contain animate-pulse"
              priority
              onError={() => setLogoError(true)}
            />
          </div>
        ) : (
          /* Fallback: Spinner tradicional si el logo no existe */
          <div className={`${sizes.spinner} animate-spin rounded-full border-4 border-blue-600 border-t-transparent`} />
        )}

        {/* Mensaje */}
        {message && (
          <span className={`${sizes.text} text-gray-600 font-medium`}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
}

