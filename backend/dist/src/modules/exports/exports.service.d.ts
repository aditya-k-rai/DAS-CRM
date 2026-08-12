import { PrismaService } from '../../prisma/prisma.service';
export declare class ExportsService {
    private prisma;
    constructor(prisma: PrismaService);
    exportLeadsCSV(organizationId: string): Promise<string>;
    exportAttendanceCSV(organizationId: string): Promise<string>;
    exportPayrollCSV(organizationId: string, monthNum: number): Promise<string>;
}
