import { Result } from '@aaron/common';
import { Injectable, NotFoundException } from '@nestjs/common';

import { prisma } from '../../config/database';

import { CreateRoleDto, UpdateRoleDto } from './dto/roles.dto';


@Injectable()
export class RolesService {
  async create(dto: CreateRoleDto): Promise<Result<Error, any>> {
    try {
      const role = await prisma.role.create({
        data: { name: dto.name, /* description: dto.description */ },
      });
      return Result.ok(role);
    } catch (error) {
      return Result.error(error instanceof Error ? error : new Error('Failed to create role'));
    }
  }

  async list(): Promise<Result<Error, any>> {
    try {
      const roles = await prisma.role.findMany();
      return Result.ok(roles);
    } catch (error) {
      return Result.error(error instanceof Error ? error : new Error('Failed to list roles'));
    }
  }

  async getById(id: string): Promise<Result<Error, any>> {
    try {
      const role = await prisma.role.findUnique({ where: { id } });
      if (!role) {
        return Result.error(new NotFoundException(`Role with ID ${id} not found`));
      }
      return Result.ok(role);
    } catch (error) {
      return Result.error(error instanceof Error ? error : new Error('Failed to get role'));
    }
  }

  async update(id: string, dto: UpdateRoleDto): Promise<Result<Error, any>> {
    try {
      const role = await prisma.role.update({
        where: { id },
        data: { name: dto.name, /* description: dto.description */ },
      });
      return Result.ok(role);
    } catch (error) {
      return Result.error(error instanceof Error ? error : new Error('Failed to update role'));
    }
  }

  async delete(id: string): Promise<Result<Error, void>> {
    try {
      await prisma.role.delete({ where: { id } });
      return Result.ok(undefined);
    } catch (error) {
      return Result.error(error instanceof Error ? error : new Error('Failed to delete role'));
    }
  }

  async assignRoles(userId: string, roleIds: string[]): Promise<Result<Error, any>> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          roles: {
            connect: roleIds.map((id) => ({ id })),
          },
        },
        include: { roles: true },
      });
      return Result.ok(user);
    } catch (error) {
      return Result.error(error instanceof Error ? error : new Error('Failed to assign roles'));
    }
  }

  async removeRoles(userId: string, roleIds: string[]): Promise<Result<Error, any>> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          roles: {
            disconnect: roleIds.map((id) => ({ id })),
          },
        },
        include: { roles: true },
      });
      return Result.ok(user);
    } catch (error) {
      return Result.error(error instanceof Error ? error : new Error('Failed to remove roles'));
    }
  }
}
