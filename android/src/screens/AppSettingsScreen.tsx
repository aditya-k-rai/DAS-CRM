import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage, AppLanguage } from '../context/LanguageContext';

const PREF_PUSH_KEY = '@das_crm_pref_push_alerts';
const PREF_BIOMETRIC_KEY = '@das_crm_pref_biometric_lock';
const PREF_GPS_KEY = '@das_crm_pref_gps_telemetry';
const PREF_OFFLINE_SYNC_KEY = '@das_crm_pref_offline_sync';

interface AppSettingsScreenProps {
  onClose?: () => void;
}

export const AppSettingsScreen: React.FC<AppSettingsScreenProps> = ({ onClose }) => {
  const insets = useSafeAreaInsets();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { language, setLanguage, t } = useLanguage();

  // Switch states
  const [pushAlerts, setPushAlerts] = useState(true);
  const [biometricLock, setBiometricLock] = useState(false);
  const [gpsTelemetry, setGpsTelemetry] = useState(true);
  const [offlineSync, setOfflineSync] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const [savedPush, savedBio, savedGps, savedSync] = await Promise.all([
          AsyncStorage.getItem(PREF_PUSH_KEY),
          AsyncStorage.getItem(PREF_BIOMETRIC_KEY),
          AsyncStorage.getItem(PREF_GPS_KEY),
          AsyncStorage.getItem(PREF_OFFLINE_SYNC_KEY),
        ]);

        if (savedPush !== null) setPushAlerts(savedPush === 'true');
        if (savedBio !== null) setBiometricLock(savedBio === 'true');
        if (savedGps !== null) setGpsTelemetry(savedGps === 'true');
        if (savedSync !== null) setOfflineSync(savedSync === 'true');
      } catch (err) {
        console.warn('Failed to load settings preferences:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, []);

  // Theme toggle handler (direct instant theme update)
  const handleDarkModeToggle = (val: boolean) => {
    setTheme(val ? 'dark' : 'light');
  };

  // Language selection handler
  const handleSelectLanguage = async (newLang: AppLanguage) => {
    if (newLang === language) return;
    await setLanguage(newLang);
  };

  // Save all preferences
  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      await Promise.all([
        AsyncStorage.setItem(PREF_PUSH_KEY, String(pushAlerts)),
        AsyncStorage.setItem(PREF_BIOMETRIC_KEY, String(biometricLock)),
        AsyncStorage.setItem(PREF_GPS_KEY, String(gpsTelemetry)),
        AsyncStorage.setItem(PREF_OFFLINE_SYNC_KEY, String(offlineSync)),
      ]);

      Alert.alert(t.savedSuccessTitle, t.savedSuccessMsg);
    } catch (err) {
      console.error('Error saving preferences:', err);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Theme dynamic colors
  const bg = isDark ? '#090d16' : '#f8fafc';
  const cardBg = isDark ? '#0f172a' : '#ffffff';
  const borderColor = isDark ? '#1e293b' : '#e2e8f0';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? '#94a3b8' : '#64748b';
  const backBannerBg = isDark ? '#0f172a' : '#ffffff';

  const LANGUAGE_OPTIONS: { key: AppLanguage; label: string; subLabel: string; flag: string; badge?: string }[] = [
    { key: 'en', label: t.english, subLabel: 'English (US / UK)', flag: '🇺🇸', badge: t.defaultBadge },
    { key: 'hi', label: t.hindi, subLabel: 'हिन्दी (भारतीय भाषा)', flag: '🇮🇳' },
    { key: 'hinglish', label: t.hinglish, subLabel: 'Hinglish (Roman Hindi)', flag: '🌐' },
  ];

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* 🔙 BACK BANNER HEADER */}
      <View style={[styles.backBanner, { backgroundColor: backBannerBg, borderBottomColor: borderColor }]}>
        {onClose && (
          <TouchableOpacity
            onPress={onClose}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Text style={styles.backBtnText}>← {t.backToMenu}</Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.backTitle, { color: titleColor }]}>{t.preferencesTitle}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ⚙️ WORKSPACE HEADER CARD */}
        <View style={[styles.kpiCard, { backgroundColor: cardBg, borderColor }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <View style={styles.iconCircle}>
              <Text style={{ fontSize: 18 }}>⚙️</Text>
            </View>
            <Text style={[styles.kpiTitle, { color: titleColor }]}>{t.workspaceSettingsTitle}</Text>
          </View>
          <Text style={[styles.kpiSub, { color: subColor }]}>{t.workspaceSettingsSub}</Text>
        </View>

        {/* 🌐 LANGUAGE SELECTION SECTION */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: titleColor }]}>{t.languageSectionTitle}</Text>
          <Text style={[styles.sectionSub, { color: subColor }]}>{t.languageSectionSub}</Text>
        </View>

        <View style={styles.languageCardsContainer}>
          {LANGUAGE_OPTIONS.map((item) => {
            const isSelected = language === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.languageCard,
                  {
                    backgroundColor: isSelected
                      ? isDark ? 'rgba(79, 70, 229, 0.16)' : 'rgba(79, 70, 229, 0.08)'
                      : cardBg,
                    borderColor: isSelected ? '#4f46e5' : borderColor,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                onPress={() => handleSelectLanguage(item.key)}
                activeOpacity={0.7}
              >
                <View style={styles.languageCardLeft}>
                  <View style={[styles.flagBadge, { backgroundColor: isSelected ? '#4f46e5' : (isDark ? '#1e293b' : '#f1f5f9') }]}>
                    <Text style={{ fontSize: 16 }}>{item.flag}</Text>
                  </View>
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text
                        style={[
                          styles.languageCardTitle,
                          { color: isSelected ? '#6366f1' : titleColor, fontWeight: isSelected ? '800' : '700' },
                        ]}
                      >
                        {item.label}
                      </Text>
                      {item.badge && (
                        <View style={styles.defaultPill}>
                          <Text style={styles.defaultPillText}>{item.badge}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.languageCardSub, { color: subColor }]}>{item.subLabel}</Text>
                  </View>
                </View>

                <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                  {isSelected && <View style={styles.radioInnerDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 🎛️ SYSTEM CONTROLS & TOGGLES */}
        <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
          <Text style={[styles.sectionTitle, { color: titleColor }]}>System & Device Preferences</Text>
          <Text style={[styles.sectionSub, { color: subColor }]}>Toggle hardware and cloud sync features</Text>
        </View>

        <View style={[styles.settingsGroup, { backgroundColor: cardBg, borderColor }]}>
          {/* 🔔 Push Notification Alerts */}
          <View style={[styles.settingRow, { borderBottomColor: borderColor }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: titleColor }]}>{t.pushAlertsTitle}</Text>
              <Text style={[styles.settingDesc, { color: subColor }]}>{t.pushAlertsDesc}</Text>
            </View>
            <Switch
              value={pushAlerts}
              onValueChange={setPushAlerts}
              trackColor={{ false: '#334155', true: '#4f46e5' }}
              thumbColor={pushAlerts ? '#ffffff' : '#94a3b8'}
            />
          </View>

          {/* 🌙 Dark Mode Theme */}
          <View style={[styles.settingRow, { borderBottomColor: borderColor }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: titleColor }]}>{t.darkModeTitle}</Text>
              <Text style={[styles.settingDesc, { color: subColor }]}>{t.darkModeDesc}</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={handleDarkModeToggle}
              trackColor={{ false: '#cbd5e1', true: '#4f46e5' }}
              thumbColor={isDark ? '#ffffff' : '#f8fafc'}
            />
          </View>

          {/* 🔒 Biometric / Passcode Lock */}
          <View style={[styles.settingRow, { borderBottomColor: borderColor }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: titleColor }]}>{t.biometricTitle}</Text>
              <Text style={[styles.settingDesc, { color: subColor }]}>{t.biometricDesc}</Text>
            </View>
            <Switch
              value={biometricLock}
              onValueChange={setBiometricLock}
              trackColor={{ false: '#334155', true: '#4f46e5' }}
              thumbColor={biometricLock ? '#ffffff' : '#94a3b8'}
            />
          </View>

          {/* 📍 High Accuracy GPS Telemetry */}
          <View style={[styles.settingRow, { borderBottomColor: borderColor }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: titleColor }]}>{t.gpsTitle}</Text>
              <Text style={[styles.settingDesc, { color: subColor }]}>{t.gpsDesc}</Text>
            </View>
            <Switch
              value={gpsTelemetry}
              onValueChange={setGpsTelemetry}
              trackColor={{ false: '#334155', true: '#4f46e5' }}
              thumbColor={gpsTelemetry ? '#ffffff' : '#94a3b8'}
            />
          </View>

          {/* 🔄 Offline Auto Sync */}
          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: titleColor }]}>{t.offlineSyncTitle}</Text>
              <Text style={[styles.settingDesc, { color: subColor }]}>{t.offlineSyncDesc}</Text>
            </View>
            <Switch
              value={offlineSync}
              onValueChange={setOfflineSync}
              trackColor={{ false: '#334155', true: '#4f46e5' }}
              thumbColor={offlineSync ? '#ffffff' : '#94a3b8'}
            />
          </View>
        </View>

        {/* 💾 SAVE PREFERENCES ACTION BUTTON */}
        <TouchableOpacity
          style={[styles.actionBtn, saving && { opacity: 0.8 }]}
          onPress={handleSavePreferences}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={styles.actionBtnText}>{t.saving}</Text>
            </View>
          ) : (
            <Text style={styles.actionBtnText}>💾 {t.savePreferences}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default AppSettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  backBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  backBtnText: {
    color: '#818cf8',
    fontSize: 13,
    fontWeight: '700',
  },
  backTitle: {
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
  },
  kpiCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  kpiSub: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionHeaderRow: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  sectionSub: {
    fontSize: 12,
  },
  languageCardsContainer: {
    gap: 10,
    marginBottom: 12,
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
  },
  languageCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  flagBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageCardTitle: {
    fontSize: 15,
  },
  languageCardSub: {
    fontSize: 12,
    marginTop: 2,
  },
  defaultPill: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultPillText: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: '800',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#64748b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: '#4f46e5',
  },
  radioInnerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4f46e5',
  },
  settingsGroup: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flex: 1,
    paddingRight: 16,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  actionBtn: {
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
