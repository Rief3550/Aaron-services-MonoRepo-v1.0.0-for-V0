import { Result } from '@aaron/common';
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
  UnauthorizedException,
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
  ApproveClientDto,
} from './dto/clients.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { CrewsService } from '../crews/crews.service';

@Controller('clients')
export class ClientsController {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly crewsService: CrewsService,
  ) {}

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
  async getMyProfile(@CurrentUser() user: any) {
    if (!user?.userId) {
      throw new UnauthorizedException('Invalid session');
    }

    if (this.isCrewOnly(user)) {
      const crewResult = await this.crewsService.findByMember(user.userId);
      if (Result.isError(crewResult)) throw crewResult.error;
      const crew = Result.unwrap(crewResult);
      return {
        isCrew: true,
        crewId: crew.id,
        name: crew.name,
        state: crew.state,
        availability: crew.availability,
        progress: crew.progress,
        lat: crew.lat,
        lng: crew.lng,
        members: crew.members,
        updatedAt: crew.updatedAt,
      };
    }

    return this.clientsService.findByUserId(user.userId);
  }

  /**
   * Cliente obtiene solo el estado/estatus de su cuenta (App móvil)
   * GET /ops/clients/me/status
   */
  @Get('me/status')
  @UseGuards(JwtAuthGuard)
  async getMyStatus(@CurrentUser() user: any) {
    if (!user?.userId) {
      throw new UnauthorizedException('Invalid session');
    }

    if (this.isCrewOnly(user)) {
      const crewResult = await this.crewsService.findByMember(user.userId);
      if (Result.isError(crewResult)) throw crewResult.error;
      const crew = Result.unwrap(crewResult);
      const canOperate = crew.state !== 'offline';

      return {
        isCrew: true,
        crewId: crew.id,
        estado: (crew.state || 'ACTIVO').toUpperCase(),
        canOperate,
        message: canOperate
          ? 'Tu cuadrilla está activa y puede operar.'
          : 'Tu cuadrilla no está disponible en este momento.',
        lat: crew.lat,
        lng: crew.lng,
        updatedAt: crew.updatedAt,
        lastReviewAt: crew.lastLocationAt,
      };
    }

    return this.clientsService.getStatusByUserId(user.userId);
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

  /**
   * Admin/Operator: Aprobar y activar un cliente completo (endpoint unificado)
   * POST /ops/clients/:id/approve
   * 
   * Actualiza datos del cliente, propiedad, crea/actualiza suscripción, contrato y activa el cliente
   */
  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async approveClient(
    @Param('id') id: string,
    @Body() dto: ApproveClientDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.clientsService.approveClient(id, dto, user.userId);
  }

  private isCrewOnly(user: any): boolean {
    const roles = Array.isArray(user?.roles)
      ? user.roles
          .map((role: string) => (typeof role === 'string' ? role.toUpperCase() : undefined))
          .filter((role): role is string => Boolean(role))
      : [];
    return roles.includes('CREW') && !roles.includes('CUSTOMER');
  }
}
