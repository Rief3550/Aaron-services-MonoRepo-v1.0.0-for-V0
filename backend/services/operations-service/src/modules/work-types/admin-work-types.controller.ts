import { Result } from '@aaron/common';

import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';

import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import { CreateWorkTypeDto, UpdateWorkTypeDto } from './dto/work-type.dto';
import { WorkTypesService } from './work-types.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/work-types')
export class AdminWorkTypesController {
  constructor(private readonly workTypesService: WorkTypesService) {}

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN')
  async list() {
    const result = await this.workTypesService.list();
    if (Result.isError(result)) throw result.error;
    return Result.unwrap(result);
  }

  @Get(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async findOne(@Param('id') id: string) {
    const result = await this.workTypesService.findById(id);
    if (Result.isError(result)) throw result.error;
    return Result.unwrap(result);
  }

  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN')
  async create(@Body() dto: CreateWorkTypeDto) {
    const result = await this.workTypesService.create(dto);
    if (Result.isError(result)) throw result.error;
    return Result.unwrap(result);
  }

  @Put(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async update(@Param('id') id: string, @Body() dto: UpdateWorkTypeDto) {
    const result = await this.workTypesService.update(id, dto);
    if (Result.isError(result)) throw result.error;
    return Result.unwrap(result);
  }

  @Delete(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async delete(@Param('id') id: string) {
    const result = await this.workTypesService.delete(id);
    if (Result.isError(result)) throw result.error;
    return { success: true };
  }
}
