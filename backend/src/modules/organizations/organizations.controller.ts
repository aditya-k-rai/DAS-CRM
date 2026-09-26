import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { OrganizationsService, UpdateOrganizationDto } from './organizations.service';
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
}
