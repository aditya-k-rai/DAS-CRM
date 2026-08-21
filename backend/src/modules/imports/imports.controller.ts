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
   * Import CSV File / String Endpoint (POST)
   */
  @Post('csv')
  async importCsv(@Body() body: { csvContent: string }, @Res() res: Response) {
    const result = await this.importsService.importCsv(body.csvContent || '');
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
   * Sync Google Sheets Live URL Endpoint (POST)
   */
  @Post('google-sheets')
  async syncGoogleSheets(
    @Body() body: { sheetUrl: string; range?: string },
    @Res() res: Response,
  ) {
    const result = await this.importsService.syncGoogleSheets(body.sheetUrl || '', body.range);
    return res.status(HttpStatus.OK).json(result);
  }
}
