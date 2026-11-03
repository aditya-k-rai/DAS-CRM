import { Controller, Get, Query, Headers } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(
    @Query('interval') interval?: string,
    @Headers('x-ping-interval') headerInterval?: string,
  ) {
    const hint = interval || headerInterval;
    return this.appService.recordExternalPing(hint);
  }

  @Get('api/v1/health')
  getApiV1Health(
    @Query('interval') interval?: string,
    @Headers('x-ping-interval') headerInterval?: string,
  ) {
    const hint = interval || headerInterval;
    return this.appService.recordExternalPing(hint);
  }

  @Get('api/v1/system/heartbeat')
  getHeartbeat() {
    return this.appService.getStatus();
  }
}
