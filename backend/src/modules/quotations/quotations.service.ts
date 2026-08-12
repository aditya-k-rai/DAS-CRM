import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class QuotationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, opts: { status?: any; leadId?: string; page?: number; limit?: number }) {
    const { status, leadId, page = 1, limit = 20 } = opts;
    const where: any = {
      organizationId,
      ...(status && { status }),
      ...(leadId && { leadId }),
    };

    const [total, items] = await Promise.all([
      this.prisma.quotation.count({ where }),
      this.prisma.quotation.findMany({
        where,
        include: {
          lead: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { total, page, limit, items };
  }

  async findOne(organizationId: string, id: string) {
    const quote = await this.prisma.quotation.findFirst({
      where: { id, organizationId },
      include: {
        lead: true,
        items: { include: { product: true } },
      },
    });
    if (!quote) throw new NotFoundException('Quotation not found');
    return quote;
  }

  async create(organizationId: string, createdById: string, dto: {
    leadId?: string;
    contactId?: string;
    validUntil?: Date;
    taxRate?: number;
    discountType?: 'FLAT' | 'PERCENT';
    discountValue?: number;
    notes?: string;
    termsAndConditions?: string;
    lineItems: { productId?: string; name: string; description?: string; qty: number; unitPrice: number; taxRate?: number }[];
  }) {
    const subtotal = dto.lineItems.reduce((s, li) => s + li.qty * li.unitPrice, 0);
    const taxTotal = (subtotal * (dto.taxRate ?? 18)) / 100;
    let discountTotal = 0;
    if (dto.discountValue) {
      discountTotal = dto.discountType === 'PERCENT'
        ? (subtotal * dto.discountValue) / 100
        : dto.discountValue;
    }
    const grandTotal = subtotal + taxTotal - discountTotal;

    const count = await this.prisma.quotation.count({ where: { organizationId } });
    const number = `Q-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.quotation.create({
      data: {
        organizationId,
        number,
        leadId:        dto.leadId,
        validUntil:    dto.validUntil,
        discountTotal,
        taxTotal,
        subtotal,
        grandTotal,
        notes:         dto.notes,
        status: 'DRAFT',
        items: {
          create: dto.lineItems.map(li => ({
            productId:   li.productId,
            name:        li.name || li.description || 'Item',
            description: li.description,
            quantity:    li.qty,
            unitPrice:   li.unitPrice,
            taxRate:     li.taxRate ?? dto.taxRate ?? 18,
            total:       li.qty * li.unitPrice,
          })),
        },
      },
      include: { items: true },
    });
  }

  async updateStatus(organizationId: string, id: string, status: any) {
    const quote = await this.prisma.quotation.findFirst({ where: { id, organizationId } });
    if (!quote) throw new NotFoundException('Quotation not found');
    return this.prisma.quotation.update({
      where: { id },
      data: { status },
    });
  }

  async delete(organizationId: string, id: string) {
    const quote = await this.prisma.quotation.findFirst({ where: { id, organizationId } });
    if (!quote) throw new NotFoundException('Quotation not found');
    await this.prisma.quotation.delete({ where: { id } });
    return { success: true };
  }
}
