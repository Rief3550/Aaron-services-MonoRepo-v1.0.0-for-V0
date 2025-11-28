import { IsString, IsOptional, IsArray, IsNumber, Min, Max } from 'class-validator';

export class CreateCrewDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsArray()
  members?: any[];
}

export class UpdateCrewStateDto {
  @IsString()
  state: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;
}


export class UpdateCrewLocationDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}
