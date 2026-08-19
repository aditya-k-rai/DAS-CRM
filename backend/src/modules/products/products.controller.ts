import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ProductsService, ProductItemDto } from './products.service';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List all products and catalog items' })
  async getProducts(): Promise<ProductItemDto[]> {
    return this.productsService.getProducts();
  }

  @Post()
  @ApiOperation({ summary: 'Create new catalog product' })
  async createProduct(@Body() body: Partial<ProductItemDto>): Promise<ProductItemDto> {
    return this.productsService.createProduct(body);
  }
}
