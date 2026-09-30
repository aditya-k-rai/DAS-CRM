import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesService } from './roles.service';
import { RecordScope } from '@prisma/client';

@ApiTags('Roles & RBAC')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  private getOrgId(req: any): string {
    return req.user?.organizationId || req.user?.org_id || '';
  }

  private assertAdmin(req: any) {
    const roleName = typeof req.user?.role === 'string' ? req.user.role : req.user?.role?.name;
    if (roleName !== 'ADMIN' && roleName !== 'OWNER' && roleName !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only Administrators can manage roles and permissions.');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all roles and permissions for tenant' })
  getRoles(@Req() req: any) {
    return this.rolesService.getRoles(this.getOrgId(req));
  }

  @Get('permissions')
  @ApiOperation({ summary: 'Get all available system permissions' })
  getPermissions() {
    return this.rolesService.getPermissions();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new custom role with permissions' })
  createRole(
    @Body()
    dto: {
      name: string;
      recordScope?: RecordScope;
      permissionIds?: string[];
    },
    @Req() req: any,
  ) {
    this.assertAdmin(req);
    return this.rolesService.createRole(this.getOrgId(req), dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update custom role scope and permissions' })
  updateRole(
    @Param('id') id: string,
    @Body()
    dto: {
      name?: string;
      recordScope?: RecordScope;
      permissionIds?: string[];
    },
    @Req() req: any,
  ) {
    this.assertAdmin(req);
    return this.rolesService.updateRole(this.getOrgId(req), id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete custom role' })
  deleteRole(@Param('id') id: string, @Req() req: any) {
    this.assertAdmin(req);
    return this.rolesService.deleteRole(this.getOrgId(req), id);
  }
}
