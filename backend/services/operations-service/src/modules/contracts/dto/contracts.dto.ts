import { 
  IsString, 
  IsOptional, 
  IsUUID, 
  IsNumber, 
  IsBoolean, 
  IsEnum, 
  IsArray,
  ValidateNested,
  IsDateString 
} from 'class-validator';
import { Type } from 'class-transformer';

// Enums (deben coincidir con Prisma)
export enum TipoTramite {
  ALTA = 'ALTA',
  BAJA = 'BAJA',
  MODIFICACION = 'MODIFICACION',
  REINCORPORACION = 'REINCORPORACION',
}

export enum FormaPago {
  EFECTIVO = 'EFECTIVO',
  TRANSFERENCIA = 'TRANSFERENCIA',
  TARJETA_CREDITO = 'TARJETA_CREDITO',
  TARJETA_DEBITO = 'TARJETA_DEBITO',
  DEBITO_AUTOMATICO = 'DEBITO_AUTOMATICO',
  MERCADO_PAGO = 'MERCADO_PAGO',
}

export enum EstadoContrato {
  BORRADOR = 'BORRADOR',
  PENDIENTE_FIRMA = 'PENDIENTE_FIRMA',
  FIRMADO = 'FIRMADO',
  VIGENTE = 'VIGENTE',
  VENCIDO = 'VENCIDO',
  RESCINDIDO = 'RESCINDIDO',
}

// Especificación del contrato (tabla del formulario)
export class EspecificacionDto {
  @IsOptional()
  @IsNumber()
  cantidad?: number;

  @IsString()
  especificacion: string;

  @IsOptional()
  @IsString()
  observacion?: string;
}

// Cláusulas del contrato
export class ClausulasDto {
  @IsBoolean()
  compromiso: boolean;

  @IsBoolean()
  precio: boolean;

  @IsBoolean()
  vigencia: boolean;

  @IsBoolean()
  rescision: boolean;

  @IsBoolean()
  cesion: boolean;
}

// Firma digital
export class FirmaDigitalDto {
  @IsString()
  firmaData: string; // Base64 de la imagen de la firma

  @IsOptional()
  @IsString()
  nombreFirmante?: string;

  @IsOptional()
  @IsString()
  cargoFirmante?: string;

  @IsOptional()
  @IsString()
  ip?: string;

  @IsOptional()
  @IsString()
  dispositivo?: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;
}

/**
 * DTO para crear un contrato nuevo (inicio del proceso)
 */
export class CreateContractDto {
  @IsUUID()
  clientId: string;

  @IsOptional()
  @IsUUID()
  propertyId?: string;

  @IsOptional()
  @IsEnum(TipoTramite)
  tipoTramite?: TipoTramite;

  @IsOptional()
  @IsUUID()
  planId?: string;

  @IsOptional()
  @IsString()
  ciudadFirma?: string;
}

/**
 * DTO completo para firmar el contrato (auditor in-situ)
 */
export class SignContractDto {
  // Datos del cliente (completa los que faltan)
  @IsOptional()
  @IsString()
  nombreCompleto?: string;

  @IsOptional()
  @IsString()
  tipoDocumento?: string;

  @IsOptional()
  @IsString()
  documento?: string;

  @IsOptional()
  @IsString()
  cuilCuit?: string;

  @IsOptional()
  @IsString()
  sexo?: string;

  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string;

  @IsOptional()
  @IsString()
  nacionalidad?: string;

  @IsOptional()
  @IsString()
  estadoCivil?: string;

  @IsOptional()
  @IsBoolean()
  discapacitado?: boolean;

  @IsOptional()
  @IsString()
  cargo?: string;

  // Contacto
  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  telefonoCelular?: string;

  @IsOptional()
  @IsString()
  telefonoEmergencia?: string;

  // Dirección
  @IsOptional()
  @IsString()
  calle?: string;

  @IsOptional()
  @IsString()
  numero?: string;

  @IsOptional()
  @IsString()
  piso?: string;

  @IsOptional()
  @IsString()
  departamento?: string;

  @IsOptional()
  @IsString()
  localidad?: string;

  @IsOptional()
  @IsString()
  partido?: string;

  @IsOptional()
  @IsString()
  provincia?: string;

  @IsOptional()
  @IsString()
  codigoPostal?: string;

  // Datos de empresa (si aplica)
  @IsOptional()
  @IsString()
  razonSocial?: string;

  @IsOptional()
  @IsString()
  cuitEmpresa?: string;

  // Plan y pago
  @IsUUID()
  planId: string;

  @IsEnum(FormaPago)
  formaPago: FormaPago;

  @IsNumber()
  valorCuotaMensual: number;

  @IsOptional()
  @IsNumber()
  valorCuotaInicial?: number;

  // Especificaciones adicionales
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EspecificacionDto)
  especificaciones?: EspecificacionDto[];

  // Cláusulas aceptadas
  @ValidateNested()
  @Type(() => ClausulasDto)
  clausulas: ClausulasDto;

  // Firma del cliente
  @ValidateNested()
  @Type(() => FirmaDigitalDto)
  firmaCliente: FirmaDigitalDto;

  // Firma del representante de la empresa
  @ValidateNested()
  @Type(() => FirmaDigitalDto)
  firmaEmpresa: FirmaDigitalDto;

  // Ubicación de firma
  @IsString()
  ciudadFirma: string;

  @IsOptional()
  @IsNumber()
  latFirma?: number;

  @IsOptional()
  @IsNumber()
  lngFirma?: number;

  // Vigencia
  @IsOptional()
  @IsDateString()
  fechaVigenciaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaVigenciaFin?: string;

  // Observaciones
  @IsOptional()
  @IsString()
  observaciones?: string;
}

/**
 * DTO para actualizar estado del contrato
 */
export class UpdateContractStatusDto {
  @IsEnum(EstadoContrato)
  estado: EstadoContrato;

  @IsOptional()
  @IsString()
  motivo?: string;
}

/**
 * DTO para filtrar contratos
 */
export class ContractFiltersDto {
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsEnum(EstadoContrato)
  estado?: EstadoContrato;

  @IsOptional()
  @IsEnum(TipoTramite)
  tipoTramite?: TipoTramite;

  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;
}

