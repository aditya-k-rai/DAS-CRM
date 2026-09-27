/**
 * AdminControlCenterScreen.tsx — DAS CRM Android
 * The Admin Control Center Module: comprehensive per-user module access management.
 *
 * Features:
 * 1. Lists all workspace users with their current role badge
 * 2. For each user, shows all 20 modules in a scrollable list
 * 3. Admin can toggle: Active (access), View, Share, Edit per module per user
 * 4. Batch role-reset button to restore defaults per user
 * 5. Global audit trail of recent overrides
 * 6. Policies persist to AsyncStorage via moduleAccessStore
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useModuleAccessStore, ManagedUser, ModulePermission, UserRole } from '../store/moduleAccessStore';
import { getApiBase } from '../config/api';
import { useAuthStore } from '../store/authStore';
import type { ModuleKey } from '../types/moduleTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Module Registry ──────────────────────────────────────────────────────────

interface ModuleDef {
  key: ModuleKey;
  icon: string;
  label: string;
  category: 'SALES' | 'OPERATIONS' | 'ADMIN' | 'COMMUNICATION' | 'AI';
}

const ALL_MODULES: ModuleDef[] = [
  // Sales
  { key: 'PRODUCTS',       icon: '📦', label: 'Product Catalogue',          category: 'SALES' },
  { key: 'PDF_CATALOG',    icon: '📄', label: 'PDF Catalogue',               category: 'SALES' },
  { key: 'QUOTES',         icon: '📝', label: 'Quotations & Invoices',       category: 'SALES' },
  { key: 'DEALS',          icon: '💼', label: 'Deals Pipeline',              category: 'SALES' },
  { key: 'GOALS',          icon: '📈', label: 'Goals & Targets',             category: 'SALES' },
  // Communication
  { key: 'COMMUNICATIONS', icon: '☁️', label: 'WhatsApp Cloud API',         category: 'COMMUNICATION' },
  { key: 'WA_TEMPLATES',   icon: '✏️', label: 'WhatsApp Direct Templates',  category: 'COMMUNICATION' },
  { key: 'EXTRA_EMAIL',    icon: '🚀', label: 'Email Marketing',             category: 'COMMUNICATION' },
  { key: 'UPCOMING_COMMS', icon: '📌', label: 'Notice Board',               category: 'COMMUNICATION' },
  // AI
  { key: 'AI_CONTROL',     icon: '🤖', label: 'AI Customization',           category: 'AI' },
  { key: 'AI_HUB',         icon: '🧠', label: 'AI Hub',                     category: 'AI' },
  // Operations
  { key: 'REPORTS',        icon: '📊', label: 'Reports & Analytics',         category: 'OPERATIONS' },
  { key: 'AUTOMATIONS',    icon: '⚡', label: 'Workflow & Automations',      category: 'OPERATIONS' },
  { key: 'DATABASE',       icon: '🗄️', label: 'Database & Storage',         category: 'OPERATIONS' },
  { key: 'IMPORT_EXPORT',  icon: '🔄', label: 'Bulk Import & Export',        category: 'OPERATIONS' },
  { key: 'ATTENDANCE',     icon: '⏱️', label: 'Attendance',                 category: 'OPERATIONS' },
  { key: 'INTERVIEWS',     icon: '👤', label: 'Interview & Hiring',          category: 'OPERATIONS' },
  // Admin
  { key: 'PROFILE',        icon: '🏢', label: 'Company Profile Settings',   category: 'ADMIN' },
  { key: 'SETTINGS',       icon: '⚙️', label: 'App Settings',              category: 'ADMIN' },
  { key: 'SUPPORT',        icon: '❓', label: 'Support & Help',              category: 'ADMIN' },
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  SALES:         { bg: 'rgba(52,211,153,0.12)', text: '#34d399',  border: 'rgba(52,211,153,0.35)' },
  COMMUNICATION: { bg: 'rgba(56,189,248,0.12)', text: '#38bdf8',  border: 'rgba(56,189,248,0.35)' },
  AI:            { bg: 'rgba(192,132,252,0.12)', text: '#c084fc', border: 'rgba(192,132,252,0.35)' },
  OPERATIONS:    { bg: 'rgba(251,191,36,0.12)', text: '#fbbf24',  border: 'rgba(251,191,36,0.35)' },
  ADMIN:         { bg: 'rgba(239,68,68,0.12)',   text: '#f87171', border: 'rgba(239,68,68,0.35)' },
};

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  SUPER_ADMIN: { label: 'Super Admin',     color: '#f43f5e' },
  ADMIN:       { label: 'Admin',           color: '#6366f1' },
  MANAGER:     { label: 'Manager',         color: '#c084fc' },
  TEAM_LEADER: { label: 'Team Leader',     color: '#fbbf24' },
  HR:          { label: 'HR',              color: '#38bdf8' },
  SALES_EXEC:  { label: 'Sales Exec',      color: '#34d399' },
  UNASSIGNED:  { label: 'Unassigned',      color: '#94a3b8' },
};

// ─── Audit Entry ──────────────────────────────────────────────────────────────

interface AuditEntry {
  id: string;
  ts: string;
  adminName: string;
  targetName: string;
  moduleLabel: string;
  action: string;
}

const AUDIT_KEY = '@das_crm_control_center_audit_v1';

async function appendAudit(entry: AuditEntry) {
  try {
    const raw = await AsyncStorage.getItem(AUDIT_KEY);
    const log: AuditEntry[] = raw ? JSON.parse(raw) : [];
    log.unshift(entry);
    await AsyncStorage.setItem(AUDIT_KEY, JSON.stringify(log.slice(0, 50)));
  } catch {}
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminControlCenterScreen({ onClose }: Props) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuthStore();
  const store = useModuleAccessStore();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [auditOpen, setAuditOpen] = useState(false);
  const [saving, setSaving] = useState<string | null>(null); // PolicyKey currently saving

  // ─── Load users from server + cache ────────────────────────────────────────

  const loadUsers = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    const token = useAuthStore.getState().token;
    const compId = currentUser?.companyId || '';
    const userId = currentUser?.id || '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'x-organization-id': compId,
    };

    let fetchedUsers: ManagedUser[] = [];
    try {
      const res = await fetch(`${getApiBase()}/users?organizationId=${compId}`, { headers, signal });
      if (res.ok) {
        const data: any[] = await res.json();
        fetchedUsers = data
          .filter((u: any) => String(u.id) !== userId) // exclude self
          .map((u: any) => {
            const rawRole = ((u.role?.name || u.role || '') as string).toUpperCase();
            let role: UserRole = 'SALES_EXEC';
            if (rawRole.includes('ADMIN') || rawRole.includes('OWNER')) role = 'ADMIN';
            else if (rawRole.includes('MANAGER')) role = 'MANAGER';
            else if (rawRole.includes('LEADER') || rawRole.includes('TL')) role = 'TEAM_LEADER';
            else if (rawRole.includes('HR')) role = 'HR';
            else if (!rawRole || rawRole === 'UNASSIGNED') role = 'UNASSIGNED';
            const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || u.email;
            return {
              id: String(u.id),
              name,
              email: u.email,
              role,
              avatarInitials: name.slice(0, 2).toUpperCase(),
            } as ManagedUser;
          });
      }
    } catch (err: any) {
      // AbortError is expected on unmount — don't update state
      if (err?.name === 'AbortError') return;
    } finally {
      if (!signal?.aborted) {
        // Fall back to cached list from store if network yielded nothing
        if (fetchedUsers.length === 0) {
          fetchedUsers = store.getManagedUsers();
        }
        // Update cache only when we have fresh data
        if (fetchedUsers.length > 0) {
          await store.setManagedUsers(fetchedUsers);
        }
        setUsers(fetchedUsers);
        setLoading(false);
      }
    }
  }, [currentUser?.companyId, currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAudit = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(AUDIT_KEY);
      setAuditLog(raw ? JSON.parse(raw) : []);
    } catch {}
  }, []);

  // Mount effect with abort signal so state updates never fire on unmounted component
  useEffect(() => {
    const controller = new AbortController();
    loadUsers(controller.signal);
    loadAudit();
    return () => controller.abort();
  }, [loadUsers, loadAudit]);

  // ─── Permission Toggle Handler ──────────────────────────────────────────────

  const handleToggle = async (
    user: ManagedUser,
    mod: ModuleDef,
    field: keyof ModulePermission,
    value: boolean,
  ) => {
    const policyKey = `${user.id}:${mod.key}`;
    setSaving(policyKey + ':' + field);
    await store.setPermission(user.id, mod.key, { [field]: value });

    await appendAudit({
      id: `${Date.now()}`,
      ts: new Date().toLocaleTimeString(),
      adminName: currentUser?.name || 'Admin',
      targetName: user.name,
      moduleLabel: mod.label,
      action: `${field} → ${value ? 'ON' : 'OFF'}`,
    });
    await loadAudit();
    setSaving(null);
  };

  const handleResetUser = (user: ManagedUser) => {
    Alert.alert(
      `Reset ${user.name}'s Permissions`,
      `This will restore all module defaults for ${user.name} (${ROLE_BADGE[user.role]?.label ?? user.role}). Custom overrides will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset to Defaults',
          style: 'destructive',
          onPress: async () => {
            await store.resetUserPermissions(user.id, user.role);
            await appendAudit({
              id: `${Date.now()}`,
              ts: new Date().toLocaleTimeString(),
              adminName: currentUser?.name || 'Admin',
              targetName: user.name,
              moduleLabel: 'ALL MODULES',
              action: 'Reset to role defaults',
            });
            await loadAudit();
          },
        },
      ],
    );
  };

  // ─── Filtered views ─────────────────────────────────────────────────────────

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredModules =
    categoryFilter === 'ALL' ? ALL_MODULES : ALL_MODULES.filter((m) => m.category === categoryFilter);

  // ─── Sub-view: User Module Editor ──────────────────────────────────────────

  if (selectedUser) {
    const user = selectedUser;
    const roleBadge = ROLE_BADGE[user.role] ?? ROLE_BADGE.SALES_EXEC;

    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.cardBg, borderBottomColor: colors.border, paddingTop: Math.max(insets.top + 4, 16) }]}>
          <TouchableOpacity onPress={() => setSelectedUser(null)} style={[styles.backBtn, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]} activeOpacity={0.75}>
            <Text style={[styles.backBtnText, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{user.name}</Text>
            <Text style={[styles.headerSub, { color: colors.textMuted }]}>{user.email}</Text>
          </View>
          <View style={[styles.rolePill, { backgroundColor: roleBadge.color + '22', borderColor: roleBadge.color + '55' }]}>
            <Text style={[styles.rolePillText, { color: roleBadge.color }]}>{roleBadge.label}</Text>
          </View>
        </View>

        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 6 }}>
          {['ALL', 'SALES', 'COMMUNICATION', 'AI', 'OPERATIONS', 'ADMIN'].map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, categoryFilter === cat && { backgroundColor: colors.primary + '33', borderColor: colors.primary }]}
              onPress={() => setCategoryFilter(cat)}
              activeOpacity={0.75}
            >
              <Text style={[styles.catChipText, { color: categoryFilter === cat ? colors.primary : colors.textMuted }]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Legend row */}
        <View style={[styles.legendRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.legendLabel, { color: colors.textMuted, flex: 1 }]}>Module</Text>
          {(['active', 'canView', 'canShare', 'canEdit'] as (keyof ModulePermission)[]).map((f) => (
            <Text key={f} style={[styles.legendLabel, { color: colors.textMuted, width: 48, textAlign: 'center' }]}>
              {f === 'active' ? 'Active' : f === 'canView' ? 'View' : f === 'canShare' ? 'Share' : 'Edit'}
            </Text>
          ))}
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: Math.max(insets.bottom, 24) + 80 }} showsVerticalScrollIndicator={false}>
          {/* Reset button */}
          <TouchableOpacity style={[styles.resetBtn, { borderColor: '#ef4444' }]} onPress={() => handleResetUser(user)} activeOpacity={0.8}>
            <Text style={styles.resetBtnText}>🔄 Reset {user.name.split(' ')[0]}'s Permissions to Role Defaults</Text>
          </TouchableOpacity>

          {filteredModules.map((mod) => {
            const perm = store.getPermission(user.id, user.role, mod.key);
            const catColors = CATEGORY_COLORS[mod.category];
            const isSaving = saving?.startsWith(`${user.id}:${mod.key}`);

            return (
              <View key={mod.key} style={[styles.moduleRow, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                {/* Module identity */}
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[styles.modIconBox, { backgroundColor: catColors.bg, borderColor: catColors.border }]}>
                    <Text style={{ fontSize: 14 }}>{mod.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modLabel, { color: colors.text }]} numberOfLines={1}>{mod.label}</Text>
                    <Text style={[styles.modCat, { color: catColors.text }]}>{mod.category}</Text>
                  </View>
                </View>

                {/* Toggle columns */}
                {isSaving ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginHorizontal: 8 }} />
                ) : (
                  (['active', 'canView', 'canShare', 'canEdit'] as (keyof ModulePermission)[]).map((field) => (
                    <View key={field} style={styles.toggleCell}>
                      <Switch
                        value={!!perm[field]}
                        onValueChange={(val) => handleToggle(user, mod, field, val)}
                        trackColor={{ false: isDark ? '#1e293b' : '#e2e8f0', true: colors.primary + 'aa' }}
                        thumbColor={perm[field] ? colors.primary : (isDark ? '#475569' : '#94a3b8')}
                        ios_backgroundColor={isDark ? '#1e293b' : '#e2e8f0'}
                        style={{ transform: [{ scaleX: 0.78 }, { scaleY: 0.78 }] }}
                      />
                    </View>
                  ))
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  // ─── Main User List View ────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBg, borderBottomColor: colors.border, paddingTop: Math.max(insets.top + 4, 16) }]}>
        <TouchableOpacity onPress={onClose} style={[styles.backBtn, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]} activeOpacity={0.75}>
          <Text style={[styles.backBtnText, { color: colors.primary }]}>← Dashboard</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>🛡️ Control Center</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>Manage module access per user</Text>
        </View>
        <TouchableOpacity
          style={[styles.auditBtn, { backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(79,70,229,0.1)', borderColor: isDark ? '#6366f133' : '#4f46e522' }]}
          onPress={() => { loadAudit(); setAuditOpen(true); }}
          activeOpacity={0.75}
        >
          <Text style={[styles.auditBtnText, { color: colors.primary }]}>📋 Audit</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Banner */}
      <View style={[styles.summaryBanner, { backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(79,70,229,0.06)', borderColor: isDark ? 'rgba(99,102,241,0.25)' : 'rgba(79,70,229,0.2)' }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryVal, { color: colors.text }]}>{users.length}</Text>
          <Text style={[styles.summaryLbl, { color: colors.textMuted }]}>Users</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryVal, { color: colors.text }]}>{ALL_MODULES.length}</Text>
          <Text style={[styles.summaryLbl, { color: colors.textMuted }]}>Modules</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryVal, { color: '#34d399' }]}>{Object.keys(useModuleAccessStore.getState().policies).length}</Text>
          <Text style={[styles.summaryLbl, { color: colors.textMuted }]}>Overrides</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryVal, { color: '#f87171' }]}>{auditLog.length}</Text>
          <Text style={[styles.summaryLbl, { color: colors.textMuted }]}>Audit Log</Text>
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchBox, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
        <Text style={{ color: colors.textMuted, marginRight: 6, fontSize: 14 }}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search users by name or email..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>

      {/* Info tip */}
      <View style={[styles.tipBox, { backgroundColor: isDark ? 'rgba(251,191,36,0.08)' : 'rgba(251,191,36,0.06)', borderColor: 'rgba(251,191,36,0.25)' }]}>
        <Text style={{ fontSize: 11, color: '#fbbf24', fontWeight: '600', lineHeight: 16 }}>
          💡 Tap any user to manage their module access individually. Changes apply immediately and persist across app restarts.
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading workspace users...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: Math.max(insets.bottom, 24) + 80 }} showsVerticalScrollIndicator={false}>
          {filteredUsers.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <Text style={{ fontSize: 28, marginBottom: 8 }}>👥</Text>
              <Text style={[styles.emptyText, { color: colors.text }]}>No Users Found</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                {searchQuery ? 'No users match your search.' : 'No workspace users loaded yet. Check your connection and reload.'}
              </Text>
              <TouchableOpacity style={[styles.reloadBtn, { backgroundColor: colors.primary }]} onPress={() => loadUsers()} activeOpacity={0.8}>
                <Text style={styles.reloadBtnText}>Reload Users</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredUsers.map((user) => {
              const roleBadge = ROLE_BADGE[user.role] ?? ROLE_BADGE.SALES_EXEC;
              // Count overrides
              const overrideCount = Object.keys(store.policies).filter((k) => k.startsWith(`${user.id}:`)).length;
              // Count blocked modules
              const blockedCount = ALL_MODULES.filter((m) => {
                const p = store.getPermission(user.id, user.role, m.key);
                return !p.active;
              }).length;

              return (
                <TouchableOpacity
                  key={user.id}
                  style={[styles.userCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
                  onPress={() => setSelectedUser(user)}
                  activeOpacity={0.8}
                >
                  {/* Avatar */}
                  <View style={[styles.avatar, { backgroundColor: roleBadge.color + '22', borderColor: roleBadge.color + '44' }]}>
                    <Text style={[styles.avatarText, { color: roleBadge.color }]}>{user.avatarInitials}</Text>
                  </View>

                  {/* User Info */}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>{user.name}</Text>
                      <View style={[styles.rolePill, { backgroundColor: roleBadge.color + '20', borderColor: roleBadge.color + '44' }]}>
                        <Text style={[styles.rolePillText, { color: roleBadge.color }]}>{roleBadge.label}</Text>
                      </View>
                    </View>
                    <Text style={[styles.userEmail, { color: colors.textMuted }]} numberOfLines={1}>{user.email}</Text>
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                      {overrideCount > 0 && (
                        <Text style={{ fontSize: 9, color: '#6366f1', fontWeight: '800' }}>
                          ⚙️ {overrideCount} override{overrideCount !== 1 ? 's' : ''}
                        </Text>
                      )}
                      {blockedCount > 0 && (
                        <Text style={{ fontSize: 9, color: '#f87171', fontWeight: '800' }}>
                          🔒 {blockedCount} blocked
                        </Text>
                      )}
                      {overrideCount === 0 && blockedCount === 0 && (
                        <Text style={{ fontSize: 9, color: '#34d399', fontWeight: '800' }}>✓ Role defaults</Text>
                      )}
                    </View>
                  </View>

                  {/* Arrow */}
                  <Text style={{ color: colors.textMuted, fontSize: 16 }}>›</Text>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ─── Audit Log Modal ──────────────────────────────────────────────────── */}
      <Modal visible={auditOpen} transparent animationType="slide" onRequestClose={() => setAuditOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>📋 Admin Override Audit Log</Text>
              <TouchableOpacity onPress={() => setAuditOpen(false)} style={[styles.modalCloseBtn, { backgroundColor: colors.cardBgElevated }]}>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
              {auditLog.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 28 }}>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>No audit entries yet.</Text>
                </View>
              ) : (
                auditLog.map((entry, idx) => (
                  <View key={entry.id} style={[styles.auditEntry, { borderBottomColor: colors.border, borderBottomWidth: idx < auditLog.length - 1 ? 1 : 0 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text }}>
                        {entry.targetName} · {entry.moduleLabel}
                      </Text>
                      <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 1 }}>
                        {entry.action} · by {entry.adminName}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 9, color: colors.textMuted, fontWeight: '600' }}>{entry.ts}</Text>
                  </View>
                ))
              )}
            </ScrollView>
            <TouchableOpacity
              style={[styles.clearAuditBtn, { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)' }]}
              onPress={async () => {
                await AsyncStorage.removeItem(AUDIT_KEY);
                setAuditLog([]);
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#f87171', fontSize: 11, fontWeight: '800' }}>🗑️ Clear Audit Log</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  backBtnText: { fontSize: 12, fontWeight: '800' },
  headerTitle: { fontSize: 16, fontWeight: '900' },
  headerSub: { fontSize: 10, marginTop: 1 },
  auditBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  auditBtnText: { fontSize: 11, fontWeight: '800' },

  summaryBanner: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryVal: { fontSize: 17, fontWeight: '900' },
  summaryLbl: { fontSize: 9, fontWeight: '700', marginTop: 2 },
  summaryDivider: { width: 1, height: 28, marginHorizontal: 4 },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 13, fontWeight: '600' },

  tipBox: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
  },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 12, fontWeight: '600' },

  emptyBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    marginTop: 16,
  },
  emptyText: { fontSize: 14, fontWeight: '800' },
  emptySub: { fontSize: 11, textAlign: 'center', marginTop: 4, lineHeight: 16 },
  reloadBtn: { marginTop: 14, paddingHorizontal: 20, paddingVertical: 9, borderRadius: 10 },
  reloadBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },

  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 14, fontWeight: '900' },
  userName: { fontSize: 13, fontWeight: '800', flex: 1, flexShrink: 1 },
  userEmail: { fontSize: 10, marginTop: 1 },
  rolePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  rolePillText: { fontSize: 9, fontWeight: '800' },

  // User module editor
  categoryRow: { maxHeight: 50 },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.25)',
    backgroundColor: 'transparent',
  },
  catChipText: { fontSize: 10, fontWeight: '700' },

  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  legendLabel: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },

  moduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
  },
  modIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  modLabel: { fontSize: 12, fontWeight: '700' },
  modCat: { fontSize: 9, fontWeight: '700', marginTop: 1 },
  toggleCell: { width: 48, alignItems: 'center' },

  resetBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(239,68,68,0.07)',
  },
  resetBtnText: { color: '#f87171', fontSize: 11, fontWeight: '800' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.85)', justifyContent: 'flex-end' },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 16,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 14, fontWeight: '900' },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auditEntry: { paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  clearAuditBtn: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
  },
});
