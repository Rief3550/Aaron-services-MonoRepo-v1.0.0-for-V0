import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateWorkTypeDto {
  @IsString()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsNumber()
  @IsOptional()
  costoBase?: number;

  @IsString()
  @IsOptional()
  unidad?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

export class UpdateWorkTypeDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsNumber()
  @IsOptional()
  costoBase?: number;

  @IsString()
  @IsOptional()
  unidad?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
