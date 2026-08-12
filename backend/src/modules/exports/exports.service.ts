import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ExportsService {
  constructor(private prisma: PrismaService) {}

  /** Exports leads to CSV formatted string */
  async exportLeadsCSV(organizationId: string): Promise<string> {
    const leads = await this.prisma.lead.findMany({
      where: {
        organizationId,
      },
      include: {
        owner: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'Lead ID',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Score',
      'Assigned Rep',
      'Created Date',
    ];
    const rows = leads.map((l) => [
      l.id,
      `"${(l.firstName || '').replace(/"/g, '""')}"`,
      `"${(l.lastName || '').replace(/"/g, '""')}"`,
      l.email || '',
      l.phone || '',
      l.score || 0,
      `"${l.owner ? `${l.owner.firstName} ${l.owner.lastName}` : 'Unassigned'}"`,
      l.createdAt.toISOString().split('T')[0],
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /** Exports HR Attendance report to CSV */
  async exportAttendanceCSV(organizationId: string): Promise<string> {
    const attendance = await this.prisma.employeeAttendance.findMany({
      where: { organizationId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { date: 'desc' },
    });

    const headers = [
      'Employee Email',
      'Employee Name',
      'Date',
      'Check In',
      'Check Out',
      'Total Hours',
      'Status',
    ];
    const rows = attendance.map((a) => [
      a.user?.email || '',
      `"${a.user?.firstName || ''} ${a.user?.lastName || ''}"`,
      a.date.toISOString().split('T')[0],
      a.checkIn ? a.checkIn.toLocaleTimeString() : '',
      a.checkOut ? a.checkOut.toLocaleTimeString() : '',
      a.workingHours || 0,
      a.status,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /** Exports Payroll Salary Records to CSV */
  async exportPayrollCSV(
    organizationId: string,
    monthNum: number,
  ): Promise<string> {
    const records = await this.prisma.salaryRecord.findMany({
      where: { organizationId, month: monthNum },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    const headers = [
      'Employee Email',
      'Employee Name',
      'Month',
      'Gross Salary',
      'Net Salary',
      'Status',
    ];
    const rows = records.map((r) => [
      r.user?.email || '',
      `"${r.user?.firstName || ''} ${r.user?.lastName || ''}"`,
      r.month,
      r.grossSalary,
      r.netSalary,
      r.status,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}
