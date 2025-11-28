import { Result } from '@aaron/common';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import { ListPlansDto } from './dto/list-plans.dto';
import { CreatePlanDto, UpdatePlanDto } from './dto/plans.dto';
import { PlansService } from './plans.service';


@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @Roles('ADMIN', 'OPERATOR')
  async list(@Query() query: ListPlansDto) {
    const activeOnly = query.activeOnly ?? true;
    const result = await this.plansService.list(activeOnly);
    if (Result.isError(result)) throw result.error;
    return Result.unwrap(result);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN')
  async create(@Body() dto: CreatePlanDto) {
    const result = await this.plansService.create(dto);
    if (Result.isError(result)) throw result.error;
    return Result.unwrap(result);
  }

  @Patch(':id')
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    const result = await this.plansService.update(id, dto);
    if (Result.isError(result)) throw result.error;
    return Result.unwrap(result);
  }

  @Get(':id/price-history')
  @Roles('ADMIN', 'OPERATOR')
  async getPriceHistory(@Param('id') id: string) {
    const result = await this.plansService.getPriceHistory(id);
    if (Result.isError(result)) throw result.error;
    return Result.unwrap(result);
  }
}
