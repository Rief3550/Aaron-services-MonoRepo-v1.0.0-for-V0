/**
 * Servicio de Planes
 */
import { Result } from '@aaron/common';
import { Logger } from '@aaron/common';

import { prisma } from '../config/database';

const logger = new Logger('PlanService');

export interface CreatePlanDto {
  name: string;
  description?: string;
  price: number;
  currency?: string;
}

export interface UpdatePlanDto {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  active?: boolean;
}

export class PlanService {
  /**
   * Listar planes activos
   */
  static async listPlans(activeOnly: boolean = true) {
    try {
      const plans = await prisma.plan.findMany({
        where: activeOnly ? { active: true } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { subscriptions: true },
          },
        },
      });

      return Result.ok(plans);
    } catch (error) {
      logger.error('List plans error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to list plans'));
    }
  }

  /**
   * Crear plan
   */
  static async createPlan(data: CreatePlanDto) {
    try {
      const plan = await prisma.plan.create({
        data: {
          name: data.name,
          description: data.description,
          price: data.price,
          currency: data.currency || 'ARS',
        },
      });

      // Crear entrada en histórico de precios
      await prisma.priceHistory.create({
        data: {
          planId: plan.id,
          price: plan.price,
          from: new Date(),
        },
      });

      return Result.ok(plan);
    } catch (error) {
      logger.error('Create plan error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to create plan'));
    }
  }

  /**
   * Actualizar plan
   */
  static async updatePlan(planId: string, data: UpdatePlanDto) {
    try {
      const currentPlan = await prisma.plan.findUnique({ where: { id: planId } });
      
      if (!currentPlan) {
        return Result.error(new Error('Plan not found'));
      }

      // Si cambió el precio, crear nueva entrada en histórico
      if (data.price !== undefined && data.price !== Number(currentPlan.price)) {
        // Cerrar histórico anterior
        await prisma.priceHistory.updateMany({
          where: {
            planId,
            to: null,
          },
          data: {
            to: new Date(),
          },
        });

        // Crear nueva entrada
        await prisma.priceHistory.create({
          data: {
            planId,
            price: data.price,
            from: new Date(),
          },
        });
      }

      const updated = await prisma.plan.update({
        where: { id: planId },
        data,
      });

      return Result.ok(updated);
    } catch (error) {
      logger.error('Update plan error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to update plan'));
    }
  }

  /**
   * Obtener histórico de precios de un plan
   */
  static async getPriceHistory(planId: string) {
    try {
      const history = await prisma.priceHistory.findMany({
        where: { planId },
        orderBy: { from: 'desc' },
      });

      return Result.ok(history);
    } catch (error) {
      logger.error('Get price history error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to get price history'));
    }
  }
}

