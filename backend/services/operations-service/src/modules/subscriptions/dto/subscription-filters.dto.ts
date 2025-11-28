import { IsOptional, IsString } from 'class-validator';

export class SubscriptionFiltersDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

