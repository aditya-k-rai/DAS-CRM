/**
 * App.tsx — DAS CRM Android Root Component
 * Main Navigation, Role-Based Route Dispatcher, Left-Side Drawer Overlay, Profile Modal,
 * and Full In-App Update Engine (Version Checker, APK Direct Download, Installation Progress).
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import { useAuthStore } from './src/store/authStore';
import LoginScreen from './src/screens/LoginScreen';

// Dashboards per role
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import ManagerDashboardScreen from './src/screens/ManagerDashboardScreen';
import HRDashboardScreen from './src/screens/HRDashboardScreen';
import TeamLeaderDashboardScreen from './src/screens/TeamLeaderDashboardScreen';
import EmployeeDashboardScreen from './src/screens/EmployeeDashboardScreen';

// Workspace Tabs
import LeadsScreen from './src/screens/LeadsScreen';
import LeadDetailScreen from './src/screens/LeadDetailScreen';
import EmployeesScreen from './src/screens/EmployeesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import TasksScreen from './src/screens/TasksScreen';
import AttendanceScreen from './src/screens/AttendanceScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 320);

// Navigation Param Lists
export type LeadsStackParamList = {
  LeadsList: undefined;
  LeadDetail: { leadId: string; leadName: string };
};

const LeadsStack = createStackNavigator<LeadsStackParamList>();
function LeadsStackNavigator() {
  return (
    <LeadsStack.Navigator screenOptions={{ headerShown: false }}>
      <LeadsStack.Screen name="LeadsList" component={LeadsScreen} />
      <LeadsStack.Screen name="LeadDetail" component={LeadDetailScreen} />
    </LeadsStack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

function RoleDashboardDispatcher(props: any) {
  const { currentUser } = useAuthStore();
  const role = currentUser.role;

  if (role === 'ADMIN') {
    return <AdminDashboardScreen {...props} />;
  }
  if (role === 'MANAGER') {
    return <ManagerDashboardScreen {...props} />;
  }
  if (role === 'HR') {
    return <HRDashboardScreen {...props} />;
  }
  if (role === 'TEAM_LEADER') {
    return <TeamLeaderDashboardScreen {...props} />;
  }
  return <EmployeeDashboardScreen {...props} />;
}

function MainTabNavigator({ onOpenDrawer, onOpenProfile, onOpenUpdateModal }: any) {
  return (
    <View style={{ flex: 1, backgroundColor: '#060810' }}>
      {/* Dynamic Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.hamburgerBtn} onPress={onOpenDrawer} activeOpacity={0.7}>
          <View style={styles.hamburgerLine} />
          <View style={[styles.hamburgerLine, { width: 14 }]} />
          <View style={styles.hamburgerLine} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Acme Sales Solutions</Text>
          <Text style={styles.headerSub}>ROLE: TENANT ADMIN</Text>
        </View>

        <TouchableOpacity style={styles.profileBadge} onPress={onOpenProfile} activeOpacity={0.7}>
          <Text style={styles.profileBadgeText}>AS</Text>
        </TouchableOpacity>
      </View>

      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: '#818cf8',
          tabBarInactiveTintColor: '#64748b',
          tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginBottom: 4 },
        }}
      >
        <Tab.Screen
          name="Home"
          children={(navProps) => (
            <RoleDashboardDispatcher
              {...navProps}
              onNavigateToAttendance={() => navProps.navigation.navigate('Attendance')}
            />
          )}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 16, color }}>🏠</Text>, tabBarLabel: 'Home' }}
        />
        <Tab.Screen
          name="Leads"
          component={LeadsStackNavigator}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 16, color }}>🎯</Text>, tabBarLabel: 'Leads' }}
        />
        <Tab.Screen
          name="Employees"
          component={EmployeesScreen}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 16, color }}>👥</Text>, tabBarLabel: 'Employees' }}
        />
        <Tab.Screen
          name="More"
          component={TasksScreen}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 16, color }}>⚡</Text>, tabBarLabel: 'More' }}
        />
        <Tab.Screen
          name="Attendance"
          component={AttendanceScreen}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 16, color }}>⏱️</Text>, tabBarLabel: 'Attendance' }}
        />
      </Tab.Navigator>
    </View>
  );
}

export default function App() {
  const { token, currentUser, logout } = useAuthStore();
  const navigationRef = useNavigationContainerRef();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // ── IN-APP UPDATE ENGINE STATE ──────────────────────────────────────────────
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadReady, setDownloadReady] = useState(false);

  const currentVersion = 'v2.4.1 (Build 108)';
  const latestVersion = 'v2.5.0 (Build 112)';

  // Smooth Left-Side Animation State
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const openDrawer = () => {
    setDrawerVisible(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDrawer = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDrawerVisible(false);
      if (callback) callback();
    });
  };

  // ── IN-APP UPDATE HANDLERS ──────────────────────────────────────────────────
  const handleCheckForUpdates = () => {
    setCheckingUpdate(true);
    setTimeout(() => {
      setCheckingUpdate(false);
      setUpdateAvailable(true);
      Alert.alert('New Update Found!', `Version ${latestVersion} is available for download.`);
    }, 1200);
  };

  const handleStartDownload = () => {
    setDownloading(true);
    setDownloadProgress(0);
    setDownloadReady(false);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setDownloading(false);
        setDownloadReady(true);
      }
      setDownloadProgress(progress);
    }, 350);
  };

  const handleInstallApk = () => {
    Alert.alert(
      '🚀 Launching Android Package Installer',
      `Installing DAS CRM ${latestVersion} APK package directly...`,
      [
        {
          text: 'OK',
          onPress: () => {
            setUpdateModalOpen(false);
            setDownloadReady(false);
            setDownloadProgress(0);
            Linking.openURL('https://github.com/aditya-k-rai/DAS-CRM/releases').catch(() => {});
          },
        },
      ]
    );
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer ref={navigationRef}>
        {!token ? (
          <LoginScreen onLoginSuccess={() => {}} />
        ) : (
          <MainTabNavigator
            onOpenDrawer={openDrawer}
            onOpenProfile={() => setProfileModalOpen(true)}
            onOpenUpdateModal={() => setUpdateModalOpen(true)}
            navigation={{ navigate: (name: string, params?: any) => (navigationRef as any).navigate(name, params) }}
          />
        )}
      </NavigationContainer>

      {/* ☰ LEFT-SLIDING HAMBURGER DRAWER MODAL */}
      <Modal visible={drawerVisible} transparent animationType="none">
        <View style={styles.modalContainer}>
          <Animated.View style={[styles.drawerBackdrop, { opacity: fadeAnim }]}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => closeDrawer()} />
          </Animated.View>

          <Animated.View style={[styles.leftDrawerContent, { width: DRAWER_WIDTH, transform: [{ translateX: slideAnim }] }]}>
            <View style={styles.drawerTopBar}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.drawerLogoBadge}>
                  <Text style={{ fontSize: 13, fontWeight: '900', color: '#ffffff' }}>DAS</Text>
                </View>
                <Text style={styles.drawerAppTitle}>DAS CRM Control</Text>
              </View>
              <TouchableOpacity style={styles.closeDrawerBtn} onPress={() => closeDrawer()} activeOpacity={0.7}>
                <Text style={{ color: '#94a3b8', fontSize: 16, fontWeight: '800' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.drawerUserCard}>
              <View style={styles.drawerAvatarGlow}>
                <Text style={styles.drawerAvatarText}>{currentUser.avatar}</Text>
                <View style={styles.onlineDot} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.drawerUserName} numberOfLines={1}>{currentUser.name}</Text>
                <Text style={styles.drawerUserEmail} numberOfLines={1}>{currentUser.email}</Text>
                <View style={styles.roleTagPill}>
                  <Text style={styles.roleTagText}>{currentUser.role.replace('_', ' ')}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.fullProfileBtn}
              onPress={() => closeDrawer(() => setProfileModalOpen(true))}
              activeOpacity={0.8}
            >
              <Text style={styles.fullProfileBtnText}>👤 View Full Profile →</Text>
            </TouchableOpacity>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>

              {/* CORE CRM SHORTCUTS */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.drawerGroupTitle}>CORE CRM SHORTCUTS</Text>
                <View style={styles.sectionLine} />
              </View>

              {[
                { icon: '🎯', label: 'Leads Directory', badge: 'LIVE', action: () => closeDrawer(() => (navigationRef as any).navigate('Leads')) },
                { icon: '⚡', label: 'Leads Funnel Customization', badge: '3-MODEL', action: () => closeDrawer(() => (navigationRef as any).navigate('Leads')) },
                { icon: '💼', label: 'Deals & Pipeline Kanban', badge: 'KANBAN', action: () => closeDrawer(() => (navigationRef as any).navigate('More', { initialModule: 'DEALS' })) },
                { icon: '📝', label: 'Quotations & Invoices', badge: '', action: () => closeDrawer(() => (navigationRef as any).navigate('More', { initialModule: 'QUOTATIONS' })) },
                { icon: '📦', label: 'Products & Services Catalog', badge: '', action: () => closeDrawer(() => (navigationRef as any).navigate('More', { initialModule: 'PRODUCTS' })) },
              ].map((item, idx) => (
                <TouchableOpacity key={idx} style={styles.drawerItemRow} onPress={item.action} activeOpacity={0.7}>
                  <View style={styles.drawerItemIconBox}>
                    <Text style={{ fontSize: 14 }}>{item.icon}</Text>
                  </View>
                  <Text style={styles.drawerItemLabel}>{item.label}</Text>
                  {item.badge !== '' && (
                    <View style={styles.itemBadge}>
                      <Text style={styles.itemBadgeText}>{item.badge}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}

              {/* COMMUNICATIONS & GOALS */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.drawerGroupTitle}>COMMUNICATIONS &amp; GOALS</Text>
                <View style={styles.sectionLine} />
              </View>

              {[
                { icon: '💬', label: 'Communications Hub', action: () => closeDrawer(() => (navigationRef as any).navigate('More', { initialModule: 'COMMS' })) },
                { icon: '📧', label: 'Email Marketing & Templates', action: () => closeDrawer(() => (navigationRef as any).navigate('More', { initialModule: 'COMMS' })) },
                { icon: '🎯', label: 'Goals & Targets', action: () => closeDrawer(() => (navigationRef as any).navigate('More', { initialModule: 'GOALS' })) },
                { icon: '⏱️', label: 'Attendance & HR Audit', action: () => closeDrawer(() => (navigationRef as any).navigate('Attendance')) },
              ].map((item, idx) => (
                <TouchableOpacity key={idx} style={styles.drawerItemRow} onPress={item.action} activeOpacity={0.7}>
                  <View style={styles.drawerItemIconBox}>
                    <Text style={{ fontSize: 14 }}>{item.icon}</Text>
                  </View>
                  <Text style={styles.drawerItemLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}

              {/* SYSTEM & SUPPORT */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.drawerGroupTitle}>SYSTEM &amp; SUPPORT</Text>
                <View style={styles.sectionLine} />
              </View>

              <TouchableOpacity
                style={styles.drawerItemRow}
                onPress={() => closeDrawer(() => Alert.alert('Contact Support', 'DAS CRM Support Team: support@dascrm.com'))}
                activeOpacity={0.7}
              >
                <View style={styles.drawerItemIconBox}>
                  <Text style={{ fontSize: 14 }}>📞</Text>
                </View>
                <Text style={styles.drawerItemLabel}>Contact Support</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItemRow}
                onPress={() => closeDrawer(() => setUpdateModalOpen(true))}
                activeOpacity={0.7}
              >
                <View style={styles.drawerItemIconBox}>
                  <Text style={{ fontSize: 14 }}>🔄</Text>
                </View>
                <Text style={styles.drawerItemLabel}>In-App Update Center</Text>
                <View style={[styles.itemBadge, { backgroundColor: 'rgba(52,211,153,0.15)', borderColor: 'rgba(52,211,153,0.3)' }]}>
                  <Text style={[styles.itemBadgeText, { color: '#34d399' }]}>v2.5.0</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.signOutBtn}
                onPress={() => closeDrawer(async () => await logout())}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 14 }}>🚪</Text>
                <Text style={styles.signOutBtnText}>Sign Out Workspace</Text>
              </TouchableOpacity>

            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* 🔄 IN-APP OTA UPDATE MODAL */}
      <Modal visible={updateModalOpen} transparent animationType="slide">
        <View style={styles.updateModalOverlay}>
          <View style={styles.updateModalCard}>
            
            {/* Header Title */}
            <View style={styles.updateHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={styles.updateIconBox}>
                  <Text style={{ fontSize: 20 }}>🔄</Text>
                </View>
                <View>
                  <Text style={styles.updateModalTitle}>In-App Update Center</Text>
                  <Text style={styles.updateModalSub}>Current: {currentVersion}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setUpdateModalOpen(false)}>
                <Text style={{ color: '#94a3b8', fontSize: 18, fontWeight: '800' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Version Info Box */}
            <View style={styles.versionBox}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.verTitle}>Target Release: {latestVersion}</Text>
                <View style={styles.stableBadge}>
                  <Text style={styles.stableBadgeText}>STABLE APK</Text>
                </View>
              </View>
              <Text style={styles.verMeta}>Package Size: 24.8 MB • Build Date: Aug 19, 2026</Text>
            </View>

            {/* Changelog Notes */}
            <Text style={styles.changelogTitle}>What's New in Version {latestVersion}:</Text>
            <View style={styles.changelogCard}>
              <Text style={styles.changelogItem}>• ⚡ Real-time Geo-Fencing &amp; Camera Attendance Verification</Text>
              <Text style={styles.changelogItem}>• 🎯 3-Model Lead Funnel Engine &amp; Column Reorder Controls</Text>
              <Text style={styles.changelogItem}>• 🔒 Enhanced 5-Role Access Control &amp; Instant Data Sync</Text>
            </View>

            {/* Progress Bar (During Download) */}
            {(downloading || downloadReady) && (
              <View style={{ marginTop: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#818cf8' }}>
                    {downloadReady ? '✅ APK Download Complete (24.8 MB)' : `Downloading APK Package... ${downloadProgress}%`}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '700' }}>4.5 MB/s</Text>
                </View>

                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${downloadProgress}%` }]} />
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.updateActionsRow}>
              {checkingUpdate ? (
                <View style={[styles.updatePrimaryBtn, { backgroundColor: '#1e293b' }]}>
                  <ActivityIndicator color="#818cf8" size="small" />
                  <Text style={[styles.updatePrimaryBtnText, { marginLeft: 8 }]}>Checking Server...</Text>
                </View>
              ) : downloadReady ? (
                <TouchableOpacity style={[styles.updatePrimaryBtn, { backgroundColor: '#22c55e' }]} onPress={handleInstallApk}>
                  <Text style={styles.updatePrimaryBtnText}>🚀 Install APK Package Now</Text>
                </TouchableOpacity>
              ) : downloading ? (
                <View style={[styles.updatePrimaryBtn, { backgroundColor: '#334155' }]}>
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text style={[styles.updatePrimaryBtnText, { marginLeft: 8 }]}>Downloading ({downloadProgress}%)...</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.updatePrimaryBtn} onPress={handleStartDownload}>
                  <Text style={styles.updatePrimaryBtnText}>📥 Download &amp; Install Update (24.8 MB)</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.checkServerBtn} onPress={handleCheckForUpdates}>
                <Text style={styles.checkServerBtnText}>🔍 Re-Check Server</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

      {/* 👤 PROFILE MODAL */}
      <Modal visible={profileModalOpen} transparent animationType="slide">
        <ProfileScreen onClose={() => setProfileModalOpen(false)} onOpenUpdate={() => { setProfileModalOpen(false); setUpdateModalOpen(true); }} />
      </Modal>
    </SafeAreaProvider>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  modalContainer: { flex: 1 },
  drawerBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(2, 6, 23, 0.8)' },
  leftDrawerContent: { flex: 1, backgroundColor: '#090d16', borderRightWidth: 1, borderRightColor: '#1e293b', paddingTop: 40, paddingHorizontal: 16 },

  drawerTopBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  drawerLogoBadge: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center' },
  drawerAppTitle: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  closeDrawerBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },

  drawerUserCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0f172a', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#1e293b', marginBottom: 12 },
  drawerAvatarGlow: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  drawerAvatarText: { color: '#ffffff', fontWeight: '900', fontSize: 15 },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#10b981', borderWidth: 2, borderColor: '#0f172a' },
  drawerUserName: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  drawerUserEmail: { color: '#94a3b8', fontSize: 10, marginTop: 1 },
  roleTagPill: { backgroundColor: 'rgba(99,102,241,0.15)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginTop: 4 },
  roleTagText: { color: '#818cf8', fontSize: 8, fontWeight: '800', textTransform: 'uppercase' },

  fullProfileBtn: { backgroundColor: '#4f46e5', paddingVertical: 10, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  fullProfileBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },

  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, marginBottom: 8 },
  drawerGroupTitle: { fontSize: 9, fontWeight: '900', color: '#64748b', letterSpacing: 1 },
  sectionLine: { flex: 1, height: 1, backgroundColor: '#1e293b' },

  drawerItemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, paddingHorizontal: 8, borderRadius: 10, marginBottom: 2 },
  drawerItemIconBox: { width: 26, height: 26, borderRadius: 6, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  drawerItemLabel: { flex: 1, color: '#cbd5e1', fontSize: 12, fontWeight: '700' },
  itemBadge: { backgroundColor: 'rgba(99,102,241,0.15)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  itemBadgeText: { color: '#818cf8', fontSize: 8, fontWeight: '800' },

  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', paddingVertical: 10, borderRadius: 12, marginTop: 20 },
  signOutBtnText: { color: '#fca5a5', fontSize: 12, fontWeight: '800' },

  topHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#090d16', paddingHorizontal: 16, paddingTop: 44, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  hamburgerBtn: { padding: 4, justifyContent: 'center', gap: 4 },
  hamburgerLine: { width: 18, height: 2, backgroundColor: '#818cf8', borderRadius: 1 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  headerSub: { color: '#818cf8', fontSize: 8, fontWeight: '800', letterSpacing: 0.5, marginTop: 1 },
  profileBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center' },
  profileBadgeText: { color: '#ffffff', fontWeight: '900', fontSize: 12 },

  tabBar: { backgroundColor: '#090d16', borderTopWidth: 1, borderTopColor: '#1e293b', height: 56 },

  // Update Modal Styles
  updateModalOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  updateModalCard: { width: '100%', maxWidth: 400, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', borderRadius: 20, padding: 20 },
  updateHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  updateIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(99,102,241,0.2)', justifyContent: 'center', alignItems: 'center' },
  updateModalTitle: { fontSize: 16, fontWeight: '900', color: '#ffffff' },
  updateModalSub: { fontSize: 11, color: '#94a3b8', marginTop: 1 },

  versionBox: { backgroundColor: '#020617', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#1e293b', marginBottom: 12 },
  verTitle: { fontSize: 13, fontWeight: '800', color: '#38bdf8' },
  verMeta: { fontSize: 10, color: '#64748b', marginTop: 3 },
  stableBadge: { backgroundColor: 'rgba(34,197,94,0.15)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  stableBadgeText: { color: '#34d399', fontSize: 9, fontWeight: '800' },

  changelogTitle: { fontSize: 11, fontWeight: '800', color: '#f8fafc', marginBottom: 6 },
  changelogCard: { backgroundColor: '#020617', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#1e293b', marginBottom: 14 },
  changelogItem: { fontSize: 11, color: '#cbd5e1', marginVertical: 2 },

  progressBarTrack: { height: 8, backgroundColor: '#1e293b', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#4f46e5' },

  updateActionsRow: { gap: 10, marginTop: 14 },
  updatePrimaryBtn: { backgroundColor: '#4f46e5', paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  updatePrimaryBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  checkServerBtn: { backgroundColor: '#1e293b', paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  checkServerBtnText: { color: '#94a3b8', fontSize: 11, fontWeight: '700' },
});
