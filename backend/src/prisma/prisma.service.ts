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
    try {
      await this.$connect();
      this.logger.log('Successfully connected to database');
    } catch (error) {
      this.logger.error(
        'Failed to connect to database. Please verify DATABASE_URL and DIRECT_URL environment variables on your server.',
        error,
      );
      throw error;
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
