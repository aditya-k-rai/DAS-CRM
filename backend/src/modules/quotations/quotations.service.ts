import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class QuotationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, opts: { status?: string; leadId?: string; page?: number; limit?: number }) {
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
          lead:    { select: { id: true, name: true, company: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
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
        lead: true, contact: true,
        lineItems: { include: { product: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
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
    lineItems: { productId?: string; description: string; qty: number; unitPrice: number; taxRate?: number }[];
  }) {
    // Calculate subtotal, tax, discount, total
    const subtotal = dto.lineItems.reduce((s, li) => s + li.qty * li.unitPrice, 0);
    const taxAmount = (subtotal * (dto.taxRate ?? 18)) / 100;
    let discountAmount = 0;
    if (dto.discountValue) {
      discountAmount = dto.discountType === 'PERCENT'
        ? (subtotal * dto.discountValue) / 100
        : dto.discountValue;
    }
    const totalAmount = subtotal + taxAmount - discountAmount;

    // Generate quote number
    const count = await this.prisma.quotation.count({ where: { organizationId } });
    const quoteNumber = `Q-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.quotation.create({
      data: {
        organizationId,
        quoteNumber,
        createdById,
        leadId:    dto.leadId,
        contactId: dto.contactId,
        validUntil: dto.validUntil,
        taxRate:         dto.taxRate ?? 18,
        discountType:    dto.discountType,
        discountValue:   dto.discountValue ?? 0,
        discountAmount,
        taxAmount,
        subtotal,
        totalAmount,
        notes:             dto.notes,
        termsAndConditions: dto.termsAndConditions,
        status: 'DRAFT',
        lineItems: {
          create: dto.lineItems.map(li => ({
            productId:   li.productId,
            description: li.description,
            qty:         li.qty,
            unitPrice:   li.unitPrice,
            taxRate:     li.taxRate ?? dto.taxRate ?? 18,
            totalPrice:  li.qty * li.unitPrice,
          })),
        },
      },
      include: { lineItems: true },
    });
  }

  async updateStatus(organizationId: string, id: string, status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED') {
    const quote = await this.prisma.quotation.findFirst({ where: { id, organizationId } });
    if (!quote) throw new NotFoundException('Quotation not found');
    return this.prisma.quotation.update({
      where: { id },
      data: {
        status,
        ...(status === 'SENT' ? { sentAt: new Date() } : {}),
        ...(status === 'ACCEPTED' ? { acceptedAt: new Date() } : {}),
      },
    });
  }

  async delete(organizationId: string, id: string) {
    const quote = await this.prisma.quotation.findFirst({ where: { id, organizationId } });
    if (!quote) throw new NotFoundException('Quotation not found');
    await this.prisma.quotation.delete({ where: { id } });
    return { success: true };
  }
}
