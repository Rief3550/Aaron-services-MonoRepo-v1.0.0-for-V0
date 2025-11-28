import { IsString, IsEmail, IsOptional, IsEnum, IsUUID, IsNumber } from 'class-validator';
import { TipoPersona, EstadoCliente } from '@aaron/prisma-client-ops';

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
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;
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

