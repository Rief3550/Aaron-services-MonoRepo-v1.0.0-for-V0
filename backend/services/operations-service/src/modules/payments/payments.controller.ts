import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';

import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import { CreatePaymentIntentDto, ManualPaymentInputDto, ProcessPaymentDto } from './dto/payments.dto';
import { PaymentsService } from './payments.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

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
}
