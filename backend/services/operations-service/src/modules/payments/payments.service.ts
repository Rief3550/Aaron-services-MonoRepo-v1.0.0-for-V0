import { Result, Logger } from '@aaron/common';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

import { prisma } from '../../config/database';

import { CreatePaymentIntentDto, ManualPaymentInputDto, ProcessPaymentDto } from './dto/payments.dto';

const logger = new Logger('PaymentsService');

interface TicketInput {
  amount?: number;
  note?: string;
}

@Injectable()
export class PaymentsService {
  private stripe?: Stripe;

  constructor(private readonly configService: ConfigService) {
    const secret = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (secret) {
      this.stripe = new Stripe(secret, {
        // use default API version from stripe package
      });
    }
  }

  async list(params?: { subscriptionId?: string; userId?: string; status?: string }) {
    try {
      const where: any = {};
      if (params?.subscriptionId) where.subscriptionId = params.subscriptionId;
      if (params?.status) where.status = params.status;

      // Si se pasa userId, filtramos por subs del user
      if (params?.userId) {
        where.subscription = {
          userId: params.userId,
        } as any;
      }

      const payments = await prisma.payment.findMany({
        where,
        orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
      });

      return Result.ok(payments);
    } catch (error) {
      logger.error('List payments error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to list payments'));
    }
  }

  async createIntent(dto: CreatePaymentIntentDto) {
    try {
      const currency = (dto.currency || 'ARS').toLowerCase();

      if (this.stripe) {
        const intent = await this.stripe.paymentIntents.create({
          amount: Math.round(dto.amount * 100),
          currency,
          metadata: {
            subscriptionId: dto.subscriptionId,
            ...dto.metadata,
          },
          automatic_payment_methods: { enabled: true },
        });

        await prisma.payment.create({
          data: {
            subscriptionId: dto.subscriptionId,
            amount: dto.amount,
            monto: dto.amount,
            currency: currency.toUpperCase(),
            moneda: currency.toUpperCase(),
            provider: 'stripe',
            intentId: intent.id,
            status: this.mapStripeStatus(intent.status),
            metadata: intent.metadata as Record<string, any>,
          },
        });

        return Result.ok({
          intentId: intent.id,
          clientSecret: intent.client_secret,
          status: this.mapStripeStatus(intent.status),
          provider: 'stripe',
        });
      }

      const record = await prisma.payment.create({
        data: {
          subscriptionId: dto.subscriptionId,
          amount: dto.amount,
          monto: dto.amount,
          currency: currency.toUpperCase(),
          moneda: currency.toUpperCase(),
          provider: 'mock',
          status: 'PENDING',
          metadata: dto.metadata || {},
        },
      });

      logger.warn('Stripe not configured, returning mock payment intent');

      return Result.ok({
        intentId: record.id,
        status: record.status,
        provider: 'mock',
      });
    } catch (error) {
      logger.error('Create payment intent error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to create payment intent'));
    }
  }

  async process(dto: ProcessPaymentDto) {
    try {
      let resultingStatus = dto.status;

      if (this.stripe) {
        if (dto.status === 'confirm' && dto.paymentMethodId) {
          const confirmed = await this.stripe.paymentIntents.confirm(dto.intentId, {
            payment_method: dto.paymentMethodId,
          });
          resultingStatus = confirmed.status;
        } else {
          const updated = await this.stripe.paymentIntents.update(dto.intentId, {
            metadata: dto.metadata,
          });
          resultingStatus = updated.status;
        }
      }

      const updateResult = await prisma.payment.updateMany({
        where: { intentId: dto.intentId },
        data: {
          status: this.mapStripeStatus(resultingStatus),
          metadata: dto.metadata || {},
        },
      });

      if (updateResult.count === 0) {
        await prisma.payment.create({
          data: {
            intentId: dto.intentId,
            provider: this.stripe ? 'stripe' : 'mock',
            status: this.mapStripeStatus(resultingStatus),
            amount: 0,
            monto: 0,
            currency: 'ARS',
            moneda: 'ARS',
            metadata: dto.metadata || {},
          },
        });
      }

      logger.info('Payment processed', { intentId: dto.intentId, status: resultingStatus });

      return Result.ok({
        intentId: dto.intentId,
        status: this.mapStripeStatus(resultingStatus),
        provider: this.stripe ? 'stripe' : 'mock',
      });
    } catch (error) {
      logger.error('Process payment error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to process payment'));
    }
  }

  async recordManual(dto: ManualPaymentInputDto) {
    try {
      const paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();
      const currency = (dto.currency || 'ARS').toUpperCase();

      const payment = await prisma.payment.create({
        data: {
          subscriptionId: dto.subscriptionId,
          amount: dto.amount,
          monto: dto.amount,
          currency,
          moneda: currency,
          provider: 'admin',
          type: 'ADMIN_MANUAL',
          status: 'POSTED',
          paidAt,
          note: dto.note || undefined,
        },
      });

      logger.info('Manual payment recorded', { subscriptionId: dto.subscriptionId, amount: dto.amount });
      return Result.ok(payment);
    } catch (error) {
      logger.error('Record manual payment error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to record manual payment'));
    }
  }

  private mapStripeStatus(status: string): 'PENDING' | 'POSTED' | 'FAILED' | 'VOID' {
    const s = (status || '').toLowerCase();
    if (['succeeded', 'requires_capture'].includes(s)) return 'POSTED';
    if (['processing', 'requires_confirmation', 'requires_payment_method', 'requires_action'].includes(s)) return 'PENDING';
    if (s === 'canceled') return 'VOID';
    if (s === 'failed') return 'FAILED';
    return 'PENDING';
  }

  /**
   * Pagos del cliente (por userId)
   */
  async findByUserId(userId: string) {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: { not: 'CANCELED' },
        },
        include: {
          plan: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!subscription) {
        return Result.ok({ payments: [], subscription: null });
      }

      const payments = await prisma.payment.findMany({
        where: { subscriptionId: subscription.id },
        orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
      });

      return Result.ok({
        subscription: {
          id: subscription.id,
          plan: subscription.plan,
          currentPeriodEnd: subscription.currentPeriodEnd,
          nextChargeAt: subscription.nextChargeAt,
          status: subscription.status,
        },
        payments,
      });
    } catch (error) {
      logger.error('Find payments by user error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to find payments'));
    }
  }

  /**
   * Crear un "ticket" de pago manual solicitado por el cliente
   */
  async createCustomerTicket(userId: string, input: TicketInput) {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: { in: ['ACTIVE', 'GRACE', 'PAST_DUE'] },
        },
        include: {
          plan: true,
        },
      });

      if (!subscription) {
        return Result.error(new Error('No active subscription found'));
      }

      const amount = input.amount ?? Number(subscription.montoMensual || subscription.plan?.price || 0);
      const currency = (subscription.plan?.currency || 'ARS').toUpperCase();

      const payment = await prisma.payment.create({
        data: {
          subscriptionId: subscription.id,
          amount,
          monto: amount,
          currency,
          moneda: currency,
          provider: 'customer',
          type: 'ADMIN_MANUAL',
          status: 'PENDING',
          dueDate: subscription.nextChargeAt || subscription.currentPeriodEnd || undefined,
          periodoDesde: subscription.currentPeriodStart || undefined,
          periodoHasta: subscription.currentPeriodEnd || undefined,
          note: input.note || 'Ticket de pago solicitado por el cliente',
          metadata: {
            ticket: true,
            source: 'customer',
          },
        },
      });

      return Result.ok(payment);
    } catch (error) {
      logger.error('Create customer ticket error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to create payment ticket'));
    }
  }
}
