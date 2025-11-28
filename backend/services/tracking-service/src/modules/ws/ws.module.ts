import { Module } from '@nestjs/common';

import { TrackingService } from '../ping/tracking.service';

import { WsGateway } from './ws.gateway';

@Module({
  providers: [WsGateway, TrackingService],
  exports: [WsGateway],
})
export class WsModule {}
