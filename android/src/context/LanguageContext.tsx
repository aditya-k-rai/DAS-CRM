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
  },
};

interface LanguageContextType {
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

  if (!isLoaded) {
    return <>{children}</>;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
