import { Module } from '@nestjs/common';

import { CrewsController } from './crews.controller';
import { AdminCrewsController } from './admin-crews.controller';
import { CrewsService } from './crews.service';

@Module({
  controllers: [CrewsController, AdminCrewsController],
  providers: [CrewsService],
  exports: [CrewsService],
})
export class CrewsModule {}
