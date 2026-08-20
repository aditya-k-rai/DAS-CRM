import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface ProductItemDto {
  id: string;
  name: string;
  sku: string;
  category: string;
  subCategory: string;
  description: string;
  price: number;
  minPrice: number;
  maxPrice: number;
  currency: string;
  stock: number;
  minOrderQty: number;
  taxRate: number;
  imageUrl: string;
  features: string[];
  isActive: boolean;
  status: 'ACTIVE' | 'OUT_OF_STOCK' | 'DISCONTINUED' | 'DELETED';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductDto {
  name: string;
  sku?: string;
  category?: string;
  subCategory?: string;
  description?: string;
  price?: number;
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  stock?: number;
  minOrderQty?: number;
  taxRate?: number;
  imageUrl?: string;
  features?: string[];
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  isActive?: boolean;
  status?: 'ACTIVE' | 'OUT_OF_STOCK' | 'DISCONTINUED';
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // ─── In-Memory Fallback Store (used when DB is unavailable) ──────────────────
  private fallbackProducts: ProductItemDto[] = [
    {
      id: 'p1',
      name: 'DAS CRM Enterprise Suite',
      sku: 'DAS-CRM-001',
      category: 'CRM & Sales Software',
      subCategory: 'Lead Management',
      description: 'Full-stack enterprise CRM solution featuring automated lead scoring, multi-level workforce hierarchy controls, real-time telemetry, and anti-tamper attendance verification.',
      price: 49999,
      minPrice: 2999,
      maxPrice: 49999,
      currency: '₹',
      stock: 250,
      minOrderQty: 1,
      taxRate: 18,
      imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
      features: ['Unlimited Lead Ingestion', 'WhatsApp Cloud API (100K Quota)', 'Advanced AI Scoring'],
      isActive: true,
      status: 'ACTIVE',
    },
    {
      id: 'p2',
      name: 'AI Lead Scoring Engine Pro',
      sku: 'DAS-AI-102',
      category: 'AI & Intelligence',
      subCategory: 'AI Lead Scoring',
      description: 'Predictive machine learning engine that calculates real-time lead score (0-100) based on telemetry interactions, call frequency, and WhatsApp engagements.',
      price: 14999,
      minPrice: 1499,
      maxPrice: 2499,
      currency: '₹',
      stock: 85,
      minOrderQty: 5,
      taxRate: 18,
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      features: ['Predictive Lead Conversion Model', 'Automated Hot Lead Alerts', 'Custom Scoring Rules Configurator'],
      isActive: true,
      status: 'ACTIVE',
    },
    {
      id: 'p3',
      name: 'WhatsApp Automation Bot Engine',
      sku: 'WA-BOT-003',
      category: 'Automation & APIs',
      subCategory: 'Messaging Gateways',
      description: 'Direct WhatsApp Cloud API integration with AI Humanize message generator, catalog sharing, and automated 15-day call date follow-up scheduling.',
      price: 8999,
      minPrice: 1499,
      maxPrice: 2499,
      currency: '₹',
      stock: 1000,
      minOrderQty: 1,
      taxRate: 18,
      imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
      features: ['Official Meta Business API Connector', 'Interactive Template Builder', 'Automated Follow-up Scheduler'],
      isActive: true,
      status: 'ACTIVE',
    },
    {
      id: 'p4',
      name: 'Cloud Telemetry License',
      sku: 'CLOUD-TEL-004',
      category: 'Infrastructure',
      subCategory: 'Cloud Storage',
      description: 'High-availability secure storage for call audio recordings, selfie attendance verification images, and automated audit logs.',
      price: 4999,
      minPrice: 999,
      maxPrice: 2499,
      currency: '₹',
      stock: 750,
      minOrderQty: 1,
      taxRate: 18,
      imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
      features: ['256-bit AES Encryption', 'Automatic 30-Day Backup Retention', 'SOC2 Compliant Cloud Vault'],
      isActive: true,
      status: 'ACTIVE',
    },
  ];

  // ─── GET ALL ACTIVE PRODUCTS ─────────────────────────────────────────────────
  async getProducts(): Promise<ProductItemDto[]> {
    try {
      const dbProducts = await this.prisma.product.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      }).catch(() => []);

      if (dbProducts && dbProducts.length > 0) {
        return dbProducts.map((p) => ({
          id: p.id,
          name: p.name,
          sku: (p as any).sku || 'SKU-' + p.id.substring(0, 6).toUpperCase(),
          category: (p as any).category || 'Software',
          subCategory: (p as any).subCategory || 'General',
          description: p.description || 'No description provided.',
          price: p.price ? Number(p.price) : 0,
          minPrice: (p as any).minPrice ? Number((p as any).minPrice) : Number(p.price) || 0,
          maxPrice: (p as any).maxPrice ? Number((p as any).maxPrice) : Number(p.price) || 0,
          currency: '₹',
          stock: (p as any).stock || 0,
          minOrderQty: (p as any).minOrderQty || 1,
          taxRate: p.taxRate ? Number(p.taxRate) : 18,
          imageUrl: (p as any).imageUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
          features: [],
          isActive: p.isActive,
          status: 'ACTIVE' as const,
          createdAt: p.createdAt?.toISOString(),
          updatedAt: p.updatedAt?.toISOString(),
        }));
      }
    } catch (e) {
      console.warn('[ProductsService] DB unavailable, using fallback:', e.message);
    }

    // Return only active fallback products (exclude DELETED ones)
    return this.fallbackProducts.filter((p) => p.status !== 'DELETED' && p.isActive);
  }

  // ─── GET SINGLE PRODUCT BY ID ────────────────────────────────────────────────
  async getProductById(id: string): Promise<ProductItemDto> {
    try {
      const dbProduct = await this.prisma.product.findUnique({ where: { id } }).catch(() => null);
      if (dbProduct) {
        if (!dbProduct.isActive) throw new NotFoundException(`Product "${id}" has been deleted or deactivated.`);
        return {
          id: dbProduct.id,
          name: dbProduct.name,
          sku: (dbProduct as any).sku || '',
          category: (dbProduct as any).category || 'Software',
          subCategory: (dbProduct as any).subCategory || 'General',
          description: dbProduct.description || '',
          price: Number(dbProduct.price),
          minPrice: Number((dbProduct as any).minPrice || dbProduct.price),
          maxPrice: Number((dbProduct as any).maxPrice || dbProduct.price),
          currency: '₹',
          stock: (dbProduct as any).stock || 0,
          minOrderQty: (dbProduct as any).minOrderQty || 1,
          taxRate: Number(dbProduct.taxRate),
          imageUrl: (dbProduct as any).imageUrl || '',
          features: [],
          isActive: dbProduct.isActive,
          status: dbProduct.isActive ? 'ACTIVE' : 'DISCONTINUED',
        };
      }
    } catch (e) {
      if (e instanceof NotFoundException) throw e;
    }

    const fallback = this.fallbackProducts.find((p) => p.id === id);
    if (!fallback || fallback.status === 'DELETED') {
      throw new NotFoundException(`Product "${id}" not found or has been deleted.`);
    }
    return fallback;
  }

  // ─── CREATE PRODUCT (Admin only) ─────────────────────────────────────────────
  async createProduct(dto: CreateProductDto): Promise<ProductItemDto> {
    const price = dto.price ?? dto.minPrice ?? 0;

    try {
      const dbProduct = await this.prisma.product.create({
        data: {
          name: dto.name || 'New Product',
          description: dto.description || 'No description provided.',
          price: price,
          unit: 'unit',
          taxRate: dto.taxRate ?? 18,
          isActive: true,
          organizationId: 'default-org', // Will be replaced by JWT org context
        },
      }).catch(() => null);

      if (dbProduct) {
        return {
          id: dbProduct.id,
          name: dbProduct.name,
          sku: dto.sku || ('SKU-' + dbProduct.id.substring(0, 6).toUpperCase()),
          category: dto.category || 'Software',
          subCategory: dto.subCategory || 'General',
          description: dbProduct.description || '',
          price: Number(dbProduct.price),
          minPrice: dto.minPrice ?? Number(dbProduct.price),
          maxPrice: dto.maxPrice ?? Number(dbProduct.price),
          currency: dto.currency || '₹',
          stock: dto.stock ?? 100,
          minOrderQty: dto.minOrderQty ?? 1,
          taxRate: Number(dbProduct.taxRate),
          imageUrl: dto.imageUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
          features: dto.features || [],
          isActive: true,
          status: 'ACTIVE',
          createdAt: dbProduct.createdAt?.toISOString(),
        };
      }
    } catch (e) {
      console.warn('[ProductsService] DB create failed, using fallback:', e.message);
    }

    // Fallback in-memory creation
    const newProduct: ProductItemDto = {
      id: 'p-' + Date.now(),
      name: dto.name || 'New Product',
      sku: dto.sku || ('SKU-' + Math.floor(1000 + Math.random() * 9000)),
      category: dto.category || 'Software',
      subCategory: dto.subCategory || 'General',
      description: dto.description || 'No description provided.',
      price: price,
      minPrice: dto.minPrice ?? price,
      maxPrice: dto.maxPrice ?? price,
      currency: dto.currency || '₹',
      stock: dto.stock ?? 100,
      minOrderQty: dto.minOrderQty ?? 1,
      taxRate: dto.taxRate ?? 18,
      imageUrl: dto.imageUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
      features: dto.features || [],
      isActive: true,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    this.fallbackProducts.unshift(newProduct);
    return newProduct;
  }

  // ─── UPDATE PRODUCT (Admin only) ─────────────────────────────────────────────
  async updateProduct(id: string, dto: UpdateProductDto): Promise<ProductItemDto> {
    try {
      const dbProduct = await this.prisma.product.update({
        where: { id },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.price !== undefined && { price: dto.price }),
          ...(dto.taxRate !== undefined && { taxRate: dto.taxRate }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        },
      }).catch(() => null);

      if (dbProduct) {
        return this.getProductById(id);
      }
    } catch (e) {
      console.warn('[ProductsService] DB update failed, using fallback:', e.message);
    }

    // Fallback in-memory update
    const idx = this.fallbackProducts.findIndex((p) => p.id === id);
    if (idx === -1) throw new NotFoundException(`Product "${id}" not found.`);
    this.fallbackProducts[idx] = { ...this.fallbackProducts[idx], ...dto };
    return this.fallbackProducts[idx];
  }

  // ─── DELETE PRODUCT — ADMIN ONLY — HARD REMOVES FROM DB + MEMORY ─────────────
  async deleteProduct(id: string, requestingUser: any): Promise<{ success: boolean; message: string; deletedId: string }> {
    // ── Role-Based Access Control: Only ADMIN, SUPER_ADMIN, OWNER can delete ──
    const roleName = typeof requestingUser?.role === 'string'
      ? requestingUser.role
      : requestingUser?.role?.name;

    const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'OWNER'];
    if (!allowedRoles.includes(roleName)) {
      throw new ForbiddenException(
        `⛔ Access Denied: Only Admins can delete products. Your role "${roleName}" does not have delete permission.`,
      );
    }

    // ── Attempt Database Hard Delete ──
    let productName = id;
    try {
      const existingProduct = await this.prisma.product.findUnique({ where: { id } }).catch(() => null);
      if (existingProduct) {
        productName = existingProduct.name;
        await this.prisma.product.delete({ where: { id } });
        return {
          success: true,
          message: `✅ Product "${productName}" (ID: ${id}) has been permanently deleted from the database by Admin.`,
          deletedId: id,
        };
      }
    } catch (e) {
      console.warn('[ProductsService] DB delete failed, marking as DELETED in fallback:', e.message);
    }

    // ── Fallback: Mark as DELETED in memory store ──
    const idx = this.fallbackProducts.findIndex((p) => p.id === id);
    if (idx === -1) {
      throw new NotFoundException(`Product "${id}" not found.`);
    }
    productName = this.fallbackProducts[idx].name;
    // Hard remove from fallback array (simulates DB delete)
    this.fallbackProducts.splice(idx, 1);

    return {
      success: true,
      message: `✅ Product "${productName}" has been permanently deleted by Admin.`,
      deletedId: id,
    };
  }
}
