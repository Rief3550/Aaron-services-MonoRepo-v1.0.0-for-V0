import { Module } from '@nestjs/common';
import { AuditFormsController } from './audit-forms.controller';
import { AuditFormsService } from './audit-forms.service';

@Module({
  controllers: [AuditFormsController],
  providers: [AuditFormsService],
  exports: [AuditFormsService],
})
export class AuditFormsModule {}


