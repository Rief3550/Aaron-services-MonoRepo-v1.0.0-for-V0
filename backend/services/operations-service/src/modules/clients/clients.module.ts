import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { ClientEmailService } from './email.service';
import { TestEmailController } from './test-email.controller';

@Module({
  controllers: [ClientsController, TestEmailController],
  providers: [ClientsService, ClientEmailService],
  exports: [ClientsService],
})
export class ClientsModule {}

