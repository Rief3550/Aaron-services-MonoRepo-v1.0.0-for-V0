import { TipoPersona, EstadoCliente } from '@aaron/prisma-client-ops';
import { IsString, IsEmail, IsOptional, IsEnum, IsUUID, IsNumber, IsInt } from 'class-validator';

export class CreateClientDto {
  @IsUUID()
  userId: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  telefono?: string;
}

export class CreateClientInternalDto {
  @IsUUID()
  userId: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;
}

/**
 * DTO para crear cliente manualmente desde el panel web (sin verificación de email)
 * Usado por ADMIN/OPERATOR para clientes especiales o con dificultades
 * Incluye: Cliente + Propiedad + Plan + Suscripción (todo en uno)
 */
export class CreateClientManualDto {
  // === DATOS DEL CLIENTE ===
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsString()
  fullName: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  documento?: string;

  @IsOptional()
  @IsString()
  direccionFacturacion?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  // === DATOS DE LA PROPIEDAD ===
  @IsString()
  address: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

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

  // === PLAN Y SUSCRIPCIÓN ===
  @IsUUID()
  planId: string;

  @IsOptional()
  @IsString()
  observacionesPropiedad?: string;
}

export class UpdateClientDto {
  @IsOptional()
  @IsEnum(TipoPersona)
  tipoPersona?: TipoPersona;

  @IsOptional()
  @IsString()
  nombreCompleto?: string;

  @IsOptional()
  @IsString()
  razonSocial?: string;

  @IsOptional()
  @IsString()
  documento?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  telefonoAlt?: string;

  @IsOptional()
  @IsString()
  direccionFacturacion?: string;

  @IsOptional()
  @IsString()
  provincia?: string;

  @IsOptional()
  @IsString()
  ciudad?: string;

  @IsOptional()
  @IsString()
  codigoPostal?: string;
}

export class UpdateClientStatusDto {
  @IsEnum(EstadoCliente)
  estado: EstadoCliente;
}

export class ClientFiltersDto {
  @IsOptional()
  @IsEnum(EstadoCliente)
  estado?: EstadoCliente;

  @IsOptional()
  @IsString()
  search?: string;
}

export class AssignAuditorDto {
  @IsUUID()
  auditorId: string;

  @IsOptional()
  @IsString()
  auditorNombre?: string;
}

export class ActivateClientDto {
  @IsOptional()
  @IsString()
  observaciones?: string;
}

