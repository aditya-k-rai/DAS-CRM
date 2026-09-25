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
  brand?: string;
  color?: string;
  unit: string;
  description: string;
  price: number;
  minPrice: number;
  maxPrice: number;
  currency: string;
  stock: number;
  minOrderQty: number;
  taxRate: number;
  imageUrl: string;
  images?: string[];
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
  brand?: string;
  color?: string;
  unit?: string;
  description?: string;
  price?: number;
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  stock?: number;
  minOrderQty?: number;
  taxRate?: number;
  imageUrl?: string;
  images?: string[];
  features?: string[];
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  isActive?: boolean;
  status?: 'ACTIVE' | 'OUT_OF_STOCK' | 'DISCONTINUED';
}

export interface ProductCardDisplayConfig {
  showImage: boolean;
  showName: boolean;
  showCategory: boolean;
  showSubCategory: boolean;
  showPrice: boolean;
  showGst: boolean;
  showInStock: boolean;
  showMoq: boolean;
  showSku: boolean;
  showDescription: boolean;
  showFeatures: boolean;
  showTapHint: boolean;
}

export const DEFAULT_CARD_DISPLAY_CONFIG: ProductCardDisplayConfig = {
  showImage: true,
  showName: true,
  showCategory: true,
  showSubCategory: true,
  showPrice: true,
  showGst: true,
  showInStock: true,
  showMoq: true,
  showSku: true,
  showDescription: false, // Clean display by default as requested
  showFeatures: false,    // Clean display by default as requested
  showTapHint: true,
};

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // ─── In-Memory Fallback Store (Starts clean & empty for fresh companies) ───
  private fallbackProducts: ProductItemDto[] = [];
  private fallbackCardConfig: ProductCardDisplayConfig = { ...DEFAULT_CARD_DISPLAY_CONFIG };

  // ─── GET CARD DISPLAY CONFIGURATION ─────────────────────────────────────────
  async getCardDisplayConfig(requestingUser?: any): Promise<ProductCardDisplayConfig> {
    const orgId = requestingUser?.organizationId || requestingUser?.organization?.id;
    if (orgId) {
      try {
        const org = await this.prisma.organization.findUnique({
          where: { id: orgId },
          select: { settings: true },
        });
        const settings = (org?.settings as any) || {};
        if (settings.productCardDisplayConfig) {
          return {
            ...DEFAULT_CARD_DISPLAY_CONFIG,
            ...settings.productCardDisplayConfig,
          };
        }
      } catch (e) {
        console.warn('[ProductsService] Failed to load card config from org settings:', e.message);
      }
    }
    return this.fallbackCardConfig;
  }

  // ─── SAVE CARD DISPLAY CONFIGURATION (Admin only) ───────────────────────────
  async saveCardDisplayConfig(
    config: Partial<ProductCardDisplayConfig>,
    requestingUser: any,
  ): Promise<ProductCardDisplayConfig> {
    const roleName = typeof requestingUser?.role === 'string'
      ? requestingUser.role
      : requestingUser?.role?.name;

    const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'OWNER'];
    if (roleName && !allowedRoles.includes(roleName)) {
      throw new ForbiddenException(
        `⛔ Access Denied: Only Admins can configure product card display. Your role "${roleName}" is not authorized.`,
      );
    }

    const mergedConfig: ProductCardDisplayConfig = {
      ...DEFAULT_CARD_DISPLAY_CONFIG,
      ...this.fallbackCardConfig,
      ...config,
    };

    const orgId = requestingUser?.organizationId || requestingUser?.organization?.id;
    if (orgId) {
      try {
        const org = await this.prisma.organization.findUnique({
          where: { id: orgId },
          select: { settings: true },
        });
        const currentSettings = (org?.settings as any) || {};
        const updatedSettings = {
          ...currentSettings,
          productCardDisplayConfig: mergedConfig,
        };
        await this.prisma.organization.update({
          where: { id: orgId },
          data: { settings: updatedSettings },
        });
      } catch (e) {
        console.warn('[ProductsService] Failed to save card config to org settings:', e.message);
      }
    }

    this.fallbackCardConfig = mergedConfig;
    return mergedConfig;
  }

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
          brand: (p as any).brand || '',
          color: (p as any).color || '',
          unit: p.unit || 'Pieces',
          description: p.description || 'No description provided.',
          price: p.price ? Number(p.price) : 0,
          minPrice: (p as any).minPrice ? Number((p as any).minPrice) : Number(p.price) || 0,
          maxPrice: (p as any).maxPrice ? Number((p as any).maxPrice) : Number(p.price) || 0,
          currency: '₹',
          stock: (p as any).stock || 0,
          minOrderQty: (p as any).minOrderQty || 1,
          taxRate: p.taxRate ? Number(p.taxRate) : 18,
          imageUrl: (p as any).imageUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
          images: (p as any).images || ((p as any).imageUrl ? [(p as any).imageUrl] : []),
          features: (p as any).features || [],
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
          brand: (dbProduct as any).brand || '',
          color: (dbProduct as any).color || '',
          unit: dbProduct.unit || 'Pieces',
          description: dbProduct.description || '',
          price: Number(dbProduct.price),
          minPrice: Number((dbProduct as any).minPrice || dbProduct.price),
          maxPrice: Number((dbProduct as any).maxPrice || dbProduct.price),
          currency: '₹',
          stock: (dbProduct as any).stock || 0,
          minOrderQty: (dbProduct as any).minOrderQty || 1,
          taxRate: Number(dbProduct.taxRate),
          imageUrl: (dbProduct as any).imageUrl || '',
          images: (dbProduct as any).images || ((dbProduct as any).imageUrl ? [(dbProduct as any).imageUrl] : []),
          features: (dbProduct as any).features || [],
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
    const generatedSku = dto.sku?.trim() ? dto.sku.trim() : ('DAS-' + Math.floor(100000 + Math.random() * 900000));
    const finalUnit = dto.unit?.trim() || 'Pieces';
    const primaryImg = (dto.images && dto.images.length > 0)
      ? dto.images[0]
      : (dto.imageUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80');

    try {
      const dbProduct = await this.prisma.product.create({
        data: {
          name: dto.name || 'New Product',
          description: dto.description || 'No description provided.',
          price: price,
          unit: finalUnit,
          taxRate: dto.taxRate ?? 18,
          isActive: true,
          organizationId: 'default-org', // Will be replaced by JWT org context
        },
      }).catch(() => null);

      if (dbProduct) {
        return {
          id: dbProduct.id,
          name: dbProduct.name,
          sku: generatedSku,
          category: dto.category || 'Software',
          subCategory: dto.subCategory || 'General',
          brand: dto.brand || '',
          color: dto.color || '',
          unit: finalUnit,
          description: dbProduct.description || '',
          price: Number(dbProduct.price),
          minPrice: dto.minPrice ?? Number(dbProduct.price),
          maxPrice: dto.maxPrice ?? Number(dbProduct.price),
          currency: dto.currency || '₹',
          stock: dto.stock ?? 100,
          minOrderQty: dto.minOrderQty ?? 1,
          taxRate: Number(dbProduct.taxRate),
          imageUrl: primaryImg,
          images: dto.images && dto.images.length > 0 ? dto.images : [primaryImg],
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
      sku: generatedSku,
      category: dto.category || 'Software',
      subCategory: dto.subCategory || 'General',
      brand: dto.brand || '',
      color: dto.color || '',
      unit: finalUnit,
      description: dto.description || 'No description provided.',
      price: price,
      minPrice: dto.minPrice ?? price,
      maxPrice: dto.maxPrice ?? price,
      currency: dto.currency || '₹',
      stock: dto.stock ?? 100,
      minOrderQty: dto.minOrderQty ?? 1,
      taxRate: dto.taxRate ?? 18,
      imageUrl: primaryImg,
      images: dto.images && dto.images.length > 0 ? dto.images : [primaryImg],
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
          ...(dto.unit !== undefined && { unit: dto.unit }),
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
