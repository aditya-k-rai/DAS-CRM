import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface QuotationItemDto {
  id: string;
  quoteNumber: string;
  clientName: string;
  clientCompany: string;
  totalAmount: number;
  currency: string;
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED';
  validUntil?: string;
  itemsCount: number;
}

@Injectable()
export class QuotationsService {
  constructor(private prisma: PrismaService) {}

  private fallbackQuotes: QuotationItemDto[] = [
    { id: 'q1', quoteNumber: 'QUO-2026-001', clientName: 'TechCorp India', clientCompany: 'TechCorp Solutions', totalAmount: 45000, currency: 'INR', status: 'APPROVED', validUntil: 'Aug 30, 2026', itemsCount: 3 },
    { id: 'q2', quoteNumber: 'QUO-2026-002', clientName: 'Innovate Systems', clientCompany: 'Innovate Ltd', totalAmount: 120000, currency: 'INR', status: 'SENT', validUntil: 'Sep 15, 2026', itemsCount: 5 },
    { id: 'q3', quoteNumber: 'QUO-2026-003', clientName: 'Apex Global', clientCompany: 'Apex Tech', totalAmount: 85000, currency: 'INR', status: 'DRAFT', validUntil: 'Sep 01, 2026', itemsCount: 2 },
  ];

  async getQuotations(): Promise<QuotationItemDto[]> {
    try {
      const dbQuotes = await this.prisma.quotation.findMany().catch(() => []);
      if (dbQuotes && dbQuotes.length > 0) {
        return dbQuotes.map(q => ({
          id: q.id,
          quoteNumber: (q as any).quoteNumber || 'QUO-' + q.id.substring(0, 4),
          clientName: (q as any).clientName || 'Client',
          clientCompany: (q as any).clientCompany || 'Company',
          totalAmount: q.totalAmount ? Number(q.totalAmount) : 50000,
          currency: 'INR',
          status: (q as any).status || 'SENT',
          validUntil: 'Aug 30, 2026',
          itemsCount: 3,
        }));
      }
    } catch (e) {}
    return this.fallbackQuotes;
  }

  async createQuotation(dto: Partial<QuotationItemDto>): Promise<QuotationItemDto> {
    const newQuote: QuotationItemDto = {
      id: 'q-' + Date.now(),
      quoteNumber: 'QUO-2026-' + Math.floor(Math.random() * 900 + 100),
      clientName: dto.clientName || 'New Enterprise Client',
      clientCompany: dto.clientCompany || 'Acme Partner',
      totalAmount: dto.totalAmount || 65000,
      currency: 'INR',
      status: 'DRAFT',
      validUntil: 'Sep 30, 2026',
      itemsCount: dto.itemsCount || 2,
    };
    this.fallbackQuotes.unshift(newQuote);
    return newQuote;
  }
}
