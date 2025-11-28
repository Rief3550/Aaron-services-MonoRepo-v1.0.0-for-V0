/**
 * Request ID Interceptor
 * Agrega x-request-id a todos los requests para trazabilidad
 * Si el cliente envía x-request-id o x-correlation-id, se usa ese valor
 * De lo contrario, se genera un UUID
 */
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 as uuid } from 'uuid';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<any>();
    const res = http.getResponse();

    // Obtener request ID del header (si existe) o generar uno nuevo
    const incomingId =
      (req.headers?.['x-request-id'] as string) ||
      (req.headers?.['x-correlation-id'] as string);
    const id = incomingId || uuid();

    // Attach to req para uso en logs downstream
    (req as any).id = id;

    // Echo header al cliente (para trazabilidad)
    res.setHeader('x-request-id', id);

    return next.handle();
  }
}
