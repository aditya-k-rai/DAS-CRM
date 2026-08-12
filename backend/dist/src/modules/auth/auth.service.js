"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const bcrypt = __importStar(require("bcryptjs"));
let AuthService = class AuthService {
    prisma;
    jwt;
    config;
    constructor(prisma, jwt, config) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
    }
    async register(dto) {
        const existing = await this.prisma.user.findFirst({
            where: { email: dto.email },
        });
        if (existing)
            throw new common_1.ConflictException('Email already in use');
        const slug = dto.organizationName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
        const passwordHash = await bcrypt.hash(dto.password, 12);
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
            const ownerRole = await tx.role.create({
                data: {
                    organizationId: org.id,
                    name: 'OWNER',
                    isSystem: true,
                    recordScope: 'ALL',
                },
            });
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
    async login(dto) {
        const user = await this.prisma.user.findFirst({
            where: { email: dto.email, isActive: true },
            include: { organization: true, role: { include: { permissions: { include: { permission: true } } } } },
        });
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const valid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!valid)
            throw new common_1.UnauthorizedException('Invalid credentials');
        await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        const tokens = await this.generateTokens(user.id, user.organizationId, user.role?.name ?? 'VIEWER');
        await this.saveRefreshToken(user.id, tokens.refreshToken);
        return {
            user: this.sanitizeUser(user),
            organization: user.organization,
            ...tokens,
        };
    }
    async refreshToken(token) {
        const stored = await this.prisma.refreshToken.findUnique({ where: { token } });
        if (!stored || stored.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: stored.userId },
            include: { role: true },
        });
        if (!user || !user.isActive)
            throw new common_1.UnauthorizedException('User not found');
        await this.prisma.refreshToken.delete({ where: { token } });
        const tokens = await this.generateTokens(user.id, user.organizationId, user.role?.name ?? 'VIEWER');
        await this.saveRefreshToken(user.id, tokens.refreshToken);
        return tokens;
    }
    async logout(userId, token) {
        await this.prisma.refreshToken.deleteMany({
            where: { userId, token },
        });
    }
    async generateTokens(userId, organizationId, role) {
        const payload = { sub: userId, org_id: organizationId, role };
        const accessToken = this.jwt.sign(payload, {
            expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
        });
        const refreshToken = this.jwt.sign(payload, {
            secret: this.config.get('JWT_REFRESH_SECRET'),
            expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
        });
        return { accessToken, refreshToken };
    }
    async saveRefreshToken(userId, token) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await this.prisma.refreshToken.create({ data: { userId, token, expiresAt } });
    }
    sanitizeUser(user) {
        const { passwordHash, mfaSecret, ...safe } = user;
        return safe;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map