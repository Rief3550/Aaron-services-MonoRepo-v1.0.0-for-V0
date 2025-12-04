import { Result } from '@aaron/common';
import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { Prisma } from '@aaron/prisma-client-auth';

import { prisma } from '../../config/database';

import { CreateUserDto, UpdateUserDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  async create(dto: CreateUserDto): Promise<Result<Error, any>> {
    try {
      const normalizedEmail = dto.email?.trim().toLowerCase();
      const data: any = {
        email: normalizedEmail,
        fullName: dto.fullName,
        phone: dto.phone,
        zone: dto.zone,
      };

      if (dto.password) {
        data.passwordHash = await bcrypt.hash(dto.password, 10);
      }

      const user = await prisma.user.create({
        data: {
          ...data,
          ...(dto.roleIds && {
            roles: {
              connect: dto.roleIds.map((id) => ({ id })),
            },
          }),
        },
        include: { roles: true },
      });

      return Result.ok(user);
    } catch (error) {
      return Result.error(error instanceof Error ? error : new Error('Failed to create user'));
    }
  }

  async list(filters?: { role?: string; active?: boolean; search?: string }): Promise<Result<Error, any>> {
    try {
      const where: any = {};

      if (filters?.role) {
        where.roles = {
          some: {
            name: filters.role.toUpperCase(),
          },
        };
      }

      if (filters?.active !== undefined) {
        where.active = filters.active;
      }

      if (filters?.search) {
        where.OR = [
          { email: { contains: filters.search, mode: 'insensitive' } },
          { fullName: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      const users = await prisma.user.findMany({
        where,
        include: { roles: true },
        orderBy: { createdAt: 'desc' },
      });
      return Result.ok(users);
    } catch (error) {
      return Result.error(error instanceof Error ? error : new Error('Failed to list users'));
    }
  }

  async toggleStatus(id: string, active: boolean): Promise<Result<Error, any>> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: { active },
        include: { roles: true },
      });
      return Result.ok(user);
    } catch (error) {
      return Result.error(error instanceof Error ? error : new Error('Failed to update user status'));
    }
  }

  async getById(id: string): Promise<Result<Error, any>> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: { roles: true },
      });

      if (!user) {
        return Result.error(new NotFoundException(`User with ID ${id} not found`));
      }

      return Result.ok(user);
    } catch (error) {
      return Result.error(error instanceof Error ? error : new Error('Failed to get user'));
    }
  }

  async update(id: string, dto: UpdateUserDto): Promise<Result<Error, any>> {
    try {
      const updateData: Prisma.UserUpdateInput = {};

      if (dto.email !== undefined) {
        updateData.email = dto.email.trim().toLowerCase();
      }

      if (dto.fullName !== undefined) {
        const trimmedName = dto.fullName.trim();
        updateData.fullName = trimmedName.length ? trimmedName : null;
      }

      if (dto.phone !== undefined) {
        const normalizedPhone = dto.phone.trim();
        updateData.phone = normalizedPhone.length ? normalizedPhone : null;
      }

      if (dto.zone !== undefined) {
        const normalizedZone = dto.zone.trim();
        updateData.zone = normalizedZone.length ? normalizedZone : null;
      }

      if (dto.password !== undefined) {
        const trimmedPassword = dto.password.trim();
        if (trimmedPassword.length) {
          updateData.passwordHash = await bcrypt.hash(trimmedPassword, 10);
        }
      }

      if (dto.roleIds !== undefined) {
        updateData.roles = {
          set: dto.roleIds.map((roleId) => ({ id: roleId })),
        };
      }

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        include: { roles: true },
      });

      return Result.ok(user);
    } catch (error) {
      return Result.error(error instanceof Error ? error : new Error('Failed to update user'));
    }
  }

  async delete(id: string): Promise<Result<Error, void>> {
    try {
      await prisma.user.delete({ where: { id } });
      return Result.ok(undefined);
    } catch (error) {
      return Result.error(error instanceof Error ? error : new Error('Failed to delete user'));
    }
  }
}
