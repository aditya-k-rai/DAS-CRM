import { Controller, Get, Patch, Body, UseGuards, Put } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { OrganizationsService, UpdateOrganizationDto, UpdateSellerProfileDto } from './organizations.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Organizations')
@ApiBearerAuth()
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('my-organization')
  @ApiOperation({ summary: '[Admin Only] View Company Profile Settings' })
  getMyOrganization(@CurrentUser() user: any) {
    return this.organizationsService.getMyOrganization(user.organizationId, user.role);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('my-organization')
  @ApiOperation({ summary: '[Admin Only] Edit Company Profile Settings' })
  updateMyOrganization(@CurrentUser() user: any, @Body() dto: UpdateOrganizationDto) {
    return this.organizationsService.updateMyOrganization(user.organizationId, user.role, dto);
  }

  // ── Seller Profile endpoints (all roles & fallback) ─────────────────
  // Used by QuotationBuilder to persist seller/company info for quotations across devices

  @UseGuards(OptionalJwtAuthGuard)
  @Get('seller-profile')
  @ApiOperation({ summary: '[All Roles] Get Seller Profile for Quotations' })
  getSellerProfile(@CurrentUser() user: any) {
    const orgId = user?.organizationId || user?.organization?.id || user?.orgId || 'org_default';
    return this.organizationsService.getSellerProfile(orgId);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Put('seller-profile')
  @ApiOperation({ summary: '[All Roles] Update Seller Profile for Quotations' })
  updateSellerProfile(@CurrentUser() user: any, @Body() dto: UpdateSellerProfileDto) {
    const orgId = user?.organizationId || user?.organization?.id || user?.orgId || 'org_default';
    return this.organizationsService.updateSellerProfile(orgId, dto);
  }
}
