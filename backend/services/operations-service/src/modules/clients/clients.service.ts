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
  ClientFiltersDto 
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
        lat: dto.lat || 0,
        lng: dto.lng || 0,
        },
      });

      // Crear propiedad mínima (requerida por subscription/work orders)
      const property = await tx.customerProperty.create({
        data: {
          clientId: client.id,
          userId: dto.userId,
          address: dto.address || 'Sin dirección',
          lat: dto.lat || 0,
          lng: dto.lng || 0,
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
        { documento: { contains: filters.search, mode: 'insensitive' } },
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
}
