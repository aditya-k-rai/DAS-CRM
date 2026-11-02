import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

let lastRefreshedTimestamp = Date.now();
let totalPingsCount = 0;

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    lastRefreshedTimestamp = Date.now();
    totalPingsCount++;
    return {
      status: 'ok',
      active: true,
      message: 'Backend Refreshed & Active',
      service: 'DAS CRM NestJS Production Backend',
      timestamp: new Date().toISOString(),
      lastRefreshedAt: lastRefreshedTimestamp,
      pingsCount: totalPingsCount,
      uptimeSeconds: process.uptime(),
    };
  }

  @Get('api/v1/health')
  getApiV1Health() {
    lastRefreshedTimestamp = Date.now();
    totalPingsCount++;
    return {
      status: 'ok',
      active: true,
      message: 'Backend Refreshed & Active',
      service: 'DAS CRM NestJS Production Backend API v1',
      timestamp: new Date().toISOString(),
      lastRefreshedAt: lastRefreshedTimestamp,
      pingsCount: totalPingsCount,
      uptimeSeconds: process.uptime(),
    };
  }

  @Get('api/v1/system/heartbeat')
  getHeartbeat() {
    return {
      status: 'ok',
      active: true,
      message: 'Backend Refreshed & Active',
      lastRefreshedAt: lastRefreshedTimestamp,
      pingsCount: totalPingsCount,
      uptimeSeconds: process.uptime(),
      serverTime: new Date().toISOString(),
    };
  }
}
