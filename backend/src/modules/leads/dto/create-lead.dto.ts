import { IsString, IsOptional, IsEmail, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeadDto {
  @IsString()
  firstName: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  lastName?: string;

  @ApiPropertyOptional() @IsOptional() @IsEmail()
  email?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  phone?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  statusId?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  ownerId?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  sourceId?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  companyId?: string;

  @ApiPropertyOptional() @IsOptional() @IsObject()
  customFields?: Record<string, any>;

  @ApiPropertyOptional() @IsOptional()
  tags?: string[];

  @ApiPropertyOptional() @IsOptional() @IsString()
  notes?: string;
}
