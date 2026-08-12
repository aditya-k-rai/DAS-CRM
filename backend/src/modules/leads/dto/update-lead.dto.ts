import { IsOptional, IsString, IsEmail, IsObject } from 'class-validator';

export class UpdateLeadDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsString() sourceId?: string;
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsObject() customFields?: Record<string, any>;
  @IsOptional() tags?: string[];
  @IsOptional() @IsString() notes?: string;
}
