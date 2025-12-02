import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuditFormsModule } from './modules/audit-forms/audit-forms.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { CrewsModule } from './modules/crews/crews.module';
import { EventsModule } from './modules/events/events.module';
import { HealthModule } from './modules/health/health.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PlansModule } from './modules/plans/plans.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { WorkOrdersModule } from './modules/work-orders/work-orders.module';
import { WorkTypesModule } from './modules/work-types/work-types.module';

@Module({
  imports: [
    // ConfigModule global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    // Application modules
    AuditFormsModule,
    ClientsModule,
    ContractsModule,
    PlansModule,
    SubscriptionsModule,
    WorkOrdersModule,
    WorkTypesModule,
    CrewsModule,
    MetricsModule,
    EventsModule,
    PropertiesModule,
    PaymentsModule,
    HealthModule,
  ],
  providers: [JwtAuthGuard, RolesGuard],
})
export class AppModule {}
