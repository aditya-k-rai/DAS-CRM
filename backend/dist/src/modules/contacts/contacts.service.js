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
exports.ContactsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ContactsService = class ContactsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(organizationId, opts) {
        const { search, page = 1, limit = 20 } = opts;
        const where = {
            organizationId,
            ...(search && {
                OR: [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };
        const [total, items] = await Promise.all([
            this.prisma.contact.count({ where }),
            this.prisma.contact.findMany({
                where,
                include: {
                    company: { select: { id: true, name: true } },
                    leads: { select: { id: true, status: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);
        return { total, page, limit, items };
    }
    async findOne(organizationId, id) {
        const contact = await this.prisma.contact.findFirst({
            where: { id, organizationId },
            include: {
                company: true,
                leads: { orderBy: { createdAt: 'desc' } },
                deals: { include: { pipeline: true } },
            },
        });
        if (!contact)
            throw new common_1.NotFoundException('Contact not found');
        return contact;
    }
    async create(organizationId, dto) {
        return this.prisma.contact.create({
            data: {
                organizationId,
                firstName: dto.firstName,
                lastName: dto.lastName,
                email: dto.email,
                phone: dto.phone,
                companyId: dto.companyId,
                designation: dto.designation,
                notes: dto.notes,
                customFields: dto.customFields ?? {},
            },
        });
    }
    async update(organizationId, id, dto) {
        const contact = await this.prisma.contact.findFirst({ where: { id, organizationId } });
        if (!contact)
            throw new common_1.NotFoundException('Contact not found');
        return this.prisma.contact.update({ where: { id }, data: dto });
    }
    async remove(organizationId, id) {
        const contact = await this.prisma.contact.findFirst({ where: { id, organizationId } });
        if (!contact)
            throw new common_1.NotFoundException('Contact not found');
        await this.prisma.contact.delete({ where: { id } });
        return { success: true };
    }
};
exports.ContactsService = ContactsService;
exports.ContactsService = ContactsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ContactsService);
//# sourceMappingURL=contacts.service.js.map