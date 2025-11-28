import { Result, Logger } from '@aaron/common';
import { Injectable } from '@nestjs/common';

import { prisma } from '../../config/database';

import { CreateWorkTypeDto, UpdateWorkTypeDto } from './dto/work-type.dto';

const logger = new Logger('WorkTypesService');

@Injectable()
export class WorkTypesService {
  async list(activeOnly: boolean = false) {
    try {
      const workTypes = await prisma.workType.findMany({
        where: activeOnly ? { activo: true } : undefined,
        orderBy: { nombre: 'asc' },
        include: {
          _count: {
            select: { workOrders: true },
          },
        },
      });
      return Result.ok(workTypes);
    } catch (error) {
      logger.error('List work types error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to list work types'));
    }
  }

  async findById(id: string) {
    try {
      const workType = await prisma.workType.findUnique({
        where: { id },
        include: {
          plans: {
            select: { id: true, name: true, active: true },
          },
          _count: {
            select: { workOrders: true },
          },
        },
      });
      if (!workType) {
        return Result.error(new Error('WorkType not found'));
      }
      return Result.ok(workType);
    } catch (error) {
      logger.error('Find work type by id error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to find work type'));
    }
  }

  /**
   * Lista tipos de trabajo activos para la app del cliente
   */
  async listActive() {
    try {
      const workTypes = await prisma.workType.findMany({
        where: { activo: true },
        select: {
          id: true,
          nombre: true,
          descripcion: true,
          unidad: true,
        },
        orderBy: { nombre: 'asc' },
      });
      return Result.ok(workTypes);
    } catch (error) {
      logger.error('List active work types error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to list active work types'));
    }
  }

  async create(dto: CreateWorkTypeDto) {
    try {
      const workType = await prisma.workType.create({
        data: {
          nombre: dto.nombre,
          descripcion: dto.descripcion,
          costoBase: dto.costoBase,
          unidad: dto.unidad,
          activo: dto.activo ?? true,
        },
      });
      return Result.ok(workType);
    } catch (error) {
      logger.error('Create work type error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to create work type'));
    }
  }

  async update(id: string, dto: UpdateWorkTypeDto) {
    try {
      const workType = await prisma.workType.update({
        where: { id },
        data: {
          ...(dto.nombre && { nombre: dto.nombre }),
          ...(dto.descripcion !== undefined && { descripcion: dto.descripcion }),
          ...(dto.costoBase !== undefined && { costoBase: dto.costoBase }),
          ...(dto.unidad !== undefined && { unidad: dto.unidad }),
          ...(dto.activo !== undefined && { activo: dto.activo }),
        },
      });
      return Result.ok(workType);
    } catch (error) {
      logger.error('Update work type error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to update work type'));
    }
  }

  async delete(id: string) {
    try {
      await prisma.workType.delete({ where: { id } });
      return Result.ok(undefined);
    } catch (error) {
      logger.error('Delete work type error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to delete work type'));
    }
  }
}
