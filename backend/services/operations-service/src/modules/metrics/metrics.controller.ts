import { Result } from '@aaron/common';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import { DateRangeDto } from './dto/date-range.dto';
import { SeriesFiltersDto } from './dto/series-filters.dto';
import { MetricsService } from './metrics.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('overview')
  @Roles('ADMIN', 'OPERATOR')
  async getOverview() {
    const result = await this.metricsService.getOverview();
    if (Result.isError(result)) throw result.error;
    return Result.unwrap(result);
  }

  @Get('operator/summary')
  @Roles('ADMIN', 'OPERATOR')
  async getOperatorSummary(@Query() filters: DateRangeDto) {
    const result = await this.metricsService.getOperatorSummary({
      from: filters.from,
      to: filters.to,
    });
    if (Result.isError(result)) throw result.error;
    return Result.unwrap(result);
  }

  @Get('operator/orders-by-status-series')
  @Roles('ADMIN', 'OPERATOR')
  async getOrdersByStatusSeries(@Query() filters: SeriesFiltersDto) {
    const result = await this.metricsService.getOrdersByStatusSeries({
      from: filters.from,
      to: filters.to,
      groupBy: filters.groupBy,
    });
    if (Result.isError(result)) throw result.error;
    return Result.unwrap(result);
  }
  @Get('admin/resumen')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAdminSummary(@Query() filters: DateRangeDto) {
    const result = await this.metricsService.getAdminSummary(filters);
    if (Result.isError(result)) throw result.error;
    return Result.unwrap(result);
  }

  @Get('admin/suscripciones-por-plan')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getSubscriptionsByPlan(@Query() filters: DateRangeDto) {
    const result = await this.metricsService.getSubscriptionsByPlan(filters);
    if (Result.isError(result)) throw result.error;
    return Result.unwrap(result);
  }

  @Get('admin/altas-bajas-timeline')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getSubscriptionsTimeline(@Query() filters: SeriesFiltersDto) {
    const result = await this.metricsService.getSubscriptionsTimeline({
      from: filters.from,
      to: filters.to,
      groupBy: filters.groupBy,
    });
    if (Result.isError(result)) throw result.error;
    return Result.unwrap(result);
  }

  @Get('admin/servicios-recurrentes')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getRecurringServices(@Query() filters: DateRangeDto) {
    const result = await this.metricsService.getRecurringServices(filters);
    if (Result.isError(result)) throw result.error;
    return Result.unwrap(result);
  }

  @Get('admin/suscripciones-vencidas')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getOverdueSubscriptions(@Query() filters: DateRangeDto) {
    const result = await this.metricsService.getOverdueSubscriptions(filters);
    if (Result.isError(result)) throw result.error;
    return Result.unwrap(result);
  }
}
