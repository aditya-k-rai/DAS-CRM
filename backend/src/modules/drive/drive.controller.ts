import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Body,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DriveService } from './drive.service';

@Controller('drive')
export class DriveController {
  constructor(private readonly driveService: DriveService) {}

  @Get('status')
  getStatus() {
    return {
      success: true,
      data: this.driveService.getStatus(),
    };
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: any,
    @Body('companyName') companyName?: string,
    @Body('category') category?: any,
    @Body('customFileName') customFileName?: string,
    @Body('employeeName') employeeName?: string,
    @Body('subCategory') subCategory?: string
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded in form-data');
    }
    const trackingId = `up_${Date.now()}`;
    const result = await this.driveService.uploadFileWithProgress(
      file.buffer,
      file.originalname,
      file.mimetype || 'application/octet-stream',
      trackingId,
      companyName || 'Acme Sales Solutions',
      category || (employeeName ? 'EMPLOYEES' : 'LEADS'),
      customFileName,
      employeeName,
      subCategory
    );
    return {
      success: true,
      message: `File stored in Google Drive folder: ${result.folderPath}`,
      data: result,
    };
  }

  @Post('upload-employee-file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadEmployeeFile(
    @UploadedFile() file: any,
    @Body('employeeName') employeeName: string,
    @Body('subCategory') subCategory: string = 'Documents',
    @Body('companyName') companyName?: string,
    @Body('customFileName') customFileName?: string
  ) {
    if (!file) {
      throw new BadRequestException('File is required in form-data');
    }
    if (!employeeName) {
      throw new BadRequestException('Employee name is required');
    }
    const trackingId = `emp_${Date.now()}`;
    const result = await this.driveService.uploadFileWithProgress(
      file.buffer,
      file.originalname,
      file.mimetype || 'application/octet-stream',
      trackingId,
      companyName || 'Acme Sales Solutions',
      'EMPLOYEES',
      customFileName,
      employeeName,
      subCategory || 'Documents'
    );
    return {
      success: true,
      message: `Employee file stored in Google Drive: ${result.folderPath}`,
      data: result,
    };
  }

  @Get('progress/:id')
  getUploadProgress(@Param('id') id: string) {
    return {
      success: true,
      data: this.driveService.getProgress(id),
    };
  }

  @Get('list')
  listFiles(
    @Query('companyName') companyName?: string,
    @Query('category') category?: any,
    @Query('employeeName') employeeName?: string,
    @Query('subCategory') subCategory?: string
  ) {
    const files = this.driveService.listFiles(companyName, category, employeeName, subCategory);
    return {
      success: true,
      count: files.length,
      data: files,
    };
  }

  @Get('file/:id')
  async getFile(
    @Param('id') id: string,
    @Query('raw') raw: string,
    @Res() res: any
  ) {
    if (raw === 'true') {
      const { buffer, mimeType, fileName } = await this.driveService.getFileBuffer(id);
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      return res.send(buffer);
    }
    const meta = this.driveService.getFileMetadata(id);
    return res.json({
      success: true,
      data: meta,
    });
  }

  @Get('download/:id')
  async downloadFile(@Param('id') id: string, @Res() res: any) {
    const { buffer, mimeType, fileName } = await this.driveService.getFileBuffer(id);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(buffer);
  }

  @Delete('file/:id')
  async deleteFile(@Param('id') id: string) {
    const deleted = await this.driveService.deleteFile(id);
    return {
      success: deleted,
      message: deleted ? `File ${id} removed from Google Drive vault` : `File ${id} not found`,
    };
  }

  @Post('release-app')
  @UseInterceptors(FileInterceptor('file'))
  async releaseApp(
    @UploadedFile() file: any,
    @Body('version') version: string,
    @Body('platform') platform: 'ANDROID_APK' | 'MAC_DMG'
  ) {
    if (!file) {
      throw new BadRequestException('Binary file (.apk or .dmg) is required');
    }
    const release = await this.driveService.releaseSuperAdminApp(
      file.buffer,
      file.originalname,
      version || 'v1.4.2',
      platform || 'ANDROID_APK'
    );
    return {
      success: true,
      message: 'New app installer release stored in Google Drive',
      data: release,
    };
  }

  @Get('app-releases')
  getAppReleases() {
    return {
      success: true,
      data: this.driveService.getAppReleases(),
    };
  }
}
