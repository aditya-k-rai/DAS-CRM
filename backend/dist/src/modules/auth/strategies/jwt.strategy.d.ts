import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
declare const JwtStrategy_base: new (...args: any) => any;
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    constructor(config: ConfigService, prisma: PrismaService);
    validate(payload: {
        sub: string;
        org_id: string;
        role: string;
    }): Promise<({
        organization: {
            id: string;
            slug: string;
            name: string;
            logoUrl: string | null;
            website: string | null;
            industry: string | null;
            templateId: string | null;
            settings: import("@prisma/client/runtime/library").JsonValue;
            createdAt: Date;
            updatedAt: Date;
        };
        role: ({
            permissions: ({
                permission: {
                    id: string;
                    description: string | null;
                    resource: string;
                    action: string;
                };
            } & {
                roleId: string;
                permissionId: string;
            })[];
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            isSystem: boolean;
            recordScope: import("@prisma/client").$Enums.RecordScope;
        }) | null;
        team: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            description: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        email: string;
        passwordHash: string;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
        roleId: string | null;
        teamId: string | null;
        isActive: boolean;
        mfaEnabled: boolean;
        mfaSecret: string | null;
        lastLoginAt: Date | null;
    }) | null>;
}
export {};
