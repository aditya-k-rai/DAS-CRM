import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all organization users/members' })
  async findAll(@CurrentUser() user: any) {
    return this.usersService.findAll(user.organizationId);
  }

  @Patch('phone')
  @ApiOperation({ summary: 'Update organization/user contact phone' })
  async updatePhone(@CurrentUser() user: any, @Body() body: { phone: string }) {
    return this.usersService.updatePhone(user.organizationId, user.id, body.phone);
  }
}
