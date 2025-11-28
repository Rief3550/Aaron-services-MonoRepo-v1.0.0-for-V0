import { IsOptional, IsString } from 'class-validator';

export class MapFiltersDto {
  @IsOptional()
  @IsString()
  from?: string; // ISO date string

  @IsOptional()
  @IsString()
  to?: string; // ISO date string

  @IsOptional()
  @IsString()
  estado?: string; // Can be comma-separated for multiple states

  @IsOptional()
  @IsString()
  crewId?: string;
}
