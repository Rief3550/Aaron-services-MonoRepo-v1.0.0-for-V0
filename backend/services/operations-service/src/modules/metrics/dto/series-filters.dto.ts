import { IsIn, IsOptional, IsString } from 'class-validator';

export class SeriesFiltersDto {
  @IsOptional()
  @IsString()
  from?: string; // ISO date string

  @IsOptional()
  @IsString()
  to?: string; // ISO date string

  @IsOptional()
  @IsString()
  @IsIn(['day', 'month'])
  groupBy?: 'day' | 'month';
}
