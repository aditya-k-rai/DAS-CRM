import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CreateProductDto, UpdateProductDto, type ProductItemDto, type ProductCardDisplayConfig } from './products.service';
import { ProductsService } from './products.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(OptionalJwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  // ─── UPLOAD PRODUCT IMAGE TO FIREBASE STORAGE & FIRESTORE ─────────────────
  @Post('upload-image')
  @ApiOperation({ summary: 'Upload product image directly to Firebase Storage and record in Firestore' })
  async uploadProductImage(
    @Body() body: { dataUrl?: string; fileName?: string },
  ): Promise<{ success: boolean; url: string }> {
    if (!body?.dataUrl) {
      throw new BadRequestException('No image data provided');
    }
    const url = await this.productsService.uploadImageToFirebase(body.dataUrl, body.fileName || 'product');
    return { success: true, url };
  }

  // ─── GET ALL ACTIVE PRODUCTS ──────────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'List all active products in the catalog' })
  @ApiResponse({ status: 200, description: 'Returns all active products visible to all authenticated users.' })
  async getProducts(@CurrentUser() user: any): Promise<ProductItemDto[]> {
    const orgId = user?.organizationId || user?.organization?.id || user?.orgId || 'org_default';
    return this.productsService.getProducts(orgId);
  }

  // ─── GET CARD DISPLAY CONFIGURATION ──────────────────────────────────────────
  @Get('card-display-config')
  @ApiOperation({ summary: 'Get product card display configuration for current organization' })
  @ApiResponse({ status: 200, description: 'Returns current card display configuration.' })
  async getCardDisplayConfig(@CurrentUser() user: any): Promise<ProductCardDisplayConfig> {
    return this.productsService.getCardDisplayConfig(user);
  }

  // ─── UPDATE CARD DISPLAY CONFIGURATION (Admin only) ─────────────────────────
  @Put('card-display-config')
  @ApiOperation({ summary: 'Update product card display configuration — Admin only' })
  @ApiResponse({ status: 200, description: 'Card display configuration updated successfully.' })
  @ApiResponse({ status: 403, description: 'Only Admins can update card display configuration.' })
  async saveCardDisplayConfig(
    @Body() body: Partial<ProductCardDisplayConfig>,
    @CurrentUser() user: any,
  ): Promise<ProductCardDisplayConfig> {
    return this.productsService.saveCardDisplayConfig(body, user);
  }

  // ─── GET SINGLE PRODUCT ───────────────────────────────────────────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Get full product details by ID' })
  @ApiParam({ name: 'id', description: 'Product ID (cuid)' })
  async getProductById(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<ProductItemDto> {
    const orgId = user?.organizationId || user?.organization?.id || user?.orgId || 'org_default';
    return this.productsService.getProductById(orgId, id);
  }

  // ─── CREATE PRODUCT (Admin & Manager) ───────────────────────────────────────
  @Post()
  @ApiOperation({ summary: 'Create new catalog product — Admin & Manager' })
  @ApiResponse({ status: 201, description: 'Product created successfully.' })
  @ApiResponse({ status: 403, description: 'Only Admins and Managers can create products.' })
  async createProduct(
    @Body() body: CreateProductDto,
    @CurrentUser() user: any,
  ): Promise<ProductItemDto> {
    const orgId = user?.organizationId || user?.organization?.id || user?.orgId || 'org_default';
    return this.productsService.createProduct(orgId, body);
  }

  // ─── UPDATE PRODUCT (Admin & Manager) ───────────────────────────────────────
  @Put(':id')
  @ApiOperation({ summary: 'Update product details — Admin & Manager' })
  @ApiParam({ name: 'id', description: 'Product ID (cuid)' })
  @ApiResponse({ status: 200, description: 'Product updated successfully.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async updateProduct(
    @Param('id') id: string,
    @Body() body: UpdateProductDto,
    @CurrentUser() user: any,
  ): Promise<ProductItemDto> {
    const orgId = user?.organizationId || user?.organization?.id || user?.orgId || 'org_default';
    return this.productsService.updateProduct(orgId, id, body);
  }

  // ─── DELETE PRODUCT — ADMIN & MANAGER — PERMANENTLY REMOVES FROM DATABASE ─────
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '🗑️ Delete product — ADMIN & MANAGER — Permanently removes from database' })
  @ApiParam({ name: 'id', description: 'Product ID (cuid) to permanently delete' })
  @ApiResponse({ status: 200, description: 'Product permanently deleted. Will no longer be visible to anyone.' })
  @ApiResponse({ status: 403, description: '⛔ Forbidden: Only Admins and Managers can delete products.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async deleteProduct(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<{ success: boolean; message: string; deletedId: string }> {
    const orgId = user?.organizationId || user?.organization?.id || user?.orgId || 'org_default';
    return this.productsService.deleteProduct(orgId, id, user);
  }

  // ─── INCREMENT SHARE COUNT ──────────────────────────────────────────────────
  @Post(':id/increment-share')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Increment product share count' })
  @ApiParam({ name: 'id', description: 'Product ID (cuid)' })
  async incrementShareCount(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<{ success: boolean; sharedCount: number }> {
    const orgId = user?.organizationId || user?.organization?.id || user?.orgId || 'org_default';
    return this.productsService.incrementShareCount(orgId, id);
  }
}
