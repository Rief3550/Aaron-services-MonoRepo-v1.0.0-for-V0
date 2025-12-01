import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import { CreatePaymentIntentDto, ManualPaymentInputDto, ProcessPaymentDto } from './dto/payments.dto';
import { PaymentsService } from './payments.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // =========================================
  // ENDPOINTS PARA CLIENTE (App)
  // =========================================
  @Get('me')
  @Roles('CUSTOMER', 'ADMIN')
  async myPayments(@CurrentUser() user: { userId: string }) {
    return this.paymentsService.findByUserId(user.userId);
  }

  @Post('me/ticket')
  @HttpCode(HttpStatus.CREATED)
  @Roles('CUSTOMER', 'ADMIN')
  async createTicket(
    @CurrentUser() user: { userId: string },
    @Body('amount') amount?: number,
    @Body('note') note?: string,
  ) {
    return this.paymentsService.createCustomerTicket(user.userId, { amount, note });
  }

  // =========================================
  // ENDPOINTS ADMIN/OPERATOR
  // =========================================
  @Post('intent')
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN', 'OPERATOR')
  async createIntent(@Body() dto: CreatePaymentIntentDto) {
    return this.paymentsService.createIntent(dto);
  }

  @Post('process')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'OPERATOR')
  async process(@Body() dto: ProcessPaymentDto) {
    return this.paymentsService.process(dto);
  }

  @Post('manual')
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN', 'OPERATOR')
  async manual(@Body() dto: ManualPaymentInputDto) {
    return this.paymentsService.recordManual(dto);
  }

  @Get()
  @Roles('ADMIN', 'OPERATOR')
  async list(
    @Query('subscriptionId') subscriptionId?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
  ) {
    return this.paymentsService.list({ subscriptionId, userId, status });
  }
}
