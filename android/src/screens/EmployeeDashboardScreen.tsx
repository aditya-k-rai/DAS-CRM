/**
 * EmployeeDashboardScreen.tsx — DAS CRM Android (Sales Executive Workspace)
 * Built to spec with default Sales Rep sections:
 * 1. 🎯 Dashboard Header & Role Welcome Banner
 * 2. 📊 My Total Leads & New Leads Overview
 * 3. ⏰ Follow-ups Due Today & Overdue Follow-ups
 * 4. 💼 Active Opportunities & Revenue
 * 5. 🌟 My Performance & Conversion Rate
 * 6. ⏱️ Attendance Status & Quick Punch Action
 * 7. 📌 The Notice Board (Company Bulletins)
 * 8. 📦 Products & PDF Catalogue (Only rendered when Admin toggles ON; zero lock banners)
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

// ─── Seed data ────────────────────────────────────────────────────────────────

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

  // Permission checks (On/Off visibility only)
  const userId = currentUser?.id || '';
  const rawRole = (currentUser?.role || 'SALES_EXEC').toUpperCase();
  const userRole = (rawRole === 'SUPER_ADMIN' ? 'ADMIN' : rawRole) as import('../store/moduleAccessStore').UserRole;
  const productsPerm = accessStore.getPermission(userId, userRole, 'PRODUCTS');
  const pdfPerm = accessStore.getPermission(userId, userRole, 'PDF_CATALOG');

  const firstName = currentUser?.name?.split(' ')?.[0] || 'Sales Rep';

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

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 56 : 20) + 85 },
        ]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── 1. Welcome Banner ──────────────────────────────────────────────── */}
        <View style={[styles.headerBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.avatarBox, { backgroundColor: '#4f46e5' }]}>
                <Text style={styles.avatarText}>{currentUser?.avatar || 'SR'}</Text>
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Good morning, {firstName}! 👋</Text>
                <Text style={[styles.headerSub, { color: colors.textMuted }]}>
                  {currentUser?.companyName || 'DAS CRM Workspace'}
                </Text>
              </View>
            </View>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>SALES REP</Text>
            </View>
          </View>
          <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>
            Personal sales dashboard — real-time overview of your assigned leads, follow-ups, and performance.
          </Text>
        </View>

        {/* ── 2. My Total Leads & New Leads ──────────────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🎯 My Leads Overview</Text>
          <TouchableOpacity onPress={() => navigation?.navigate('Leads')}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>View All →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: 'rgba(99,102,241,0.3)' }]}>
            <Text style={[styles.statVal, { color: colors.text }]}>0</Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>My Total Leads</Text>
            <Text style={[styles.statSub, { color: '#818cf8' }]}>Scoped to you</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: 'rgba(16,185,129,0.3)' }]}>
            <Text style={[styles.statVal, { color: '#34d399' }]}>0</Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>New Leads</Text>
            <Text style={[styles.statSub, { color: '#34d399' }]}>This week</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: 'rgba(56,189,248,0.3)' }]}>
            <Text style={[styles.statVal, { color: '#38bdf8' }]}>0</Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>Contacted</Text>
            <Text style={[styles.statSub, { color: '#38bdf8' }]}>Called / messaged</Text>
          </View>
        </View>

        {/* ── 3. Follow-ups Due Today & Overdue ──────────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>⏰ Follow-ups Tracker</Text>
        </View>

        <View style={[styles.cardBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={styles.followupGrid}>
            <View style={[styles.followupBox, { borderColor: 'rgba(245,158,11,0.3)', backgroundColor: 'rgba(245,158,11,0.06)' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={[styles.statusDot, { backgroundColor: '#fbbf24' }]} />
                <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted }}>Due Today</Text>
              </View>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#fbbf24', marginTop: 4 }}>0</Text>
              <Text style={{ fontSize: 9, color: colors.textMuted, marginTop: 2 }}>Requires call action</Text>
            </View>

            <View style={[styles.followupBox, { borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.06)' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={[styles.statusDot, { backgroundColor: '#f87171' }]} />
                <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted }}>Overdue</Text>
              </View>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#f87171', marginTop: 4 }}>0</Text>
              <Text style={{ fontSize: 9, color: colors.textMuted, marginTop: 2 }}>Past deadline</Text>
            </View>

            <View style={[styles.followupBox, { borderColor: 'rgba(16,185,129,0.3)', backgroundColor: 'rgba(16,185,129,0.06)' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={[styles.statusDot, { backgroundColor: '#34d399' }]} />
                <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted }}>Completed</Text>
              </View>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#34d399', marginTop: 4 }}>0</Text>
              <Text style={{ fontSize: 9, color: colors.textMuted, marginTop: 2 }}>Logged this week</Text>
            </View>
          </View>
        </View>

        {/* ── 4. Active Opportunities & Revenue ──────────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>💼 Active Opportunities</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: 'rgba(168,85,247,0.3)' }]}>
            <Text style={[styles.statVal, { color: '#c084fc' }]}>₹0</Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>Pipeline Value</Text>
            <Text style={[styles.statSub, { color: '#c084fc' }]}>Open negotiations</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: 'rgba(16,185,129,0.3)' }]}>
            <Text style={[styles.statVal, { color: '#34d399' }]}>₹0</Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>Won Revenue</Text>
            <Text style={[styles.statSub, { color: '#34d399' }]}>This month</Text>
          </View>
        </View>

        {/* ── 5. My Performance ──────────────────────────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🌟 My Performance</Text>
        </View>

        <View style={[styles.cardBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
            <View>
              <Text style={{ fontSize: 12, fontWeight: '800', color: colors.text }}>Conversion Rate</Text>
              <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>Lead to customer conversion</Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#34d399' }}>0.0%</Text>
          </View>
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
            <View>
              <Text style={{ fontSize: 12, fontWeight: '800', color: colors.text }}>Daily Call Target</Text>
              <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>Dialing efficiency & outreach</Text>
            </View>
            <Text style={{ fontSize: 14, fontWeight: '900', color: colors.text }}>0 / 30 Calls</Text>
          </View>
        </View>

        {/* ── 6. Attendance Status ───────────────────────────────────────────── */}
        <View style={[styles.cardBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>⏱️ Attendance Status</Text>
              <Text style={[styles.cardSub, { color: colors.textMuted }]}>
                Daily punch: <Text style={{ color: '#34d399', fontWeight: '800' }}>Active in Workspace</Text>
              </Text>
            </View>
            <TouchableOpacity style={styles.actionBtn} onPress={onNavigateToAttendance} activeOpacity={0.8}>
              <Text style={styles.actionBtnText}>Mark Attendance →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 7. Notice Board ────────────────────────────────────────────────── */}
        <View style={[styles.cardBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>📌 The Notice Board</Text>
            <TouchableOpacity onPress={() => navigation?.navigate('Menu', { initialModule: 'UPCOMING_COMMS' })}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: colors.primary }}>Open Board →</Text>
            </TouchableOpacity>
          </View>
          <View style={{ paddingVertical: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 11, color: colors.textMuted, fontStyle: 'italic' }}>
              No urgent announcements posted today.
            </Text>
          </View>
        </View>

        {/* ── 8. Products Section (Rendered ONLY when permitted/active) ───────── */}
        {productsPerm.active && (
          <View style={{ width: '100%', maxWidth: 600 }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>📦 Company Products</Text>
              <TouchableOpacity
                onPress={() => {
                  try { navigation?.navigate('Menu', { initialModule: 'PRODUCTS' }); } catch {}
                }}
                activeOpacity={0.75}
              >
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>Full Catalogue →</Text>
              </TouchableOpacity>
            </View>

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
          </View>
        )}

        {/* ── 9. PDF Catalogue (Rendered ONLY when permitted/active) ─────────── */}
        {pdfPerm.active && (
          <View style={{ width: '100%', maxWidth: 600, marginTop: 4 }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>📄 PDF Catalogue</Text>
              <TouchableOpacity
                onPress={() => {
                  try { navigation?.navigate('Menu', { initialModule: 'PDF_CATALOG' }); } catch {}
                }}
                activeOpacity={0.75}
              >
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>Manage All →</Text>
              </TouchableOpacity>
            </View>

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

                    {pdfPerm.canShare && (
                      <TouchableOpacity
                        style={[styles.pdfShareBtn, { backgroundColor: '#25D366' }]}
                        onPress={() => setPdfShareTarget(pdf)}
                        activeOpacity={0.8}
                      >
                        <Text style={{ fontSize: 10, color: '#fff', fontWeight: '800' }}>Share</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

      </ScrollView>

      {/* ── Modals (Product Details & PDF Share) ─────────────────────────────── */}
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
                      const msg = `Hi! Check out our product: ${productDetailOpen.name} (${productDetailOpen.sku})\nPrice: ${productDetailOpen.price}\n${productDetailOpen.description}`;
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

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, alignItems: 'center' },

  headerBox: { width: '100%', maxWidth: 600, marginBottom: 14, borderRadius: 16, borderWidth: 1, padding: 14 },
  avatarBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#ffffff', fontWeight: '900', fontSize: 14 },
  headerTitle: { fontSize: 17, fontWeight: '900' },
  headerSub: { fontSize: 11, marginTop: 1 },
  roleBadge: { backgroundColor: 'rgba(99,102,241,0.15)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  roleBadgeText: { color: '#818cf8', fontSize: 9, fontWeight: '800' },

  sectionHeaderRow: { width: '100%', maxWidth: 600, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginTop: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '800' },

  statsGrid: { width: '100%', maxWidth: 600, flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '900' },
  statLbl: { fontSize: 10, fontWeight: '700', marginTop: 2, textAlign: 'center' },
  statSub: { fontSize: 9, fontWeight: '600', marginTop: 2, textAlign: 'center' },

  cardBox: { width: '100%', maxWidth: 600, borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 14 },
  cardTitle: { fontSize: 13, fontWeight: '800' },
  cardSub: { fontSize: 11, marginTop: 2 },

  followupGrid: { flexDirection: 'row', gap: 8 },
  followupBox: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 10 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },

  actionBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  actionBtnText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },

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
