import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export enum AdminSubscriptionStatus {
  ACTIVE = 'ACTIVE',
  REVISION = 'REVISION',
  GRACE = 'GRACE',
  PAST_DUE = 'PAST_DUE',
  SUSPENDED = 'SUSPENDED',
  CANCELED = 'CANCELED',
  PAUSED = 'PAUSED',
}

export class AdminCreateSubscriptionDto {
  @IsString()
  userId: string;

  @IsString()
  planId: string;

  @IsString()
  @IsOptional()
  propertyId?: string;

  @IsEnum(AdminSubscriptionStatus)
  @IsOptional()
  status?: AdminSubscriptionStatus;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @IsOptional()
  billingDay?: number;
}

export class AdminUpdateSubscriptionDto {
  @IsString()
  @IsOptional()
  planId?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @IsOptional()
  billingDay?: number;
}

export class AdminUpdateSubscriptionStatusDto {
  @IsEnum(AdminSubscriptionStatus)
  status: AdminSubscriptionStatus;

  @IsString()
  @IsOptional()
  reason?: string;
}
