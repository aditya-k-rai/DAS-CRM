import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// The 3 built-in salary config templates (blank components — HR fills them in)
export const SALARY_TEMPLATES = {
  indian_standard: {
    name: 'Indian Standard Payroll',
    description:
      'Standard Indian payroll with Basic, HRA, DA, and statutory deductions (PF, PT). All values are editable.',
    workingDaysPerMonth: 26,
    overtimeRatePerHour: 0,
    includeLeaveDeduction: true,
    components: [
      // EARNINGS
      {
        id: 'basic',
        name: 'Basic Salary',
        type: 'EARNING',
        calcType: 'percentage',
        value: 40,
        on: 'ctc',
        isMandatory: true,
        description: '40% of CTC',
      },
      {
        id: 'hra',
        name: 'HRA',
        type: 'EARNING',
        calcType: 'percentage',
        value: 20,
        on: 'ctc',
        isMandatory: false,
        description: '20% of CTC',
      },
      {
        id: 'da',
        name: 'Dearness Allowance',
        type: 'EARNING',
        calcType: 'percentage',
        value: 10,
        on: 'basic',
        isMandatory: false,
        description: '10% of Basic',
      },
      {
        id: 'travel',
        name: 'Travel Allowance',
        type: 'EARNING',
        calcType: 'fixed',
        value: 1600,
        on: null,
        isMandatory: false,
        description: 'Fixed per month',
      },
      {
        id: 'medical',
        name: 'Medical Allowance',
        type: 'EARNING',
        calcType: 'fixed',
        value: 1250,
        on: null,
        isMandatory: false,
        description: 'Fixed per month',
      },
      {
        id: 'special',
        name: 'Special Allowance',
        type: 'EARNING',
        calcType: 'formula',
        value: 0,
        on: 'remainder',
        isMandatory: false,
        description: 'CTC minus all other components',
      },
      // DEDUCTIONS
      {
        id: 'pf_employee',
        name: 'PF (Employee)',
        type: 'DEDUCTION',
        calcType: 'percentage',
        value: 12,
        on: 'basic',
        isMandatory: true,
        description: '12% of Basic (max ₹1,800)',
      },
      {
        id: 'pf_employer',
        name: 'PF (Employer)',
        type: 'EARNING',
        calcType: 'percentage',
        value: 12,
        on: 'basic',
        isMandatory: false,
        description: 'Employer contribution',
      },
      {
        id: 'esi',
        name: 'ESI',
        type: 'DEDUCTION',
        calcType: 'percentage',
        value: 0.75,
        on: 'gross',
        isMandatory: false,
        description: '0.75% of Gross (if gross < ₹21,000)',
      },
      {
        id: 'pt',
        name: 'Professional Tax',
        type: 'DEDUCTION',
        calcType: 'fixed',
        value: 200,
        on: null,
        isMandatory: false,
        description: 'State-wise slab (default ₹200)',
      },
      {
        id: 'tds',
        name: 'TDS',
        type: 'DEDUCTION',
        calcType: 'fixed',
        value: 0,
        on: null,
        isMandatory: false,
        description: 'As per income tax slab',
      },
    ],
  },

  fixed_ctc: {
    name: 'Fixed CTC',
    description:
      'Simple fixed monthly CTC breakdown. Enter the CTC and split into components. All editable.',
    workingDaysPerMonth: 26,
    overtimeRatePerHour: 0,
    includeLeaveDeduction: true,
    components: [
      {
        id: 'basic',
        name: 'Basic Salary',
        type: 'EARNING',
        calcType: 'percentage',
        value: 50,
        on: 'ctc',
        isMandatory: true,
        description: '50% of Monthly CTC',
      },
      {
        id: 'hra',
        name: 'HRA',
        type: 'EARNING',
        calcType: 'percentage',
        value: 25,
        on: 'ctc',
        isMandatory: false,
        description: '25% of Monthly CTC',
      },
      {
        id: 'special',
        name: 'Special Allowance',
        type: 'EARNING',
        calcType: 'percentage',
        value: 25,
        on: 'ctc',
        isMandatory: false,
        description: '25% of Monthly CTC',
      },
      {
        id: 'pf_employee',
        name: 'PF (Employee)',
        type: 'DEDUCTION',
        calcType: 'fixed',
        value: 1800,
        on: null,
        isMandatory: false,
        description: 'Fixed ₹1,800/month',
      },
      {
        id: 'pt',
        name: 'Professional Tax',
        type: 'DEDUCTION',
        calcType: 'fixed',
        value: 200,
        on: null,
        isMandatory: false,
        description: 'Fixed ₹200/month',
      },
    ],
  },

  commission_based: {
    name: 'Commission-Based',
    description:
      'Base salary + commission on deal value. Ideal for sales roles. All editable.',
    workingDaysPerMonth: 26,
    overtimeRatePerHour: 0,
    includeLeaveDeduction: true,
    components: [
      {
        id: 'base',
        name: 'Base Salary',
        type: 'EARNING',
        calcType: 'fixed',
        value: 0,
        on: null,
        isMandatory: true,
        description: 'Fixed monthly base',
      },
      {
        id: 'commission',
        name: 'Commission',
        type: 'EARNING',
        calcType: 'formula',
        value: 0,
        on: 'deal_value',
        isMandatory: false,
        description:
          '% of total deal value closed this month (set rate in commission_rate field)',
      },
      {
        id: 'commission_rate',
        name: 'Commission Rate (%)',
        type: 'EARNING',
        calcType: 'percentage',
        value: 5,
        on: 'deal_value',
        isMandatory: false,
        description: '5% of deal value (editable)',
      },
      {
        id: 'performance_bonus',
        name: 'Performance Bonus',
        type: 'EARNING',
        calcType: 'fixed',
        value: 0,
        on: null,
        isMandatory: false,
        description: 'Manual monthly performance bonus',
      },
      {
        id: 'pf_employee',
        name: 'PF (Employee)',
        type: 'DEDUCTION',
        calcType: 'percentage',
        value: 12,
        on: 'base',
        isMandatory: false,
        description: '12% of Base',
      },
      {
        id: 'pt',
        name: 'Professional Tax',
        type: 'DEDUCTION',
        calcType: 'fixed',
        value: 200,
        on: null,
        isMandatory: false,
        description: '₹200/month',
      },
    ],
  },
};

@Injectable()
export class SalaryService {
  constructor(private prisma: PrismaService) {}

  getTemplates() {
    return Object.entries(SALARY_TEMPLATES).map(([key, t]) => ({
      key,
      name: t.name,
      description: t.description,
      componentCount: t.components.length,
      components: t.components,
    }));
  }

  async getConfigs(organizationId: string) {
    return this.prisma.salaryConfig.findMany({
      where: { organizationId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async createConfig(organizationId: string, dto: any) {
    // If creating from template, copy template components
    let components = dto.components ?? [];
    if (dto.fromTemplateKey && SALARY_TEMPLATES[dto.fromTemplateKey]) {
      const tmpl = SALARY_TEMPLATES[dto.fromTemplateKey];
      components = tmpl.components;
    }

    const config = await this.prisma.salaryConfig.create({
      data: {
        organizationId,
        name: dto.name,
        description: dto.description,
        templateKey: dto.fromTemplateKey ?? null,
        components,
        workingDaysPerMonth: dto.workingDaysPerMonth ?? 26,
        overtimeRatePerHour: dto.overtimeRatePerHour ?? 0,
        includeLeaveDeduction: dto.includeLeaveDeduction ?? true,
        isDefault: dto.isDefault ?? false,
      },
    });
    return config;
  }

  async updateConfig(organizationId: string, id: string, dto: any) {
    const config = await this.prisma.salaryConfig.findFirst({
      where: { id, organizationId },
    });
    if (!config) throw new NotFoundException('Salary config not found');
    return this.prisma.salaryConfig.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.components && { components: dto.components }),
        ...(dto.workingDaysPerMonth && {
          workingDaysPerMonth: dto.workingDaysPerMonth,
        }),
        ...(dto.overtimeRatePerHour !== undefined && {
          overtimeRatePerHour: dto.overtimeRatePerHour,
        }),
        ...(dto.includeLeaveDeduction !== undefined && {
          includeLeaveDeduction: dto.includeLeaveDeduction,
        }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
      },
    });
  }

  async generatePayroll(
    organizationId: string,
    month: number,
    year: number,
    userIds?: string[],
  ) {
    // Fetch all active employees with profiles + config
    const profiles = await this.prisma.employeeProfile.findMany({
      where: {
        organizationId,
        user: { isActive: true, ...(userIds ? { id: { in: userIds } } : {}) },
      },
      include: {
        user: true,
        salaryConfig: true,
      },
    });

    const results: any[] = [];

    for (const profile of profiles) {
      if (!profile.salaryConfig) continue;

      // Get attendance for this month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const attendance = await this.prisma.employeeAttendance.findMany({
        where: {
          organizationId,
          userId: profile.userId,
          date: { gte: startDate, lte: endDate },
        },
      });

      const presentDays = attendance.filter((a) =>
        ['PRESENT', 'WORK_FROM_HOME', 'LATE'].includes(a.status),
      ).length;
      const halfDays = attendance.filter((a) => a.status === 'HALF_DAY').length;
      const leaveDays = attendance.filter(
        (a) => a.status === 'ON_LEAVE',
      ).length;
      const workingDays = profile.salaryConfig.workingDaysPerMonth;
      const effectiveDays = presentDays + halfDays * 0.5 + leaveDays;

      const baseSalary = Number(profile.baseSalary);
      const components = profile.salaryConfig.components as any[];

      // Calculate earnings and deductions
      const earnings: any[] = [];
      const deductions: any[] = [];
      let totalEarnings = 0;
      let totalDeductions = 0;

      for (const comp of components) {
        let amount = 0;
        if (comp.calcType === 'fixed') {
          amount = comp.value;
        } else if (comp.calcType === 'percentage') {
          const base =
            comp.on === 'ctc'
              ? baseSalary
              : comp.on === 'basic'
                ? (earnings.find((e) => e.id === 'basic')?.amount ??
                  baseSalary * 0.4)
                : comp.on === 'gross'
                  ? totalEarnings
                  : baseSalary;
          amount = (base * comp.value) / 100;
        }

        // Pro-rate for attendance if leave deduction enabled
        if (profile.salaryConfig.includeLeaveDeduction) {
          amount = (amount / workingDays) * effectiveDays;
        }

        amount = Math.round(amount * 100) / 100;

        if (comp.type === 'EARNING') {
          earnings.push({ ...comp, amount });
          totalEarnings += amount;
        } else {
          deductions.push({ ...comp, amount });
          totalDeductions += amount;
        }
      }

      const grossSalary = totalEarnings;
      const netSalary = grossSalary - totalDeductions;

      // Upsert salary record
      const record = await this.prisma.salaryRecord.upsert({
        where: {
          organizationId_userId_month_year: {
            organizationId,
            userId: profile.userId,
            month,
            year,
          },
        },
        create: {
          organizationId,
          userId: profile.userId,
          profileId: profile.id,
          configId: profile.salaryConfigId!,
          month,
          year,
          baseSalary,
          earnings,
          deductions,
          grossSalary,
          netSalary,
          presentDays,
          absentDays: workingDays - effectiveDays,
          leaveDays,
          status: 'GENERATED',
        },
        update: {
          earnings,
          deductions,
          grossSalary,
          netSalary,
          presentDays,
          leaveDays,
          status: 'GENERATED',
          updatedAt: new Date(),
        },
      });

      results.push(record);
    }

    return { generated: results.length, records: results };
  }

  async getRecords(organizationId: string, month?: number, year?: number) {
    return this.prisma.salaryRecord.findMany({
      where: {
        organizationId,
        ...(month && { month }),
        ...(year && { year }),
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        config: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyRecords(userId: string) {
    return this.prisma.salaryRecord.findMany({
      where: { userId },
      include: { config: { select: { name: true } } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async approveRecord(
    organizationId: string,
    id: string,
    approvedById: string,
  ) {
    const record = await this.prisma.salaryRecord.findFirst({
      where: { id, organizationId },
    });
    if (!record) throw new NotFoundException('Salary record not found');
    return this.prisma.salaryRecord.update({
      where: { id },
      data: { status: 'APPROVED', approvedById, approvedAt: new Date() },
    });
  }

  async markPaid(organizationId: string, id: string) {
    const record = await this.prisma.salaryRecord.findFirst({
      where: { id, organizationId },
    });
    if (!record) throw new NotFoundException('Salary record not found');
    return this.prisma.salaryRecord.update({
      where: { id },
      data: { status: 'PAID', paidAt: new Date() },
    });
  }
}
