import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; org_id?: string; role?: string }) {
    if (payload.role === 'SUPER_ADMIN') {
      const superAdmin = await this.prisma.superAdmin.findUnique({
        where: { id: payload.sub },
      });
      if (superAdmin && superAdmin.isActive) {
        return {
          id: superAdmin.id,
          email: superAdmin.email,
          name: superAdmin.name,
          role: { name: 'SUPER_ADMIN', permissions: [] },
          organizationId: 'platform_system',
          isActive: true,
        };
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
        organization: true,
        team: true,
      },
    });
    if (!user || !user.isActive) return null;
    return user;
  }
}
