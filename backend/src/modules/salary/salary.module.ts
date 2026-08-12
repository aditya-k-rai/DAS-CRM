import { Module } from '@nestjs/common';
import { SalaryController } from './salary.controller';
import { SalaryService } from './salary.service';
@Module({
  controllers: [SalaryController],
  providers: [SalaryService],
  exports: [SalaryService],
})
export class SalaryModule {}
