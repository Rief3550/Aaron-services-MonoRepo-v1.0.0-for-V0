import { Result } from '@aaron/common';

import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';

import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import { AdminCreateSubscriptionDto, AdminUpdateSubscriptionDto, AdminUpdateSubscriptionStatusDto } from './dto/admin-subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/subscriptions')
export class AdminSubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN')
  async list(@Query('userId') userId?: string, @Query('status') status?: string) {
    const result = await this.subscriptionsService.list(userId, status);
    if (Result.isError(result)) throw result.error;
    return Result.unwrap(result);
  }

  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN')
  async create(@Body() dto: AdminCreateSubscriptionDto) {
    const result = await this.subscriptionsService.adminCreate(dto);
    if (Result.isError(result)) throw result.error;
    return Result.unwrap(result);
  }

  @Put(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async update(@Param('id') id: string, @Body() dto: AdminUpdateSubscriptionDto) {
    const result = await this.subscriptionsService.adminUpdate(id, dto);
    if (Result.isError(result)) throw result.error;
    return Result.unwrap(result);
  }

  @Patch(':id/estado')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async changeStatus(@Param('id') id: string, @Body() dto: AdminUpdateSubscriptionStatusDto) {
    const result = await this.subscriptionsService.adminChangeStatus(id, dto);
    if (Result.isError(result)) throw result.error;
    return Result.unwrap(result);
  }
}
