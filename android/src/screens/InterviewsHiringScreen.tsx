/**
 * InterviewsHiringScreen.tsx — DAS CRM Android
 * Candidate Interview & Hiring Pipeline Management
 *
 * Source of Truth: Web /hr/interviews (page.tsx)
 * Accessible to: HR, ADMIN, MANAGER
 *
 * Features:
 * - Interactive 7-Stage Pipeline: Applied, Screening, Interview I, Interview II, Offer Sent, Hired, Rejected
 * - Candidate scoring (1-10), interview mode (Video, In-Person, Phone), and scheduled slots
 * - Quick Outreach (Call, WhatsApp, Email)
 * - Candidate Creation & Edit Modal
 * - Persistent Offline Storage & Sync
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuthStore } from '../store/authStore';
import { ModernAlert } from '../services/modernAlert';

export type InterviewStage = 'APPLIED' | 'SCREENING' | 'INTERVIEW_1' | 'INTERVIEW_2' | 'OFFER' | 'HIRED' | 'REJECTED';
export type InterviewMode = 'VIDEO' | 'IN_PERSON' | 'PHONE';

export interface Candidate {
  id: string;
  name: string;
  initials: string;
  role: string;
  department: string;
  stage: InterviewStage;
  mode: InterviewMode;
  scheduledDate: string;
  interviewer: string;
  score?: number;
  email: string;
  phone: string;
  note?: string;
  createdAt?: string;
}

const STORAGE_KEY = '@das_crm_candidates_v1';

const INITIAL_SEED_CANDIDATES: Candidate[] = [
  {
    id: 'c_1',
    name: 'Rahul Sharma',
    initials: 'RS',
    role: 'Senior Sales Executive',
    department: 'Sales',
    stage: 'INTERVIEW_1',
    mode: 'VIDEO',
    scheduledDate: '2026-10-12 at 02:00 PM',
    interviewer: 'Deepak Verma',
    score: 8,
    email: 'rahul.sharma@example.com',
    phone: '+91 98111 22334',
    note: '5+ years B2B SaaS sales experience with Adorable Trading background.',
  },
  {
    id: 'c_2',
    name: 'Sneha Patel',
    initials: 'SP',
    role: 'Account Manager',
    department: 'Sales',
    stage: 'OFFER',
    mode: 'IN_PERSON',
    scheduledDate: '2026-10-14 at 11:30 AM',
    interviewer: 'Priya Mehta',
    score: 9,
    email: 'sneha.patel@example.com',
    phone: '+91 98222 33445',
    note: 'Offer letter prepared for CTC 8.5 LPA. Awaiting final acceptance.',
  },
  {
    id: 'c_3',
    name: 'Ankit Gupta',
    initials: 'AG',
    role: 'Lead Generation Specialist',
    department: 'Marketing',
    stage: 'SCREENING',
    mode: 'PHONE',
    scheduledDate: '2026-10-11 at 04:30 PM',
    interviewer: 'Deepak Verma',
    score: 7,
    email: 'ankit.gupta@example.com',
    phone: '+91 98333 44556',
    note: 'Strong tele-calling and WhatsApp direct outreach record.',
  },
];

const STAGE_CONFIG: Record<InterviewStage, { label: string; color: string; bg: string; icon: string }> = {
  APPLIED: { label: 'Applied', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', icon: '📄' },
  SCREENING: { label: 'Screening', color: '#06b6d4', bg: 'rgba(6,182,212,0.15)', icon: '📞' },
  INTERVIEW_1: { label: 'Interview I', color: '#6366f1', bg: 'rgba(99,102,241,0.15)', icon: '🎥' },
  INTERVIEW_2: { label: 'Interview II', color: '#a855f7', bg: 'rgba(168,85,247,0.15)', icon: '👥' },
  OFFER: { label: 'Offer Sent', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: '💼' },
  HIRED: { label: 'Hired ✓', color: '#10b981', bg: 'rgba(16,185,129,0.15)', icon: '🎉' },
  REJECTED: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', icon: '✕' },
};

const STAGE_ORDER: InterviewStage[] = ['APPLIED', 'SCREENING', 'INTERVIEW_1', 'INTERVIEW_2', 'OFFER', 'HIRED', 'REJECTED'];

interface InterviewsHiringScreenProps {
  onClose?: () => void;
  navigation?: any;
}

export const InterviewsHiringScreen: React.FC<InterviewsHiringScreenProps> = ({ onClose, navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { currentUser } = useAuthStore();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedStage, setSelectedStage] = useState<InterviewStage | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formDept, setFormDept] = useState('Sales');
  const [formStage, setFormStage] = useState<InterviewStage>('APPLIED');
  const [formMode, setFormMode] = useState<InterviewMode>('VIDEO');
  const [formDate, setFormDate] = useState('');
  const [formInterviewer, setFormInterviewer] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formScore, setFormScore] = useState('8');
  const [formNote, setFormNote] = useState('');

  // Load candidates
  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCandidates(parsed);
            setLoading(false);
            return;
          }
        }
        setCandidates(INITIAL_SEED_CANDIDATES);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_CANDIDATES));
      } catch {
        setCandidates(INITIAL_SEED_CANDIDATES);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const saveCandidatesToStorage = async (updated: Candidate[]) => {
    setCandidates(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const openAddModal = () => {
    setEditingCandidate(null);
    setFormName('');
    setFormRole('');
    setFormDept('Sales');
    setFormStage('APPLIED');
    setFormMode('VIDEO');
    setFormDate(new Date().toISOString().split('T')[0] + ' at 11:00 AM');
    setFormInterviewer(currentUser?.name || 'HR Manager');
    setFormEmail('');
    setFormPhone('');
    setFormScore('8');
    setFormNote('');
    setModalVisible(true);
  };

  const openEditModal = (c: Candidate) => {
    setEditingCandidate(c);
    setFormName(c.name);
    setFormRole(c.role);
    setFormDept(c.department);
    setFormStage(c.stage);
    setFormMode(c.mode);
    setFormDate(c.scheduledDate);
    setFormInterviewer(c.interviewer);
    setFormEmail(c.email);
    setFormPhone(c.phone);
    setFormScore(c.score ? String(c.score) : '8');
    setFormNote(c.note || '');
    setModalVisible(true);
  };

  const handleSaveCandidate = () => {
    if (!formName.trim() || !formRole.trim()) {
      Alert.alert('Missing Fields', 'Please provide at least candidate name and role.');
      return;
    }

    const initials = formName
      .trim()
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const candData: Candidate = {
      id: editingCandidate?.id || `c_${Date.now()}`,
      name: formName.trim(),
      initials: initials || 'CD',
      role: formRole.trim(),
      department: formDept,
      stage: formStage,
      mode: formMode,
      scheduledDate: formDate.trim() || 'TBD',
      interviewer: formInterviewer.trim() || 'HR Manager',
      score: Number(formScore) || 8,
      email: formEmail.trim(),
      phone: formPhone.trim(),
      note: formNote.trim() || undefined,
    };

    let updated: Candidate[];
    if (editingCandidate) {
      updated = candidates.map((c) => (c.id === candData.id ? candData : c));
    } else {
      updated = [candData, ...candidates];
    }

    saveCandidatesToStorage(updated);
    setModalVisible(false);

    ModernAlert.show({
      title: editingCandidate ? 'Candidate Updated!' : 'Candidate Added!',
      message: `${candData.name} has been saved to the ${STAGE_CONFIG[candData.stage].label} stage.`,
      type: 'success',
      icon: '👤',
      accentColor: '#10b981',
    });
  };

  const handleAdvanceStage = (c: Candidate) => {
    const currIdx = STAGE_ORDER.indexOf(c.stage);
    if (currIdx < 0 || currIdx >= STAGE_ORDER.length - 2) {
      // already at offer or hired
      return;
    }
    const nextStage = STAGE_ORDER[currIdx + 1];
    const updated = candidates.map((item) =>
      item.id === c.id ? { ...item, stage: nextStage } : item
    );
    saveCandidatesToStorage(updated);

    ModernAlert.show({
      title: 'Stage Advanced!',
      message: `${c.name} moved to ${STAGE_CONFIG[nextStage].label}.`,
      type: 'info',
      icon: '🚀',
      accentColor: STAGE_CONFIG[nextStage].color,
    });
  };

  const handleRejectCandidate = (c: Candidate) => {
    Alert.alert(
      'Reject Candidate',
      `Move ${c.name} to Rejected status?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            const updated = candidates.map((item) =>
              item.id === c.id ? { ...item, stage: 'REJECTED' as InterviewStage } : item
            );
            saveCandidatesToStorage(updated);
          },
        },
      ]
    );
  };

  const handleCallCandidate = (phone: string) => {
    if (!phone) {
      Alert.alert('No Phone', 'No phone number available for this candidate.');
      return;
    }
    Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, '')}`).catch(() => {
      Alert.alert('Error', 'Could not open phone dialer.');
    });
  };

  const handleWhatsAppCandidate = (phone: string, name: string) => {
    if (!phone) {
      Alert.alert('No Phone', 'No phone number available.');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(`Hi ${name}, reaching out from DAS CRM HR regarding your application.`);
    Linking.openURL(`whatsapp://send?phone=${cleanPhone}&text=${msg}`).catch(() => {
      Linking.openURL(`https://wa.me/${cleanPhone}?text=${msg}`).catch(() => {
        Alert.alert('Error', 'Could not launch WhatsApp.');
      });
    });
  };

  // Filtered List
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      if (selectedStage !== 'ALL' && c.stage !== selectedStage) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          c.name.toLowerCase().includes(q) ||
          c.role.toLowerCase().includes(q) ||
          c.department.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.interviewer.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [candidates, selectedStage, searchQuery]);

  // Counts
  const totalCount = candidates.length;
  const activeCount = candidates.filter((c) => c.stage !== 'HIRED' && c.stage !== 'REJECTED').length;
  const hiredCount = candidates.filter((c) => c.stage === 'HIRED').length;
  const inInterviewCount = candidates.filter((c) => c.stage === 'INTERVIEW_1' || c.stage === 'INTERVIEW_2').length;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBg, borderBottomColor: colors.border, paddingTop: Math.max(insets.top + 8, 20) }]}>
        <View style={styles.headerRow}>
          {onClose ? (
            <TouchableOpacity
              onPress={onClose}
              style={[styles.backBtn, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.backBtnText, { color: colors.primary }]}>← Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerIconBadge}>
              <Text style={{ fontSize: 16 }}>👤</Text>
            </View>
          )}

          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              Hiring & Interviews
            </Text>
            <Text style={[styles.headerSub, { color: colors.textMuted }]} numberOfLines={1}>
              Candidate pipeline & interview evaluation
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={openAddModal}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>+ Candidate</Text>
          </TouchableOpacity>
        </View>

        {/* Pipeline KPI Cards */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiBox, { backgroundColor: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.3)' }]}>
            <Text style={[styles.kpiVal, { color: '#6366f1' }]}>{activeCount}</Text>
            <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>In Pipeline</Text>
          </View>

          <View style={[styles.kpiBox, { backgroundColor: isDark ? 'rgba(168,85,247,0.12)' : 'rgba(168,85,247,0.08)', borderColor: 'rgba(168,85,247,0.3)' }]}>
            <Text style={[styles.kpiVal, { color: '#a855f7' }]}>{inInterviewCount}</Text>
            <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Interviews</Text>
          </View>

          <View style={[styles.kpiBox, { backgroundColor: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.3)' }]}>
            <Text style={[styles.kpiVal, { color: '#10b981' }]}>{hiredCount}</Text>
            <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Hired ✓</Text>
          </View>

          <View style={[styles.kpiBox, { backgroundColor: isDark ? 'rgba(148,163,184,0.12)' : 'rgba(148,163,184,0.08)', borderColor: 'rgba(148,163,184,0.3)' }]}>
            <Text style={[styles.kpiVal, { color: colors.text }]}>{totalCount}</Text>
            <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Total</Text>
          </View>
        </View>

        {/* Stage Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }} contentContainerStyle={{ gap: 6 }}>
          <TouchableOpacity
            style={[
              styles.stageTab,
              {
                backgroundColor: selectedStage === 'ALL' ? colors.primary : colors.cardBgElevated,
                borderColor: selectedStage === 'ALL' ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setSelectedStage('ALL')}
          >
            <Text style={{ color: selectedStage === 'ALL' ? '#fff' : colors.text, fontSize: 11, fontWeight: '700' }}>
              All ({totalCount})
            </Text>
          </TouchableOpacity>

          {STAGE_ORDER.map((stg) => {
            const count = candidates.filter((c) => c.stage === stg).length;
            const isSelected = selectedStage === stg;
            const cfg = STAGE_CONFIG[stg];
            return (
              <TouchableOpacity
                key={stg}
                style={[
                  styles.stageTab,
                  {
                    backgroundColor: isSelected ? cfg.color : colors.cardBgElevated,
                    borderColor: isSelected ? cfg.color : colors.border,
                  },
                ]}
                onPress={() => setSelectedStage(stg)}
              >
                <Text style={{ color: isSelected ? '#fff' : colors.text, fontSize: 11, fontWeight: '700' }}>
                  {cfg.icon} {cfg.label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Search Bar */}
        <View style={[styles.searchBox, { backgroundColor: colors.cardBgElevated, borderColor: colors.border, marginTop: 10 }]}>
          <Text style={{ fontSize: 13, marginRight: 6 }}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search candidates by name, role, email..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Candidate List */}
      <FlatList
        data={filteredCandidates}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom, 16) + 30 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={[styles.emptyBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>👥</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Candidates Found</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              There are currently no candidates in the selected stage.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const cfg = STAGE_CONFIG[item.stage];
          return (
            <View style={[styles.candCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              {/* Header */}
              <View style={styles.candHeader}>
                <View style={[styles.avatarBox, { backgroundColor: cfg.bg }]}>
                  <Text style={[styles.avatarText, { color: cfg.color }]}>{item.initials}</Text>
                </View>

                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.candName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.candRole, { color: colors.primary }]}>
                    {item.role} • {item.department}
                  </Text>
                </View>

                <View style={[styles.stageBadge, { backgroundColor: cfg.bg, borderColor: cfg.color }]}>
                  <Text style={[styles.stageBadgeText, { color: cfg.color }]}>
                    {cfg.icon} {cfg.label}
                  </Text>
                </View>
              </View>

              {/* Detail Info */}
              <View style={[styles.detailsBox, { backgroundColor: colors.cardBgElevated }]}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Schedule:</Text>
                  <Text style={[styles.detailVal, { color: colors.text }]}>📅 {item.scheduledDate}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Interviewer:</Text>
                  <Text style={[styles.detailVal, { color: colors.text }]}>👤 {item.interviewer}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Mode & Score:</Text>
                  <Text style={[styles.detailVal, { color: colors.text }]}>
                    {item.mode === 'VIDEO' ? '🎥 Video' : item.mode === 'IN_PERSON' ? '🏢 In-Person' : '📞 Phone'} • Score: ⭐ {item.score || 8}/10
                  </Text>
                </View>
                {item.note && (
                  <Text style={[styles.noteText, { color: colors.textMuted }]} numberOfLines={2}>
                    📝 {item.note}
                  </Text>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  style={[styles.smallActionBtn, { backgroundColor: 'rgba(16,185,129,0.12)' }]}
                  onPress={() => handleCallCandidate(item.phone)}
                >
                  <Text style={{ color: '#10b981', fontSize: 11, fontWeight: '700' }}>📞 Call</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.smallActionBtn, { backgroundColor: 'rgba(34,197,94,0.12)' }]}
                  onPress={() => handleWhatsAppCandidate(item.phone, item.name)}
                >
                  <Text style={{ color: '#22c55e', fontSize: 11, fontWeight: '700' }}>💬 WhatsApp</Text>
                </TouchableOpacity>

                {item.stage !== 'HIRED' && item.stage !== 'REJECTED' && (
                  <TouchableOpacity
                    style={[styles.smallActionBtn, { backgroundColor: colors.primary }]}
                    onPress={() => handleAdvanceStage(item)}
                  >
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>Advance ➔</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.smallActionBtn, { backgroundColor: colors.cardBgElevated }]}
                  onPress={() => openEditModal(item)}
                >
                  <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700' }}>✏️ Edit</Text>
                </TouchableOpacity>

                {item.stage !== 'REJECTED' && (
                  <TouchableOpacity
                    style={[styles.smallActionBtn, { backgroundColor: 'rgba(239,68,68,0.12)' }]}
                    onPress={() => handleRejectCandidate(item)}
                  >
                    <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '700' }}>✕ Reject</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* Add / Edit Candidate Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingCandidate ? 'Edit Candidate' : 'Add Candidate to Pipeline'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={{ fontSize: 18, color: colors.textMuted }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Candidate Full Name *</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.cardBgElevated, borderColor: colors.border, color: colors.text }]}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor={colors.textMuted}
                value={formName}
                onChangeText={setFormName}
              />

              <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 10 }]}>Applying For Role *</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.cardBgElevated, borderColor: colors.border, color: colors.text }]}
                placeholder="e.g. Senior Sales Executive"
                placeholderTextColor={colors.textMuted}
                value={formRole}
                onChangeText={setFormRole}
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Department</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: colors.cardBgElevated, borderColor: colors.border, color: colors.text }]}
                    value={formDept}
                    onChangeText={setFormDept}
                    placeholder="Sales"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Score (1-10)</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: colors.cardBgElevated, borderColor: colors.border, color: colors.text }]}
                    value={formScore}
                    onChangeText={setFormScore}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 10 }]}>Current Pipeline Stage</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {STAGE_ORDER.map((stg) => (
                  <TouchableOpacity
                    key={stg}
                    style={[
                      styles.stageSelectBtn,
                      {
                        backgroundColor: formStage === stg ? STAGE_CONFIG[stg].color : colors.cardBgElevated,
                        borderColor: formStage === stg ? STAGE_CONFIG[stg].color : colors.border,
                      },
                    ]}
                    onPress={() => setFormStage(stg)}
                  >
                    <Text style={{ color: formStage === stg ? '#fff' : colors.text, fontSize: 10, fontWeight: '700' }}>
                      {STAGE_CONFIG[stg].label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 10 }]}>Interview Mode</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {(['VIDEO', 'IN_PERSON', 'PHONE'] as const).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.modeBtn,
                      {
                        backgroundColor: formMode === m ? colors.primary : colors.cardBgElevated,
                        borderColor: formMode === m ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setFormMode(m)}
                  >
                    <Text style={{ color: formMode === m ? '#fff' : colors.text, fontSize: 11, fontWeight: '700' }}>
                      {m === 'VIDEO' ? '🎥 Video' : m === 'IN_PERSON' ? '🏢 In-Person' : '📞 Phone'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 10 }]}>Interview Date & Time</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.cardBgElevated, borderColor: colors.border, color: colors.text }]}
                value={formDate}
                onChangeText={setFormDate}
                placeholder="2026-10-15 at 03:00 PM"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 10 }]}>Interviewer Name</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.cardBgElevated, borderColor: colors.border, color: colors.text }]}
                value={formInterviewer}
                onChangeText={setFormInterviewer}
                placeholder="Interviewer Name"
                placeholderTextColor={colors.textMuted}
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Phone</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: colors.cardBgElevated, borderColor: colors.border, color: colors.text }]}
                    value={formPhone}
                    onChangeText={setFormPhone}
                    placeholder="+91 98765 43210"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Email</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: colors.cardBgElevated, borderColor: colors.border, color: colors.text }]}
                    value={formEmail}
                    onChangeText={setFormEmail}
                    placeholder="candidate@example.com"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 10 }]}>Evaluation Notes</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.cardBgElevated, borderColor: colors.border, color: colors.text, height: 60, textAlignVertical: 'top' }]}
                value={formNote}
                onChangeText={setFormNote}
                placeholder="Candidate background, strengths, salary expectations..."
                placeholderTextColor={colors.textMuted}
                multiline
              />
            </ScrollView>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: colors.textMuted, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveCandidate}
              >
                <Text style={{ color: '#ffffff', fontWeight: '800' }}>Save Candidate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default InterviewsHiringScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(99,102,241,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  addBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  kpiBox: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  kpiVal: {
    fontSize: 15,
    fontWeight: '900',
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  stageTab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 36,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    padding: 0,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyBox: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  candCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  candHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '900',
  },
  candName: {
    fontSize: 14,
    fontWeight: '800',
  },
  candRole: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  stageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  stageBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  detailsBox: {
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  detailVal: {
    fontSize: 11,
    fontWeight: '700',
  },
  noteText: {
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  smallActionBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  modalInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  stageSelectBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
});
