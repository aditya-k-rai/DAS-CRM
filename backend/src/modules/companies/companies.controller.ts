import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CompaniesService } from './companies.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Companies')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('companies')
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get company accounts statistics for current organization' })
  async getStats(@CurrentUser() user: any) {
    return this.companiesService.getStats(user.organizationId);
  }

  @Get()
  @ApiOperation({ summary: 'List all company accounts for current organization' })
  async findAll(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('industry') industry?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.companiesService.findAll(user.organizationId, {
      search,
      industry,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get company account details by ID' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.companiesService.findOne(user.organizationId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new company account' })
  async create(@CurrentUser() user: any, @Body() body: any) {
    return this.companiesService.create(user.organizationId, body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update company account details' })
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.companiesService.update(user.organizationId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete company account' })
  async delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.companiesService.delete(user.organizationId, id);
  }
}
