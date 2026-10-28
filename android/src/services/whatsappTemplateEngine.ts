/**
 * whatsappTemplateEngine.ts — DAS CRM WhatsApp Template & Direct Launch Engine
 * Handles:
 * 1. Admin customization of WhatsApp Templates with dynamic placeholders ({name}, {company}, {value})
 * 2. Role-based access control (All sales & admin roles allowed EXCEPT HR)
 * 3. Direct WhatsApp app launching (whatsapp://send & wa.me fallback)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Alert } from 'react-native';
import { UserRole } from '../store/authStore';

export type TemplateCategory = 'OUTREACH' | 'PROPOSAL' | 'FOLLOWUP' | 'PROMOTION' | 'MEETING' | 'INVOICE';

export interface WhatsAppTemplate {
  id: string;
  title: string;
  category: TemplateCategory;
  text: string;
  isDefault?: boolean;
  usageCount?: number;
  targetStatus?: string;
}

const STORAGE_KEY = 'das_whatsapp_custom_templates_v1';

export const DEFAULT_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'tpl_1',
    title: '🌱 Initial Lead Outreach',
    category: 'OUTREACH',
    targetStatus: 'Contacted',
    text: "Hi {name}! I got to know that you inquired about {product} for {company}. Let's connect for a quick 5-minute call today!",
    isDefault: true,
    usageCount: 0,
  },
  {
    id: 'tpl_2',
    title: '💼 Customized Proposal & Pricing Deck',
    category: 'PROPOSAL',
    targetStatus: 'Proposal',
    text: "Hi {name}, I have prepared the customized proposal of {value} for {company}. Please let me know when you'd like to review the commercial breakdown!",
    isDefault: true,
    usageCount: 0,
  },
  {
    id: 'tpl_3',
    title: '⏰ SLA 15-Min Follow-Up Call',
    category: 'FOLLOWUP',
    targetStatus: 'Contacted',
    text: "Hi {name}, following up regarding our recent discussion for {company}. Do you have 5 minutes for a quick call today?",
    isDefault: true,
    usageCount: 0,
  },
  {
    id: 'tpl_4',
    title: '📅 Meeting Details & Demo Confirmation',
    category: 'MEETING',
    targetStatus: 'Meeting Scheduled',
    text: "Hi {name}, looking forward to our scheduled walkthrough & discussion for {company}! Let me know if you would like me to share a Google Meet / Zoom link or adjust the timing.",
    isDefault: true,
    usageCount: 0,
  },
  {
    id: 'tpl_5',
    title: '📄 GST Commercial Proposal Breakdown',
    category: 'PROPOSAL',
    targetStatus: 'Proposal',
    text: "Hello {name}, please find our official commercial quote for {product} attached with 18% GST tax breakdown totaling {value}. Looking forward to your confirmation!",
    isDefault: true,
    usageCount: 0,
  },
  {
    id: 'tpl_6',
    title: '📦 Product Specs & Proforma Invoice',
    category: 'INVOICE',
    targetStatus: 'In Negotiation',
    text: "Hi {name}, here is the complete product specification and proforma invoice for {product} for {company} totaling {value}. Please review and let me know your confirmation!",
    isDefault: true,
    usageCount: 0,
  },
  {
    id: 'tpl_7',
    title: '🚀 Live Walkthrough Invitation',
    category: 'OUTREACH',
    targetStatus: 'Meeting Scheduled',
    text: "Hi {name}, we would love to give you a customized presentation of our offerings for {company}. Reply to confirm your preferred timing!",
    isDefault: true,
    usageCount: 0,
  },
  {
    id: 'tpl_8',
    title: '🎉 Seasonal Discount & Priority Demo Offer',
    category: 'PROMOTION',
    targetStatus: 'In Negotiation',
    text: "Exciting news {name}! Get a special discount on {product} for {company} when you confirm this week. Reply to claim your exclusive offer!",
    isDefault: true,
    usageCount: 0,
  },
];

export interface PriceTier {
  minQty: number;
  maxQty: number;
  unitPrice: number;
  label: string;
}

export interface ProductItem {
  id: string;
  name: string;
  minPrice: string;
  maxPrice: string;
  category: string;
  description: string;
  features: string[];
  imageUrl: string;
  priceTiers: PriceTier[];
  sku?: string;
  price?: number;
  unit?: string;
}

export interface InvoiceItem {
  id: string;
  quoteNumber: string;
  docType: string;
  date: string;
  buyerCompany: string;
  buyerName: string;
  totalAmount: number;
  taxRate: number;
  itemsSummary: string;
  status: string;
  pdfUrl?: string;
}

export const STATUS_OPTIONS: Array<{
  key: string;
  label: string;
  badge: string;
  color: string;
  desc?: string;
}> = [
  { key: 'Contacted', label: 'Connected / Contacted', badge: '📞', color: '#f59e0b', desc: 'Initial contact made' },
  { key: 'Proposal', label: 'Proposal Sent (Negotiation)', badge: '📄', color: '#8b5cf6', desc: 'Commercial proposal sent' },
  { key: 'Negotiation', label: 'Product / Invoice Sent (Negotiation)', badge: '📦', color: '#ec4899', desc: 'Invoice / pricing terms shared' },
  { key: 'Meeting Scheduled', label: 'Meeting Details (Meeting Scheduled)', badge: '📅', color: '#3b82f6', desc: 'Demo / live walkthrough booked' },
  { key: 'Qualified', label: 'Qualified (Requirements Gathered)', badge: '🎯', color: '#06b6d4', desc: 'Product requirements validated' },
  { key: 'Won', label: 'Deal Closed / Payment Cleared (Won)', badge: '🏆', color: '#10b981', desc: 'Deal closed successfully' },
  { key: 'Lost', label: 'Not Interested / Dropped (Lost)', badge: '❌', color: '#ef4444', desc: 'Not interested / drop off' },
  { key: 'KEEP_CURRENT', label: "Keep Current Status (Don't Change)", badge: '⏸️', color: '#64748b', desc: 'Leave status untouched' },
];

export const CATALOG_PRODUCTS: ProductItem[] = [
  {
    id: 'prod_crm_ent',
    name: 'DAS CRM Enterprise Suite',
    minPrice: '₹14,999',
    maxPrice: '₹49,999',
    category: 'Software & SaaS',
    description: 'Complete multi-tier CRM with WhatsApp automation, lead allocation, and analytics.',
    features: ['WhatsApp Automation', 'Smart Dialler & Telemetry', 'AI Lead Scoring', 'Granular Role Guard'],
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80',
    priceTiers: [
      { minQty: 1, maxQty: 5, unitPrice: 14999, label: 'Standard Tier (1-5 Users)' },
      { minQty: 6, maxQty: 20, unitPrice: 12499, label: 'Growth Tier (6-20 Users)' },
      { minQty: 21, maxQty: 100, unitPrice: 9999, label: 'Enterprise Band (21+ Users)' },
    ],
  },
  {
    id: 'prod_wa_bot',
    name: 'WhatsApp Cloud Multi-Agent AI',
    minPrice: '₹7,499',
    maxPrice: '₹19,999',
    category: 'Add-ons',
    description: 'Official Meta WhatsApp Business API Cloud bot with 2-way AI conversation auto-sync.',
    features: ['Official Meta Cloud API', 'Automated Lead Capture', 'Template Sync', 'Team Inbox'],
    imageUrl: 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?w=600&auto=format&fit=crop&q=80',
    priceTiers: [
      { minQty: 1, maxQty: 1, unitPrice: 7499, label: 'Starter Bot (1 Number)' },
      { minQty: 2, maxQty: 5, unitPrice: 5999, label: 'Multi-Number Pro' },
      { minQty: 6, maxQty: 50, unitPrice: 4499, label: 'Volume Fleet' },
    ],
  },
  {
    id: 'prod_telephony',
    name: 'Smart Telephony & SIM Call Sync',
    minPrice: '₹4,999',
    maxPrice: '₹12,999',
    category: 'Hardware & Add-ons',
    description: 'Hardware SIM and VoIP call duration tracking with automatic post-call dispositions.',
    features: ['SIM Call Logger', 'Post-Call Modal', 'Midnight Purge Compliance', 'Call Analytics'],
    imageUrl: 'https://images.unsplash.com/photo-1534536281715-e28d76689b4d?w=600&auto=format&fit=crop&q=80',
    priceTiers: [
      { minQty: 1, maxQty: 5, unitPrice: 4999, label: 'Starter Pack' },
      { minQty: 6, maxQty: 25, unitPrice: 3999, label: 'Team Fleet' },
    ],
  },
];

export const SAMPLE_INVOICES: InvoiceItem[] = [
  {
    id: 'inv_101',
    quoteNumber: 'INV-2026-0881',
    docType: 'TAX_INVOICE',
    date: '2026-10-07',
    buyerCompany: 'Nexus Technologies',
    buyerName: 'Rahul Kapoor',
    totalAmount: 49999,
    taxRate: 18,
    itemsSummary: 'DAS CRM Enterprise Suite (10 Licenses) + WhatsApp Cloud Bot',
    status: 'GENERATED',
    pdfUrl: 'https://nexcrm.com/invoices/INV-2026-0881.pdf',
  },
  {
    id: 'inv_102',
    quoteNumber: 'QT-2026-0412',
    docType: 'QUOTATION',
    date: '2026-10-06',
    buyerCompany: 'Global Logistics Hub',
    buyerName: 'Aditya Rai',
    totalAmount: 24999,
    taxRate: 18,
    itemsSummary: 'Smart Telephony & SIM Call Sync (5 Users)',
    status: 'GENERATED',
    pdfUrl: 'https://nexcrm.com/quotes/QT-2026-0412.pdf',
  },
  {
    id: 'inv_103',
    quoteNumber: 'PI-2026-0119',
    docType: 'PROFORMA_INVOICE',
    date: '2026-10-05',
    buyerCompany: 'Apex Industrial Corp',
    buyerName: 'Priya Sharma',
    totalAmount: 89500,
    taxRate: 18,
    itemsSummary: 'DAS CRM Full Multi-Branch Deployment & Custom Integrations',
    status: 'GENERATED',
    pdfUrl: 'https://nexcrm.com/invoices/PI-2026-0119.pdf',
  },
];

class WhatsAppTemplateEngine {
  /** Clean phone string (keep country code) */
  cleanPhone(phone: string): string {
    let digits = (phone || '').replace(/[^\d]/g, '');
    if (digits.length === 10) {
      digits = '91' + digits; // Default India 91 prefix for 10-digit numbers
    }
    return digits;
  }

  /** Format phone with + prefix and spacing for display */
  formatPhoneDisplay(phone: string): string {
    const cleaned = this.cleanPhone(phone);
    if (!cleaned) return '—';
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
    }
    return `+${cleaned}`;
  }

  /** Compute Tiered Price based on Quantity */
  getTieredPrice(product: ProductItem, quantity: number): { unitPrice: number; totalPrice: number; tierLabel: string } {
    const qty = Math.max(1, quantity);
    const tier = product.priceTiers.find(t => qty >= t.minQty && qty <= t.maxQty) || product.priceTiers[product.priceTiers.length - 1];
    const unitPrice = tier.unitPrice;
    const totalPrice = unitPrice * qty;
    return { unitPrice, totalPrice, tierLabel: tier.label };
  }

  /** Interpolate dynamic lead placeholders ({name}, {company}, {value}, {product}) with Quantity & Price Banding */
  interpolateTemplate(
    templateText: string,
    lead: { name: string; company?: string; value?: string; requirement?: string; senderCompany?: string },
    product?: ProductItem | null,
    quantity: number = 1
  ): string {
    const leadName = lead.name || 'Valued Customer';
    const rawCompany = (lead.company || '').trim();
    const isIndividual =
      !rawCompany ||
      /^(individual|individual lead|individual client|retail|self|personal|independent business|n\/a|na|none|—|-)$/i.test(rawCompany);
    const company = isIndividual ? '' : rawCompany;
    const value = lead.value || 'your package';
    const senderCompany = lead.senderCompany || '';

    let text = templateText || '';

    if (isIndividual) {
      text = text
        .replace(/\s+for\s+\{company\}/gi, '')
        .replace(/\s+for\s+\{companyName\}/gi, '')
        .replace(/\s+at\s+\{company\}/gi, '')
        .replace(/\s+at\s+\{companyName\}/gi, '')
        .replace(/\s+regarding\s+\{company\}/gi, ' regarding your inquiry');
    }

    text = text
      .replace(/\{name\}/gi, leadName)
      .replace(/\{LeadName\}/gi, leadName)
      .replace(/\{company\}/gi, company || 'your organization')
      .replace(/\{value\}/gi, value)
      .replace(/\{senderCompany\}/gi, senderCompany);

    // Auto-heal legacy templates with hardcoded platform branding
    text = text
      .replace(/our DAS CRM solution/gi, product?.name || lead.requirement || 'our products & services')
      .replace(/DAS CRM solution/gi, product?.name || lead.requirement || 'our products & services')
      .replace(/customized CRM proposal/gi, 'customized proposal')
      .replace(/DAS CRM Suite/gi, product?.name || lead.requirement || 'our products & services')
      .replace(/DAS CRM/gi, senderCompany || 'our team');

    if (product) {
      const { unitPrice, totalPrice, tierLabel } = this.getTieredPrice(product, quantity);

      const productBlock =
        `\n\n📦 *Quotation & Product Details:*` +
        `\n• *Product:* ${product.name}` +
        `\n• *Selected Quantity:* ${quantity} Units / Licenses` +
        `\n• *Pricing Band:* ${product.minPrice} - ${product.maxPrice} per unit` +
        `\n• *Applied Tier:* ${tierLabel}` +
        `\n• *Effective Unit Price:* ₹${unitPrice.toLocaleString('en-IN')}` +
        `\n• *Total Investment:* ₹${totalPrice.toLocaleString('en-IN')} (incl. GST)` +
        `\n• *Overview:* ${product.description}` +
        `\n• *Key Features:* ${product.features.join(' | ')}` +
        `\n• *Product Image/Visual:* ${product.imageUrl}`;

      text = text
        .replace(/\{product\}/gi, product.name)
        .replace(/\{productName\}/gi, product.name)
        .replace(/\{productPrice\}/gi, `₹${unitPrice.toLocaleString('en-IN')}`)
        .replace(/\{quantity\}/gi, String(quantity))
        .replace(/\{totalPrice\}/gi, `₹${totalPrice.toLocaleString('en-IN')}`)
        .replace(/\{productDetails\}/gi, productBlock)
        .replace(/\{productImage\}/gi, product.imageUrl);

      if (!templateText.includes('{product}') && !templateText.includes('{productDetails}')) {
        text += productBlock;
      }
    }

    return text;
  }

  /** Check if current role has WhatsApp & Call permission (EXCEPT HR) */
  canRoleCommunicate(role: UserRole): boolean {
    if (role === 'HR') {
      return false; // HR is explicitly excluded from sales lead calls & messaging
    }
    return true; // SUPER_ADMIN, ADMIN, MANAGER, TEAM_LEADER, SALES_EXEC allowed
  }

  /** Fetch all saved WhatsApp templates (defaults + admin customizations) */
  async getTemplates(): Promise<WhatsAppTemplate[]> {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        let parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          let migrated = false;
          parsed = parsed.map((tpl: WhatsAppTemplate) => {
            if (tpl.text && /DAS CRM/i.test(tpl.text)) {
              migrated = true;
              return {
                ...tpl,
                text: tpl.text
                  .replace(/our DAS CRM solution/gi, '{product}')
                  .replace(/DAS CRM solution/gi, '{product}')
                  .replace(/customized CRM proposal/gi, 'customized proposal')
                  .replace(/DAS CRM Suite/gi, '{product}')
                  .replace(/DAS CRM/gi, 'our team'),
              };
            }
            return tpl;
          });
          if (migrated) {
            try {
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
            } catch (_) {}
          }
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_TEMPLATES;
  }

  /** Save customized template list (Admin only) */
  async saveTemplates(templates: WhatsAppTemplate[]): Promise<boolean> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
      return true;
    } catch {
      return false;
    }
  }

  /** Add or update template */
  async upsertTemplate(template: WhatsAppTemplate): Promise<WhatsAppTemplate[]> {
    const list = await this.getTemplates();
    const existingIndex = list.findIndex(t => t.id === template.id);
    if (existingIndex >= 0) {
      list[existingIndex] = template;
    } else {
      list.push(template);
    }
    await this.saveTemplates(list);
    return list;
  }

  /** Increment usage count for a template */
  async incrementUsage(templateId: string): Promise<void> {
    try {
      const list = await this.getTemplates();
      const target = list.find(t => t.id === templateId);
      if (target) {
        target.usageCount = (target.usageCount || 0) + 1;
        await this.saveTemplates(list);
      }
    } catch (_) {}
  }

  /** Launch Direct WhatsApp app with pre-filled message */
  async sendDirectWhatsApp(phone: string, messageText: string, leadName: string) {
    const cleaned = this.cleanPhone(phone);
    if (!cleaned) {
      Alert.alert('Invalid Phone', 'No valid phone number found for WhatsApp.');
      return;
    }

    const encoded = encodeURIComponent(messageText);
    const nativeUrl = `whatsapp://send?phone=${cleaned}&text=${encoded}`;
    const webUrl = `https://wa.me/${cleaned}?text=${encoded}`;

    try {
      const canNative = await Linking.canOpenURL('whatsapp://send');
      if (canNative) {
        await Linking.openURL(nativeUrl);
      } else {
        await Linking.openURL(webUrl).catch(() => {
          Alert.alert('WhatsApp Not Installed', `Direct message to ${leadName} (+${cleaned}):\n\n"${messageText}"`);
        });
      }
    } catch {
      await Linking.openURL(webUrl).catch(() => {
        Alert.alert('WhatsApp Message Ready', `Message to ${leadName} (+${cleaned}):\n\n"${messageText}"`);
      });
    }
  }
}

export const whatsappTemplateEngine = new WhatsAppTemplateEngine();
