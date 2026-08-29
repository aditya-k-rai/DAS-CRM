import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';

export interface NoticeItem {
  id: string;
  title: string;
  content: string;
  author: string;
  authorRole: string;
  avatar: string;
  createdAt: number; // timestamp
  expiresAt: number; // timestamp (createdAt + 7 days)
  priority: 'CRITICAL' | 'IMPORTANT' | 'GENERAL';
  mentions: string[];
  acknowledgedBy: string[];
}

const STAFF_LIST = [
  '@All Staff',
  '@Rajesh Kumar',
  '@Priya Sharma',
  '@Amit Shah',
  '@Sunita Verma',
  '@Neha Joshi',
  '@Amit Patel',
  '@Rajesh Mehta',
];

const INITIAL_NOTICES: NoticeItem[] = [
  {
    id: 'n_1',
    title: '📢 Q3 Enterprise Revenue Targets & Incentive Structure',
    content: 'Attention @All Staff and @Rajesh Kumar. New incentive tiers for Q3 deals have been published. Overtime & closure bonuses will be paid out bi-weekly. Please log all calls daily.',
    author: 'Aditya Kumar Rai',
    authorRole: 'ADMIN',
    avatar: 'AR',
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    expiresAt: Date.now() + 6 * 24 * 60 * 60 * 1000,
    priority: 'CRITICAL',
    mentions: ['@All Staff', '@Rajesh Kumar'],
    acknowledgedBy: ['emp_1', 'emp_4'],
  },
  {
    id: 'n_2',
    title: '📌 System Maintenance & Database Sync Window',
    content: 'Notice for @Amit Shah and @Neha Joshi: Backend sync & database migration scheduled tonight at 11:00 PM IST. Live GPS camera attendance remains active.',
    author: 'Sunita Verma',
    authorRole: 'HR MANAGER',
    avatar: 'SV',
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    expiresAt: Date.now() + 4 * 24 * 60 * 60 * 1000,
    priority: 'IMPORTANT',
    mentions: ['@Amit Shah', '@Neha Joshi'],
    acknowledgedBy: ['emp_3'],
  },
  {
    id: 'n_3',
    title: '🎉 Top Sales Executive of the Week Award',
    content: 'Congratulations to @Priya Sharma for closing 5 enterprise deals this week! Team celebration hosted this Friday at HQ Hub.',
    author: 'Rajesh Mehta',
    authorRole: 'DEPARTMENT MANAGER',
    avatar: 'RM',
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    expiresAt: Date.now() + 2 * 24 * 60 * 60 * 1000,
    priority: 'GENERAL',
    mentions: ['@Priya Sharma'],
    acknowledgedBy: ['emp_5', 'emp_7'],
  },
];

interface NoticeBoardScreenProps {
  onClose?: () => void;
}

export const NoticeBoardScreen: React.FC<NoticeBoardScreenProps> = ({ onClose }) => {
  const { currentUser } = useAuthStore();
  const isAdminOrManager = ['ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes((currentUser?.role || '').toUpperCase());

  const [notices, setNotices] = useState<NoticeItem[]>(INITIAL_NOTICES);

  // Form State for Admin Notice Creation
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [selectedMentions, setSelectedMentions] = useState<string[]>(['@All Staff']);
  const [priorityInput, setPriorityInput] = useState<'CRITICAL' | 'IMPORTANT' | 'GENERAL'>('IMPORTANT');

  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top + 6, 18);

  // Auto-Purge Filter: Only show notices whose expiration time > now (within 7 days)
  const activeNotices = notices.filter((n) => n.expiresAt > Date.now());

  const toggleMention = (staff: string) => {
    if (selectedMentions.includes(staff)) {
      setSelectedMentions(selectedMentions.filter((s) => s !== staff));
    } else {
      setSelectedMentions([...selectedMentions, staff]);
    }
  };

  const handlePostNotice = () => {
    if (!titleInput.trim() || !contentInput.trim()) {
      Alert.alert('Missing Fields', 'Please enter both Notice Title and Message content.');
      return;
    }

    const newNotice: NoticeItem = {
      id: `n_${Date.now()}`,
      title: titleInput.trim(),
      content: contentInput.trim(),
      author: currentUser.name || 'Admin',
      authorRole: currentUser.role || 'ADMIN',
      avatar: (currentUser.name || 'AD').substring(0, 2).toUpperCase(),
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // Exactly 7 Days Auto-Purge
      priority: priorityInput,
      mentions: selectedMentions.length > 0 ? selectedMentions : ['@All Staff'],
      acknowledgedBy: [],
    };

    setNotices([newNotice, ...notices]);
    setTitleInput('');
    setContentInput('');
    setSelectedMentions(['@All Staff']);
    setShowCreateForm(false);
    Alert.alert('📌 Notice Published', 'One-way notice broadcasted to team. It will auto-disappear in 7 days.');
  };

  const handleAcknowledge = (id: string) => {
    setNotices((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          const userKey = currentUser.id || 'curr_user';
          if (!n.acknowledgedBy.includes(userKey)) {
            return { ...n, acknowledgedBy: [...n.acknowledgedBy, userKey] };
          }
        }
        return n;
      })
    );
    Alert.alert('✓ Acknowledged', 'You have marked this directive as read.');
  };

  const handleDeleteNotice = (id: string) => {
    Alert.alert('Delete Notice', 'Are you sure you want to remove this announcement?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setNotices(notices.filter((n) => n.id !== id)),
      },
    ]);
  };

  const getTimeRemainingStr = (expiresAt: number) => {
    const diffMs = expiresAt - Date.now();
    if (diffMs <= 0) return 'Expired (Purging...)';
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `⏳ Disappears in ${days}d ${hours}h (7-Day Auto-Purge)`;
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>📌 The Notice Board</Text>
          <Text style={styles.headerSub}>Admin One-Way Directives · Mentions · Auto-Purges in 7 Days</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📢 Official One-Way Notice Stream</Text>
          <Text style={styles.infoSub}>
            Admins broadcast important directives with employee @mentions. All messages automatically purge and disappear after 7 days.
          </Text>
        </View>

        {/* Admin Creation Trigger Button */}
        {isAdminOrManager && (
          <TouchableOpacity
            style={styles.createToggleBtn}
            onPress={() => setShowCreateForm(!showCreateForm)}
          >
            <Text style={styles.createToggleText}>
              {showCreateForm ? '✕ Close Notice Creator' : '+ Post New Admin Notice (@Mention Staff)'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Admin Notice Creation Form */}
        {showCreateForm && isAdminOrManager && (
          <View style={styles.formContainer}>
            <Text style={styles.formHeading}>✍️ Broadcast New One-Way Notice</Text>

            <Text style={styles.fieldLabel}>Notice Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 📢 Q3 Revenue Targets & Policy Update"
              placeholderTextColor="#64748b"
              value={titleInput}
              onChangeText={setTitleInput}
            />

            <Text style={styles.fieldLabel}>Directive Message Content</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Write directive details... Use @mentions to highlight team members."
              placeholderTextColor="#64748b"
              multiline
              value={contentInput}
              onChangeText={setContentInput}
            />

            <Text style={styles.fieldLabel}>Priority Level</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginVertical: 6 }}>
              {(['CRITICAL', 'IMPORTANT', 'GENERAL'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.priorityChip, priorityInput === p && styles.priorityChipActive]}
                  onPress={() => setPriorityInput(p)}
                >
                  <Text style={[styles.priorityChipText, priorityInput === p && { color: '#ffffff' }]}>
                    {p === 'CRITICAL' ? '🔴 Critical' : p === 'IMPORTANT' ? '🟡 Important' : '🔵 General'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Mention Team Members (@Mentions)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {STAFF_LIST.map((staff) => {
                  const isSel = selectedMentions.includes(staff);
                  return (
                    <TouchableOpacity
                      key={staff}
                      style={[styles.mentionChip, isSel && styles.mentionChipActive]}
                      onPress={() => toggleMention(staff)}
                    >
                      <Text style={[styles.mentionChipText, isSel && { color: '#818cf8', fontWeight: '800' }]}>
                        {staff} {isSel ? '✓' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.publishBtn} onPress={handlePostNotice}>
              <Text style={styles.publishBtnText}>🚀 Publish Notice (7-Day Auto-Purge)</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Notices Stream List */}
        <View style={{ width: '100%', gap: 12, marginTop: 12 }}>
          {activeNotices.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>
                No active notices. All previous announcements have expired after 7 days.
              </Text>
            </View>
          ) : (
            activeNotices.map((n) => {
              const userKey = currentUser.id || 'curr_user';
              const isAcked = n.acknowledgedBy.includes(userKey);

              let badgeBg = 'rgba(56,189,248,0.15)';
              let badgeColor = '#38bdf8';
              if (n.priority === 'CRITICAL') {
                badgeBg = 'rgba(239,68,68,0.15)';
                badgeColor = '#f87171';
              } else if (n.priority === 'IMPORTANT') {
                badgeBg = 'rgba(245,158,11,0.15)';
                badgeColor = '#fbbf24';
              }

              return (
                <View key={n.id} style={styles.noticeCard}>
                  {/* Card Header */}
                  <View style={styles.cardHeaderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <View style={styles.authorAvatar}>
                        <Text style={styles.avatarText}>{n.avatar}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.authorName}>{n.author}</Text>
                        <Text style={styles.authorRole}>{n.authorRole} · Admin Directive</Text>
                      </View>
                    </View>

                    <View style={[styles.priorityPill, { backgroundColor: badgeBg }]}>
                      <Text style={[styles.priorityPillText, { color: badgeColor }]}>{n.priority}</Text>
                    </View>
                  </View>

                  {/* Title & Body */}
                  <Text style={styles.noticeTitle}>{n.title}</Text>
                  <Text style={styles.noticeBody}>{n.content}</Text>

                  {/* Mentions Row */}
                  <View style={styles.mentionsRow}>
                    {n.mentions.map((m, idx) => (
                      <View key={idx} style={styles.mentionBadge}>
                        <Text style={styles.mentionBadgeText}>{m}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Auto-Purge 7-Day Countdown Timer Footer */}
                  <View style={styles.cardFooterRow}>
                    <Text style={styles.timerText}>{getTimeRemainingStr(n.expiresAt)}</Text>

                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      {isAdminOrManager && (
                        <TouchableOpacity onPress={() => handleDeleteNotice(n.id)} style={styles.deleteBtn}>
                          <Text style={{ color: '#f87171', fontSize: 10, fontWeight: '800' }}>Delete</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={[styles.ackBtn, isAcked && styles.ackBtnDone]}
                        onPress={() => handleAcknowledge(n.id)}
                      >
                        <Text style={[styles.ackBtnText, isAcked && { color: '#34d399' }]}>
                          {isAcked ? '✓ Read' : 'Acknowledge →'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default NoticeBoardScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: { backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  backBtnText: { color: '#38bdf8', fontSize: 11, fontWeight: '800' },
  headerTitle: { fontSize: 16, fontWeight: '900', color: '#ffffff' },
  headerSub: { fontSize: 10, color: '#94a3b8', marginTop: 2 },

  scrollContent: { padding: 16, alignItems: 'center' },

  infoCard: { width: '100%', backgroundColor: '#0f172a', borderRadius: 14, borderWidth: 1, borderColor: '#1e293b', padding: 14 },
  infoTitle: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  infoSub: { color: '#94a3b8', fontSize: 11, marginTop: 4, lineHeight: 16 },

  createToggleBtn: { marginTop: 12, width: '100%', backgroundColor: '#4f46e5', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  createToggleText: { color: '#ffffff', fontWeight: '900', fontSize: 12 },

  formContainer: { marginTop: 12, width: '100%', backgroundColor: '#0f172a', borderRadius: 14, borderWidth: 1, borderColor: '#312e81', padding: 14 },
  formHeading: { color: '#818cf8', fontSize: 13, fontWeight: '900', marginBottom: 8 },
  fieldLabel: { color: '#cbd5e1', fontSize: 11, fontWeight: '800', marginTop: 8, marginBottom: 4 },
  input: { backgroundColor: '#1e293b', borderRadius: 10, borderWidth: 1, borderColor: '#334155', color: '#ffffff', paddingHorizontal: 12, paddingVertical: 8, fontSize: 12 },

  priorityChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  priorityChipActive: { backgroundColor: '#4f46e5', borderColor: '#6366f1' },
  priorityChipText: { color: '#94a3b8', fontSize: 10, fontWeight: '800' },

  mentionChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  mentionChipActive: { backgroundColor: 'rgba(99,102,241,0.2)', borderColor: 'rgba(99,102,241,0.5)' },
  mentionChipText: { color: '#94a3b8', fontSize: 10 },

  publishBtn: { marginTop: 12, backgroundColor: '#16a34a', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  publishBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 12 },

  emptyCard: { width: '100%', padding: 24, backgroundColor: '#0f172a', borderRadius: 14, alignItems: 'center' },

  noticeCard: { width: '100%', backgroundColor: '#0f172a', borderRadius: 14, borderWidth: 1, borderColor: '#1e293b', padding: 14 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  authorAvatar: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(99,102,241,0.2)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#818cf8', fontWeight: '900', fontSize: 12 },
  authorName: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  authorRole: { color: '#94a3b8', fontSize: 10 },

  priorityPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  priorityPillText: { fontSize: 9, fontWeight: '900' },

  noticeTitle: { color: '#ffffff', fontSize: 14, fontWeight: '900', marginBottom: 4 },
  noticeBody: { color: '#cbd5e1', fontSize: 12, lineHeight: 18, marginBottom: 8 },

  mentionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  mentionBadge: { backgroundColor: 'rgba(99,102,241,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)' },
  mentionBadgeText: { color: '#a5b4fc', fontSize: 10, fontWeight: '800' },

  cardFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#1e293b' },
  timerText: { color: '#fbbf24', fontSize: 10, fontWeight: '800' },

  deleteBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(239,68,68,0.1)' },
  ackBtn: { backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  ackBtnDone: { backgroundColor: 'rgba(52,211,153,0.15)', borderColor: 'rgba(52,211,153,0.3)' },
  ackBtnText: { color: '#cbd5e1', fontSize: 10, fontWeight: '800' },
});
