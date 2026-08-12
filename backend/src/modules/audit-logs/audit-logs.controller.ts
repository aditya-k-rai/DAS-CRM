import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Audit $args[0].Groups[1].Value.ToUpper() ogsService } from './audit-logs.service';

@ApiTags('Audit $args[0].Groups[1].Value.ToUpper() ogs')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('audit-logs')
export class Audit $args[0].Groups[1].Value.ToUpper() ogsController {
  constructor(private Service: Audit $args[0].Groups[1].Value.ToUpper() ogsService) {}
}
