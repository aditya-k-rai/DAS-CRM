import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Linking,
  FlatList,
} from 'react-native';

// ── Types ─────────────────────────────────────────────────
type PdfCategory = 'PRODUCT' | 'PRICING' | 'SPECIFICATION' | 'PROPOSAL';
type ShareChannel = 'WHATSAPP' | 'EMAIL' | 'LINK';

export interface ShareEvent {
  id: string;
  sharedBy: string;
  sharedTo: string;
  leadContact?: string;
  channel: ShareChannel;
  timestamp: string;
  note?: string;
}

export interface PdfItem {
  id: string;
  title: string;
  size: string;
  updated: string;
  category: PdfCategory;
  downloadsCount: number;
  waShares: number;
  emailShares: number;
  linkShares: number;
  shareLog: ShareEvent[];
}

interface PdfCatalogueScreenProps {
  onClose?: () => void;
}

// ── Seed share log helper ─────────────────────────────────
const mkEvent = (
  id: string, sharedBy: string, sharedTo: string,
  channel: ShareChannel, timestamp: string,
  leadContact?: string, note?: string,
): ShareEvent => ({ id, sharedBy, sharedTo, channel, timestamp, leadContact, note });

// ── Seed Data ─────────────────────────────────────────────
const INITIAL_PDFS: PdfItem[] = [
  {
    id: '1',
    title: 'DAS CRM Enterprise Suite 2026 Deck.pdf',
    size: '4.2 MB', updated: 'Updated 2 days ago',
    category: 'PRODUCT', downloadsCount: 142,
    waShares: 47, emailShares: 31, linkShares: 18,
    shareLog: [
      mkEvent('e1','Rajesh Kumar','TechCorp Ltd','WHATSAPP','Today 10:22 AM','+91 98765 43210','Sent before demo call'),
      mkEvent('e2','Priya Sharma','Amit Patel','EMAIL','Today 09:15 AM','amit@example.com','Follow-up after meeting'),
      mkEvent('e3','Ravi Singh','Sunita Verma','WHATSAPP','Yesterday 3:40 PM','+91 87654 32109'),
      mkEvent('e4','Priya Sharma','Anjali Mehta','LINK','2 days ago',undefined,'Public brochure link via chat'),
    ],
  },
  {
    id: '2',
    title: 'AI Lead Scoring Engine Pro Specs.pdf',
    size: '2.8 MB', updated: 'Updated last week',
    category: 'SPECIFICATION', downloadsCount: 89,
    waShares: 22, emailShares: 14, linkShares: 8,
    shareLog: [
      mkEvent('e5','Ravi Singh','Rahul Industries','EMAIL','Today 08:55 AM','rahul@industries.com'),
      mkEvent('e6','Aisha Khan','CloudBase Corp','WHATSAPP','Yesterday 2:10 PM','+91 99887 76655'),
    ],
  },
  {
    id: '3',
    title: 'WhatsApp Cloud API Pricing Rate Card.pdf',
    size: '1.5 MB', updated: 'Updated 3 days ago',
    category: 'PRICING', downloadsCount: 215,
    waShares: 89, emailShares: 54, linkShares: 31,
    shareLog: [
      mkEvent('e7','Priya Sharma','Amit Patel','WHATSAPP','Today 11:30 AM','+91 87654 32109','Pricing clarification'),
      mkEvent('e8','Rajesh Kumar','TechCorp Ltd','EMAIL','Today 10:00 AM','contact@techcorp.com'),
      mkEvent('e9','Aisha Khan','Mehta Enterprises','WHATSAPP','Yesterday 4:50 PM','+91 78563 21098'),
    ],
  },
  {
    id: '4',
    title: 'GST 18% Commercial Proposal Template.pdf',
    size: '1.9 MB', updated: 'Updated yesterday',
    category: 'PROPOSAL', downloadsCount: 64,
    waShares: 19, emailShares: 28, linkShares: 6,
    shareLog: [
      mkEvent('e10','Rajesh Kumar','Reliance Ventures','EMAIL','Today 09:45 AM','biz@reliance.com','Quarterly proposal'),
      mkEvent('e11','Aisha Khan','QuickBuy Inc','WHATSAPP','Yesterday 1:20 PM','+91 99100 22334'),
    ],
  },
];

// ── Channel colour map ────────────────────────────────────
const CHANNEL_COLOR: Record<ShareChannel, string> = {
  WHATSAPP: '#10b981',
  EMAIL:    '#6366f1',
  LINK:     '#38bdf8',
};
const CHANNEL_LABEL: Record<ShareChannel, string> = {
  WHATSAPP: '💬 WA',
  EMAIL:    '📧 Email',
  LINK:     '🔗 Link',
};

// ── Category badge colour ─────────────────────────────────
const CAT_COLOR: Record<PdfCategory, string> = {
  PRODUCT:       '#6366f1',
  PRICING:       '#10b981',
  SPECIFICATION: '#38bdf8',
  PROPOSAL:      '#f59e0b',
};

export const PdfCatalogueScreen: React.FC<PdfCatalogueScreenProps> = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [pdfList, setPdfList] = useState<PdfItem[]>(INITIAL_PDFS);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSize, setNewSize] = useState('3.5 MB');
  const [newCategory, setNewCategory] = useState<PdfCategory>('PRODUCT');

  // Preview modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewPdf, setPreviewPdf] = useState<PdfItem | null>(null);

  // Share Activity modal
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityPdf, setActivityPdf] = useState<PdfItem | null>(null);
  const [activityTab, setActivityTab] = useState<'log' | 'add'>('log');
  const [filterChannel, setFilterChannel] = useState<ShareChannel | 'ALL'>('ALL');

  // Log Share form state
  const [logSharedBy, setLogSharedBy] = useState('');
  const [logSharedTo, setLogSharedTo] = useState('');
  const [logContact, setLogContact] = useState('');
  const [logChannel, setLogChannel] = useState<ShareChannel>('WHATSAPP');
  const [logNote, setLogNote] = useState('');

  // ── Helpers ──────────────────────────────────────────────
  const updatePdf = (updated: PdfItem) =>
    setPdfList(prev => prev.map(p => p.id === updated.id ? updated : p));

  const recordShare = (pdf: PdfItem, event: ShareEvent): PdfItem => ({
    ...pdf,
    waShares:    event.channel === 'WHATSAPP' ? pdf.waShares + 1 : pdf.waShares,
    emailShares: event.channel === 'EMAIL'    ? pdf.emailShares + 1 : pdf.emailShares,
    linkShares:  event.channel === 'LINK'     ? pdf.linkShares + 1 : pdf.linkShares,
    shareLog: [event, ...pdf.shareLog],
  });

  // ── Upload ────────────────────────────────────────────────
  const handleUploadPdf = () => {
    if (!newTitle.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for the PDF document.');
      return;
    }
    const filename = newTitle.endsWith('.pdf') ? newTitle.trim() : `${newTitle.trim()}.pdf`;
    const newDoc: PdfItem = {
      id: `pdf_${Date.now()}`,
      title: filename,
      size: newSize.trim() || '2.0 MB',
      updated: 'Just Now',
      category: newCategory,
      downloadsCount: 0,
      waShares: 0, emailShares: 0, linkShares: 0,
      shareLog: [],
    };
    setPdfList([newDoc, ...pdfList]);
    setNewTitle('');
    setShowUploadModal(false);
    Alert.alert('✅ Published', `"${filename}" added to corporate catalogue!`);
  };

  // ── WA Dispatch ──────────────────────────────────────────
  const handleDispatchViaWhatsApp = (pdf: PdfItem) => {
    Alert.prompt(
      '💬 WhatsApp Dispatch',
      `Lead / Company name:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open WhatsApp',
          onPress: (leadName?: string) => {
            const text = encodeURIComponent(
              `Hi${leadName ? ` ${leadName}` : ''}! Here is the corporate brochure you requested:\n📄 ${pdf.title}\n📥 Download: https://dascrm.com/docs/${encodeURIComponent(pdf.title)}`
            );
            const waUrl = `whatsapp://send?text=${text}`;
            Linking.canOpenURL(waUrl)
              .then(supported => {
                if (supported) Linking.openURL(waUrl);
                else Alert.alert('🔗 Brochure Link', `https://dascrm.com/docs/${pdf.title}`);
              })
              .catch(() => Alert.alert('🔗 Brochure Link', `https://dascrm.com/docs/${pdf.title}`));

            // Log the share event
            const event: ShareEvent = {
              id: `ev_${Date.now()}`,
              sharedBy: 'You',
              sharedTo: leadName?.trim() || 'Lead',
              channel: 'WHATSAPP',
              timestamp: 'Just now',
            };
            const updated = recordShare(pdf, event);
            updatePdf(updated);
            if (activityPdf?.id === pdf.id) setActivityPdf(updated);
          },
        },
      ]
    );
  };

  // ── Email Dispatch ────────────────────────────────────────
  const handleDispatchViaEmail = (pdf: PdfItem) => {
    Alert.prompt(
      '📧 Email PDF Brochure',
      `Recipient email for ${pdf.title}:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Email',
          onPress: (email?: string) => {
            if (!email) return;
            Alert.alert('📧 Dispatched', `Brochure sent to ${email} via AWS SES!`);
            const event: ShareEvent = {
              id: `ev_${Date.now()}`,
              sharedBy: 'You',
              sharedTo: email.split('@')[0],
              leadContact: email,
              channel: 'EMAIL',
              timestamp: 'Just now',
            };
            const updated = recordShare(pdf, event);
            updatePdf(updated);
            if (activityPdf?.id === pdf.id) setActivityPdf(updated);
          },
        },
      ]
    );
  };

  // ── Log Share (manual) ────────────────────────────────────
  const handleLogShare = () => {
    if (!logSharedBy.trim() || !logSharedTo.trim() || !activityPdf) return;
    const event: ShareEvent = {
      id: `ev_${Date.now()}`,
      sharedBy: logSharedBy.trim(),
      sharedTo: logSharedTo.trim(),
      leadContact: logContact.trim() || undefined,
      channel: logChannel,
      timestamp: 'Just now',
      note: logNote.trim() || undefined,
    };
    const basePdf = pdfList.find(p => p.id === activityPdf.id) ?? activityPdf;
    const updated = recordShare(basePdf, event);
    updatePdf(updated);
    setActivityPdf(updated);
    setLogSharedBy(''); setLogSharedTo(''); setLogContact(''); setLogNote('');
    setActivityTab('log');
    Alert.alert('✅ Logged', 'Share event recorded in activity log.');
  };

  // ── Filtered list ─────────────────────────────────────────
  const filteredPdfs = pdfList.filter(pdf =>
    !searchQuery.trim() || pdf.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLog = (activityPdf?.shareLog ?? []).filter(
    e => filterChannel === 'ALL' || e.channel === filterChannel
  );

  // ── Open Activity modal ───────────────────────────────────
  const openActivity = (pdf: PdfItem) => {
    setActivityPdf(pdf);
    setActivityTab('log');
    setFilterChannel('ALL');
    setShowActivityModal(true);
  };

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.topHeader}>
        {onClose && (
          <TouchableOpacity style={styles.backBtn} onPress={onClose}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>📄 PDF Catalogue & Brochure Hub</Text>
        <TouchableOpacity style={styles.uploadHeaderBtn} onPress={() => setShowUploadModal(true)}>
          <Text style={styles.btnTextWhite}>+ Upload</Text>
        </TouchableOpacity>
      </View>

      {/* ── Global Stats Strip ── */}
      <View style={styles.statsStrip}>
        {[
          { label: 'Docs', value: pdfList.length, color: '#6366f1' },
          { label: 'Downloads', value: pdfList.reduce((s, p) => s + p.downloadsCount, 0), color: '#10b981' },
          { label: 'Total Shares', value: pdfList.reduce((s, p) => s + p.waShares + p.emailShares + p.linkShares, 0), color: '#38bdf8' },
          { label: 'Log Events', value: pdfList.reduce((s, p) => s + p.shareLog.length, 0), color: '#f59e0b' },
        ].map((stat, i) => (
          <View key={stat.label} style={[styles.statCell, i < 3 && styles.statCellBorder]}>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Search ── */}
        <TextInput
          style={styles.inputField}
          placeholder="🔍 Search catalogues..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* ── PDF Cards ── */}
        {filteredPdfs.map(pdf => {
          const totalShares = pdf.waShares + pdf.emailShares + pdf.linkShares;
          return (
            <View key={pdf.id} style={styles.pdfCard}>
              {/* Title row */}
              <View style={styles.pdfTitleRow}>
                <Text style={styles.pdfIcon}>📄</Text>
                <View style={{ flex: 1, paddingRight: 6 }}>
                  <Text style={styles.itemName} numberOfLines={2}>{pdf.title}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                    <View style={[styles.catBadge, { backgroundColor: `${CAT_COLOR[pdf.category]}22`, borderColor: `${CAT_COLOR[pdf.category]}55` }]}>
                      <Text style={[styles.catBadgeText, { color: CAT_COLOR[pdf.category] }]}>{pdf.category}</Text>
                    </View>
                    <Text style={styles.itemSub}>{pdf.size} • {pdf.updated}</Text>
                  </View>
                  <Text style={styles.itemSub}>⬇ {pdf.downloadsCount} downloads</Text>
                </View>
              </View>

              {/* ── Per-PDF Share Stat Strip ── */}
              <View style={styles.shareStatRow}>
                <Text style={styles.shareStatLabel}>📤 Shared:</Text>
                <Text style={styles.shareStatTotal}>{totalShares} total</Text>
                <View style={styles.statDivider} />
                <Text style={[styles.shareStatChip, { color: '#10b981' }]}>💬 {pdf.waShares} WA</Text>
                <Text style={[styles.shareStatChip, { color: '#6366f1' }]}>📧 {pdf.emailShares} Email</Text>
                <Text style={[styles.shareStatChip, { color: '#38bdf8' }]}>🔗 {pdf.linkShares} Link</Text>
              </View>

              <Text style={[styles.itemSub, { marginBottom: 6 }]}>
                🗒 {pdf.shareLog.length} logged event{pdf.shareLog.length !== 1 ? 's' : ''}
              </Text>

              {/* ── Action Buttons ── */}
              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.previewBtn} onPress={() => { setPreviewPdf(pdf); setShowPreviewModal(true); }}>
                  <Text style={styles.btnTextDark}>👁 Preview</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareWaBtn} onPress={() => handleDispatchViaWhatsApp(pdf)}>
                  <Text style={styles.btnTextWhite}>💬 WA</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareEmailBtn} onPress={() => handleDispatchViaEmail(pdf)}>
                  <Text style={styles.btnTextWhite}>📧 Email</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.activityBtn} onPress={() => openActivity(pdf)}>
                  <Text style={styles.btnTextWhite}>📊 Log</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

      </ScrollView>

      {/* ══════════════════════════════════════════
          UPLOAD MODAL
      ══════════════════════════════════════════ */}
      <Modal visible={showUploadModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleText}>➕ Upload Corporate PDF</Text>
              <TouchableOpacity onPress={() => setShowUploadModal(false)} style={styles.modalCloseBtn}>
                <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={{ gap: 10 }}>
              <TextInput style={styles.inputField} placeholder="Brochure Title" placeholderTextColor="#64748b" value={newTitle} onChangeText={setNewTitle} />
              <TextInput style={styles.inputField} placeholder="File Size (e.g. 4.5 MB)" placeholderTextColor="#64748b" value={newSize} onChangeText={setNewSize} />
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {(['PRODUCT', 'PRICING', 'SPECIFICATION', 'PROPOSAL'] as const).map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catSelectBtn, newCategory === cat && { backgroundColor: '#4f46e5', borderColor: '#818cf8' }]}
                    onPress={() => setNewCategory(cat)}
                  >
                    <Text style={{ fontSize: 8, fontWeight: '900', color: newCategory === cat ? '#fff' : '#94a3b8' }}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.saveUploadBtn} onPress={handleUploadPdf}>
                <Text style={{ color: '#090d16', fontWeight: '900', fontSize: 12 }}>🚀 Publish PDF Document</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════
          PREVIEW MODAL
      ══════════════════════════════════════════ */}
      <Modal visible={showPreviewModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitleText, { flex: 1, marginRight: 8 }]} numberOfLines={1}>📖 {previewPdf?.title}</Text>
              <TouchableOpacity onPress={() => setShowPreviewModal(false)} style={styles.modalCloseBtn}>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.previewBody}>
              <Text style={{ fontSize: 44, marginBottom: 10 }}>📄</Text>
              <Text style={styles.previewTitle}>{previewPdf?.title}</Text>
              <Text style={styles.previewSub}>
                {previewPdf?.category} • {previewPdf?.size}
              </Text>
              {/* Share stats inside preview */}
              <View style={[styles.shareStatRow, { marginTop: 14, justifyContent: 'center', flexWrap: 'wrap' }]}>
                <Text style={[styles.shareStatChip, { color: '#10b981' }]}>💬 {previewPdf?.waShares} WA</Text>
                <Text style={[styles.shareStatChip, { color: '#6366f1' }]}>📧 {previewPdf?.emailShares} Email</Text>
                <Text style={[styles.shareStatChip, { color: '#38bdf8' }]}>🔗 {previewPdf?.linkShares} Link</Text>
                <Text style={[styles.shareStatChip, { color: '#f59e0b' }]}>⬇ {previewPdf?.downloadsCount} DL</Text>
              </View>
              <Text style={styles.previewNote}>
                Official DAS CRM Document Preview Renderer. 2-way sync enabled across mobile & web portals.
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════
          SHARE ACTIVITY MODAL
      ══════════════════════════════════════════ */}
      <Modal visible={showActivityModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>

            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitleText, { flex: 1 }]} numberOfLines={1}>
                📊 Share Activity — {activityPdf?.title}
              </Text>
              <TouchableOpacity onPress={() => setShowActivityModal(false)} style={styles.modalCloseBtn}>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Stats strip */}
            {activityPdf && (
              <View style={styles.activityStatsRow}>
                {[
                  { label: 'Total', value: activityPdf.waShares + activityPdf.emailShares + activityPdf.linkShares, color: '#ffffff' },
                  { label: 'WA', value: activityPdf.waShares, color: '#10b981' },
                  { label: 'Email', value: activityPdf.emailShares, color: '#6366f1' },
                  { label: 'Link', value: activityPdf.linkShares, color: '#38bdf8' },
                ].map((s, i) => (
                  <View key={s.label} style={[styles.activityStatCell, i < 3 && { borderRightWidth: 1, borderRightColor: '#1e293b' }]}>
                    <Text style={[styles.activityStatValue, { color: s.color }]}>{s.value}</Text>
                    <Text style={styles.activityStatLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Tabs */}
            <View style={styles.tabRow}>
              {[
                { id: 'log', label: `Activity Log (${activityPdf?.shareLog.length ?? 0})` },
                { id: 'add', label: '+ Log Share' },
              ].map(tab => (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tabBtn, activityTab === tab.id && styles.tabBtnActive]}
                  onPress={() => setActivityTab(tab.id as 'log' | 'add')}
                >
                  <Text style={[styles.tabBtnText, activityTab === tab.id && styles.tabBtnTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {activityTab === 'log' ? (
              <>
                {/* Channel filter chips */}
                <View style={styles.filterRow}>
                  {(['ALL', 'WHATSAPP', 'EMAIL', 'LINK'] as const).map(ch => (
                    <TouchableOpacity
                      key={ch}
                      onPress={() => setFilterChannel(ch)}
                      style={[styles.filterChip, filterChannel === ch && { backgroundColor: '#4f46e5', borderColor: '#818cf8' }]}
                    >
                      <Text style={[styles.filterChipText, filterChannel === ch && { color: '#fff' }]}>
                        {ch === 'ALL' ? 'All' : CHANNEL_LABEL[ch]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Log list */}
                <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
                  {filteredLog.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                      <Text style={{ fontSize: 28, marginBottom: 8 }}>📋</Text>
                      <Text style={{ color: '#94a3b8', fontSize: 12 }}>No share events yet.</Text>
                      <Text style={{ color: '#64748b', fontSize: 10, marginTop: 4 }}>Switch to "+ Log Share" to add one.</Text>
                    </View>
                  ) : (
                    filteredLog.map((ev, idx) => (
                      <View key={ev.id} style={[styles.logItem, idx < filteredLog.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#1e293b' }]}>
                        {/* Channel badge */}
                        <View style={[styles.logChannelBadge, { backgroundColor: `${CHANNEL_COLOR[ev.channel]}22` }]}>
                          <Text style={[styles.logChannelText, { color: CHANNEL_COLOR[ev.channel] }]}>
                            {CHANNEL_LABEL[ev.channel]}
                          </Text>
                        </View>
                        {/* Who → Whom */}
                        <Text style={styles.logWho}>
                          <Text style={{ color: '#ffffff', fontWeight: '900' }}>{ev.sharedBy}</Text>
                          <Text style={{ color: '#64748b' }}> → </Text>
                          <Text style={{ color: '#818cf8', fontWeight: '900' }}>{ev.sharedTo}</Text>
                        </Text>
                        {ev.leadContact && (
                          <Text style={styles.logContact}>{ev.leadContact}</Text>
                        )}
                        {ev.note && (
                          <Text style={styles.logNote}>"{ev.note}"</Text>
                        )}
                        <Text style={styles.logTime}>🕐 {ev.timestamp}</Text>
                      </View>
                    ))
                  )}
                </ScrollView>
              </>
            ) : (
              /* ── Log Share Form ── */
              <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                <Text style={{ color: '#94a3b8', fontSize: 10, marginBottom: 10, lineHeight: 15 }}>
                  Manually record a share event — who sent it, to which lead, and via what channel.
                </Text>
                <View style={{ gap: 8 }}>
                  <TextInput style={styles.inputField} placeholder="Shared by (Employee name)" placeholderTextColor="#64748b" value={logSharedBy} onChangeText={setLogSharedBy} />
                  <TextInput style={styles.inputField} placeholder="Shared to (Lead / Company)" placeholderTextColor="#64748b" value={logSharedTo} onChangeText={setLogSharedTo} />
                  <TextInput style={styles.inputField} placeholder="Contact (phone / email / platform)" placeholderTextColor="#64748b" value={logContact} onChangeText={setLogContact} />

                  {/* Channel selector */}
                  <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', marginTop: 2 }}>Channel</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {(['WHATSAPP', 'EMAIL', 'LINK'] as ShareChannel[]).map(ch => (
                      <TouchableOpacity
                        key={ch}
                        onPress={() => setLogChannel(ch)}
                        style={[styles.catSelectBtn, { flex: 1, paddingVertical: 8 }, logChannel === ch && { backgroundColor: `${CHANNEL_COLOR[ch]}33`, borderColor: CHANNEL_COLOR[ch] }]}
                      >
                        <Text style={[{ fontSize: 10, fontWeight: '900', color: '#94a3b8' }, logChannel === ch && { color: CHANNEL_COLOR[ch] }]}>
                          {CHANNEL_LABEL[ch]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TextInput
                    style={[styles.inputField, { height: 64, textAlignVertical: 'top' }]}
                    placeholder="Note (optional)"
                    placeholderTextColor="#64748b"
                    value={logNote}
                    onChangeText={setLogNote}
                    multiline
                  />

                  <TouchableOpacity
                    style={[styles.saveUploadBtn, (!logSharedBy.trim() || !logSharedTo.trim()) && { opacity: 0.4 }]}
                    onPress={handleLogShare}
                    disabled={!logSharedBy.trim() || !logSharedTo.trim()}
                  >
                    <Text style={{ color: '#090d16', fontWeight: '900', fontSize: 12 }}>📊 Log Share Event</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}

          </View>
        </View>
      </Modal>

    </View>
  );
};

// ── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },

  // Header
  topHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 16, paddingBottom: 12, backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  backBtn: { backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  backBtnText: { color: '#38bdf8', fontWeight: '900', fontSize: 11 },
  headerTitle: { flex: 1, fontSize: 13, fontWeight: '900', color: '#ffffff', marginHorizontal: 8 },
  uploadHeaderBtn: { backgroundColor: '#10b981', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },

  // Global stats strip
  statsStrip: { flexDirection: 'row', backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  statCell: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  statCellBorder: { borderRightWidth: 1, borderRightColor: '#1e293b' },
  statValue: { fontSize: 18, fontWeight: '900' },
  statLabel: { fontSize: 9, color: '#64748b', marginTop: 2 },

  // Scroll & card
  scrollContent: { padding: 12, paddingBottom: 40, gap: 10 },
  pdfCard: { backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 12, gap: 8 },

  // PDF title row
  pdfTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  pdfIcon: { fontSize: 26, marginTop: 2 },
  itemName: { fontSize: 12, fontWeight: '800', color: '#ffffff', lineHeight: 17 },
  catBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  catBadgeText: { fontSize: 9, fontWeight: '900' },
  itemSub: { fontSize: 10, color: '#64748b', marginTop: 2 },

  // Share stat strip (per card)
  shareStatRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#1e293b' },
  shareStatLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '700' },
  shareStatTotal: { fontSize: 11, color: '#ffffff', fontWeight: '900' },
  statDivider: { width: 1, height: 12, backgroundColor: '#334155' },
  shareStatChip: { fontSize: 10, fontWeight: '800' },

  // Buttons
  btnRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  btnTextWhite: { fontSize: 10, fontWeight: '900', color: '#ffffff' },
  btnTextDark: { fontSize: 10, fontWeight: '900', color: '#090d16' },
  previewBtn: { backgroundColor: '#38bdf8', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  shareWaBtn: { backgroundColor: '#10b981', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  shareEmailBtn: { backgroundColor: '#6366f1', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  activityBtn: { backgroundColor: '#f59e0b', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },

  // Search
  inputField: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, color: '#ffffff' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.88)', justifyContent: 'center', padding: 14 },
  modalCard: { backgroundColor: '#0f172a', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#1e293b' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingBottom: 10 },
  modalTitleText: { fontSize: 13, fontWeight: '900', color: '#ffffff' },
  modalCloseBtn: { backgroundColor: '#1e293b', width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },

  // Upload
  catSelectBtn: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 8, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b' },
  saveUploadBtn: { backgroundColor: '#34d399', paddingVertical: 11, alignItems: 'center', borderRadius: 10, marginTop: 4 },

  // Preview body
  previewBody: { alignItems: 'center', paddingVertical: 16, paddingHorizontal: 12, backgroundColor: '#020617', borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  previewTitle: { fontSize: 13, fontWeight: '900', color: '#ffffff', textAlign: 'center' },
  previewSub: { fontSize: 11, color: '#38bdf8', marginTop: 4 },
  previewNote: { fontSize: 10, color: '#94a3b8', marginTop: 12, textAlign: 'center', paddingHorizontal: 16, lineHeight: 15 },

  // Activity modal stats
  activityStatsRow: { flexDirection: 'row', backgroundColor: '#020617', borderRadius: 10, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#1e293b' },
  activityStatCell: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  activityStatValue: { fontSize: 18, fontWeight: '900' },
  activityStatLabel: { fontSize: 9, color: '#64748b', marginTop: 2 },

  // Tabs
  tabRow: { flexDirection: 'row', marginBottom: 10, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#1e293b' },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: '#020617' },
  tabBtnActive: { backgroundColor: '#4f46e5' },
  tabBtnText: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  tabBtnTextActive: { color: '#ffffff' },

  // Filter chips
  filterRow: { flexDirection: 'row', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  filterChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b' },
  filterChipText: { fontSize: 10, fontWeight: '700', color: '#64748b' },

  // Log items
  logItem: { paddingVertical: 10, gap: 4 },
  logChannelBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  logChannelText: { fontSize: 10, fontWeight: '900' },
  logWho: { fontSize: 12 },
  logContact: { fontSize: 10, color: '#64748b' },
  logNote: { fontSize: 10, color: '#94a3b8', fontStyle: 'italic', lineHeight: 15 },
  logTime: { fontSize: 9, color: '#475569', marginTop: 2 },
});
