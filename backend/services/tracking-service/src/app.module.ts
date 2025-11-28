import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { EventsModule } from './modules/events/events.module';
import { HealthModule } from './modules/health/health.module';
import { PingModule } from './modules/ping/ping.module';
import { RoutesModule } from './modules/routes/routes.module';
import { WsModule } from './modules/ws/ws.module';

@Module({
  imports: [
    // ConfigModule global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    // Application modules
    WsModule,
    PingModule,
    RoutesModule,
    EventsModule,
    HealthModule,
  ],
})
export class AppModule {}

