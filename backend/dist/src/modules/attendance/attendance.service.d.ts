import { PrismaService } from '../../prisma/prisma.service';
export declare class AttendanceService {
    private prisma;
    constructor(prisma: PrismaService);
    checkIn(organizationId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        organizationId: string;
        userId: string;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        workingHours: import("@prisma/client/runtime/library").Decimal;
        status: import("@prisma/client").$Enums.AttendanceStatus;
        isManualEntry: boolean;
        markedById: string | null;
    }>;
    checkOut(organizationId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        organizationId: string;
        userId: string;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        workingHours: import("@prisma/client/runtime/library").Decimal;
        status: import("@prisma/client").$Enums.AttendanceStatus;
        isManualEntry: boolean;
        markedById: string | null;
    }>;
    getMyAttendance(userId: string, month?: number, year?: number): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        organizationId: string;
        userId: string;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        workingHours: import("@prisma/client/runtime/library").Decimal;
        status: import("@prisma/client").$Enums.AttendanceStatus;
        isManualEntry: boolean;
        markedById: string | null;
    }[]>;
    getTeamAttendance(organizationId: string, teamLeaderId: string, month?: number, year?: number): Promise<{
        members: {
            id: string;
            firstName: string;
            lastName: string;
        }[];
        attendance: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            organizationId: string;
            userId: string;
            date: Date;
            checkIn: Date | null;
            checkOut: Date | null;
            workingHours: import("@prisma/client/runtime/library").Decimal;
            status: import("@prisma/client").$Enums.AttendanceStatus;
            isManualEntry: boolean;
            markedById: string | null;
        })[];
    }>;
    getAllAttendance(organizationId: string, month?: number, year?: number, userId?: string): Promise<({
        user: {
            id: string;
            firstName: string;
            lastName: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        organizationId: string;
        userId: string;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        workingHours: import("@prisma/client/runtime/library").Decimal;
        status: import("@prisma/client").$Enums.AttendanceStatus;
        isManualEntry: boolean;
        markedById: string | null;
    })[]>;
    manualMark(organizationId: string, markedById: string, dto: {
        userId: string;
        date: Date;
        status: string;
        checkIn?: Date;
        checkOut?: Date;
        notes?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        organizationId: string;
        userId: string;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        workingHours: import("@prisma/client/runtime/library").Decimal;
        status: import("@prisma/client").$Enums.AttendanceStatus;
        isManualEntry: boolean;
        markedById: string | null;
    }>;
    getSummary(organizationId: string, userId: string, month: number, year: number): Promise<{
        present: number;
        absent: number;
        halfDay: number;
        onLeave: number;
        workFromHome: number;
        holiday: number;
        late: number;
        totalWorkingHours: number;
        records: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            organizationId: string;
            userId: string;
            date: Date;
            checkIn: Date | null;
            checkOut: Date | null;
            workingHours: import("@prisma/client/runtime/library").Decimal;
            status: import("@prisma/client").$Enums.AttendanceStatus;
            isManualEntry: boolean;
            markedById: string | null;
        }[];
    }>;
    toggleSelfCheckIn(organizationId: string, userId: string, enabled: boolean): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        userId: string;
        employeeCode: string;
        department: string | null;
        designation: string | null;
        dateOfJoining: Date;
        baseSalary: import("@prisma/client/runtime/library").Decimal;
        salaryConfigId: string | null;
        canSelfCheckIn: boolean;
        bankAccountNo: string | null;
        bankName: string | null;
        ifscCode: string | null;
        panNumber: string | null;
        uanNumber: string | null;
        emergencyContact: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
