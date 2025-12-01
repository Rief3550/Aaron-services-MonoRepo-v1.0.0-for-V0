import { Result , Logger } from '@aaron/common';
import { Injectable } from '@nestjs/common';
type SubscriptionStatusEnum = 'ACTIVE' | 'GRACE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELED' | 'PAUSED';

import { prisma } from '../../config/database';

import { CreateSubscriptionDto, ManualPaymentDto, UpdateSubscriptionStatusDto, SubscriptionStatusDto } from './dto/subscriptions.dto';
import { AdminCreateSubscriptionDto, AdminUpdateSubscriptionDto, AdminUpdateSubscriptionStatusDto } from './dto/admin-subscription.dto';

const logger = new Logger('SubscriptionService');

const DAYS_IN_MONTH = 30;
const GRACE_DAYS = 3;
const DEFAULT_PAUSE_DAYS = 15;

interface CancelRequestOptions {
  reason: string; // obligatorio
  immediate?: boolean;
}

@Injectable()
export class SubscriptionsService {
  async list(userId?: string, status?: string) {
    try {
      const subscriptions = await prisma.subscription.findMany({
        where: {
          ...(userId && { userId }),
          ...(status && { status: status as SubscriptionStatusEnum }),
        },
        include: {
          plan: true,
          property: true,
          workOrders: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return Result.ok(subscriptions);
    } catch (error) {
      logger.error('List subscriptions error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to list subscriptions'));
    }
  }

  async create(dto: CreateSubscriptionDto) {
    try {
      const plan = await prisma.plan.findUnique({ where: { id: dto.planId } });
      if (!plan) {
        return Result.error(new Error('Plan not found'));
      }

      // Check for existing active subscription
      const existing = await prisma.subscription.findFirst({
        where: {
          userId: dto.userId,
          status: { in: ['ACTIVE', 'GRACE', 'PAST_DUE'] },
        },
      });

      if (existing) {
        return Result.error(new Error('User already has an active subscription'));
      }

      const now = new Date();
      const periodStart = dto.currentPeriodStart ? new Date(dto.currentPeriodStart) : now;
      const periodEnd = dto.currentPeriodEnd
        ? new Date(dto.currentPeriodEnd)
        : new Date(now.getTime() + DAYS_IN_MONTH * 24 * 60 * 60 * 1000);
      const graceUntil = new Date(periodEnd.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000);

      const subscription = await prisma.subscription.create({
        data: {
          userId: dto.userId,
          planId: dto.planId,
          propertyId: dto.propertyId || null,
          status: 'ACTIVE',
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          graceUntil,
          nextChargeAt: periodEnd,
          billingDay: dto.billingDay || undefined,
          planSnapshot: {
            name: plan.name,
            price: plan.price,
            currency: plan.currency,
          },
        },
        include: {
          plan: true,
          property: true,
        },
      });

      return Result.ok(subscription);
    } catch (error) {
      logger.error('Create subscription error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to create subscription'));
    }
  }

  async upgrade(id: string, newPlanId: string) {
    try {
      const subscription = await prisma.subscription.findUnique({ where: { id } });
      if (!subscription) {
        return Result.error(new Error('Subscription not found'));
      }

      const newPlan = await prisma.plan.findUnique({ where: { id: newPlanId } });
      if (!newPlan) {
        return Result.error(new Error('Plan not found'));
      }

      const now = new Date();
      const nextEnd = new Date(now.getTime() + DAYS_IN_MONTH * 24 * 60 * 60 * 1000);

      const updated = await prisma.subscription.update({
        where: { id },
        data: {
          planId: newPlanId,
          currentPeriodStart: now,
          currentPeriodEnd: nextEnd,
          graceUntil: new Date(nextEnd.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000),
          nextChargeAt: nextEnd,
          planSnapshot: {
            name: newPlan.name,
            price: newPlan.price,
            currency: newPlan.currency,
          },
        },
        include: {
          plan: true,
          property: true,
        },
      });

      return Result.ok(updated);
    } catch (error) {
      logger.error('Upgrade subscription error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to upgrade subscription'));
    }
  }

  async cancel(id: string) {
    try {
      const subscription = await prisma.subscription.update({
        where: { id },
        data: {
          status: 'CANCELED',
          canceledAt: new Date(),
        },
        include: {
          plan: true,
          property: true,
        },
      });

      return Result.ok(subscription);
    } catch (error) {
      logger.error('Cancel subscription error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to cancel subscription'));
    }
  }

  /**
   * Cancelación pedida por el cliente (CUSTOMER)
   * - immediate=true: status CANCELED ahora mismo
   * - immediate=false: marcará cancelAtEnd (aquí usamos canceledAt future? simplificamos: dejamos ACTIVE y seteamos canceledAt y status CANCELED al final de periodo)
   */
  async requestCancel(userId: string, opts: CancelRequestOptions) {
    try {
      const sub = await prisma.subscription.findFirst({
        where: {
          userId,
          status: { in: ['ACTIVE', 'GRACE', 'PAST_DUE'] },
        },
        include: {
          plan: true,
          property: true,
        },
      });

      if (!sub) {
        return Result.error(new Error('No active subscription found'));
      }

      // Si immediate: cancelar ya
      if (opts.immediate) {
        const updated = await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: 'CANCELED',
            canceledAt: new Date(),
            cancelReason: opts.reason || 'user_cancel',
          },
          include: {
            plan: true,
            property: true,
          },
        });
        return Result.ok(updated);
      }

      // No immediate: programar cancelación al fin del período actual
      const updated = await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: 'ACTIVE', // se mantiene activa hasta fin de periodo
          canceledAt: sub.currentPeriodEnd ?? sub.nextChargeAt ?? null,
          cancelReason: opts.reason || 'user_cancel_end_period',
          // Mantener nextChargeAt como recordatorio; un job diario puede marcar CANCELED al llegar currentPeriodEnd
        },
        include: {
          plan: true,
          property: true,
        },
      });

      return Result.ok(updated);
    } catch (error) {
      logger.error('Request cancel subscription error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to request cancellation'));
    }
  }

  async charge(id: string) {
    try {
      const subscription = await prisma.subscription.findUnique({ where: { id } });
      if (!subscription) {
        return Result.error(new Error('Subscription not found'));
      }

      const now = new Date();
      const nextEnd = new Date(now.getTime() + DAYS_IN_MONTH * 24 * 60 * 60 * 1000);

      const updated = await prisma.subscription.update({
        where: { id },
        data: {
          currentPeriodStart: now,
          currentPeriodEnd: nextEnd,
          graceUntil: new Date(nextEnd.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000),
          nextChargeAt: nextEnd,
          status: 'ACTIVE',
        },
        include: {
          plan: true,
          property: true,
        },
      });

      return Result.ok(updated);
    } catch (error) {
      logger.error('Charge subscription error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to charge subscription'));
    }
  }

  /**
   * Pausar suscripción por DEFAULT_PAUSE_DAYS
   */
  async pause(id: string, days: number = DEFAULT_PAUSE_DAYS) {
    try {
      const sub = await prisma.subscription.findUnique({ where: { id } });
      if (!sub) {
        return Result.error(new Error('Subscription not found'));
      }

      const pausedUntil = new Date();
      pausedUntil.setDate(pausedUntil.getDate() + days);

      const updated = await prisma.subscription.update({
        where: { id },
        data: {
          status: 'PAUSED' as any,
          suspendedAt: new Date(),
          nextChargeAt: pausedUntil,
        },
        include: {
          plan: true,
          property: true,
        },
      });

      return Result.ok(updated);
    } catch (error) {
      logger.error('Pause subscription error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to pause subscription'));
    }
  }

  /**
   * Marca la suscripción según fechas: ACTIVE -> PAST_DUE -> GRACE -> SUSPENDED
   */
  async runDailyStatusJob() {
    const now = new Date();
    try {
      // Pasar a PAST_DUE si ya venció y sigue ACTIVE
      await prisma.subscription.updateMany({
        where: {
          status: 'ACTIVE',
          currentPeriodEnd: { lt: now },
        },
        data: {
          status: 'PAST_DUE',
        },
      });

      // Pasar a GRACE si estaba PAST_DUE y tiene ventana de gracia
      await prisma.subscription.updateMany({
        where: {
          status: 'PAST_DUE',
          graceUntil: { gte: now },
        },
        data: {
          status: 'GRACE',
        },
      });

      // Pasar a SUSPENDED si se pasó la gracia
      await prisma.subscription.updateMany({
        where: {
          status: { in: ['GRACE', 'PAST_DUE'] },
          graceUntil: { lt: now },
        },
        data: {
          status: 'SUSPENDED',
          suspendedAt: now,
        },
      });
    } catch (error) {
      logger.error('runDailyStatusJob error', error);
    }
  }

  async recordManualPayment(dto: ManualPaymentDto) {
    try {
      const subscription = await prisma.subscription.findUnique({ where: { id: dto.subscriptionId } });
      if (!subscription) {
        return Result.error(new Error('Subscription not found'));
      }

      const paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();

      const payment = await prisma.payment.create({
        data: {
          subscriptionId: dto.subscriptionId,
          amount: dto.amount,
          monto: dto.amount,
          currency: (dto.currency || 'ARS').toUpperCase(),
          moneda: (dto.currency || 'ARS').toUpperCase(),
          provider: 'admin',
          type: 'ADMIN_MANUAL',
          status: 'POSTED',
          paidAt,
          note: dto.note || undefined,
        },
      });

      // Reactivar si estaba en GRACE/PAST_DUE/SUSPENDED
      const now = new Date();
      const nextEnd = new Date(now.getTime() + DAYS_IN_MONTH * 24 * 60 * 60 * 1000);
      await prisma.subscription.update({
        where: { id: dto.subscriptionId },
        data: {
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: nextEnd,
          graceUntil: new Date(nextEnd.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000),
          nextChargeAt: nextEnd,
          suspendedAt: null,
        },
      });

      return Result.ok(payment);
    } catch (error) {
      logger.error('recordManualPayment error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to record payment'));
    }
  }

  async updateStatus(id: string, dto: UpdateSubscriptionStatusDto) {
    try {
      const updated = await prisma.subscription.update({
        where: { id },
        data: {
          status: dto.status,
          cancelReason: dto.reason,
          canceledAt: dto.status === SubscriptionStatusDto.CANCELED ? new Date() : undefined,
          suspendedAt: dto.status === SubscriptionStatusDto.SUSPENDED ? new Date() : undefined,
        },
      });
      return Result.ok(updated);
    } catch (error) {
      logger.error('updateStatus error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to update subscription status'));
    }
  }

  /**
   * Cambiar estado de suscripción (para flujo de auditoría: REVISION -> ACTIVE)
   */
  async changeState(id: string, estado: string, observacion?: string) {
    try {
      const subscription = await prisma.subscription.findUnique({ where: { id } });
      if (!subscription) {
        return Result.error(new Error('Subscription not found'));
      }

      const updated = await prisma.subscription.update({
        where: { id },
        data: {
          status: estado as any,
          // Opcional: guardar observación en un log de auditoría o notes
        },
        include: {
          plan: true,
          property: true,
        },
      });

      logger.info(`Subscription ${id} state changed to ${estado}. Observacion: ${observacion || 'N/A'}`);
      return Result.ok(updated);
    } catch (error) {
      logger.error('changeState error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to change subscription state'));
    }
  }

  async adminCreate(dto: AdminCreateSubscriptionDto) {
    try {
      const plan = await prisma.plan.findUnique({ where: { id: dto.planId } });
      if (!plan) return Result.error(new Error('Plan not found'));

      const now = new Date();
      const startDate = dto.startDate ? new Date(dto.startDate) : now;
      const endDate = dto.endDate ? new Date(dto.endDate) : new Date(startDate.getTime() + DAYS_IN_MONTH * 24 * 60 * 60 * 1000);

      const subscription = await prisma.subscription.create({
        data: {
          userId: dto.userId,
          planId: dto.planId,
          propertyId: dto.propertyId,
          status: (dto.status as any) || 'ACTIVE',
          currentPeriodStart: startDate,
          currentPeriodEnd: endDate,
          nextChargeAt: endDate,
          billingDay: dto.billingDay,
          planSnapshot: {
            name: plan.name,
            price: plan.price,
            currency: plan.currency,
          },
          // Log creation by admin? We can use meta field or separate audit log
          meta: { createdBy: 'admin' },
        },
        include: { plan: true, property: true },
      });

      return Result.ok(subscription);
    } catch (error) {
      logger.error('Admin create subscription error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to create subscription'));
    }
  }

  async adminUpdate(id: string, dto: AdminUpdateSubscriptionDto) {
    try {
      const data: any = {};
      if (dto.planId) {
        const plan = await prisma.plan.findUnique({ where: { id: dto.planId } });
        if (!plan) return Result.error(new Error('Plan not found'));
        data.planId = dto.planId;
        data.planSnapshot = {
          name: plan.name,
          price: plan.price,
          currency: plan.currency,
        };
      }

      if (dto.startDate) data.currentPeriodStart = new Date(dto.startDate);
      if (dto.endDate) {
        data.currentPeriodEnd = new Date(dto.endDate);
        data.nextChargeAt = new Date(dto.endDate);
      }
      if (dto.billingDay) data.billingDay = dto.billingDay;

      const subscription = await prisma.subscription.update({
        where: { id },
        data,
        include: { plan: true, property: true },
      });

      return Result.ok(subscription);
    } catch (error) {
      logger.error('Admin update subscription error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to update subscription'));
    }
  }

  async adminChangeStatus(id: string, dto: AdminUpdateSubscriptionStatusDto) {
    try {
      const data: any = { status: dto.status };
      if (dto.status === 'CANCELED') {
        data.canceledAt = new Date();
        data.cancelReason = dto.reason;
      } else if (dto.status === 'SUSPENDED') {
        data.suspendedAt = new Date();
      } else if (dto.status === 'ACTIVE') {
        // If reactivating, maybe reset dates? For now just change status.
        data.canceledAt = null;
        data.suspendedAt = null;
      }

      const subscription = await prisma.subscription.update({
        where: { id },
        data,
        include: { plan: true, property: true },
      });

      return Result.ok(subscription);
    } catch (error) {
      logger.error('Admin change status error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to change subscription status'));
    }
  }

  // =========================================
  // MÉTODOS PARA CLIENTE MÓVIL (App)
  // =========================================

  /**
   * Obtiene la suscripción actual del cliente por userId
   */
  async findByUserId(userId: string) {
    try {
      // Primero buscar el client
      const client = await prisma.client.findUnique({
        where: { userId },
        select: { id: true, estado: true },
      });

      if (!client) {
        return Result.error(new Error('Client not found'));
      }

      // Buscar suscripción activa (no cancelada)
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: { not: 'CANCELED' },
        },
        include: {
          plan: true,
          property: {
            select: {
              id: true,
              alias: true,
              address: true,
              status: true,
            },
          },
          auditVisits: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!subscription) {
        return Result.ok({
          subscription: null,
          clientStatus: client.estado,
          message: client.estado === 'PENDIENTE' 
            ? 'Tu cuenta está pendiente de auditoría' 
            : 'No tienes una suscripción activa',
        });
      }

      const payments = await prisma.payment.findMany({
        where: { subscriptionId: subscription.id, status: 'POSTED' },
        orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
        take: 1,
      });

      const now = new Date();
      const endDate = subscription.currentPeriodEnd || subscription.nextChargeAt;
      const canceledAt = subscription.canceledAt;
      const targetEnd = canceledAt || endDate;
      const msRemaining = targetEnd ? targetEnd.getTime() - now.getTime() : 0;
      const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

      const pastDue =
        subscription.status === 'PAST_DUE' ||
        (subscription.status === 'GRACE' && subscription.currentPeriodEnd && subscription.currentPeriodEnd < now);

      return Result.ok({
        subscription: {
          ...subscription,
          pastDue,
          daysRemaining,
          nextChargeAt: subscription.nextChargeAt,
          currentPeriodEnd: subscription.currentPeriodEnd,
          graceUntil: subscription.graceUntil,
          canceledAt: subscription.canceledAt,
          cancelReason: subscription.cancelReason,
          lastPayment: payments?.[0] || null,
        },
        clientStatus: client.estado,
      });
    } catch (error) {
      logger.error('Find subscription by userId error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to find subscription'));
    }
  }

  /**
   * Cliente solicita cambio de plan (upgrade/downgrade)
   * Crea una solicitud que debe ser aprobada por admin
   */
  async requestUpgrade(userId: string, planId: string, reason?: string) {
    try {
      // Verificar que el cliente existe y está activo
      const client = await prisma.client.findUnique({
        where: { userId },
      });

      if (!client) {
        return Result.error(new Error('Client not found'));
      }

      if (client.estado !== 'ACTIVO') {
        return Result.error(new Error('Your account must be active to request plan changes'));
      }

      // Verificar que el plan existe
      const newPlan = await prisma.plan.findUnique({ where: { id: planId } });
      if (!newPlan || !newPlan.active) {
        return Result.error(new Error('Plan not found or not available'));
      }

      // Buscar suscripción actual
      const currentSubscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: { in: ['ACTIVE', 'GRACE'] },
        },
        include: { plan: true },
      });

      if (!currentSubscription) {
        return Result.error(new Error('No active subscription found'));
      }

      if (currentSubscription.planId === planId) {
        return Result.error(new Error('You are already on this plan'));
      }

      // Por ahora, guardamos la solicitud en el campo meta de la suscripción
      // En una implementación completa, se crearía una tabla separada para solicitudes
      const updatedSubscription = await prisma.subscription.update({
        where: { id: currentSubscription.id },
        data: {
          meta: {
            ...(currentSubscription.meta as object || {}),
            upgradeRequest: {
              requestedPlanId: planId,
              requestedPlanName: newPlan.name,
              reason,
              requestedAt: new Date().toISOString(),
              status: 'PENDING',
            },
          },
        },
      });

      logger.info(`Upgrade request from user ${userId}: ${currentSubscription.plan.name} -> ${newPlan.name}`);

      return Result.ok({
        message: 'Tu solicitud de cambio de plan ha sido recibida y será procesada pronto',
        currentPlan: currentSubscription.plan.name,
        requestedPlan: newPlan.name,
        requestId: currentSubscription.id,
      });
    } catch (error) {
      logger.error('Request upgrade error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to request upgrade'));
    }
  }
}
