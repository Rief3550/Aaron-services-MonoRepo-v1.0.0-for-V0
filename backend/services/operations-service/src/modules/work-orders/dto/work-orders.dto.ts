import { IsString, IsOptional, IsObject, IsNumber, Min, Max, IsUUID, IsEnum } from 'class-validator';

export class CreateWorkOrderDto {
  @IsUUID()
  customerId: string;

  @IsOptional()
  @IsUUID()
  propertyId?: string;

  @IsOptional()
  @IsUUID()
  subscriptionId?: string;

  @IsOptional()
  @IsUUID()
  workTypeId?: string;

  @IsString()
  address: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsString()
  serviceCategory: string;

  @IsOptional()
  @IsString()
  description?: string;

  // Cantidad y unidades del trabajo
  @IsOptional()
  @IsNumber()
  cantidad?: number; // Ej: 50 (m2), 3 (horas)

  @IsOptional()
  @IsString()
  unidadCantidad?: string; // "m2", "hora", "visita", "unidad"

  @IsOptional()
  @IsNumber()
  tiempoEstimadoHoras?: number;

  @IsOptional()
  @IsNumber()
  costoEstimado?: number;

  @IsOptional()
  @IsString()
  prioridad?: string;
}

export class UpdateWorkOrderStateDto {
  @IsString()
  state: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsObject()
  meta?: any;
}

export class WorkOrderFeedbackDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class WorkOrderIssueDto {
  @IsString()
  category: string; // facturacion|servicio|app|otro

  @IsString()
  description: string;

  @IsOptional()
  attachments?: any[];
}

/**
 * DTO para actualizar trabajo completado (operador/cuadrilla)
 */
export class UpdateWorkOrderCompletionDto {
  @IsOptional()
  @IsNumber()
  tiempoRealHoras?: number;

  @IsOptional()
  @IsNumber()
  costoFinal?: number;

  @IsOptional()
  @IsObject()
  detalleCostos?: Record<string, number>; // { manoDeObra: X, materiales: Y }

  @IsOptional()
  @IsString()
  notasOperario?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;
}

/**
 * DTO normalizado para solicitudes de órdenes de trabajo
 * Funciona tanto para app móvil como para web del sistema
 */
export class CreateWorkOrderRequestDto {
  // Permite que ADMIN/OPERATOR especifiquen para qué cliente se crea la orden
  @IsOptional()
  @IsUUID()
  customerId?: string;

  // Propiedad donde se realizará el trabajo
  @IsOptional()
  @IsUUID()
  propertyId?: string;

  // Tipo de trabajo (seleccionado del catálogo)
  @IsOptional()
  @IsUUID()
  workTypeId?: string;

  // Categoría del servicio
  @IsString()
  serviceCategory: string; // plomería|electricidad|gas|pintura|emergencia|etc.

  // Situación actual del problema
  @IsString()
  situacion: string; // Descripción de la situación actual

  // Indica si hay peligro o riesgo de accidente
  @IsOptional()
  @IsString()
  peligroAccidente?: string; // SI|NO|URGENTE

  // Observaciones adicionales del cliente
  @IsOptional()
  @IsString()
  observaciones?: string;

  // Descripción detallada (puede incluir la situación si no se usa el campo separado)
  @IsOptional()
  @IsString()
  description?: string;

  // Prioridad de la solicitud (SOLO para ADMIN/OPERATOR, CUSTOMER no puede especificarla)
  // Se calcula automáticamente basándose en peligroAccidente para CUSTOMER
  @IsOptional()
  @IsString()
  prioridad?: string; // BAJA|MEDIA|ALTA|EMERGENCIA (ignorado si es CUSTOMER)

  // Canal por el cual se realizó la solicitud
  @IsOptional()
  @IsString()
  canal?: string; // APP|WEB|TELEFONO|WHATSAPP

  // El cliente puede estimar la cantidad si lo sabe
  @IsOptional()
  @IsNumber()
  cantidadEstimada?: number;

  @IsOptional()
  @IsString()
  unidadCantidad?: string;
}
