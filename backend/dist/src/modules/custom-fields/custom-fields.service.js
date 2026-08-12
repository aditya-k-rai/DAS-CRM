"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomFieldsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let CustomFieldsService = class CustomFieldsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(organizationId, entityType) {
        return this.prisma.customFieldDefinition.findMany({
            where: {
                organizationId,
                ...(entityType && { entityType }),
            },
            orderBy: { order: 'asc' },
        });
    }
    async create(organizationId, dto) {
        const existing = await this.prisma.customFieldDefinition.findFirst({
            where: { organizationId, entityType: dto.entityType, fieldName: dto.fieldName },
        });
        if (existing)
            throw new common_1.BadRequestException(`Field '${dto.fieldName}' already exists for ${dto.entityType}`);
        const count = await this.prisma.customFieldDefinition.count({
            where: { organizationId, entityType: dto.entityType },
        });
        return this.prisma.customFieldDefinition.create({
            data: {
                organizationId,
                entityType: dto.entityType,
                fieldName: dto.fieldName,
                fieldLabel: dto.fieldLabel,
                fieldType: dto.fieldType,
                isRequired: dto.isRequired ?? false,
                isVisible: dto.isVisible ?? true,
                options: dto.options ?? [],
                placeholder: dto.placeholder,
                order: count + 1,
            },
        });
    }
    async update(organizationId, id, dto) {
        const field = await this.prisma.customFieldDefinition.findFirst({ where: { id, organizationId } });
        if (!field)
            throw new common_1.NotFoundException('Custom field not found');
        return this.prisma.customFieldDefinition.update({
            where: { id },
            data: dto,
        });
    }
    async delete(organizationId, id) {
        const field = await this.prisma.customFieldDefinition.findFirst({ where: { id, organizationId } });
        if (!field)
            throw new common_1.NotFoundException('Custom field not found');
        await this.prisma.customFieldDefinition.delete({ where: { id } });
        return { success: true };
    }
    async validateCustomFields(organizationId, entityType, values) {
        const defs = await this.findAll(organizationId, entityType);
        for (const def of defs) {
            const val = values[def.fieldName];
            if (def.isRequired && (val === undefined || val === null || val === '')) {
                throw new common_1.BadRequestException(`Custom field '${def.fieldLabel}' is required.`);
            }
            if (val !== undefined && val !== null && def.fieldType === 'DROPDOWN' && def.options.length > 0) {
                if (!def.options.includes(val)) {
                    throw new common_1.BadRequestException(`Invalid option '${val}' for field '${def.fieldLabel}'.`);
                }
            }
        }
        return true;
    }
};
exports.CustomFieldsService = CustomFieldsService;
exports.CustomFieldsService = CustomFieldsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomFieldsService);
//# sourceMappingURL=custom-fields.service.js.map