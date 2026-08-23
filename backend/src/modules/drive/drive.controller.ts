import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DriveService } from './drive.service';

@Controller('drive')
export class DriveController {
  constructor(private readonly driveService: DriveService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded in form-data');
    }
    const trackingId = `up_${Date.now()}`;
    const result = await this.driveService.uploadFileWithProgress(
      file.buffer,
      file.originalname,
      file.mimetype,
      trackingId
    );
    return {
      success: true,
      message: 'File stored in Google Drive folder',
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
