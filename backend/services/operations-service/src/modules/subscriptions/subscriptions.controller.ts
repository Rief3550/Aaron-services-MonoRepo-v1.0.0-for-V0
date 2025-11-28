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
import { CurrentUser } from '../../common/decorators/user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import { SubscriptionFiltersDto } from './dto/subscription-filters.dto';
import { CreateSubscriptionDto, ManualPaymentDto, UpdateSubscriptionStatusDto } from './dto/subscriptions.dto';
import { UpdateSubscriptionStateDto } from './dto/update-subscription-state.dto';
import { SubscriptionsService } from './subscriptions.service';


@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // =========================================
  // ENDPOINTS PARA CLIENTE MÓVIL (App)
  // =========================================

  /**
   * Cliente obtiene su suscripción actual
   * GET /ops/subscriptions/me
   */
  @Get('me')
  @Roles('CUSTOMER', 'ADMIN')
  async getMySubscription(@CurrentUser() user: { userId: string }) {
    return this.subscriptionsService.findByUserId(user.userId);
  }

  /**
   * Cliente solicita upgrade/cambio de plan
   * POST /ops/subscriptions/me/upgrade-request
   */
  @Post('me/upgrade-request')
  @HttpCode(HttpStatus.OK)
  @Roles('CUSTOMER')
  async requestUpgrade(
    @CurrentUser() user: { userId: string },
    @Body('planId') planId: string,
    @Body('reason') reason?: string,
  ) {
    return this.subscriptionsService.requestUpgrade(user.userId, planId, reason);
  }

  // =========================================
  // ENDPOINTS PARA ADMIN/OPERATOR
  // =========================================

  @Get()
  @Roles('ADMIN', 'OPERATOR')
  async list(@Query() filters: SubscriptionFiltersDto) {
    return this.subscriptionsService.list(filters.userId, filters.status);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN')
  async create(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(dto);
  }

  @Patch(':id/upgrade')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN')
  async upgrade(@Param('id') id: string, @Body('planId') planId: string) {
    return this.subscriptionsService.upgrade(id, planId);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN')
  async cancel(@Param('id') id: string) {
    return this.subscriptionsService.cancel(id);
  }

  @Patch(':id/charge')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN')
  async charge(@Param('id') id: string) {
    return this.subscriptionsService.charge(id);
  }

  @Post(':id/payments/manual')
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN', 'OPERATOR')
  async manualPayment(@Param('id') id: string, @Body() dto: ManualPaymentDto) {
    return this.subscriptionsService.recordManualPayment({ ...dto, subscriptionId: id });
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN')
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateSubscriptionStatusDto) {
    return this.subscriptionsService.updateStatus(id, dto);
  }

  /**
   * Cambiar estado de suscripción (usado por operadores para aprobar auditoría)
   * REVISION -> ACTIVE
   */
  @Patch(':id/state')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'OPERATOR')
  async changeState(@Param('id') id: string, @Body() dto: UpdateSubscriptionStateDto) {
    return this.subscriptionsService.changeState(id, dto.estado, dto.observacion);
  }
}
