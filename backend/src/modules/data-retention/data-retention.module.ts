import { Module } from '@nestjs/common';
import { DataRetentionService } from './data-retention.service';
import { DataRetentionController } from './data-retention.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { DriveModule } from '../drive/drive.module';

@Module({
  imports: [PrismaModule, DriveModule],
  controllers: [DataRetentionController],
  providers: [DataRetentionService],
  exports: [DataRetentionService],
})
export class DataRetentionModule {}
