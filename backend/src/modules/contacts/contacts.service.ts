import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, opts: { search?: string; page?: number; limit?: number }) {
    const { search, page = 1, limit = 20 } = opts;
    const where: any = {
      organizationId,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName:  { contains: search, mode: 'insensitive' } },
          { email:     { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, items] = await Promise.all([
      this.prisma.contact.count({ where }),
      this.prisma.contact.findMany({
        where,
        include: {
          company: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { total, page, limit, items };
  }

  async findOne(organizationId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, organizationId },
      include: {
        company: true,
        notes:   { orderBy: { createdAt: 'desc' } },
        activities: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!contact) throw new NotFoundException('Contact not found');
    return contact;
  }

  async create(organizationId: string, dto: {
    firstName: string; lastName?: string; email?: string; phone?: string;
    companyId?: string; designation?: string; jobTitle?: string; notes?: string;
    customFields?: Record<string, any>;
  }) {
    return this.prisma.contact.create({
      data: {
        organizationId,
        firstName: dto.firstName,
        lastName:  dto.lastName,
        email:     dto.email,
        phone:     dto.phone,
        companyId: dto.companyId,
        jobTitle:  dto.jobTitle ?? dto.designation,
        notes:     dto.notes ? { create: { organizationId, content: dto.notes } } : undefined,
        customFields: dto.customFields ?? {},
      },
    });
  }

  async update(organizationId: string, id: string, dto: Partial<{
    firstName: string; lastName: string; email: string; phone: string;
    companyId: string; jobTitle: string; notes: string; customFields: Record<string, any>;
  }>) {
    const contact = await this.prisma.contact.findFirst({ where: { id, organizationId } });
    if (!contact) throw new NotFoundException('Contact not found');
    return this.prisma.contact.update({ where: { id }, data: dto as any });
  }

  async remove(organizationId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({ where: { id, organizationId } });
    if (!contact) throw new NotFoundException('Contact not found');
    await this.prisma.contact.delete({ where: { id } });
    return { success: true };
  }
}
