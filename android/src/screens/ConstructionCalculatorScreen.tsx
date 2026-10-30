/**
 * ConstructionCalculatorScreen.tsx — DAS CRM Android
 * Blank & Scalable Scaffold for Construction Cost Estimator.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

interface Props {
  onClose: () => void;
}

export const ConstructionCalculatorScreen: React.FC<Props> = ({ onClose }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: Math.max(insets.top, 16) }]}>
      {/* Top Banner Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBg, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={onClose}
          style={[styles.backBtn, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.backBtnText, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Construction Calculator</Text>
          <Text style={[styles.subTitle, { color: colors.textMuted }]}>Cost Estimator & BOQ Engine</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>SCAFFOLD</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={[styles.heroCard, { backgroundColor: colors.cardBg, borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
          <View style={styles.iconCircle}>
            <Text style={{ fontSize: 26 }}>🏗️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.heroTitle, { color: colors.text }]}>Construction Calculator</Text>
              <View style={styles.pillTag}>
                <Text style={styles.pillTagText}>CONFIGURABLE</Text>
              </View>
            </View>
            <Text style={[styles.heroDesc, { color: colors.textSecondary }]}>
              Civil, MEP, structure, labour, and finish calculation modules. Ready for phased formula integration.
            </Text>
          </View>
        </View>

        {/* Feature Grid Placeholders */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>PLANNED MODULE BLOCKS</Text>
        <View style={styles.featureGrid}>
          {[
            { icon: '🧱', title: 'Civil & Foundation', desc: 'RCC, brickwork, excavation, and structural volume estimation.' },
            { icon: '⚡', title: 'MEP Systems', desc: 'Point-based electrical, plumbing lines, and HVAC units.' },
            { icon: '🎨', title: 'Finishing & Painting', desc: 'Wall area, primer coats, putty, and waterproofing factors.' },
            { icon: '👷', title: 'Labour & Contractors', desc: 'Per sq.ft or day-wise manpower cost calculator.' },
          ].map((item, idx) => (
            <View key={idx} style={[styles.featureCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <Text style={{ fontSize: 22, marginBottom: 6 }}>{item.icon}</Text>
              <Text style={[styles.featureTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.featureDesc, { color: colors.textMuted }]}>{item.desc}</Text>
            </View>
          ))}
        </View>

        {/* Scalable Container for inputs */}
        <View style={[styles.placeholderBox, { borderColor: colors.border }]}>
          <Text style={{ fontSize: 28, marginBottom: 8 }}>📐</Text>
          <Text style={[styles.placeholderTitle, { color: colors.text }]}>Ready for Formula Implementation</Text>
          <Text style={[styles.placeholderSub, { color: colors.textMuted }]}>
            Inputs, rate matrices, and real-time total estimation components can be dropped directly into this view.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default ConstructionCalculatorScreen;

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
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  statusBadgeText: { color: '#fbbf24', fontSize: 9, fontWeight: '900' },
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
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontSize: 15, fontWeight: '800' },
  pillTag: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pillTagText: { color: '#fbbf24', fontSize: 8, fontWeight: '900' },
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

