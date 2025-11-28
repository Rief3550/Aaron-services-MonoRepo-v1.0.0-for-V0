import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export enum CrewAvailability {
  AVAILABLE = 'AVAILABLE',
  BUSY = 'BUSY',
  OFFLINE = 'OFFLINE',
}

export class AdminCreateCrewDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  zona?: string;

  @IsEnum(CrewAvailability)
  @IsOptional()
  availability?: CrewAvailability;

  @IsArray()
  @IsOptional()
  members?: string[];

  @IsString()
  @IsOptional()
  notes?: string;
}

export class AdminUpdateCrewDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  zona?: string;

  @IsEnum(CrewAvailability)
  @IsOptional()
  availability?: CrewAvailability;

  @IsArray()
  @IsOptional()
  members?: string[];

  @IsString()
  @IsOptional()
  notes?: string;
}
