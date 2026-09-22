import { Controller, Get, Post, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DataRetentionService } from './data-retention.service';

@ApiTags('Data Retention & Compliance')
@Controller('data-retention')
export class DataRetentionController {
  constructor(private readonly dataRetentionService: DataRetentionService) {}

  @Get('status')
  @ApiOperation({
    summary: 'Get 6-Month Data Retention Policy Status & Compliance Telemetry',
    description:
      'Returns the automated 180-day retention rules, pending counts, and protected Verified Employee Documents status.',
  })
  @ApiResponse({ status: 200, description: 'Retention policy status returned successfully.' })
  async getStatus(@Query('organizationId') organizationId?: string) {
    const data = await this.dataRetentionService.getRetentionPolicyStatus(organizationId);
    return {
      success: true,
      data,
    };
  }

  @Post('purge-now')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Trigger On-Demand 6-Month Company History Auto-Purge',
    description:
      'Immediately executes the 180-day purge cycle for company history while strictly safeguarding Verified Employee Documents and KYC.',
  })
  @ApiResponse({ status: 200, description: 'Data retention purge executed successfully.' })
  async purgeNow(
    @Body('organizationId') organizationId?: string,
    @Query('organizationId') queryOrgId?: string,
  ) {
    const targetOrgId = organizationId || queryOrgId;
    const stats = await this.dataRetentionService.purgeExpiredCompanyData(targetOrgId);
    return {
      success: true,
      message: `6-Month company data purge completed. Purged ${stats.totalRecordsPurged} expired records. Preserved ${stats.protectedEmployeeDocsCount} Verified Employee Documents.`,
      data: stats,
    };
  }
}
