import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if email already exists
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    // Generate org slug
    const slug = dto.organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Create org, subscription, owner role, and user in one transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: dto.organizationName,
          slug,
          industry: dto.industry,
          subscription: {
            create: { planTier: 'BASIC', memberLimit: 5 },
          },
        },
      });

      // Create default OWNER role
      const ownerRole = await tx.role.create({
        data: {
          organizationId: org.id,
          name: 'OWNER',
          isSystem: true,
          recordScope: 'ALL',
        },
      });

      // Create default lead statuses
      const defaultStatuses = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
      const statusColors = ['#6366f1', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#22c55e', '#ef4444'];
      await tx.leadStatus.createMany({
        data: defaultStatuses.map((name, i) => ({
          organizationId: org.id,
          name,
          color: statusColors[i],
          order: i,
          isDefault: i === 0,
          isWon: name === 'Won',
          isLost: name === 'Lost',
        })),
      });

      // Create default pipeline
      const pipeline = await tx.pipeline.create({
        data: {
          organizationId: org.id,
          name: 'Sales Pipeline',
          isDefault: true,
        },
      });

      await tx.stage.createMany({
        data: [
          { pipelineId: pipeline.id, name: 'Prospecting', order: 0, probability: 10, color: '#6366f1' },
          { pipelineId: pipeline.id, name: 'Qualification', order: 1, probability: 25, color: '#f59e0b' },
          { pipelineId: pipeline.id, name: 'Proposal', order: 2, probability: 50, color: '#3b82f6' },
          { pipelineId: pipeline.id, name: 'Negotiation', order: 3, probability: 75, color: '#8b5cf6' },
          { pipelineId: pipeline.id, name: 'Closed Won', order: 4, probability: 100, color: '#22c55e' },
        ],
      });

      // Create user
      const user = await tx.user.create({
        data: {
          organizationId: org.id,
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          roleId: ownerRole.id,
        },
      });

      return { org, user, ownerRole };
    });

    const tokens = await this.generateTokens(result.user.id, result.org.id, result.ownerRole.name);
    await this.saveRefreshToken(result.user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(result.user),
      organization: result.org,
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, isActive: true },
      include: { organization: true, role: { include: { permissions: { include: { permission: true } } } } },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    // Update last login
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const tokens = await this.generateTokens(user.id, user.organizationId, user.role?.name ?? 'VIEWER');
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      organization: user.organization,
      ...tokens,
    };
  }

  async refreshToken(token: string) {
    const stored = await this.prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: stored.userId },
      include: { role: true },
    });
    if (!user || !user.isActive) throw new UnauthorizedException('User not found');

    await this.prisma.refreshToken.delete({ where: { token } });

    const tokens = await this.generateTokens(user.id, user.organizationId, user.role?.name ?? 'VIEWER');
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string, token: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { userId, token },
    });
  }

  private async generateTokens(userId: string, organizationId: string, role: string) {
    const payload = { sub: userId, org_id: organizationId, role };

    const accessToken = this.jwt.sign(payload, {
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m') as any,
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as any,
    });

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: string, token: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.prisma.refreshToken.create({ data: { userId, token, expiresAt } });
  }

  private sanitizeUser(user: any) {
    const { passwordHash, mfaSecret, ...safe } = user;
    return safe;
  }
}
