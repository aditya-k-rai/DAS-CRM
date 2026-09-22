import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as PDFDocument from 'pdfkit';

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


  // ──────────────────────────────────────────────────
  // PDF Generator (pdfkit) — Registration Certificate
  // ──────────────────────────────────────────────────
  private generateRegistrationPdfBuffer(opts: {
    companyName: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
    key: string;
    planTier: string;
    memberLimit: number;
    validityDays: number;
    accountType?: string;
    pincode?: string;
    phone?: string;
    city?: string;
    state?: string;
    gstNumber?: string;
    panNumber?: string;
    panType?: string;
    companyType?: string;
    sector?: string;
    couponCode?: string;
    registeredAt: string;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new (PDFDocument as any)({ size: 'A4', margin: 40, bufferPages: true });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const PW = 595; // A4 width in points
      const INDIGO = '#6366f1';
      const AMBER  = '#f59e0b';
      const GREEN  = '#22c55e';
      const WHITE  = '#ffffff';
      const LIGHT  = '#c7d2fe';
      const MUTED  = '#94a3b8';
      const BG     = '#060720';
      const BG2    = '#0d0f2a';

      // ── Background
      doc.rect(0, 0, PW, 842).fill(BG);

      // ── Top accent bar
      doc.rect(0, 0, PW, 4).fill(INDIGO);

      // ── Header block
      doc.roundedRect(30, 12, PW - 60, 64, 8).fill(BG2);
      doc.fontSize(22).font('Helvetica-Bold').fillColor(INDIGO).text('DAS CRM', 50, 28);
      doc.fontSize(8).font('Helvetica').fillColor(LIGHT)
        .text('Company Registration Certificate — Confidential Document', 50, 50)
        .text(`Generated: ${opts.registeredAt} IST`, 50, 62);

      // Contact info right-aligned in header
      doc.fontSize(7.5).fillColor(MUTED)
        .text('support@dascrm.app', 350, 28, { width: 200, align: 'right' })
        .text('dynamicadvancesolution@gmail.com', 350, 40, { width: 200, align: 'right' })
        .text('https://dascrm.app', 350, 52, { width: 200, align: 'right' });

      // ── Certificate Title
      doc.fontSize(16).font('Helvetica-Bold').fillColor(WHITE)
        .text('Congratulations! Company Workspace Registered', 30, 90, { align: 'center', width: PW - 60 });
      doc.fontSize(8.5).font('Helvetica').fillColor(LIGHT)
        .text('Submitted for Super Admin plan verification. Activation within 24-48 hrs. Check your email for a copy.', 30, 114, { align: 'center', width: PW - 60 });

      // ── KEY BOX
      doc.roundedRect(30, 130, PW - 60, 52, 8).fill('#1c1f48').stroke(INDIGO);
      doc.fontSize(8).font('Helvetica-Bold').fillColor(LIGHT)
        .text('COMPANY REGISTRATION KEY', 30, 144, { align: 'center', width: PW - 60 });
      doc.fontSize(26).font('Helvetica-Bold').fillColor(INDIGO)
        .text(opts.key, 30, 158, { align: 'center', width: PW - 60, characterSpacing: 4 });

      // ── COMPANY DETAILS section header
      let y = 198;
      doc.roundedRect(30, y, PW - 60, 18, 4).fill('#161a3c');
      doc.fontSize(8).font('Helvetica-Bold').fillColor(INDIGO)
        .text('COMPANY & REGISTRATION DETAILS', 42, y + 5.5);
      y += 18;

      const companyRows: [string, string][] = [
        ['Company Name', opts.companyName],
        ['Company Type', opts.companyType || 'N/A'],
        ['Industry Sector', opts.sector || 'N/A'],
        ['GST Number', opts.gstNumber || 'N/A'],
        ['PAN Card', opts.panNumber ? `${opts.panNumber} (${opts.panType === 'PERSONAL' ? 'Personal' : 'Business'})` : 'N/A'],
        ['Phone Number', opts.phone || 'N/A'],
        ['Pincode', opts.pincode || 'N/A'],
        ['City', opts.city || 'N/A'],
        ['State', opts.state || 'N/A'],
        ['Subscription Plan', `${opts.planTier} — ${opts.memberLimit} User Seats`],
        ['Request Mode', opts.accountType === 'BUY_REQUEST' ? 'Buy Request (30 Days)' : 'Free Trial (15 Days)'],
        ['Key Validity', `${opts.validityDays} Days from Registration`],
        ['Coupon Applied', opts.couponCode || 'None'],
        ['Registration Date', new Date().toLocaleDateString('en-IN')],
        ['Status', 'Pending Super Admin Approval'],
      ];

      companyRows.forEach((row, i) => {
        const rowH = 16;
        doc.rect(30, y, PW - 60, rowH).fill(i % 2 === 0 ? '#12163a' : '#161b44');
        doc.fontSize(7.5).font('Helvetica').fillColor(MUTED).text(row[0], 42, y + 4.5);
        const val = row[1].length > 60 ? row[1].slice(0, 57) + '...' : row[1];
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#d7dcff')
          .text(val, 200, y + 4.5, { width: PW - 240, align: 'right' });
        y += rowH;
      });

      y += 8;

      // ── ADMIN CREDENTIALS section header
      doc.roundedRect(30, y, PW - 60, 18, 4).fill('#0f1c34');
      doc.fontSize(8).font('Helvetica-Bold').fillColor(AMBER)
        .text('ADMIN LOGIN CREDENTIALS (Keep Confidential)', 42, y + 5.5);
      y += 18;

      const credRows: [string, string][] = [
        ['Admin Full Name', opts.adminName],
        ['Admin Email (Login ID)', opts.adminEmail],
        ['Admin Password', opts.adminPassword],
      ];

      credRows.forEach((row, i) => {
        const rowH = 16;
        doc.rect(30, y, PW - 60, rowH).fill(i % 2 === 0 ? '#14102d' : '#18132d');
        // Amber left accent bar
        doc.rect(30, y, 3, rowH).fill(AMBER);
        doc.fontSize(7.5).font('Helvetica').fillColor('#b49464').text(row[0], 40, y + 4.5);
        const val = row[1].length > 60 ? row[1].slice(0, 57) + '...' : row[1];
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffe596')
          .text(val, 200, y + 4.5, { width: PW - 240, align: 'right' });
        y += rowH;
      });

      y += 10;

      // ── DAS CRM Contact box
      doc.roundedRect(30, y, PW - 60, 42, 6).fill('#0c1a2d').stroke(GREEN);
      doc.fontSize(8).font('Helvetica-Bold').fillColor(GREEN)
        .text('DAS CRM — Contact & Support', 42, y + 8);
      doc.fontSize(8).font('Helvetica').fillColor('#a0dbb4')
        .text('Email: support@dascrm.app  |  Admin: dynamicadvancesolution@gmail.com', 42, y + 22)
        .text('Website: https://dascrm.app  |  Login Portal: https://dascrm.app/login', 42, y + 34);
      y += 52;

      // ── Instructions box
      doc.roundedRect(30, y, PW - 60, 60, 6).fill('#0e1c34').stroke(AMBER);
      doc.fontSize(8).font('Helvetica-Bold').fillColor(AMBER)
        .text('Important Instructions & Next Steps', 42, y + 10);
      doc.fontSize(8).font('Helvetica').fillColor('#c8d2f0')
        .text('1. This PDF has also been sent to your registered email address. Please check your inbox.', 42, y + 24)
        .text('2. Save this PDF securely — it contains your Registration Key and Admin credentials.', 42, y + 36)
        .text('3. Super Admin will verify your plan and activate your workspace within 24-48 hours.', 42, y + 48)
        .text('4. Upon activation, login at https://dascrm.app/login using the Admin credentials above.', 42, y + 60 - 2);

      // ── Footer
      doc.rect(0, 800, PW, 42).fill('#06070e');
      doc.rect(0, 838, PW, 4).fill(INDIGO);
      doc.fontSize(7).font('Helvetica').fillColor('#505080')
        .text(
          'DAS CRM — Powered by Dynamic Advance Solution  |  support@dascrm.app  |  Confidential. Do not share.',
          30, 816,
          { align: 'center', width: PW - 60 }
        );

      doc.end();
    });
  }

  async sendCompanyRegistrationEmail(opts: {
    adminEmail: string;
    adminName: string;
    companyName: string;
    key: string;
    planTier: string;
    memberLimit: number;
    validityDays: number;
    accountType?: string;
    adminPassword?: string;
    pincode?: string;
    phone?: string;
    city?: string;
    state?: string;
    gstNumber?: string;
    panNumber?: string;
    panType?: string;
    companyType?: string;
    sector?: string;
    couponCode?: string;
  }): Promise<void> {
    const registeredAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    // Generate PDF attachment
    let pdfBuffer: Buffer | null = null;
    try {
      pdfBuffer = await this.generateRegistrationPdfBuffer({
        companyName: opts.companyName,
        adminName: opts.adminName,
        adminEmail: opts.adminEmail,
        adminPassword: opts.adminPassword || '(as set during registration)',
        key: opts.key,
        planTier: opts.planTier,
        memberLimit: opts.memberLimit,
        validityDays: opts.validityDays,
        accountType: opts.accountType,
        pincode: opts.pincode,
        phone: opts.phone,
        city: opts.city,
        state: opts.state,
        gstNumber: opts.gstNumber,
        panNumber: opts.panNumber,
        panType: opts.panType,
        companyType: opts.companyType,
        sector: opts.sector,
        couponCode: opts.couponCode,
        registeredAt,
      });
    } catch (pdfErr) {
      console.warn('[MailService] Could not generate registration PDF:', pdfErr);
    }

    try {
      const safeName = opts.companyName.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
      await this.transporter.sendMail({
        from: `"DAS CRM Registration" <${process.env.SMTP_FROM || 'noreply@dascrm.app'}>`,
        to: opts.adminEmail,
        subject: `🎉 Congratulations! Your DAS CRM Workspace is Registered — Key: ${opts.key}`,
        attachments: pdfBuffer
          ? [{
              filename: `DAS_CRM_Registration_${safeName}_${opts.key}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf',
            }]
          : [],
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
          <body style="margin:0;padding:0;background:#06071a;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#06071a;padding:32px 16px;">
              <tr><td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

                  <!-- Header -->
                  <tr>
                    <td style="background:linear-gradient(135deg,#1e1b4b 0%,#1e3a5f 100%);border-radius:16px 16px 0 0;padding:32px 40px;border:1px solid rgba(99,102,241,0.3);border-bottom:none;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td>
                            <div style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:14px;padding:12px 16px;margin-bottom:16px;">
                              <span style="color:#fff;font-size:20px;font-weight:900;letter-spacing:1px;">DAS CRM</span>
                            </div>
                            <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:900;line-height:1.3;">🎉 Congratulations!</h1>
                            <p style="color:#a5b4fc;margin:8px 0 0;font-size:15px;font-weight:500;">Your Company Workspace Has Been Successfully Registered</p>
                          </td>
                          <td align="right" valign="top" style="padding-top:4px;">
                            <div style="background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.35);border-radius:10px;padding:8px 14px;display:inline-block;">
                              <span style="color:#4ade80;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;">✓ Registered</span>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="background:#0d0f2a;border:1px solid rgba(99,102,241,0.2);border-top:none;border-bottom:none;padding:32px 40px;">

                      <p style="color:#c7d2fe;font-size:14px;margin:0 0 24px;">
                        Dear <strong style="color:#ffffff;">${opts.adminName}</strong>,<br><br>
                        Your company workspace <strong style="color:#a5b4fc;">${opts.companyName}</strong> has been registered in DAS CRM. Super Admin has been notified and will verify your plan quota and activate your workspace.
                      </p>

                      <!-- ATTACHMENT NOTICE -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                        <tr>
                          <td style="background:rgba(34,197,94,0.12);border:1.5px solid rgba(34,197,94,0.4);border-radius:12px;padding:16px 20px;">
                            <p style="color:#4ade80;font-size:13px;font-weight:800;margin:0 0 6px;">📎 PDF Registration Certificate Attached</p>
                            <p style="color:#bbf7d0;font-size:12px;margin:0;line-height:1.6;">
                              We have generated and attached your official <strong>DAS CRM Company Registration Certificate (PDF)</strong> to this email. It contains your Registration Key, Admin login credentials, and complete registration data. Please download and keep it safe!
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- KEY BOX -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                        <tr>
                          <td style="background:linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.15));border:1.5px solid rgba(99,102,241,0.5);border-radius:14px;padding:24px 28px;text-align:center;">
                            <p style="color:#a5b4fc;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:2px;margin:0 0 10px;">🔑 Your Company Registration Key</p>
                            <p style="color:#6366f1;font-size:36px;font-weight:900;letter-spacing:6px;margin:0;font-family:monospace;text-shadow:0 0 20px rgba(99,102,241,0.5);">${opts.key}</p>
                            <p style="color:#818cf8;font-size:11px;margin:10px 0 0;">Keep this key confidential — it uniquely identifies your workspace</p>
                          </td>
                        </tr>
                      </table>

                      <!-- ADMIN CREDENTIALS BOX -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border-radius:12px;overflow:hidden;border:1px solid rgba(245,158,11,0.4);">
                        <tr style="background:rgba(245,158,11,0.18);">
                          <td colspan="2" style="padding:10px 16px;color:#fbbf24;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;">🔐 Admin Login Credentials (Confidential)</td>
                        </tr>
                        <tr style="background:rgba(245,158,11,0.06);">
                          <td style="padding:10px 16px;color:#d4a373;font-size:12px;width:42%;border-bottom:1px solid rgba(245,158,11,0.15);">Admin Name</td>
                          <td style="padding:10px 16px;color:#ffffff;font-size:12px;font-weight:700;border-bottom:1px solid rgba(245,158,11,0.15);">${opts.adminName}</td>
                        </tr>
                        <tr style="background:rgba(245,158,11,0.03);">
                          <td style="padding:10px 16px;color:#d4a373;font-size:12px;border-bottom:1px solid rgba(245,158,11,0.15);">Login Email (User ID)</td>
                          <td style="padding:10px 16px;color:#ffffff;font-size:12px;font-weight:700;font-family:monospace;border-bottom:1px solid rgba(245,158,11,0.15);">${opts.adminEmail}</td>
                        </tr>
                        <tr style="background:rgba(245,158,11,0.06);">
                          <td style="padding:10px 16px;color:#d4a373;font-size:12px;">Admin Password</td>
                          <td style="padding:10px 16px;color:#fef08a;font-size:13px;font-weight:800;font-family:monospace;">${opts.adminPassword || '(as entered during registration)'}</td>
                        </tr>
                      </table>

                      <!-- DETAILS TABLE -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;margin-bottom:24px;border:1px solid rgba(255,255,255,0.07);">
                        <tr style="background:rgba(99,102,241,0.15);">
                          <td colspan="2" style="padding:10px 16px;color:#a5b4fc;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;">Registration Details</td>
                        </tr>
                        ${[
                          ['Company Name', opts.companyName],
                          ['Company Type', opts.companyType || 'N/A'],
                          ['Industry Sector', opts.sector || 'N/A'],
                          ['GST Number', opts.gstNumber || 'N/A'],
                          ['PAN Card', opts.panNumber ? `${opts.panNumber} (${opts.panType === 'PERSONAL' ? 'Personal' : 'Business'})` : 'N/A'],
                          ['Phone Number', opts.phone || 'N/A'],
                          ['Pincode', opts.pincode || 'N/A'],
                          ['City / State', opts.city && opts.state ? `${opts.city}, ${opts.state}` : opts.city || opts.state || 'N/A'],
                          ['Subscription Plan', `${opts.planTier} — ${opts.memberLimit} User Seats`],
                          ['Request Mode', opts.accountType === 'BUY_REQUEST' ? 'Buy Request (30 Days Validity)' : 'Free Trial (15 Days Evaluation)'],
                          ['Key Validity', `${opts.validityDays} Days`],
                          ['Coupon Applied', opts.couponCode || 'None'],
                          ['Registered At', registeredAt + ' IST'],
                          ['Status', '⏳ Pending Super Admin Verification'],
                        ].map((row, i) => `
                          <tr style="background:${i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)'};">
                            <td style="padding:10px 16px;color:#94a3b8;font-size:12px;width:42%;border-bottom:1px solid rgba(255,255,255,0.05);">${row[0]}</td>
                            <td style="padding:10px 16px;color:#e2e8f0;font-size:12px;font-weight:600;border-bottom:1px solid rgba(255,255,255,0.05);">${row[1]}</td>
                          </tr>
                        `).join('')}
                      </table>

                      <!-- CONTACT DAS CRM BOX -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                        <tr>
                          <td style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.25);border-radius:12px;padding:16px 20px;">
                            <p style="color:#a5b4fc;font-size:12px;font-weight:800;margin:0 0 6px;">📞 DAS CRM Contact & Support</p>
                            <p style="color:#c7d2fe;font-size:12px;margin:0;line-height:1.6;">
                              Support Email: <a href="mailto:support@dascrm.app" style="color:#818cf8;font-weight:700;text-decoration:none;">support@dascrm.app</a><br>
                              Admin Inquiry: <a href="mailto:dynamicadvancesolution@gmail.com" style="color:#818cf8;font-weight:700;text-decoration:none;">dynamicadvancesolution@gmail.com</a><br>
                              Portal: <a href="https://dascrm.app" style="color:#818cf8;font-weight:700;text-decoration:none;">https://dascrm.app</a>
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- PENDING NOTICE -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                        <tr>
                          <td style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:12px;padding:16px 20px;">
                            <p style="color:#fbbf24;font-size:12px;font-weight:700;margin:0 0 6px;">⚠️ Next Step: Await Super Admin Activation</p>
                            <p style="color:#fcd34d;font-size:12px;margin:0;line-height:1.6;opacity:0.85;">
                              Your workspace is currently <strong>pending verification</strong>. Super Admin will review your plan quota and activate the workspace (usually within 24-48 hours). You'll receive an activation confirmation email once approved.
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- CTA BUTTON -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/verification-pending?companyKey=${encodeURIComponent(opts.key)}&companyName=${encodeURIComponent(opts.companyName)}&email=${encodeURIComponent(opts.adminEmail)}"
                              style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;font-weight:800;font-size:14px;padding:14px 36px;border-radius:12px;text-decoration:none;letter-spacing:0.3px;box-shadow:0 8px 24px rgba(99,102,241,0.4);">
                              Check Verification Status →
                            </a>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background:#070817;border:1px solid rgba(99,102,241,0.15);border-top:none;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
                      <p style="color:#4b5563;font-size:11px;margin:0;line-height:1.6;">
                        DAS CRM — Powered by Dynamic Advance Solution<br>
                        This is an automated system email. Do not reply.<br>
                        Support: <a href="mailto:support@dascrm.app" style="color:#6366f1;text-decoration:none;">support@dascrm.app</a>
                      </p>
                    </td>
                  </tr>

                </table>
              </td></tr>
            </table>
          </body>
          </html>`,
      });
    } catch (err) {
      console.warn('[MailService] Could not send Company Registration email:', err);
    }
  }

  /**
   * Notify Super Admin immediately when a new company registers.
   * Sent to the Super Admin email so they can review & approve promptly.
   */
  async sendNewCompanyRegistrationNotification(opts: {
    companyName: string;
    adminName: string;
    adminEmail: string;
    key: string;
    planTier: string;
    memberLimit: number;
    accountType?: string;
    validityDays?: number;
    phone?: string;
    city?: string;
    state?: string;
    gstNumber?: string;
    panNumber?: string;
    panType?: string;
    companyType?: string;
    sector?: string;
  }): Promise<void> {
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'adtyamighty@gmail.com';
    const registeredAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    try {
      await this.transporter.sendMail({
        from: `"DAS CRM System" <${process.env.SMTP_FROM || 'noreply@dascrm.app'}>`,
        to: superAdminEmail,
        subject: `🔔 New Company Registered — ${opts.companyName} (Key: ${opts.key}) — Action Required`,
        html: `
          <!DOCTYPE html>
          <html>
          <body style="margin:0;padding:0;background:#06071a;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#06071a;padding:32px 16px;">
              <tr><td align="center">
                <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

                  <tr>
                    <td style="background:linear-gradient(135deg,#0f172a,#1e1b4b);border-radius:16px 16px 0 0;padding:28px 36px;border:1px solid rgba(239,68,68,0.3);border-bottom:none;">
                      <p style="color:#f87171;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">🔔 Super Admin Alert</p>
                      <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:900;">New Company Registered</h1>
                      <p style="color:#94a3b8;margin:6px 0 0;font-size:13px;">Requires your plan verification and workspace activation</p>
                    </td>
                  </tr>

                  <tr>
                    <td style="background:#0d0f2a;border:1px solid rgba(239,68,68,0.2);border-top:none;border-bottom:none;padding:28px 36px;">

                      <!-- KEY HIGHLIGHT -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                        <tr>
                          <td style="background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.4);border-radius:12px;padding:20px 24px;text-align:center;">
                            <p style="color:#a5b4fc;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Registration Key Issued</p>
                            <p style="color:#6366f1;font-size:30px;font-weight:900;letter-spacing:4px;margin:0;font-family:monospace;">${opts.key}</p>
                          </td>
                        </tr>
                      </table>

                      <!-- COMPANY DETAILS -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;border:1px solid rgba(255,255,255,0.07);margin-bottom:24px;">
                        ${[
                          ['Company', opts.companyName],
                          ['Admin Name', opts.adminName],
                          ['Admin Email', opts.adminEmail],
                          ['Phone', opts.phone || 'N/A'],
                          ['Location', opts.city && opts.state ? `${opts.city}, ${opts.state}` : 'N/A'],
                          ['GST', opts.gstNumber || 'N/A'],
                          ['PAN Card', opts.panNumber ? `${opts.panNumber} (${opts.panType === 'PERSONAL' ? 'Personal' : 'Business'})` : 'N/A'],
                          ['Type', opts.companyType || 'N/A'],
                          ['Sector', opts.sector || 'N/A'],
                          ['Requested Plan', `${opts.planTier} — ${opts.memberLimit} Seats`],
                          ['Registered At', registeredAt + ' IST'],
                        ].map((row, i) => `
                          <tr style="background:${i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)'};">
                            <td style="padding:9px 14px;color:#64748b;font-size:11px;width:38%;border-bottom:1px solid rgba(255,255,255,0.05);">${row[0]}</td>
                            <td style="padding:9px 14px;color:#e2e8f0;font-size:12px;font-weight:600;border-bottom:1px solid rgba(255,255,255,0.05);">${row[1]}</td>
                          </tr>
                        `).join('')}
                      </table>

                      <!-- CTA -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${process.env.SUPER_ADMIN_URL || 'http://localhost:3002'}"
                              style="display:inline-block;background:linear-gradient(135deg,#dc2626,#9f1239);color:#ffffff;font-weight:800;font-size:14px;padding:14px 36px;border-radius:12px;text-decoration:none;box-shadow:0 8px 24px rgba(220,38,38,0.35);">
                              Review & Approve in Super Admin Portal →
                            </a>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <tr>
                    <td style="background:#070817;border:1px solid rgba(239,68,68,0.12);border-top:none;border-radius:0 0 16px 16px;padding:16px 36px;text-align:center;">
                      <p style="color:#374151;font-size:11px;margin:0;">DAS CRM — Automated System Notification. Do not reply to this email.</p>
                    </td>
                  </tr>

                </table>
              </td></tr>
            </table>
          </body>
          </html>`,
      });
    } catch (err) {
      console.warn('[MailService] Could not send new company notification to Super Admin:', err);
    }
  }



  async sendCompanyApprovalEmail(opts: {
    adminEmail: string;
    adminName: string;
    companyName: string;
    planTier: string;
    memberLimit: number;
    expiryDate: string;
  }): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"DAS CRM Team" <${process.env.SMTP_FROM || 'noreply@dascrm.app'}>`,
        to: opts.adminEmail,
        subject: `🎉 Workspace Verified & Activated: ${opts.companyName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #10b981; border-radius: 16px; background: #ffffff;">
            <h2 style="color: #10b981; margin-top: 0;">✓ Company Workspace Activated!</h2>
            <p>Dear <strong>${opts.adminName}</strong>,</p>
            <p>Your company workspace <strong>${opts.companyName}</strong> has been reviewed, approved, and activated by the Super Admin.</p>
            <p>Plan Tier: <strong>${opts.planTier}</strong> (${opts.memberLimit} Seats Allocated)</p>
            <p>Expiry Date: <strong>${opts.expiryDate}</strong></p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" style="display: inline-block; margin-top: 16px; padding: 14px 28px; background: #10b981; color: white; border-radius: 10px; text-decoration: none; font-weight: bold; text-align: center; width: 100%; box-sizing: border-box;">
              Login to Activated Workspace →
            </a>
          </div>`,
      });
    } catch (err) {
      console.warn('[MailService] Could not send approval email:', err);
    }
  }

  async sendDelayInquiryNotification(opts: {
    companyName: string;
    registrationKey?: string;
    adminEmail?: string;
    message?: string;
  }): Promise<void> {
    try {
      const superAdminEmail = 'dynamicadvancesolution@gmail.com';
      await this.transporter.sendMail({
        from: `"DAS CRM System" <${process.env.SMTP_FROM || 'noreply@dascrm.app'}>`,
        to: superAdminEmail,
        subject: `⚠️ [Delay Inquiry] Company Plan Verification Pending: ${opts.companyName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #f59e0b; border-radius: 16px; background: #ffffff;">
            <h2 style="color: #d97706; margin-top: 0;">Delay Inquiry from Tenant</h2>
            <p>Company: <strong>${opts.companyName}</strong></p>
            <p>Key: <strong>${opts.registrationKey || 'N/A'}</strong></p>
            <p>Admin Email: <strong>${opts.adminEmail || 'N/A'}</strong></p>
            <p>Message: <em>${opts.message || 'Customer is awaiting plan verification and approval.'}</em></p>
            <a href="${process.env.SUPER_ADMIN_URL || 'http://localhost:3002'}" style="display: inline-block; margin-top: 16px; padding: 14px 28px; background: #4f46e5; color: white; border-radius: 10px; text-decoration: none; font-weight: bold; text-align: center; width: 100%; box-sizing: border-box;">
              Review in Super Admin Portal →
            </a>
          </div>`,
      });
    } catch (err) {
      console.warn('[MailService] Could not send delay inquiry to Super Admin:', err);
    }
  }
}
