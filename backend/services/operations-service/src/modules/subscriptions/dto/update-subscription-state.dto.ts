import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SubscriptionStatus } from '@aaron/prisma-client-ops';

export class UpdateSubscriptionStateDto {
  @IsEnum(SubscriptionStatus)
  estado: SubscriptionStatus;

  @IsOptional()
  @IsString()
  observacion?: string;
}
