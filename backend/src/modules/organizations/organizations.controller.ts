import { Controller, Get, Patch, Body, UseGuards, Put } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { OrganizationsService, UpdateOrganizationDto, UpdateSellerProfileDto } from './organizations.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Organizations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('my-organization')
  @ApiOperation({ summary: '[Admin Only] View Company Profile Settings' })
  getMyOrganization(@CurrentUser() user: any) {
    return this.organizationsService.getMyOrganization(user.organizationId, user.role);
  }

  @Patch('my-organization')
  @ApiOperation({ summary: '[Admin Only] Edit Company Profile Settings' })
  updateMyOrganization(@CurrentUser() user: any, @Body() dto: UpdateOrganizationDto) {
    return this.organizationsService.updateMyOrganization(user.organizationId, user.role, dto);
  }

  // ── Seller Profile endpoints (all roles) ─────────────────────────────
  // Used by QuotationBuilder to persist seller/company info for quotations across devices

  @Get('seller-profile')
  @ApiOperation({ summary: '[All Roles] Get Seller Profile for Quotations' })
  getSellerProfile(@CurrentUser() user: any) {
    return this.organizationsService.getSellerProfile(user.organizationId);
  }

  @Put('seller-profile')
  @ApiOperation({ summary: '[All Roles] Update Seller Profile for Quotations' })
  updateSellerProfile(@CurrentUser() user: any, @Body() dto: UpdateSellerProfileDto) {
    return this.organizationsService.updateSellerProfile(user.organizationId, dto);
  }
}
