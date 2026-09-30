import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordWithKeyDto {
  @ApiProperty({ example: 'user@company.com', description: 'Registered email address of the user' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'ADOR-EC-7187', description: 'Assigned Company Registration Key or Staff Key' })
  @IsString()
  companyKey: string;

  @ApiProperty({ example: 'NewSecret@123', minLength: 6, description: 'New account password' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
