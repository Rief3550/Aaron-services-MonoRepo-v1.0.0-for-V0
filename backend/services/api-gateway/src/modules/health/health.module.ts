import { Module } from '@nestjs/common';

import { HealthController } from './health.controller';

/**
 * HealthModule
 * Endpoint de health check del gateway
 */
@Module({
  controllers: [HealthController],
})
export class HealthModule {}

