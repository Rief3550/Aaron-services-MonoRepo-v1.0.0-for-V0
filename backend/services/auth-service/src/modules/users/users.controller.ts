import { Roles, CurrentUser } from '@aaron/auth';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { toApiResponse } from '../common/api-response.util';

import { CreateUserDto, UpdateUserDto } from './dto/users.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: any) {
    const result = await this.usersService.getById(user.userId);
    return toApiResponse(result);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUserDto) {
    const result = await this.usersService.create(dto);
    return toApiResponse(result);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async list() {
    const result = await this.usersService.list();
    return toApiResponse(result);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getById(@Param('id') id: string) {
    const result = await this.usersService.getById(id);
    return toApiResponse(result);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const result = await this.usersService.update(id, dto);
    return toApiResponse(result);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    const result = await this.usersService.delete(id);
    return toApiResponse(result, { message: 'User deleted successfully' });
  }
}
