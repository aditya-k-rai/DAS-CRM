/**
 * LeadDistributionHubScreen.tsx — DAS CRM Android
 * Full 1:1 Parity with Web Team Leader Lead Distribution Hub (/tl/lead-assignment)
 *
 * Features:
 * 1. 🎯 Top KPI Cards: Unallocated Pool, Distributed Leads, Active Sales Reps, Selected Count
 * 2. 🔀 Filter Tabs: PENDING (TL Pool), DISTRIBUTED, ALL
 * 3. 👥 Target Sales Rep Selector with Live Workload Counts
 * 4. ⚡ Batch Lead Allocation with Optimistic Local Updates & Server Sync
 * 5. 🔍 Multi-field Search (Name, Phone, Email, Source, Company, Assignee)
 * 6. 📱 Responsive Native UI with Theme & Safe Area Support
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { apiService, LeadItem, Employee } from '../services/apiService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  onClose?: () => void;
  onNavigateToLead?: (leadId: string) => void;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  leadsCount: number;
}

export const LeadDistributionHubScreen: React.FC<Props> = ({ onClose, onNavigateToLead }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const token = useAuthStore((s) => s.token);
  const currentUser = useAuthStore((s) => s.currentUser);

  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [selectedRepId, setSelectedRepId] = useState<string>('');
  const [filterView, setFilterView] = useState<'PENDING' | 'DISTRIBUTED' | 'ALL'>('PENDING');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [repModalVisible, setRepModalVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const myId = currentUser?.id;
  const myName = (currentUser?.name || '').trim().toLowerCase();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper: Is this lead in the Team Leader's unallocated pool waiting to be distributed to sales reps?
  const isTLPoolLead = useCallback(
    (l: LeadItem) => {
      // 1. Assigned to Team Leader directly
      if (myId && l.ownerId === myId) return true;
      if (myName && l.assignedRep && l.assignedRep.toLowerCase().includes(myName)) return true;
      // 2. Unassigned entirely
      if (!l.ownerId || l.assignedRep === 'Unassigned' || !l.assignedRep) return true;
      return false;
    },
    [myId, myName]
  );

  // Load leads and team members
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [leadsData, empResult] = await Promise.all([
        apiService.getLeads(token),
        apiService.getEmployees(token),
      ]);

      setLeads(leadsData || []);

      const rawUsers = empResult?.employees || [];
      // Filter sales reps
      let repsList = rawUsers.filter((u: Employee) => {
        const r = (u.role || '').toUpperCase();
        return (
          r.includes('SALES') ||
          r.includes('EXEC') ||
          r.includes('REP') ||
          r.includes('EMPLOYEE')
        );
      });

      if (repsList.length === 0) {
        repsList = rawUsers.filter((u: Employee) => u.id !== myId);
      }

      const calculatedTeam: TeamMember[] = repsList.map((u: Employee) => {
        const count = (leadsData || []).filter(
          (l: LeadItem) =>
            l.ownerId === u.id ||
            (l.assignedRep && l.assignedRep.toLowerCase().includes(u.name.toLowerCase()))
        ).length;
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role || 'Sales Representative',
          leadsCount: count,
        };
      });

      setTeamMembers(calculatedTeam);
      if (calculatedTeam.length > 0 && !selectedRepId) {
        setSelectedRepId(calculatedTeam[0].id);
      }
    } catch (err) {
      console.warn('Error loading lead assignment data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, myId, selectedRepId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived counts
  const poolLeads = useMemo(() => leads.filter(isTLPoolLead), [leads, isTLPoolLead]);
  const distributedLeads = useMemo(() => leads.filter((l) => !isTLPoolLead(l)), [leads, isTLPoolLead]);

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (filterView === 'PENDING') {
        if (!isTLPoolLead(l)) return false;
      } else if (filterView === 'DISTRIBUTED') {
        if (isTLPoolLead(l)) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const match =
          (l.name && l.name.toLowerCase().includes(q)) ||
          (l.company && l.company.toLowerCase().includes(q)) ||
          (l.email && l.email.toLowerCase().includes(q)) ||
          (l.phone && l.phone.toLowerCase().includes(q)) ||
          (l.source && l.source.toLowerCase().includes(q)) ||
          (l.assignedRep && l.assignedRep.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [leads, filterView, search, isTLPoolLead]);

  const toggleSelectLead = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map((l) => l.id));
    }
  };

  const selectedRep = useMemo(
    () => teamMembers.find((m) => m.id === selectedRepId) || teamMembers[0],
    [teamMembers, selectedRepId]
  );

  // Execute Lead Distribution
  const handleAssignLeads = async (leadIdsToAssign: string[], targetRepId: string) => {
    if (leadIdsToAssign.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one lead to assign.');
      return;
    }
    if (!targetRepId) {
      Alert.alert('Representative Required', 'Please select a target Sales Representative.');
      return;
    }

    const rep = teamMembers.find((m) => m.id === targetRepId);
    const repName = rep?.name || 'Assigned Rep';

    setIsSubmitting(true);
    try {
      await apiService.allocateLeads(token, leadIdsToAssign, targetRepId);

      // Optimistic state updates
      setLeads((prev) =>
        prev.map((l) =>
          leadIdsToAssign.includes(l.id)
            ? { ...l, ownerId: targetRepId, assignedRep: repName, _synced: false }
            : l
        )
      );

      // Update team member lead count
      setTeamMembers((prev) =>
        prev.map((m) =>
          m.id === targetRepId
            ? { ...m, leadsCount: m.leadsCount + leadIdsToAssign.length }
            : m
        )
      );

      setSelectedLeadIds([]);
      showToast(`✅ Allocated ${leadIdsToAssign.length} lead(s) to ${repName}!`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to allocate leads.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 16),
            backgroundColor: colors.cardBg,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
              <Text style={[styles.backBtnText, { color: colors.text }]}>←</Text>
            </TouchableOpacity>
          )}
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 18 }}>🔀</Text>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Lead Distribution Hub
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Allocate pool leads to Sales Representatives
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={fetchData}
          disabled={isLoading}
          style={[styles.refreshIconBtn, { borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#6366f1" />
          ) : (
            <Text style={{ fontSize: 16 }}>🔄</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Toast Notification */}
      {toastMessage ? (
        <View style={styles.toastBanner}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchData} tintColor="#6366f1" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* TOP KPI CARDS */}
        <View style={styles.kpiGrid}>
          {/* Card 1: Pending Allocation */}
          <TouchableOpacity
            style={[
              styles.kpiCard,
              {
                backgroundColor: isDark ? '#1e1b4b' : '#eef2ff',
                borderColor: filterView === 'PENDING' ? '#6366f1' : 'transparent',
              },
            ]}
            onPress={() => setFilterView('PENDING')}
            activeOpacity={0.8}
          >
            <Text style={styles.kpiIcon}>📥</Text>
            <Text style={[styles.kpiValue, { color: '#6366f1' }]}>{poolLeads.length}</Text>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Pending Pool</Text>
          </TouchableOpacity>

          {/* Card 2: Distributed */}
          <TouchableOpacity
            style={[
              styles.kpiCard,
              {
                backgroundColor: isDark ? '#064e3b' : '#ecfdf5',
                borderColor: filterView === 'DISTRIBUTED' ? '#10b981' : 'transparent',
              },
            ]}
            onPress={() => setFilterView('DISTRIBUTED')}
            activeOpacity={0.8}
          >
            <Text style={styles.kpiIcon}>✅</Text>
            <Text style={[styles.kpiValue, { color: '#10b981' }]}>{distributedLeads.length}</Text>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Distributed</Text>
          </TouchableOpacity>

          {/* Card 3: Active Reps */}
          <View
            style={[
              styles.kpiCard,
              {
                backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
              },
            ]}
          >
            <Text style={styles.kpiIcon}>👥</Text>
            <Text style={[styles.kpiValue, { color: colors.text }]}>{teamMembers.length}</Text>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Active Reps</Text>
          </View>
        </View>

        {/* TARGET SALES REPRESENTATIVE SELECTOR */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: colors.cardBg, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            🎯 Target Sales Representative
          </Text>
          <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>
            Select the team member who will receive the chosen leads
          </Text>

          <TouchableOpacity
            style={[
              styles.repPickerButton,
              { backgroundColor: isDark ? '#111827' : '#f9fafb', borderColor: colors.border },
            ]}
            onPress={() => setRepModalVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.repPickerLeft}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {selectedRep?.name ? selectedRep.name.charAt(0).toUpperCase() : 'R'}
                </Text>
              </View>
              <View>
                <Text style={[styles.repPickerName, { color: colors.text }]}>
                  {selectedRep?.name || 'Select Representative'}
                </Text>
                <Text style={[styles.repPickerEmail, { color: colors.textSecondary }]}>
                  {selectedRep?.email || 'No rep chosen'}
                </Text>
              </View>
            </View>

            <View style={styles.repPickerRight}>
              <View style={styles.workloadBadge}>
                <Text style={styles.workloadText}>
                  {selectedRep?.leadsCount ?? 0} Assigned Leads
                </Text>
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 16 }}>▼</Text>
            </View>
          </TouchableOpacity>

          {/* DISTRIBUTION ACTION CTA */}
          <TouchableOpacity
            style={[
              styles.distributeBtn,
              {
                opacity: selectedLeadIds.length === 0 || isSubmitting ? 0.5 : 1,
              },
            ]}
            disabled={selectedLeadIds.length === 0 || isSubmitting}
            onPress={() => handleAssignLeads(selectedLeadIds, selectedRepId)}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.distributeBtnText}>
                ⚡ Distribute {selectedLeadIds.length} Lead
                {selectedLeadIds.length === 1 ? '' : 's'} to{' '}
                {selectedRep?.name?.split(' ')[0] || 'Rep'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* SEARCH & FILTER CONTROLS */}
        <View style={styles.controlsRow}>
          {/* Search Input */}
          <View
            style={[
              styles.searchBox,
              { backgroundColor: colors.cardBgElevated, borderColor: colors.border },
            ]}
          >
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search leads by name, phone, source..."
              placeholderTextColor={colors.textSecondary}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
                <Text style={{ color: colors.textSecondary, fontSize: 14 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* TAB TOGGLES & SELECT ALL BAR */}
        <View style={styles.tabAndSelectBar}>
          <View style={styles.tabGroup}>
            {(['PENDING', 'DISTRIBUTED', 'ALL'] as const).map((tab) => {
              const active = filterView === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tabItem,
                    active && { backgroundColor: '#6366f1' },
                    !active && { borderColor: colors.border },
                  ]}
                  onPress={() => setFilterView(tab)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tabItemText,
                      { color: active ? '#ffffff' : colors.textSecondary },
                    ]}
                  >
                    {tab === 'PENDING'
                      ? `Pending (${poolLeads.length})`
                      : tab === 'DISTRIBUTED'
                      ? `Distributed (${distributedLeads.length})`
                      : `All (${leads.length})`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Select All Checkbox Button */}
          {filteredLeads.length > 0 && (
            <TouchableOpacity
              style={[
                styles.selectAllBtn,
                { backgroundColor: colors.cardBgElevated, borderColor: colors.border },
              ]}
              onPress={selectAllFiltered}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  selectedLeadIds.length === filteredLeads.length && styles.checkboxChecked,
                ]}
              >
                {selectedLeadIds.length === filteredLeads.length && (
                  <Text style={styles.checkIcon}>✓</Text>
                )}
              </View>
              <Text style={[styles.selectAllText, { color: colors.text }]}>
                {selectedLeadIds.length === filteredLeads.length
                  ? 'Deselect All'
                  : `Select All (${filteredLeads.length})`}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* LEADS LIST */}
        {filteredLeads.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.cardBg, borderColor: colors.border },
            ]}
          >
            <Text style={{ fontSize: 36, marginBottom: 8 }}>📭</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Leads Found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {filterView === 'PENDING'
                ? 'All pool leads have been distributed to sales reps!'
                : 'No leads match your current search criteria.'}
            </Text>
          </View>
        ) : (
          filteredLeads.map((lead) => {
            const isSelected = selectedLeadIds.includes(lead.id);
            const isPool = isTLPoolLead(lead);

            return (
              <TouchableOpacity
                key={lead.id}
                style={[
                  styles.leadCard,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: isSelected ? '#6366f1' : colors.border,
                    borderWidth: isSelected ? 1.5 : 1,
                  },
                ]}
                onPress={() => toggleSelectLead(lead.id)}
                activeOpacity={0.8}
              >
                <View style={styles.leadCardTop}>
                  {/* Checkbox */}
                  <TouchableOpacity
                    style={[styles.checkbox, isSelected && styles.checkboxChecked]}
                    onPress={() => toggleSelectLead(lead.id)}
                  >
                    {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                  </TouchableOpacity>

                  {/* Name & Source */}
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.leadName, { color: colors.text }]} numberOfLines={1}>
                        {lead.name}
                      </Text>
                      {isPool ? (
                        <View style={styles.poolBadge}>
                          <Text style={styles.poolBadgeText}>POOL</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text
                      style={[styles.leadCompany, { color: colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {lead.company || lead.organization || 'Enterprise Prospect'}
                    </Text>
                  </View>

                  {/* Value / Priority */}
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.leadValue, { color: '#10b981' }]}>
                      {lead.value || '₹0'}
                    </Text>
                    <View
                      style={[
                        styles.sourceBadge,
                        { backgroundColor: isDark ? '#374151' : '#e5e7eb' },
                      ]}
                    >
                      <Text style={[styles.sourceBadgeText, { color: colors.textSecondary }]}>
                        {lead.source || 'Direct'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Contact Info Row */}
                <View style={[styles.contactRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.contactText, { color: colors.textSecondary }]}>
                    📞 {lead.phone || 'No phone'}
                  </Text>
                  <Text
                    style={[styles.contactText, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    ✉️ {lead.email || 'No email'}
                  </Text>
                </View>

                {/* Assignee & Quick Action Footer */}
                <View style={styles.leadCardFooter}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>Assignee:</Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: isPool ? '#f59e0b' : '#6366f1',
                      }}
                    >
                      {lead.assignedRep || (isPool ? 'Unallocated (Pool)' : 'Assigned')}
                    </Text>
                  </View>

                  {/* Quick 1-Lead Allocate Button */}
                  <TouchableOpacity
                    style={[
                      styles.quickAssignBtn,
                      { backgroundColor: isDark ? '#312e81' : '#e0e7ff' },
                    ]}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      handleAssignLeads([lead.id], selectedRepId);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.quickAssignBtnText}>
                      Assign to {selectedRep?.name?.split(' ')[0] || 'Rep'} →
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* SALES REPRESENTATIVE SELECTION MODAL */}
      <Modal
        visible={repModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRepModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setRepModalVisible(false)}
        >
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.cardBg, borderColor: colors.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Select Sales Representative
              </Text>
              <TouchableOpacity onPress={() => setRepModalVisible(false)}>
                <Text style={{ color: colors.textSecondary, fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {teamMembers.map((member) => {
                const isChosen = member.id === selectedRepId;
                return (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      styles.repListItem,
                      {
                        backgroundColor: isChosen
                          ? isDark
                            ? '#312e81'
                            : '#e0e7ff'
                          : 'transparent',
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => {
                      setSelectedRepId(member.id);
                      setRepModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.repPickerLeft}>
                      <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>
                          {member.name ? member.name.charAt(0).toUpperCase() : 'R'}
                        </Text>
                      </View>
                      <View>
                        <Text style={[styles.repPickerName, { color: colors.text }]}>
                          {member.name}
                        </Text>
                        <Text style={[styles.repPickerEmail, { color: colors.textSecondary }]}>
                          {member.email}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.workloadBadge}>
                      <Text style={styles.workloadText}>{member.leadsCount} Leads</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backBtn: {
    padding: 6,
  },
  backBtnText: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  refreshIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastBanner: {
    backgroundColor: '#065f46',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  toastText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  kpiIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  sectionDesc: {
    fontSize: 12,
    marginBottom: 12,
  },
  repPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  repPickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  repPickerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
  repPickerName: {
    fontSize: 14,
    fontWeight: '700',
  },
  repPickerEmail: {
    fontSize: 11,
  },
  workloadBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  workloadText: {
    color: '#4338ca',
    fontSize: 11,
    fontWeight: '700',
  },
  distributeBtn: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  distributeBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  controlsRow: {
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 42,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  tabAndSelectBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  tabGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  tabItem: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  tabItemText: {
    fontSize: 12,
    fontWeight: '700',
  },
  selectAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectAllText: {
    fontSize: 12,
    fontWeight: '700',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#6366f1',
  },
  checkIcon: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  leadCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  leadCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leadName: {
    fontSize: 14,
    fontWeight: '700',
  },
  poolBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  poolBadgeText: {
    color: '#b45309',
    fontSize: 9,
    fontWeight: '900',
  },
  leadCompany: {
    fontSize: 12,
    marginTop: 1,
  },
  leadValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  sourceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  sourceBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 0.5,
  },
  contactText: {
    fontSize: 11,
  },
  leadCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
  },
  quickAssignBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  quickAssignBtnText: {
    color: '#4f46e5',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginTop: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#374151',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  repListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 0.5,
  },
});

export default LeadDistributionHubScreen;
