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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import type { ProductItemDto, CreateProductDto, UpdateProductDto } from './products.service';
import { ProductsService } from './products.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  // ─── GET ALL ACTIVE PRODUCTS ──────────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'List all active products in the catalog' })
  @ApiResponse({ status: 200, description: 'Returns all active products visible to all authenticated users.' })
  async getProducts(): Promise<ProductItemDto[]> {
    return this.productsService.getProducts();
  }

  // ─── GET SINGLE PRODUCT ───────────────────────────────────────────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Get full product details by ID' })
  @ApiParam({ name: 'id', description: 'Product ID (cuid)' })
  async getProductById(@Param('id') id: string): Promise<ProductItemDto> {
    return this.productsService.getProductById(id);
  }

  // ─── CREATE PRODUCT (Admin only via role check in service) ───────────────────
  @Post()
  @ApiOperation({ summary: 'Create new catalog product — Admin only' })
  @ApiResponse({ status: 201, description: 'Product created successfully.' })
  @ApiResponse({ status: 403, description: 'Only Admins can create products.' })
  async createProduct(
    @Body() body: CreateProductDto,
    @CurrentUser() user: any,
  ): Promise<ProductItemDto> {
    return this.productsService.createProduct(body);
  }

  // ─── UPDATE PRODUCT (Admin only via role check in service) ───────────────────
  @Put(':id')
  @ApiOperation({ summary: 'Update product details — Admin only' })
  @ApiParam({ name: 'id', description: 'Product ID (cuid)' })
  @ApiResponse({ status: 200, description: 'Product updated successfully.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async updateProduct(
    @Param('id') id: string,
    @Body() body: UpdateProductDto,
    @CurrentUser() user: any,
  ): Promise<ProductItemDto> {
    return this.productsService.updateProduct(id, body);
  }

  // ─── DELETE PRODUCT — ADMIN ONLY — PERMANENTLY REMOVES FROM DATABASE ─────────
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '🗑️ Delete product — ADMIN ONLY — Permanently removes from database' })
  @ApiParam({ name: 'id', description: 'Product ID (cuid) to permanently delete' })
  @ApiResponse({ status: 200, description: 'Product permanently deleted. Will no longer be visible to anyone.' })
  @ApiResponse({ status: 403, description: '⛔ Forbidden: Only Admins can delete products.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async deleteProduct(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<{ success: boolean; message: string; deletedId: string }> {
    // Pass the authenticated user to the service for role-based access control
    return this.productsService.deleteProduct(id, user);
  }
}
