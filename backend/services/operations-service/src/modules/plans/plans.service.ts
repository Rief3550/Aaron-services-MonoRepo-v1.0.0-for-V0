import { Result , Logger } from '@aaron/common';
import { Injectable } from '@nestjs/common';

import { prisma } from '../../config/database';

import { CreatePlanDto, UpdatePlanDto } from './dto/plans.dto';
import { AdminCreatePlanDto, AdminUpdatePlanDto } from './dto/admin-plan.dto';

const logger = new Logger('PlansService');

@Injectable()
export class PlansService {
  async list(activeOnly: boolean = true) {
    try {
      const plans = await prisma.plan.findMany({
        where: activeOnly ? { active: true } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          workTypes: true,
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

  async findById(id: string) {
    try {
      const plan = await prisma.plan.findUnique({
        where: { id },
        include: {
          workTypes: true,
          subscriptions: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
          priceHistory: {
            orderBy: { from: 'desc' },
            take: 5,
          },
          _count: {
            select: { subscriptions: true },
          },
        },
      });
      if (!plan) {
        return Result.error(new Error('Plan not found'));
      }
      return Result.ok(plan);
    } catch (error) {
      logger.error('Find plan by id error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to find plan'));
    }
  }

  async create(dto: CreatePlanDto | AdminCreatePlanDto) {
    try {
      const data: any = {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        currency: dto.currency || 'ARS',
      };

      if ('restrictions' in dto) data.restrictions = dto.restrictions;
      if ('active' in dto) data.active = dto.active;
      if ('workTypeIds' in dto && dto.workTypeIds) {
        data.workTypes = {
          connect: dto.workTypeIds.map((id) => ({ id })),
        };
      }

      const plan = await prisma.plan.create({ data });

      // Create initial price history
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

  async update(id: string, dto: UpdatePlanDto | AdminUpdatePlanDto) {
    try {
      const oldPlan = await prisma.plan.findUnique({ where: { id } });
      if (!oldPlan) {
        return Result.error(new Error('Plan not found'));
      }

      // If price changed, update price history
      if (dto.price && dto.price !== Number(oldPlan.price)) {
        // Close old price history entry
        await prisma.priceHistory.updateMany({
          where: {
            planId: id,
            to: null,
          },
          data: {
            to: new Date(),
          },
        });

        // Create new price history entry
        await prisma.priceHistory.create({
          data: {
            planId: id,
            price: dto.price,
            from: new Date(),
          },
        });
      }

      const data: any = {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.price && { price: dto.price }),
        ...(dto.currency && { currency: dto.currency }),
        ...(dto.active !== undefined && { active: dto.active }),
      };

      if ('restrictions' in dto) data.restrictions = dto.restrictions;
      if ('workTypeIds' in dto && dto.workTypeIds) {
        data.workTypes = {
          set: dto.workTypeIds.map((id) => ({ id })),
        };
      }

      const plan = await prisma.plan.update({
        where: { id },
        data,
      });

      return Result.ok(plan);
    } catch (error) {
      logger.error('Update plan error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to update plan'));
    }
  }

  async delete(id: string) {
    try {
      await prisma.plan.delete({ where: { id } });
      return Result.ok(undefined);
    } catch (error) {
      logger.error('Delete plan error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to delete plan'));
    }
  }

  async getPriceHistory(planId: string) {
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
