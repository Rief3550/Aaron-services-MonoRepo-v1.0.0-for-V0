import { Result , Logger } from '@aaron/common';
import { Injectable } from '@nestjs/common';

import { prisma } from '../../config/database';
import { isValidCrewTransition, CrewState } from '../../utils/state-transitions';

import { CreateCrewDto, UpdateCrewStateDto } from './dto/crews.dto';
import { AdminCreateCrewDto, AdminUpdateCrewDto } from './dto/admin-crew.dto';
const logger = new Logger('CrewsService');

@Injectable()
export class CrewsService {
  async list(filters?: { state?: string }) {
    try {
      const crews = await prisma.crew.findMany({
        where: filters?.state ? { state: filters.state as CrewState } : undefined,
        include: {
          _count: {
            select: { workOrders: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return Result.ok(crews);
    } catch (error) {
      logger.error('List crews error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to list crews'));
    }
  }

  async create(dto: CreateCrewDto | AdminCreateCrewDto) {
    try {
      const data: any = {
        name: dto.name,
        members: dto.members || [],
        state: 'desocupado',
        progress: 0,
      };

      if ('zona' in dto) data.zona = dto.zona;
      if ('notes' in dto) data.notes = dto.notes;
      if ('availability' in dto) data.availability = dto.availability;

      const crew = await prisma.crew.create({ data });
      return Result.ok(crew);
    } catch (error) {
      logger.error('Create crew error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to create crew'));
    }
  }

  async update(id: string, dto: CreateCrewDto | AdminUpdateCrewDto) {
    try {
      const data: any = {};
      if (dto.name) data.name = dto.name;
      if (dto.members) data.members = dto.members;
      
      if ('zona' in dto) data.zona = dto.zona;
      if ('notes' in dto) data.notes = dto.notes;
      if ('availability' in dto) data.availability = dto.availability;

      const crew = await prisma.crew.update({
        where: { id },
        data,
      });
      return Result.ok(crew);
    } catch (error) {
      logger.error('Update crew error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to update crew'));
    }
  }

  async delete(id: string) {
    try {
      await prisma.crew.delete({ where: { id } });
      return Result.ok(undefined);
    } catch (error) {
      logger.error('Delete crew error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to delete crew'));
    }
  }

  async changeState(id: string, dto: UpdateCrewStateDto) {
    try {
      const crew = await prisma.crew.findUnique({ where: { id } });
      if (!crew) {
        return Result.error(new Error('Crew not found'));
      }

      const validation = isValidCrewTransition(crew.state as CrewState, dto.state as CrewState);
      if (!validation.valid) {
        return Result.error(new Error(validation.reason));
      }

      const updated = await prisma.crew.update({
        where: { id },
        data: {
          state: dto.state,
          ...(dto.progress !== undefined && { progress: dto.progress }),
        },
      });

      return Result.ok(updated);
    } catch (error) {
      logger.error('Change crew state error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to change crew state'));
    }
  }

  async updateProgress(id: string, progress: number) {
    try {
      if (progress < 0 || progress > 100) {
        return Result.error(new Error('Progress must be between 0 and 100'));
      }

      const existing = await prisma.crew.findUnique({ where: { id } });
      if (!existing) {
        return Result.error(new Error('Crew not found'));
      }

      const newState = progress > 0 && progress < 100 ? 'en_progreso' : existing.state;

      const crew = await prisma.crew.update({
        where: { id },
        data: {
          progress,
          state: newState,
        },
      });

      return Result.ok(crew);
    } catch (error) {
      logger.error('Update crew progress error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to update crew progress'));
    }
  }

  async updateLocation(id: string, lat: number, lng: number) {
    try {
      const crew = await prisma.crew.update({
        where: { id },
        data: {
          lat,
          lng,
          lastLocationAt: new Date(),
        },
      });
      return Result.ok(crew);
    } catch (error) {
      logger.error('Update crew location error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to update crew location'));
    }
  }
  async findByMember(userId: string) {
    try {
      // Find crew where members array contains userId
      // Since members is JSON, we fetch all and filter in memory for simplicity
      // or use raw query for performance if needed. Given low volume of crews, memory filter is fine.
      const crews = await prisma.crew.findMany();
      
      const myCrew = crews.find(crew => {
        const members = crew.members as string[] | null;
        return Array.isArray(members) && members.includes(userId);
      });

      if (!myCrew) {
        return Result.error(new Error('User is not assigned to any crew'));
      }

      return Result.ok(myCrew);
    } catch (error) {
      logger.error('Find crew by member error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to find crew'));
    }
  }

  async findOneWithOrders(id: string) {
    try {
      const crew = await prisma.crew.findUnique({
        where: { id },
        include: {
          workOrders: {
            orderBy: { createdAt: 'desc' },
            include: {
              client: {
                select: {
                  id: true,
                  nombreCompleto: true,
                  razonSocial: true,
                },
              },
              property: {
                select: {
                  id: true,
                  alias: true,
                  address: true,
                },
              },
              workType: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
              _count: {
                select: { timeline: true },
              },
            },
          },
          _count: {
            select: { workOrders: true },
          },
        },
      });

      if (!crew) {
        return Result.error(new Error('Crew not found'));
      }

      return Result.ok(crew);
    } catch (error) {
      logger.error('Find crew with orders error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to find crew'));
    }
  }
}
