import { Module } from '@nestjs/common';

import { AdminWorkTypesController } from './admin-work-types.controller';
import { WorkTypesController } from './work-types.controller';
import { WorkTypesService } from './work-types.service';

@Module({
  controllers: [AdminWorkTypesController, WorkTypesController],
  providers: [WorkTypesService],
  exports: [WorkTypesService],
})
export class WorkTypesModule {}
