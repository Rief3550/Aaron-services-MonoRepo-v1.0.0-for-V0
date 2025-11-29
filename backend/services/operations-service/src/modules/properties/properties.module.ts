import { Module } from '@nestjs/common';

import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { ClientEmailService } from '../clients/email.service';

@Module({
  controllers: [PropertiesController],
  providers: [PropertiesService, ClientEmailService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
