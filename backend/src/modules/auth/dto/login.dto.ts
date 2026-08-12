import { IsEmail, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'john@acme.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongP@ssword1' })
  @IsString()
  password: string;

  @ApiPropertyOptional({ example: 'ACME-KX-7421', description: 'Company or User registration key' })
  @IsOptional()
  @IsString()
  key?: string;

  @ApiPropertyOptional({ example: 'org_123', description: 'Selected company workspace ID' })
  @IsOptional()
  @IsString()
  organizationId?: string;
}
