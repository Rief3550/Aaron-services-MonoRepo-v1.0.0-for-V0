import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { SubscriptionsService } from './subscriptions.service';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class SubscriptionsScheduler implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  onModuleInit() {
    // Ejecuta al iniciar y luego cada 24h
    this.tick();
    this.timer = setInterval(() => this.tick(), ONE_DAY_MS);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private async tick() {
    await this.subscriptionsService.runDailyStatusJob();
  }
}
