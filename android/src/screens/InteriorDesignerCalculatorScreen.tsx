/**
 * InteriorDesignerCalculatorScreen.tsx — DAS CRM Android
 * Blank & Scalable Scaffold for Interior Design Cost Estimator.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

interface Props {
  onClose: () => void;
}

export const InteriorDesignerCalculatorScreen: React.FC<Props> = ({ onClose }) => {
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
          <Text style={[styles.title, { color: colors.text }]}>Interior Designer Calculator</Text>
          <Text style={[styles.subTitle, { color: colors.textMuted }]}>Room-wise Space & Finish Budgeting</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>SCAFFOLD</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { backgroundColor: colors.cardBg, borderColor: 'rgba(244, 63, 94, 0.3)' }]}>
          <View style={styles.iconCircle}>
            <Text style={{ fontSize: 26 }}>🛋️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.heroTitle, { color: colors.text }]}>Interior Designer Calculator</Text>
              <View style={styles.pillTag}>
                <Text style={styles.pillTagText}>CONFIGURABLE</Text>
              </View>
            </View>
            <Text style={[styles.heroDesc, { color: colors.textSecondary }]}>
              Room-wise interior estimation — living, bedrooms, false ceiling, cladding, and lighting.
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>PLANNED MODULE BLOCKS</Text>
        <View style={styles.featureGrid}>
          {[
            { icon: '🛋️', title: 'Room Area Matrix', desc: 'Living, bed, dining, bath area input and finish grades.' },
            { icon: '🪵', title: 'Flooring & Paneling', desc: 'Tile, marble, vinyl, and wood laminate per sq.ft costing.' },
            { icon: '💡', title: 'Ceiling & Lighting', desc: 'False ceiling POP, cove lighting, and fixture points.' },
            { icon: '🪑', title: 'Furniture & Decor', desc: 'Custom joinery, loose furniture, and soft furnishing items.' },
          ].map((item, idx) => (
            <View key={idx} style={[styles.featureCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <Text style={{ fontSize: 22, marginBottom: 6 }}>{item.icon}</Text>
              <Text style={[styles.featureTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.featureDesc, { color: colors.textMuted }]}>{item.desc}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.placeholderBox, { borderColor: colors.border }]}>
          <Text style={{ fontSize: 28, marginBottom: 8 }}>🎨</Text>
          <Text style={[styles.placeholderTitle, { color: colors.text }]}>Ready for Room Budgeting Logic</Text>
          <Text style={[styles.placeholderSub, { color: colors.textMuted }]}>
            Room selectors, finish tier switchers, and client quotation generation can be added here.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default InteriorDesignerCalculatorScreen;

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
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  statusBadgeText: { color: '#f43f5e', fontSize: 9, fontWeight: '900' },
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
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontSize: 15, fontWeight: '800' },
  pillTag: {
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pillTagText: { color: '#f43f5e', fontSize: 8, fontWeight: '900' },
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

