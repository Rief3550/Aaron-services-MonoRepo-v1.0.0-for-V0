import { Result } from '@aaron/common';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { Roles } from '../../common/decorators/roles.decorator';
import { User } from '../../common/decorators/user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

import { CrewsService } from './crews.service';
import { CrewFiltersDto } from './dto/crew-filters.dto';
import { CreateCrewDto, UpdateCrewStateDto, UpdateCrewLocationDto } from './dto/crews.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('crews')
export class CrewsController {
  constructor(private readonly crewsService: CrewsService) {}

  @Get('me')
  @Roles('CREW', 'OPERATOR', 'ADMIN')
  async getMyCrew(@User() user: any) {
    return this.crewsService.findByMember(user.userId);
  }

  @Get()
  @Roles('ADMIN', 'OPERATOR')
  async list(@Query() filters: CrewFiltersDto) {
    const result = await this.crewsService.list(filters.state ? { state: filters.state } : undefined);
    if (Result.isError(result)) throw result.error;
    return Result.unwrap(result);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN')
  async create(@Body() dto: CreateCrewDto) {
    return this.crewsService.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() dto: CreateCrewDto) {
    return this.crewsService.update(id, dto);
  }

  @Patch(':id/state')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'OPERATOR')
  async changeState(@Param('id') id: string, @Body() dto: UpdateCrewStateDto) {
    return this.crewsService.changeState(id, dto);
  }

  @Patch(':id/progress')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'OPERATOR')
  async updateProgress(@Param('id') id: string, @Body('progress') progress: number) {
    return this.crewsService.updateProgress(id, progress);
  }

  @Patch(':id/location')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'OPERATOR', 'CREW')
  async updateLocation(@Param('id') id: string, @Body() dto: UpdateCrewLocationDto) {
    return this.crewsService.updateLocation(id, dto.lat, dto.lng);
  }

  @Get(':id')
  @Roles('ADMIN', 'OPERATOR')
  async findOne(@Param('id') id: string) {
    const result = await this.crewsService.findOneWithOrders(id);
    if (Result.isError(result)) throw result.error;
    return Result.unwrap(result);
  }
}
