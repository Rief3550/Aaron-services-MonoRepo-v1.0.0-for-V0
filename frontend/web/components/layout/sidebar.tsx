/**
 * Sidebar Component
 * Presentation layer - Barra lateral de navegación
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/hooks/use-auth';

// --- Iconos SVG ---
const IconDashboard = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
);
const IconSolicitudes = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
);
const IconOrdenes = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>
);
const IconCuadrillas = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const IconPlanes = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
);
const IconClientes = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const IconAdmin = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
);
const IconUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 21a8 8 0 0 0-16 0"/><circle cx="10" cy="8" r="5"/><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"/></svg>
);
const IconTools = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
);
const IconSettings = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 1-2-2v.09a2 2 0 0 1-2 1.41 2 2 0 0 1-2-1.41V2a2 2 0 0 1-2 2h-.44a2 2 0 0 1-2 2v.09a2 2 0 0 1-2 1.41 2 2 0 0 1-2-1.41V4a2 2 0 0 1-2 2h-.44a2 2 0 0 1-2 2v.09a2 2 0 0 1-2 1.41 2 2 0 0 1-2-1.41V8a2 2 0 0 1-2 2h-.44a2 2 0 0 1-2 2v.09a2 2 0 0 1-2 1.41 2 2 0 0 1-2-1.41V12a2 2 0 0 1-2 2h-.44a2 2 0 0 1-2 2v.09a2 2 0 0 1-2 1.41 2 2 0 0 1-2-1.41V16a2 2 0 0 1-2 2h-.44a2 2 0 0 1-2 2v.09a2 2 0 0 1-2 1.41 2 2 0 0 1-2-1.41V20a2 2 0 0 1-2 2h-.44a2 2 0 0 1-2 2v.09a2 2 0 0 1-2 1.41 2 2 0 0 1-2-1.41V22a2 2 0 0 1-2 2h-.44a2 2 0 0 1-2 2v.09a2 2 0 0 1-2 1.41 2 2 0 0 1-2-1.41V2a2 2 0 0 1-2 2ZM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/></svg>
);
const IconList = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
);

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
    icon: <IconDashboard />,
  },
  {
    label: 'Solicitudes',
    href: '/solicitudes',
    icon: <IconSolicitudes />,
  },
  
  // ===== VISTAS OPERADOR (OPERATOR y ADMIN) =====
  {
    label: 'Órdenes de Trabajo',
    href: '/ordenes',
    icon: <IconOrdenes />,
    roles: ['ADMIN', 'OPERATOR'],
  },
  {
    label: 'Cuadrillas',
    href: '/cuadrillas',
    icon: <IconCuadrillas />,
    roles: ['ADMIN', 'OPERATOR'],
  },
  {
    label: 'Planes',
    href: '/planes',
    icon: <IconPlanes />,
    roles: ['ADMIN', 'OPERATOR'],
  },
  {
    label: 'Clientes',
    href: '/clientes',
    icon: <IconClientes />,
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
    icon: <IconAdmin />,
    roles: ['ADMIN'],
  },
  {
    label: 'Gestión Usuarios',
    href: '/admin/usuarios',
    icon: <IconUsers />,
    roles: ['ADMIN'],
  },
  {
    label: 'Gestión Cuadrillas',
    href: '/admin/cuadrillas',
    icon: <IconTools />,
    roles: ['ADMIN'],
  },
  {
    label: 'Tipos de Trabajo',
    href: '/admin/tipos-trabajo',
    icon: <IconList />,
    roles: ['ADMIN'],
  },
  {
    label: 'Gestión Planes',
    href: '/admin/planes',
    icon: <IconPlanes />,
    roles: ['ADMIN'],
  },
  {
    label: 'Suscripciones',
    href: '/admin/suscripciones',
    icon: <IconList />,
    roles: ['ADMIN'],
  },
  {
    label: 'Configuración',
    href: '/configuracion',
    icon: <IconSettings />,
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
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#294C75] text-white rounded-r-4xl overflow-hidden border-r border-white/10 shadow-xl z-50">
      <div className="flex h-full flex-col">
        {/* Logo/Header */}
        <div className="flex h-32 items-center justify-center border-b border-white/10 px-4 py-4">
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
                  <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">
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
                    ? 'bg-white/10 text-white shadow-inner'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
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
        <div className="border-t border-white/10 p-4">
          <div className="text-xs text-white/60">
            © 2025 Aaron Services
          </div>
        </div>
      </div>
    </aside>
  );
}

