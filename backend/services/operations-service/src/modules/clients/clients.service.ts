import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { prisma } from '../../config/database';
import { EstadoCliente } from '@aaron/prisma-client-ops';
import * as bcrypt from 'bcryptjs';
import { 
  CreateClientDto, 
  CreateClientInternalDto,
  CreateClientManualDto,
  UpdateClientDto, 
  UpdateClientStatusDto,
  ClientFiltersDto,
  ApproveClientDto 
} from './dto/clients.dto';
import { ClientEmailService } from './email.service';

@Injectable()
export class ClientsService {
  constructor(private emailService: ClientEmailService) {}
  /**
   * Crea un cliente nuevo (usado internamente cuando se registra un CUSTOMER)
   * El cliente se crea con estado PENDIENTE hasta que pase la auditoría
   */
  async createFromSignup(dto: CreateClientInternalDto) {
    // Verificar si ya existe un cliente con este userId
    const existingByUserId = await prisma.client.findUnique({
      where: { userId: dto.userId },
    });

    if (existingByUserId) {
      throw new ConflictException('Client already exists for this user');
    }

    // Verificar si ya existe un cliente con este email (evitar duplicados)
    const existingByEmail = await prisma.client.findFirst({
      where: { email: dto.email },
    });

    if (existingByEmail) {
      throw new ConflictException(`Ya existe un cliente con el email ${dto.email}`);
    }

    // Crear cliente + propiedad + suscripción básica (si hay plan activo) en transacción
    const result = await prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: {
          userId: dto.userId,
          email: dto.email,
          nombreCompleto: dto.fullName,
        estado: EstadoCliente.PENDIENTE,
        // Solo guardar coordenadas si vienen (no hardcodear 0,0)
        lat: dto.lat && dto.lat !== 0 ? dto.lat : null,
        lng: dto.lng && dto.lng !== 0 ? dto.lng : null,
        },
      });

      // Crear propiedad mínima (requerida por subscription/work orders)
      const property = await tx.customerProperty.create({
        data: {
          clientId: client.id,
          userId: dto.userId,
          address: dto.address || 'Sin dirección',
          // Solo guardar coordenadas si vienen (no hardcodear 0,0)
          lat: dto.lat && dto.lat !== 0 ? dto.lat : null,
          lng: dto.lng && dto.lng !== 0 ? dto.lng : null,
          status: 'PRE_ONBOARD',
          summary: 'Propiedad creada desde signup (datos mínimos)',
        },
      });

      // Buscar plan activo para autocontratar (primero disponible)
      const plan = await tx.plan.findFirst({
        where: { active: true },
        orderBy: { createdAt: 'asc' },
      });

      // No crear suscripción automática: se asigna tras auditoría
      return { client, property, subscription: null };
    });

    return result;
  }

  /**
   * Crea un cliente manualmente desde el panel web (sin verificación de email)
   * Usado por ADMIN/OPERATOR para clientes especiales o con dificultades
   * Crea: Cliente + Propiedad + Suscripción (todo activado directamente)
   */
  async createManual(dto: CreateClientManualDto, createdByUserId: string) {
    // Verificar si ya existe un cliente con este email
    const existingByEmail = await prisma.client.findFirst({
      where: { email: dto.email },
    });

    if (existingByEmail) {
      throw new ConflictException(`Ya existe un cliente con el email ${dto.email}`);
    }

    // Verificar que el plan existe
    const plan = await prisma.plan.findUnique({
      where: { id: dto.planId },
    });

    if (!plan) {
      throw new NotFoundException(`Plan con ID ${dto.planId} no encontrado`);
    }

    // Crear todo en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // 0. Crear Usuario en Auth usando raw queries para acceder al schema auth
      // Buscar rol CUSTOMER
      const roleResult = await tx.$queryRaw<Array<{ id: string; name: string }>>`
        SELECT id, name FROM auth.roles WHERE name = 'CUSTOMER' LIMIT 1
      `;
      
      if (!roleResult || roleResult.length === 0) {
         throw new ConflictException('Rol CUSTOMER no encontrado en el sistema. Contacte a soporte.');
      }
      
      const role = roleResult[0];

      // Hashear password
      const password = dto.password || 'Aaron123!';
      const passwordHash = await bcrypt.hash(password, 10);

      // Crear usuario
      const userResult = await tx.$queryRaw<Array<{ id: string; email: string; fullName: string | null }>>`
        INSERT INTO auth.users (id, email, "passwordHash", "fullName", "isEmailVerified", active, phone, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), ${dto.email}, ${passwordHash}, ${dto.fullName}, true, true, ${dto.telefono || null}, NOW(), NOW())
        RETURNING id, email, "fullName"
      `;
      
      if (!userResult || userResult.length === 0) {
        throw new ConflictException('Error al crear usuario en el sistema de autenticación.');
      }
      
      const userId = userResult[0].id;
      
      // Conectar el rol al usuario
      await tx.$executeRaw`
        INSERT INTO auth."_UserRoles" ("A", "B")
        VALUES (${role.id}, ${userId})
        ON CONFLICT DO NOTHING
      `;

      // 1. Crear el cliente directamente ACTIVO
      const client = await tx.client.create({
        data: {
          userId: userId,
          email: dto.email,
          nombreCompleto: dto.fullName,
          telefono: dto.telefono,
          documento: dto.documento,
          direccionFacturacion: dto.direccionFacturacion || dto.address, // Usar address si direccionFacturacion no está
          lat: dto.lat,
          lng: dto.lng,
          ciudad: dto.ciudad,
          provincia: dto.provincia,
          estado: EstadoCliente.ACTIVO, // Directamente ACTIVO
          datosAdicionales: dto.observaciones ? JSON.stringify({
            observaciones: dto.observaciones,
            createdBy: createdByUserId,
            createdManually: true,
            createdAt: new Date().toISOString(),
          }) : null,
        },
      });

      // 2. Crear la propiedad directamente ACTIVE
      const property = await tx.customerProperty.create({
        data: {
          clientId: client.id,
          userId: userId,
          address: dto.address,
          lat: dto.lat,
          lng: dto.lng,
          tipoPropiedad: dto.tipoPropiedad as any,
          tipoConstruccion: dto.tipoConstruccion as any,
          ambientes: dto.ambientes,
          banos: dto.banos,
          superficieCubiertaM2: dto.superficieCubiertaM2,
          superficieDescubiertaM2: dto.superficieDescubiertaM2,
          barrio: dto.barrio,
          ciudad: dto.ciudad,
          provincia: dto.provincia,
          status: 'ACTIVE', // Directamente ACTIVE
          summary: dto.observacionesPropiedad || `Propiedad creada manualmente para ${dto.fullName}`,
          notes: `Creada manualmente por operador. Sin auditoría previa.`,
        },
      });

      // 3. Crear la suscripción directamente ACTIVE
      const subscription = await tx.subscription.create({
        data: {
          clientId: client.id,
          userId: userId,
          propertyId: property.id,
          planId: dto.planId,
          status: 'ACTIVE',
          montoMensual: plan.price,
          moneda: plan.currency,
          planSnapshot: {
            name: plan.name,
            price: plan.price,
            currency: plan.currency,
          },
        },
      });

      return { client, property, subscription };
    });

    // 4. Enviar email de bienvenida
    try {
      await this.emailService.sendActivationEmail(
        result.client.email,
        result.client.nombreCompleto || 'Cliente',
        plan.name,
      );
    } catch (emailError) {
      // No fallar si el email falla
      console.error('Error sending welcome email:', emailError);
    }

    return result;
  }

  /**
   * Obtiene un cliente por userId (para el cliente móvil)
   */
  async findByUserId(userId: string) {
    const client = await prisma.client.findUnique({
      where: { userId },
      include: {
        properties: true,
        subscriptions: {
          include: { plan: true },
          where: { status: { not: 'CANCELED' } },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  /**
   * Devuelve solo el estado del cliente para rápidos chequeos desde la app móvil
   */
  async getStatusByUserId(userId: string) {
    const client = await prisma.client.findUnique({
      where: { userId },
      select: {
        id: true,
        estado: true,
        updatedAt: true,
        fechaVisitaAuditoria: true,
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const estadoMessages: Record<EstadoCliente, string> = {
      [EstadoCliente.PENDIENTE]:
        'Tu solicitud está pendiente de revisión. Recibirás una notificación cuando un operador la procese.',
      [EstadoCliente.EN_PROCESO]:
        'Tu solicitud está siendo procesada por nuestro equipo. Te avisaremos al finalizar.',
      [EstadoCliente.ACTIVO]:
        'Tu cuenta está activa. Ya puedes solicitar servicios desde la app móvil.',
      [EstadoCliente.SUSPENDIDO]:
        'Tu cuenta está suspendida temporalmente. Contacta a soporte para revisarla.',
      [EstadoCliente.INACTIVO]:
        'Tu cuenta fue desactivada. Contáctanos si necesitas más información.',
    };

    return {
      clientId: client.id,
      estado: client.estado,
      canOperate: client.estado === EstadoCliente.ACTIVO,
      message: estadoMessages[client.estado] || estadoMessages[EstadoCliente.PENDIENTE],
      updatedAt: client.updatedAt,
      lastReviewAt: client.fechaVisitaAuditoria,
    };
  }

  /**
   * Obtiene un cliente por ID
   */
  async findById(id: string) {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        properties: true,
        subscriptions: {
          include: { plan: true },
        },
        workOrders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  /**
   * Lista todos los clientes (para admin)
   */
  async findAll(filters?: ClientFiltersDto) {
    const where: any = {};

    if (filters?.estado) {
      where.estado = filters.estado;
    }

    if (filters?.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { nombreCompleto: { contains: filters.search, mode: 'insensitive' } },
        { documento: { contains: filters.search } },
        { telefono: { contains: filters.search } },
      ];
    }

    const clients = await prisma.client.findMany({
      where,
      include: {
        properties: {
          // Incluir todos los datos del inmueble para mostrar en el frontend
          select: {
            id: true,
            address: true,
            status: true,
            lat: true,
            lng: true,
            tipoPropiedad: true,
            tipoConstruccion: true,
            ambientes: true,
            banos: true,
            superficieCubiertaM2: true,
            superficieDescubiertaM2: true,
            barrio: true,
            ciudad: true,
            provincia: true,
            summary: true,
            notes: true,
            auditedAt: true,
            auditedByUserId: true,
          },
        },
        subscriptions: {
          select: { id: true, status: true, plan: { select: { name: true } } },
          where: { status: { not: 'CANCELED' } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return clients;
  }

  /**
   * Actualiza datos del cliente
   */
  async update(id: string, dto: UpdateClientDto) {
    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return prisma.client.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Actualiza el estado del cliente (PENDIENTE -> ACTIVO, etc.)
   * Si el estado cambia a ACTIVO, envía email de notificación
   */
  async updateStatus(id: string, dto: UpdateClientStatusDto) {
    const client = await prisma.client.findUnique({ 
      where: { id },
      include: {
        subscriptions: {
          where: { status: { not: 'CANCELED' } },
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1, // Obtener la suscripción más reciente
        },
      },
    });
    
    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const estadoAnterior = client.estado;
    const nuevoEstado = dto.estado;

    // Actualizar el estado
    const updatedClient = await prisma.client.update({
      where: { id },
      data: { estado: nuevoEstado },
    });

    // Si el estado cambió a ACTIVO (y antes no estaba ACTIVO), enviar email
    if (nuevoEstado === EstadoCliente.ACTIVO && estadoAnterior !== EstadoCliente.ACTIVO) {
      try {
        // Obtener el nombre del plan de la suscripción activa (si existe)
        const planNombre = client.subscriptions?.[0]?.plan?.name || undefined;

        await this.emailService.sendActivationEmail(
          client.email,
          client.nombreCompleto || client.razonSocial || 'Cliente',
          planNombre,
        );
      } catch (error) {
        // El email falló pero la actualización del estado continúa
        console.error('Error sending activation email in updateStatus:', error);
      }
    }

    return updatedClient;
  }


  /**
   * Obtiene clientes pendientes de auditoría
   */
  async findPendingClients() {
    return prisma.client.findMany({
      where: { estado: EstadoCliente.PENDIENTE },
      include: {
        properties: {
          where: { status: 'PRE_ONBOARD' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Verifica si un cliente existe por userId
   */
  async existsByUserId(userId: string): Promise<boolean> {
    const client = await prisma.client.findUnique({
      where: { userId },
      select: { id: true },
    });
    return !!client;
  }

  /**
   * Asigna un auditor/cuadrilla a un cliente pendiente
   */
  async assignAuditor(clientId: string, auditorId: string, auditorNombre?: string) {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (client.estado !== EstadoCliente.PENDIENTE) {
      throw new ConflictException('Solo se pueden asignar auditores a clientes en estado PENDIENTE');
    }

    return prisma.client.update({
      where: { id: clientId },
      data: {
        auditorAsignadoId: auditorId,
        auditorAsignadoNombre: auditorNombre,
        fechaAsignacionAuditor: new Date(),
      },
    });
  }

  /**
   * Actualiza cliente a EN_PROCESO cuando se completa la auditoría
   */
  async markAsInProcess(clientId: string, fechaVisita?: Date) {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (client.estado !== EstadoCliente.PENDIENTE && client.estado !== EstadoCliente.EN_PROCESO) {
      throw new ConflictException('El cliente debe estar en estado PENDIENTE o EN_PROCESO');
    }

    return prisma.client.update({
      where: { id: clientId },
      data: {
        estado: EstadoCliente.EN_PROCESO,
        fechaVisitaAuditoria: fechaVisita || new Date(),
      },
    });
  }

  /**
   * Activa un cliente (EN_PROCESO → ACTIVO)
   * Envía email de bienvenida
   */
  async activateClient(clientId: string, observaciones?: string) {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        auditForm: {
          include: { plan: true },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (client.estado !== EstadoCliente.EN_PROCESO) {
      throw new ConflictException('Solo se pueden activar clientes en estado EN_PROCESO');
    }

    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        estado: EstadoCliente.ACTIVO,
        datosAdicionales: observaciones || client.datosAdicionales,
      },
    });

    // Enviar email de activación
    try {
      await this.emailService.sendActivationEmail(
        client.email,
        client.nombreCompleto || 'Cliente',
        client.auditForm?.plan?.name || client.auditForm?.planNombre,
      );
    } catch (error) {
      // El email falló pero la activación continúa
      console.error('Error sending activation email:', error);
    }

    return updatedClient;
  }

  /**
   * Aprobar y activar un cliente completo (endpoint unificado)
   * Actualiza datos del cliente, propiedad, crea/actualiza suscripción, contrato y activa el cliente
   */
  async approveClient(clientId: string, dto: ApproveClientDto, approvedByUserId: string) {
    // Verificar que el cliente existe y está en estado pendiente o en proceso
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        properties: {
          where: { status: { in: ['PRE_ONBOARD', 'PRE_APPROVED'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        subscriptions: {
          where: { status: { not: 'CANCELED' } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (client.estado !== EstadoCliente.PENDIENTE && client.estado !== EstadoCliente.EN_PROCESO) {
      throw new ConflictException('Solo se pueden aprobar clientes en estado PENDIENTE o EN_PROCESO');
    }

    // Verificar que el plan existe
    const plan = await prisma.plan.findUnique({
      where: { id: dto.planId },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${dto.planId} not found`);
    }

    // Ejecutar todo en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // 1. Actualizar datos del cliente
      const clientUpdateData: any = {};
      if (dto.telefono) clientUpdateData.telefono = dto.telefono;
      if (dto.telefonoAlt) clientUpdateData.telefonoAlt = dto.telefonoAlt;
      if (dto.documento) clientUpdateData.documento = dto.documento;
      if (dto.direccionFacturacion) clientUpdateData.direccionFacturacion = dto.direccionFacturacion;
      if (dto.provincia) clientUpdateData.provincia = dto.provincia;
      if (dto.ciudad) clientUpdateData.ciudad = dto.ciudad;
      if (dto.codigoPostal) clientUpdateData.codigoPostal = dto.codigoPostal;

      const updatedClient = await tx.client.update({
        where: { id: clientId },
        data: clientUpdateData,
      });

      // 2. Actualizar o crear propiedad
      let property = client.properties[0] || null;
      
      if (property) {
        // Actualizar propiedad existente
        const propertyUpdateData: any = {};
        if (dto.propertyAddress) propertyUpdateData.address = dto.propertyAddress;
        if (dto.propertyLat !== undefined) propertyUpdateData.lat = dto.propertyLat;
        if (dto.propertyLng !== undefined) propertyUpdateData.lng = dto.propertyLng;
        if (dto.tipoPropiedad) propertyUpdateData.tipoPropiedad = dto.tipoPropiedad as any;
        if (dto.tipoConstruccion) propertyUpdateData.tipoConstruccion = dto.tipoConstruccion as any;
        if (dto.ambientes !== undefined) propertyUpdateData.ambientes = dto.ambientes;
        if (dto.banos !== undefined) propertyUpdateData.banos = dto.banos;
        if (dto.superficieCubiertaM2 !== undefined) propertyUpdateData.superficieCubiertaM2 = dto.superficieCubiertaM2;
        if (dto.superficieDescubiertaM2 !== undefined) propertyUpdateData.superficieDescubiertaM2 = dto.superficieDescubiertaM2;
        if (dto.barrio) propertyUpdateData.barrio = dto.barrio;
        if (dto.observacionesPropiedad) propertyUpdateData.summary = dto.observacionesPropiedad;
        
        propertyUpdateData.status = 'ACTIVE';

        property = await tx.customerProperty.update({
          where: { id: property.id },
          data: propertyUpdateData,
        });
      } else {
        // Crear nueva propiedad si no existe
        if (!dto.propertyAddress || dto.propertyLat === undefined || dto.propertyLng === undefined) {
          throw new ConflictException('Property address and coordinates are required when creating new property');
        }

        property = await tx.customerProperty.create({
          data: {
            clientId: clientId,
            userId: client.userId,
            address: dto.propertyAddress,
            lat: dto.propertyLat,
            lng: dto.propertyLng,
            tipoPropiedad: dto.tipoPropiedad as any,
            tipoConstruccion: dto.tipoConstruccion as any,
            ambientes: dto.ambientes,
            banos: dto.banos,
            superficieCubiertaM2: dto.superficieCubiertaM2,
            superficieDescubiertaM2: dto.superficieDescubiertaM2,
            barrio: dto.barrio,
            status: 'ACTIVE',
            summary: dto.observacionesPropiedad || `Propiedad aprobada para ${updatedClient.nombreCompleto}`,
          },
        });
      }

      // 3. Crear o actualizar suscripción
      const now = new Date();
      const startDate = dto.subscriptionStartDate ? new Date(dto.subscriptionStartDate) : now;
      const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 días

      let subscription = client.subscriptions[0] || null;

      if (subscription) {
        // Actualizar suscripción existente
        subscription = await tx.subscription.update({
          where: { id: subscription.id },
          data: {
            planId: dto.planId,
            propertyId: property.id,
            status: 'ACTIVE',
            currentPeriodStart: startDate,
            currentPeriodEnd: endDate,
            nextChargeAt: endDate,
            billingDay: dto.billingDay,
            planSnapshot: {
              name: plan.name,
              price: plan.price,
              currency: plan.currency,
            },
          },
        });
      } else {
        // Crear nueva suscripción
        subscription = await tx.subscription.create({
          data: {
            clientId: clientId,
            userId: client.userId,
            propertyId: property.id,
            planId: dto.planId,
            status: 'ACTIVE',
            montoMensual: plan.price,
            moneda: plan.currency,
            currentPeriodStart: startDate,
            currentPeriodEnd: endDate,
            nextChargeAt: endDate,
            billingDay: dto.billingDay,
            planSnapshot: {
              name: plan.name,
              price: plan.price,
              currency: plan.currency,
            },
          },
        });
      }

      // 4. Crear contrato (opcional)
      let contract = null;
      if (dto.contractStartDate) {
        const contractStart = new Date(dto.contractStartDate);
        const contractEnd = dto.contractEndDate ? new Date(dto.contractEndDate) : null;

        // Generar número de contrato si no se especifica
        const contractNumber = dto.contractNumber || `CT-${Date.now()}-${clientId.substring(0, 8).toUpperCase()}`;

        contract = await tx.contract.create({
          data: {
            nroContrato: contractNumber,
            clientId: clientId,
            propertyId: property.id,
            planId: dto.planId,
            subscriptionId: subscription.id,
            tipoTramite: 'ALTA',
            ciudadFirma: dto.ciudad || 'La Rioja',
            ejecutivoId: approvedByUserId,
            fechaVigenciaInicio: contractStart,
            fechaVigenciaFin: contractEnd,
            estado: 'VIGENTE',
            observaciones: dto.contractNotes,
          },
        });
      }

      // 5. Activar el cliente
      const finalClient = await tx.client.update({
        where: { id: clientId },
        data: {
          estado: EstadoCliente.ACTIVO,
          fechaVisitaAuditoria: dto.technicalReviewDate ? new Date(dto.technicalReviewDate) : new Date(),
          lat: property.lat,
          lng: property.lng,
        },
      });

      return {
        client: finalClient,
        property,
        subscription,
        contract,
      };
    });

    // 6. Enviar email de activación
    try {
      await this.emailService.sendActivationEmail(
        client.email,
        client.nombreCompleto || 'Cliente',
        plan.name,
      );
    } catch (emailError) {
      console.error('Error sending activation email:', emailError);
      // No fallar la aprobación si el email falla
    }

    return result;
  }
}
