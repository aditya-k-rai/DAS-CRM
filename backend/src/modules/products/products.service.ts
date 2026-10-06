import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
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

    const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'OWNER', 'MANAGER', 'DEPT_MANAGER'];
    if (roleName && !allowedRoles.includes(roleName)) {
      throw new ForbiddenException(
        `⛔ Access Denied: Only Admins and Managers can configure product card display. Your role "${roleName}" is not authorized.`,
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
  async getProducts(organizationId: string): Promise<ProductItemDto[]> {
    if (!organizationId) return [];
    try {
      const dbProducts = await this.prisma.product.findMany({
        where: { organizationId, isActive: true },
        orderBy: { createdAt: 'desc' },
      }).catch(() => []);

      if (dbProducts && dbProducts.length > 0) {
        return dbProducts.map((p) => {
          let meta: any = {};
          let actualDescription = p.description || '';
          if (p.description && p.description.trim().startsWith('{')) {
            try {
              meta = JSON.parse(p.description);
              if (meta && typeof meta === 'object') {
                actualDescription = meta.description ?? '';
              }
            } catch (_) {}
          }

          const primaryImg = meta.imageUrl || (meta.images && meta.images[0]) || (p as any).imageUrl || '';

          return {
            id: p.id,
            name: p.name,
            sku: meta.sku || (p as any).sku || 'SKU-' + p.id.substring(0, 6).toUpperCase(),
            category: meta.category || (p as any).category || '',
            subCategory: meta.subCategory || (p as any).subCategory || '',
            brand: meta.brand || (p as any).brand || '',
            color: meta.color || (p as any).color || '',
            unit: p.unit || 'Pieces (Pcs)',
            description: actualDescription,
            price: p.price ? Number(p.price) : 0,
            minPrice: meta.minPrice !== undefined ? Number(meta.minPrice) : (p.price ? Number(p.price) : 0),
            maxPrice: meta.maxPrice !== undefined ? Number(meta.maxPrice) : (p.price ? Number(p.price) : 0),
            currency: meta.currency || '₹',
            stock: meta.stock !== undefined ? Number(meta.stock) : 100,
            minOrderQty: meta.minOrderQty !== undefined ? Number(meta.minOrderQty) : 1,
            taxRate: p.taxRate ? Number(p.taxRate) : 18,
            imageUrl: primaryImg,
            images: meta.images && meta.images.length > 0 ? meta.images : (primaryImg ? [primaryImg] : []),
            features: meta.features || (p as any).features || [],
            isActive: p.isActive,
            status: 'ACTIVE' as const,
            createdAt: p.createdAt?.toISOString(),
            updatedAt: p.updatedAt?.toISOString(),
          };
        });
      }
    } catch (e) {
      console.warn('[ProductsService] DB query failed:', e.message);
    }

    return this.fallbackProducts.filter((p) => p.status !== 'DELETED' && p.isActive);
  }

  // ─── GET SINGLE PRODUCT BY ID ────────────────────────────────────────────────
  async getProductById(organizationId: string, id: string): Promise<ProductItemDto> {
    try {
      const dbProduct = await this.prisma.product.findFirst({
        where: { id, organizationId },
      }).catch(() => null);

      if (dbProduct) {
        if (!dbProduct.isActive) throw new NotFoundException(`Product "${id}" has been deleted or deactivated.`);
        let meta: any = {};
        let actualDescription = dbProduct.description || '';
        if (dbProduct.description && dbProduct.description.trim().startsWith('{')) {
          try {
            meta = JSON.parse(dbProduct.description);
            if (meta && typeof meta === 'object') {
              actualDescription = meta.description ?? '';
            }
          } catch (_) {}
        }
        const primaryImg = meta.imageUrl || (meta.images && meta.images[0]) || (dbProduct as any).imageUrl || '';

        return {
          id: dbProduct.id,
          name: dbProduct.name,
          sku: meta.sku || (dbProduct as any).sku || 'SKU-' + dbProduct.id.substring(0, 6).toUpperCase(),
          category: meta.category || (dbProduct as any).category || '',
          subCategory: meta.subCategory || (dbProduct as any).subCategory || '',
          brand: meta.brand || (dbProduct as any).brand || '',
          color: meta.color || (dbProduct as any).color || '',
          unit: dbProduct.unit || 'Pieces (Pcs)',
          description: actualDescription,
          price: Number(dbProduct.price),
          minPrice: meta.minPrice !== undefined ? Number(meta.minPrice) : Number(dbProduct.price),
          maxPrice: meta.maxPrice !== undefined ? Number(meta.maxPrice) : Number(dbProduct.price),
          currency: meta.currency || '₹',
          stock: meta.stock !== undefined ? Number(meta.stock) : 100,
          minOrderQty: meta.minOrderQty !== undefined ? Number(meta.minOrderQty) : 1,
          taxRate: Number(dbProduct.taxRate),
          imageUrl: primaryImg,
          images: meta.images && meta.images.length > 0 ? meta.images : (primaryImg ? [primaryImg] : []),
          features: meta.features || (dbProduct as any).features || [],
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

  // ─── CREATE PRODUCT (Admin & Manager) ─────────────────────────────────────────
  async createProduct(organizationId: string, dto: CreateProductDto): Promise<ProductItemDto> {
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required.');
    }
    const price = dto.price ?? dto.minPrice ?? 0;
    const generatedSku = dto.sku?.trim() ? dto.sku.trim() : ('DAS-' + Math.floor(100000 + Math.random() * 900000));
    const finalUnit = dto.unit?.trim() || 'Pieces (Pcs)';
    const primaryImg = (dto.images && dto.images.length > 0)
      ? dto.images[0]
      : (dto.imageUrl || '');

    const metadata = {
      description: dto.description || '',
      sku: generatedSku,
      category: dto.category || '',
      subCategory: dto.subCategory || '',
      brand: dto.brand || '',
      color: dto.color || '',
      stock: dto.stock !== undefined ? Number(dto.stock) : 100,
      minOrderQty: dto.minOrderQty !== undefined ? Number(dto.minOrderQty) : 1,
      currency: dto.currency || '₹',
      imageUrl: primaryImg,
      images: dto.images && dto.images.length > 0 ? dto.images : (primaryImg ? [primaryImg] : []),
      features: dto.features || [],
    };
    const storedDescription = JSON.stringify(metadata);

    try {
      const dbProduct = await this.prisma.product.create({
        data: {
          organizationId,
          name: dto.name || 'New Product',
          description: storedDescription,
          price: price,
          unit: finalUnit,
          taxRate: dto.taxRate ?? 18,
          isActive: true,
        },
      });

      if (dbProduct) {
        return {
          id: dbProduct.id,
          name: dbProduct.name,
          sku: generatedSku,
          category: metadata.category,
          subCategory: metadata.subCategory,
          brand: metadata.brand,
          color: metadata.color,
          unit: finalUnit,
          description: dto.description || '',
          price: Number(dbProduct.price),
          minPrice: dto.minPrice ?? Number(dbProduct.price),
          maxPrice: dto.maxPrice ?? Number(dbProduct.price),
          currency: metadata.currency,
          stock: metadata.stock,
          minOrderQty: metadata.minOrderQty,
          taxRate: Number(dbProduct.taxRate),
          imageUrl: primaryImg,
          images: metadata.images,
          features: metadata.features,
          isActive: true,
          status: 'ACTIVE',
          createdAt: dbProduct.createdAt?.toISOString(),
        };
      }
    } catch (e) {
      console.warn('[ProductsService] DB product create error:', e.message);
    }

    // Fallback in-memory creation
    const newProduct: ProductItemDto = {
      id: 'p-' + Date.now(),
      name: dto.name || 'New Product',
      sku: generatedSku,
      category: metadata.category,
      subCategory: metadata.subCategory,
      brand: metadata.brand,
      color: metadata.color,
      unit: finalUnit,
      description: dto.description || 'No description provided.',
      price: price,
      minPrice: dto.minPrice ?? price,
      maxPrice: dto.maxPrice ?? price,
      currency: dto.currency || '₹',
      stock: metadata.stock,
      minOrderQty: metadata.minOrderQty,
      taxRate: dto.taxRate ?? 18,
      imageUrl: primaryImg,
      images: metadata.images,
      features: metadata.features,
      isActive: true,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    this.fallbackProducts.unshift(newProduct);
    return newProduct;
  }

  // ─── UPDATE PRODUCT (Admin & Manager) ─────────────────────────────────────────
  async updateProduct(organizationId: string, id: string, dto: UpdateProductDto): Promise<ProductItemDto> {
    const existing = await this.prisma.product.findFirst({
      where: { id, organizationId },
    }).catch(() => null);

    if (existing) {
      let meta: any = {};
      let prevDesc = existing.description || '';
      if (existing.description && existing.description.trim().startsWith('{')) {
        try {
          meta = JSON.parse(existing.description);
          prevDesc = meta.description ?? '';
        } catch (_) {}
      }

      const updatedMeta = {
        description: dto.description !== undefined ? dto.description : prevDesc,
        sku: dto.sku !== undefined ? dto.sku : (meta.sku || 'SKU-' + existing.id.substring(0, 6).toUpperCase()),
        category: dto.category !== undefined ? dto.category : (meta.category || ''),
        subCategory: dto.subCategory !== undefined ? dto.subCategory : (meta.subCategory || ''),
        brand: dto.brand !== undefined ? dto.brand : (meta.brand || ''),
        color: dto.color !== undefined ? dto.color : (meta.color || ''),
        stock: dto.stock !== undefined ? Number(dto.stock) : (meta.stock ?? 100),
        minOrderQty: dto.minOrderQty !== undefined ? Number(dto.minOrderQty) : (meta.minOrderQty ?? 1),
        currency: dto.currency || meta.currency || '₹',
        imageUrl: dto.imageUrl || (dto.images && dto.images[0]) || meta.imageUrl || '',
        images: dto.images !== undefined ? dto.images : (meta.images || []),
        features: dto.features !== undefined ? dto.features : (meta.features || []),
      };

      await this.prisma.product.update({
        where: { id },
        data: {
          ...(dto.name && { name: dto.name }),
          description: JSON.stringify(updatedMeta),
          ...(dto.price !== undefined && { price: dto.price }),
          ...(dto.unit !== undefined && { unit: dto.unit }),
          ...(dto.taxRate !== undefined && { taxRate: dto.taxRate }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        },
      });

      return this.getProductById(organizationId, id);
    }

    const idx = this.fallbackProducts.findIndex((p) => p.id === id);
    if (idx === -1) throw new NotFoundException(`Product "${id}" not found.`);
    this.fallbackProducts[idx] = { ...this.fallbackProducts[idx], ...dto };
    return this.fallbackProducts[idx];
  }

  // ─── DELETE PRODUCT — ADMIN ONLY — HARD REMOVES FROM DB + MEMORY ─────────────
  async deleteProduct(organizationId: string, id: string, requestingUser: any): Promise<{ success: boolean; message: string; deletedId: string }> {
    const roleName = typeof requestingUser?.role === 'string'
      ? requestingUser.role
      : requestingUser?.role?.name;

    const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'OWNER', 'MANAGER', 'DEPT_MANAGER'];
    if (!allowedRoles.includes(roleName)) {
      throw new ForbiddenException(
        `⛔ Access Denied: Only Admins and Managers can delete products. Your role "${roleName}" does not have delete permission.`,
      );
    }

    const existingProduct = await this.prisma.product.findFirst({
      where: { id, organizationId },
    }).catch(() => null);

    if (existingProduct) {
      const productName = existingProduct.name;
      await this.prisma.product.delete({ where: { id } });
      return {
        success: true,
        message: `✅ Product "${productName}" (ID: ${id}) has been permanently deleted from the database.`,
        deletedId: id,
      };
    }

    const idx = this.fallbackProducts.findIndex((p) => p.id === id);
    if (idx === -1) {
      throw new NotFoundException(`Product "${id}" not found in organization.`);
    }
    const productName = this.fallbackProducts[idx].name;
    this.fallbackProducts.splice(idx, 1);

    return {
      success: true,
      message: `✅ Product "${productName}" has been permanently deleted.`,
      deletedId: id,
    };
  }
}
