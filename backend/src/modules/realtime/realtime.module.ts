import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { RealtimeService } from './realtime.service';
import { RealtimeController } from './realtime.controller';

@Global()
@Module({
  imports: [ConfigModule, JwtModule.register({})],
  controllers: [RealtimeController],
  providers: [RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}
