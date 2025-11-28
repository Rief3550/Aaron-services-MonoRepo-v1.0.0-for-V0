import { IsDateString, IsOptional, IsString, IsUUID, IsNumber, Min, IsEnum } from 'class-validator';

export enum SubscriptionStatusDto {
  ACTIVE = 'ACTIVE',
  GRACE = 'GRACE',
  PAST_DUE = 'PAST_DUE',
  SUSPENDED = 'SUSPENDED',
  CANCELED = 'CANCELED',
  PAUSED = 'PAUSED',
}

export class CreateSubscriptionDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  planId: string;

  @IsOptional()
  @IsUUID()
  propertyId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  billingDay?: number;

  @IsOptional()
  @IsDateString()
  currentPeriodStart?: string;

  @IsOptional()
  @IsDateString()
  currentPeriodEnd?: string;
}

export class ManualPaymentDto {
  @IsUUID()
  subscriptionId: string;

  @IsNumber()
  @Min(0)
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

export class UpdateSubscriptionStatusDto {
  @IsEnum(SubscriptionStatusDto)
  status: SubscriptionStatusDto;

  @IsOptional()
  @IsString()
  reason?: string;
}
