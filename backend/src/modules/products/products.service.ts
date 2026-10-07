import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudStorageService } from '../firestore/cloud-storage.service';
import { FirestoreService } from '../firestore/firestore.service';

import { IsString, IsOptional, IsNumber, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

export interface VolumeDiscountTier {
  tier: string;
  minQty: number;
  discountPct: number;
  finalPrice: number;
}

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
  volumeDiscounts?: VolumeDiscountTier[];
  sharedCount?: number;
  isActive: boolean;
  status: 'ACTIVE' | 'OUT_OF_STOCK' | 'DISCONTINUED' | 'DELETED';
  createdAt?: string;
  updatedAt?: string;
}

export class CreateProductDto {
  @ApiProperty({ description: 'Product title' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subCategory?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  stock?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minOrderQty?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  taxRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  images?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  features?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  volumeDiscounts?: VolumeDiscountTier[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sharedCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subCategory?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  stock?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minOrderQty?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  taxRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  images?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  features?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  volumeDiscounts?: VolumeDiscountTier[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sharedCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
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
  constructor(
    private prisma: PrismaService,
    private cloudStorageService: CloudStorageService,
    private firestoreService: FirestoreService,
  ) {}

  // ─── In-Memory Fallback Store (Preloaded with standard catalog products) ───
  private fallbackProducts: ProductItemDto[] = [
    {
      id: 'p-colour-tribe-jackets',
      name: 'Colour Tribe Puff Jackets',
      sku: 'DAS-570687',
      category: 'Jackets',
      subCategory: 'Puff Jackets',
      brand: 'Generic / Unbranded',
      color: 'Silver Grey, Black',
      unit: 'Pieces (Pcs)',
      description: 'Premium Padded Colour Tribe Puff Jackets with lightweight thermal insulation and dual zip pockets.',
      price: 999,
      minPrice: 999,
      maxPrice: 999,
      currency: '₹',
      stock: 100,
      minOrderQty: 1,
      taxRate: 18,
      imageUrl: '/products/puff-jackets.jpg',
      images: [
        '/products/puff-jackets.jpg',
      ],
      features: ['Padded', 'Lightweight', 'Thermal Insulation'],
      volumeDiscounts: [
        { tier: '1 - 9 Units', minQty: 1, discountPct: 0, finalPrice: 999 },
        { tier: '10+ Units', minQty: 10, discountPct: 15, finalPrice: 849 },
      ],
      sharedCount: 12,
      isActive: true,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    },
  ];
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
  async getProducts(organizationId?: string): Promise<ProductItemDto[]> {
    const orgId = organizationId || 'org_default';
    try {
      const whereClause: any = { isActive: true };
      if (orgId && orgId !== 'org_default') {
        whereClause.organizationId = orgId;
      }

      let dbProducts = await this.prisma.product.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      }).catch(() => []);

      // If org-specific query returned 0, try finding all active products in DB
      if (dbProducts.length === 0 && orgId !== 'org_default') {
        dbProducts = await this.prisma.product.findMany({
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        }).catch(() => []);
      }

      if (dbProducts && dbProducts.length > 0) {
        const mappedDb = dbProducts.map((p) => {
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

          const primaryImg = meta.imageUrl || (meta.images && meta.images[0]) || (p as any).imageUrl || '/products/puff-jackets.jpg';

          return {
            id: p.id,
            name: p.name,
            sku: meta.sku || (p as any).sku || 'SKU-' + p.id.substring(0, 6).toUpperCase(),
            category: meta.category || (p as any).category || 'General',
            subCategory: meta.subCategory || (p as any).subCategory || 'Standard',
            brand: meta.brand || (p as any).brand || 'Generic / Unbranded',
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
            volumeDiscounts: meta.volumeDiscounts || [],
            sharedCount: Number(meta.sharedCount) || 0,
            isActive: p.isActive,
            status: 'ACTIVE' as const,
            createdAt: p.createdAt?.toISOString(),
            updatedAt: p.updatedAt?.toISOString(),
          };
        });

        // Always merge fallback products (like Colour Tribe Puff Jackets) if not already in DB
        const mappedSkus = new Set(mappedDb.map((p) => (p.sku || '').toUpperCase()));
        const mappedNames = new Set(mappedDb.map((p) => (p.name || '').trim().toLowerCase()));
        const missingFallbacks = this.fallbackProducts.filter(
          (f) =>
            f.isActive &&
            f.status !== 'DELETED' &&
            !mappedSkus.has((f.sku || '').toUpperCase()) &&
            !mappedNames.has((f.name || '').trim().toLowerCase()),
        );

        return [...missingFallbacks, ...mappedDb];
      }
    } catch (e) {
      console.warn('[ProductsService] DB query failed:', e.message);
    }

    return this.fallbackProducts.filter((p) => p.status !== 'DELETED' && p.isActive);
  }

  // ─── GET SINGLE PRODUCT BY ID ────────────────────────────────────────────────
  async getProductById(organizationId: string, id: string): Promise<ProductItemDto> {
    const orgId = organizationId || 'org_default';
    try {
      const dbProduct = await this.prisma.product.findFirst({
        where: { id, organizationId: orgId },
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
          volumeDiscounts: meta.volumeDiscounts || [],
          sharedCount: Number(meta.sharedCount) || 0,
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

  /**
   * Upload an image (base64 dataUrl or binary Buffer) directly to Firebase Cloud Storage.
   * Records metadata in Firestore and returns the permanent Firebase Storage download URL.
   */
  async uploadImageToFirebase(dataUrlOrBuffer: string | Buffer, filenamePrefix: string = 'product'): Promise<string> {
    try {
      let buffer: Buffer;
      let mimeType = 'image/jpeg';

      if (Buffer.isBuffer(dataUrlOrBuffer)) {
        buffer = dataUrlOrBuffer;
      } else if (typeof dataUrlOrBuffer === 'string') {
        if (!dataUrlOrBuffer.startsWith('data:')) {
          // Already a remote/external URL or public path
          return dataUrlOrBuffer;
        }
        const matches = dataUrlOrBuffer.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          buffer = Buffer.from(matches[2], 'base64');
        } else {
          return dataUrlOrBuffer;
        }
      } else {
        return '';
      }

      const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
      const cleanPath = `products/${filenamePrefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;

      const { gcsDownloadUrl } = await this.cloudStorageService.uploadBuffer(buffer, cleanPath, mimeType);

      // Register file metadata in Firestore
      try {
        const firestore = this.firestoreService.getFirestore();
        if (firestore) {
          await firestore.collection('product_images').add({
            fileName: `${filenamePrefix}.${ext}`,
            path: cleanPath,
            url: gcsDownloadUrl,
            mimeType,
            sizeBytes: buffer.length,
            uploadedAt: new Date().toISOString(),
          });
        }
      } catch (_) {}

      return gcsDownloadUrl;
    } catch (err) {
      console.warn('[ProductsService] Failed to upload image to Firebase Cloud Storage, saving to local static directory:', err);
      try {
        if (typeof dataUrlOrBuffer === 'string' && dataUrlOrBuffer.startsWith('data:')) {
          const matches = dataUrlOrBuffer.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const mimeType = matches[1];
            const buffer = Buffer.from(matches[2], 'base64');
            const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
            const cleanName = `${filenamePrefix}-${Date.now()}.${ext}`;
            const targetDir = path.resolve(process.cwd(), 'public', 'products');
            if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
            fs.writeFileSync(path.join(targetDir, cleanName), buffer);
            return `/products/${cleanName}`;
          }
        }
      } catch (_) {}
      return typeof dataUrlOrBuffer === 'string' ? dataUrlOrBuffer : '';
    }
  }

  // ─── CREATE PRODUCT (Admin & Manager) ─────────────────────────────────────────
  async createProduct(organizationId: string, dto: CreateProductDto): Promise<ProductItemDto> {
    const orgId = organizationId || 'org_default';
    const price = dto.price ?? dto.minPrice ?? 0;
    const generatedSku = dto.sku?.trim() ? dto.sku.trim() : ('DAS-' + Math.floor(100000 + Math.random() * 900000));
    const finalUnit = dto.unit?.trim() || 'Pieces (Pcs)';

    // Upload images to Firebase Cloud Storage if they are base64
    let primaryImg = (dto.images && dto.images.length > 0)
      ? dto.images[0]
      : (dto.imageUrl || '');
    if (!primaryImg || primaryImg.includes('images.unsplash.com')) {
      primaryImg = '/products/puff-jackets.jpg';
    } else if (primaryImg.startsWith('data:')) {
      primaryImg = await this.uploadImageToFirebase(primaryImg, 'product-cover');
    }

    let processedImages: string[] = [];
    if (dto.images && Array.isArray(dto.images) && dto.images.length > 0) {
      processedImages = await Promise.all(
        dto.images.map((im) => (im.startsWith('data:') ? this.uploadImageToFirebase(im, 'product-gallery') : Promise.resolve(im)))
      );
    } else {
      processedImages = [primaryImg];
    }

    const metadata = {
      description: dto.description || '',
      sku: generatedSku,
      category: dto.category || 'General',
      subCategory: dto.subCategory || 'Standard',
      brand: dto.brand || 'Generic / Unbranded',
      color: dto.color || '',
      stock: dto.stock !== undefined ? Number(dto.stock) : 100,
      minOrderQty: dto.minOrderQty !== undefined ? Number(dto.minOrderQty) : 1,
      currency: dto.currency || '₹',
      imageUrl: primaryImg,
      images: processedImages,
      features: dto.features || [],
      volumeDiscounts: dto.volumeDiscounts || [],
      sharedCount: Number(dto.sharedCount) || 0,
    };
    const storedDescription = JSON.stringify(metadata);

    try {
      let resolvedOrgId = orgId;
      if (!resolvedOrgId || resolvedOrgId === 'org_default') {
        const firstOrg = await this.prisma.organization.findFirst({ select: { id: true } }).catch(() => null);
        if (firstOrg) {
          resolvedOrgId = firstOrg.id;
        }
      }

      const dbProduct = await this.prisma.product.create({
        data: {
          organizationId: resolvedOrgId,
          name: dto.name || 'New Product',
          description: storedDescription,
          price: price,
          unit: finalUnit,
          taxRate: dto.taxRate ?? 18,
          isActive: true,
        },
      });

      if (dbProduct) {
        const item: ProductItemDto = {
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
          volumeDiscounts: metadata.volumeDiscounts,
          sharedCount: metadata.sharedCount,
          isActive: true,
          status: 'ACTIVE',
          createdAt: dbProduct.createdAt?.toISOString(),
        };
        this.fallbackProducts.unshift(item);
        return item;
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
      volumeDiscounts: metadata.volumeDiscounts,
      sharedCount: metadata.sharedCount,
      isActive: true,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    this.fallbackProducts.unshift(newProduct);
    return newProduct;
  }

  // ─── UPDATE PRODUCT (Admin & Manager) ─────────────────────────────────────────
  async updateProduct(organizationId: string, id: string, dto: UpdateProductDto): Promise<ProductItemDto> {
    let resolvedOrgId = organizationId;
    if (!resolvedOrgId || resolvedOrgId === 'org_default') {
      const firstOrg = await this.prisma.organization.findFirst({ select: { id: true } }).catch(() => null);
      if (firstOrg) {
        resolvedOrgId = firstOrg.id;
      } else {
        resolvedOrgId = 'org_default';
      }
    }

    // Upload updated images to Firebase Cloud Storage if they are base64
    let primaryImageUrl = dto.imageUrl;
    if (primaryImageUrl && primaryImageUrl.startsWith('data:')) {
      primaryImageUrl = await this.uploadImageToFirebase(primaryImageUrl, 'product-cover');
    }

    let processedImages: string[] | undefined = undefined;
    if (Array.isArray(dto.images) && dto.images.length > 0) {
      processedImages = await Promise.all(
        dto.images.map((im) => (im.startsWith('data:') ? this.uploadImageToFirebase(im, 'product-gallery') : Promise.resolve(im)))
      );
      if (!primaryImageUrl && processedImages.length > 0) {
        primaryImageUrl = processedImages[0];
      }
    }

    // 1. Look up existing in Prisma database (Supabase)
    const existing = await this.prisma.product.findFirst({
      where: {
        OR: [
          { id },
          { id, organizationId: resolvedOrgId },
          ...(dto.sku ? [{ description: { contains: dto.sku } }] : []),
          ...(dto.name ? [{ name: dto.name }] : []),
        ],
      },
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
        imageUrl: primaryImageUrl !== undefined ? primaryImageUrl : (meta.imageUrl || ''),
        images: processedImages !== undefined ? processedImages : (meta.images || []),
        features: dto.features !== undefined ? dto.features : (meta.features || []),
        volumeDiscounts: dto.volumeDiscounts !== undefined ? dto.volumeDiscounts : (meta.volumeDiscounts || []),
        sharedCount: dto.sharedCount !== undefined ? Number(dto.sharedCount) : (Number(meta.sharedCount) || 0),
      };

      await this.prisma.product.update({
        where: { id: existing.id },
        data: {
          ...(dto.name && { name: dto.name }),
          description: JSON.stringify(updatedMeta),
          ...(dto.price !== undefined && { price: dto.price }),
          ...(dto.unit !== undefined && { unit: dto.unit }),
          ...(dto.taxRate !== undefined && { taxRate: dto.taxRate }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        },
      });

      // Update in-memory fallback list
      const fIdx = this.fallbackProducts.findIndex((p) => p.id === id || p.id === existing.id);
      if (fIdx !== -1) {
        this.fallbackProducts[fIdx] = {
          ...this.fallbackProducts[fIdx],
          ...dto,
          imageUrl: updatedMeta.imageUrl,
          images: updatedMeta.images,
        };
      }

      return this.getProductById(resolvedOrgId, existing.id);
    }

    // 2. Product not yet in Supabase (e.g. preloaded fallback 'p-colour-tribe-jackets')
    // Persist into Supabase so it becomes a permanent DB record!
    const fallbackItem = this.fallbackProducts.find((p) => p.id === id);
    const generatedSku = dto.sku?.trim() || fallbackItem?.sku || ('DAS-' + Math.floor(100000 + Math.random() * 900000));
    const finalName = dto.name || fallbackItem?.name || 'Updated Product';
    const finalUnit = dto.unit || fallbackItem?.unit || 'Pieces (Pcs)';
    const finalPrice = dto.price ?? fallbackItem?.price ?? 999;
    const finalTax = dto.taxRate ?? fallbackItem?.taxRate ?? 18;

    const metadata = {
      description: dto.description !== undefined ? dto.description : (fallbackItem?.description || ''),
      sku: generatedSku,
      category: dto.category || fallbackItem?.category || 'General',
      subCategory: dto.subCategory || fallbackItem?.subCategory || 'Standard',
      brand: dto.brand || fallbackItem?.brand || 'Generic / Unbranded',
      color: dto.color !== undefined ? dto.color : (fallbackItem?.color || ''),
      stock: dto.stock !== undefined ? Number(dto.stock) : (fallbackItem?.stock ?? 100),
      minOrderQty: dto.minOrderQty !== undefined ? Number(dto.minOrderQty) : (fallbackItem?.minOrderQty ?? 1),
      currency: dto.currency || fallbackItem?.currency || '₹',
      imageUrl: primaryImageUrl || fallbackItem?.imageUrl || '/products/puff-jackets.jpg',
      images: processedImages && processedImages.length > 0
        ? processedImages
        : (fallbackItem?.images || [primaryImageUrl || '/products/puff-jackets.jpg']),
      features: dto.features || fallbackItem?.features || [],
      volumeDiscounts: dto.volumeDiscounts || fallbackItem?.volumeDiscounts || [],
      sharedCount: dto.sharedCount !== undefined ? Number(dto.sharedCount) : (fallbackItem?.sharedCount || 0),
    };

    try {
      const createdInDb = await this.prisma.product.create({
        data: {
          organizationId: resolvedOrgId,
          name: finalName,
          price: finalPrice,
          unit: finalUnit,
          taxRate: finalTax,
          description: JSON.stringify(metadata),
          isActive: dto.isActive !== undefined ? dto.isActive : true,
        },
      });

      const resultItem: ProductItemDto = {
        id: createdInDb.id,
        name: createdInDb.name,
        sku: generatedSku,
        category: metadata.category,
        subCategory: metadata.subCategory,
        brand: metadata.brand,
        color: metadata.color,
        unit: createdInDb.unit,
        description: metadata.description,
        price: Number(createdInDb.price),
        minPrice: Number(createdInDb.price),
        maxPrice: Number(createdInDb.price),
        currency: metadata.currency,
        stock: metadata.stock,
        minOrderQty: metadata.minOrderQty,
        taxRate: Number(createdInDb.taxRate),
        imageUrl: metadata.imageUrl,
        images: metadata.images,
        features: metadata.features,
        volumeDiscounts: metadata.volumeDiscounts,
        sharedCount: metadata.sharedCount,
        isActive: createdInDb.isActive,
        status: 'ACTIVE',
        createdAt: createdInDb.createdAt?.toISOString(),
        updatedAt: createdInDb.updatedAt?.toISOString(),
      };

      const idx = this.fallbackProducts.findIndex((p) => p.id === id);
      if (idx !== -1) {
        this.fallbackProducts[idx] = resultItem;
      } else {
        this.fallbackProducts.unshift(resultItem);
      }

      return resultItem;
    } catch (dbErr) {
      console.warn('[ProductsService] Could not persist to DB, updating in-memory:', dbErr);
    }

    const idx = this.fallbackProducts.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.fallbackProducts[idx] = {
        ...this.fallbackProducts[idx],
        ...dto,
        imageUrl: metadata.imageUrl,
        images: metadata.images,
      };
      return this.fallbackProducts[idx];
    }

    throw new NotFoundException(`Product "${id}" could not be updated.`);
  }

  // ─── INCREMENT PRODUCT SHARE COUNT ──────────────────────────────────────────
  async incrementShareCount(organizationId: string, id: string): Promise<{ success: boolean; sharedCount: number }> {
    const orgId = organizationId || 'org_default';
    const existing = await this.prisma.product.findFirst({
      where: { id, organizationId: orgId },
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

      const currentCount = Number(meta.sharedCount) || 0;
      const newCount = currentCount + 1;
      meta.sharedCount = newCount;

      await this.prisma.product.update({
        where: { id },
        data: {
          description: JSON.stringify(meta),
        },
      });

      return { success: true, sharedCount: newCount };
    }

    const idx = this.fallbackProducts.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.fallbackProducts[idx].sharedCount = (this.fallbackProducts[idx].sharedCount || 0) + 1;
      return { success: true, sharedCount: this.fallbackProducts[idx].sharedCount };
    }

    return { success: false, sharedCount: 0 };
  }

  // ─── DELETE PRODUCT — ADMIN ONLY — HARD REMOVES FROM DB + MEMORY ─────────────
  async deleteProduct(organizationId: string, id: string, requestingUser: any): Promise<{ success: boolean; message: string; deletedId: string }> {
    const orgId = organizationId || 'org_default';
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
      where: { id, organizationId: orgId },
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
