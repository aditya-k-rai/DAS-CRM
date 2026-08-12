import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Custom $args[0].Groups[1].Value.ToUpper() ieldsService } from './custom-fields.service';

@ApiTags('Custom $args[0].Groups[1].Value.ToUpper() ields')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('custom-fields')
export class Custom $args[0].Groups[1].Value.ToUpper() ieldsController {
  constructor(private Service: Custom $args[0].Groups[1].Value.ToUpper() ieldsService) {}
}
