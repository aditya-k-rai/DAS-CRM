import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { UsersModule } from './modules/users/users.module';
import { TeamsModule } from './modules/teams/teams.module';
import { RolesModule } from './modules/roles/roles.module';
import { LeadsModule } from './modules/leads/leads.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { PipelinesModule } from './modules/pipelines/pipelines.module';
import { DealsModule } from './modules/deals/deals.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { QuotationsModule } from './modules/quotations/quotations.module';
import { ProductsModule } from './modules/products/products.module';
import { CustomFieldsModule } from './modules/custom-fields/custom-fields.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { ImportsModule } from './modules/imports/imports.module';
import { RoleTransitionModule } from './modules/role-transition/role-transition.module';
import { BillingModule } from './modules/billing/billing.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { DriveModule } from './modules/drive/drive.module';
import { EmailModule } from './modules/email/email.module';
import { AIScoringModule } from './modules/ai-scoring/ai-scoring.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'auth_otp', ttl: 3600000, limit: 15 },
      { name: 'bulk_import', ttl: 3600000, limit: 40 },
      { name: 'general_crud', ttl: 3600000, limit: 1000 },
      { name: 'free_tier', ttl: 3600000, limit: 500 },
      { name: 'growth_tier', ttl: 3600000, limit: 2000 },
      { name: 'pro_max_tier', ttl: 3600000, limit: 5000 },
    ]),
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
        },
      }),
    }),
    PrismaModule,
    AuthModule,
    OrganizationsModule,
    UsersModule,
    TeamsModule,
    RolesModule,
    LeadsModule,
    ContactsModule,
    CompaniesModule,
    PipelinesModule,
    DealsModule,
    TasksModule,
    ActivitiesModule,
    QuotationsModule,
    ProductsModule,
    CustomFieldsModule,
    TemplatesModule,
    NotificationsModule,
    AuditLogsModule,
    ImportsModule,
    RoleTransitionModule,
    BillingModule,
    WhatsappModule,
    DriveModule,
    EmailModule,
    AIScoringModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}
