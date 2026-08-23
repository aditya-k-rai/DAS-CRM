import { Controller, Post, Body } from '@nestjs/common';
import { EmailService, SmtpCredentialsDto, SendEmailDto } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('test-smtp')
  async testSmtp(@Body() config: SmtpCredentialsDto) {
    return this.emailService.testSmtpConnection(config);
  }

  @Post('send-campaign')
  async sendCampaign(@Body() dto: SendEmailDto) {
    const result = await this.emailService.sendEmail(dto);
    return {
      success: true,
      message: `Email campaign dispatched successfully! Accepted by ${result.acceptedCount} recipients.`,
      data: result,
    };
  }
}
