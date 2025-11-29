import { Result, Logger } from '@aaron/common';
import { Injectable } from '@nestjs/common';
import { EstadoCliente, TipoPropiedad, TipoConstruccion, EstadoChecklistItem } from '@aaron/prisma-client-ops';

import { prisma } from '../../config/database';
import { ClientEmailService } from '../clients/email.service';

import { CreatePropertyDto, PreApprovalDto, UpdatePropertyStatusDto, CompleteAuditDto, CaptureLocationDto } from './dto/create-property.dto';

const logger = new Logger('PropertiesService');

@Injectable()
export class PropertiesService {
  constructor(private emailService: ClientEmailService) {}
  async create(dto: CreatePropertyDto) {
    try {
      // Buscar si existe un cliente para este userId para vincularlo
      const client = await prisma.client.findUnique({
        where: { userId: dto.userId }
      });

      const property = await prisma.customerProperty.create({
        data: {
          userId: dto.userId,
          clientId: client?.id, // Vincular automáticamente al cliente
          address: dto.address,
          lat: dto.lat,
          lng: dto.lng,
          checklist: dto.checklist || undefined,
          summary: dto.summary,
          status: 'PRE_ONBOARD',
        },
      });
      return Result.ok(property);
    } catch (error) {
      logger.error('Create property error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to create property'));
    }
  }

  async list(userId?: string, clientId?: string) {
    try {
      const props = await prisma.customerProperty.findMany({
        where: {
          ...(userId && { userId }),
          ...(clientId && { clientId }),
        },
        include: {
          client: {
            select: {
              id: true,
              nombreCompleto: true,
              razonSocial: true,
              email: true,
            },
          },
          subscriptions: {
            select: {
              id: true,
              status: true,
              plan: { select: { name: true } },
            },
          },
          workOrders: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              state: true,
              serviceCategory: true,
            },
          },
          preApprovals: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return Result.ok(props);
    } catch (error) {
      logger.error('List properties error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to list properties'));
    }
  }

  async findById(id: string) {
    try {
      const property = await prisma.customerProperty.findUnique({
        where: { id },
        include: {
          client: true,
          subscriptions: {
            include: { plan: true },
          },
          workOrders: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          preApprovals: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      if (!property) {
        return Result.error(new Error('Property not found'));
      }
      return Result.ok(property);
    } catch (error) {
      logger.error('Find property by id error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to find property'));
    }
  }

  async update(id: string, dto: Partial<CreatePropertyDto>) {
    try {
      const updated = await prisma.customerProperty.update({
        where: { id },
        data: {
          ...(dto.address && { address: dto.address }),
          ...(dto.lat !== undefined && { lat: dto.lat }),
          ...(dto.lng !== undefined && { lng: dto.lng }),
          ...(dto.summary !== undefined && { summary: dto.summary }),
          ...(dto.checklist && { checklist: dto.checklist }),
        },
      });
      return Result.ok(updated);
    } catch (error) {
      logger.error('Update property error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to update property'));
    }
  }

  async updateStatus(id: string, dto: UpdatePropertyStatusDto) {
    try {
      const updated = await prisma.customerProperty.update({
        where: { id },
        data: {
          status: dto.status,
          notes: dto.notes,
          auditedAt: ['PRE_APPROVED', 'REJECTED', 'ACTIVE'].includes(dto.status) ? new Date() : undefined,
        },
      });
      return Result.ok(updated);
    } catch (error) {
      logger.error('Update property status error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to update property'));
    }
  }

  async createPreApproval(propertyId: string, dto: PreApprovalDto) {
    try {
      const approval = await prisma.preApproval.create({
        data: {
          propertyId,
          userId: dto.userId,
          auditorUserId: dto.auditorUserId,
          status: dto.status,
          answers: dto.answers,
          attachments: dto.attachments,
          notes: dto.notes,
          decidedAt: dto.status !== 'PENDING' ? new Date() : undefined,
        },
      });

      if (dto.status === 'APPROVED') {
        await prisma.customerProperty.update({
          where: { id: propertyId },
          data: {
            status: 'PRE_APPROVED',
            auditedByUserId: dto.auditorUserId,
            auditedAt: new Date(),
            notes: dto.notes,
          },
        });
      }

      return Result.ok(approval);
    } catch (error) {
      logger.error('Create pre-approval error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to create pre-approval'));
    }
  }

  // =========================================
  // MÉTODOS DE AUDITORÍA
  // =========================================

  /**
   * Captura ubicación precisa del domicilio (usado por auditor)
   */
  async captureLocation(propertyId: string, dto: CaptureLocationDto, auditorUserId: string) {
    try {
      const property = await prisma.customerProperty.findUnique({
        where: { id: propertyId },
      });

      if (!property) {
        return Result.error(new Error('Property not found'));
      }

      const updated = await prisma.customerProperty.update({
        where: { id: propertyId },
        data: {
          lat: dto.lat,
          lng: dto.lng,
          checklist: {
            ...(property.checklist as object || {}),
            locationCapture: {
              lat: dto.lat,
              lng: dto.lng,
              accuracy: dto.accuracy,
              capturedBy: dto.capturedBy || 'AUDITOR',
              capturedAt: new Date().toISOString(),
              auditorUserId,
            },
          } as any,
        },
      });

      logger.info(`Location captured for property ${propertyId}: ${dto.lat}, ${dto.lng}`);
      return Result.ok(updated);
    } catch (error) {
      logger.error('Capture location error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to capture location'));
    }
  }

  /**
   * Auditoría completa in-situ
   * Este método realiza todo el proceso de auditoría:
   * 1. Captura coordenadas precisas
   * 2. Actualiza caracterización del inmueble
   * 3. Guarda checklist de auditoría
   * 4. Actualiza datos del cliente
   * 5. Crea suscripción si se aprueba
   * 6. Activa el cliente
   */
  async completeAudit(propertyId: string, dto: CompleteAuditDto, auditorUserId: string) {
    try {
      // 1. Obtener la propiedad y el cliente
      const property = await prisma.customerProperty.findUnique({
        where: { id: propertyId },
        include: {
          client: true,
          subscriptions: true,
        },
      });

      if (!property) {
        return Result.error(new Error('Property not found'));
      }

      // 2. Actualizar la propiedad con coordenadas y caracterización
      const updatedProperty = await prisma.customerProperty.update({
        where: { id: propertyId },
        data: {
          // Coordenadas precisas
          lat: dto.lat,
          lng: dto.lng,
          // Caracterización del inmueble
          tipoPropiedad: dto.tipoPropiedad as TipoPropiedad || property.tipoPropiedad,
          tipoConstruccion: dto.tipoConstruccion as TipoConstruccion || property.tipoConstruccion,
          ambientes: dto.ambientes || property.ambientes,
          banos: dto.banos || property.banos,
          superficieCubiertaM2: dto.superficieCubiertaM2 || property.superficieCubiertaM2,
          superficieDescubiertaM2: dto.superficieDescubiertaM2 || property.superficieDescubiertaM2,
          barrio: dto.barrio || property.barrio,
          ciudad: dto.ciudad || property.ciudad,
          provincia: dto.provincia || property.provincia,
          // Metadata de auditoría
          checklist: {
            ...(property.checklist as object || {}),
            auditData: {
              lat: dto.lat,
              lng: dto.lng,
              accuracy: dto.accuracy,
              fotos: dto.fotos,
              observaciones: dto.observaciones,
              auditedAt: new Date().toISOString(),
              auditorUserId,
            },
          } as any,
          summary: dto.observaciones || property.summary,
          auditedByUserId: auditorUserId,
          auditedAt: new Date(),
          // Estado basado en decisión
          status: dto.decision === 'APPROVED' ? 'ACTIVE' : 'REJECTED',
          notes: dto.decision === 'REJECTED' ? dto.motivoRechazo : dto.observaciones,
        },
      });

      // 3. Crear items del checklist si se proporcionaron
      if (dto.checklistItems && dto.checklistItems.length > 0) {
        // Buscar o crear una AuditVisit
        let auditVisit = await prisma.auditVisit.findFirst({
          where: {
            subscription: {
              propertyId: propertyId,
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        // Si hay suscripción existente, crear la visita de auditoría
        if (property.subscriptions.length > 0) {
          auditVisit = await prisma.auditVisit.create({
            data: {
              subscriptionId: property.subscriptions[0].id,
              auditorId: auditorUserId,
              fechaProgramada: new Date(),
              fechaRealizada: new Date(),
              estado: 'REALIZADA',
              observacionesGenerales: dto.observaciones,
              fotos: dto.fotos,
            },
          });

          // Crear items del checklist
          await prisma.auditChecklistItem.createMany({
            data: dto.checklistItems.map(item => ({
              auditVisitId: auditVisit!.id,
              categoria: item.categoria,
              descripcionItem: item.descripcionItem,
              estado: item.estado as EstadoChecklistItem,
              comentarios: item.comentarios,
            })),
          });
        }
      }

      // 4. Si se aprobó, actualizar el cliente y crear suscripción
      if (dto.decision === 'APPROVED') {
        // Actualizar datos del cliente
        if (property.client) {
          await prisma.client.update({
            where: { id: property.client.id },
            data: {
              documento: dto.clienteDocumento || property.client.documento,
              telefono: dto.clienteTelefono || property.client.telefono,
              direccionFacturacion: dto.clienteDireccionFacturacion || property.client.direccionFacturacion,
              estado: EstadoCliente.ACTIVO,
            },
          });
        }

        // Crear suscripción si se especificó un plan
        if (dto.planId) {
          const plan = await prisma.plan.findUnique({ where: { id: dto.planId } });
          
          if (plan) {
            // Verificar si ya tiene suscripción activa
            const existingSubscription = property.subscriptions.find(
              s => s.status === 'ACTIVE' || s.status === 'REVISION'
            );

            if (existingSubscription) {
              // Actualizar suscripción existente
              await prisma.subscription.update({
                where: { id: existingSubscription.id },
                data: {
                  planId: dto.planId,
                  status: 'ACTIVE',
                  planSnapshot: {
                    name: plan.name,
                    price: plan.price,
                    currency: plan.currency,
                  },
                },
              });
            } else {
              // Crear nueva suscripción
              await prisma.subscription.create({
                data: {
                  clientId: property.clientId,
                  userId: property.userId,
                  propertyId: propertyId,
                  planId: dto.planId,
                  status: 'ACTIVE',
                  montoMensual: plan.price,
                  planSnapshot: {
                    name: plan.name,
                    price: plan.price,
                    currency: plan.currency,
                  },
                },
              });
            }
          }
        }

        // Enviar email de bienvenida al cliente
        if (property.client) {
          try {
            const plan = dto.planId ? await prisma.plan.findUnique({ where: { id: dto.planId } }) : null;
            await this.emailService.sendActivationEmail(
              property.client.email,
              property.client.nombreCompleto || 'Cliente',
              plan?.name,
            );
            logger.info(`Welcome email sent to ${property.client.email}`);
          } catch (emailError) {
            logger.error('Failed to send welcome email', emailError);
            // No fallar la auditoría si falla el email
          }
        }

        logger.info(`Audit APPROVED for property ${propertyId} by auditor ${auditorUserId}`);
      } else {
        logger.info(`Audit REJECTED for property ${propertyId}: ${dto.motivoRechazo}`);
      }

      // 5. Crear registro de pre-aprobación
      await prisma.preApproval.create({
        data: {
          propertyId,
          auditorUserId,
          status: dto.decision,
          answers: {
            tipoPropiedad: dto.tipoPropiedad,
            tipoConstruccion: dto.tipoConstruccion,
            ambientes: dto.ambientes,
            banos: dto.banos,
            superficieCubiertaM2: dto.superficieCubiertaM2,
            checklistItems: dto.checklistItems,
          } as any,
          attachments: { fotos: dto.fotos } as any,
          notes: dto.decision === 'REJECTED' ? dto.motivoRechazo : dto.observaciones,
          decidedAt: new Date(),
        },
      });

      return Result.ok({
        property: updatedProperty,
        decision: dto.decision,
        message: dto.decision === 'APPROVED' 
          ? 'Auditoría completada. Cliente activado exitosamente.'
          : `Auditoría rechazada: ${dto.motivoRechazo}`,
      });
    } catch (error) {
      logger.error('Complete audit error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to complete audit'));
    }
  }

  /**
   * Lista propiedades pendientes de auditoría
   */
  async listPendingAudit() {
    try {
      const properties = await prisma.customerProperty.findMany({
        where: {
          status: 'PRE_ONBOARD',
        },
        include: {
          client: {
            select: {
              id: true,
              nombreCompleto: true,
              email: true,
              telefono: true,
              estado: true,
            },
          },
          subscriptions: {
            where: { status: 'REVISION' },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      return Result.ok(properties);
    } catch (error) {
      logger.error('List pending audit error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to list pending properties'));
    }
  }

  // =========================================
  // MÉTODOS PARA CLIENTE MÓVIL
  // =========================================

  /**
   * Solicitud de mudanza/reubicación
   * POST /ops/properties/me/relocation
   * 
   * El cliente solicita cambiar su domicilio principal.
   * Esto crea una solicitud pendiente que debe ser aprobada por un operador/auditor.
   */
  async requestRelocation(userId: string, dto: {
    newAddress: string;
    newLat?: number;
    newLng?: number;
    motivo?: string;
    fechaDeseada?: Date;
  }) {
    try {
      // 1. Verificar que el cliente está activo
      const client = await prisma.client.findUnique({
        where: { userId },
        include: {
          properties: {
            where: { status: 'ACTIVE' },
            take: 1,
          },
          subscriptions: {
            where: { status: 'ACTIVE' },
            take: 1,
          },
        },
      });

      if (!client) {
        return Result.error(new Error('Client not found'));
      }

      if (client.estado !== 'ACTIVO') {
        return Result.error(new Error('Only active clients can request relocation'));
      }

      const currentProperty = client.properties[0];
      if (!currentProperty) {
        return Result.error(new Error('No active property found'));
      }

      const currentSubscription = client.subscriptions[0];
      if (!currentSubscription) {
        return Result.error(new Error('No active subscription found'));
      }

      // 2. Crear la nueva propiedad con estado PRE_ONBOARD (pendiente auditoría)
      const newProperty = await prisma.customerProperty.create({
        data: {
          clientId: client.id,
          userId,
          address: dto.newAddress,
          lat: dto.newLat,
          lng: dto.newLng,
          status: 'PRE_ONBOARD', // Pendiente de auditoría
          notes: `MUDANZA: ${dto.motivo || 'Sin motivo especificado'}. Propiedad anterior: ${currentProperty.address}`,
          checklist: {
            relocationRequest: {
              previousPropertyId: currentProperty.id,
              previousAddress: currentProperty.address,
              motivo: dto.motivo,
              fechaDeseada: dto.fechaDeseada?.toISOString(),
              requestedAt: new Date().toISOString(),
              requestedByUserId: userId,
            },
          },
        },
      });

      // 3. Marcar la suscripción como "en revisión" por mudanza
      await prisma.subscription.update({
        where: { id: currentSubscription.id },
        data: {
          status: 'REVISION',
          meta: {
            ...(currentSubscription.meta as object || {}),
            relocationRequest: {
              newPropertyId: newProperty.id,
              requestedAt: new Date().toISOString(),
            },
          },
        },
      });

      // 4. Crear una pre-aprobación pendiente para la nueva propiedad
      await prisma.preApproval.create({
        data: {
          propertyId: newProperty.id,
          userId,
          status: 'PENDING',
          notes: `Solicitud de mudanza desde ${currentProperty.address}. Motivo: ${dto.motivo || 'No especificado'}`,
          answers: {
            type: 'RELOCATION',
            previousPropertyId: currentProperty.id,
            motivo: dto.motivo,
            fechaDeseada: dto.fechaDeseada?.toISOString(),
          },
        },
      });

      logger.info(`Relocation request created by user ${userId}: from ${currentProperty.id} to ${newProperty.id}`);

      return Result.ok({
        newProperty,
        message: 'Solicitud de mudanza registrada. Un auditor se pondrá en contacto para coordinar la visita.',
        status: 'PENDING_AUDIT',
      });
    } catch (error) {
      logger.error('Request relocation error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to request relocation'));
    }
  }

  /**
   * Lista las propiedades del cliente
   */
  async listMyProperties(userId: string) {
    try {
      const properties = await prisma.customerProperty.findMany({
        where: { userId },
        include: {
          subscriptions: {
            select: {
              id: true,
              status: true,
              plan: { select: { name: true, price: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return Result.ok(properties);
    } catch (error) {
      logger.error('List my properties error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to list properties'));
    }
  }
}
