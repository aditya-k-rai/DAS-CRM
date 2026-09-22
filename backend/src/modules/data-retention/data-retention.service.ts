import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DriveService } from '../drive/drive.service';

export interface DataRetentionStats {
  cutoffDate: string;
  activitiesPurged: number;
  notesPurged: number;
  tasksPurged: number;
  meetingsPurged: number;
  quotationsPurged: number;
  dealsPurged: number;
  leadsPurged: number;
  notificationsPurged: number;
  auditLogsPurged: number;
  automationLogsPurged: number;
  emailCampaignsPurged: number;
  importsPurged: number;
  attendanceLogsPurged: number;
  driveFilesPurged: number;
  totalRecordsPurged: number;
  protectedEmployeeDocsCount: number;
  durationMs: number;
  executedAt: string;
}

@Injectable()
export class DataRetentionService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(DataRetentionService.name);
  private timer: NodeJS.Timeout | null = null;
  private isPurging = false;
  private lastRunAt: string | null = null;
  private lastStats: DataRetentionStats | null = null;
  private nextScheduledRun: string | null = null;

  // Exact 6-month retention window: 180 days in milliseconds
  public readonly RETENTION_DAYS = 180;
  private readonly INTERVAL_MS = 24 * 60 * 60 * 1000; // Run daily

  constructor(
    private readonly prisma: PrismaService,
    private readonly driveService: DriveService,
  ) {}

  onApplicationBootstrap() {
    this.logger.log('🛡️ Initializing 6-Month Automatic Company Data Retention Service...');
    this.scheduleNextRun();

    // Initial delayed run 15 seconds after bootstrap
    setTimeout(async () => {
      try {
        this.logger.log('🛡️ Performing initial automated data retention check (6-month rule)...');
        await this.purgeExpiredCompanyData();
      } catch (err) {
        this.logger.error('Failed to run initial data retention purge:', err);
      }
    }, 15000);

    // Recurring 24-hour cycle
    this.timer = setInterval(async () => {
      try {
        this.logger.log('⏰ Executing scheduled daily 6-month company data auto-purge cycle...');
        await this.purgeExpiredCompanyData();
      } catch (err) {
        this.logger.error('Scheduled data retention purge failed:', err);
      }
    }, this.INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private scheduleNextRun() {
    this.nextScheduledRun = new Date(Date.now() + this.INTERVAL_MS).toISOString();
  }

  /**
   * Calculates the exact 6-month cutoff date (180 days ago).
   */
  getCutoffDate(): Date {
    return new Date(Date.now() - this.RETENTION_DAYS * 24 * 60 * 60 * 1000);
  }

  /**
   * Automatically purges company data and history older than 6 months (180 days).
   * STRICT EXEMPTION: Verified Employee Documents, KYC details, and Employee profiles
   * are PERMANENTLY PRESERVED and will NEVER be deleted.
   */
  async purgeExpiredCompanyData(organizationId?: string): Promise<DataRetentionStats> {
    if (this.isPurging) {
      this.logger.warn('A data retention purge is already in progress. Skipping duplicate run.');
      return this.lastStats || this.getBlankStats();
    }

    this.isPurging = true;
    const startTime = Date.now();
    const cutoffDate = this.getCutoffDate();
    this.logger.log(
      `🗑️ Starting 6-Month Company History Auto-Purge. Cutoff timestamp: ${cutoffDate.toISOString()} (180 days ago)`
    );

    const orgFilter = organizationId ? { organizationId } : {};

    try {
      // 1. Purge expired Activities (Calls, Emails, Meetings, Tasks, Status Changes, Imports older than 6 months)
      const activitiesRes = await this.prisma.activity.deleteMany({
        where: {
          ...orgFilter,
          createdAt: { lt: cutoffDate },
        },
      });

      // 2. Purge expired Notes older than 6 months
      const notesRes = await this.prisma.note.deleteMany({
        where: {
          ...orgFilter,
          createdAt: { lt: cutoffDate },
        },
      });

      // 3. Purge expired Tasks older than 6 months
      const tasksRes = await this.prisma.task.deleteMany({
        where: {
          ...orgFilter,
          createdAt: { lt: cutoffDate },
        },
      });

      // 4. Purge expired Meetings older than 6 months
      const meetingsRes = await this.prisma.meeting.deleteMany({
        where: {
          ...orgFilter,
          createdAt: { lt: cutoffDate },
        },
      });

      // 5. Purge expired Quotation line items and Quotations older than 6 months
      const expiredQuotes = await this.prisma.quotation.findMany({
        where: {
          ...orgFilter,
          createdAt: { lt: cutoffDate },
        },
        select: { id: true },
      });
      const quoteIds = expiredQuotes.map((q) => q.id);

      let quotationsCount = 0;
      if (quoteIds.length > 0) {
        await this.prisma.quotationItem.deleteMany({
          where: { quotationId: { in: quoteIds } },
        });
        const qRes = await this.prisma.quotation.deleteMany({
          where: { id: { in: quoteIds } },
        });
        quotationsCount = qRes.count;
      }

      // 6. Purge expired Deals older than 6 months
      const dealsRes = await this.prisma.deal.deleteMany({
        where: {
          ...orgFilter,
          createdAt: { lt: cutoffDate },
        },
      });

      // 7. Purge expired Lead Status History & AI Scores older than 6 months
      await this.prisma.leadStatusHistory.deleteMany({
        where: {
          changedAt: { lt: cutoffDate },
          ...(organizationId ? { lead: { organizationId } } : {}),
        },
      });

      await this.prisma.leadAIScore.deleteMany({
        where: {
          ...orgFilter,
          createdAt: { lt: cutoffDate },
        },
      });

      // 8. Purge expired Leads older than 6 months
      // Unlink any remaining non-expired meetings/notes/tasks if necessary, then delete
      const leadsRes = await this.prisma.lead.deleteMany({
        where: {
          ...orgFilter,
          createdAt: { lt: cutoffDate },
        },
      });

      // 9. Purge expired Notifications older than 6 months
      const notificationsRes = await this.prisma.notification.deleteMany({
        where: {
          ...orgFilter,
          createdAt: { lt: cutoffDate },
        },
      });

      // 10. Purge expired general Audit Logs (excluding the data retention audit trail) older than 6 months
      const auditLogsRes = await this.prisma.auditLog.deleteMany({
        where: {
          ...orgFilter,
          action: { not: 'DATA_RETENTION_PURGE' },
          createdAt: { lt: cutoffDate },
        },
      });

      // 11. Purge expired Automation execution logs older than 6 months
      const automationLogsRes = await this.prisma.automationLog.deleteMany({
        where: {
          executedAt: { lt: cutoffDate },
          ...(organizationId ? { automation: { organizationId } } : {}),
        },
      });

      // 12. Purge expired Email Campaigns older than 6 months
      const emailCampaignsRes = await this.prisma.emailCampaign.deleteMany({
        where: {
          ...orgFilter,
          createdAt: { lt: cutoffDate },
        },
      });

      // 13. Purge expired Ingestion / Import batch history older than 6 months
      const importsRes = await this.prisma.import.deleteMany({
        where: {
          ...orgFilter,
          createdAt: { lt: cutoffDate },
        },
      });

      // 14. Purge expired Attendance operational history older than 6 months
      const attendanceRes = await this.prisma.employeeAttendance.deleteMany({
        where: {
          ...orgFilter,
          createdAt: { lt: cutoffDate },
        },
      });

      // 15. Drive Storage Vault: Purge company files older than 6 months
      // STRICT RULE: All Employee Verified Documents, DP, and employee folders are preserved
      let drivePurgeRes = { purgedCount: 0, protectedEmployeeDocCount: 0, purgedFiles: [] as string[] };
      try {
        drivePurgeRes = await this.driveService.purgeExpiredCompanyFiles(cutoffDate);
      } catch (driveErr) {
        this.logger.warn('Drive service file purge warning:', driveErr);
      }

      // Count permanently preserved Employee Verified Profiles and KYC records
      const employeeProfileCount = await this.prisma.employeeProfile.count({
        where: orgFilter,
      });

      const totalProtectedDocs = employeeProfileCount + drivePurgeRes.protectedEmployeeDocCount;

      const totalPurged =
        activitiesRes.count +
        notesRes.count +
        tasksRes.count +
        meetingsRes.count +
        quotationsCount +
        dealsRes.count +
        leadsRes.count +
        notificationsRes.count +
        auditLogsRes.count +
        automationLogsRes.count +
        emailCampaignsRes.count +
        importsRes.count +
        attendanceRes.count +
        drivePurgeRes.purgedCount;

      const durationMs = Date.now() - startTime;
      const executedAt = new Date().toISOString();

      const stats: DataRetentionStats = {
        cutoffDate: cutoffDate.toISOString(),
        activitiesPurged: activitiesRes.count,
        notesPurged: notesRes.count,
        tasksPurged: tasksRes.count,
        meetingsPurged: meetingsRes.count,
        quotationsPurged: quotationsCount,
        dealsPurged: dealsRes.count,
        leadsPurged: leadsRes.count,
        notificationsPurged: notificationsRes.count,
        auditLogsPurged: auditLogsRes.count,
        automationLogsPurged: automationLogsRes.count,
        emailCampaignsPurged: emailCampaignsRes.count,
        importsPurged: importsRes.count,
        attendanceLogsPurged: attendanceRes.count,
        driveFilesPurged: drivePurgeRes.purgedCount,
        totalRecordsPurged: totalPurged,
        protectedEmployeeDocsCount: totalProtectedDocs,
        durationMs,
        executedAt,
      };

      this.lastRunAt = executedAt;
      this.lastStats = stats;
      this.scheduleNextRun();

      // Write an Audit Log for this retention purge event
      try {
        const firstOrg = await this.prisma.organization.findFirst({ select: { id: true } });
        if (firstOrg) {
          await this.prisma.auditLog.create({
            data: {
              organizationId: organizationId || firstOrg.id,
              action: 'DATA_RETENTION_PURGE',
              entity: 'SystemRetentionEngine',
              entityId: '180_DAYS_AUTO_PURGE',
              before: { cutoffDate: cutoffDate.toISOString(), retentionPolicy: '180_DAYS_COMPANY_HISTORY' },
              after: stats as any,
            },
          });
        }
      } catch (logErr) {
        this.logger.warn('Could not record retention audit log:', logErr);
      }

      this.logger.log(
        `✅ 6-Month Data Purge Complete in ${durationMs}ms. Purged ${totalPurged} expired company records. Preserved & Protected ${totalProtectedDocs} Verified Employee Documents.`
      );

      return stats;
    } finally {
      this.isPurging = false;
    }
  }

  /**
   * Returns current Data Retention Policy details, upcoming schedule, and compliance telemetry.
   */
  async getRetentionPolicyStatus(organizationId?: string) {
    const cutoffDate = this.getCutoffDate();
    const orgFilter = organizationId ? { organizationId } : {};

    // Count pending records eligible for purge (> 180 days)
    const [
      expiredLeads,
      expiredActivities,
      expiredDeals,
      expiredTasks,
      expiredMeetings,
      expiredNotes,
      expiredNotifications,
      expiredAttendance,
      protectedEmployeeProfiles,
    ] = await Promise.all([
      this.prisma.lead.count({ where: { ...orgFilter, createdAt: { lt: cutoffDate } } }),
      this.prisma.activity.count({ where: { ...orgFilter, createdAt: { lt: cutoffDate } } }),
      this.prisma.deal.count({ where: { ...orgFilter, createdAt: { lt: cutoffDate } } }),
      this.prisma.task.count({ where: { ...orgFilter, createdAt: { lt: cutoffDate } } }),
      this.prisma.meeting.count({ where: { ...orgFilter, createdAt: { lt: cutoffDate } } }),
      this.prisma.note.count({ where: { ...orgFilter, createdAt: { lt: cutoffDate } } }),
      this.prisma.notification.count({ where: { ...orgFilter, createdAt: { lt: cutoffDate } } }),
      this.prisma.employeeAttendance.count({ where: { ...orgFilter, createdAt: { lt: cutoffDate } } }),
      this.prisma.employeeProfile.count({ where: orgFilter }),
    ]);

    const driveStats = this.driveService.getStorageRetentionStats(cutoffDate);

    const totalProtectedDocs = protectedEmployeeProfiles + driveStats.protectedEmployeeDocCount;
    const totalPendingPurge =
      expiredLeads +
      expiredActivities +
      expiredDeals +
      expiredTasks +
      expiredMeetings +
      expiredNotes +
      expiredNotifications +
      expiredAttendance +
      driveStats.expiredCompanyFilesCount;

    return {
      policy: {
        policyName: '6-Month Automatic Company Data Purge Policy',
        retentionPeriodDays: this.RETENTION_DAYS,
        retentionPeriodMonths: 6,
        autoPurgeEnabled: true,
        executionSchedule: 'Daily Automated Background Cycle (Every 24 Hours)',
        cutoffDate: cutoffDate.toISOString(),
      },
      exemptionGuarantee: {
        title: 'Employees Verified Documents & KYC Exemption',
        status: 'PERMANENTLY_EXEMPT_AND_RETAINED',
        description:
          'Employee Profiles, KYC credentials (PAN, Aadhaar, UAN, Bank details), contracts, and all files stored in the Employee Drive Vault are strictly protected from deletion.',
        protectedEmployeeRecordsCount: totalProtectedDocs,
      },
      telemetry: {
        lastRunAt: this.lastRunAt,
        nextScheduledRun: this.nextScheduledRun,
        isPurging: this.isPurging,
        totalPendingPurge,
        breakdownPendingPurge: {
          leads: expiredLeads,
          activities: expiredActivities,
          deals: expiredDeals,
          tasks: expiredTasks,
          meetings: expiredMeetings,
          notes: expiredNotes,
          notifications: expiredNotifications,
          attendanceLogs: expiredAttendance,
          companyDriveFiles: driveStats.expiredCompanyFilesCount,
        },
        lastExecutionStats: this.lastStats,
      },
    };
  }

  private getBlankStats(): DataRetentionStats {
    return {
      cutoffDate: this.getCutoffDate().toISOString(),
      activitiesPurged: 0,
      notesPurged: 0,
      tasksPurged: 0,
      meetingsPurged: 0,
      quotationsPurged: 0,
      dealsPurged: 0,
      leadsPurged: 0,
      notificationsPurged: 0,
      auditLogsPurged: 0,
      automationLogsPurged: 0,
      emailCampaignsPurged: 0,
      importsPurged: 0,
      attendanceLogsPurged: 0,
      driveFilesPurged: 0,
      totalRecordsPurged: 0,
      protectedEmployeeDocsCount: 0,
      durationMs: 0,
      executedAt: new Date().toISOString(),
    };
  }
}
