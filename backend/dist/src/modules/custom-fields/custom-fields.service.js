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
        const entity = entityType ? entityType.toLowerCase() : undefined;
        return this.prisma.customFieldDefinition.findMany({
            where: {
                organizationId,
                ...(entity && { entity }),
            },
            orderBy: { order: 'asc' },
        });
    }
    async create(organizationId, dto) {
        const entity = dto.entityType.toLowerCase();
        const key = dto.fieldName;
        const label = dto.fieldLabel;
        const fieldTypeEnum = (dto.fieldType === 'TEXTAREA' ? 'TEXT' : dto.fieldType);
        const existing = await this.prisma.customFieldDefinition.findFirst({
            where: { organizationId, entity, key },
        });
        if (existing)
            throw new common_1.BadRequestException(`Field '${key}' already exists for ${entity}`);
        const count = await this.prisma.customFieldDefinition.count({
            where: { organizationId, entity },
        });
        return this.prisma.customFieldDefinition.create({
            data: {
                organizationId,
                entity,
                key,
                label,
                fieldType: fieldTypeEnum,
                isRequired: dto.isRequired ?? false,
                options: dto.options ?? [],
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
            data: {
                ...(dto.label || dto.fieldLabel ? { label: dto.label ?? dto.fieldLabel } : {}),
                ...(dto.isRequired !== undefined ? { isRequired: dto.isRequired } : {}),
                ...(dto.options ? { options: dto.options } : {}),
                ...(dto.order !== undefined ? { order: dto.order } : {}),
            },
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
            const val = values[def.key];
            if (def.isRequired && (val === undefined || val === null || val === '')) {
                throw new common_1.BadRequestException(`Custom field '${def.label}' is required.`);
            }
            const opts = Array.isArray(def.options) ? def.options : [];
            if (val !== undefined && val !== null && def.fieldType === 'DROPDOWN' && opts.length > 0) {
                if (!opts.includes(val)) {
                    throw new common_1.BadRequestException(`Invalid option '${val}' for field '${def.label}'.`);
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