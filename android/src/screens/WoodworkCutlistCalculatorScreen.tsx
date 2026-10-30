/**
 * WoodworkCutlistCalculatorScreen.tsx — DAS CRM Android
 * Blank & Scalable Scaffold for Woodwork Cutlist Optimizer.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

interface Props {
  onClose: () => void;
}

export const WoodworkCutlistCalculatorScreen: React.FC<Props> = ({ onClose }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: Math.max(insets.top, 16) }]}>
      <View style={[styles.header, { backgroundColor: colors.cardBg, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={onClose}
          style={[styles.backBtn, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.backBtnText, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Woodwork Cutlist Calculator</Text>
          <Text style={[styles.subTitle, { color: colors.textMuted }]}>2D Panel Nesting & Sheet Optimization</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>SCAFFOLD</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { backgroundColor: colors.cardBg, borderColor: 'rgba(14, 165, 233, 0.3)' }]}>
          <View style={styles.iconCircle}>
            <Text style={{ fontSize: 26 }}>✂️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.heroTitle, { color: colors.text }]}>Woodwork Cutlist Calculator</Text>
              <View style={styles.pillTag}>
                <Text style={styles.pillTagText}>CONFIGURABLE</Text>
              </View>
            </View>
            <Text style={[styles.heroDesc, { color: colors.textSecondary }]}>
              Sheet nesting engine — input cut parts, calculate sheet quantities, kerf margin, and minimize material wastage.
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>PLANNED MODULE BLOCKS</Text>
        <View style={styles.featureGrid}>
          {[
            { icon: '📐', title: 'Sheet Dimensions', desc: '8x4, 7x4, 6x4 ft ply/MDF sheets with kerf allowance.' },
            { icon: '📋', title: 'Parts Inventory', desc: 'Add pieces with length, width, grain orientation, and quantity.' },
            { icon: '🧩', title: '2D Bin Packing', desc: 'Algorithmic nesting to pack maximal parts into minimum sheets.' },
            { icon: '📊', title: 'Wastage Telemetry', desc: 'Scrap percentage, reusable offcut pieces, and project cost.' },
          ].map((item, idx) => (
            <View key={idx} style={[styles.featureCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <Text style={{ fontSize: 22, marginBottom: 6 }}>{item.icon}</Text>
              <Text style={[styles.featureTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.featureDesc, { color: colors.textMuted }]}>{item.desc}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.placeholderBox, { borderColor: colors.border }]}>
          <Text style={{ fontSize: 28, marginBottom: 8 }}>✂️</Text>
          <Text style={[styles.placeholderTitle, { color: colors.text }]}>Ready for Nesting Algorithm</Text>
          <Text style={[styles.placeholderSub, { color: colors.textMuted }]}>
            Parts list grids, visual cutting diagrams, and sheet export features will plug right into this layout.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default WoodworkCutlistCalculatorScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  titleContainer: { flex: 1 },
  title: { fontSize: 15, fontWeight: '900' },
  subTitle: { fontSize: 10, marginTop: 1 },
  statusBadge: {
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)',
  },
  statusBadgeText: { color: '#38bdf8', fontSize: 9, fontWeight: '900' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  heroCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontSize: 15, fontWeight: '800' },
  pillTag: {
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pillTagText: { color: '#38bdf8', fontSize: 8, fontWeight: '900' },
  heroDesc: { fontSize: 11, marginTop: 4, lineHeight: 16 },
  sectionHeading: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, marginBottom: 12 },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  featureCard: {
    width: '48%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  featureTitle: { fontSize: 12, fontWeight: '800', marginBottom: 4 },
  featureDesc: { fontSize: 10, lineHeight: 14 },
  placeholderBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderTitle: { fontSize: 13, fontWeight: '800', marginBottom: 4 },
  placeholderSub: { fontSize: 11, textAlign: 'center', maxWidth: 280, lineHeight: 16 },
});

