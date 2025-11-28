/**
 * Componente base de formulario de autenticación
 * Presentation layer - Formulario reutilizable para login y signup
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';

export type AuthMode = 'signin' | 'signup';

export interface AuthFormProps {
  mode: AuthMode;
  onSubmit: (data: AuthFormData) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  switchMode?: (mode: AuthMode) => void;
}

export interface AuthFormData {
  email: string;
  password: string;
  fullName?: string;
  rememberMe?: boolean;
}

export function AuthForm({ mode, onSubmit, isLoading = false, error, switchMode }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const isSignup = mode === 'signup';

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

    if (isSignup && password.length < 8) {
      setLocalError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    try {
      await onSubmit({
        email,
        password,
        fullName: isSignup ? fullName : undefined,
        rememberMe: !isSignup ? rememberMe : undefined,
      });
    } catch (err) {
      // El error será manejado por el componente padre
    }
  };

  const displayError = error || localError;

  return (
    <div className="flex h-screen">
      {/* Panel Izquierdo - Formulario */}
      <div className="flex w-full flex-col items-center justify-center bg-white px-4 py-12 sm:w-2/3 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo/Branding */}
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-black">
              <span className="text-2xl font-bold text-white">A</span>
            </div>
            <h1 className="mt-4 text-3xl font-bold text-gray-900">Aaron Backoffice</h1>
          </div>

          {/* Tabs */}
          {switchMode && (
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  !isSignup
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  isSignup
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Welcome Message */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900">
              {isSignup ? '¡Bienvenido!' : 'Bienvenido de nuevo'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {isSignup
                ? 'Crea tu cuenta para comenzar'
                : 'Estamos felices de verte de nuevo'}
            </p>
          </div>

          {/* Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {/* Error Message */}
            {displayError && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-800">{displayError}</div>
              </div>
            )}

            {/* Full Name (solo en signup) */}
            {isSignup && (
              <div>
                <label htmlFor="fullName" className="sr-only">
                  Nombre completo
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="relative block w-full rounded-md border-0 px-4 py-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  placeholder="Nombre completo (opcional)"
                />
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
                  className="relative block w-full rounded-md border-0 px-4 py-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  placeholder="Email"
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
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="relative block w-full rounded-md border-0 px-4 py-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  placeholder="Contraseña"
                  minLength={isSignup ? 8 : undefined}
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

            {/* Remember Me & Forgot Password (solo en signin) */}
            {!isSignup && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link href="#" className="font-medium text-blue-600 hover:text-blue-500">
                    Forgot password?
                  </Link>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading
                  ? isSignup
                    ? 'Creando cuenta...'
                    : 'Iniciando sesión...'
                  : isSignup
                  ? 'Sign Up'
                  : 'Login'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Panel Derecho - Imagen de fondo con diseño moderno */}
      <div className="hidden sm:flex sm:w-1/3 relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 overflow-hidden">
        {/* Patrón de fondo decorativo con ondas */}
        <div className="absolute inset-0 opacity-30">
          <svg
            className="absolute inset-0 h-full w-full"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1200 800"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.05)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
              </linearGradient>
            </defs>
            <path
              d="M0,400 Q300,200 600,400 T1200,400 L1200,800 L0,800 Z"
              fill="url(#wave-gradient)"
            />
            <path
              d="M0,500 Q400,300 800,500 T1600,500 L1600,800 L0,800 Z"
              fill="url(#wave-gradient)"
              opacity="0.5"
            />
          </svg>
        </div>
        
        {/* Formas decorativas animadas - ondas fluidas */}
        <div className="absolute inset-0">
          {/* Círculo grande superior izquierdo */}
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-400/30 blur-3xl animate-pulse" 
               style={{ animationDuration: '4s' }} />
          
          {/* Círculo medio central */}
          <div className="absolute top-1/3 right-1/4 h-80 w-80 rounded-full bg-blue-300/25 blur-3xl animate-pulse" 
               style={{ animationDelay: '1.5s', animationDuration: '5s' }} />
          
          {/* Círculo grande inferior derecho */}
          <div className="absolute -bottom-32 -right-32 h-[32rem] w-[32rem] rounded-full bg-blue-500/20 blur-3xl animate-pulse" 
               style={{ animationDelay: '3s', animationDuration: '6s' }} />
          
          {/* Círculo pequeño flotante */}
          <div className="absolute bottom-1/4 left-1/3 h-64 w-64 rounded-full bg-blue-200/20 blur-2xl animate-pulse" 
               style={{ animationDelay: '2s', animationDuration: '4s' }} />
        </div>

        {/* Copyright */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-6">
          <div className="rounded-lg bg-black/30 backdrop-blur-md border border-white/10 p-4 text-white text-xs shadow-lg">
            <p className="font-medium">© 2025 Aaron Services. All rights reserved.</p>
            <p className="mt-1 text-white/70">
              Unauthorized use or reproduction of any content or materials from this prohibited.
              For more information, visit our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

