/**
 * App.tsx — DAS CRM Android Application Root
 * Restructured Navigation with 5 Bottom Tabs (Home, Leads, Employees, More, Attendance),
 * Top Header Hamburger Menu (☰) with smooth LEFT-SIDE slide animation,
 * premium glassmorphic drawer UI aesthetics & Profile stack modal.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Alert,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuthStore, UserRole, normalizeRoleStr } from './src/store/authStore';
import LoginScreen from './src/screens/LoginScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import HRDashboardScreen from './src/screens/HRDashboardScreen';
import ManagerDashboardScreen from './src/screens/ManagerDashboardScreen';
import TeamLeaderDashboardScreen from './src/screens/TeamLeaderDashboardScreen';
import EmployeeDashboardScreen from './src/screens/EmployeeDashboardScreen';
import LeadsScreen from './src/screens/LeadsScreen';
import LeadDetailScreen from './src/screens/LeadDetailScreen';
import EmployeesScreen from './src/screens/EmployeesScreen';
import MoreControlsScreen from './src/screens/MoreControlsScreen';
import AttendanceScreen from './src/screens/AttendanceScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 320);

export type LeadsStackParamList = {
  LeadsList: undefined;
  LeadDetail: { leadId: string; leadName?: string };
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

function MainTabNavigator({ onOpenDrawer, onOpenProfile, navigation }: { onOpenDrawer: () => void; onOpenProfile: () => void; navigation: any }) {
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuthStore();
  const role: UserRole = normalizeRoleStr(currentUser.role);

  const renderHomeRoleScreen = () => {
    switch (role) {
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return <AdminDashboardScreen onNavigateToAttendance={() => navigation.navigate('Attendance')} />;
      case 'HR':
        return <HRDashboardScreen onNavigateToAttendance={() => navigation.navigate('Attendance')} />;
      case 'MANAGER':
        return <ManagerDashboardScreen onNavigateToAttendance={() => navigation.navigate('Attendance')} />;
      case 'TEAM_LEADER':
        return <TeamLeaderDashboardScreen onNavigateToAttendance={() => navigation.navigate('Attendance')} />;
      case 'SALES_EXEC':
      default:
        return <EmployeeDashboardScreen onNavigateToAttendance={() => navigation.navigate('Attendance')} />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#060810' }}>
      {/* 👑 PREMIUM TOP HEADER WITH SLEEK LEFT HAMBURGER BUTTON */}
      <View style={[styles.topHeader, { paddingTop: insets.top > 0 ? insets.top + 6 : 10 }]}>
        <TouchableOpacity style={styles.hamburgerBtn} onPress={onOpenDrawer} activeOpacity={0.7}>
          <View style={styles.hamburgerLine} />
          <View style={[styles.hamburgerLine, { width: 14 }]} />
          <View style={styles.hamburgerLine} />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.topHeaderTitle}>{currentUser.companyName}</Text>
          <Text style={styles.topHeaderRole}>ROLE: {role.replace('_', ' ')}</Text>
        </View>

        <TouchableOpacity style={styles.profileHeaderBtn} onPress={onOpenProfile} activeOpacity={0.8}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{currentUser.avatar}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 📱 5 BOTTOM TABS */}
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0f172a',
            borderTopColor: '#1e293b',
            borderTopWidth: 1,
            height: 60 + (insets.bottom > 0 ? insets.bottom : 8),
            paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
            paddingTop: 6,
          },
          tabBarActiveTintColor: '#818cf8',
          tabBarInactiveTintColor: '#64748b',
          tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        }}
      >
        <Tab.Screen
          name="Home"
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 16, color }}>🏠</Text>, tabBarLabel: 'Home' }}
        >
          {() => renderHomeRoleScreen()}
        </Tab.Screen>

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
          component={MoreControlsScreen}
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
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

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

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        {!token ? (
          <LoginScreen onLoginSuccess={() => {}} />
        ) : (
          <MainTabNavigator
            onOpenDrawer={openDrawer}
            onOpenProfile={() => setProfileModalOpen(true)}
            navigation={{ navigate: () => {} }}
          />
        )}
      </NavigationContainer>

      {/* ☰ LEFT-SLIDING HAMBURGER DRAWER MODAL */}
      <Modal visible={drawerVisible} transparent animationType="none">
        <View style={styles.modalContainer}>
          {/* Backdrop Overlay */}
          <Animated.View style={[styles.drawerBackdrop, { opacity: fadeAnim }]}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => closeDrawer()} />
          </Animated.View>

          {/* Left-Side Sliding Content Box */}
          <Animated.View style={[styles.leftDrawerContent, { width: DRAWER_WIDTH, transform: [{ translateX: slideAnim }] }]}>

            {/* Header with Close X */}
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

            {/* User Identity Card */}
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
                { icon: '🎯', label: 'Leads Directory', badge: 'LIVE', action: () => closeDrawer() },
                { icon: '⚡', label: 'Leads Funnel Customization', badge: '3-MODEL', action: () => closeDrawer(() => Alert.alert('Funnel Customization', 'Opening 3-model lead routing & quota setup.')) },
                { icon: '💼', label: 'Deals & Pipeline Kanban', badge: 'KANBAN', action: () => closeDrawer(() => Alert.alert('Deals Pipeline', 'Navigating to Deals Kanban pipeline.')) },
                { icon: '📝', label: 'Quotations & Invoices', badge: '', action: () => closeDrawer(() => Alert.alert('Quotations', 'Opening Quotation Builder.')) },
                { icon: '📦', label: 'Products & Services Catalog', badge: '', action: () => closeDrawer(() => Alert.alert('Catalog', 'Opening Products Catalog.')) },
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
                { icon: '💬', label: 'Communications Hub', action: () => closeDrawer(() => Alert.alert('Comms Hub', 'Opening WhatsApp & Call logs audit.')) },
                { icon: '📧', label: 'Email Marketing & Templates', action: () => closeDrawer(() => Alert.alert('Email Marketing', 'Opening Email templates.')) },
                { icon: '🎯', label: 'Goals & Targets', action: () => closeDrawer(() => Alert.alert('Goals', 'Opening Target progress tracking.')) },
                { icon: '⏱️', label: 'Attendance & HR Audit', action: () => closeDrawer() },
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
                onPress={() => closeDrawer(() => Alert.alert('App Update', 'DAS CRM v1.0.0 is up to date.'))}
                activeOpacity={0.7}
              >
                <View style={styles.drawerItemIconBox}>
                  <Text style={{ fontSize: 14 }}>🔄</Text>
                </View>
                <Text style={styles.drawerItemLabel}>Check for App Updates</Text>
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

      {/* 👤 PROFILE MODAL STACK */}
      <Modal visible={profileModalOpen} animationType="slide">
        <View style={{ flex: 1, backgroundColor: '#060810' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#1e293b' }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#ffffff' }}>User &amp; Workspace Profile</Text>
            <TouchableOpacity style={{ backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }} onPress={() => setProfileModalOpen(false)}>
              <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 12 }}>✕ Close</Text>
            </TouchableOpacity>
          </View>
          <ProfileScreen onLogout={() => setProfileModalOpen(false)} />
        </View>
      </Modal>
    </SafeAreaProvider>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  topHeader: {
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  hamburgerBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    gap: 3.5,
  },
  hamburgerLine: {
    width: 18,
    height: 2.2,
    backgroundColor: '#818cf8',
    borderRadius: 1,
  },
  topHeaderTitle: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  topHeaderRole: { fontSize: 8, color: '#818cf8', fontWeight: '800' },
  profileHeaderBtn: { width: 36, height: 36 },
  headerAvatar: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(99,102,241,0.2)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.4)', justifyContent: 'center', alignItems: 'center' },
  headerAvatarText: { fontSize: 14, fontWeight: '800', color: '#818cf8' },

  // Left Drawer Container & Backdrop
  modalContainer: { flex: 1, flexDirection: 'row' },
  drawerBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(2, 6, 23, 0.8)' },
  leftDrawerContent: {
    height: '100%',
    backgroundColor: '#0f172a',
    borderRightWidth: 1,
    borderRightColor: '#1e293b',
    paddingHorizontal: 14,
    paddingTop: 38,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 20,
  },

  drawerTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  drawerLogoBadge: { backgroundColor: '#4f46e5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  drawerAppTitle: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  closeDrawerBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },

  drawerUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  drawerAvatarGlow: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(99,102,241,0.2)',
    borderWidth: 1,
    borderColor: '#818cf8',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  drawerAvatarText: { fontSize: 16, fontWeight: '900', color: '#818cf8' },
  onlineDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#34d399', borderWidth: 1.5, borderColor: '#020617', position: 'absolute', bottom: -2, right: -2 },
  drawerUserName: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  drawerUserEmail: { fontSize: 10, color: '#94a3b8', marginTop: 1 },
  roleTagPill: { backgroundColor: 'rgba(52,211,153,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 4 },
  roleTagText: { fontSize: 8, color: '#34d399', fontWeight: '800' },

  fullProfileBtn: { backgroundColor: 'rgba(99,102,241,0.15)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)', paddingVertical: 8, borderRadius: 10, alignItems: 'center', marginBottom: 14 },
  fullProfileBtnText: { color: '#a5b4fc', fontSize: 11, fontWeight: '800' },

  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, marginBottom: 8 },
  drawerGroupTitle: { fontSize: 9, fontWeight: '800', color: '#64748b', letterSpacing: 0.6 },
  sectionLine: { flex: 1, height: 1, backgroundColor: '#1e293b' },

  drawerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 2,
  },
  drawerItemIconBox: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  drawerItemLabel: { flex: 1, fontSize: 12, color: '#f8fafc', fontWeight: '600' },
  itemBadge: { backgroundColor: 'rgba(99,102,241,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  itemBadgeText: { fontSize: 8, fontWeight: '800', color: '#818cf8' },

  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 18,
  },
  signOutBtnText: { color: '#f87171', fontSize: 11, fontWeight: '800' },
});
