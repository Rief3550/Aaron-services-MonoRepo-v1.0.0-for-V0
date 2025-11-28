/**
 * Middleware para soft delete
 */
export function softDeleteMiddleware(params: any, next: any) {
  // Implementación de soft delete
  // Si la acción es delete, cambiar a update con deletedAt
  if (params.action === 'delete') {
    params.action = 'update';
    params.args.data = { ...params.args.data, deletedAt: new Date() };
  }
  
  if (params.action === 'findMany' || params.action === 'findFirst') {
    if (!params.args.where) {
      params.args.where = {};
    }
    params.args.where.deletedAt = null;
  }
  
  return next(params);
}

