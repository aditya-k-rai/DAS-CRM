/**
 * leadsExportEngine.ts — DAS CRM Comprehensive Lead Export Engine
 * Generates formatted Excel (.xlsx) and CSV (.csv) exports with complete details:
 * 1. 👥 Lead Profile Details (ID, Name, Phone, Email, Company, City, State, Status, Value, Source, AI Score)
 * 2. 📦 Products Interested & Requirements (Product Name, Category, Specs, Budget)
 * 3. ⏱️ Follow-up Details (Next Follow-up Date/Time, Follow-up Type, Status, Remarks/Outcome, Call Counts, History Trail)
 * 4. 👔 Team Allocation & Ownership (Assigned Sales Rep, Team Leader, Role, Allocation Timestamp)
 */

import * as XLSX from 'xlsx';

export interface ExportLeadItem {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: string;
  value?: string | number;
  city?: string;
  budget?: string;
  requirement?: string;
  source?: string;
  score?: number;
  created?: string;
  rawCreatedAt?: string;
  tags?: string[];
  owner?: string;
  assignedRep?: string;
  assignedRepRole?: string;
  currentAssignee?: string;
  totalCalls?: number;
  lastCalledAt?: string;
  customFields?: Record<string, any>;
  allocationTrail?: any[];
  tasks?: any[];
}

export interface LeadExportRow {
  'Lead ID': string;
  'Lead Name / Client': string;
  'Phone Number': string;
  'Email Address': string;
  'Company': string;
  'City': string;
  'State / Location': string;
  'Lead Status': string;
  'Lead Value': string;
  'Budget Range': string;
  'Product / Requirement Interested': string;
  'Product Category': string;
  'Product Specifications & Notes': string;
  'Next Follow-up Date': string;
  'Next Follow-up Time': string;
  'Follow-up Type': string;
  'Follow-up Status': string;
  'Follow-up Notes / Remarks': string;
  'Total Calls / Attempts': number;
  'Last Call / Contact Date': string;
  'Follow-up History Summary': string;
  'Assigned Sales Executive': string;
  'Sales Rep Role': string;
  'Team Leader': string;
  'Lead Source': string;
  'AI Lead Score': string;
  'Tags': string;
  'Created Date': string;
}

/**
 * Resolves comprehensive follow-up records from customFields, tasks, and browser storage
 */
function resolveFollowUpDetails(lead: ExportLeadItem): {
  followUpDate: string;
  followUpTime: string;
  followUpType: string;
  followUpStatus: string;
  followUpNotes: string;
  totalCalls: number;
  lastCalledAt: string;
  historySummary: string;
} {
  const cf = lead.customFields || {};

  let followUpDate = cf.followUpDate || cf.nextFollowUpDate || cf.scheduledDate || '—';
  let followUpTime = cf.followUpTime || cf.scheduledTime || '—';
  let followUpType = cf.followUpType || cf.scheduledType || '—';
  let followUpStatus = cf.followUpStatus || (followUpDate !== '—' ? 'Scheduled' : 'Pending');
  let followUpNotes = cf.followUpNotes || cf.remarks || cf.lastRemark || cf.notes || '—';
  let totalCalls = typeof lead.totalCalls === 'number' ? lead.totalCalls : (cf.totalCalls || 0);
  let lastCalledAt = lead.lastCalledAt || cf.lastCalledAt || 'Never';
  const historyItems: string[] = [];

  // 1. Inspect direct tasks if available on lead
  if (Array.isArray(lead.tasks) && lead.tasks.length > 0) {
    const fuTask = lead.tasks.find((t: any) => t.taskType === 'FOLLOW_UP' || t.dueDate);
    if (fuTask) {
      if (followUpDate === '—' && fuTask.dueDate) {
        followUpDate = String(fuTask.dueDate).split('T')[0];
      }
      if (followUpTime === '—' && fuTask.dueTime) {
        followUpTime = String(fuTask.dueTime);
      }
      if (followUpType === '—' && fuTask.followUpType) {
        followUpType = String(fuTask.followUpType);
      }
      if (fuTask.status) {
        followUpStatus = String(fuTask.status);
      }
      if (followUpNotes === '—' && fuTask.notes) {
        followUpNotes = String(fuTask.notes);
      }
    }
  }

  // 2. Check localStorage cached follow-ups
  if (typeof window !== 'undefined') {
    try {
      const rawTasks = localStorage.getItem('das_crm_followup_tasks_cache');
      if (rawTasks) {
        const tasks = JSON.parse(rawTasks);
        if (Array.isArray(tasks)) {
          const matched = tasks.filter((t: any) =>
            String(t.leadId || t.lead?.id || '') === String(lead.id) ||
            (t.phone && lead.phone && String(t.phone).replace(/\D/g, '') === String(lead.phone).replace(/\D/g, ''))
          );
          if (matched.length > 0) {
            const latest = matched[0];
            if (followUpDate === '—' && (latest.dueDate || latest.followUpDate)) {
              followUpDate = String(latest.dueDate || latest.followUpDate).split('T')[0];
            }
            if (followUpTime === '—' && (latest.dueTime || latest.followUpTime)) {
              followUpTime = String(latest.dueTime || latest.followUpTime);
            }
            if (followUpType === '—' && (latest.type || latest.scheduledType)) {
              followUpType = String(latest.type || latest.scheduledType);
            }
            if (latest.status) followUpStatus = String(latest.status);
            if (followUpNotes === '—' && (latest.notes || latest.outcome)) {
              followUpNotes = String(latest.notes || latest.outcome);
            }
          }
        }
      }

      // Check contact history / call attempts
      const rawHistory = localStorage.getItem(`das_crm_contact_history_${lead.id}`) ||
                          localStorage.getItem(`das_crm_call_attempts_${lead.id}`);
      if (rawHistory) {
        const parsed = JSON.parse(rawHistory);
        if (Array.isArray(parsed) && parsed.length > 0) {
          totalCalls = Math.max(totalCalls, parsed.length);
          const first = parsed[0];
          if (first.createdAt || first.timestamp) {
            lastCalledAt = new Date(first.createdAt || first.timestamp).toLocaleDateString('en-IN');
          }
          parsed.slice(0, 3).forEach((h: any) => {
            const dateStr = h.createdAt ? new Date(h.createdAt).toLocaleDateString('en-IN') : 'Recent';
            const action = h.type || h.outcome || 'Call';
            const note = h.notes || h.remarks ? ` - "${h.notes || h.remarks}"` : '';
            historyItems.push(`[${dateStr}] ${action}${note}`);
          });
        }
      }
    } catch (_) {}
  }

  // Fallback defaults for cleaner reporting
  if (followUpType === '—' && (lead.status || '').toLowerCase().includes('meeting')) {
    followUpType = 'MEETING';
  } else if (followUpType === '—' && followUpDate !== '—') {
    followUpType = 'CALL';
  }

  return {
    followUpDate,
    followUpTime,
    followUpType,
    followUpStatus,
    followUpNotes,
    totalCalls,
    lastCalledAt,
    historySummary: historyItems.length > 0 ? historyItems.join(' | ') : (followUpNotes !== '—' ? followUpNotes : 'No call logs recorded'),
  };
}

/**
 * Resolves Products Interested and Specifications
 */
function resolveProductDetails(lead: ExportLeadItem): {
  productInterested: string;
  productCategory: string;
  productNotes: string;
} {
  const cf = lead.customFields || {};

  const productInterested =
    lead.requirement && lead.requirement !== '—'
      ? lead.requirement
      : cf.productInterested ||
        cf.product ||
        cf.products ||
        cf.productsInterested ||
        cf.requirement ||
        cf.productInterest ||
        cf.col_requirement ||
        'General Inquiry';

  const productCategory =
    cf.productCategory ||
    cf.category ||
    cf.industry ||
    cf.segment ||
    'Commercial';

  const productNotes =
    cf.requirementNotes ||
    cf.specs ||
    cf.notes ||
    cf.description ||
    '—';

  return { productInterested, productCategory, productNotes };
}

/**
 * Formats a single lead object into a clean, flat row for spreadsheet export
 */
export function formatLeadExportRow(lead: ExportLeadItem): LeadExportRow {
  const cf = lead.customFields || {};
  const followUp = resolveFollowUpDetails(lead);
  const products = resolveProductDetails(lead);

  // Team Leader resolution
  let teamLeader = cf.teamLeader || cf.teamLead || '—';
  if (teamLeader === '—' && Array.isArray(lead.allocationTrail) && lead.allocationTrail.length > 0) {
    const tlEvent = lead.allocationTrail.find((e: any) => e.fromRole === 'TEAM_LEADER' || e.toRole === 'TEAM_LEADER');
    if (tlEvent) {
      teamLeader = tlEvent.toName || tlEvent.fromName || '—';
    }
  }

  return {
    'Lead ID': lead.id,
    'Lead Name / Client': lead.name || '—',
    'Phone Number': lead.phone || '—',
    'Email Address': lead.email || '—',
    'Company': lead.company || cf.company || '—',
    'City': lead.city || cf.city || '—',
    'State / Location': cf.state || cf.location || cf.country || '—',
    'Lead Status': lead.status || 'New',
    'Lead Value': String(lead.value || '—'),
    'Budget Range': lead.budget || cf.budget || '—',
    'Product / Requirement Interested': products.productInterested,
    'Product Category': products.productCategory,
    'Product Specifications & Notes': products.productNotes,
    'Next Follow-up Date': followUp.followUpDate,
    'Next Follow-up Time': followUp.followUpTime,
    'Follow-up Type': followUp.followUpType,
    'Follow-up Status': followUp.followUpStatus,
    'Follow-up Notes / Remarks': followUp.followUpNotes,
    'Total Calls / Attempts': followUp.totalCalls,
    'Last Call / Contact Date': followUp.lastCalledAt,
    'Follow-up History Summary': followUp.historySummary,
    'Assigned Sales Executive': lead.assignedRep || lead.owner || lead.currentAssignee || 'Unassigned',
    'Sales Rep Role': lead.assignedRepRole || 'Sales Executive',
    'Team Leader': teamLeader,
    'Lead Source': lead.source || 'Website',
    'AI Lead Score': lead.score ? `${lead.score}/100` : '80/100',
    'Tags': Array.isArray(lead.tags) ? lead.tags.join(', ') : '—',
    'Created Date': lead.created || (lead.rawCreatedAt ? new Date(lead.rawCreatedAt).toLocaleDateString('en-IN') : '—'),
  };
}

/**
 * Exports leads to Microsoft Excel (.xlsx) file with styled headers & auto-width
 */
export function exportLeadsToExcel(leads: ExportLeadItem[], customFilename?: string): void {
  if (!leads || leads.length === 0) return;

  const rows = leads.map(formatLeadExportRow);
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Calculate dynamic column widths based on cell content
  if (rows.length > 0) {
    const headers = Object.keys(rows[0]) as (keyof LeadExportRow)[];
    const colWidths = headers.map(header => {
      let maxLen = header.length;
      rows.forEach(row => {
        const valStr = String(row[header] || '');
        if (valStr.length > maxLen) {
          maxLen = valStr.length;
        }
      });
      return { wch: Math.min(Math.max(maxLen + 3, 12), 45) };
    });
    worksheet['!cols'] = colWidths;
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads & Follow-ups');

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = customFilename || `DAS_CRM_Leads_FollowUps_${dateStr}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

/**
 * Exports leads to RFC 4180 compliant CSV with UTF-8 BOM for flawless Excel opening
 */
export function exportLeadsToCSV(leads: ExportLeadItem[], customFilename?: string): void {
  if (!leads || leads.length === 0) return;

  const rows = leads.map(formatLeadExportRow);
  const headers = Object.keys(rows[0]) as (keyof LeadExportRow)[];

  const escapeCSV = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const headerLine = headers.map(escapeCSV).join(',');
  const rowLines = rows.map(row => headers.map(h => escapeCSV(row[h])).join(','));

  // UTF-8 BOM (\uFEFF) ensures Excel displays non-ASCII characters & Indian Rupee symbol correctly
  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  a.download = customFilename || `DAS_CRM_Leads_FollowUps_${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
