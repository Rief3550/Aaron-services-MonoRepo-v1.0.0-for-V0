import { IsString, IsOptional, IsDateString } from 'class-validator';

export class RouteQueryDto {
  @IsString()
  crewId: string;

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

