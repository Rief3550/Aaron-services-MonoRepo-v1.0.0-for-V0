import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';

import { Roles } from '../../common/decorators/roles.decorator';
import { User, CurrentUser } from '../../common/decorators/user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import { CreatePropertyDto, PreApprovalDto, UpdatePropertyStatusDto, CompleteAuditDto, CaptureLocationDto, RelocationRequestDto } from './dto/create-property.dto';
import { PropertiesService } from './properties.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  // =========================================
  // ENDPOINTS PARA CLIENTE MÓVIL
  // =========================================

  /**
   * Cliente obtiene sus propiedades
   * GET /ops/properties/me
   */
  @Get('me')
  @Roles('CUSTOMER', 'ADMIN')
  async getMyProperties(@CurrentUser() user: { userId: string }) {
    return this.propertiesService.listMyProperties(user.userId);
  }

  /**
   * Cliente solicita mudanza/reubicación
   * POST /ops/properties/me/relocation
   */
  @Post('me/relocation')
  @HttpCode(HttpStatus.CREATED)
  @Roles('CUSTOMER')
  async requestRelocation(
    @CurrentUser() user: { userId: string },
    @Body() dto: RelocationRequestDto,
  ) {
    return this.propertiesService.requestRelocation(user.userId, dto);
  }

  // =========================================
  // ENDPOINTS PARA ADMIN/OPERATOR
  // =========================================

  @Get()
  @Roles('ADMIN', 'OPERATOR')
  async list(@Query('userId') userId?: string, @Query('clientId') clientId?: string) {
    return this.propertiesService.list(userId, clientId);
  }

  /**
   * Lista propiedades pendientes de auditoría
   * GET /ops/properties/pending-audit
   */
  @Get('pending-audit')
  @Roles('ADMIN', 'OPERATOR', 'AUDITOR')
  async listPendingAudit() {
    return this.propertiesService.listPendingAudit();
  }

  /**
   * Obtiene una propiedad por ID
   * GET /ops/properties/:id
   */
  @Get(':id')
  @Roles('ADMIN', 'OPERATOR', 'AUDITOR')
  async findOne(@Param('id') id: string) {
    return this.propertiesService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN', 'AUDITOR')
  async create(@Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(dto);
  }

  /**
   * Actualiza una propiedad
   * PUT /ops/properties/:id
   */
  @Put(':id')
  @Roles('ADMIN', 'AUDITOR')
  async update(@Param('id') id: string, @Body() dto: Partial<CreatePropertyDto>) {
    return this.propertiesService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'AUDITOR')
  async updateStatus(@Param('id') id: string, @Body() dto: UpdatePropertyStatusDto) {
    return this.propertiesService.updateStatus(id, dto);
  }

  @Post(':id/pre-approvals')
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN', 'AUDITOR')
  async preApprove(@Param('id') id: string, @Body() dto: PreApprovalDto) {
    return this.propertiesService.createPreApproval(id, dto);
  }

  // =========================================
  // ENDPOINTS DE AUDITORÍA
  // =========================================

  /**
   * Captura ubicación precisa del domicilio (GPS)
   * PUT /ops/properties/:id/location
   * Usado por el AUDITOR cuando está en el domicilio
   */
  @Put(':id/location')
  @Roles('ADMIN', 'AUDITOR')
  async captureLocation(
    @Param('id') id: string,
    @Body() dto: CaptureLocationDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.propertiesService.captureLocation(id, dto, user.userId);
  }

  /**
   * Auditoría completa in-situ
   * POST /ops/properties/:id/audit
   * 
   * Este endpoint realiza todo el proceso de auditoría:
   * - Captura coordenadas precisas
   * - Actualiza caracterización del inmueble
   * - Guarda checklist de seguridad
   * - Completa datos del cliente
   * - Crea suscripción si se aprueba
   * - Activa el cliente
   */
  @Post(':id/audit')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'AUDITOR')
  async completeAudit(
    @Param('id') id: string,
    @Body() dto: CompleteAuditDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.propertiesService.completeAudit(id, dto, user.userId);
  }
}
