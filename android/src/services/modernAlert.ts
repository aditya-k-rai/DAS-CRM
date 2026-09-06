/**
 * modernAlert.ts — DAS CRM Android
 * Global Modern Alert & Dialog Controller.
 * Intercepts React Native's default Alert.alert to render sleek,
 * 60fps hardware-accelerated animated glassmorphic dialogs matching
 * the DAS CRM dark cyber-enterprise design system.
 */

import { Alert, AlertButton, AlertOptions } from 'react-native';

export type ModernAlertType = 'warning' | 'info' | 'success' | 'error' | 'quota' | 'webhook' | 'default';

export interface TelemetryItem {
  id: string;
  label: string;
  value: string;
  statusDotColor?: string;
}

export interface ModernAlertConfig {
  id: string;
  title: string;
  message?: string;
  type: ModernAlertType;
  icon?: string;
  badgeText?: string;
  accentColor: string;
  telemetryItems?: TelemetryItem[];
  quotaInfo?: {
    used: number;
    total: number;
    percent: number;
  };
  buttons: AlertButton[];
  options?: AlertOptions;
}

type AlertListener = (config: ModernAlertConfig | null) => void;

class ModernAlertManager {
  private listener: AlertListener | null = null;
  private isOverridden = false;
  private nativeAlert = Alert.alert;

  public registerListener(fn: AlertListener) {
    this.listener = fn;
    return () => {
      if (this.listener === fn) {
        this.listener = null;
      }
    };
  }

  public show(config: Partial<ModernAlertConfig> & { title: string }) {
    const fullConfig = this.buildConfig(
      config.title,
      config.message,
      config.buttons,
      config.options,
      config.type,
      config.icon
    );

    if (this.listener) {
      this.listener(fullConfig);
    } else {
      // Fallback if modal component not mounted yet
      this.nativeAlert(
        config.title,
        config.message,
        config.buttons,
        config.options
      );
    }
  }

  public hide() {
    if (this.listener) {
      this.listener(null);
    }
  }

  public initGlobalOverride() {
    if (this.isOverridden) return;
    this.isOverridden = true;

    Alert.alert = (
      title: string,
      message?: string,
      buttons?: AlertButton[],
      options?: AlertOptions
    ) => {
      const config = this.buildConfig(title, message, buttons, options);
      if (this.listener) {
        this.listener(config);
      } else {
        this.nativeAlert(title, message, buttons, options);
      }
    };
  }

  private buildConfig(
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions,
    customType?: ModernAlertType,
    customIcon?: string
  ): ModernAlertConfig {
    const defaultButtons: AlertButton[] = buttons && buttons.length > 0
      ? buttons
      : [{ text: 'OK', style: 'default' }];

    // Auto-detect type, icon and accent color
    const detected = customType
      ? this.getTypePresets(customType, customIcon)
      : this.classifyAlert(title, message);

    // Parse message for telemetry bullet points
    const telemetryItems = this.parseTelemetry(message);

    // Detect quota percentage if title or message indicates quota
    const quotaInfo = this.extractQuota(title, message);

    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: title.replace(/^[^\w\s]{1,3}\s*/, '').trim(), // clean leading emoji if redundant
      message: this.cleanMessage(message),
      type: detected.type,
      icon: customIcon || detected.icon,
      badgeText: detected.badgeText,
      accentColor: detected.accentColor,
      telemetryItems,
      quotaInfo,
      buttons: defaultButtons,
      options,
    };
  }

  private classifyAlert(title: string, message?: string): {
    type: ModernAlertType;
    icon: string;
    badgeText: string;
    accentColor: string;
  } {
    const combined = `${title} ${message || ''}`.toLowerCase();

    // 1. Quota Exceeded & Limits
    if (
      combined.includes('quota') ||
      combined.includes('limit') ||
      combined.includes('allocated all') ||
      combined.includes('upgrade your plan') ||
      combined.includes('seat')
    ) {
      return {
        type: 'quota',
        icon: '⚠️',
        badgeText: 'SUBSCRIPTION QUOTA',
        accentColor: '#f59e0b', // Amber
      };
    }

    // 2. Webhook & Ingestion Telemetry
    if (
      combined.includes('webhook') ||
      combined.includes('facebook') ||
      combined.includes('google ads') ||
      combined.includes('sheets ingress') ||
      combined.includes('conversion api') ||
      combined.includes('ingested') ||
      combined.includes('payload')
    ) {
      return {
        type: 'webhook',
        icon: '🔷',
        badgeText: 'INGESTION TELEMETRY',
        accentColor: '#38bdf8', // Sky Blue
      };
    }

    // 3. Destructive / Deletion
    if (
      combined.includes('delete') ||
      combined.includes('remove') ||
      combined.includes('purge') ||
      combined.includes('cannot be undone')
    ) {
      return {
        type: 'error',
        icon: '🗑️',
        badgeText: 'CONFIRM ACTION',
        accentColor: '#ef4444', // Red
      };
    }

    // 4. Error / Lock / Denied
    if (
      combined.includes('error') ||
      combined.includes('failed') ||
      combined.includes('denied') ||
      combined.includes('lock') ||
      combined.includes('cooldown') ||
      combined.includes('invalid')
    ) {
      return {
        type: 'warning',
        icon: combined.includes('lock') ? '🔒' : '❌',
        badgeText: combined.includes('lock') ? 'SECURITY LOCK' : 'ALERT NOTICE',
        accentColor: '#f97316', // Orange
      };
    }

    // 5. Success / Activated / Saved
    if (
      combined.includes('success') ||
      combined.includes('saved') ||
      combined.includes('activated') ||
      combined.includes('created') ||
      combined.includes('updated') ||
      combined.includes('assigned') ||
      combined.includes('ready') ||
      title.includes('✅')
    ) {
      return {
        type: 'success',
        icon: '✅',
        badgeText: 'SUCCESS',
        accentColor: '#10b981', // Emerald
      };
    }

    // 6. Default / Info
    return {
      type: 'default',
      icon: '⚡',
      badgeText: 'SYSTEM NOTICE',
      accentColor: '#6366f1', // Indigo
    };
  }

  private getTypePresets(type: ModernAlertType, customIcon?: string): {
    type: ModernAlertType;
    icon: string;
    badgeText: string;
    accentColor: string;
  } {
    switch (type) {
      case 'quota':
        return { type, icon: customIcon || '⚠️', badgeText: 'SUBSCRIPTION QUOTA', accentColor: '#f59e0b' };
      case 'webhook':
        return { type, icon: customIcon || '🔷', badgeText: 'INGESTION TELEMETRY', accentColor: '#38bdf8' };
      case 'success':
        return { type, icon: customIcon || '✅', badgeText: 'SUCCESS', accentColor: '#10b981' };
      case 'error':
        return { type, icon: customIcon || '❌', badgeText: 'ALERT NOTICE', accentColor: '#ef4444' };
      case 'warning':
        return { type, icon: customIcon || '⚠️', badgeText: 'WARNING', accentColor: '#f97316' };
      default:
        return { type: 'default', icon: customIcon || '⚡', badgeText: 'SYSTEM NOTICE', accentColor: '#6366f1' };
    }
  }

  private parseTelemetry(message?: string): TelemetryItem[] | undefined {
    if (!message) return undefined;
    const lines = message.split('\n');
    const items: TelemetryItem[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
        const content = trimmed.replace(/^[•\-\*]\s*/, '');
        if (content.includes(':')) {
          const parts = content.split(':');
          const label = parts[0].trim();
          const val = parts.slice(1).join(':').trim();
          let dotColor = '#38bdf8';
          if (val.includes('200') || val.toLowerCase().includes('ok') || val.toLowerCase().includes('active') || val.toLowerCase().includes('enabled')) {
            dotColor = '#10b981';
          }
          items.push({
            id: `tel_${items.length}`,
            label,
            value: val,
            statusDotColor: dotColor,
          });
        } else {
          items.push({
            id: `tel_${items.length}`,
            label: content,
            value: '',
            statusDotColor: '#38bdf8',
          });
        }
      }
    }

    return items.length > 0 ? items : undefined;
  }

  private extractQuota(title: string, message?: string) {
    if (!message) return undefined;
    const combined = `${title} ${message}`;
    // Match "10 active users. You have already allocated all 10 seats" or "10/10"
    const match = combined.match(/(\d+)\s*(?:\/|out of|allocated all)\s*(\d+)/i) ||
                  combined.match(/limit is (\d+) active users.*allocated all (\d+) seats/i);

    if (match) {
      const num1 = parseInt(match[1], 10);
      const num2 = parseInt(match[2], 10);
      const total = Math.max(num1, num2);
      const used = Math.min(num1, num2) === 0 ? total : Math.max(num1, num2);
      const percent = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 100;
      return { used, total, percent };
    }

    if (combined.toLowerCase().includes('quota') || combined.toLowerCase().includes('limit')) {
      return { used: 10, total: 10, percent: 100 };
    }

    return undefined;
  }

  private cleanMessage(message?: string): string {
    if (!message) return '';
    // If message contains telemetry bullet lines, extract only the preamble text
    const lines = message.split('\n');
    const cleanLines = lines.filter(l => {
      const t = l.trim();
      return !t.startsWith('•') && !t.startsWith('-') && !t.startsWith('*');
    });
    return cleanLines.join('\n').trim();
  }
}

export const ModernAlert = new ModernAlertManager();

export const initModernAlertOverride = () => {
  ModernAlert.initGlobalOverride();
};
