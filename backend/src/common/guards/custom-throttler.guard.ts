import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // If authenticated user, track rate limit by User ID (works seamlessly across Web + Android App)
    if (req.user?.id) {
      return `user_${req.user.id}`;
    }
    // For unauthenticated requests (login, OTP), track rate limit by IP address
    const ip = req.ip || req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'anonymous_ip';
    return `ip_${ip}`;
  }
}
