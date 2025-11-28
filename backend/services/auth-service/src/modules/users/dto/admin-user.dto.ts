import { IsBoolean, IsEmail, IsOptional, IsString, IsArray, IsEnum } from 'class-validator';

export class AdminCreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  fullName: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  role: string; // 'admin', 'operador', etc.

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  zone?: string; // For operators

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class AdminUpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  zone?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class UserFilterDto {
  @IsString()
  @IsOptional()
  role?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsString()
  @IsOptional()
  search?: string;
}
