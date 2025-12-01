import { IsString, IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';

export class PingDto {
  @IsString()
  crewId: string;

  @IsString()
  orderId: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @IsOptional()
  @IsEnum(['realtime', 'hourly_api'])
  source?: 'realtime' | 'hourly_api';
}
