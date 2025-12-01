import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import {
  CreateClientInternalDto,
  CreateClientManualDto,
  UpdateClientDto,
  UpdateClientStatusDto,
  ClientFiltersDto,
  AssignAuditorDto,
  ActivateClientDto,
} from './dto/clients.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  /**
   * Endpoint interno para crear cliente desde auth-service
   * Se llama automáticamente cuando un CUSTOMER se registra
   * POST /ops/clients/internal/create
   */
  @Post('internal/create')
  async createFromSignup(
    @Body() dto: CreateClientInternalDto,
    @Headers('x-internal-key') internalKey: string,
  ) {
    // Validar que la llamada viene de un servicio interno
    const expectedKey = process.env.INTERNAL_SERVICE_KEY || 'aaron-internal-key';
    if (internalKey !== expectedKey) {
      return { success: false, error: 'Unauthorized internal call' };
    }

    try {
      const client = await this.clientsService.createFromSignup(dto);
      return { success: true, data: client };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create client' 
      };
    }
  }

  /**
   * Admin/Operator: Crea cliente manualmente desde el panel web
   * (sin verificación de email, para clientes especiales)
   * POST /ops/clients/manual
   */
  @Post('manual')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async createManual(
    @Body() dto: CreateClientManualDto,
    @CurrentUser() user: { userId: string },
  ) {
    try {
      return await this.clientsService.createManual(dto, user.userId);
    } catch (error) {
      console.error('[ClientsController] Error creating manual client:', error);
      throw error; // Re-throw para que NestJS lo maneje con el exception filter
    }
  }

  /**
   * Cliente obtiene sus propios datos (App móvil)
   * GET /ops/clients/me
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyProfile(@CurrentUser() user: { userId: string }) {
    return this.clientsService.findByUserId(user.userId);
  }

  /**
   * Admin: Lista todos los clientes
   * GET /ops/clients
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async findAll(@Query() filters: ClientFiltersDto) {
    return this.clientsService.findAll(filters);
  }

  /**
   * Admin: Lista clientes pendientes de auditoría
   * GET /ops/clients/pending
   */
  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERATOR', 'AUDITOR')
  async findPending() {
    return this.clientsService.findPendingClients();
  }

  /**
   * Admin: Obtiene un cliente por ID
   * GET /ops/clients/:id
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERATOR', 'AUDITOR')
  async findOne(@Param('id') id: string) {
    return this.clientsService.findById(id);
  }

  /**
   * Admin/Operator/Auditor: Actualiza datos del cliente
   * PATCH /ops/clients/:id
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERATOR', 'AUDITOR')
  async update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(id, dto);
  }

  /**
   * Admin/Operator: Actualiza estado del cliente
   * PATCH /ops/clients/:id/status
   */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateClientStatusDto,
  ) {
    return this.clientsService.updateStatus(id, dto);
  }

  /**
   * Admin/Operator: Asigna un auditor/cuadrilla a un cliente pendiente
   * POST /ops/clients/:id/assign-auditor
   */
  @Post(':id/assign-auditor')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async assignAuditor(
    @Param('id') id: string,
    @Body() dto: AssignAuditorDto,
  ) {
    return this.clientsService.assignAuditor(id, dto.auditorId, dto.auditorNombre);
  }

  /**
   * Admin/Auditor: Marca cliente como EN_PROCESO cuando se completa la auditoría
   * PATCH /ops/clients/:id/mark-in-process
   */
  @Patch(':id/mark-in-process')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERATOR', 'AUDITOR')
  async markAsInProcess(
    @Param('id') id: string,
    @Body() body?: { fechaVisita?: string },
  ) {
    const fechaVisita = body?.fechaVisita ? new Date(body.fechaVisita) : undefined;
    return this.clientsService.markAsInProcess(id, fechaVisita);
  }

  /**
   * Admin/Operator: Activa un cliente después de la auditoría (EN_PROCESO → ACTIVO)
   * PATCH /ops/clients/:id/activate
   */
  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async activateClient(
    @Param('id') id: string,
    @Body() dto?: ActivateClientDto,
  ) {
    return this.clientsService.activateClient(id, dto?.observaciones);
  }
}

