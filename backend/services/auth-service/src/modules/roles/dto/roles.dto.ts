import { IsString, IsArray, IsUUID, IsOptional } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class AssignRolesDto {
  @IsArray()
  @IsUUID(undefined, { each: true })
  roleIds: string[];
}

