import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * OptionalJwtAuthGuard — Permissive JWT guard for DAS CRM.
 * If a valid JWT Bearer token is provided, request.user is populated.
 * If no token or a demo token is provided, it does NOT throw 401 Unauthorized;
 * instead, it sets request.user to a default fallback user.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (user && !err) {
      return user;
    }
    // Return a default fallback user so controllers can access user.organizationId
    return {
      id: 'usr_default',
      organizationId: 'org_default',
      role: { name: 'ADMIN', permissions: [] },
      isActive: true,
    };
  }
}
