import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface ProductItemDto {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  currency: string;
  stock: number;
  status: 'ACTIVE' | 'OUT_OF_STOCK' | 'DISCONTINUED';
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  private fallbackProducts: ProductItemDto[] = [
    { id: 'p1', name: 'Enterprise CRM Suite (Per Seat)', sku: 'DAS-CRM-ENT', category: 'Software License', price: 1250, currency: 'USD', stock: 500, status: 'ACTIVE' },
    { id: 'p2', name: 'AI Lead Routing Engine Module', sku: 'DAS-AI-ROUTE', category: 'Add-On Module', price: 450, currency: 'USD', stock: 100, status: 'ACTIVE' },
    { id: 'p3', name: 'Automated WhatsApp Telemetry Hook', sku: 'DAS-WA-HOOK', category: 'Integration', price: 290, currency: 'USD', stock: 250, status: 'ACTIVE' },
    { id: 'p4', name: 'Custom Multi-Tenant Setup Service', sku: 'DAS-SRV-SETUP', category: 'Professional Services', price: 2500, currency: 'USD', stock: 20, status: 'ACTIVE' },
  ];

  async getProducts(): Promise<ProductItemDto[]> {
    try {
      const dbProducts = await this.prisma.product.findMany().catch(() => []);
      if (dbProducts && dbProducts.length > 0) {
        return dbProducts.map(p => ({
          id: p.id,
          name: p.name,
          sku: (p as any).sku || 'SKU-' + p.id.substring(0, 4),
          category: (p as any).category || 'Software',
          price: p.price ? Number(p.price) : 500,
          currency: 'USD',
          stock: (p as any).stock || 100,
          status: 'ACTIVE' as const,
        }));
      }
    } catch (e) {}
    return this.fallbackProducts;
  }

  async createProduct(dto: Partial<ProductItemDto>): Promise<ProductItemDto> {
    const newProd: ProductItemDto = {
      id: 'p-' + Date.now(),
      name: dto.name || 'New Catalog Product',
      sku: dto.sku || 'SKU-' + Math.floor(Math.random() * 9000 + 1000),
      category: dto.category || 'Software',
      price: dto.price || 990,
      currency: dto.currency || 'USD',
      stock: dto.stock || 50,
      status: 'ACTIVE',
    };
    this.fallbackProducts.unshift(newProd);
    return newProd;
  }
}
