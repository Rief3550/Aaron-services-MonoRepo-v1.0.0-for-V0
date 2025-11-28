import { IsOptional, IsString } from 'class-validator';

export class CrewFiltersDto {
  @IsOptional()
  @IsString()
  state?: string;
}

