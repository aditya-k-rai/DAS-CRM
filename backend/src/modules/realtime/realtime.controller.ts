import {
  Controller,
  Sse,
  Query,
  Headers,
  UnauthorizedException,
  MessageEvent,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { RealtimeService } from './realtime.service';

@ApiTags('Realtime')
@Controller('realtime')
export class RealtimeController {
  constructor(
    private readonly realtimeService: RealtimeService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  @Sse('stream')
  @ApiOperation({ summary: 'Server-Sent Events (SSE) stream for real-time CRM updates' })
  sse(
    @Query('token') queryToken?: string,
    @Headers('authorization') authHeader?: string
  ): Observable<MessageEvent> {
    const rawToken =
      queryToken ||
      (authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : null);

    if (!rawToken) {
      throw new UnauthorizedException('Authentication token is required for realtime stream.');
    }

    const jwtSecret =
      this.configService.get<string>('JWT_SECRET') ||
      '896a915cf8ba6e328e723c225d49adfc16378efdb40a1110fa3b23b3404328e0';

    let payload: any;
    try {
      payload = this.jwtService.verify(rawToken, { secret: jwtSecret });
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token for realtime stream.');
    }

    const organizationId = payload.org_id || payload.organizationId;
    const userId = payload.sub || payload.id;
    const role = payload.role || 'VIEWER';

    if (!organizationId) {
      throw new UnauthorizedException('Token does not contain valid organization context.');
    }

    return this.realtimeService.getEventStream(
      organizationId,
      userId,
      role
    ) as Observable<MessageEvent>;
  }
}
