import { PrismaService } from '../../prisma/prisma.service';
export declare class TeamsService {
    private prisma;
    constructor(prisma: PrismaService);
    createTeamLeader(organizationId: string, currentUserRole: string, data: {
        name: string;
        email: string;
        managerId: string;
    }): Promise<{
        id: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
    }>;
    assignEmployeeHierarchy(organizationId: string, currentUserRole: string, dto: {
        employeeId: string;
        managerId?: string;
        teamLeaderId?: string;
    }): Promise<{
        success: boolean;
        message: string;
        hierarchy: {
            employeeId: string;
            managerId: string | null;
            teamLeaderId: string | null;
        };
    }>;
    getHierarchy(organizationId: string): Promise<{
        organizationId: string;
        totalUsers: number;
        users: {
            role: {
                id: string;
                organizationId: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                isSystem: boolean;
                recordScope: import("@prisma/client").$Enums.RecordScope;
            } | null;
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        }[];
    }>;
}
