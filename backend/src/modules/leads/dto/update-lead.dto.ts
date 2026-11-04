import { IsOptional, IsString, IsEmail, IsObject, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLeadDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() statusId?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsString() assignedRep?: string;
  @IsOptional() @IsString() assignedToId?: string;
  @IsOptional() @IsString() sourceId?: string;
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() company?: string;
  @IsOptional() @IsString() value?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() budget?: string;
  @IsOptional() @IsString() requirement?: string;
  @IsOptional() @IsString() callSyncStatus?: string;
  @IsOptional() @IsObject() customFields?: Record<string, any>;
  @IsOptional() tags?: string[];
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() note?: string;

  // ─── Dual Mobile & Web Compatibility Fields (Decision F1) ───
  @ApiPropertyOptional() @IsOptional() @IsString() stage?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() companyName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() source?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() priority?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() estimatedValue?: number;

  // ─── Client Sync & Telemetry Metadata (Whitelisted to avoid 400 Bad Request) ───
  @IsOptional() _synced?: boolean;
  @IsOptional() _isOfflineDraft?: boolean;
  @IsOptional() _updatedAt?: number;
  @IsOptional() _hasConflict?: boolean;
  @IsOptional() id?: string;
}
