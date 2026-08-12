import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SalaryService } from './salary.service';
@ApiTags('Salary')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('salary')
export class SalaryController {
  constructor(private salaryService: SalaryService) {}
}
