import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ImportsService } from './imports.service';

@ApiTags('Imports')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('imports')
export class ImportsController {
  constructor(private Service: ImportsService) {}
}
