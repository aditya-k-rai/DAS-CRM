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

export interface WhatsAppTemplate {
  id: string;
  title: string;
  category: 'OUTREACH' | 'PROPOSAL' | 'FOLLOWUP' | 'PROMOTION';
  text: string;
  isDefault?: boolean;
}

const STORAGE_KEY = 'das_whatsapp_custom_templates_v1';

export const DEFAULT_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'tpl_1',
    title: '🌱 Initial Outreach',
    category: 'OUTREACH',
    text: "Hi {name}, I got to know that you inquired about our DAS CRM solution for {company}. Let's connect for a quick 5-minute call today!",
    isDefault: true,
  },
  {
    id: 'tpl_2',
    title: '💼 Customized Proposal & Pricing',
    category: 'PROPOSAL',
    text: "Hi {name}, I have prepared the customized CRM quotation of {value} for {company}. Please let me know when you'd like to review it!",
    isDefault: true,
  },
  {
    id: 'tpl_3',
    title: '📞 Quick Follow-Up Call',
    category: 'FOLLOWUP',
    text: "Hi {name}, following up regarding our recent discussion for {company}. Do you have 5 minutes for a quick call today?",
    isDefault: true,
  },
  {
    id: 'tpl_4',
    title: '⚡ Enterprise Update & Demo',
    category: 'PROMOTION',
    text: "Hi {name}, we have launched exclusive automation tools for {company}! Reply to this message to claim your priority demo slot.",
    isDefault: true,
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
}

export const CATALOG_PRODUCTS: ProductItem[] = [];


class WhatsAppTemplateEngine {
  /** Clean phone string (keep country code) */
  cleanPhone(phone: string): string {
    let digits = (phone || '').replace(/[^\d]/g, '');
    if (digits.length === 10) {
      digits = '91' + digits; // Default India 91 prefix for 10-digit numbers
    }
    return digits;
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
    lead: { name: string; company?: string; value?: string },
    product?: ProductItem | null,
    quantity: number = 1
  ): string {
    const leadName = lead.name || 'Valued Customer';
    const company = lead.company || 'your organization';
    const value = lead.value || 'your package';

    let text = (templateText || '')
      .replace(/\{name\}/gi, leadName)
      .replace(/\{LeadName\}/gi, leadName)
      .replace(/\{company\}/gi, company)
      .replace(/\{value\}/gi, value);

    if (product) {
      const { unitPrice, totalPrice, tierLabel } = this.getTieredPrice(product, quantity);

      const productBlock =
        `\n\n📦 *Quotation & Product Details:*` +
        `\n• *Product:* ${product.name}` +
        `\n• *Selected Quantity:* ${quantity} Units / Licenses` +
        `\n• *Pricing Band:* ${product.minPrice} - ${product.maxPrice} per unit` +
        `\n• *Applied Tier:* ${tierLabel}` +
        `\n• *Effective Unit Price:* ₹${unitPrice.toLocaleString('en-IN')}` +
        `\n• *Total Investment:* ₹${totalPrice.toLocaleString('en-IN')}` +
        `\n• *Overview:* ${product.description}` +
        `\n• *Key Features:* ${product.features.join(' | ')}` +
        `\n• *Product Image/Brochure:* ${product.imageUrl}`;

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
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
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
