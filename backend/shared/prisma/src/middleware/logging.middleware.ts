/**
 * Middleware de logging para Prisma
 */
export function loggingMiddleware(params: any, next: any) {
  const before = Date.now();
  
  return next(params).then((result: any) => {
    const after = Date.now();
    console.log(`Query ${params.model}.${params.action} took ${after - before}ms`);
    return result;
  });
}

