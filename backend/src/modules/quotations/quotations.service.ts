import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface QuotationItemDto {
  id: string;
  quoteNumber: string;
  clientName: string;
  clientCompany: string;
  totalAmount: number;
  currency: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  validUntil?: string;
  itemsCount: number;
  docType?: string;
  sentToLead?: string;
  sentVia?: string;
  leadId?: string;
  leadName?: string;
  createdByName?: string;
  createdByRole?: string;
  notes?: string;
  items?: any[];
  payload?: any;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable()
export class QuotationsService {
  constructor(private prisma: PrismaService) {}

  private fallbackQuotes: QuotationItemDto[] = [];

  // ─── GET ALL QUOTATIONS FOR ORG ──────────────────────────────────────────────
  async getQuotations(organizationId: string): Promise<QuotationItemDto[]> {
    if (!organizationId) return [];

    try {
      const dbQuotes: any[] = await (this.prisma.quotation as any).findMany({
        where: { organizationId },
        include: {
          items: true,
          lead: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }).catch(() => []);

      if (dbQuotes && dbQuotes.length > 0) {
        return dbQuotes.map((q: any) => {
          let parsedNotes: any = {};
          try {
            if (q.notes && (q.notes.startsWith('{') || q.notes.startsWith('['))) {
              parsedNotes = JSON.parse(q.notes);
            }
          } catch (_) {}

          const leadDisplayName = q.lead ? `${q.lead.firstName || ''} ${q.lead.lastName || ''}`.trim() : '';
          const resolvedLeadName = parsedNotes.sentToLead || (leadDisplayName ? `${leadDisplayName}${q.lead.phone ? ` (${q.lead.phone})` : ''}` : undefined);

          return {
            id: q.id,
            quoteNumber: q.number,
            clientName: parsedNotes.partyName || parsedNotes.clientName || leadDisplayName || 'Client',
            clientCompany: parsedNotes.companyName || parsedNotes.clientCompany || 'Company',
            totalAmount: Number(q.grandTotal || q.subtotal || 0),
            currency: q.currency || 'INR',
            status: q.status,
            validUntil: q.validUntil ? q.validUntil.toISOString() : undefined,
            itemsCount: q.items ? q.items.length : (parsedNotes.itemsCount || 0),
            docType: q.title || parsedNotes.docType || 'QUOTATION',
            sentToLead: resolvedLeadName,
            sentVia: parsedNotes.sentVia,
            leadId: q.leadId || parsedNotes.leadId || undefined,
            leadName: parsedNotes.leadName || leadDisplayName || undefined,
            createdByName: parsedNotes.createdByName,
            createdByRole: parsedNotes.createdByRole,
            notes: q.notes || '',
            payload: parsedNotes.payload || undefined,
            createdAt: q.createdAt.toISOString(),
            updatedAt: q.updatedAt.toISOString(),
            items: q.items ? q.items.map((it: any) => ({
              id: it.id,
              productName: it.name,
              description: it.description,
              quantity: Number(it.quantity),
              unitPrice: Number(it.unitPrice),
              taxRate: Number(it.taxRate),
              discount: Number(it.discount),
              total: Number(it.total),
            })) : [],
          };
        });
      }
    } catch (e) {
      console.warn('[QuotationsService] DB query failed, using fallback:', e.message);
    }

    return this.fallbackQuotes.filter((q) => !q['organizationId'] || q['organizationId'] === organizationId);
  }

  // ─── GET SINGLE QUOTATION BY ID ──────────────────────────────────────────────
  async getQuotationById(organizationId: string, id: string): Promise<QuotationItemDto> {
    try {
      const dbQuote: any = await (this.prisma.quotation as any).findFirst({
        where: { id, organizationId },
        include: {
          items: true,
          lead: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
        },
      }).catch(() => null);

      if (dbQuote) {
        let parsedNotes: any = {};
        try {
          if (dbQuote.notes && (dbQuote.notes.startsWith('{') || dbQuote.notes.startsWith('['))) {
            parsedNotes = JSON.parse(dbQuote.notes);
          }
        } catch (_) {}

        const leadDisplayName = dbQuote.lead ? `${dbQuote.lead.firstName || ''} ${dbQuote.lead.lastName || ''}`.trim() : '';
        const resolvedLeadName = parsedNotes.sentToLead || (leadDisplayName ? `${leadDisplayName}${dbQuote.lead.phone ? ` (${dbQuote.lead.phone})` : ''}` : undefined);

        return {
          id: dbQuote.id,
          quoteNumber: dbQuote.number,
          clientName: parsedNotes.partyName || parsedNotes.clientName || leadDisplayName || 'Client',
          clientCompany: parsedNotes.companyName || parsedNotes.clientCompany || 'Company',
          totalAmount: Number(dbQuote.grandTotal || dbQuote.subtotal || 0),
          currency: dbQuote.currency || 'INR',
          status: dbQuote.status,
          validUntil: dbQuote.validUntil ? dbQuote.validUntil.toISOString() : undefined,
          itemsCount: dbQuote.items ? dbQuote.items.length : (parsedNotes.itemsCount || 0),
          docType: dbQuote.title || parsedNotes.docType || 'QUOTATION',
          sentToLead: resolvedLeadName,
          sentVia: parsedNotes.sentVia,
          leadId: dbQuote.leadId || parsedNotes.leadId || undefined,
          leadName: parsedNotes.leadName || leadDisplayName || undefined,
          createdByName: parsedNotes.createdByName,
          createdByRole: parsedNotes.createdByRole,
          notes: dbQuote.notes || '',
          payload: parsedNotes.payload || undefined,
          createdAt: dbQuote.createdAt.toISOString(),
          updatedAt: dbQuote.updatedAt.toISOString(),
          items: dbQuote.items ? dbQuote.items.map((it: any) => ({
            id: it.id,
            productName: it.name,
            description: it.description,
            quantity: Number(it.quantity),
            unitPrice: Number(it.unitPrice),
            taxRate: Number(it.taxRate),
            discount: Number(it.discount),
            total: Number(it.total),
          })) : [],
        };
      }
    } catch (e) {
      console.warn('[QuotationsService] DB getById error:', e.message);
    }

    const fallback = this.fallbackQuotes.find((q) => q.id === id);
    if (!fallback) throw new NotFoundException(`Quotation "${id}" not found.`);
    return fallback;
  }

  // ─── CREATE QUOTATION ────────────────────────────────────────────────────────
  async createQuotation(organizationId: string, dto: any): Promise<QuotationItemDto> {
    if (!organizationId) throw new BadRequestException('Organization ID is required.');

    const quoteNumber = dto.quoteNumber || dto.docNo || ('QUO-' + Date.now().toString().slice(-6));
    const grandTotal = Number(dto.totalAmount || dto.grandTotal || 0);
    const subtotal = Number(dto.subtotal || grandTotal);
    const status = (dto.status === 'SENT' || dto.status === 'GENERATED_SENT') ? 'SENT' : 'DRAFT';

    const metadata = {
      partyName: dto.partyName || dto.clientName || '',
      companyName: dto.companyName || dto.clientCompany || '',
      docType: dto.docType || 'QUOTATION',
      sentVia: dto.sentVia,
      sentToLead: dto.sentToLead,
      leadId: dto.leadId,
      leadName: dto.leadName,
      createdByName: dto.createdByName,
      createdByRole: dto.createdByRole,
      itemsCount: dto.itemsCount || (dto.items ? dto.items.length : 0),
      payload: dto.payload,
    };

    try {
      const dbQuote = await this.prisma.quotation.create({
        data: {
          organizationId,
          number: quoteNumber,
          title: dto.docType || dto.title || 'QUOTATION',
          leadId: dto.leadId || undefined,
          dealId: dto.dealId || undefined,
          status: status as any,
          subtotal: subtotal,
          grandTotal: grandTotal,
          currency: dto.currency || 'INR',
          validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
          notes: JSON.stringify(metadata),
          items: dto.items && Array.isArray(dto.items) && dto.items.length > 0 ? {
            create: dto.items.map((it: any, index: number) => ({
              name: it.productName || it.name || 'Item',
              description: it.description || '',
              quantity: Number(it.qty || it.quantity || 1),
              unitPrice: Number(it.unitPrice || 0),
              taxRate: Number(it.taxRate || 0),
              discount: Number(it.discountVal || it.discount || 0),
              total: Number(it.total || 0),
              order: index,
            })),
          } : undefined,
        },
        include: { items: true },
      }).catch((e) => {
        console.warn('[QuotationsService] DB create failed:', e.message);
        return null;
      });

      if (dbQuote) {
        return {
          id: dbQuote.id,
          quoteNumber: dbQuote.number,
          clientName: metadata.partyName || 'Client',
          clientCompany: metadata.companyName || 'Company',
          totalAmount: Number(dbQuote.grandTotal),
          currency: dbQuote.currency,
          status: dbQuote.status,
          validUntil: dbQuote.validUntil?.toISOString(),
          itemsCount: dbQuote.items ? dbQuote.items.length : 0,
          docType: dbQuote.title || 'QUOTATION',
          sentToLead: metadata.sentToLead,
          sentVia: metadata.sentVia,
          leadId: dbQuote.leadId || undefined,
          leadName: metadata.leadName,
          createdByName: metadata.createdByName,
          createdByRole: metadata.createdByRole,
          notes: dbQuote.notes || '',
          payload: metadata.payload,
          createdAt: dbQuote.createdAt.toISOString(),
          updatedAt: dbQuote.updatedAt.toISOString(),
          items: dbQuote.items ? dbQuote.items.map((it: any) => ({
            id: it.id,
            productName: it.name,
            description: it.description,
            quantity: Number(it.quantity),
            unitPrice: Number(it.unitPrice),
            taxRate: Number(it.taxRate),
            discount: Number(it.discount),
            total: Number(it.total),
          })) : [],
        };
      }
    } catch (e) {
      console.warn('[QuotationsService] DB quotation create error:', e.message);
    }

    // In-memory fallback
    const newQuote: QuotationItemDto & { organizationId?: string } = {
      id: 'q-' + Date.now(),
      quoteNumber: quoteNumber,
      clientName: metadata.partyName || 'Client',
      clientCompany: metadata.companyName || 'Company',
      totalAmount: grandTotal,
      currency: dto.currency || 'INR',
      status: status as any,
      validUntil: dto.validUntil,
      itemsCount: dto.items ? dto.items.length : 0,
      docType: metadata.docType,
      sentToLead: metadata.sentToLead,
      sentVia: metadata.sentVia,
      leadId: dto.leadId,
      leadName: dto.leadName,
      createdByName: dto.createdByName,
      createdByRole: dto.createdByRole,
      notes: JSON.stringify(metadata),
      payload: metadata.payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: dto.items || [],
      organizationId,
    };
    this.fallbackQuotes.unshift(newQuote);
    return newQuote;
  }

  // ─── UPDATE QUOTATION ────────────────────────────────────────────────────────
  async updateQuotation(organizationId: string, id: string, dto: any): Promise<QuotationItemDto> {
    try {
      const existing = await this.prisma.quotation.findFirst({
        where: { id, organizationId },
      }).catch(() => null);

      if (existing) {
        let existingNotes: any = {};
        try {
          if (existing.notes) existingNotes = JSON.parse(existing.notes);
        } catch (_) {}

        const updatedMetadata = {
          ...existingNotes,
          ...(dto.partyName && { partyName: dto.partyName }),
          ...(dto.companyName && { companyName: dto.companyName }),
          ...(dto.docType && { docType: dto.docType }),
          ...(dto.sentVia && { sentVia: dto.sentVia }),
          ...(dto.sentToLead && { sentToLead: dto.sentToLead }),
          ...(dto.leadId && { leadId: dto.leadId }),
          ...(dto.leadName && { leadName: dto.leadName }),
          ...(dto.createdByName && { createdByName: dto.createdByName }),
          ...(dto.createdByRole && { createdByRole: dto.createdByRole }),
          ...(dto.payload && { payload: dto.payload }),
        };

        const updated = await this.prisma.quotation.update({
          where: { id },
          data: {
            ...(dto.leadId !== undefined && { leadId: dto.leadId || null }),
            ...(dto.status && { status: (dto.status === 'GENERATED_SENT' || dto.status === 'SENT') ? 'SENT' : dto.status }),
            ...(dto.totalAmount !== undefined && { grandTotal: Number(dto.totalAmount) }),
            ...(dto.title && { title: dto.title || dto.docType }),
            notes: JSON.stringify(updatedMetadata),
          },
          include: { items: true },
        });

        return this.getQuotationById(organizationId, updated.id);
      }
    } catch (e) {
      console.warn('[QuotationsService] DB update failed:', e.message);
    }

    const idx = this.fallbackQuotes.findIndex((q) => q.id === id);
    if (idx === -1) throw new NotFoundException(`Quotation "${id}" not found.`);
    this.fallbackQuotes[idx] = { ...this.fallbackQuotes[idx], ...dto };
    return this.fallbackQuotes[idx];
  }

  // ─── DELETE QUOTATION ────────────────────────────────────────────────────────
  async deleteQuotation(organizationId: string, id: string): Promise<{ success: boolean; id: string }> {
    try {
      const existing = await this.prisma.quotation.findFirst({
        where: { id, organizationId },
      }).catch(() => null);

      if (existing) {
        await this.prisma.quotationItem.deleteMany({ where: { quotationId: id } }).catch(() => null);
        await this.prisma.quotation.delete({ where: { id } });
        return { success: true, id };
      }
    } catch (e) {
      console.warn('[QuotationsService] DB delete failed:', e.message);
    }

    const idx = this.fallbackQuotes.findIndex((q) => q.id === id);
    if (idx !== -1) {
      this.fallbackQuotes.splice(idx, 1);
    }
    return { success: true, id };
  }
}
