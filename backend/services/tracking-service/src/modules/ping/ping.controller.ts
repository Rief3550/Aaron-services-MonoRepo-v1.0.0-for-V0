import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard, JwtAuthRequest } from '../ws/guards/jwt-auth.guard';

import { PingDto } from './dto/ping.dto';
import { TrackingService } from './tracking.service';

@Controller('track')
export class PingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post('ping')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async ping(@Body() dto: PingDto, @Req() req: JwtAuthRequest) {
    const user = req.user;

    if (!user) {
      throw new ForbiddenException('Missing authentication context');
    }

    const roles = user.roles || [];
    const privileged = roles.some((role) => role === 'ADMIN' || role === 'OPERATOR');

    if (!privileged) {
      const crewClaim = (user as any)?.crewId || user.userId || user.sub;
      if (!crewClaim || crewClaim !== dto.crewId) {
        throw new ForbiddenException('Not allowed to send pings for this crew');
      }
    }

    return this.trackingService.savePing({
      ...dto,
      source: 'hourly_api',
    });
  }
}
