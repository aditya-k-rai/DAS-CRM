import {
  Controller,
  Post,
  Body,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ImportsService, ImportLeadRow } from './imports.service';

@ApiTags('Imports')
@Controller('api/v1/imports')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  /**
   * Import CSV File / String Endpoint with Custom Header Row & Mapping (POST)
   */
  @Post('csv')
  async importCsv(
    @Body() body: { csvContent: string; headerRowIndex?: number; columnMapping?: Record<string, string> },
    @Res() res: Response,
  ) {
    const result = await this.importsService.importCsv(
      body.csvContent || '',
      body.headerRowIndex ?? 0,
      body.columnMapping,
    );
    return res.status(HttpStatus.OK).json(result);
  }

  /**
   * Import Excel Spreadsheet Data Endpoint (POST)
   */
  @Post('excel')
  async importExcel(@Body() body: { rows: ImportLeadRow[] }, @Res() res: Response) {
    const result = await this.importsService.importExcel(body.rows || []);
    return res.status(HttpStatus.OK).json(result);
  }

  /**
   * Sync Google Sheets Live URL with Multi-Tab Selector (POST)
   */
  @Post('google-sheets')
  async syncGoogleSheets(
    @Body() body: { sheetUrl: string; selectedSheets?: string[]; headerRowIndex?: number },
    @Res() res: Response,
  ) {
    const result = await this.importsService.syncGoogleSheets(
      body.sheetUrl || '',
      body.selectedSheets || ['Sheet1 - Web Leads', 'Sheet2 - Cold Outreach'],
      body.headerRowIndex ?? 0,
    );
    return res.status(HttpStatus.OK).json(result);
  }
}
