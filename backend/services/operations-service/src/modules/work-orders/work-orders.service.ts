import { Logger, Result } from '@aaron/common';
import { Injectable } from '@nestjs/common';
import { WorkOrderState, PrioridadOrden } from '@aaron/prisma-client-ops';

import { prisma } from '../../config/database';
import {
  isValidWorkOrderTransition,
  isWorkOrderFinalState,
} from '../../utils/state-transitions';
import { EventsService } from '../events/events.service';

import { LocationUpdateDto } from './dto/location-update.dto';
import { CreateWorkOrderDto, UpdateWorkOrderStateDto } from './dto/work-orders.dto';

interface GeoLocation {
  lat: number;
  lng: number;
}

const logger = new Logger('WorkOrdersService');

@Injectable()
export class WorkOrdersService {
  constructor(private readonly eventsService: EventsService) {}

  async list(filters?: {
    customerId?: string;
    crewId?: string;
    state?: string;
    type?: string;
    prioridad?: string;
    workTypeId?: string;
    from?: string;
    to?: string;
    search?: string;
  }): Promise<Result<Error, unknown[]>> {
    try {
      // Build where clause dynamically
      const where: any = {};

      if (filters?.customerId) where.customerId = filters.customerId;
      if (filters?.crewId) where.crewId = filters.crewId;
      if (filters?.state) where.state = filters.state as WorkOrderState;
      if (filters?.type) where.serviceCategory = filters.type;
      if (filters?.prioridad) where.prioridad = filters.prioridad;
      if (filters?.workTypeId) where.workTypeId = filters.workTypeId;

      // Date range filter
      if (filters?.from || filters?.to) {
        where.createdAt = {};
        if (filters.from) where.createdAt.gte = new Date(filters.from);
        if (filters.to) where.createdAt.lte = new Date(filters.to);
      }

      // Search filter (across multiple fields)
      if (filters?.search) {
        where.OR = [
          { id: { contains: filters.search, mode: 'insensitive' } },
          { address: { contains: filters.search, mode: 'insensitive' } },
          { titulo: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      const workOrders = await prisma.workOrder.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              nombreCompleto: true,
              razonSocial: true,
              tipoPersona: true,
            },
          },
          crew: {
            select: {
              id: true,
              name: true,
              state: true,
            },
          },
          property: {
            select: {
              id: true,
              alias: true,
              address: true,
              ciudad: true,
              provincia: true,
            },
          },
          workType: {
            select: {
              id: true,
              nombre: true,
            },
          },
          subscription: true,
          _count: {
            select: { timeline: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return Result.ok(workOrders);
    } catch (error) {
      logger.error('List work orders error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to list work orders'));
    }
  }

  async findOne(id: string): Promise<Result<Error, unknown>> {
    try {
      const workOrder = await prisma.workOrder.findUnique({
        where: { id },
        include: {
          crew: true,
          property: true,
          subscription: true,
          timeline: {
            orderBy: { at: 'desc' },
          },
        },
      });

      if (!workOrder) {
        return Result.error(new Error('Work order not found'));
      }

      return Result.ok(workOrder);
    } catch (error) {
      logger.error('Find work order error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to find work order'));
    }
  }

  async getMapData(filters?: {
    from?: string;
    to?: string;
    estado?: string;
    crewId?: string;
  }): Promise<Result<Error, unknown[]>> {
    try {
      const where: any = {
        // Only include orders with coordinates
        lat: { not: null },
        lng: { not: null },
      };

      if (filters?.crewId) where.crewId = filters.crewId;

      // Multiple states support (comma-separated)
      if (filters?.estado) {
        const states = filters.estado.split(',').map(s => s.trim());
        where.state = { in: states as WorkOrderState[] };
      }

      // Date range filter
      if (filters?.from || filters?.to) {
        where.createdAt = {};
        if (filters.from) where.createdAt.gte = new Date(filters.from);
        if (filters.to) where.createdAt.lte = new Date(filters.to);
      }

      const workOrders = await prisma.workOrder.findMany({
        where,
        select: {
          id: true,
          lat: true,
          lng: true,
          state: true,
          prioridad: true,
          titulo: true,
          client: {
            select: {
              nombreCompleto: true,
              razonSocial: true,
            },
          },
          property: {
            select: {
              alias: true,
            },
          },
          workType: {
            select: {
              nombre: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Transform data for map display
      const mapData = workOrders.map(order => ({
        id: order.id,
        lat: order.lat,
        lng: order.lng,
        estado: order.state,
        prioridad: order.prioridad,
        titulo: order.titulo,
        clienteNombre: order.client?.nombreCompleto || order.client?.razonSocial || 'Sin cliente',
        propertyAlias: order.property?.alias || 'Sin alias',
        workTypeNombre: order.workType?.nombre || 'Sin tipo',
      }));

      return Result.ok(mapData);
    } catch (error) {
      logger.error('Get map data error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to get map data'));
    }
  }

  async create(dto: CreateWorkOrderDto): Promise<Result<Error, unknown>> {
    try {
      const workOrder = await prisma.workOrder.create({
        data: {
          customerId: dto.customerId,
          propertyId: dto.propertyId || null,
          subscriptionId: dto.subscriptionId || null,
          address: dto.address,
          lat: dto.lat || null,
          lng: dto.lng || null,
          location: dto.lat && dto.lng ? { lat: dto.lat, lng: dto.lng } : undefined,
          serviceCategory: dto.serviceCategory,
          description: dto.description,
          state: 'PENDIENTE',
        },
      });

      // Create initial event
      await prisma.workOrderEvent.create({
        data: {
          workOrderId: workOrder.id,
          type: 'PENDIENTE',
          stateFrom: 'PENDIENTE',
          stateTo: 'PENDIENTE',
          note: 'Orden creada',
        },
      });

      return Result.ok(workOrder);
    } catch (error) {
      logger.error('Create work order error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to create work order'));
    }
  }

  async update(id: string, dto: Partial<CreateWorkOrderDto>): Promise<Result<Error, unknown>> {
    try {
      const workOrder = await prisma.workOrder.update({
        where: { id },
        data: {
          ...(dto.address && { address: dto.address }),
          ...(dto.lat !== undefined && { lat: dto.lat }),
          ...(dto.lng !== undefined && { lng: dto.lng }),
          ...(dto.lat !== undefined && dto.lng !== undefined && { location: { lat: dto.lat, lng: dto.lng } }),
          ...(dto.serviceCategory && { serviceCategory: dto.serviceCategory }),
          ...(dto.description && { description: dto.description }),
          ...(dto.propertyId && { propertyId: dto.propertyId }),
          ...(dto.subscriptionId && { subscriptionId: dto.subscriptionId }),
        },
      });
      return Result.ok(workOrder);
    } catch (error) {
      logger.error('Update work order error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to update work order'));
    }
  }

  async changeState(id: string, dto: UpdateWorkOrderStateDto): Promise<Result<Error, unknown>> {
    try {
      const workOrder = await prisma.workOrder.findUnique({
        where: { id },
        include: { crew: true },
      });

      if (!workOrder) {
        return Result.error(new Error('Work order not found'));
      }

      const oldState = workOrder.state as WorkOrderState;
      const newState = dto.state as WorkOrderState;

      if (isWorkOrderFinalState(oldState)) {
        return Result.error(new Error(`Cannot change state from final state: ${oldState}`));
      }

      const transitionCheck = isValidWorkOrderTransition(oldState, newState);
      if (!transitionCheck.valid) {
        return Result.error(new Error(transitionCheck.reason || 'Invalid state transition'));
      }

      const updateData: Record<string, unknown> = {
        state: newState,
      };

      if (newState === 'COMENZADA' && !workOrder.startedAt) {
        updateData.startedAt = new Date();
      }

      if (newState === 'FINALIZADA') {
        updateData.completedAt = new Date();
        updateData.progress = 100;
      }

      const updated = await prisma.workOrder.update({
        where: { id },
        data: updateData,
      });

      // Create timeline event
      await prisma.workOrderEvent.create({
        data: {
          workOrderId: id,
          type: newState,
          stateFrom: oldState,
          stateTo: newState,
          note: dto.note || `Estado cambiado de ${oldState} a ${newState}`,
          meta: {
            ...dto.meta,
            fromState: oldState,
            toState: newState,
            timestamp: new Date().toISOString(),
          },
        },
      });

      // Sync crew state
      if (workOrder.crewId && workOrder.crew) {
        await this.syncCrewStateOnOrderChange(workOrder.crewId, oldState, newState);
      }

      // Publish event when state changes to PROGRAMADA/EN_PROGRESO for tracking
      if (newState === 'PROGRAMADA') {
        await this.eventsService.publishWorkOrderEnCamino({
          orderId: id,
          crewId: workOrder.crewId || null,
          targetLocation: {
            address: workOrder.address,
            lat: workOrder.lat || (workOrder.location as unknown as GeoLocation)?.lat,
            lng: workOrder.lng || (workOrder.location as unknown as GeoLocation)?.lng,
          },
          timestamp: new Date().toISOString(),
        });
      }

      await this.eventsService.publishWorkOrderStatus({
        orderId: id,
        crewId: workOrder.crewId || null,
        state: newState,
        note: dto.note,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Work order state transition: ${id} ${oldState} -> ${newState}`);
      return Result.ok(updated);
    } catch (error) {
      logger.error('Update work order state error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to update work order state'));
    }
  }

  async assignCrew(id: string, crewId: string, note?: string): Promise<Result<Error, unknown>> {
    try {
      const workOrder = await prisma.workOrder.findUnique({ where: { id } });
      if (!workOrder) {
        return Result.error(new Error('Work order not found'));
      }

      const crew = await prisma.crew.findUnique({ where: { id: crewId } });
      if (!crew) {
        return Result.error(new Error('Crew not found'));
      }

      // Cambiar a ASIGNADA (coincide con el frontend)
      const updated = await prisma.workOrder.update({
        where: { id },
        data: {
          crewId,
          state: 'ASIGNADA',
        },
        include: { crew: true },
      });

      await prisma.workOrderEvent.create({
        data: {
          workOrderId: id,
          type: 'ASIGNADA',
          stateFrom: workOrder.state as WorkOrderState,
          stateTo: 'ASIGNADA',
          note: note || `Asignada a cuadrilla: ${crew.name}`,
          meta: { crewId, crewName: crew.name },
        },
      });

      // Actualizar estado de la cuadrilla
      if (crew.state === 'desocupado') {
        await prisma.crew.update({
          where: { id: crewId },
          data: { state: 'en_camino' },
        });
      }

      logger.info(`Work order ${id} assigned to crew ${crew.name} (${crewId})`);
      return Result.ok(updated);
    } catch (error) {
      logger.error('Assign crew error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to assign crew'));
    }
  }

  async updateProgress(id: string, progress: number): Promise<Result<Error, unknown>> {
    try {
      if (progress < 0 || progress > 100) {
        return Result.error(new Error('Progress must be between 0 and 100'));
      }

      const updated = await prisma.workOrder.update({
        where: { id },
        data: { progress },
      });

      return Result.ok(updated);
    } catch (error) {
      logger.error('Update progress error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to update progress'));
    }
  }

  async getTimeline(id: string): Promise<Result<Error, unknown[]>> {
    try {
      const events = await prisma.workOrderEvent.findMany({
        where: { workOrderId: id },
        orderBy: { at: 'asc' },
      });
      return Result.ok(events);
    } catch (error) {
      logger.error('Get timeline error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to get timeline'));
    }
  }

  async recordLocationUpdate(id: string, dto: LocationUpdateDto): Promise<Result<
    Error,
    { orderId: string; crewId: string; lat: number; lng: number }
  >> {
    try {
      if (!dto.crewId) {
        return Result.error(new Error('crewId is required'));
      }

      await this.eventsService.publishLocationUpdate({
        orderId: id,
        crewId: dto.crewId,
        lat: dto.lat,
        lng: dto.lng,
        source: dto.source || 'operations_api',
        sessionId: dto.sessionId,
        timestamp: new Date().toISOString(),
      });

      return Result.ok({
        orderId: id,
        crewId: dto.crewId,
        lat: dto.lat,
        lng: dto.lng,
      });
    } catch (error) {
      logger.error('Record location update error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to record location update'));
    }
  }

  private async syncCrewStateOnOrderChange(
    crewId: string,
    oldOrderState: WorkOrderState,
    newOrderState: WorkOrderState
  ): Promise<void> {
    try {
      const crew = await prisma.crew.findUnique({ where: { id: crewId } });
      if (!crew) return;

      let newCrewState = crew.state;

      if (newOrderState === 'COMENZADA' || newOrderState === 'EN_PROGRESO') {
        newCrewState = 'en_trabajo';
      } else if (newOrderState === 'FINALIZADA' || newOrderState === 'CANCELADA') {
        const activeOrders = await prisma.workOrder.count({
          where: {
            crewId,
            state: {
              notIn: ['FINALIZADA', 'CANCELADA'],
            },
          },
        });
        if (activeOrders === 0) {
          newCrewState = 'desocupado';
        }
      }

      if (newCrewState !== crew.state) {
        await prisma.crew.update({
          where: { id: crewId },
          data: { state: newCrewState },
        });
      }
    } catch (error) {
      logger.error('Error syncing crew state', error);
    }
  }

  // =========================================
  // ENDPOINTS PARA CLIENTE MÓVIL (App)
  // =========================================

  /**
   * Obtiene las órdenes de trabajo del cliente (por userId)
   * Separadas en activas e históricas
   */
  async findMyOrders(userId: string): Promise<Result<Error, { active: unknown[]; history: unknown[] }>> {
    try {
      // Buscar el client por userId
      const client = await prisma.client.findUnique({
        where: { userId },
        select: { id: true, estado: true },
      });

      if (!client) {
        return Result.error(new Error('Client not found for this user'));
      }

      // Estados activos (en progreso)
      const activeStates: WorkOrderState[] = [
        'PENDIENTE',
        'ASIGNADA',
        'CONFIRMADA',
        'EN_CAMINO',
        'PROGRAMADA',
        'VISITA',
        'COMENZADA',
        'EN_PROGRESO',
        'PAUSADA',
      ];

      // Estados históricos (finalizados)
      const historyStates: WorkOrderState[] = [
        'FINALIZADA',
        'CANCELADA',
        'VISITADA_FINALIZADA',
      ];

      const [activeOrders, historyOrders] = await Promise.all([
        prisma.workOrder.findMany({
          where: {
            clientId: client.id,
            state: { in: activeStates },
          },
          include: {
            crew: { select: { id: true, name: true } },
            property: { select: { id: true, alias: true, address: true } },
            workType: { select: { id: true, nombre: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.workOrder.findMany({
          where: {
            clientId: client.id,
            state: { in: historyStates },
          },
          include: {
            crew: { select: { id: true, name: true } },
            property: { select: { id: true, alias: true, address: true } },
            workType: { select: { id: true, nombre: true } },
          },
          orderBy: { completedAt: 'desc' },
          take: 20, // Limitar historial
        }),
      ]);

      return Result.ok({
        active: activeOrders,
        history: historyOrders,
      });
    } catch (error) {
      logger.error('Find my orders error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to find orders'));
    }
  }

  /**
   * Cliente solicita una nueva orden de trabajo (emergencia o servicio)
   * Solo clientes ACTIVOS pueden solicitar
   */
  async createRequest(
    userId: string, 
    dto: {
      propertyId?: string;
      workTypeId?: string;
      serviceCategory: string;
      situacion: string;
      peligroAccidente?: string;
      observaciones?: string;
      description?: string;
      prioridad?: string;
      canal?: string;
      cantidadEstimada?: number;
      unidadCantidad?: string;
    },
    userRole?: string // Para determinar si es CUSTOMER o ADMIN/OPERATOR
  ): Promise<Result<Error, unknown>> {
    try {
      // Buscar el client y verificar que esté ACTIVO
      const client = await prisma.client.findUnique({
        where: { userId },
        include: {
          subscriptions: {
            where: { 
              status: 'ACTIVE',
              OR: [
                { clientId: { not: null } },
                { userId: userId },
              ],
            },
            take: 1,
          },
        },
      });

      if (!client) {
        return Result.error(new Error('Client not found'));
      }

      if (client.estado !== 'ACTIVO') {
        return Result.error(new Error('Your account is not active. Please complete the verification process.'));
      }

      // Buscar propiedad: especificada o la primera activa del usuario
      let property;
      if (dto.propertyId) {
        property = await prisma.customerProperty.findUnique({ 
          where: { id: dto.propertyId },
        });
        // Verificar que la propiedad pertenece al cliente
        if (property && property.userId !== userId) {
          return Result.error(new Error('Property does not belong to this client'));
        }
      } else {
        // Buscar primera propiedad activa del usuario
        property = await prisma.customerProperty.findFirst({
          where: {
            userId,
            status: 'ACTIVE',
          },
        });
      }

      if (!property) {
        return Result.error(new Error('No active property found. Please contact support.'));
      }

      // Verificar suscripción activa
      const subscription = client.subscriptions[0];
      if (!subscription) {
        return Result.error(new Error('No active subscription found.'));
      }

      // Determinar prioridad automáticamente basándose en peligroAccidente
      // CUSTOMER no puede especificar prioridad, se calcula automáticamente
      // ADMIN/OPERATOR pueden especificar prioridad manualmente
      let prioridadFinal: PrioridadOrden;
      
      if (userRole === 'CUSTOMER' || !userRole) {
        // Para CUSTOMER: prioridad se calcula automáticamente según peligroAccidente
        if (dto.peligroAccidente === 'URGENTE') {
          prioridadFinal = PrioridadOrden.EMERGENCIA; // Pérdida de gas, incendio, derrumbe, etc.
        } else if (dto.peligroAccidente === 'SI') {
          prioridadFinal = PrioridadOrden.ALTA; // Hay peligro pero no es urgente
        } else {
          prioridadFinal = PrioridadOrden.MEDIA; // No hay peligro (default)
        }
      } else {
        // Para ADMIN/OPERATOR: pueden especificar prioridad manualmente
        // Si no especifican, se calcula igual que para CUSTOMER
        if (dto.prioridad) {
          prioridadFinal = dto.prioridad as PrioridadOrden;
        } else {
          if (dto.peligroAccidente === 'URGENTE') {
            prioridadFinal = PrioridadOrden.EMERGENCIA;
          } else if (dto.peligroAccidente === 'SI') {
            prioridadFinal = PrioridadOrden.ALTA;
          } else {
            prioridadFinal = PrioridadOrden.MEDIA;
          }
        }
      }

      // Combinar situación y observaciones en la descripción
      const descripcionCompleta = [
        dto.situacion,
        dto.observaciones,
        dto.description,
      ].filter(Boolean).join('\n\n');

      // Crear la orden de trabajo
      const workOrder = await prisma.workOrder.create({
        data: {
          clientId: client.id,
          customerId: userId,
          propertyId: property.id,
          subscriptionId: subscription.id,
          workTypeId: dto.workTypeId,
          address: property.address,
          lat: property.lat,
          lng: property.lng,
          location: { lat: property.lat, lng: property.lng },
          serviceCategory: dto.serviceCategory,
          description: descripcionCompleta || dto.situacion,
          notasCliente: dto.observaciones || null,
          prioridad: prioridadFinal as PrioridadOrden,
          canal: (dto.canal as any) || 'APP',
          cantidad: dto.cantidadEstimada ? dto.cantidadEstimada : null,
          unidadCantidad: dto.unidadCantidad || null,
          state: 'PENDIENTE',
          createdByUserId: userId,
        },
        include: {
          property: { select: { alias: true, address: true } },
          workType: { select: { id: true, nombre: true } },
        },
      });

      // Crear evento inicial con información adicional
      await prisma.workOrderEvent.create({
        data: {
          workOrderId: workOrder.id,
          type: 'PENDIENTE',
          stateFrom: 'PENDIENTE',
          stateTo: 'PENDIENTE',
          actorUserId: userId,
          actorRole: 'CUSTOMER',
          note: `Solicitud creada por el cliente. Situación: ${dto.situacion}. Peligro de accidente: ${dto.peligroAccidente || 'NO'}`,
          meta: {
            situacion: dto.situacion,
            peligroAccidente: dto.peligroAccidente || 'NO',
            observaciones: dto.observaciones,
            canal: dto.canal || 'APP',
          } as any,
        },
      });

      logger.info(`Work order request created by customer ${userId}: ${workOrder.id}`);
      return Result.ok(workOrder);
    } catch (error) {
      logger.error('Create request error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to create request'));
    }
  }

  /**
   * Obtiene el detalle de una orden específica del cliente
   */
  async findMyOrderById(userId: string, orderId: string): Promise<Result<Error, unknown>> {
    try {
      const client = await prisma.client.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!client) {
        return Result.error(new Error('Client not found'));
      }

      const workOrder = await prisma.workOrder.findFirst({
        where: {
          id: orderId,
          clientId: client.id,
        },
        include: {
          crew: { select: { id: true, name: true, zona: true } },
          property: true,
          workType: true,
          timeline: {
            orderBy: { at: 'desc' },
            take: 10,
          },
        },
      });

      if (!workOrder) {
        return Result.error(new Error('Work order not found'));
      }

      return Result.ok(workOrder);
    } catch (error) {
      logger.error('Find my order by id error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to find order'));
    }
  }
}
