/**
 * Página raíz - Redirige al login o dashboard según autenticación
 */

import { redirect } from 'next/navigation';

export default function HomePage() {
  // Por defecto redirigir al login
  // El middleware y los layouts se encargarán de la lógica de autenticación
  redirect('/login');
}
