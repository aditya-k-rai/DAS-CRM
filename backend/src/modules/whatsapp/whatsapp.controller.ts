import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { WhatsappService, WhatsAppMessagePayload } from './whatsapp.service';

@Controller('api/v1/whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  /**
   * Meta Webhook Verification Endpoint (GET)
   */
  @Get('webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const verifiedChallenge = this.whatsappService.verifyWebhook(mode, token, challenge);
    if (verifiedChallenge) {
      return res.status(HttpStatus.OK).send(verifiedChallenge);
    }
    return res.status(HttpStatus.FORBIDDEN).send('Verification token mismatch');
  }

  /**
   * Meta Webhook Payload Receiver (POST)
   */
  @Post('webhook')
  async receiveWebhook(@Body() body: any, @Res() res: Response) {
    await this.whatsappService.processInboundWebhook(body);
    return res.status(HttpStatus.OK).send('EVENT_RECEIVED');
  }

  /**
   * Dispatch Direct WhatsApp Message
   */
  @Post('send')
  async sendMessage(@Body() payload: WhatsAppMessagePayload) {
    return this.whatsappService.sendMessage(payload);
  }

  /**
   * Dispatch Bulk Broadcast Campaign
   */
  @Post('broadcast')
  async sendBroadcast(@Body() body: { templateName: string; phones: string[] }) {
    return this.whatsappService.sendBroadcast(body.templateName, body.phones || []);
  }

  /**
   * Fetch Shared Team Inbox Conversations
   */
  @Get('conversations')
  async getConversations() {
    return this.whatsappService.getConversations();
  }

  /**
   * Generate AI Reply Assistant Response
   */
  @Post('ai-reply')
  async generateAiReply(@Body() body: { prompt: string; context?: string }) {
    return this.whatsappService.generateAiReply(body.prompt, body.context);
  }
}
