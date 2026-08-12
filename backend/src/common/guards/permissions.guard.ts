import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const PERMISSIONS_KEY = 'permissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('Not authenticated');

    // OWNER has all permissions
    if (user.role?.name === 'OWNER') return true;

    const userPermissions: string[] =
      user.role?.permissions?.map(
        (rp: any) => `${rp.permission.resource}:${rp.permission.action}`,
      ) ?? [];

    const hasAll = requiredPermissions.every((p) =>
      userPermissions.includes(p),
    );
    if (!hasAll) throw new ForbiddenException('Insufficient permissions');

    return true;
  }
}
