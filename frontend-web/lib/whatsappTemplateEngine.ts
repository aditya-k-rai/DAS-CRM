/**
 * whatsappTemplateEngine.ts — DAS CRM WhatsApp Template & Direct Launch Engine (Web)
 * Mirrored from Android whatsappTemplateEngine.ts for cross-platform feature parity.
 *
 * Handles:
 * 1. Persistent storage of WhatsApp templates via `das_whatsapp_custom_templates_v1`
 * 2. Cross-tab synchronization via BroadcastChannel & window CustomEvents
 * 3. Dynamic placeholder interpolation ({name}, {company}, {value}, {product}, {catalog_link})
 * 4. Phone cleaning (India 91 auto-prefix for 10-digit numbers)
 * 5. Direct WhatsApp launching (https://wa.me/... and whatsapp://send)
 */

export type TemplateCategory = 'OUTREACH' | 'PROPOSAL' | 'FOLLOWUP' | 'PROMOTION';

export interface WhatsAppTemplate {
  id: string;
  title: string;
  category: TemplateCategory;
  text: string;
  isDefault?: boolean;
  usageCount?: number;
}

export const STORAGE_KEY = 'das_whatsapp_custom_templates_v1';
export const SYNC_CHANNEL_NAME = 'das_crm_whatsapp_sync';
export const UPDATE_EVENT_NAME = 'das_crm_whatsapp_templates_updated';

export const DEFAULT_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'tpl_1',
    title: '🌱 Initial Lead Outreach',
    category: 'OUTREACH',
    text: "Hi {name}! I got to know that you inquired about our DAS CRM solution for {company}. Let's connect for a quick 5-minute call today!",
    isDefault: true,
    usageCount: 0,
  },
  {
    id: 'tpl_2',
    title: '💼 Customized Proposal & Pricing Deck',
    category: 'PROPOSAL',
    text: "Hi {name}, I have prepared the customized CRM proposal of {value} for {company}. Please let me know when you'd like to review the commercial breakdown!",
    isDefault: true,
    usageCount: 0,
  },
  {
    id: 'tpl_3',
    title: '⏰ SLA 15-Min Follow-Up Call',
    category: 'FOLLOWUP',
    text: "Hi {name}, following up regarding our recent discussion for {company}. Do you have 5 minutes for a quick call today?",
    isDefault: true,
    usageCount: 0,
  },
  {
    id: 'tpl_4',
    title: '🎉 Seasonal Discount & Priority Demo Offer',
    category: 'PROMOTION',
    text: "Exciting news {name}! Get a special discount on {product} for {company} when you upgrade this week. Reply to claim your priority demo slot!",
    isDefault: true,
    usageCount: 0,
  },
  {
    id: 'tpl_5',
    title: '📄 GST Commercial Proposal Breakdown',
    category: 'PROPOSAL',
    text: "Hello {name}, please find our official commercial quote for {product} attached with 18% GST tax breakdown totaling {value}. Looking forward to your confirmation!",
    isDefault: true,
    usageCount: 0,
  },
  {
    id: 'tpl_6',
    title: '🚀 Product Demo & Live Walkthrough Invitation',
    category: 'OUTREACH',
    text: "Hi {name}, we would love to give you a customized live walkthrough of our platform for {company}. Reply to confirm your preferred timing!",
    isDefault: true,
    usageCount: 0,
  },
];

export const CATEGORY_EMOJIS: Record<TemplateCategory, string> = {
  OUTREACH: '🌱',
  PROPOSAL: '💼',
  FOLLOWUP: '⏰',
  PROMOTION: '🎉',
};

class WhatsAppTemplateEngine {
  /** Clean phone string (keep country code; default India 91 prefix if 10 digits) */
  cleanPhone(phone: string): string {
    let digits = (phone || '').replace(/[^\d]/g, '');
    if (digits.length === 10) {
      digits = '91' + digits;
    }
    return digits;
  }

  /** Format phone with + prefix for display */
  formatPhoneDisplay(phone: string): string {
    const cleaned = this.cleanPhone(phone);
    if (!cleaned) return '—';
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
    }
    return `+${cleaned}`;
  }

  /** Interpolate dynamic lead placeholders ({name}, {company}, {value}, {product}, etc.) */
  interpolateTemplate(
    templateText: string,
    lead: {
      name?: string;
      firstName?: string;
      lastName?: string;
      company?: string;
      value?: string;
      requirement?: string;
      product?: string;
    }
  ): string {
    const rawName = (lead.name || `${lead.firstName || ''} ${lead.lastName || ''}`).trim();
    const leadName = rawName || 'Valued Customer';
    const company = lead.company || 'your organization';
    const value = lead.value || 'your customized package';
    const product = lead.product || lead.requirement || 'DAS CRM Suite';

    return (templateText || '')
      .replace(/\{name\}/gi, leadName)
      .replace(/\{LeadName\}/gi, leadName)
      .replace(/\{clientName\}/gi, leadName)
      .replace(/\{company\}/gi, company)
      .replace(/\{companyName\}/gi, company)
      .replace(/\{value\}/gi, value)
      .replace(/\{price\}/gi, value)
      .replace(/\{product\}/gi, product)
      .replace(/\{productName\}/gi, product)
      .replace(/\{catalog_link\}/gi, 'https://dascrm.com/catalog');
  }

  /** Fetch all saved WhatsApp templates (defaults + user/admin customizations) */
  getTemplates(): WhatsAppTemplate[] {
    if (typeof window === 'undefined') {
      return DEFAULT_TEMPLATES;
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved WhatsApp templates:', e);
    }
    return DEFAULT_TEMPLATES;
  }

  /** Save customized template list and broadcast to all tabs/windows */
  saveTemplates(templates: WhatsAppTemplate[]): boolean {
    if (typeof window === 'undefined') return false;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));

      // Broadcast via window event
      window.dispatchEvent(
        new CustomEvent(UPDATE_EVENT_NAME, { detail: { templates } })
      );

      // Broadcast via BroadcastChannel
      try {
        const bc = new BroadcastChannel(SYNC_CHANNEL_NAME);
        bc.postMessage({ type: 'TEMPLATES_UPDATED', templates });
        bc.close();
      } catch (_) {}

      return true;
    } catch (e) {
      console.warn('Failed to save WhatsApp templates:', e);
      return false;
    }
  }

  /** Add or update template */
  upsertTemplate(template: WhatsAppTemplate): WhatsAppTemplate[] {
    const list = this.getTemplates();
    const existingIndex = list.findIndex((t) => t.id === template.id);
    if (existingIndex >= 0) {
      list[existingIndex] = template;
    } else {
      list.unshift(template);
    }
    this.saveTemplates(list);
    return list;
  }

  /** Delete template by ID */
  deleteTemplate(id: string): WhatsAppTemplate[] {
    const list = this.getTemplates();
    const updated = list.filter((t) => t.id !== id);
    this.saveTemplates(updated);
    return updated;
  }

  /** Increment usage count */
  incrementUsage(id: string): void {
    const list = this.getTemplates();
    const item = list.find((t) => t.id === id);
    if (item) {
      item.usageCount = (item.usageCount || 0) + 1;
      this.saveTemplates(list);
    }
  }

  /** Generate direct WhatsApp URL (wa.me) */
  getDirectWhatsAppUrl(phone: string, messageText: string): string {
    const cleaned = this.cleanPhone(phone);
    const encoded = encodeURIComponent(messageText || '');
    return `https://wa.me/${cleaned}?text=${encoded}`;
  }

  /** Launch Direct WhatsApp Web or App */
  openDirectWhatsApp(
    phone: string,
    messageText: string,
    leadName?: string
  ): { success: boolean; url: string; error?: string } {
    const cleaned = this.cleanPhone(phone);
    if (!cleaned || cleaned.length < 7) {
      return {
        success: false,
        url: '',
        error: `Invalid phone number for ${leadName || 'lead'}: "${phone}"`,
      };
    }

    const waUrl = this.getDirectWhatsAppUrl(cleaned, messageText);

    if (typeof window !== 'undefined') {
      try {
        const opened = window.open(waUrl, '_blank', 'noopener,noreferrer');
        if (!opened || opened.closed || typeof opened.closed === 'undefined') {
          // If popup blocked, direct location href as fallback
          window.location.href = waUrl;
        }
      } catch {
        window.location.href = waUrl;
      }
    }

    return { success: true, url: waUrl };
  }
}

export const whatsappTemplateEngine = new WhatsAppTemplateEngine();
