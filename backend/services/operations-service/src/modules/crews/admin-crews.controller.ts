import { Result } from '@aaron/common';

import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';

import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import { AdminCreateCrewDto, AdminUpdateCrewDto } from './dto/admin-crew.dto';
import { CrewsService } from './crews.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/crews')
export class AdminCrewsController {
  constructor(private readonly crewsService: CrewsService) {}

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN')
  async list() {
    const result = await this.crewsService.list();
    if (Result.isError(result)) throw result.error;
    return Result.unwrap(result);
  }

  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN')
  async create(@Body() dto: AdminCreateCrewDto) {
    const result = await this.crewsService.create(dto);
    if (Result.isError(result)) throw result.error;
    return Result.unwrap(result);
  }

  @Put(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async update(@Param('id') id: string, @Body() dto: AdminUpdateCrewDto) {
    const result = await this.crewsService.update(id, dto);
    if (Result.isError(result)) throw result.error;
    return Result.unwrap(result);
  }

  @Delete(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async delete(@Param('id') id: string) {
    const result = await this.crewsService.delete(id);
    if (Result.isError(result)) throw result.error;
    return { success: true };
  }
}
