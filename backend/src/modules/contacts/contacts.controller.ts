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
import { ContactsService } from './contacts.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Contacts')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('contacts')
export class ContactsController {
  constructor(private contactsService: ContactsService) {}

  @Get()
  @ApiOperation({ summary: 'List all contacts for current organization' })
  async findAll(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.contactsService.findAll(user.organizationId, {
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contact details by ID' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.contactsService.findOne(user.organizationId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new contact' })
  async create(@CurrentUser() user: any, @Body() body: any) {
    return this.contactsService.create(user.organizationId, body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update contact details' })
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.contactsService.update(user.organizationId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete contact' })
  async delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.contactsService.remove(user.organizationId, id);
  }
}
