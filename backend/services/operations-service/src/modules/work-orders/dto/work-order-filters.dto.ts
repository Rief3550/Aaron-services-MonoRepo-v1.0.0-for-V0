import { IsOptional, IsString } from 'class-validator';

export class WorkOrderFiltersDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  crewId?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  prioridad?: string;

  @IsOptional()
  @IsString()
  workTypeId?: string;

  @IsOptional()
  @IsString()
  from?: string; // ISO date string

  @IsOptional()
  @IsString()
  to?: string; // ISO date string

  @IsOptional()
  @IsString()
  search?: string; // Search across ID, client name, address
}
