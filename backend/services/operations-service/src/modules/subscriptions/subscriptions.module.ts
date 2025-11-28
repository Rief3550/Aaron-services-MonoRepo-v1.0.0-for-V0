import { Module } from '@nestjs/common';

import { SubscriptionsController } from './subscriptions.controller';
import { AdminSubscriptionsController } from './admin-subscriptions.controller';
import { SubscriptionsScheduler } from './subscriptions.scheduler';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  controllers: [SubscriptionsController, AdminSubscriptionsController],
  providers: [SubscriptionsService, SubscriptionsScheduler],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
