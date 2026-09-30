import { IsOptional, IsString, IsEmail, IsObject, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLeadDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() statusId?: string;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsString() sourceId?: string;
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsObject() customFields?: Record<string, any>;
  @IsOptional() tags?: string[];
  @IsOptional() @IsString() notes?: string;

  // ─── Dual Mobile & Web Compatibility Fields (Decision F1) ───
  @ApiPropertyOptional() @IsOptional() @IsString() stage?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() companyName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() source?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() priority?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() estimatedValue?: number;
}
