import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      auth: {
        user: process.env.SMTP_USER || 'adtyamighty@gmail.com',
        pass: process.env.SMTP_PASS || '',
      },
    });
  }

  async sendSuperAdminOtp(email: string, otp: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"DAS CRM Security" <${process.env.SMTP_FROM || 'noreply@dascrm.app'}>`,
        to: email,
        subject: '🔐 DAS CRM Super Admin — One-Time Password',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
            <h2 style="color: #6366f1; margin: 0 0 16px;">DAS CRM Super Admin Authentication</h2>
            <p style="color: #374151;">Your One-Time Password (OTP) for Super Admin login:</p>
            <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #111827; background: #f9fafb; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
              ${otp}
            </div>
            <p style="color: #6b7280; font-size: 14px;">This OTP expires in <strong>${process.env.OTP_EXPIRY_MINUTES || 10} minutes</strong>. Do not share this code with anyone.</p>
            <hr style="border-color: #e5e7eb; margin: 20px 0;" />
            <p style="color: #9ca3af; font-size: 12px;">If you did not request this, your account may be under attack. Change your password immediately.</p>
          </div>`,
      });
    } catch (err) {
      console.warn('[MailService] Could not send Super Admin OTP email:', err);
    }
  }

  async sendPasswordResetOtp(email: string, otp: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"DAS CRM Security" <${process.env.SMTP_FROM || 'dynamicadvancesolution@gmail.com'}>`,
        to: email,
        subject: '🔑 DAS CRM — Password Reset OTP Code',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
            <h2 style="color: #6366f1; margin: 0 0 16px;">Password Reset Request</h2>
            <p style="color: #374151;">We received a request to reset your DAS CRM account password.</p>
            <p style="color: #374151;">Use the following 6-digit OTP code to verify your identity and set a new password:</p>
            <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #4f46e5; background: #f3f4f6; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
              ${otp}
            </div>
            <p style="color: #6b7280; font-size: 14px;">This OTP is valid for <strong>15 minutes</strong>. If you did not request a password reset, please ignore this email.</p>
            <hr style="border-color: #e5e7eb; margin: 20px 0;" />
            <p style="color: #9ca3af; font-size: 12px;">Sent automatically by DAS CRM Account Security System.</p>
          </div>`,
      });
    } catch (err) {
      console.warn('[MailService] Could not send Password Reset OTP email:', err);
    }
  }

  async sendRoleTransitionNotification(
    userEmail: string,
    userName: string,
    oldRole: string,
    newRole: string,
    expiresAt: Date,
  ): Promise<void> {
    try {
      const expiryStr = expiresAt.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
      });
      await this.transporter.sendMail({
        from: `"DAS CRM" <${process.env.SMTP_FROM || 'noreply@das_crm.app'}>`,
        to: userEmail,
        subject: '🔄 Your DAS CRM Role is Being Changed — Action Required',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
            <h2 style="color: #f59e0b;">⚠️ Role Change in Progress</h2>
            <p>Hi <strong>${userName}</strong>,</p>
            <p>Your account role in DAS CRM is being changed:</p>
            <table style="width: 100%; background: #f9fafb; border-radius: 8px; padding: 12px; margin: 12px 0;">
              <tr><td style="color: #6b7280;">Previous Role</td><td><strong style="color: #ef4444;">${oldRole}</strong></td></tr>
              <tr><td style="color: #6b7280;">New Role</td><td><strong style="color: #6366f1;">${newRole}</strong></td></tr>
            </table>
            <p>Your account is now in <strong>Read-Only mode</strong> for 24 hours. You cannot edit or export data until you accept the new role.</p>
            <p style="color: #6b7280; font-size: 13px;">Lock expires: <strong>${expiryStr} IST</strong></p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #6366f1; color: white; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Open App & Accept New Role →
            </a>
          </div>`,
      });
    } catch (err) {
      console.warn('[MailService] Could not send Role Transition email:', err);
    }
  }

  async sendRoleTransitionAdminNotification(
    adminEmail: string,
    adminName: string,
    userName: string,
    action: 'ACCEPTED' | 'REVERTED',
    newRole: string,
  ): Promise<void> {
    try {
      const emoji = action === 'ACCEPTED' ? '✅' : '↩️';
      const label =
        action === 'ACCEPTED'
          ? 'accepted their new role'
          : 'had their role reverted by Admin';
      await this.transporter.sendMail({
        from: `"DAS CRM" <${process.env.SMTP_FROM || 'noreply@das_crm.app'}>`,
        to: adminEmail,
        subject: `${emoji} Role Transition Update: ${userName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
            <h2 style="color: #111827;">${emoji} Role Transition Update</h2>
            <p>Hi <strong>${adminName}</strong>,</p>
            <p><strong>${userName}</strong> has ${label}.</p>
            <p>New active role: <strong style="color: #6366f1;">${newRole}</strong></p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/audit-logs" style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #f3f4f6; color: #111827; border-radius: 8px; text-decoration: none; font-weight: bold; border: 1px solid #d1d5db;">
              View Audit Logs →
            </a>
          </div>`,
      });
    } catch (err) {
      console.warn(
        '[MailService] Could not send Admin Role Transition email:',
        err,
      );
    }
  }

  async sendActivityExportPdf(
    toEmail: string,
    name: string,
    downloadUrl: string,
    expiresAt: Date,
    isAdmin = false,
  ): Promise<void> {
    try {
      const role = isAdmin ? 'Admin' : name;
      await this.transporter.sendMail({
        from: `"DAS CRM" <${process.env.SMTP_FROM || 'noreply@das_crm.app'}>`,
        to: toEmail,
        subject: '📄 Your Activity Log Export is Ready — DAS CRM',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
            <h2 style="color: #6366f1;">📄 Activity Export Ready</h2>
            <p>Hi <strong>${role}</strong>,</p>
            <p>The activity log export for <strong>${name}</strong>'s previous role period is ready for download.</p>
            <a href="${downloadUrl}" style="display: inline-block; margin: 16px 0; padding: 12px 24px; background: #6366f1; color: white; border-radius: 8px; text-decoration: none; font-weight: bold;">
              ⬇️ Download PDF Report
            </a>
            <p style="color: #6b7280; font-size: 12px;">This link expires on ${expiresAt.toLocaleDateString('en-IN')}. After that, it will no longer be accessible.</p>
          </div>`,
      });
    } catch (err) {
      console.warn('[MailService] Could not send Activity Export email:', err);
    }
  }

  async sendPlanUpgradeRequestNotification(
    superAdminEmail: string,
    orgName: string,
    requestedPlan: string,
    amountInr: number,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"DAS CRM Billing" <${process.env.SMTP_FROM || 'noreply@das_crm.app'}>`,
        to: superAdminEmail,
        subject: `💳 Plan Upgrade Request — ${orgName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
            <h2 style="color: #10b981;">💳 New Plan Upgrade Request</h2>
            <p>Organization: <strong>${orgName}</strong></p>
            <p>Requested Plan: <strong>${requestedPlan}</strong></p>
            <p>Payment Amount: <strong>₹${amountInr.toLocaleString('en-IN')}</strong></p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/super" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #6366f1; color: white; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Review & Approve →
            </a>
          </div>`,
      });
    } catch (err) {
      console.warn('[MailService] Could not send Plan Upgrade email:', err);
    }
  }

  async sendCompanyRegistrationEmail(opts: {
    adminEmail: string;
    adminName: string;
    companyName: string;
    key: string;
    planTier: string;
    memberLimit: number;
    validityDays: number;
  }): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"DAS CRM Registration" <${process.env.SMTP_FROM || 'noreply@dascrm.app'}>`,
        to: opts.adminEmail,
        subject: `🔑 Welcome to DAS CRM — Your Registration Key & Workspace Credentials`,
        html: `
          <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px; background: #ffffff;">
            <h2 style="color: #6366f1; margin-top: 0;">🏢 Company Workspace Registered</h2>
            <p>Dear <strong>${opts.adminName}</strong>,</p>
            <p>Your company workspace <strong>${opts.companyName}</strong> has been registered successfully in DAS CRM.</p>
            
            <div style="background: #f3f4f6; border-left: 4px solid #6366f1; padding: 16px; margin: 20px 0; border-radius: 8px;">
              <p style="margin: 4px 0; font-size: 14px; color: #374151;">🔑 <strong>Company Registration Key:</strong></p>
              <p style="font-size: 24px; font-weight: 900; color: #4f46e5; margin: 4px 0; letter-spacing: 2px;">${opts.key}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 8px 0; color: #6b7280;">Admin Email ID:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #111827;">${opts.adminEmail}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 8px 0; color: #6b7280;">Subscription Plan:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #10b981;">${opts.planTier} (${opts.memberLimit} Seats Quota)</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Key Validity:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #f59e0b;">${opts.validityDays} Days</td>
              </tr>
            </table>

            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" style="display: inline-block; margin-top: 16px; padding: 14px 28px; background: #4f46e5; color: white; border-radius: 10px; text-decoration: none; font-weight: bold; text-align: center; width: 100%; box-sizing: border-box;">
              Proceed to Workspace Login →
            </a>
          </div>`,
      });
    } catch (err) {
      console.warn('[MailService] Could not send Company Registration email:', err);
    }
  }
}
