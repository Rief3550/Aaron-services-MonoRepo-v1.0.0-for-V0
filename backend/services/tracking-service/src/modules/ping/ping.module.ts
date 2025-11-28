import { Module } from '@nestjs/common';

import { PingController } from './ping.controller';
import { TrackingService } from './tracking.service';

@Module({
  controllers: [PingController],
  providers: [TrackingService],
  exports: [TrackingService],
})
export class PingModule {}
