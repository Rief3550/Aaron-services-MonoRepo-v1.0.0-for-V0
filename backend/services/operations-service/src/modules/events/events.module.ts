import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { EventsService } from './events.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
