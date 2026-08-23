import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export class SmtpCredentialsDto {
  host: string;
  port: number;
  secure: boolean; // true for 465, false for 587
  user: string;
  pass: string;
  fromName?: string;
}

export class SendEmailDto {
  smtp: SmtpCredentialsDto;
  to: string | string[];
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async testSmtpConnection(config: SmtpCredentialsDto): Promise<{ isConnected: boolean; message: string }> {
    try {
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: Number(config.port),
        secure: Boolean(config.secure),
        auth: {
          user: config.user,
          pass: config.pass,
        },
        timeout: 8000,
      } as nodemailer.TransportOptions);

      await transporter.verify();
      return {
        isConnected: true,
        message: `✅ SMTP Handshake Successful! Connected to ${config.host}:${config.port} as ${config.user}`,
      };
    } catch (err: any) {
      this.logger.error('SMTP Connection Failed:', err.message);
      return {
        isConnected: false,
        message: `🔴 SMTP Connection Failed: ${err.message || 'Check host, port, or App Password'}`,
      };
    }
  }

  async sendEmail(dto: SendEmailDto): Promise<{ success: boolean; messageId: string; acceptedCount: number }> {
    const { smtp, to, subject, html } = dto;

    try {
      const transporter = nodemailer.createTransport({
        host: smtp.host,
        port: Number(smtp.port),
        secure: Boolean(smtp.secure),
        auth: {
          user: smtp.user,
          pass: smtp.pass,
        },
      } as nodemailer.TransportOptions);

      const fromAddress = `"${smtp.fromName || 'DAS CRM Marketing'}" <${smtp.user}>`;
      const recipientList = Array.isArray(to) ? to.join(', ') : to;

      const info = await transporter.sendMail({
        from: fromAddress,
        to: recipientList,
        subject,
        html,
      });

      this.logger.log(`📧 Email dispatched to ${recipientList}. Message ID: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
        acceptedCount: info.accepted?.length || 1,
      };
    } catch (err: any) {
      this.logger.error('Send Mail Error:', err);
      throw new BadRequestException(`Failed to dispatch email: ${err.message}`);
    }
  }
}
