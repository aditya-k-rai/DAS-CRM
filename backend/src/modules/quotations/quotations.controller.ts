import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { QuotationsService, QuotationItemDto } from './quotations.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Quotations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('quotations')
export class QuotationsController {
  constructor(private quotationsService: QuotationsService) {}

  @Get()
  @ApiOperation({ summary: 'List all quotations and invoices for current organization' })
  async getQuotations(@CurrentUser() user: any): Promise<QuotationItemDto[]> {
    return this.quotationsService.getQuotations(user?.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single quotation by ID' })
  async getQuotationById(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<QuotationItemDto> {
    return this.quotationsService.getQuotationById(user?.organizationId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new quotation invoice' })
  async createQuotation(
    @Body() body: any,
    @CurrentUser() user: any,
  ): Promise<QuotationItemDto> {
    return this.quotationsService.createQuotation(user?.organizationId, body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update quotation invoice' })
  async updateQuotation(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ): Promise<QuotationItemDto> {
    return this.quotationsService.updateQuotation(user?.organizationId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete quotation invoice' })
  async deleteQuotation(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<{ success: boolean; id: string }> {
    return this.quotationsService.deleteQuotation(user?.organizationId, id);
  }
}
