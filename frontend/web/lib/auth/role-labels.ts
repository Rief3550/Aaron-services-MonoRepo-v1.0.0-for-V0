const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  OPERATOR: 'Operador',
  CREW: 'Cuadrilla',
  CUSTOMER: 'Cliente',
};

export const formatRoleLabel = (role?: string): string => {
  if (!role) return 'Rol';
  const key = role.toUpperCase();
  return ROLE_LABELS[key] || role;
};

export const formatRolesList = (roles: string[] = []): string =>
  roles.map((r) => formatRoleLabel(r)).join(', ');
