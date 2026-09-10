'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppLanguage = 'en' | 'hi' | 'hinglish';

export interface LanguageTranslations {
  // Navigation & Headers
  backToMenu: string;
  preferencesTitle: string;
  workspaceSettingsTitle: string;
  workspaceSettingsSub: string;

  // Language Section
  languageSectionTitle: string;
  languageSectionSub: string;
  english: string;
  hindi: string;
  hinglish: string;
  defaultBadge: string;

  // Toggle Settings
  pushAlertsTitle: string;
  pushAlertsDesc: string;
  darkModeTitle: string;
  darkModeDesc: string;
  biometricTitle: string;
  biometricDesc: string;
  gpsTitle: string;
  gpsDesc: string;
  offlineSyncTitle: string;
  offlineSyncDesc: string;

  // Actions & Alerts
  savePreferences: string;
  saving: string;
  savedSuccessTitle: string;
  savedSuccessMsg: string;
  languageSwitchedMsg: string;

  // 📱 Bottom Tab Navigation
  tabHome: string;
  tabLeads: string;
  tabEmployees: string;
  tabMenu: string;
  tabAttendance: string;

  // 🧭 Top Header & Roles
  headerRolePrefix: string;
  headerOnline: string;

  // ☰ Left Drawer Navigation
  drawerAppTitle: string;
  drawerViewProfile: string;
  drawerQuickLaunch: string;
  drawerWorkspaceModules: string;
  drawerSystemConfig: string;
  drawerProfile: string;
  drawerProducts: string;
  drawerTasks: string;
  drawerWorkflowBuilder: string;
  drawerReports: string;
  drawerNotifications: string;
  drawerSettings: string;
  drawerSupport: string;
  drawerAppUpdates: string;
  drawerSignOut: string;
  drawerOnline: string;

  // 🔔 Notifications Modal
  notifTitle: string;
  notifMarkAllRead: string;
  notifEmpty: string;
  notifClose: string;

  // 🎛️ Enterprise Menu & 18 Modules
  menuTitle: string;
  menuSub: string;
  modulesCountBadge: string;
  modProducts: string;
  modQuotes: string;
  modComms: string;
  modWaTemplates: string;
  modEmail: string;
  modAiControl: string;
  modAiHub: string;
  modPdfCatalog: string;
  modReports: string;
  modAutomations: string;
  modImportExport: string;
  modAttendance: string;
  modDeals: string;
  modGoals: string;
  modInterviews: string;
  modNoticeBoard: string;
  modSettings: string;
  modProfile: string;
  modSupport: string;

  // 📊 Dashboard Quick Metrics
  dashTitle: string;
  dashSub: string;
  wonRevenue: string;
  activePipeline: string;
  totalLeads: string;
  conversionRate: string;
  todayMeetings: string;
  workforceToday: string;
  quickActions: string;
  exportReport: string;
  openReportsHub: string;

  // 👥 Employee Structure Screen
  empStructureTitle: string;
  empTotalUsers: string;
  empSeatsAssigned: string;
  empTabAssigned: string;
  empTabUnassigned: string;
  empInspectControl: string;
  empAssignRole: string;
  empRegisteredBadge: string;
  empAssignedBanner: string;

  // 🎯 Leads Screen
  leadsFunnelTab: string;
  leadsCollectionsTab: string;
  leadsSearchPlaceholder: string;
  leadsFilterAll: string;
  leadsFilterNew: string;
  leadsFilterQualified: string;
  leadsFilterNegotiation: string;
  leadsFilterWon: string;

  // ⏱️ Attendance Screen
  attTabMark: string;
  attTabOverview: string;
  attPunchIn: string;
  attPunchOut: string;
  attPresent: string;
  attAbsent: string;
  attHalfDay: string;
  attLeave: string;
  attServerTime: string;
}

export const TRANSLATIONS: Record<AppLanguage, LanguageTranslations> = {
  en: {
    backToMenu: '← Back to Menu',
    preferencesTitle: 'System & App Preferences',
    workspaceSettingsTitle: '⚙️ Workspace Settings',
    workspaceSettingsSub: 'Configure notifications, offline sync, security & API credentials',

    languageSectionTitle: '🌐 App Language',
    languageSectionSub: 'Select your preferred interface and communication language',
    english: 'English',
    hindi: 'Hindi (हिन्दी)',
    hinglish: 'Hinglish (हिंग्लिश)',
    defaultBadge: 'Default',

    pushAlertsTitle: '🔔 Push Notification Alerts',
    pushAlertsDesc: 'Receive instant lead assignments, reminders and team notices',
    darkModeTitle: '🌙 Dark Mode Theme',
    darkModeDesc: 'Switch between sleek dark interface and daylight mode',
    biometricTitle: '🔒 Biometric / Passcode Lock',
    biometricDesc: 'Protect enterprise CRM data with Fingerprint or Face ID',
    gpsTitle: '📍 High Accuracy GPS Telemetry',
    gpsDesc: 'Auto-verify attendance geofencing and field client visits',
    offlineSyncTitle: '⚡ Offline In-Memory Sync',
    offlineSyncDesc: 'Cache leads and draft proposals when offline',

    savePreferences: 'Save Preferences',
    saving: 'Saving Preferences...',
    savedSuccessTitle: '✅ Preferences Saved',
    savedSuccessMsg: 'Your system and workspace preferences have been updated successfully.',
    languageSwitchedMsg: 'App language changed to English.',

    // Bottom Tabs
    tabHome: 'Home',
    tabLeads: 'Leads',
    tabEmployees: 'Employees',
    tabMenu: 'Menu',
    tabAttendance: 'Attendance',

    // Header & Roles
    headerRolePrefix: 'ROLE',
    headerOnline: 'Online',

    // Left Drawer
    drawerAppTitle: 'DAS CRM Enterprise',
    drawerViewProfile: '👤 View Full Profile →',
    drawerQuickLaunch: 'QUICK LAUNCH',
    drawerWorkspaceModules: 'WORKSPACE MODULES',
    drawerSystemConfig: 'SYSTEM & SETTINGS',
    drawerProfile: 'My Profile & Security',
    drawerProducts: 'Products & Quotations',
    drawerTasks: 'My Tasks & Reminders',
    drawerWorkflowBuilder: 'Workflow Automations',
    drawerReports: 'Reports & Analytics',
    drawerNotifications: 'Notification Center',
    drawerSettings: 'App Preferences & Language',
    drawerSupport: 'Help Desk & Support',
    drawerAppUpdates: 'Check for App Updates',
    drawerSignOut: 'Sign Out of DAS CRM',
    drawerOnline: 'Active Now',

    // Notifications
    notifTitle: '🔔 Task & Notification Alerts',
    notifMarkAllRead: 'Mark All Read',
    notifEmpty: 'No unread notifications right now',
    notifClose: 'Close',

    // Menu Modules
    menuTitle: 'Enterprise Workspace Menu',
    menuSub: 'Access all 18 modules & system toolkits',
    modulesCountBadge: '18 MODULES',
    modProducts: 'Product Catalogue',
    modQuotes: 'Quotations & Invoices',
    modComms: 'WhatsApp Cloud',
    modWaTemplates: 'WhatsApp Direct Templates',
    modEmail: 'Email Marketing',
    modAiControl: 'AI Customization',
    modAiHub: 'AI Hub',
    modPdfCatalog: 'PDF Catalogue',
    modReports: 'Reports & Analytics',
    modAutomations: 'Workflow & Automations',
    modImportExport: 'Lead Import History',
    modAttendance: 'Attendance & Geofencing',
    modDeals: 'Deals Pipeline',
    modGoals: 'Goals & Targets',
    modInterviews: 'Interview for Hiring',
    modNoticeBoard: 'The Notice Board',
    modSettings: 'Settings & Language',
    modProfile: 'Company Profile Settings',
    modSupport: 'Support & Help Desk',

    // Dashboard Metrics
    dashTitle: 'Tenant Admin Command Center',
    dashSub: 'Live operations, lead funnel routing & workforce telemetry',
    wonRevenue: 'Won Revenue',
    activePipeline: 'Active Pipeline',
    totalLeads: 'Total Leads',
    conversionRate: 'Conversion Rate',
    todayMeetings: 'Scheduled Meetings Today',
    workforceToday: 'Workforce & Attendance Today',
    quickActions: 'Admin Quick Actions',
    exportReport: '📥 Export Report CSV',
    openReportsHub: '🚀 Open Reports Hub →',

    // 👥 Employee Structure Screen
    empStructureTitle: '👥 Employee Structure',
    empTotalUsers: 'Total Users',
    empSeatsAssigned: 'Seats Assigned',
    empTabAssigned: 'Assigned',
    empTabUnassigned: 'Unassigned',
    empInspectControl: 'Inspect & Control',
    empAssignRole: 'Assign Role',
    empRegisteredBadge: 'Registered',
    empAssignedBanner: 'These users have an active CRM role. Tap Inspect & Control to manage their profile.',

    // 🎯 Leads Screen
    leadsFunnelTab: '⚡ Lead Funnel',
    leadsCollectionsTab: '🎯 Leads Collections',
    leadsSearchPlaceholder: 'Search leads by name, phone, company, status...',
    leadsFilterAll: 'ALL',
    leadsFilterNew: 'NEW LEAD',
    leadsFilterQualified: 'QUALIFIED',
    leadsFilterNegotiation: 'IN NEGOTIATION',
    leadsFilterWon: 'WON',

    // ⏱️ Attendance Screen
    attTabMark: 'Mark Attendance',
    attTabOverview: 'Monthly Records',
    attPunchIn: 'Punch In Now',
    attPunchOut: 'Punch Out Now',
    attPresent: 'Present',
    attAbsent: 'Absent',
    attHalfDay: 'Half Day',
    attLeave: 'Leave',
    attServerTime: 'Server Time',
  },

  hi: {
    backToMenu: '← मेनू पर वापस जाएं',
    preferencesTitle: 'सिस्टम और ऐप प्राथमिकताएं',
    workspaceSettingsTitle: '⚙️ वर्कस्पेस सेटिंग्स',
    workspaceSettingsSub: 'सूचनाएं, ऑफ़लाइन सिंक, सुरक्षा और क्रेडेंशियल्स प्रबंधित करें',

    languageSectionTitle: '🌐 ऐप भाषा चयन',
    languageSectionSub: 'अपनी पसंदीदा इंटरफ़ेस और संचार भाषा चुनें',
    english: 'English (अंग्रेज़ी)',
    hindi: 'हिन्दी',
    hinglish: 'हिंग्लिश',
    defaultBadge: 'डिफ़ॉल्ट',

    pushAlertsTitle: '🔔 पुश नोटिफिकेशन अलर्ट्स',
    pushAlertsDesc: 'नए लीड असाइनमेंट, रिमाइंडर और टीम नोटिस तुरंत प्राप्त करें',
    darkModeTitle: '🌙 डार्क मोड थीम',
    darkModeDesc: 'आकर्षक डार्क मोड और लाइट मोड के बीच स्विच करें',
    biometricTitle: '🔒 बायोमेट्रिक / पासकोड लॉक',
    biometricDesc: 'फ़िंगरप्रिंट या फ़ेस आईडी से एंटरप्राइज़ डेटा सुरक्षित रखें',
    gpsTitle: '📍 हाई एक्यूरेसी जीपीएस टेलीमेट्री',
    gpsDesc: 'अटेंडेंस जियोफेंसिंग और फ़ील्ड विज़िट को ऑटो-वेरीफाई करें',
    offlineSyncTitle: '⚡ ऑफ़लाइन इन-मेमोरी सिंक',
    offlineSyncDesc: 'इंटरनेट न होने पर भी लीड्स और ड्राफ्ट सुरक्षित रखें',

    savePreferences: 'प्राथमिकताएं सहेजें',
    saving: 'सहेजा जा रहा है...',
    savedSuccessTitle: '✅ प्राथमिकताएं सहेजी गईं',
    savedSuccessMsg: 'आपकी सिस्टम और वर्कस्पेस प्राथमिकताएं सफलतापूर्वक अपडेट हो गई हैं।',
    languageSwitchedMsg: 'ऐप की भाषा बदलकर हिन्दी कर दी गई है।',

    // Bottom Tabs
    tabHome: 'होम',
    tabLeads: 'लीड्स',
    tabEmployees: 'कर्मचारी',
    tabMenu: 'मेनू',
    tabAttendance: 'उपस्थिति',

    // Header & Roles
    headerRolePrefix: 'भूमिका',
    headerOnline: 'ऑनलाइन',

    // Left Drawer
    drawerAppTitle: 'डीएएस सीआरएम एंटरप्राइज़',
    drawerViewProfile: '👤 पूर्ण प्रोफ़ाइल देखें →',
    drawerQuickLaunch: 'त्वरित लॉन्च',
    drawerWorkspaceModules: 'वर्कस्पेस मॉड्यूल',
    drawerSystemConfig: 'सिस्टम और सेटिंग्स',
    drawerProfile: 'मेरी प्रोफ़ाइल और सुरक्षा',
    drawerProducts: 'उत्पाद और कोटेशन',
    drawerTasks: 'कार्य और रिमाइंडर',
    drawerWorkflowBuilder: 'वर्कफ़्लो ऑटोमेशन',
    drawerReports: 'रिपोर्ट और विश्लेषण',
    drawerNotifications: 'सूचना केंद्र',
    drawerSettings: 'ऐप सेटिंग्स और भाषा',
    drawerSupport: 'सहायता केंद्र',
    drawerAppUpdates: 'ऐप अपडेट जांचें',
    drawerSignOut: 'डीएएस सीआरएम से लॉग आउट करें',
    drawerOnline: 'सक्रिय हैं',

    // Notifications
    notifTitle: '🔔 कार्य और सूचना अलर्ट',
    notifMarkAllRead: 'सभी पढ़ें',
    notifEmpty: 'अभी कोई अपठित सूचना नहीं है',
    notifClose: 'बंद करें',

    // Menu Modules
    menuTitle: 'एंटरप्राइज़ वर्कस्पेस मेनू',
    menuSub: 'सभी 18 मॉड्यूल और सिस्टम टूलकिट तक पहुँचें',
    modulesCountBadge: '18 मॉड्यूल',
    modProducts: 'उत्पाद सूची (कैटलॉग)',
    modQuotes: 'कोटेशन और इनवॉइस',
    modComms: 'व्हाट्सएप क्लाउड',
    modWaTemplates: 'व्हाट्सएप डायरेक्ट टेम्प्लेट',
    modEmail: 'ईमेल मार्केटिंग',
    modAiControl: 'एआई कस्टमाइज़ेशन',
    modAiHub: 'एआई हब',
    modPdfCatalog: 'पीडीएफ कैटलॉग',
    modReports: 'रिपोर्ट और विश्लेषण',
    modAutomations: 'वर्कफ़्लो और ऑटोमेशन',
    modImportExport: 'लीड आयात इतिहास',
    modAttendance: 'उपस्थिति और जियोफेंसिंग',
    modDeals: 'डील पाइपलाइन',
    modGoals: 'लक्ष्य और लक्ष्य निर्धारण',
    modInterviews: 'भर्ती साक्षात्कार',
    modNoticeBoard: 'कंपनी सूचना पट्ट',
    modSettings: 'सेटिंग्स और भाषा',
    modProfile: 'कंपनी प्रोफ़ाइल सेटिंग्स',
    modSupport: 'सहायता और हेल्प डेस्क',

    // Dashboard Metrics
    dashTitle: 'एडमिन कमांड सेंटर',
    dashSub: 'लाइव ऑपरेशंस, लीड फ़नल रूटिंग और वर्कफ़्लो टेलीमेट्री',
    wonRevenue: 'अर्जित राजस्व',
    activePipeline: 'सक्रिय पाइपलाइन',
    totalLeads: 'कुल लीड्स',
    conversionRate: 'रूपांतरण दर',
    todayMeetings: 'आज की निर्धारित बैठकें',
    workforceToday: 'कार्यबल और उपस्थिति',
    quickActions: 'त्वरित व्यवस्थापक क्रियाएं',
    exportReport: '📥 रिपोर्ट निर्यात करें (CSV)',
    openReportsHub: '🚀 रिपोर्ट हब खोलें →',

    // 👥 Employee Structure Screen
    empStructureTitle: '👥 कर्मचारी संरचना',
    empTotalUsers: 'कुल उपयोगकर्ता',
    empSeatsAssigned: 'सीटें आवंटित',
    empTabAssigned: 'आवंटित',
    empTabUnassigned: 'गैर-आवंटित',
    empInspectControl: 'निरीक्षण व नियंत्रण',
    empAssignRole: 'भूमिका सौंपें',
    empRegisteredBadge: 'पंजीकृत',
    empAssignedBanner: 'इन उपयोगकर्ताओं के पास सक्रिय भूमिका है। प्रोफ़ाइल प्रबंधित करने के लिए टैप करें।',

    // 🎯 Leads Screen
    leadsFunnelTab: '⚡ लीड फ़नल',
    leadsCollectionsTab: '🎯 लीड संग्रह',
    leadsSearchPlaceholder: 'नाम, फ़ोन, कंपनी द्वारा लीड खोजें...',
    leadsFilterAll: 'सभी',
    leadsFilterNew: 'नई लीड',
    leadsFilterQualified: 'योग्य',
    leadsFilterNegotiation: 'बातचीत में',
    leadsFilterWon: 'सफल (WON)',

    // ⏱️ Attendance Screen
    attTabMark: 'उपस्थिति दर्ज करें',
    attTabOverview: 'मासिक रिकॉर्ड्स',
    attPunchIn: 'पंच इन करें',
    attPunchOut: 'पंच आउट करें',
    attPresent: 'उपस्थित',
    attAbsent: 'अनुपस्थित',
    attHalfDay: 'आधा दिन',
    attLeave: 'छुट्टी',
    attServerTime: 'सर्वर समय',
  },

  hinglish: {
    backToMenu: '← Menu Par Wapas Jayein',
    preferencesTitle: 'System & App Preferences',
    workspaceSettingsTitle: '⚙️ Workspace Settings',
    workspaceSettingsSub: 'Notifications, offline sync, security aur credentials manage karein',

    languageSectionTitle: '🌐 App Language Select Karein',
    languageSectionSub: 'Apni pasandida interface aur communication language choose karein',
    english: 'English',
    hindi: 'Hindi (हिन्दी)',
    hinglish: 'Hinglish (Roman Hindi)',
    defaultBadge: 'Default',

    pushAlertsTitle: '🔔 Push Notification Alerts',
    pushAlertsDesc: 'Lead assignment alerts, follow-up reminders aur team updates paayein',
    darkModeTitle: '🌙 Dark Mode Theme',
    darkModeDesc: 'Sleek dark theme aur daylight view ke beech switch karein',
    biometricTitle: '🔒 Biometric / Passcode Lock',
    biometricDesc: 'Fingerprint ya Face ID se client data ko secure rakhein',
    gpsTitle: '📍 High Accuracy GPS Telemetry',
    gpsDesc: 'Attendance geofence aur field meeting location verify karein',
    offlineSyncTitle: '⚡ Offline In-Memory Sync',
    offlineSyncDesc: 'Internet slow hone par bhi draft aur leads ko cache karein',

    savePreferences: 'Preferences Save Karein',
    saving: 'Saving...',
    savedSuccessTitle: '✅ Preferences Saved',
    savedSuccessMsg: 'Aapki system aur workspace settings successfully update ho gayi hain.',
    languageSwitchedMsg: 'App language Hinglish me switch ho gayi hai.',

    // Bottom Tabs
    tabHome: 'Home',
    tabLeads: 'Leads',
    tabEmployees: 'Staff',
    tabMenu: 'Menu',
    tabAttendance: 'Attendance',

    // Header & Roles
    headerRolePrefix: 'ROLE',
    headerOnline: 'Online',

    // Left Drawer
    drawerAppTitle: 'DAS CRM Enterprise',
    drawerViewProfile: '👤 Full Profile Dekhein →',
    drawerQuickLaunch: 'QUICK LAUNCH',
    drawerWorkspaceModules: 'WORKSPACE MODULES',
    drawerSystemConfig: 'SYSTEM & SETTINGS',
    drawerProfile: 'My Profile & Security',
    drawerProducts: 'Products & Quotations',
    drawerTasks: 'My Tasks & Reminders',
    drawerWorkflowBuilder: 'Workflow Automations',
    drawerReports: 'Reports & Analytics',
    drawerNotifications: 'Notification Center',
    drawerSettings: 'System & App Preferences',
    drawerSupport: 'Help Desk & Support',
    drawerAppUpdates: 'Check App Updates',
    drawerSignOut: 'Sign Out Karein',
    drawerOnline: 'Active Now',

    // Notifications
    notifTitle: '🔔 Task & Notification Alerts',
    notifMarkAllRead: 'Sabhi Read Mark Karein',
    notifEmpty: 'Abhi koi unread notification nahi hai',
    notifClose: 'Close',

    // Menu Modules
    menuTitle: 'Enterprise Workspace Menu',
    menuSub: 'Sabhi 18 modules aur system toolkits access karein',
    modulesCountBadge: '18 MODULES',
    modProducts: 'Product Catalogue',
    modQuotes: 'Quotations & Invoices',
    modComms: 'WhatsApp Cloud',
    modWaTemplates: 'WhatsApp Direct Templates',
    modEmail: 'Email Marketing',
    modAiControl: 'AI Customization',
    modAiHub: 'AI Hub',
    modPdfCatalog: 'PDF Catalogue',
    modReports: 'Reports & Analytics',
    modAutomations: 'Workflow & Automations',
    modImportExport: 'Lead Import History',
    modAttendance: 'Attendance & Geofencing',
    modDeals: 'Deals Pipeline',
    modGoals: 'Goals & Targets',
    modInterviews: 'Hiring Interviews',
    modNoticeBoard: 'The Notice Board',
    modSettings: 'Settings & Language',
    modProfile: 'Company Profile Settings',
    modSupport: 'Support & Help Desk',

    // Dashboard Metrics
    dashTitle: 'Tenant Admin Command Center',
    dashSub: 'Live operations, lead funnel routing & workforce telemetry',
    wonRevenue: 'Won Revenue',
    activePipeline: 'Active Pipeline',
    totalLeads: 'Total Leads',
    conversionRate: 'Conversion Rate',
    todayMeetings: 'Today Meetings',
    workforceToday: 'Workforce Attendance',
    quickActions: 'Admin Quick Actions',
    exportReport: '📥 Export Report CSV',
    openReportsHub: '🚀 Open Reports Hub →',

    // 👥 Employee Structure Screen
    empStructureTitle: '👥 Employee Structure',
    empTotalUsers: 'Total Users',
    empSeatsAssigned: 'Seats Assigned',
    empTabAssigned: 'Assigned',
    empTabUnassigned: 'Unassigned',
    empInspectControl: 'Inspect & Control',
    empAssignRole: 'Role Assign Karein',
    empRegisteredBadge: 'Registered',
    empAssignedBanner: 'In users ke paas active CRM role hai. Profile manage karne ke liye tap karein.',

    // 🎯 Leads Screen
    leadsFunnelTab: '⚡ Lead Funnel',
    leadsCollectionsTab: '🎯 Leads Collections',
    leadsSearchPlaceholder: 'Name, phone, company se lead search karein...',
    leadsFilterAll: 'ALL',
    leadsFilterNew: 'NEW LEAD',
    leadsFilterQualified: 'QUALIFIED',
    leadsFilterNegotiation: 'IN NEGOTIATION',
    leadsFilterWon: 'WON',

    // ⏱️ Attendance Screen
    attTabMark: 'Attendance Lagayein',
    attTabOverview: 'Monthly Records',
    attPunchIn: 'Punch In Karein',
    attPunchOut: 'Punch Out Karein',
    attPresent: 'Present',
    attAbsent: 'Absent',
    attHalfDay: 'Half Day',
    attLeave: 'Leave',
    attServerTime: 'Server Time',
  },
};

export interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => Promise<void>;
  t: LanguageTranslations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_LANG_KEY = 'das_crm_app_language_v1';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('en');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_LANG_KEY);
        if (saved === 'en' || saved === 'hi' || saved === 'hinglish') {
          setLanguageState(saved);
        }
      } catch (err) {
        console.warn('Failed to load language preference:', err);
      } finally {
        setIsLoaded(true);
      }
    };
    loadSavedLanguage();
  }, []);

  const setLanguage = useCallback(async (lang: AppLanguage) => {
    try {
      await AsyncStorage.setItem(STORAGE_LANG_KEY, lang);
      setLanguageState(lang);
    } catch (err) {
      console.warn('Failed to save language preference:', err);
    }
  }, []);

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'en',
      setLanguage: async () => {},
      t: TRANSLATIONS.en,
    };
  }
  return context;
}

