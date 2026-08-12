import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { HrService } from './hr.service';
@ApiTags('Hr')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('hr')
export class HrController {
  constructor(private hrService: HrService) {}
}
