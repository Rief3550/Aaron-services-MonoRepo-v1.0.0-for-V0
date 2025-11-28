import { Result } from '@aaron/common';
import { Controller, Get, UseGuards } from '@nestjs/common';

import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import { WorkTypesService } from './work-types.service';

/**
 * Controller público de tipos de trabajo
 * Usado por la app del cliente para listar servicios disponibles
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('work-types')
export class WorkTypesController {
  constructor(private readonly workTypesService: WorkTypesService) {}

  /**
   * Lista tipos de trabajo activos para la app
   * GET /ops/work-types
   */
  @Get()
  @Roles('CUSTOMER', 'ADMIN', 'OPERATOR')
  async listActive() {
    const result = await this.workTypesService.listActive();
    if (Result.isError(result)) throw result.error;
    return Result.unwrap(result);
  }
}

