import { IsNumber, IsOptional, IsString, IsUUID, IsEnum, IsInt, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePropertyDto {
  @IsUUID()
  userId: string;

  @IsString()
  address: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  checklist?: Record<string, any>;
}

export class UpdatePropertyStatusDto {
  @IsString()
  status: string; // PRE_ONBOARD|PRE_APPROVED|ACTIVE|REJECTED

  @IsOptional()
  @IsString()
  notes?: string;
}

export class PreApprovalDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  auditorUserId?: string;

  @IsString()
  status: string; // PENDING|APPROVED|REJECTED

  @IsOptional()
  answers?: Record<string, any>;

  @IsOptional()
  attachments?: Record<string, any>;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO para capturar ubicación precisa durante auditoría
 */
export class CaptureLocationDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsOptional()
  @IsNumber()
  accuracy?: number; // Precisión del GPS en metros

  @IsOptional()
  @IsString()
  capturedBy?: string; // AUDITOR|CUSTOMER
}

/**
 * Item del checklist de auditoría
 */
export class AuditChecklistItemDto {
  @IsString()
  categoria: string; // "Instalación eléctrica", "Gas", "Humedad", etc.

  @IsString()
  descripcionItem: string;

  @IsString()
  estado: string; // OK|RIESGO_MEDIO|RIESGO_ALTO

  @IsOptional()
  @IsString()
  comentarios?: string;
}

/**
 * DTO completo para realizar auditoría in-situ
 * Incluye: coordenadas, caracterización del inmueble, checklist, y datos del contrato
 */
export class CompleteAuditDto {
  // Coordenadas precisas del domicilio (capturadas por el auditor)
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsOptional()
  @IsNumber()
  accuracy?: number;

  // Datos de la propiedad
  @IsOptional()
  @IsString()
  tipoPropiedad?: string; // DEPARTAMENTO|CASA|PH|COUNTRY|LOCAL|OTRO

  @IsOptional()
  @IsString()
  tipoConstruccion?: string; // LOSA|CHAPA|MIXTO|OTRO

  @IsOptional()
  @IsInt()
  ambientes?: number;

  @IsOptional()
  @IsInt()
  banos?: number;

  @IsOptional()
  @IsNumber()
  superficieCubiertaM2?: number;

  @IsOptional()
  @IsNumber()
  superficieDescubiertaM2?: number;

  @IsOptional()
  @IsString()
  barrio?: string;

  @IsOptional()
  @IsString()
  ciudad?: string;

  @IsOptional()
  @IsString()
  provincia?: string;

  // Checklist de auditoría
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AuditChecklistItemDto)
  checklistItems?: AuditChecklistItemDto[];

  // Datos del cliente (completados durante auditoría)
  @IsOptional()
  @IsString()
  clienteDocumento?: string;

  @IsOptional()
  @IsString()
  clienteTelefono?: string;

  @IsOptional()
  @IsString()
  clienteDireccionFacturacion?: string;

  // Plan seleccionado
  @IsOptional()
  @IsUUID()
  planId?: string;

  // Observaciones generales
  @IsOptional()
  @IsString()
  observaciones?: string;

  // Fotos (URLs o base64)
  @IsOptional()
  fotos?: string[];

  // Decisión de la auditoría
  @IsString()
  decision: string; // APPROVED|REJECTED

  @IsOptional()
  @IsString()
  motivoRechazo?: string;
}

/**
 * DTO para solicitud de mudanza/reubicación (cliente)
 */
export class RelocationRequestDto {
  @IsString()
  newAddress: string;

  @IsOptional()
  @IsNumber()
  newLat?: number;

  @IsOptional()
  @IsNumber()
  newLng?: number;

  @IsOptional()
  @IsString()
  motivo?: string;

  @IsOptional()
  fechaDeseada?: Date;
}
