import { Result , Logger } from '@aaron/common';
import { Injectable } from '@nestjs/common';

import { prisma } from '../../config/database';

import { PingDto } from './dto/ping.dto';

const logger = new Logger('TrackingService');

@Injectable()
export class TrackingService {
  async savePing(dto: PingDto) {
    try {
      const ping = await prisma.crewPing.create({
        data: {
          crewId: dto.crewId,
          orderId: dto.orderId,
          lat: dto.lat,
          lng: dto.lng,
          source: dto.source || 'realtime',
        },
      });

      return Result.ok(ping);
    } catch (error) {
      logger.error('Save ping error', error);
      return Result.error(error instanceof Error ? error : new Error('Failed to save ping'));
    }
  }
}
