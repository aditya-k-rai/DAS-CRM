import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleTransitionService } from './role-transition.service';

/** Decorator to BYPASS the role transition lock for specific routes */
export const SKIP_LOCK_CHECK = 'skip_lock_check';

@Injectable()
export class RoleTransitionGuard implements CanActivate {
  constructor(
    private roleTransitionService: RoleTransitionService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    // Only apply lock to write operations
    const method = req.method?.toUpperCase();
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return true;

    // Skip if explicitly bypassed (e.g. for accept/revert endpoints)
    const skip = this.reflector.get<boolean>(
      SKIP_LOCK_CHECK,
      context.getHandler(),
    );
    if (skip) return true;

    const userId = req.user?.sub;
    if (!userId) return true; // no user — let auth guard handle it

    const isLocked = await this.roleTransitionService.isUserLocked(userId);
    if (isLocked) {
      throw new HttpException(
        {
          statusCode: 423,
          error: 'Locked',
          message:
            'Your account is in Read-Only mode during a role transition. Accept your new role to continue.',
          code: 'ROLE_TRANSITION_LOCKED',
        },
        423, // 423 Locked
      );
    }

    return true;
  }
}
