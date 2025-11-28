import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PingModule } from '../ping/ping.module';
import { WsModule } from '../ws/ws.module';

import { EventsService } from './events.service';

@Module({
  imports: [ConfigModule, WsModule, PingModule],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
