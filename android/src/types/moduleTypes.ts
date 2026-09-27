/**
 * moduleTypes.ts — DAS CRM Android
 * Shared module-key type definitions used across screens and stores.
 * Extracted here to avoid circular/heavy dependencies between screens.
 */

export type ModuleKey =
  | 'PRODUCTS'
  | 'QUOTES'
  | 'COMMUNICATIONS'
  | 'WA_TEMPLATES'
  | 'EXTRA_EMAIL'
  | 'AI_CONTROL'
  | 'AI_HUB'
  | 'PDF_CATALOG'
  | 'REPORTS'
  | 'AUTOMATIONS'
  | 'DATABASE'
  | 'IMPORT_EXPORT'
  | 'ATTENDANCE'
  | 'DEALS'
  | 'GOALS'
  | 'INTERVIEWS'
  | 'UPCOMING_COMMS'
  | 'SETTINGS'
  | 'PROFILE'
  | 'SUPPORT'
  | 'ABOUT'
  | 'ADMIN_CONTROL';
