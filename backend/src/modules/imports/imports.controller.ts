import {
  Controller,
  Post,
  Body,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import {
  ImportsService,
  type ImportLeadRow,
  type ProductionSyncConfig,
  type SupportedImportFormat,
} from './imports.service';

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
   * Universal Multi-Format Endpoint for CSV, XLSX, XLS, TSV, TXT, JSON, XML (POST)
   */
  @Post('multi-format')
  async parseMultiFormat(
    @Body() body: {
      fileContent: string;
      format?: SupportedImportFormat;
      headerRowIndex?: number;
      columnMapping?: Record<string, string>;
    },
    @Res() res: Response,
  ) {
    const result = await this.importsService.parseMultiFormatFile(
      body.fileContent || '',
      body.format || 'CSV',
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
   * Automatic Google Sheet Layout Analyzer Endpoint (POST)
   */
  @Post('google-sheets/analyze')
  async analyzeGoogleSheet(@Body() body: { sheetUrl: string }, @Res() res: Response) {
    const result = await this.importsService.analyzeGoogleSheet(body.sheetUrl || '');
    return res.status(HttpStatus.OK).json(result);
  }

  /**
   * Sync Google Sheets Live URL with Multi-Tab Selector (POST)
   */
  @Post('google-sheets')
  async syncGoogleSheets(
    @Body() body: {
      sheetUrl: string;
      selectedSheets?: string[];
      headerRowIndex?: number;
      config?: Partial<ProductionSyncConfig>;
    },
    @Res() res: Response,
  ) {
    const result = await this.importsService.syncGoogleSheets(
      body.sheetUrl || '',
      body.selectedSheets || ['Sheet1 - Web Leads', 'Sheet2 - Cold Outreach'],
      body.headerRowIndex ?? 0,
      body.config,
    );
    return res.status(HttpStatus.OK).json(result);
  }
}
