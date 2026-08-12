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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesService } from './roles.service';
import { RecordScope } from '@prisma/client';

@ApiTags('Roles & RBAC')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/v1/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all roles and permissions for tenant' })
  getRoles(@Req() req: any) {
    return this.rolesService.getRoles(req.user.org_id);
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
    return this.rolesService.createRole(req.user.org_id, dto);
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
    return this.rolesService.updateRole(req.user.org_id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete custom role' })
  deleteRole(@Param('id') id: string, @Req() req: any) {
    return this.rolesService.deleteRole(req.user.org_id, id);
  }
}
