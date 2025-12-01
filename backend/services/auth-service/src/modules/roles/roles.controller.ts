import { Roles } from '@aaron/auth';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { toApiResponse } from '../common/api-response.util';

import { CreateRoleDto, UpdateRoleDto, AssignRolesDto } from './dto/roles.dto';
import { RolesService } from './roles.service';

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@SkipThrottle()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateRoleDto) {
    const result = await this.rolesService.create(dto);
    return toApiResponse(result);
  }

  @Get()
  async list() {
    const result = await this.rolesService.list();
    return toApiResponse(result);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const result = await this.rolesService.getById(id);
    return toApiResponse(result);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    const result = await this.rolesService.update(id, dto);
    return toApiResponse(result);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const result = await this.rolesService.delete(id);
    return toApiResponse(result, { message: 'Role deleted successfully' });
  }

  @Post(':userId/assign')
  @HttpCode(HttpStatus.OK)
  async assignRoles(@Param('userId') userId: string, @Body() dto: AssignRolesDto) {
    const result = await this.rolesService.assignRoles(userId, dto.roleIds);
    return toApiResponse(result);
  }

  @Post(':userId/remove')
  @HttpCode(HttpStatus.OK)
  async removeRoles(@Param('userId') userId: string, @Body() dto: AssignRolesDto) {
    const result = await this.rolesService.removeRoles(userId, dto.roleIds);
    return toApiResponse(result);
  }
}
