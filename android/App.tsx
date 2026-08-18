/**
 * App.tsx — DAS CRM Android
 * Mirrors frontend-web routing (Next.js App Router) using React Navigation.
 *
 * Auth Guard:
 *   token === null  →  Auth Stack (LoginScreen)
 *   token exists    →  App Stack (Bottom Tabs, role-filtered)
 *
 * Role → Default Tab mapping (mirrors getPostLoginRedirectRoute in LoginGateway.tsx):
 *   ADMIN, MANAGER, TEAM_LEADER, SALES_EXEC  →  Dashboard tab
 *   HR                                        →  HR tab
 *
 * Bottom Tab visibility per role (mirrors Sidebar.tsx group filtering):
 *   Dashboard  — all roles
 *   Leads      — ADMIN, MANAGER, TEAM_LEADER, SALES_EXEC
 *   Tasks      — all roles
 *   HR         — ADMIN, HR only
 *   Profile    — all roles
 */

import React, { useEffect } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import LeadsScreen from './src/screens/LeadsScreen';
import LeadDetailScreen from './src/screens/LeadDetailScreen';
import TasksScreen from './src/screens/TasksScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import HRDashboardScreen from './src/screens/HRDashboardScreen';

// Auth Store
import {
  useAuthStore,
  UserRole,
  normalizeRoleStr,
} from './src/store/authStore';

// ─── Navigator Types ──────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Login: undefined;
};

export type LeadsStackParamList = {
  LeadsList: undefined;
  LeadDetail: { lead: any };
};

export type AppTabParamList = {
  Dashboard: undefined;
  Leads: undefined;
  Tasks: undefined;
  HR: undefined;
  Profile: undefined;
};

const AuthStack = createStackNavigator<AuthStackParamList>();
const LeadsStack = createStackNavigator<LeadsStackParamList>();
const AppTab = createBottomTabNavigator<AppTabParamList>();

// ─── Theme (dark, matches web) ────────────────────────────────────────────────

const CRMTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#060810',
    card: '#0f172a',
    text: '#f8fafc',
    border: '#1e293b',
    primary: '#6366f1',
    notification: '#6366f1',
  },
};

// ─── Role-based tab icons (emoji fallback — no vector icons needed) ───────────

const TAB_ICONS: Record<string, string> = {
  Dashboard: '🏠',
  Leads: '🎯',
  Tasks: '✅',
  HR: '👥',
  Profile: '👤',
};

// ─── Leads Stack (handles drill-down to LeadDetail) ──────────────────────────

function LeadsNavigator() {
  return (
    <LeadsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#f8fafc',
        headerTitleStyle: { fontWeight: '800', fontSize: 16 },
      }}
    >
      <LeadsStack.Screen
        name="LeadsList"
        component={LeadsScreen}
        options={{ headerShown: false }}
      />
      <LeadsStack.Screen
        name="LeadDetail"
        component={({ route }: any) => (
          <LeadDetailScreen
            lead={route.params?.lead}
            onBack={() => {}}
          />
        )}
        options={{ title: 'Lead Details' }}
      />
    </LeadsStack.Navigator>
  );
}

// ─── App Bottom Tabs ──────────────────────────────────────────────────────────

function AppNavigator() {
  const { currentUser, logout } = useAuthStore();
  const role: UserRole = normalizeRoleStr(currentUser?.role);
  const insets = useSafeAreaInsets();

  // Roles that can see Leads tab (mirrors Sidebar items)
  const canSeeleads = ['ADMIN', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC'].includes(role);
  // Roles that can see HR tab (mirrors Sidebar group HR PORTAL)
  const canSeeHR = ['ADMIN', 'HR'].includes(role);

  return (
    <AppTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopWidth: 1,
          borderTopColor: '#1e293b',
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 6,
          height: 54 + (insets.bottom > 0 ? insets.bottom : 8),
        },
        tabBarActiveTintColor: '#818cf8',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 2 },
        tabBarIcon: ({ color, focused }) => {
          const icon = TAB_ICONS[route.name] || '•';
          return (
            <View
              style={{
                width: 38,
                height: 28,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 10,
                backgroundColor: focused ? 'rgba(99,102,241,0.2)' : 'transparent',
              }}
            >
              <Text style={{ fontSize: 16 }}>{icon}</Text>
            </View>
          );
        },
        // Bottom indicator bar for active tab
        tabBarIndicatorStyle: {
          height: 3,
          borderRadius: 2,
          backgroundColor: '#6366f1',
        },
      })}
    >
      {/* Dashboard — all roles */}
      <AppTab.Screen
        name="Dashboard"
        options={{ tabBarLabel: 'Home' }}
      >
        {() => <DashboardScreen userRole={role} />}
      </AppTab.Screen>

      {/* Leads — ADMIN, MANAGER, TEAM_LEADER, SALES_EXEC */}
      {canSeeleads && (
        <AppTab.Screen
          name="Leads"
          component={LeadsNavigator}
          options={{ tabBarLabel: 'Leads' }}
        />
      )}

      {/* Tasks — all roles */}
      <AppTab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{ tabBarLabel: 'Tasks' }}
      />

      {/* HR — ADMIN, HR only */}
      {canSeeHR && (
        <AppTab.Screen
          name="HR"
          component={HRDashboardScreen}
          options={{ tabBarLabel: 'HR Portal' }}
        />
      )}

      {/* Profile — all roles */}
      <AppTab.Screen
        name="Profile"
        options={{ tabBarLabel: 'Profile' }}
      >
        {({ navigation }) => (
          <ProfileScreen
            onLogout={() => {
              // authStore.logout() is called inside ProfileScreen.
              // No navigation needed here — the auth guard will
              // automatically render LoginScreen when token becomes null.
            }}
          />
        )}
      </AppTab.Screen>
    </AppTab.Navigator>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const { token, isHydrated, hydrate } = useAuthStore();

  // Hydrate session from AsyncStorage on first mount
  useEffect(() => {
    hydrate();
  }, []);

  // Show a splash/loading screen while AsyncStorage is being read
  if (!isHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#060810', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={{ color: '#94a3b8', marginTop: 12, fontSize: 13, fontWeight: '600' }}>
          Loading DAS CRM...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer theme={CRMTheme}>
        {token ? (
          // ── Authenticated: show role-filtered tab navigator ──────────
          <AppNavigator />
        ) : (
          // ── Unauthenticated: show login screen ───────────────────────
          <AuthStack.Navigator screenOptions={{ headerShown: false }}>
            <AuthStack.Screen name="Login">
              {() => (
                <LoginScreen
                  onLoginSuccess={(defaultTab) => {
                    /**
                     * After setAuthSession / switchRole, the token in the store
                     * becomes non-null, triggering a re-render of this component
                     * which automatically swaps to AppNavigator.
                     * No manual navigation needed.
                     */
                  }}
                />
              )}
            </AuthStack.Screen>
          </AuthStack.Navigator>
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
