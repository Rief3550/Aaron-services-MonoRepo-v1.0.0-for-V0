import { Result } from '@aaron/common';

import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';

import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import { AdminCreatePlanDto, AdminUpdatePlanDto } from './dto/admin-plan.dto';
import { PlansService } from './plans.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/plans')
export class AdminPlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN')
  async list() {
    const result = await this.plansService.list(false); // Include inactive
    if (Result.isError(result)) throw result.error;
    return Result.unwrap(result);
  }

  @Get(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async findOne(@Param('id') id: string) {
    const result = await this.plansService.findById(id);
    if (Result.isError(result)) throw result.error;
    return Result.unwrap(result);
  }

  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN')
  async create(@Body() dto: AdminCreatePlanDto) {
    const result = await this.plansService.create(dto);
    if (Result.isError(result)) throw result.error;
    return Result.unwrap(result);
  }

  @Put(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async update(@Param('id') id: string, @Body() dto: AdminUpdatePlanDto) {
    const result = await this.plansService.update(id, dto);
    if (Result.isError(result)) throw result.error;
    return Result.unwrap(result);
  }

  @Delete(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async delete(@Param('id') id: string) {
    const result = await this.plansService.delete(id);
    if (Result.isError(result)) throw result.error;
    return { success: true };
  }
}
