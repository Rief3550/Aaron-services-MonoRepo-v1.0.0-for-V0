import {
  BadRequestException,
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

import { LocationUpdateDto } from './dto/location-update.dto';
import { MapFiltersDto } from './dto/map-filters.dto';
import { WorkOrderFiltersDto } from './dto/work-order-filters.dto';
import { CreateWorkOrderDto, UpdateWorkOrderStateDto, CreateWorkOrderRequestDto, WorkOrderFeedbackDto, WorkOrderIssueDto } from './dto/work-orders.dto';
import { WorkOrdersService } from './work-orders.service';


@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  // =========================================
  // ENDPOINTS PARA CLIENTE MÓVIL (App)
  // =========================================

  /**
   * Cliente obtiene sus órdenes de trabajo (activas e históricas)
   * GET /ops/work-orders/me
   */
  @Get('me')
  @Roles('CUSTOMER', 'ADMIN')
  async getMyOrders(@CurrentUser() user: { userId: string }) {
    return this.workOrdersService.findMyOrders(user.userId);
  }

  /**
   * Solicita una nueva orden de trabajo (normalizado para mobile y web)
   * POST /ops/work-orders/request
   * 
   * - CUSTOMER: Crea orden para su propia cuenta (prioridad se calcula automáticamente)
   * - ADMIN/OPERATOR: Puede crear orden para cualquier cliente (especificar customerId en body)
   */
  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  @Roles('CUSTOMER', 'ADMIN', 'OPERATOR')
  async createRequest(
    @CurrentUser() user: { userId: string; roles?: string[] },
    @Body() dto: CreateWorkOrderRequestDto,
  ) {
    // Si es ADMIN/OPERATOR y especifica customerId, usar ese. Si no, usar el userId del usuario autenticado
    const customerId = (dto as any).customerId || user.userId;
    // Determinar el rol del usuario para la lógica de prioridad
    // CUSTOMER no puede especificar prioridad, se calcula automáticamente
    const userRole = (user.roles && (user.roles.includes('ADMIN') || user.roles.includes('OPERATOR')))
      ? 'ADMIN' 
      : 'CUSTOMER';
    const result = await this.workOrdersService.createRequest(customerId, dto, userRole);
    if (result._tag === 'error') {
      throw new BadRequestException(result.error?.message || 'Failed to create work order request');
    }
    return result.value;
  }

  /**
   * Cliente obtiene detalle de una orden específica
   * GET /ops/work-orders/me/:id
   */
  @Get('me/:id')
  @Roles('CUSTOMER', 'ADMIN')
  async getMyOrderById(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.workOrdersService.findMyOrderById(user.userId, id);
  }

  /**
   * Calendario de visitas/turnos para el cliente
   * GET /ops/work-orders/me/calendar
   */
  @Get('me/calendar')
  @Roles('CUSTOMER', 'ADMIN')
  async getMyCalendar(@CurrentUser() user: { userId: string }) {
    return this.workOrdersService.getMyCalendar(user.userId);
  }

  /**
   * Timeline para cliente (solo su orden)
   * GET /ops/work-orders/me/:id/timeline
   */
  @Get('me/:id/timeline')
  @Roles('CUSTOMER', 'ADMIN')
  async getMyTimeline(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.workOrdersService.getMyTimeline(user.userId, id);
  }

  /**
   * Cliente cancela una orden pendiente/programada propia
   * PATCH /ops/work-orders/me/:id/cancel
   */
  @Patch('me/:id/cancel')
  @Roles('CUSTOMER', 'ADMIN')
  async cancelMyOrder(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.workOrdersService.cancelByCustomer(user.userId, id, reason);
  }

  /**
   * Cliente deja feedback sobre una orden finalizada
   * POST /ops/work-orders/:id/feedback
   */
  @Post(':id/feedback')
  @HttpCode(HttpStatus.OK)
  @Roles('CUSTOMER', 'ADMIN')
  async feedback(
    @CurrentUser() user: { userId: string; roles?: string[] },
    @Param('id') id: string,
    @Body() dto: WorkOrderFeedbackDto,
  ) {
    return this.workOrdersService.addFeedback(user.userId, id, dto);
  }

  /**
   * Cliente/operador reporta incidencia asociada a una orden
   * POST /ops/work-orders/:id/issue
   */
  @Post(':id/issue')
  @HttpCode(HttpStatus.OK)
  @Roles('CUSTOMER', 'ADMIN', 'OPERATOR')
  async issue(
    @CurrentUser() user: { userId: string; roles?: string[] },
    @Param('id') id: string,
    @Body() dto: WorkOrderIssueDto,
  ) {
    return this.workOrdersService.addIssue(user.userId, id, dto);
  }

  // =========================================
  // ENDPOINTS PARA ADMIN/OPERATOR
  // =========================================

  @Get()
  @Roles('ADMIN', 'OPERATOR')
  async list(@Query() filters: WorkOrderFiltersDto) {
    return this.workOrdersService.list({
      customerId: filters.customerId,
      crewId: filters.crewId,
      state: filters.state,
      type: filters.type,
      prioridad: filters.prioridad,
      workTypeId: filters.workTypeId,
      from: filters.from,
      to: filters.to,
      search: filters.search,
    });
  }

  @Get('map')
  @Roles('ADMIN', 'OPERATOR')
  async getMapData(@Query() filters: MapFiltersDto) {
    return this.workOrdersService.getMapData({
      from: filters.from,
      to: filters.to,
      estado: filters.estado,
      crewId: filters.crewId,
    });
  }

  @Get(':id')
  @Roles('ADMIN', 'OPERATOR')
  async findOne(@Param('id') id: string) {
    return this.workOrdersService.findOne(id);
  }

  /**
   * Admin/Operator: Crea una orden de trabajo desde el sistema web (método legacy)
   * POST /ops/work-orders
   * 
   * Nota: Se recomienda usar POST /ops/work-orders/request con CreateWorkOrderRequestDto
   * para mantener consistencia entre mobile y web
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN', 'OPERATOR')
  async create(@Body() dto: CreateWorkOrderDto) {
    return this.workOrdersService.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() dto: Partial<CreateWorkOrderDto>) {
    return this.workOrdersService.update(id, dto);
  }

  @Patch(':id/state')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'OPERATOR')
  async changeState(@Param('id') id: string, @Body() dto: UpdateWorkOrderStateDto) {
    return this.workOrdersService.changeState(id, dto);
  }

  @Patch(':id/assign-crew/:crewId')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'OPERATOR')
  async assignCrew(
    @Param('id') id: string,
    @Param('crewId') crewId: string,
    @Body('note') note?: string,
  ) {
    return this.workOrdersService.assignCrew(id, crewId, note);
  }

  @Patch(':id/progress')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'OPERATOR')
  async updateProgress(@Param('id') id: string, @Body('progress') progress: number) {
    return this.workOrdersService.updateProgress(id, progress);
  }

  @Get(':id/timeline')
  @Roles('ADMIN', 'OPERATOR')
  async getTimeline(@Param('id') id: string) {
    return this.workOrdersService.getTimeline(id);
  }

  @Post(':id/location')
  @HttpCode(HttpStatus.ACCEPTED)
  @Roles('ADMIN', 'OPERATOR')
  async pushLocation(
    @Param('id') id: string,
    @Body() dto: LocationUpdateDto,
  ) {
    return this.workOrdersService.recordLocationUpdate(id, dto);
  }
}
