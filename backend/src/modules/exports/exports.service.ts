import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ExportsService {
  constructor(private prisma: PrismaService) {}

  /** Exports leads to CSV formatted string */
  async exportLeadsCSV(organizationId: string, status?: string): Promise<string> {
    const leads = await this.prisma.lead.findMany({
      where: {
        organizationId,
        ...(status && { status }),
      },
      include: {
        assignedTo: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['Lead ID', 'Name', 'Email', 'Phone', 'Company', 'Status', 'Score', 'Value (INR)', 'Assigned Rep', 'Created Date'];
    const rows = leads.map(l => [
      l.id,
      `"${l.name.replace(/"/g, '""')}"`,
      l.email || '',
      l.phone || '',
      `"${(l.company || '').replace(/"/g, '""')}"`,
      l.status,
      l.score || 0,
      l.value || 0,
      `"${l.assignedTo ? `${l.assignedTo.firstName} ${l.assignedTo.lastName}` : 'Unassigned'}"`,
      l.createdAt.toISOString().split('T')[0],
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  /** Exports HR Attendance report to CSV */
  async exportAttendanceCSV(organizationId: string, month: string): Promise<string> {
    const attendance = await this.prisma.attendanceRecord.findMany({
      where: { organizationId },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { date: 'desc' },
    });

    const headers = ['Employee Email', 'Employee Name', 'Date', 'Check In', 'Check Out', 'Total Hours', 'Status'];
    const rows = attendance.map(a => [
      a.user.email,
      `"${a.user.firstName} ${a.user.lastName}"`,
      a.date.toISOString().split('T')[0],
      a.checkIn ? a.checkIn.toLocaleTimeString() : '',
      a.checkOut ? a.checkOut.toLocaleTimeString() : '',
      a.workingHours || 0,
      a.status,
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  /** Exports Payroll Salary Records to CSV */
  async exportPayrollCSV(organizationId: string, month: string): Promise<string> {
    const records = await this.prisma.salaryRecord.findMany({
      where: { organizationId, month },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });

    const headers = ['Employee Email', 'Employee Name', 'Month', 'Gross Salary', 'Net Salary', 'Total Deductions', 'Status'];
    const rows = records.map(r => [
      r.user.email,
      `"${r.user.firstName} ${r.user.lastName}"`,
      r.month,
      r.grossSalary,
      r.netSalary,
      r.totalDeduction,
      r.status,
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}
