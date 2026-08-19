import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { QuotationsService, QuotationItemDto } from './quotations.service';

@ApiTags('Quotations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('quotations')
export class QuotationsController {
  constructor(private quotationsService: QuotationsService) {}

  @Get()
  @ApiOperation({ summary: 'List all quotations and invoices' })
  async getQuotations(): Promise<QuotationItemDto[]> {
    return this.quotationsService.getQuotations();
  }

  @Post()
  @ApiOperation({ summary: 'Create new quotation invoice' })
  async createQuotation(@Body() body: Partial<QuotationItemDto>): Promise<QuotationItemDto> {
    return this.quotationsService.createQuotation(body);
  }
}
