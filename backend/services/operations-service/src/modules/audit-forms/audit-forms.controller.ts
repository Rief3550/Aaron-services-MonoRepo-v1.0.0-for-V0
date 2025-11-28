import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuditFormsService } from './audit-forms.service';
import { CreateAuditFormDto, UpdateAuditFormDto } from './dto/audit-forms.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';

@Controller('audit-forms')
export class AuditFormsController {
  constructor(private readonly auditFormsService: AuditFormsService) {}

  /**
   * Admin/Auditor: Crea o actualiza formulario de auditoría
   * POST /ops/audit-forms
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERATOR', 'AUDITOR')
  async create(@Body() dto: CreateAuditFormDto) {
    return this.auditFormsService.upsert(dto.clientId, dto);
  }

  /**
   * Admin/Auditor: Actualiza formulario de auditoría
   * PATCH /ops/audit-forms/:clientId
   */
  @Patch(':clientId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERATOR', 'AUDITOR')
  async update(
    @Param('clientId') clientId: string,
    @Body() dto: UpdateAuditFormDto,
  ) {
    return this.auditFormsService.upsert(clientId, dto);
  }

  /**
   * Admin/Auditor: Obtiene formulario de auditoría de un cliente
   * GET /ops/audit-forms/client/:clientId
   */
  @Get('client/:clientId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERATOR', 'AUDITOR')
  async findByClientId(@Param('clientId') clientId: string) {
    return this.auditFormsService.findByClientId(clientId);
  }

  /**
   * Admin/Auditor: Marca formulario como completado
   * PATCH /ops/audit-forms/:clientId/complete
   */
  @Patch(':clientId/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERATOR', 'AUDITOR')
  async markAsCompleted(
    @Param('clientId') clientId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.auditFormsService.markAsCompleted(clientId, user.userId);
  }

  /**
   * Admin: Lista todos los formularios
   * GET /ops/audit-forms
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async findAll(@Query('completado') completado?: string) {
    const completadoBool = completado === 'true' ? true : completado === 'false' ? false : undefined;
    return this.auditFormsService.findAll(completadoBool);
  }
}


