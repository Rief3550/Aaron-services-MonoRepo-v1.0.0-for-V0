import { Type } from 'class-transformer';
import { IsString, IsNumber, IsOptional, IsPositive, IsObject, IsDateString } from 'class-validator';

export class CreatePaymentIntentDto {
  @IsString()
  subscriptionId: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class ProcessPaymentDto {
  @IsString()
  intentId: string;

  @IsString()
  status: string; // success|failed|pending

  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class ManualPaymentInputDto {
  @IsString()
  subscriptionId: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
