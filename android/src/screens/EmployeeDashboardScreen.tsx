/**
 * EmployeeDashboardScreen.tsx — DAS CRM Android (Sales Executive Workspace)
 * Features:
 * 1. Personal assigned leads, KPIs (Assigned Leads, Closed Deals Value, Best Rate)
 * 2. Attendance status with quick-punch navigation
 * 3. Priority Dialing Queue with instant call + post-call outcome logging
 * 4. 📦 Products Quick-Browse — company product catalogue embedded in the dashboard
 * 5. 📄 PDF Catalogue — shareable sales collateral with one-tap WhatsApp/Email sharing
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../context/ThemeContext';
import { callSyncEngine } from '../services/callSyncEngine';
import PostCallOutcomeModal from '../components/PostCallOutcomeModal';
import { useModuleAccessStore } from '../store/moduleAccessStore';

// ─── Embedded Types ───────────────────────────────────────────────────────────

interface ProductItem {
  id: string;
  name: string;
  sku: string;
  price: string;
  category: string;
  description: string;
  emoji: string;
}

interface PdfItem {
  id: string;
  title: string;
  category: string;
  size: string;
  updated: string;
  emoji: string;
}

// ─── Seed data (would come from apiService in production) ─────────────────────

const DEMO_PRODUCTS: ProductItem[] = [
  { id: 'p1', name: 'Premium Solar Panel 400W',   sku: 'SOL-400W',  price: '₹12,500',  category: 'Solar',    description: 'High-efficiency monocrystalline panel', emoji: '☀️' },
  { id: 'p2', name: 'Lithium Battery 150Ah',       sku: 'BAT-150AH', price: '₹18,000',  category: 'Battery',  description: 'Deep cycle lithium-iron-phosphate',     emoji: '🔋' },
  { id: 'p3', name: 'Solar Inverter 5kW',          sku: 'INV-5KW',   price: '₹35,000',  category: 'Inverter', description: 'Hybrid grid-tie inverter with MPPT',    emoji: '⚡' },
  { id: 'p4', name: 'Structure Mounting Kit',      sku: 'MNT-KIT-1', price: '₹4,500',   category: 'Hardware', description: 'Galvanized steel rooftop mounting',     emoji: '🔩' },
  { id: 'p5', name: 'Charge Controller 60A MPPT',  sku: 'MPPT-60A',  price: '₹6,800',   category: 'Control',  description: '12/24/48V auto MPPT charge controller', emoji: '🎛️' },
];

const DEMO_PDFS: PdfItem[] = [
  { id: 'pdf1', title: 'Solar System Product Catalogue 2026',      category: 'PRODUCT',       size: '4.2 MB', updated: '2 days ago',  emoji: '📦' },
  { id: 'pdf2', title: 'Residential Solar Pricing Guide Q3 2026',  category: 'PRICING',       size: '1.8 MB', updated: '5 days ago',  emoji: '💰' },
  { id: 'pdf3', title: 'Technical Specification Sheet v3.1',        category: 'SPECIFICATION', size: '3.1 MB', updated: '1 week ago',  emoji: '📐' },
  { id: 'pdf4', title: 'Commercial Solar Proposal Template',        category: 'PROPOSAL',      size: '2.7 MB', updated: '3 days ago',  emoji: '📋' },
];

const CAT_COLOR: Record<string, string> = {
  PRODUCT:       '#6366f1',
  PRICING:       '#34d399',
  SPECIFICATION: '#38bdf8',
  PROPOSAL:      '#fbbf24',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function EmployeeDashboardScreen({ navigation, onNavigateToAttendance }: any) {
  const { colors, isDark } = useTheme();
  const { currentUser } = useAuthStore();
  const insets = useSafeAreaInsets();
  const accessStore = useModuleAccessStore();

  const [activeCallLead, setActiveCallLead] = useState<{ id: string; name: string; phone: string } | null>(null);
  const [productDetailOpen, setProductDetailOpen] = useState<ProductItem | null>(null);
  const [pdfShareTarget, setPdfShareTarget] = useState<PdfItem | null>(null);

  // Permission checks
  const userId = currentUser?.id || '';
  // Normalize SUPER_ADMIN → ADMIN for module access lookup (both have identical full access)
  const rawRole = (currentUser?.role || 'SALES_EXEC').toUpperCase();
  const userRole = (rawRole === 'SUPER_ADMIN' ? 'ADMIN' : rawRole) as import('../store/moduleAccessStore').UserRole;
  const productsPerm = accessStore.getPermission(userId, userRole, 'PRODUCTS');
  const pdfPerm = accessStore.getPermission(userId, userRole, 'PDF_CATALOG');

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleDialQueueLead = useCallback((name: string, phone: string) => {
    const cleaned = (phone || '').replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${cleaned}`).catch(() => {
      Alert.alert('Dialing Direct', `Direct dialing ${cleaned} for ${name}...`);
    });
    callSyncEngine.initiateCall('queue-lead', name, phone);
    setActiveCallLead({ id: 'queue-lead', name, phone });
  }, []);

  const handleSharePdf = useCallback((pdf: PdfItem, channel: 'WHATSAPP' | 'EMAIL') => {
    setPdfShareTarget(null);
    if (channel === 'WHATSAPP') {
      const msg = `Hi, please find our ${pdf.title} attached. For more information, feel free to contact us.`;
      Linking.openURL(`whatsapp://send?text=${encodeURIComponent(msg)}`).catch(() =>
        Alert.alert('WhatsApp', `Sharing "${pdf.title}" via WhatsApp...`),
      );
    } else {
      const subject = encodeURIComponent(pdf.title);
      const body = encodeURIComponent(`Please find ${pdf.title} (${pdf.size}) attached.\n\nBest regards,\n${currentUser?.name}`);
      Linking.openURL(`mailto:?subject=${subject}&body=${body}`).catch(() =>
        Alert.alert('Email', `Opening email draft for "${pdf.title}"...`),
      );
    }
  }, [currentUser?.name]);

  // ─── Render helpers ────────────────────────────────────────────────────────

  const renderLockedSection = (label: string, icon: string) => (
    <View style={[styles.lockedBox, { backgroundColor: isDark ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.04)', borderColor: 'rgba(239,68,68,0.25)' }]}>
      <Text style={{ fontSize: 22, marginBottom: 4 }}>{icon}</Text>
      <Text style={{ fontSize: 12, fontWeight: '800', color: '#f87171' }}>🔒 {label} — Access Restricted</Text>
      <Text style={{ fontSize: 10, color: isDark ? '#94a3b8' : '#64748b', marginTop: 3, textAlign: 'center' }}>
        Contact your Admin to enable access to this module.
      </Text>
    </View>
  );

  // ─── JSX ───────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 56 : 20) + 85 },
        ]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <View style={[styles.headerBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>🎯 Sales Executive Workspace</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>
            {currentUser?.name} · {currentUser?.companyName}
          </Text>
        </View>

        {/* ── Personal KPI Cards ──────────────────────────────────────────────── */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: 'rgba(99,102,241,0.3)' }]}>
            <Text style={[styles.statVal, { color: colors.text }]}>0 Leads</Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>My Assigned Leads</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: 'rgba(16,185,129,0.3)' }]}>
            <Text style={[styles.statVal, { color: '#34d399' }]}>₹0</Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>Closed Deals Value</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: 'rgba(168,85,247,0.3)' }]}>
            <Text style={[styles.statVal, { color: '#c084fc' }]}>0.0%</Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>Personal Best Rate</Text>
          </View>
        </View>

        {/* ── Attendance Status ───────────────────────────────────────────────── */}
        <View style={[styles.cardBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>⏱️ Attendance Status</Text>
              <Text style={[styles.cardSub, { color: colors.textMuted }]}>
                Status:{' '}
                <Text style={{ color: '#34d399', fontWeight: '800' }}>PUNCHED IN</Text>
              </Text>
            </View>
            <TouchableOpacity style={styles.actionBtn} onPress={onNavigateToAttendance} activeOpacity={0.8}>
              <Text style={styles.actionBtnText}>Mark Attendance →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Priority Dialing Queue ──────────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>My Priority Dialing Queue</Text>
        <View style={[styles.cardBox, { backgroundColor: colors.cardBg, borderColor: colors.border, paddingVertical: 20 }]}>
          <Text style={{ textAlign: 'center', fontSize: 13, color: colors.textMuted, fontStyle: 'italic' }}>
            📭 No priority leads in dialing queue
          </Text>
        </View>

        {/* ─────────────────────────────────────────────────────────────────────────── */}
        {/* 📦 PRODUCTS SECTION                                                        */}
        {/* ─────────────────────────────────────────────────────────────────────────── */}
        <View style={{ width: '100%', maxWidth: 600 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>📦 Company Products</Text>
            {productsPerm.active && (
              <TouchableOpacity
                onPress={() => {
                  try { navigation?.navigate('Menu', { initialModule: 'PRODUCTS' }); } catch {}
                }}
                activeOpacity={0.75}
              >
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>Full Catalogue →</Text>
              </TouchableOpacity>
            )}
          </View>

          {!productsPerm.active ? (
            renderLockedSection('Product Catalogue', '📦')
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 4 }}>
              {DEMO_PRODUCTS.map((prod) => (
                <TouchableOpacity
                  key={prod.id}
                  style={[styles.productCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
                  onPress={() => setProductDetailOpen(prod)}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 28, marginBottom: 6 }}>{prod.emoji}</Text>
                  <Text style={[styles.prodName, { color: colors.text }]} numberOfLines={2}>{prod.name}</Text>
                  <Text style={[styles.prodSku, { color: colors.textMuted }]}>{prod.sku}</Text>
                  <Text style={[styles.prodPrice, { color: '#34d399' }]}>{prod.price}</Text>
                  <View style={[styles.prodCatPill, { backgroundColor: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.3)' }]}>
                    <Text style={{ fontSize: 9, color: '#818cf8', fontWeight: '700' }}>{prod.category}</Text>
                  </View>
                  {productsPerm.canShare && (
                    <TouchableOpacity
                      style={[styles.shareSmallBtn, { backgroundColor: '#25D366' }]}
                      onPress={() => {
                        const msg = `Hi! Check out our ${prod.name} (${prod.sku}) — ${prod.price}. ${prod.description}.`;
                        Linking.openURL(`whatsapp://send?text=${encodeURIComponent(msg)}`).catch(() =>
                          Alert.alert('Share Product', `Sharing ${prod.name} via WhatsApp...`),
                        );
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={{ fontSize: 9, color: '#ffffff', fontWeight: '800' }}>💬 Share</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ─────────────────────────────────────────────────────────────────────────── */}
        {/* 📄 PDF CATALOGUE SECTION                                                   */}
        {/* ─────────────────────────────────────────────────────────────────────────── */}
        <View style={{ width: '100%', maxWidth: 600, marginTop: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>📄 PDF Catalogue</Text>
            {pdfPerm.active && (
              <TouchableOpacity
                onPress={() => {
                  try { navigation?.navigate('Menu', { initialModule: 'PDF_CATALOG' }); } catch {}
                }}
                activeOpacity={0.75}
              >
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>Manage All →</Text>
              </TouchableOpacity>
            )}
          </View>

          {!pdfPerm.active ? (
            renderLockedSection('PDF Catalogue', '📄')
          ) : (
            <View style={[styles.cardBox, { backgroundColor: colors.cardBg, borderColor: colors.border, paddingVertical: 8 }]}>
              {DEMO_PDFS.map((pdf, idx) => {
                const catColor = CAT_COLOR[pdf.category] ?? '#6366f1';
                return (
                  <View
                    key={pdf.id}
                    style={[
                      styles.pdfRow,
                      idx < DEMO_PDFS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                    ]}
                  >
                    {/* Icon + info */}
                    <View style={[styles.pdfIconBox, { backgroundColor: catColor + '18', borderColor: catColor + '40' }]}>
                      <Text style={{ fontSize: 16 }}>{pdf.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.pdfTitle, { color: colors.text }]} numberOfLines={1}>{pdf.title}</Text>
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
                        <Text style={{ fontSize: 9, color: colors.textMuted }}>{pdf.size}</Text>
                        <Text style={{ fontSize: 9, color: colors.textMuted }}>·</Text>
                        <Text style={{ fontSize: 9, color: colors.textMuted }}>{pdf.updated}</Text>
                        <View style={{ backgroundColor: catColor + '18', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 }}>
                          <Text style={{ fontSize: 8, color: catColor, fontWeight: '800' }}>{pdf.category}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Share buttons */}
                    {pdfPerm.canShare ? (
                      <TouchableOpacity
                        style={[styles.pdfShareBtn, { backgroundColor: '#25D366' }]}
                        onPress={() => setPdfShareTarget(pdf)}
                        activeOpacity={0.8}
                      >
                        <Text style={{ fontSize: 10, color: '#fff', fontWeight: '800' }}>Share</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={{ fontSize: 9, color: colors.textMuted }}>🔒</Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

      </ScrollView>

      {/* ── Post-Call Outcome Modal ──────────────────────────────────────────── */}
      {activeCallLead && (
        <PostCallOutcomeModal
          visible={!!activeCallLead}
          leadId={activeCallLead.id}
          leadName={activeCallLead.name}
          phone={activeCallLead.phone}
          onClose={() => setActiveCallLead(null)}
          onSaveOutcome={() => setActiveCallLead(null)}
        />
      )}

      {/* ── Product Detail Modal ─────────────────────────────────────────────── */}
      <Modal visible={!!productDetailOpen} transparent animationType="slide" onRequestClose={() => setProductDetailOpen(null)}>
        <View style={styles.modalOverlay}>
          {productDetailOpen && (
            <View style={[styles.modalCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <View style={[styles.modalHeaderRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{productDetailOpen.emoji} Product Details</Text>
                <TouchableOpacity onPress={() => setProductDetailOpen(null)} style={[styles.modalCloseBtn, { backgroundColor: colors.cardBgElevated }]}>
                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: '900' }}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text, marginBottom: 4 }}>{productDetailOpen.name}</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 12 }}>SKU: {productDetailOpen.sku} · Category: {productDetailOpen.category}</Text>
              <Text style={{ fontSize: 24, fontWeight: '900', color: '#34d399', marginBottom: 10 }}>{productDetailOpen.price}</Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary ?? colors.textMuted, lineHeight: 20, marginBottom: 16 }}>
                {productDetailOpen.description}
              </Text>

              {productsPerm.canShare && (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.modalActionBtn, { backgroundColor: '#25D366', flex: 1 }]}
                    onPress={() => {
                      setProductDetailOpen(null);
                      const msg = `Hi! Check out our product: ${productDetailOpen.name} (${productDetailOpen.sku})\nPrice: ${productDetailOpen.price}\n${productDetailOpen.description}\n\nContact us for more details.`;
                      Linking.openURL(`whatsapp://send?text=${encodeURIComponent(msg)}`).catch(() =>
                        Alert.alert('WhatsApp', `Sharing ${productDetailOpen.name}...`),
                      );
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalActionBtnText}>💬 Share via WhatsApp</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalActionBtn, { backgroundColor: '#6366f1', flex: 1 }]}
                    onPress={() => {
                      setProductDetailOpen(null);
                      const subject = encodeURIComponent(`Product Info: ${productDetailOpen.name}`);
                      const body = encodeURIComponent(`Product: ${productDetailOpen.name}\nSKU: ${productDetailOpen.sku}\nPrice: ${productDetailOpen.price}\n\n${productDetailOpen.description}`);
                      Linking.openURL(`mailto:?subject=${subject}&body=${body}`).catch(() =>
                        Alert.alert('Email', `Opening email for ${productDetailOpen.name}...`),
                      );
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalActionBtnText}>📧 Share via Email</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </Modal>

      {/* ── PDF Share Channel Modal ──────────────────────────────────────────── */}
      <Modal visible={!!pdfShareTarget} transparent animationType="fade" onRequestClose={() => setPdfShareTarget(null)}>
        <View style={styles.modalOverlay}>
          {pdfShareTarget && (
            <View style={[styles.modalCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <View style={[styles.modalHeaderRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>📤 Share PDF Catalogue</Text>
                <TouchableOpacity onPress={() => setPdfShareTarget(null)} style={[styles.modalCloseBtn, { backgroundColor: colors.cardBgElevated }]}>
                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: '900' }}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 16 }} numberOfLines={2}>{pdfShareTarget.title}</Text>
              <View style={{ gap: 10 }}>
                <TouchableOpacity
                  style={[styles.shareChannelBtn, { backgroundColor: '#25D366' }]}
                  onPress={() => handleSharePdf(pdfShareTarget, 'WHATSAPP')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.shareChannelBtnText}>💬 Share via WhatsApp</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.shareChannelBtn, { backgroundColor: '#6366f1' }]}
                  onPress={() => handleSharePdf(pdfShareTarget, 'EMAIL')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.shareChannelBtnText}>📧 Share via Email</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.shareChannelBtn, { backgroundColor: colors.cardBgElevated, borderWidth: 1, borderColor: colors.border }]}
                  onPress={() => setPdfShareTarget(null)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.shareChannelBtnText, { color: colors.textMuted }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, alignItems: 'center' },

  headerBox: { width: '100%', maxWidth: 600, marginBottom: 14, borderRadius: 14, borderWidth: 1, padding: 14 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  headerSub: { fontSize: 11, marginTop: 2 },

  statsGrid: { width: '100%', maxWidth: 600, flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: 'center' },
  statVal: { fontSize: 16, fontWeight: '900', color: '#818cf8' },
  statLbl: { fontSize: 9, marginTop: 2, textAlign: 'center' },

  cardBox: { width: '100%', maxWidth: 600, borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 16 },
  cardTitle: { fontSize: 13, fontWeight: '800' },
  cardSub: { fontSize: 11, marginTop: 2 },

  actionBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  actionBtnText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },

  sectionTitle: { fontSize: 13, fontWeight: '800', marginBottom: 8, width: '100%', maxWidth: 600 },

  lockedBox: {
    width: '100%',
    maxWidth: 600,
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },

  // Product cards (horizontal carousel)
  productCard: {
    width: 148,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  prodName: { fontSize: 11, fontWeight: '800', textAlign: 'center', marginBottom: 2 },
  prodSku: { fontSize: 9, marginBottom: 4 },
  prodPrice: { fontSize: 13, fontWeight: '900', marginBottom: 6 },
  prodCatPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, borderWidth: 1, marginBottom: 6 },
  shareSmallBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 7,
    marginTop: 2,
  },

  // PDF list rows
  pdfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  pdfIconBox: {
    width: 36,
    height: 36,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pdfTitle: { fontSize: 12, fontWeight: '700' },
  pdfShareBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
    flexShrink: 0,
  },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.87)', justifyContent: 'center', alignItems: 'center', padding: 18 },
  modalCard: { width: '100%', maxWidth: 420, borderRadius: 20, borderWidth: 1, padding: 18 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottomWidth: 1, paddingBottom: 10 },
  modalTitle: { fontSize: 15, fontWeight: '900' },
  modalCloseBtn: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  modalActionBtn: { flex: 1, paddingVertical: 11, borderRadius: 12, alignItems: 'center' },
  modalActionBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },

  shareChannelBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  shareChannelBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
});
