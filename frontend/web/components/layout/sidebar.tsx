/**
 * Sidebar Component
 * Presentation layer - Barra lateral de navegación
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/hooks/use-auth';

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  roles?: string[]; // Roles permitidos para ver este item
}

const navItems: NavItem[] = [
  // ===== VISTAS COMUNES (Todos los usuarios autenticados) =====
  {
    label: 'Dashboard',
    href: '/dashboard',
  },
  {
    label: 'Solicitudes',
    href: '/solicitudes',
  },
  
  // ===== VISTAS OPERADOR (OPERATOR y ADMIN) =====
  {
    label: 'Órdenes de Trabajo',
    href: '/ordenes',
    roles: ['ADMIN', 'OPERATOR'],
  },
  {
    label: 'Cuadrillas',
    href: '/cuadrillas',
    roles: ['ADMIN', 'OPERATOR'],
  },
  {
    label: 'Planes',
    href: '/planes',
    roles: ['ADMIN', 'OPERATOR'],
  },
  {
    label: 'Clientes',
    href: '/clientes',
    roles: ['ADMIN', 'OPERATOR'],
  },
  
  // ===== VISTAS SOLO ADMIN =====
  {
    label: '--- Administración ---',
    href: '#admin-section',
    roles: ['ADMIN'],
  },
  {
    label: 'Panel Admin',
    href: '/admin',
    roles: ['ADMIN'],
  },
  {
    label: 'Gestión Usuarios',
    href: '/admin/usuarios',
    roles: ['ADMIN'],
  },
  {
    label: 'Gestión Cuadrillas',
    href: '/admin/cuadrillas',
    roles: ['ADMIN'],
  },
  {
    label: 'Tipos de Trabajo',
    href: '/admin/tipos-trabajo',
    roles: ['ADMIN'],
  },
  {
    label: 'Gestión Planes',
    href: '/admin/planes',
    roles: ['ADMIN'],
  },
  {
    label: 'Suscripciones',
    href: '/admin/suscripciones',
    roles: ['ADMIN'],
  },
  {
    label: 'Configuración',
    href: '/configuracion',
    roles: ['ADMIN'],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { hasAnyRole } = useAuth();

  // Filtrar items según rol del usuario
  const visibleItems = navItems.filter((item) => {
    if (!item.roles || item.roles.length === 0) {
      return true; // Item visible para todos
    }
    return hasAnyRole(item.roles);
  });

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white">
      <div className="flex h-full flex-col">
        {/* Logo/Header */}
        <div className="flex h-32 items-center justify-center border-b border-gray-800 px-4 py-4">
          <div className="relative w-52 h-full">
             <Image 
                src="/images/brand/logo-BLANCO-v1.png" 
                alt="Aaron Services" 
                fill
                className="object-contain"
                priority
             />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const isSeparator = item.href.startsWith('#');

            // Render separator
            if (isSeparator) {
              return (
                <div key={item.href} className="pt-4 pb-2 px-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {item.label.replace(/---/g, '').trim()}
                  </p>
                </div>
              );
            }

            // Render normal link
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                {item.icon && <span className="text-lg">{item.icon}</span>}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-800 p-4">
          <div className="text-xs text-gray-400">
            © 2025 Aaron Services
          </div>
        </div>
      </div>
    </aside>
  );
}

