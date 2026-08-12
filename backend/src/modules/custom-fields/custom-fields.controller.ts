import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CustomFieldsService } from './custom-fields.service';

@ApiTags('Custom Fields')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('custom-fields')
export class CustomFieldsController {
  constructor(private customFieldsService: CustomFieldsService) {}
}
