import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import http from 'http';
import https from 'https';

export interface KeepAliveStatus {
  status: string;
  active: boolean;
  message: string;
  service: string;
  timestamp: string;
  lastRefreshedAt: number;
  pingsCount: number;
  pingCycle: '5m' | '8m';
  nextPingIn: string;
  uptimeSeconds: number;
}

@Injectable()
export class AppService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('KeepAlivePingService');

  private lastRefreshedTimestamp = Date.now();
  private totalPingsCount = 0;
  private currentCycle: '5m' | '8m' = '5m';
  private currentMessage = 'Backend Refreshed & Active';
  private timer: NodeJS.Timeout | null = null;

  onModuleInit() {
    this.startAlternatingPingCycle();
  }

  onModuleDestroy() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  getHello(): string {
    return 'Hello World!';
  }

  /**
   * Starts alternating keep-alive self-pings:
   * Cycle 1: After 5 minutes (300,000ms) -> Next cycle: 8 minutes
   * Cycle 2: After 8 minutes (480,000ms) -> Next cycle: 5 minutes
   * Continuously alternates between 5m and 8m to keep Render awake and randomize detection.
   */
  private startAlternatingPingCycle() {
    // Schedule first ping after 5 minutes
    this.scheduleNextPing(5);
  }

  private scheduleNextPing(delayMinutes: number) {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.executeSelfPing(delayMinutes);
    }, delayMinutes * 60 * 1000);

    this.logger.log(`[KeepAlive] Next ping scheduled in ${delayMinutes} minutes.`);
  }

  private async executeSelfPing(cycleMinutes: number) {
    this.totalPingsCount++;
    this.lastRefreshedTimestamp = Date.now();
    this.currentCycle = cycleMinutes === 5 ? '5m' : '8m';
    this.currentMessage = `Backend Refreshed & Active (${cycleMinutes}m Ping)`;

    this.logger.log(
      `[KeepAlive] Ping #${this.totalPingsCount} executed (${cycleMinutes}m cycle). Active message: "${this.currentMessage}"`
    );

    // Ping external Render hostname or localhost to reset Render's 15-min idle sleep counter
    const renderHost = process.env.RENDER_EXTERNAL_HOSTNAME || process.env.RENDER_API_URL;
    if (renderHost) {
      try {
        const targetUrl = renderHost.startsWith('http')
          ? `${renderHost}/health`
          : `https://${renderHost}/health`;
        const client = targetUrl.startsWith('https') ? https : http;
        client
          .get(targetUrl, (res) => {
            this.logger.log(`[KeepAlive] Outbound keep-alive ping to ${targetUrl} status: ${res.statusCode}`);
          })
          .on('error', (err) => {
            this.logger.warn(`[KeepAlive] Outbound ping notice: ${err.message}`);
          });
      } catch (_) {}
    }

    // Next cycle alternates: 5m -> 8m, 8m -> 5m
    const nextMinutes = cycleMinutes === 5 ? 8 : 5;
    this.scheduleNextPing(nextMinutes);
  }

  /** Called when external ping arrives (e.g. GitHub Action or external monitor) */
  recordExternalPing(intervalHint?: string): KeepAliveStatus {
    this.totalPingsCount++;
    this.lastRefreshedTimestamp = Date.now();
    if (intervalHint) {
      this.currentCycle = intervalHint.includes('8') ? '8m' : '5m';
      this.currentMessage = `Backend Refreshed & Active (${this.currentCycle} Ping)`;
    } else {
      this.currentMessage = `Backend Refreshed & Active (${this.currentCycle} Ping)`;
    }
    return this.getStatus();
  }

  getStatus(): KeepAliveStatus {
    return {
      status: 'ok',
      active: true,
      message: this.currentMessage,
      service: 'DAS CRM NestJS Production Backend',
      timestamp: new Date().toISOString(),
      lastRefreshedAt: this.lastRefreshedTimestamp,
      pingsCount: this.totalPingsCount,
      pingCycle: this.currentCycle,
      nextPingIn: this.currentCycle === '5m' ? '8m' : '5m',
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }
}
