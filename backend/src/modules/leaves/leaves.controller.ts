import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LeavesService } from './leaves.service';
@ApiTags('Leaves')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('leaves')
export class LeavesController {
  constructor(private leavesService: LeavesService) {}
}
