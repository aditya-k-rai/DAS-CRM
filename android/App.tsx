import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import LeadsScreen from './src/screens/LeadsScreen';
import LeadDetailScreen from './src/screens/LeadDetailScreen';
import TasksScreen from './src/screens/TasksScreen';
import ProfileScreen from './src/screens/ProfileScreen';

type Tab = 'dashboard' | 'leads' | 'tasks' | 'profile';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Home',    icon: '🏠' },
  { key: 'leads',     label: 'Leads',   icon: '🎯' },
  { key: 'tasks',     label: 'Tasks',   icon: '✅' },
  { key: 'profile',   label: 'Profile', icon: '👤' },
];

export default function App() {
  const [token, setToken]             = useState<string | null>(null);
  const [activeTab, setActiveTab]     = useState<Tab>('dashboard');
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  // Show login screen until authenticated
  if (!token) {
    return <LoginScreen onLogin={setToken} />;
  }

  // If a lead is selected (drill-down from leads list), show detail screen
  if (activeTab === 'leads' && selectedLead) {
    return (
      <LeadDetailScreen
        lead={selectedLead}
        onBack={() => setSelectedLead(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Main content */}
      <View style={styles.content}>
        {activeTab === 'dashboard' && <DashboardScreen />}
        {activeTab === 'leads'     && <LeadsScreen onSelectLead={setSelectedLead} />}
        {activeTab === 'tasks'     && <TasksScreen />}
        {activeTab === 'profile'   && <ProfileScreen />}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => { setActiveTab(tab.key); setSelectedLead(null); }}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <View style={[styles.tabIcon, active && styles.tabIconActive]}>
                <Text style={{ fontSize: 18 }}>{tab.icon}</Text>
              </View>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
              {active && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

// ── Fallback DashboardScreen if separate file not found ──────────
// The real one should be in src/screens/DashboardScreen.tsx

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#060810' },
  content:        { flex: 1 },
  tabBar:         { flexDirection: 'row', backgroundColor: '#0f1117', borderTopWidth: 1, borderColor: '#1e2333', paddingBottom: 4, paddingTop: 6 },
  tabItem:        { flex: 1, alignItems: 'center', position: 'relative' },
  tabIcon:        { width: 36, height: 28, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  tabIconActive:  { backgroundColor: 'rgba(79,70,229,0.15)' },
  tabLabel:       { color: '#374151', fontSize: 10, fontWeight: '600', marginTop: 2 },
  tabLabelActive: { color: '#818cf8' },
  tabIndicator:   { position: 'absolute', bottom: -6, width: 20, height: 3, borderRadius: 2, backgroundColor: '#4f46e5' },
});
