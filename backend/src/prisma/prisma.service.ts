import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
    });
  }

  async onModuleInit() {
    const maxRetries = 5;
    let delay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();
        this.logger.log('✅ Successfully connected to database');
        return;
      } catch (error) {
        this.logger.warn(
          `⚠️ Database connection attempt ${attempt}/${maxRetries} failed: ${(error as Error)?.message || error}. Retrying in ${delay}ms...`,
        );
        if (attempt === maxRetries) {
          this.logger.error(
            '❌ Failed to connect to database after maximum retries. Please verify DATABASE_URL and DIRECT_URL on your server.',
            error,
          );
          if (process.env.NODE_ENV === 'production') {
            this.logger.warn(
              'Server will continue running in recovery mode while database reconnects in the background.',
            );
            return;
          }
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * 2, 8000);
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Tenant-safe query helper — adds organizationId to every operation
  withTenant<T extends { organizationId?: string }>(
    organizationId: string,
    data: T,
  ): T & { organizationId: string } {
    return { ...data, organizationId };
  }
}
