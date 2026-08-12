import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DealsService } from './deals.service';

@ApiTags('Deals')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('deals')
export class DealsController {
  constructor(private Service: DealsService) {}
}
