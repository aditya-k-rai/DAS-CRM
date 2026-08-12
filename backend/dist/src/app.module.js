"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const bull_1 = require("@nestjs/bull");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./modules/auth/auth.module");
const organizations_module_1 = require("./modules/organizations/organizations.module");
const users_module_1 = require("./modules/users/users.module");
const teams_module_1 = require("./modules/teams/teams.module");
const roles_module_1 = require("./modules/roles/roles.module");
const leads_module_1 = require("./modules/leads/leads.module");
const contacts_module_1 = require("./modules/contacts/contacts.module");
const companies_module_1 = require("./modules/companies/companies.module");
const pipelines_module_1 = require("./modules/pipelines/pipelines.module");
const deals_module_1 = require("./modules/deals/deals.module");
const tasks_module_1 = require("./modules/tasks/tasks.module");
const activities_module_1 = require("./modules/activities/activities.module");
const quotations_module_1 = require("./modules/quotations/quotations.module");
const products_module_1 = require("./modules/products/products.module");
const custom_fields_module_1 = require("./modules/custom-fields/custom-fields.module");
const templates_module_1 = require("./modules/templates/templates.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const audit_logs_module_1 = require("./modules/audit-logs/audit-logs.module");
const imports_module_1 = require("./modules/imports/imports.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
            bull_1.BullModule.forRoot({
                redis: { host: 'localhost', port: 6379 },
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            organizations_module_1.OrganizationsModule,
            users_module_1.UsersModule,
            teams_module_1.TeamsModule,
            roles_module_1.RolesModule,
            leads_module_1.LeadsModule,
            contacts_module_1.ContactsModule,
            companies_module_1.CompaniesModule,
            pipelines_module_1.PipelinesModule,
            deals_module_1.DealsModule,
            tasks_module_1.TasksModule,
            activities_module_1.ActivitiesModule,
            quotations_module_1.QuotationsModule,
            products_module_1.ProductsModule,
            custom_fields_module_1.CustomFieldsModule,
            templates_module_1.TemplatesModule,
            notifications_module_1.NotificationsModule,
            audit_logs_module_1.AuditLogsModule,
            imports_module_1.ImportsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map