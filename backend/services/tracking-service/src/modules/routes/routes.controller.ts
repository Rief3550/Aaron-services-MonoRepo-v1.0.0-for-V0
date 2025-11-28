import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../ws/guards/jwt-auth.guard';

import { RouteQueryDto } from './dto/route-query.dto';
import { RouteSummaryQueryDto } from './dto/route-summary-query.dto';
import { RoutesService } from './routes.service';

@UseGuards(JwtAuthGuard)
@Controller('track')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get('route')
  async getRoute(@Query() query: RouteQueryDto) {
    return this.routesService.getRoute(query);
  }

  @Get('summary')
  async listSummaries(@Query() query: RouteSummaryQueryDto) {
    return this.routesService.listSummaries(query);
  }
}
