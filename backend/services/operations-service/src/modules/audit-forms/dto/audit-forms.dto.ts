import { IsString, IsOptional, IsEnum, IsUUID, IsBoolean, IsObject, IsDateString, IsArray } from 'class-validator';
import { TipoTramite, FormaPago } from '@aaron/prisma-client-ops';

export class CreateAuditFormDto {
  @IsUUID()
  clientId: string;

  @IsOptional()
  @IsEnum(TipoTramite)
  tipoTramite?: TipoTramite;

  @IsOptional()
  @IsBoolean()
  esOriginal?: boolean;

  @IsOptional()
  @IsBoolean()
  esComplementaria?: boolean;

  @IsOptional()
  @IsDateString()
  fechaTramite?: string;

  @IsOptional()
  @IsDateString()
  fechaVigenciaCobertura?: string;

  @IsOptional()
  @IsUUID()
  planId?: string;

  @IsOptional()
  @IsString()
  planNombre?: string;

  @IsOptional()
  @IsString()
  motivoCambioPlan?: string;

  @IsOptional()
  @IsString()
  cobertura?: string;

  @IsOptional()
  @IsString()
  motivoCambioCobertura?: string;

  @IsOptional()
  @IsEnum(FormaPago)
  formaPago?: FormaPago;

  @IsOptional()
  @IsUUID()
  ejecutivoId?: string;

  @IsOptional()
  @IsString()
  ejecutivoNombre?: string;

  @IsOptional()
  @IsString()
  motivoBaja?: string;

  @IsOptional()
  @IsArray()
  especificaciones?: Array<{
    cantidad: number;
    especificacion: string;
    observacion?: string;
  }>;

  @IsOptional()
  @IsObject()
  datosCompletos?: any; // JSON completo del formulario
}

export class UpdateAuditFormDto {
  @IsOptional()
  @IsEnum(TipoTramite)
  tipoTramite?: TipoTramite;

  @IsOptional()
  @IsBoolean()
  esOriginal?: boolean;

  @IsOptional()
  @IsBoolean()
  esComplementaria?: boolean;

  @IsOptional()
  @IsDateString()
  fechaTramite?: string;

  @IsOptional()
  @IsDateString()
  fechaVigenciaCobertura?: string;

  @IsOptional()
  @IsUUID()
  planId?: string;

  @IsOptional()
  @IsString()
  planNombre?: string;

  @IsOptional()
  @IsString()
  motivoCambioPlan?: string;

  @IsOptional()
  @IsString()
  cobertura?: string;

  @IsOptional()
  @IsString()
  motivoCambioCobertura?: string;

  @IsOptional()
  @IsEnum(FormaPago)
  formaPago?: FormaPago;

  @IsOptional()
  @IsUUID()
  ejecutivoId?: string;

  @IsOptional()
  @IsString()
  ejecutivoNombre?: string;

  @IsOptional()
  @IsString()
  motivoBaja?: string;

  @IsOptional()
  @IsArray()
  especificaciones?: Array<{
    cantidad: number;
    especificacion: string;
    observacion?: string;
  }>;

  @IsOptional()
  @IsObject()
  datosCompletos?: any;

  @IsOptional()
  @IsBoolean()
  completado?: boolean;
}


