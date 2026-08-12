import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, opts: { search?: string; industry?: string; page?: number; limit?: number }) {
    const { search, industry, page = 1, limit = 20 } = opts;
    const where: any = {
      organizationId,
      ...(industry && { industry }),
      ...(search && {
        OR: [
          { name:   { contains: search, mode: 'insensitive' } },
          { domain: { contains: search, mode: 'insensitive' } },
          { city:   { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, items] = await Promise.all([
      this.prisma.company.count({ where }),
      this.prisma.company.findMany({
        where,
        include: {
          contacts: { select: { id: true, firstName: true, lastName: true } },
          leads:    { select: { id: true, status: true } },
          deals:    { select: { id: true, value: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    // Compute total pipeline value per company
    const itemsWithPipeline = items.map(c => ({
      ...c,
      pipelineValue: c.deals.reduce((s, d) => s + Number(d.value), 0),
    }));

    return { total, page, limit, items: itemsWithPipeline };
  }

  async findOne(organizationId: string, id: string) {
    const company = await this.prisma.company.findFirst({
      where: { id, organizationId },
      include: {
        contacts: true,
        leads:    { orderBy: { createdAt: 'desc' } },
        deals:    { include: { stage: true } },
      },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async create(organizationId: string, dto: {
    name: string; industry?: string; city?: string; country?: string;
    domain?: string; phone?: string; employeeCount?: number; notes?: string;
    customFields?: Record<string, any>;
  }) {
    return this.prisma.company.create({
      data: {
        organizationId,
        name:          dto.name,
        industry:      dto.industry,
        city:          dto.city,
        country:       dto.country ?? 'India',
        domain:        dto.domain,
        phone:         dto.phone,
        employeeCount: dto.employeeCount,
        notes:         dto.notes,
        customFields:  dto.customFields ?? {},
      },
    });
  }

  async update(organizationId: string, id: string, dto: Partial<{
    name: string; industry: string; city: string; country: string;
    domain: string; phone: string; employeeCount: number; notes: string; customFields: Record<string, any>;
  }>) {
    const company = await this.prisma.company.findFirst({ where: { id, organizationId } });
    if (!company) throw new NotFoundException('Company not found');
    return this.prisma.company.update({ where: { id }, data: dto as any });
  }

  async delete(organizationId: string, id: string) {
    const company = await this.prisma.company.findFirst({ where: { id, organizationId } });
    if (!company) throw new NotFoundException('Company not found');
    await this.prisma.company.delete({ where: { id } });
    return { success: true };
  }

  async getStats(organizationId: string) {
    const [total, withDeals, industries] = await Promise.all([
      this.prisma.company.count({ where: { organizationId } }),
      this.prisma.company.count({ where: { organizationId, deals: { some: {} } } }),
      this.prisma.company.groupBy({
        by: ['industry'],
        where: { organizationId, industry: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ]);
    return { total, withDeals, industries };
  }
}
