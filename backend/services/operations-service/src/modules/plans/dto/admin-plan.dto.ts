import { IsArray, IsBoolean, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class AdminCreatePlanDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  price: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsObject()
  @IsOptional()
  restrictions?: Record<string, any>;

  @IsArray()
  @IsOptional()
  workTypeIds?: string[];

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class AdminUpdatePlanDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsObject()
  @IsOptional()
  restrictions?: Record<string, any>;

  @IsArray()
  @IsOptional()
  workTypeIds?: string[];

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
