/**
 * Componente de formulario de login
 * Presentation layer - Formulario de inicio de sesión para administradores
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';

export interface LoginFormData {
  email: string;
  password: string;
}

export interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function LoginForm({ onSubmit, isLoading = false, error }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Validación de email
    if (!email || !validateEmail(email)) {
      setLocalError('Por favor ingresa un email válido');
      return;
    }

    // Validación de contraseña
    if (!password) {
      setLocalError('La contraseña es requerida');
      return;
    }

    try {
      await onSubmit({
        email,
        password,
      });
    } catch {
      // El error será manejado por el componente padre
    }
  };

  const displayError = error || localError;

  return (
    <div className="flex h-screen">
      {/* Panel Izquierdo - Formulario */}
      <div className="flex w-full flex-col items-center justify-center pb-32 bg-white px-4 py-12 lg:w-[35%] lg:pl-16 lg:pr-8 sm:px-6">
        <div className="w-full max-w-sm space-y-6">
          {/* Logo/Branding */}
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-80 w-full items-end justify-center overflow-hidden pb-4">
              <Image
                src="/images/brand/logo_naranja.png"
                alt="Aaron Services Logo"
                width={800}
                height={600}
                className="object-contain scale-125"
                priority
              />
            </div>
            <h1 className="text-2xl font-light text-gray-800 tracking-tight mb-12 -mt-8">Bienvenido de nuevo</h1>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Error Message */}
            {displayError && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-800">{displayError}</div>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="relative block w-full rounded-lg border-0 bg-yellow-50 px-4 py-4 pr-10 text-gray-900 ring-1 ring-inset ring-yellow-100 placeholder:text-gray-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-orange-500 text-base sm:leading-6 shadow-sm"
                  placeholder="admin@aaron.com"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="relative block w-full rounded-lg border-0 bg-yellow-50 px-4 py-4 pr-10 text-gray-900 ring-1 ring-inset ring-yellow-100 placeholder:text-gray-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-orange-500 text-base sm:leading-6 shadow-sm"
                  placeholder="Contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fillRule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                        clipRule="evenodd"
                      />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full justify-center rounded-lg bg-[#F9782E] px-4 py-3 text-base font-bold text-white hover:bg-[#e06520] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F9782E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Panel Derecho - Imagen lateral con border radius */}
      <div className="hidden lg:flex lg:w-[65%] items-center justify-center p-6 bg-white">
        <div className="relative w-[105%] h-[calc(100vh-3rem)] rounded-[40px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <Image
            src="/images/auth/login-side.jpg"
            alt="Aaron Services"
            fill
            className="object-cover"
            priority
          />
          {/* Overlay para mejorar contraste de texto si es necesario */}
          <div className="absolute inset-0 bg-black/10" />

          {/* Copyright Strip */}
          <div className="absolute bottom-0 left-0 right-0 z-10">
            <div className="mx-4 mb-4 rounded-2xl bg-[rgba(18,24,35,0.82)] border border-white/10 backdrop-blur px-6 py-3 flex flex-col sm:flex-row items-center justify-between text-[11px] leading-tight text-white/70 uppercase tracking-[0.08em]">
              <p className="font-medium text-white/80">
                © 2025 Aaron Services · todos los derechos reservados
              </p>
              <p className="text-white/60 font-semibold sm:mt-0 mt-2">
                términos de servicio · política de privacidad
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

