import { IsOptional, IsString } from 'class-validator';

export class DateRangeDto {
  @IsOptional()
  @IsString()
  from?: string; // ISO date string

  @IsOptional()
  @IsString()
  to?: string; // ISO date string
}
