import { Module } from '@nestjs/common';
import { AIScoringController } from './ai-scoring.controller';
import { AIScoringService } from './ai-scoring.service';

@Module({
  controllers: [AIScoringController],
  providers: [AIScoringService],
  exports: [AIScoringService],
})
export class AIScoringModule {}
