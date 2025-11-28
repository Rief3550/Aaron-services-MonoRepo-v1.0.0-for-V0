import { IsEmail, IsString, MinLength, IsOptional, IsNumber, ValidateIf } from 'class-validator';

export class SignupDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

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

export class SigninDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  password: string;
}

export class VerifyEmailDto {
  @ValidateIf((o) => !o.code)
  @IsString()
  @IsOptional()
  token?: string;

  @ValidateIf((o) => !o.token)
  @IsString()
  @IsOptional()
  code?: string;

  // Email es requerido si se usa código
  @ValidateIf((o) => !!o.code)
  @IsEmail()
  @IsOptional()
  email?: string;
}
