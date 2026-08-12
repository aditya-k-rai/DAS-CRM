import { PrismaService } from '../../prisma/prisma.service';
export declare const SALARY_TEMPLATES: {
    indian_standard: {
        name: string;
        description: string;
        workingDaysPerMonth: number;
        overtimeRatePerHour: number;
        includeLeaveDeduction: boolean;
        components: ({
            id: string;
            name: string;
            type: string;
            calcType: string;
            value: number;
            on: string;
            isMandatory: boolean;
            description: string;
        } | {
            id: string;
            name: string;
            type: string;
            calcType: string;
            value: number;
            on: null;
            isMandatory: boolean;
            description: string;
        })[];
    };
    fixed_ctc: {
        name: string;
        description: string;
        workingDaysPerMonth: number;
        overtimeRatePerHour: number;
        includeLeaveDeduction: boolean;
        components: ({
            id: string;
            name: string;
            type: string;
            calcType: string;
            value: number;
            on: string;
            isMandatory: boolean;
            description: string;
        } | {
            id: string;
            name: string;
            type: string;
            calcType: string;
            value: number;
            on: null;
            isMandatory: boolean;
            description: string;
        })[];
    };
    commission_based: {
        name: string;
        description: string;
        workingDaysPerMonth: number;
        overtimeRatePerHour: number;
        includeLeaveDeduction: boolean;
        components: ({
            id: string;
            name: string;
            type: string;
            calcType: string;
            value: number;
            on: null;
            isMandatory: boolean;
            description: string;
        } | {
            id: string;
            name: string;
            type: string;
            calcType: string;
            value: number;
            on: string;
            isMandatory: boolean;
            description: string;
        })[];
    };
};
export declare class SalaryService {
    private prisma;
    constructor(prisma: PrismaService);
    getTemplates(): {
        key: string;
        name: string;
        description: string;
        componentCount: number;
        components: ({
            id: string;
            name: string;
            type: string;
            calcType: string;
            value: number;
            on: string;
            isMandatory: boolean;
            description: string;
        } | {
            id: string;
            name: string;
            type: string;
            calcType: string;
            value: number;
            on: null;
            isMandatory: boolean;
            description: string;
        })[] | ({
            id: string;
            name: string;
            type: string;
            calcType: string;
            value: number;
            on: string;
            isMandatory: boolean;
            description: string;
        } | {
            id: string;
            name: string;
            type: string;
            calcType: string;
            value: number;
            on: null;
            isMandatory: boolean;
            description: string;
        })[] | ({
            id: string;
            name: string;
            type: string;
            calcType: string;
            value: number;
            on: null;
            isMandatory: boolean;
            description: string;
        } | {
            id: string;
            name: string;
            type: string;
            calcType: string;
            value: number;
            on: string;
            isMandatory: boolean;
            description: string;
        })[];
    }[];
    getConfigs(organizationId: string): Promise<{
        organizationId: string;
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        description: string | null;
        isTemplate: boolean;
        templateKey: string | null;
        isDefault: boolean;
        components: import("@prisma/client/runtime/library").JsonValue;
        workingDaysPerMonth: number;
        overtimeRatePerHour: import("@prisma/client/runtime/library").Decimal;
        includeLeaveDeduction: boolean;
    }[]>;
    createConfig(organizationId: string, dto: any): Promise<{
        organizationId: string;
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        description: string | null;
        isTemplate: boolean;
        templateKey: string | null;
        isDefault: boolean;
        components: import("@prisma/client/runtime/library").JsonValue;
        workingDaysPerMonth: number;
        overtimeRatePerHour: import("@prisma/client/runtime/library").Decimal;
        includeLeaveDeduction: boolean;
    }>;
    updateConfig(organizationId: string, id: string, dto: any): Promise<{
        organizationId: string;
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        description: string | null;
        isTemplate: boolean;
        templateKey: string | null;
        isDefault: boolean;
        components: import("@prisma/client/runtime/library").JsonValue;
        workingDaysPerMonth: number;
        overtimeRatePerHour: import("@prisma/client/runtime/library").Decimal;
        includeLeaveDeduction: boolean;
    }>;
    generatePayroll(organizationId: string, month: number, year: number, userIds?: string[]): Promise<{
        generated: number;
        records: any[];
    }>;
    getRecords(organizationId: string, month?: number, year?: number): Promise<({
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        config: {
            name: string;
        };
    } & {
        organizationId: string;
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        status: import("@prisma/client").$Enums.SalaryRecordStatus;
        profileId: string;
        configId: string;
        month: number;
        year: number;
        baseSalary: import("@prisma/client/runtime/library").Decimal;
        earnings: import("@prisma/client/runtime/library").JsonValue;
        deductions: import("@prisma/client/runtime/library").JsonValue;
        grossSalary: import("@prisma/client/runtime/library").Decimal;
        netSalary: import("@prisma/client/runtime/library").Decimal;
        presentDays: number;
        absentDays: number;
        leaveDays: number;
        overtimeHours: import("@prisma/client/runtime/library").Decimal;
        approvedById: string | null;
        approvedAt: Date | null;
        paidAt: Date | null;
        payslipUrl: string | null;
    })[]>;
    getMyRecords(userId: string): Promise<({
        config: {
            name: string;
        };
    } & {
        organizationId: string;
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        status: import("@prisma/client").$Enums.SalaryRecordStatus;
        profileId: string;
        configId: string;
        month: number;
        year: number;
        baseSalary: import("@prisma/client/runtime/library").Decimal;
        earnings: import("@prisma/client/runtime/library").JsonValue;
        deductions: import("@prisma/client/runtime/library").JsonValue;
        grossSalary: import("@prisma/client/runtime/library").Decimal;
        netSalary: import("@prisma/client/runtime/library").Decimal;
        presentDays: number;
        absentDays: number;
        leaveDays: number;
        overtimeHours: import("@prisma/client/runtime/library").Decimal;
        approvedById: string | null;
        approvedAt: Date | null;
        paidAt: Date | null;
        payslipUrl: string | null;
    })[]>;
    approveRecord(organizationId: string, id: string, approvedById: string): Promise<{
        organizationId: string;
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        status: import("@prisma/client").$Enums.SalaryRecordStatus;
        profileId: string;
        configId: string;
        month: number;
        year: number;
        baseSalary: import("@prisma/client/runtime/library").Decimal;
        earnings: import("@prisma/client/runtime/library").JsonValue;
        deductions: import("@prisma/client/runtime/library").JsonValue;
        grossSalary: import("@prisma/client/runtime/library").Decimal;
        netSalary: import("@prisma/client/runtime/library").Decimal;
        presentDays: number;
        absentDays: number;
        leaveDays: number;
        overtimeHours: import("@prisma/client/runtime/library").Decimal;
        approvedById: string | null;
        approvedAt: Date | null;
        paidAt: Date | null;
        payslipUrl: string | null;
    }>;
    markPaid(organizationId: string, id: string): Promise<{
        organizationId: string;
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        status: import("@prisma/client").$Enums.SalaryRecordStatus;
        profileId: string;
        configId: string;
        month: number;
        year: number;
        baseSalary: import("@prisma/client/runtime/library").Decimal;
        earnings: import("@prisma/client/runtime/library").JsonValue;
        deductions: import("@prisma/client/runtime/library").JsonValue;
        grossSalary: import("@prisma/client/runtime/library").Decimal;
        netSalary: import("@prisma/client/runtime/library").Decimal;
        presentDays: number;
        absentDays: number;
        leaveDays: number;
        overtimeHours: import("@prisma/client/runtime/library").Decimal;
        approvedById: string | null;
        approvedAt: Date | null;
        paidAt: Date | null;
        payslipUrl: string | null;
    }>;
}
