import { Result } from '@aaron/common';
import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';

import { prisma } from '../../config/database';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import { AdminCreateUserDto, AdminUpdateUserDto, UserFilterDto } from './dto/admin-user.dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN')
  async list(@Query() filters: UserFilterDto) {
    const result = await this.usersService.list({
      role: filters.role,
      active: filters.active === undefined ? undefined : String(filters.active) === 'true',
      search: filters.search,
    });
    return Result.unwrap(result);
  }

  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN')
  async create(@Body() dto: AdminCreateUserDto) {
    // Look up role ID
    const role = await prisma.role.findUnique({
      where: { name: dto.role.toUpperCase() },
    });

    if (!role) {
      throw new Error(`Role ${dto.role} not found`);
    }

    const result = await this.usersService.create({
      email: dto.email,
      fullName: dto.fullName,
      password: dto.password, // Optional, service handles hashing
      roleIds: [role.id],
      phone: dto.phone,
      zone: dto.zone,
    });

    const user = Result.unwrap(result);
    
    // If active is specified and false (default is true in DB), update it
    if (dto.active === false) {
      await this.usersService.toggleStatus(user.id, false);
    }

    return user;
  }

  @Put(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async update(@Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    let roleIds: string[] | undefined;

    if (dto.role) {
      const role = await prisma.role.findUnique({
        where: { name: dto.role.toUpperCase() },
      });
      if (!role) throw new Error(`Role ${dto.role} not found`);
      roleIds = [role.id];
    }

    const result = await this.usersService.update(id, {
      email: dto.email,
      fullName: dto.fullName,
      roleIds,
      phone: dto.phone,
      zone: dto.zone,
    });

    const user = Result.unwrap(result);

    if (dto.active !== undefined) {
      await this.usersService.toggleStatus(id, dto.active);
    }

    return user;
  }

  @Patch(':id/estado')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async toggleStatus(@Param('id') id: string, @Body('active') active: boolean) {
    const result = await this.usersService.toggleStatus(id, active);
    return Result.unwrap(result);
  }

  @Delete(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async delete(@Param('id') id: string) {
    const result = await this.usersService.delete(id);
    Result.unwrap(result);
    return { success: true };
  }
}
