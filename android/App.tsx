/**
 * App.tsx — DAS CRM Android Application Root
 * Restructured Navigation with 5 Bottom Tabs (Home, Leads, Employees, More, Attendance),
 * Top Header Hamburger Menu (☰) with structured quick shortcuts & Profile stack.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuthStore } from './src/store/authStore';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import LeadsScreen from './src/screens/LeadsScreen';
import LeadDetailScreen from './src/screens/LeadDetailScreen';
import EmployeesScreen from './src/screens/EmployeesScreen';
import MoreControlsScreen from './src/screens/MoreControlsScreen';
import HRDashboardScreen from './src/screens/HRDashboardScreen';
import ProfileScreen from './src/screens/ProfileScreen';

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

  return (
    <View style={{ flex: 1, backgroundColor: '#060810' }}>
      {/* 👑 COMMON TOP HEADER WITH HAMBURGER MENU (☰) */}
      <View style={[styles.topHeader, { paddingTop: insets.top > 0 ? insets.top + 6 : 10 }]}>
        <TouchableOpacity style={styles.hamburgerBtn} onPress={onOpenDrawer}>
          <Text style={{ fontSize: 20, color: '#ffffff' }}>☰</Text>
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.topHeaderTitle}>{currentUser.companyName}</Text>
          <Text style={styles.topHeaderRole}>ROLE: {currentUser.role.replace('_', ' ')}</Text>
        </View>

        <TouchableOpacity style={styles.profileHeaderBtn} onPress={onOpenProfile}>
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
          {() => <DashboardScreen onNavigateToLeads={() => navigation.navigate('Leads')} />}
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
          component={HRDashboardScreen}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 16, color }}>⏱️</Text>, tabBarLabel: 'Attendance' }}
        />
      </Tab.Navigator>
    </View>
  );
}

export default function App() {
  const { token, currentUser, logout } = useAuthStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        {!token ? (
          <LoginScreen onLoginSuccess={() => {}} />
        ) : (
          <MainTabNavigator
            onOpenDrawer={() => setDrawerOpen(true)}
            onOpenProfile={() => setProfileModalOpen(true)}
            navigation={{ navigate: () => {} }}
          />
        )}
      </NavigationContainer>

      {/* ☰ HAMBURGER MENU DRAWER SLIDE-OVER MODAL */}
      <Modal visible={drawerOpen} transparent animationType="slide">
        <View style={styles.drawerOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setDrawerOpen(false)} />
          <View style={styles.drawerContent}>

            {/* 👤 User Banner */}
            <View style={styles.drawerUserHeader}>
              <View style={styles.drawerAvatar}>
                <Text style={styles.drawerAvatarText}>{currentUser.avatar}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.drawerUserName}>{currentUser.name}</Text>
                <Text style={styles.drawerUserEmail}>{currentUser.email}</Text>
                <Text style={styles.drawerRoleTag}>ROLE: {currentUser.role.replace('_', ' ')}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.fullProfileBtn}
              onPress={() => { setDrawerOpen(false); setProfileModalOpen(true); }}
            >
              <Text style={styles.fullProfileBtnText}>👤 View Full Profile →</Text>
            </TouchableOpacity>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

              {/* CORE CRM SHORTCUTS */}
              <Text style={styles.drawerGroupTitle}>CORE CRM SHORTCUTS</Text>
              {[
                { icon: '🎯', label: 'Leads Directory', action: () => setDrawerOpen(false) },
                { icon: '⚡', label: 'Leads Funnel Customization', action: () => { setDrawerOpen(false); Alert.alert('Funnel Customization', 'Opening 3-model lead routing & quota setup.'); } },
                { icon: '💼', label: 'Deals & Pipeline Kanban', action: () => { setDrawerOpen(false); Alert.alert('Deals Pipeline', 'Navigating to Deals Kanban pipeline.'); } },
                { icon: '📝', label: 'Quotations & Invoices', action: () => { setDrawerOpen(false); Alert.alert('Quotations', 'Opening Quotation Builder.'); } },
                { icon: '📦', label: 'Products & Services Catalog', action: () => { setDrawerOpen(false); Alert.alert('Catalog', 'Opening Products Catalog.'); } },
              ].map((item, idx) => (
                <TouchableOpacity key={idx} style={styles.drawerItem} onPress={item.action}>
                  <Text style={styles.drawerItemIcon}>{item.icon}</Text>
                  <Text style={styles.drawerItemLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}

              {/* COMMUNICATIONS & GOALS */}
              <Text style={styles.drawerGroupTitle}>COMMUNICATIONS &amp; GOALS</Text>
              {[
                { icon: '💬', label: 'Communications Hub', action: () => { setDrawerOpen(false); Alert.alert('Comms Hub', 'Opening WhatsApp & Call logs audit.'); } },
                { icon: '📧', label: 'Email Marketing & Templates', action: () => { setDrawerOpen(false); Alert.alert('Email Marketing', 'Opening Email templates.'); } },
                { icon: '🎯', label: 'Goals & Targets', action: () => { setDrawerOpen(false); Alert.alert('Goals', 'Opening Target progress tracking.'); } },
                { icon: '⏱️', label: 'Attendance & HR Audit', action: () => setDrawerOpen(false) },
              ].map((item, idx) => (
                <TouchableOpacity key={idx} style={styles.drawerItem} onPress={item.action}>
                  <Text style={styles.drawerItemIcon}>{item.icon}</Text>
                  <Text style={styles.drawerItemLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}

              {/* BOTTOM SYSTEM ACTIONS */}
              <Text style={styles.drawerGroupTitle}>SYSTEM &amp; SUPPORT</Text>
              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => { setDrawerOpen(false); Alert.alert('Contact Support', 'DAS CRM Support Team: support@dascrm.com'); }}
              >
                <Text style={styles.drawerItemIcon}>📞</Text>
                <Text style={styles.drawerItemLabel}>Contact Support</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => { setDrawerOpen(false); Alert.alert('App Update', 'DAS CRM v1.0.0 is up to date.'); }}
              >
                <Text style={styles.drawerItemIcon}>🔄</Text>
                <Text style={styles.drawerItemLabel}>Check for App Updates</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.drawerItem, { marginTop: 10 }]}
                onPress={async () => { setDrawerOpen(false); await logout(); }}
              >
                <Text style={styles.drawerItemIcon}>🚪</Text>
                <Text style={[styles.drawerItemLabel, { color: '#f87171', fontWeight: '800' }]}>Sign Out / Logout Workspace</Text>
              </TouchableOpacity>

            </ScrollView>
          </View>
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
  hamburgerBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },
  topHeaderTitle: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  topHeaderRole: { fontSize: 8, color: '#818cf8', fontWeight: '800' },
  profileHeaderBtn: { width: 36, height: 36 },
  headerAvatar: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(99,102,241,0.2)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.4)', justifyContent: 'center', alignItems: 'center' },
  headerAvatarText: { fontSize: 14, fontWeight: '800', color: '#818cf8' },

  drawerOverlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.7)', flexDirection: 'row' },
  drawerContent: { width: '82%', maxWidth: 360, backgroundColor: '#0f172a', borderRightWidth: 1, borderRightColor: '#1e293b', padding: 16, paddingTop: 40 },

  drawerUserHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  drawerAvatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(99,102,241,0.2)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.4)', justifyContent: 'center', alignItems: 'center' },
  drawerAvatarText: { fontSize: 16, fontWeight: '900', color: '#818cf8' },
  drawerUserName: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  drawerUserEmail: { fontSize: 10, color: '#94a3b8' },
  drawerRoleTag: { fontSize: 8, color: '#34d399', fontWeight: '800', marginTop: 2 },

  fullProfileBtn: { backgroundColor: 'rgba(99,102,241,0.15)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)', paddingVertical: 8, borderRadius: 10, alignItems: 'center', marginBottom: 16 },
  fullProfileBtnText: { color: '#a5b4fc', fontSize: 11, fontWeight: '800' },

  drawerGroupTitle: { fontSize: 9, fontWeight: '800', color: '#64748b', letterSpacing: 0.5, marginTop: 12, marginBottom: 6 },
  drawerItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#020617' },
  drawerItemIcon: { fontSize: 14 },
  drawerItemLabel: { fontSize: 12, color: '#f8fafc', fontWeight: '600' },
});
