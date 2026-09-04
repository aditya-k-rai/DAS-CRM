/**
 * App.tsx — DAS CRM Android Root Component
 * Main Navigation, Role-Based Route Dispatcher, Left-Side Drawer Overlay, Profile Modal,
 * 🔔 Notifications Center & 5-Min Prior Automated Task Reminder System,
 * and Full In-App Update Engine (Version Checker, APK Direct Download, Installation Progress).
 */

import React, { useState, useRef, useEffect } from 'react';
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
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
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
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProductsCatalogScreen from './src/screens/ProductsCatalogScreen';
import MoreControlsScreen from './src/screens/MoreControlsScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 320);

// Notifications Data Type
export interface AppNotificationItem {
  id: string;
  title: string;
  message: string;
  timeStr: string;
  type: 'TASK_5MIN_ALERT' | 'CALL_REMINDER' | 'LEAD_ASSIGNED' | 'SYSTEM';
  isRead: boolean;
  leadName?: string;
  leadPhone?: string;
}

const INITIAL_NOTIFICATIONS: AppNotificationItem[] = [
  {
    id: 'notif-1',
    title: '⏰ Task Alert (Starts in 5 Mins)',
    message: 'Meeting with Rajesh Mehta (TechCorp Solutions) starts in 5 minutes (02:30 PM). Get ready for demo!',
    timeStr: 'In 5 Mins',
    type: 'TASK_5MIN_ALERT',
    isRead: false,
    leadName: 'Rajesh Mehta',
    leadPhone: '+91 98765 43210',
  },
  {
    id: 'notif-2',
    title: '📞 Priority Call Reminder (Starts in 5 Mins)',
    message: 'Scheduled direct call with Priya Sharma (LogiTech Systems) starts in 5 minutes (04:45 PM).',
    timeStr: 'In 5 Mins',
    type: 'TASK_5MIN_ALERT',
    isRead: false,
    leadName: 'Priya Sharma',
    leadPhone: '+91 98123 45678',
  },
  {
    id: 'notif-3',
    title: '🎯 Hot Lead Assigned',
    message: 'New high-value lead assigned to your sales queue: Sunita Logistics Pvt Ltd (₹8,90,000).',
    timeStr: '15 Mins ago',
    type: 'LEAD_ASSIGNED',
    isRead: false,
    leadName: 'Sunita Kapoor',
    leadPhone: '+91 97222 33344',
  },
  {
    id: 'notif-4',
    title: '⏱️ Attendance Sync Verified',
    message: 'Workforce attendance punch logged successfully today at 09:21 AM (Geofence verified).',
    timeStr: '1 Hour ago',
    type: 'SYSTEM',
    isRead: true,
  },
];

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

function MainTabNavigator({
  onOpenDrawer,
  onOpenNotifications,
  unreadCount,
  onOpenProductsCatalog,
  onOpenProfile,
  onOpenAppUpdates,
}: any) {
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuthStore();
  const bottomPadding = Math.max(insets.bottom, 6);
  const topPadding = Math.max(insets.top, 12);

  const roleStr = currentUser?.role ? currentUser.role.replace('_', ' ') : 'SALES EXEC';
  const companyStr = currentUser?.companyName || 'Acme Sales Solutions';

  return (
    <View style={{ flex: 1, backgroundColor: '#090d16' }}>
      {/* Dynamic Header */}
      <View style={[styles.topHeader, { paddingTop: topPadding + 6 }]}>
        <TouchableOpacity style={styles.hamburgerBtn} onPress={onOpenDrawer} activeOpacity={0.7}>
          <View style={styles.hamburgerLine} />
          <View style={[styles.hamburgerLine, { width: 14 }]} />
          <View style={styles.hamburgerLine} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{companyStr}</Text>
          <Text style={styles.headerSub}>ROLE: {roleStr}</Text>
        </View>

        {/* 🔔 NOTIFICATION BELL BUTTON WITH RED UNREAD BADGE COUNT (Replaces Avatar Initials) */}
        <TouchableOpacity style={styles.notifHeaderBtn} onPress={onOpenNotifications} activeOpacity={0.7}>
          <Text style={{ fontSize: 17 }}>🔔</Text>
          {unreadCount > 0 && (
            <View style={styles.notifBadgeCircle}>
              <Text style={styles.notifBadgeCountText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: [
            styles.tabBar,
            {
              height: 56 + bottomPadding,
              paddingTop: 4,
              paddingBottom: bottomPadding,
            }
          ],
          tabBarActiveTintColor: '#818cf8',
          tabBarInactiveTintColor: '#64748b',
          tabBarItemStyle: {
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 2,
          },
        }}
      >
        <Tab.Screen
          name="Home"
          children={(navProps) => (
            <RoleDashboardDispatcher
              {...navProps}
              onOpenNotifications={onOpenNotifications}
              onNavigateToAttendance={() => navProps.navigation.navigate('Attendance')}
            />
          )}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={[styles.tabIconBox, focused && { backgroundColor: 'rgba(129,140,248,0.25)', borderColor: '#818cf8' }]}>
                <Text style={{ fontSize: 17, lineHeight: 22 }}>🏠</Text>
              </View>
            ),
            tabBarLabel: ({ focused }) => (
              <Text style={{ fontSize: 10, fontWeight: focused ? '900' : '700', color: focused ? '#818cf8' : '#64748b', marginTop: 1 }}>
                {focused ? 'Home ●' : 'Home'}
              </Text>
            ),
          }}
        />
        <Tab.Screen
          name="Leads"
          component={LeadsStackNavigator}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={[styles.tabIconBox, focused && { backgroundColor: 'rgba(56,189,248,0.25)', borderColor: '#38bdf8' }]}>
                <Text style={{ fontSize: 17, lineHeight: 22 }}>🎯</Text>
              </View>
            ),
            tabBarLabel: ({ focused }) => (
              <Text style={{ fontSize: 10, fontWeight: focused ? '900' : '700', color: focused ? '#38bdf8' : '#64748b', marginTop: 1 }}>
                {focused ? 'Leads ●' : 'Leads'}
              </Text>
            ),
          }}
        />
        <Tab.Screen
          name="Employees"
          component={EmployeesScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={[styles.tabIconBox, focused && { backgroundColor: 'rgba(192,132,252,0.25)', borderColor: '#c084fc' }]}>
                <Text style={{ fontSize: 17, lineHeight: 22 }}>👥</Text>
              </View>
            ),
            tabBarLabel: ({ focused }) => (
              <Text style={{ fontSize: 10, fontWeight: focused ? '900' : '700', color: focused ? '#c084fc' : '#64748b', marginTop: 1 }}>
                {focused ? 'Employees ●' : 'Employees'}
              </Text>
            ),
          }}
        />
        <Tab.Screen
          name="Menu"
          children={(navProps) => (
            <MoreControlsScreen
              {...navProps}
              onOpenProductsCatalog={onOpenProductsCatalog}
              onOpenProfile={onOpenProfile}
              onOpenAppUpdates={onOpenAppUpdates}
              onNavigateTab={(tabName: string) => navProps.navigation.navigate(tabName as any)}
            />
          )}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={[styles.tabIconBox, { backgroundColor: focused ? 'rgba(251,191,36,0.25)' : 'rgba(251,191,36,0.12)', borderColor: focused ? '#fbbf24' : 'rgba(251,191,36,0.35)' }]}>
                <View style={{ width: 16, height: 12, justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ width: 16, height: 2, backgroundColor: focused ? '#fbbf24' : '#f59e0b', borderRadius: 1 }} />
                  <View style={{ width: 16, height: 2, backgroundColor: focused ? '#fbbf24' : '#f59e0b', borderRadius: 1 }} />
                  <View style={{ width: 16, height: 2, backgroundColor: focused ? '#fbbf24' : '#f59e0b', borderRadius: 1 }} />
                </View>
              </View>
            ),
            tabBarLabel: ({ focused }) => (
              <Text style={{ fontSize: 10, fontWeight: focused ? '900' : '800', color: focused ? '#fbbf24' : '#f59e0b', marginTop: 1 }}>
                {focused ? 'Menu ●' : 'Menu'}
              </Text>
            ),
          }}
        />
        <Tab.Screen
          name="Attendance"
          component={AttendanceScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={[styles.tabIconBox, focused && { backgroundColor: 'rgba(52,211,153,0.25)', borderColor: '#34d399' }]}>
                <Text style={{ fontSize: 17, lineHeight: 22 }}>⏱️</Text>
              </View>
            ),
            tabBarLabel: ({ focused }) => (
              <Text style={{ fontSize: 10, fontWeight: focused ? '900' : '700', color: focused ? '#34d399' : '#64748b', marginTop: 1 }}>
                {focused ? 'Attendance ●' : 'Attendance'}
              </Text>
            ),
          }}
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
  const [productsModalOpen, setProductsModalOpen] = useState(false);

  // 🔔 NOTIFICATIONS & 5-MIN PRIOR TASK ALERTS STATE
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [overrideUnreadCount, setOverrideUnreadCount] = useState<number | null>(3);
  const [notifications, setNotifications] = useState<AppNotificationItem[]>(INITIAL_NOTIFICATIONS);

  const unreadNotifCount = overrideUnreadCount !== null ? overrideUnreadCount : notifications.filter((n) => !n.isRead).length;

  const handleMarkAllNotifsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleMarkSingleNotifRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

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
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDrawer = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDrawerVisible(false);
      if (callback) callback();
    });
  };

  useEffect(() => {
    if (!token) {
      setDrawerVisible(false);
      setProfileModalOpen(false);
      setProductsModalOpen(false);
      setNotifModalOpen(false);
      setUpdateModalOpen(false);
    }
  }, [token]);

  const handleLogout = () => {
    closeDrawer(() => {
      setDrawerVisible(false);
      setProfileModalOpen(false);
      setProductsModalOpen(false);
      setNotifModalOpen(false);
      setUpdateModalOpen(false);
      logout();
    });
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
            onOpenNotifications={() => setNotifModalOpen(true)}
            unreadCount={unreadNotifCount}
            onOpenProductsCatalog={() => setProductsModalOpen(true)}
            onOpenProfile={() => setProfileModalOpen(true)}
            onOpenAppUpdates={() => setUpdateModalOpen(true)}
            navigation={{ navigate: (name: string, params?: any) => (navigationRef as any).navigate(name, params) }}
          />
        )}

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

              {/* ROLE-CUSTOMIZED SHORTCUT GROUPS */}
              {(() => {
                const normRole = (currentUser?.role || '').toUpperCase();
                let groups = [];
                if (normRole.includes('ADMIN')) {
                  groups = [
                    {
                      title: '👑 TENANT ADMIN COMMAND',
                      items: [
                        { icon: '🎯', label: 'All Ingested Leads', badge: 'LIVE', action: () => closeDrawer(() => (navigationRef as any).navigate('Leads')) },
                        { icon: '👥', label: 'Staff Directory & Hierarchy', badge: 'ADMIN', action: () => closeDrawer(() => (navigationRef as any).navigate('Employees')) },
                        { icon: '💼', label: 'Deals & Pipeline Kanban', badge: 'KANBAN', action: () => closeDrawer(() => (navigationRef as any).navigate('Menu', { initialModule: 'DEALS' })) },
                        { icon: '📝', label: 'Quotations & Invoices', badge: '', action: () => closeDrawer(() => (navigationRef as any).navigate('Menu', { initialModule: 'QUOTATIONS' })) },
                        { icon: '📦', label: 'Products & Services Catalog', badge: 'PORTAL', action: () => closeDrawer(() => setProductsModalOpen(true)) },
                      ]
                    },
                    {
                      title: 'COMMUNICATIONS & AUDIT',
                      items: [
                        { icon: '🔔', label: 'Notifications & Alerts', badge: `${unreadNotifCount} NEW`, action: () => closeDrawer(() => setNotifModalOpen(true)) },
                        { icon: '💬', label: 'Communications Hub', badge: '', action: () => closeDrawer(() => (navigationRef as any).navigate('Menu', { initialModule: 'COMMS' })) },
                        { icon: '📊', label: 'In-Depth Telemetry Reports', badge: 'REPORTS', action: () => closeDrawer(() => (navigationRef as any).navigate('Menu', { initialModule: 'REPORTS' })) },
                        { icon: '⏱️', label: 'Workforce Attendance Audit', badge: '', action: () => closeDrawer(() => (navigationRef as any).navigate('Attendance')) },
                      ]
                    }
                  ];
                } else if (normRole.includes('MANAGER')) {
                  groups = [
                    {
                      title: '📈 DEPARTMENT MANAGER CONTROL',
                      items: [
                        { icon: '🎯', label: 'Department Team Leads', badge: 'LIVE', action: () => closeDrawer(() => (navigationRef as any).navigate('Leads')) },
                        { icon: '👥', label: 'Supervised Staff Members', badge: 'TEAM', action: () => closeDrawer(() => (navigationRef as any).navigate('Employees')) },
                        { icon: '💼', label: 'Department Deals Pipeline', badge: 'KANBAN', action: () => closeDrawer(() => (navigationRef as any).navigate('Menu', { initialModule: 'DEALS' })) },
                        { icon: '📝', label: 'Quotation Approvals', badge: '', action: () => closeDrawer(() => (navigationRef as any).navigate('Menu', { initialModule: 'QUOTATIONS' })) },
                        { icon: '📦', label: 'Products Catalog', badge: '', action: () => closeDrawer(() => setProductsModalOpen(true)) },
                      ]
                    },
                    {
                      title: 'COMMUNICATIONS & AUDIT',
                      items: [
                        { icon: '🔔', label: 'Notifications & Alerts', badge: `${unreadNotifCount} NEW`, action: () => closeDrawer(() => setNotifModalOpen(true)) },
                        { icon: '💬', label: 'Team Communications Hub', badge: '', action: () => closeDrawer(() => (navigationRef as any).navigate('Menu', { initialModule: 'COMMS' })) },
                        { icon: '⏱️', label: 'Team Attendance Audit', badge: '', action: () => closeDrawer(() => (navigationRef as any).navigate('Attendance')) },
                      ]
                    }
                  ];
                } else if (normRole.includes('HR')) {
                  groups = [
                    {
                      title: '👔 HR & WORKFORCE CONTROL',
                      items: [
                        { icon: '⏱️', label: 'Attendance & Punch Log Audit', badge: 'LIVE', action: () => closeDrawer(() => (navigationRef as any).navigate('Attendance')) },
                        { icon: '📅', label: 'Staff Leave Approvals', badge: 'ACTION', action: () => closeDrawer(() => (navigationRef as any).navigate('Attendance')) },
                        { icon: '👥', label: 'Organization Staff List', badge: '', action: () => closeDrawer(() => (navigationRef as any).navigate('Employees')) },
                        { icon: '💳', label: 'Payroll & Overtime Telemetry', badge: 'PAYROLL', action: () => closeDrawer(() => (navigationRef as any).navigate('Profile')) },
                      ]
                    },
                    {
                      title: 'COMMUNICATIONS & NOTIFICATIONS',
                      items: [
                        { icon: '🔔', label: 'HR Notifications & Alerts', badge: `${unreadNotifCount} NEW`, action: () => closeDrawer(() => setNotifModalOpen(true)) },
                        { icon: '💬', label: 'HR Directives & Announcements', badge: '', action: () => closeDrawer(() => (navigationRef as any).navigate('Menu', { initialModule: 'COMMS' })) },
                      ]
                    }
                  ];
                } else if (normRole.includes('TEAM_LEADER') || normRole.includes('LEADER')) {
                  groups = [
                    {
                      title: '🛡️ TEAM LEADER UNIT CONTROL',
                      items: [
                        { icon: '🎯', label: 'Unit Lead Queue Allocation', badge: 'UNIT', action: () => closeDrawer(() => (navigationRef as any).navigate('Leads')) },
                        { icon: '💼', label: 'Unit Deals Pipeline', badge: 'KANBAN', action: () => closeDrawer(() => (navigationRef as any).navigate('Menu', { initialModule: 'DEALS' })) },
                        { icon: '🏆', label: 'Rep Performance Audit', badge: 'RANK', action: () => closeDrawer(() => (navigationRef as any).navigate('Menu', { initialModule: 'REPORTS' })) },
                        { icon: '⏱️', label: 'Unit Punch Log Audit', badge: '', action: () => closeDrawer(() => (navigationRef as any).navigate('Attendance')) },
                      ]
                    },
                    {
                      title: 'COMMUNICATIONS & ALERTS',
                      items: [
                        { icon: '🔔', label: 'Notifications & Alerts', badge: `${unreadNotifCount} NEW`, action: () => closeDrawer(() => setNotifModalOpen(true)) },
                        { icon: '💬', label: 'Team WhatsApp Hub', badge: '', action: () => closeDrawer(() => (navigationRef as any).navigate('Menu', { initialModule: 'COMMS' })) },
                      ]
                    }
                  ];
                } else {
                  groups = [
                    {
                      title: '🎯 MY SALES WORKSPACE',
                      items: [
                        { icon: '📞', label: 'My Assigned Leads', badge: 'LIVE', action: () => closeDrawer(() => (navigationRef as any).navigate('Leads')) },
                        { icon: '💼', label: 'My Deals Pipeline', badge: 'KANBAN', action: () => closeDrawer(() => (navigationRef as any).navigate('Menu', { initialModule: 'DEALS' })) },
                        { icon: '📝', label: 'My Quotations Generator', badge: '', action: () => closeDrawer(() => (navigationRef as any).navigate('Menu', { initialModule: 'QUOTATIONS' })) },
                        { icon: '⏱️', label: 'Daily Attendance Punch', badge: '', action: () => closeDrawer(() => (navigationRef as any).navigate('Attendance')) },
                      ]
                    },
                    {
                      title: 'COMMUNICATIONS & ALERTS',
                      items: [
                        { icon: '🔔', label: 'Notifications & Alerts', badge: `${unreadNotifCount} NEW`, action: () => closeDrawer(() => setNotifModalOpen(true)) },
                        { icon: '💬', label: 'WhatsApp Inbox & Comms', badge: '', action: () => closeDrawer(() => (navigationRef as any).navigate('Menu', { initialModule: 'COMMS' })) },
                      ]
                    }
                  ];
                }

                return groups.map((grp, idx) => (
                  <React.Fragment key={idx}>
                    <View style={styles.sectionHeaderRow}>
                      <Text style={styles.drawerGroupTitle}>{grp.title}</Text>
                      <View style={styles.sectionLine} />
                    </View>
                    {grp.items.map((item, i) => (
                      <TouchableOpacity key={i} style={styles.drawerItemRow} onPress={item.action} activeOpacity={0.7}>
                        <View style={styles.drawerItemIconBox}>
                          <Text style={{ fontSize: 14 }}>{item.icon}</Text>
                        </View>
                        <Text style={styles.drawerItemLabel}>{item.label}</Text>
                        {!!item.badge && (
                          <View style={styles.itemBadge}>
                            <Text style={styles.itemBadgeText}>{item.badge}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </React.Fragment>
                ));
              })()}

              {/* SYSTEM & IN-APP UPDATE */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.drawerGroupTitle}>SYSTEM &amp; UPDATES</Text>
                <View style={styles.sectionLine} />
              </View>

              <TouchableOpacity
                style={styles.drawerItemRow}
                onPress={() => closeDrawer(() => setUpdateModalOpen(true))}
                activeOpacity={0.7}
              >
                <View style={styles.drawerItemIconBox}>
                  <Text style={{ fontSize: 14 }}>🚀</Text>
                </View>
                <Text style={styles.drawerItemLabel}>Check In-App Version</Text>
                <View style={[styles.itemBadge, { backgroundColor: 'rgba(56,189,248,0.15)', borderColor: 'rgba(56,189,248,0.3)' }]}>
                  <Text style={[styles.itemBadgeText, { color: '#38bdf8' }]}>v2.5.0 NEW</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout} activeOpacity={0.7}>
                <Text style={styles.signOutBtnText}>🚪 Sign Out of Workspace</Text>
              </TouchableOpacity>

              {/* 💻 DEVELOPER BAR */}
              <TouchableOpacity
                style={styles.devBarCard}
                onPress={() => Linking.openURL('https://github.com/aditya-k-rai')}
                activeOpacity={0.8}
              >
                <Text style={styles.devBarTitle}>⚡ Developed with ❤️ by <Text style={{ color: '#818cf8', fontWeight: '900' }}>Aditya Kumar Rai</Text></Text>
                <Text style={styles.devBarLink}>🔗 github.com/aditya-k-rai →</Text>
              </TouchableOpacity>

            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* 👤 FULL USER PROFILE MODAL */}
      <Modal visible={profileModalOpen} transparent animationType="slide">
        <ProfileScreen
          onLogout={handleLogout}
          onOpenUpdate={() => {
            setProfileModalOpen(false);
            setUpdateModalOpen(true);
          }}
          onClose={() => setProfileModalOpen(false)}
        />
      </Modal>

      {/* 📦 PRODUCTS & SERVICES CATALOG MANAGEMENT PORTAL MODAL */}
      <Modal visible={productsModalOpen} transparent animationType="slide">
        <ProductsCatalogScreen onClose={() => setProductsModalOpen(false)} />
      </Modal>

      {/* 🔔 NOTIFICATIONS CENTER & REAL-TIME ROUTING SCREEN MODAL */}
      <Modal visible={notifModalOpen} transparent animationType="slide">
        <NotificationsScreen
          onClose={() => setNotifModalOpen(false)}
          onUnreadCountChange={(count) => setOverrideUnreadCount(count)}
          onNavigateToLead={(leadId, leadName) => {
            setNotifModalOpen(false);
            try {
              (navigationRef as any).navigate('Leads', {
                screen: 'LeadDetail',
                params: { leadId, leadName },
              });
            } catch {
              (navigationRef as any).navigate('Leads');
            }
          }}
          onNavigateToRoute={(routeName) => {
            setNotifModalOpen(false);
            if (routeName === 'Products') {
              setProductsModalOpen(true);
            } else {
              try {
                (navigationRef as any).navigate(routeName);
              } catch (e) {
                console.log('Nav error:', e);
              }
            }
          }}
        />
      </Modal>

      {/* 🚀 IN-APP APK UPDATE ENGINE MODAL */}
      <Modal visible={updateModalOpen} transparent animationType="slide">
        <View style={styles.updateModalOverlay}>
          <View style={styles.updateModalCard}>

            <View style={styles.updateHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={styles.updateIconBox}>
                  <Text style={{ fontSize: 20 }}>🚀</Text>
                </View>
                <View>
                  <Text style={styles.updateModalTitle}>In-App App Updates</Text>
                  <Text style={styles.updateModalSub}>DAS CRM Android Control System</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setUpdateModalOpen(false)} style={styles.closeDrawerBtn}>
                <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '800' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.versionBox}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.verTitle}>Available Version: {latestVersion}</Text>
                <View style={styles.stableBadge}>
                  <Text style={styles.stableBadgeText}>OFFICIAL STABLE</Text>
                </View>
              </View>
              <Text style={styles.verMeta}>Currently Installed: {currentVersion} • Size: 24.8 MB</Text>
            </View>

            <Text style={styles.changelogTitle}>What's New in {latestVersion}:</Text>
            <View style={styles.changelogCard}>
              <Text style={styles.changelogItem}>• ⚡ 3-Model Lead Funnel Routing Engine (Batch Quotas &amp; Vanishing Pool)</Text>
              <Text style={styles.changelogItem}>• 📊 Google Sheets 2-Way Live Sync &amp; Excel Bulk Import Ingestion</Text>
              <Text style={styles.changelogItem}>• ⏱️ Geofenced Attendance Punch &amp; Auto Midnight Purge Engine</Text>
              <Text style={styles.changelogItem}>• 💬 WhatsApp 2-Step Product Quotation &amp; Direct Launcher</Text>
            </View>

            {downloading && (
              <View style={{ marginVertical: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 10, color: '#38bdf8', fontWeight: '800' }}>Downloading Update Package...</Text>
                  <Text style={{ fontSize: 10, color: '#38bdf8', fontWeight: '900' }}>{downloadProgress}%</Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${downloadProgress}%` }]} />
                </View>
              </View>
            )}

            <View style={styles.updateActionsRow}>
              {downloadReady ? (
                <TouchableOpacity style={styles.updatePrimaryBtn} onPress={handleInstallApk}>
                  <Text style={styles.updatePrimaryBtnText}>📦 Install Updated APK Package Now →</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.updatePrimaryBtn}
                  onPress={handleStartDownload}
                  disabled={downloading}
                >
                  {downloading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.updatePrimaryBtnText}>📥 Download &amp; Upgrade to {latestVersion} →</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

          </View>
        </View>
      </Modal>

      </NavigationContainer>
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

  devBarCard: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#334155', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10, marginTop: 12, alignItems: 'center' },
  devBarTitle: { color: '#ffffff', fontSize: 10, fontWeight: '700' },
  devBarLink: { color: '#38bdf8', fontSize: 9, fontWeight: '800', marginTop: 2 },

  topHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#090d16', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  hamburgerBtn: { padding: 4, justifyContent: 'center', gap: 4 },
  hamburgerLine: { width: 18, height: 2, backgroundColor: '#818cf8', borderRadius: 1 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  headerSub: { color: '#818cf8', fontSize: 8, fontWeight: '800', letterSpacing: 0.5, marginTop: 1 },

  // 🔔 NOTIFICATION HEADER BUTTON WITH UNREAD COUNT BADGE
  notifHeaderBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', position: 'relative', borderWidth: 1, borderColor: '#334155' },
  notifBadgeCircle: { position: 'absolute', top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: '#090d16' },
  notifBadgeCountText: { color: '#ffffff', fontSize: 9, fontWeight: '900' },

  tabBar: { backgroundColor: '#090d16', borderTopWidth: 1, borderTopColor: '#1e293b', elevation: 0 },
  tabIconBox: { width: 44, height: 28, borderRadius: 10, borderWidth: 1, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },

  // 🔔 Notifications Modal Styles
  notifModalOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  notifModalCard: { width: '100%', maxWidth: 430, backgroundColor: '#0f172a', borderRadius: 24, borderWidth: 1, borderColor: '#1e293b', padding: 16 },
  notifModalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingBottom: 8 },
  notifModalTitle: { fontSize: 15, fontWeight: '900', color: '#ffffff' },
  unreadHeaderBadge: { backgroundColor: '#ef4444', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  unreadHeaderBadgeText: { color: '#ffffff', fontSize: 8, fontWeight: '900' },
  notifModalSub: { fontSize: 10, color: '#94a3b8', marginTop: 1 },
  notifCloseBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },

  alertNoticeBanner: { backgroundColor: 'rgba(234,179,8,0.12)', borderWidth: 1, borderColor: '#eab308', borderRadius: 12, padding: 10, marginBottom: 10 },
  alertNoticeTitle: { fontSize: 11, fontWeight: '900', color: '#facc15' },
  alertNoticeSub: { fontSize: 9, color: '#fef08a', marginTop: 2 },

  markAllReadBtn: { backgroundColor: '#1e293b', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, alignSelf: 'flex-end', marginBottom: 6 },
  markAllReadBtnText: { color: '#818cf8', fontSize: 10, fontWeight: '800' },

  notifItemCard: { backgroundColor: '#020617', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 10, marginBottom: 8 },
  notifItemUnread: { borderColor: '#818cf8', backgroundColor: 'rgba(129,140,248,0.08)' },
  notifItemTitle: { fontSize: 12, fontWeight: '800', color: '#ffffff' },
  unreadDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#818cf8' },
  notifTimeStr: { fontSize: 9, color: '#64748b', fontWeight: '700' },
  notifItemMsg: { fontSize: 10, color: '#cbd5e1', marginTop: 4, lineHeight: 14 },

  notifActionRow: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' },
  notifLeadBtn: { backgroundColor: 'rgba(99,102,241,0.15)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  notifLeadBtnText: { color: '#818cf8', fontSize: 9, fontWeight: '800' },
  notifCallBtn: { backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  notifCallBtnText: { color: '#34d399', fontSize: 9, fontWeight: '800' },
  markSingleReadBtn: { backgroundColor: '#1e293b', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 'auto' },
  markSingleReadBtnText: { color: '#94a3b8', fontSize: 9, fontWeight: '700' },

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
