/**
 * AIScoreComponents.tsx — DAS CRM Android
 * AI Lead Score Badge, Breakdown Modal, and Distribution Card
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { AIScoreData, ScoreTier } from '../services/apiService';

// Tier Configuration
const TIER_CONFIG = {
  HOT: { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.4)', color: '#ef4444', label: 'Hot', emoji: '🔥' },
  WARM: { bg: 'rgba(34, 197, 94, 0.2)', border: 'rgba(34, 197, 94, 0.4)', color: '#22c55e', label: 'Warm', emoji: '🟢' },
  COLD: { bg: 'rgba(234, 179, 8, 0.2)', border: 'rgba(234, 179, 8, 0.4)', color: '#eab308', label: 'Cold', emoji: '🟡' },
  LOW: { bg: 'rgba(148, 163, 184, 0.2)', border: 'rgba(148, 163, 184, 0.4)', color: '#94a3b8', label: 'Low', emoji: '⚪' },
};

const SCORE_CATEGORIES = [
  { key: 'budgetScore' as const, label: 'Budget', color: '#8b5cf6' },
  { key: 'intentScore' as const, label: 'Intent', color: '#ec4899' },
  { key: 'engagementScore' as const, label: 'Engagement', color: '#3b82f6' },
  { key: 'productFitScore' as const, label: 'Product Fit', color: '#f59e0b' },
  { key: 'responseScore' as const, label: 'Response', color: '#22c55e' },
];

// ─────────────────────────────────────────────────────────────
// 🤖 AI LEAD SCORE BADGE (Compact Display for Lead Cards)
// ─────────────────────────────────────────────────────────────
export function AIScoreBadge({ score, compact = false }: { score: AIScoreData; compact?: boolean }) {
  const [modalVisible, setModalVisible] = useState(false);
  const config = TIER_CONFIG[score.tier] || TIER_CONFIG.LOW;

  if (compact) {
    return (
      <>
        <TouchableOpacity
          style={[styles.compactBadge, { backgroundColor: config.bg, borderColor: config.border }]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.compactEmoji}>{config.emoji}</Text>
          <Text style={[styles.compactScore, { color: config.color }]}>{score.totalScore.toFixed(1)}</Text>
        </TouchableOpacity>
        <AIScoreDetailModal
          visible={modalVisible}
          score={score}
          onClose={() => setModalVisible(false)}
        />
      </>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.badge, { backgroundColor: config.bg, borderColor: config.border }]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.badgeEmoji}>{config.emoji}</Text>
        <Text style={[styles.badgeScore, { color: config.color }]}>{score.totalScore.toFixed(1)}</Text>
        <Text style={[styles.badgeLabel, { color: config.color }]}>/10</Text>
      </TouchableOpacity>
      <AIScoreDetailModal
        visible={modalVisible}
        score={score}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// 📊 AI SCORE DETAIL MODAL (Full Breakdown View)
// ─────────────────────────────────────────────────────────────
export function AIScoreDetailModal({
  visible,
  score,
  onClose,
}: {
  visible: boolean;
  score?: AIScoreData | null;
  onClose: () => void;
}) {
  if (!score) return null;

  const tierKey = (score.tier || 'LOW').toUpperCase() as keyof typeof TIER_CONFIG;
  const config = TIER_CONFIG[tierKey] || TIER_CONFIG.LOW;

  const getScoreColor = (value: number) => {
    if (value >= 80) return '#22c55e';
    if (value >= 60) return '#3b82f6';
    if (value >= 40) return '#eab308';
    return '#94a3b8';
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.modalContent} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={[styles.modalHeaderLeft, { backgroundColor: config.bg, borderColor: config.border }]}>
              <Text style={styles.modalEmoji}>{config.emoji}</Text>
            </View>
            <View style={styles.modalHeaderText}>
              <Text style={styles.modalTitle}>AI Lead Score</Text>
              <Text style={[styles.modalSubtitle, { color: config.color }]}>
                {config.label} Priority · {score.totalScore.toFixed(1)}/10
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
            {/* Score Breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 Score Breakdown</Text>
              {SCORE_CATEGORIES.map((cat) => {
                const rawValue = score[cat.key] ?? 80;
                const normalizedValue = rawValue <= 10 ? Math.round(rawValue * 10) : Math.round(rawValue);
                const percentage = Math.min(100, Math.max(0, normalizedValue));
                const scoreColor = getScoreColor(normalizedValue);
                return (
                  <View key={cat.key} style={styles.scoreRow}>
                    <View style={styles.scoreLabel}>
                      <Text style={[styles.scoreLabelText, { color: cat.color }]}>{cat.label}</Text>
                    </View>
                    <View style={styles.scoreBar}>
                      <View style={[styles.scoreBarFill, { width: `${percentage}%`, backgroundColor: scoreColor }]} />
                    </View>
                    <Text style={[styles.scoreValue, { color: scoreColor }]}>{normalizedValue}</Text>
                  </View>
                );
              })}
            </View>

            {/* AI Analysis */}
            {score.analysisSummary && (
              <View style={[styles.section, styles.analysisBox, { backgroundColor: `${config.color}15`, borderColor: `${config.color}35` }]}>
                <Text style={styles.sectionTitleEmoji}>🤖 AI Analysis</Text>
                <Text style={styles.analysisText}>{score.analysisSummary}</Text>
              </View>
            )}

            {/* Top Factors */}
            {score.topFactors && score.topFactors.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitleEmoji}>📈 Top Factors</Text>
                <View style={styles.factorsContainer}>
                  {score.topFactors.map((factor, i) => (
                    <View key={i} style={styles.factorBadge}>
                      <Text style={styles.factorText}>{factor}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Risk Factors */}
            {score.riskFactors && score.riskFactors.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitleEmoji}>⚠️ Risk Factors</Text>
                <View style={styles.factorsContainer}>
                  {score.riskFactors.map((risk, i) => (
                    <View key={i} style={[styles.factorBadge, styles.riskBadge]}>
                      <Text style={styles.riskText}>{risk}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Recommendations */}
            {score.recommendations && score.recommendations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitleEmoji}>💡 Recommendations</Text>
                {score.recommendations.map((rec, i) => (
                  <View key={i} style={styles.recRow}>
                    <Text style={styles.recNumber}>{i + 1}.</Text>
                    <Text style={styles.recText}>{rec}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Last Calculated */}
            {score.lastCalculatedAt && (
              <Text style={styles.lastCalculated}>
                Last calculated: {new Date(score.lastCalculatedAt).toLocaleString()}
              </Text>
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// 📊 AI SCORE DISTRIBUTION CARD (Dashboard Widget)
// ─────────────────────────────────────────────────────────────
export function AIScoreDistributionCard({
  distribution,
  onRecalculate,
  loading,
}: {
  distribution: { hot: number; warm: number; cold: number; low: number; total: number };
  onRecalculate: () => void;
  loading?: boolean;
}) {
  const tiers = [
    { key: 'hot' as const, label: '🔥 Hot', color: '#ef4444', count: distribution.hot },
    { key: 'warm' as const, label: '🟢 Warm', color: '#22c55e', count: distribution.warm },
    { key: 'cold' as const, label: '🟡 Cold', color: '#eab308', count: distribution.cold },
    { key: 'low' as const, label: '⚪ Low', color: '#94a3b8', count: distribution.low },
  ];

  return (
    <View style={styles.distributionCard}>
      <View style={styles.distributionHeader}>
        <View style={styles.distributionTitle}>
          <Text style={styles.distributionTitleText}>🤖 Lead Score Distribution</Text>
          <Text style={styles.distributionSubText}>{distribution.total} total leads scored</Text>
        </View>
        <TouchableOpacity style={styles.recalculateBtn} onPress={onRecalculate} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#818cf8" />
          ) : (
            <Text style={styles.recalculateBtnText}>🔄 Recalculate</Text>
          )}
        </TouchableOpacity>
      </View>

      {tiers.map(({ key, label, color, count }) => {
        const percentage = distribution.total > 0 ? (count / distribution.total) * 100 : 0;
        return (
          <View key={key} style={styles.distributionRow}>
            <View style={styles.distributionLabel}>
              <Text style={styles.distributionLabelText}>{label}</Text>
            </View>
            <View style={styles.distributionBar}>
              <View style={[styles.distributionBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
            </View>
            <Text style={[styles.distributionCount, { color }]}>
              {count} ({percentage.toFixed(0)}%)
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// 📱 STANDALONE AI SCORE CUSTOMIZATION SCREEN COMPONENT
// ─────────────────────────────────────────────────────────────
export function AIScoreCustomizationCard({
  config,
  onConfigChange,
  onSave,
  saving,
  saved,
}: {
  config: {
    budgetWeight: number;
    intentWeight: number;
    engagementWeight: number;
    productFitWeight: number;
    responseWeight: number;
    hotThresholdMin: number;
    warmThresholdMin: number;
    coldThresholdMin: number;
    showOnLeadsTable: boolean;
    showBreakdownDetail: boolean;
    autoRecalculate: boolean;
  };
  onConfigChange: (key: string, value: number | boolean) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  const totalWeight =
    config.budgetWeight +
    config.intentWeight +
    config.engagementWeight +
    config.productFitWeight +
    config.responseWeight;

  const weights = [
    { key: 'budgetWeight' as const, label: '💰 Budget', color: '#8b5cf6' },
    { key: 'intentWeight' as const, label: '🎯 Intent', color: '#ec4899' },
    { key: 'engagementWeight' as const, label: '💬 Engagement', color: '#3b82f6' },
    { key: 'productFitWeight' as const, label: '⚡ Product Fit', color: '#f59e0b' },
    { key: 'responseWeight' as const, label: '📈 Response', color: '#22c55e' },
  ];

  return (
    <ScrollView style={styles.customizationScroll} showsVerticalScrollIndicator={false}>
      {/* Weight Sliders */}
      <View style={styles.customizationSection}>
        <Text style={styles.sectionTitle}>⚖️ Score Factor Weights</Text>
        <Text style={styles.sectionSub}>Adjust how each factor contributes to AI score</Text>

        <View style={[styles.totalWeightBox, { borderColor: totalWeight === 100 ? '#22c55e' : '#eab308' }]}>
          <Text style={styles.totalWeightLabel}>Total Weight</Text>
          <Text style={{ color: totalWeight === 100 ? '#22c55e' : '#eab308', fontWeight: '700' }}>
            {totalWeight}% {totalWeight !== 100 && '(should equal 100%)'}
          </Text>
        </View>

        {weights.map(({ key, label, color }) => (
          <View key={key} style={styles.weightRow}>
            <View style={styles.weightHeader}>
              <Text style={[styles.weightLabel, { color }]}>{label}</Text>
              <Text style={[styles.weightValue, { color }]}>{config[key]}%</Text>
            </View>
            <View style={styles.weightSliderTrack}>
              <View style={[styles.weightSliderFill, { width: `${(config[key] / 50) * 100}%`, backgroundColor: color }]} />
            </View>
          </View>
        ))}
      </View>

      {/* Tier Thresholds */}
      <View style={styles.customizationSection}>
        <Text style={styles.sectionTitle}>🔥 Tier Thresholds</Text>
        <Text style={styles.sectionSub}>Define score ranges for each priority tier</Text>

        {[
          { key: 'hotThresholdMin' as const, label: '🔥 Hot', color: '#ef4444', min: 7, max: 10 },
          { key: 'warmThresholdMin' as const, label: '🟢 Warm', color: '#22c55e', min: 4, max: 9 },
          { key: 'coldThresholdMin' as const, label: '🟡 Cold', color: '#eab308', min: 1, max: 7 },
        ].map(({ key, label, color, min, max }) => (
          <View key={key} style={[styles.thresholdRow, { borderColor: `${color}40` }]}>
            <Text style={[styles.thresholdLabel, { color }]}>{label}</Text>
            <View style={styles.thresholdInput}>
              <Text style={styles.thresholdValue}>{config[key].toFixed(1)}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Display Settings */}
      <View style={styles.customizationSection}>
        <Text style={styles.sectionTitle}>👁️ Display Settings</Text>

        {[
          { key: 'showOnLeadsTable' as const, label: 'Show AI Scores on Leads Table', color: '#818cf8' },
          { key: 'showBreakdownDetail' as const, label: 'Show Score Breakdown on Tap', color: '#818cf8' },
          { key: 'autoRecalculate' as const, label: 'Auto-Recalculate Scores', color: '#818cf8' },
        ].map(({ key, label, color }) => (
          <View key={key} style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{label}</Text>
            <TouchableOpacity
              style={[styles.toggle, config[key] && { backgroundColor: '#4f46e5' }]}
              onPress={() => onConfigChange(key, !config[key])}
            >
              <View style={[styles.toggleThumb, config[key] && { transform: [{ translateX: 20 }] }]} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[
          styles.saveBtn,
          (saving || totalWeight !== 100) && styles.saveBtnDisabled,
          saved && styles.saveBtnSuccess,
        ]}
        onPress={onSave}
        disabled={saving || totalWeight !== 100}
      >
        <Text style={styles.saveBtnText}>
          {saved ? '✅ Saved!' : saving ? '⏳ Saving...' : '💾 Save Settings'}
        </Text>
      </TouchableOpacity>

      {totalWeight !== 100 && (
        <Text style={styles.warningText}>⚠️ Score weights must equal 100% to save</Text>
      )}
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────
// 🎲 MOCK DATA GENERATOR (for demo purposes)
// ─────────────────────────────────────────────────────────────
export function generateMockAIScore(score: number): AIScoreData {
  const tier: ScoreTier =
    score >= 9 ? 'HOT' : score >= 7 ? 'WARM' : score >= 4 ? 'COLD' : 'LOW';

  return {
    totalScore: score,
    tier,
    budgetScore: Math.min(10, Math.max(1, score + (Math.random() * 4 - 2))),
    intentScore: Math.min(10, Math.max(1, score + (Math.random() * 4 - 2))),
    engagementScore: Math.min(10, Math.max(1, score + (Math.random() * 4 - 2))),
    productFitScore: Math.min(10, Math.max(1, score + (Math.random() * 4 - 2))),
    responseScore: Math.min(10, Math.max(1, score + (Math.random() * 4 - 2))),
    analysisSummary:
      tier === 'HOT'
        ? 'High-priority lead showing strong signals. Immediate follow-up recommended.'
        : tier === 'WARM'
        ? 'Moderate interest and engagement. Focus on building momentum.'
        : tier === 'COLD'
        ? 'Lead needs more nurturing. Consider adjusting outreach strategy.'
        : 'Limited engagement. Focus on higher-priority prospects.',
    topFactors: tier !== 'LOW' ? ['High engagement with website', 'Attended demo', 'Quotation opened'] : [],
    riskFactors: tier === 'COLD' || tier === 'LOW' ? ['No response in 5 days', 'Low email open rate'] : [],
    recommendations: [
      'Schedule follow-up call within 24 hours',
      'Share relevant case studies',
    ],
    lastCalculatedAt: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────
// 📋 STYLES
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Compact Badge
  compactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  compactEmoji: { fontSize: 12 },
  compactScore: { fontSize: 12, fontWeight: '900', marginLeft: 2 },

  // Full Badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  badgeEmoji: { fontSize: 14 },
  badgeScore: { fontSize: 14, fontWeight: '900', marginLeft: 4 },
  badgeLabel: { fontSize: 10, fontWeight: '600', marginLeft: 2 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.9)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { width: '100%', maxWidth: 420, backgroundColor: '#0f172a', borderRadius: 20, borderWidth: 1, borderColor: '#1e293b', maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  modalHeaderLeft: { width: 48, height: 48, borderRadius: 12, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  modalEmoji: { fontSize: 20 },
  modalHeaderText: { flex: 1 },
  modalTitle: { fontSize: 16, fontWeight: '900', color: '#ffffff' },
  modalSubtitle: { fontSize: 12, fontWeight: '600' },
  closeBtn: { backgroundColor: '#1e293b', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { color: '#94a3b8', fontSize: 14, fontWeight: '900' },
  modalScroll: { padding: 16 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#94a3b8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionTitleEmoji: { fontSize: 12, fontWeight: '700', color: '#ffffff', marginBottom: 8 },

  // Score Breakdown
  scoreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  scoreLabel: { width: 85 },
  scoreLabelText: { fontSize: 11, fontWeight: '700' },
  scoreBar: { flex: 1, height: 6, backgroundColor: '#1e293b', borderRadius: 3, marginHorizontal: 8, overflow: 'hidden' },
  scoreBarFill: { height: '100%', borderRadius: 3 },
  scoreValue: { width: 28, fontSize: 11, fontWeight: '900', textAlign: 'right' },

  // Analysis
  analysisBox: { borderWidth: 1, borderRadius: 12, padding: 12 },
  analysisText: { fontSize: 12, color: '#e2e8f0', lineHeight: 18 },

  // Factors
  factorsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  factorBadge: { backgroundColor: 'rgba(52, 211, 153, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.3)' },
  factorText: { fontSize: 10, color: '#34d399', fontWeight: '600' },
  riskBadge: { backgroundColor: 'rgba(251, 191, 36, 0.15)', borderColor: 'rgba(251, 191, 36, 0.3)' },
  riskText: { fontSize: 10, color: '#fbbf24', fontWeight: '600' },

  // Recommendations
  recRow: { flexDirection: 'row', marginBottom: 6 },
  recNumber: { fontSize: 11, color: '#818cf8', fontWeight: '900', width: 20 },
  recText: { fontSize: 11, color: '#cbd5e1', flex: 1, lineHeight: 16 },

  // Last Calculated
  lastCalculated: { fontSize: 9, color: '#64748b', textAlign: 'center', marginTop: 8, marginBottom: 16 },

  // Distribution Card
  distributionCard: { backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 14 },
  distributionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  distributionTitle: {},
  distributionTitleText: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  distributionSubText: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  recalculateBtn: { backgroundColor: 'rgba(99, 102, 241, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.3)' },
  recalculateBtnText: { fontSize: 10, color: '#818cf8', fontWeight: '700' },
  distributionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  distributionLabel: { width: 60 },
  distributionLabelText: { fontSize: 11, fontWeight: '600' },
  distributionBar: { flex: 1, height: 6, backgroundColor: '#1e293b', borderRadius: 3, marginHorizontal: 8 },
  distributionBarFill: { height: '100%', borderRadius: 3 },
  distributionCount: { width: 60, fontSize: 10, fontWeight: '800', textAlign: 'right' },

  // Customization
  customizationScroll: { flex: 1, padding: 14 },
  customizationSection: { backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 14, marginBottom: 14 },
  sectionSub: { fontSize: 10, color: '#94a3b8', marginBottom: 12 },
  totalWeightBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#020617', padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 12 },
  totalWeightLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  weightRow: { marginBottom: 12 },
  weightHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  weightLabel: { fontSize: 12, fontWeight: '700' },
  weightValue: { fontSize: 12, fontWeight: '900' },
  weightSliderTrack: { height: 6, backgroundColor: '#1e293b', borderRadius: 3 },
  weightSliderFill: { height: '100%', borderRadius: 3 },
  thresholdRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  thresholdLabel: { fontSize: 12, fontWeight: '700' },
  thresholdInput: { backgroundColor: '#020617', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#1e293b' },
  thresholdValue: { fontSize: 12, color: '#ffffff', fontWeight: '700' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  toggleLabel: { fontSize: 12, color: '#ffffff', fontWeight: '600' },
  toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: '#334155', justifyContent: 'center', paddingHorizontal: 2 },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#ffffff' },
  saveBtn: { backgroundColor: '#4f46e5', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
  saveBtnDisabled: { backgroundColor: '#334155' },
  saveBtnSuccess: { backgroundColor: '#10b981' },
  saveBtnText: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  warningText: { fontSize: 11, color: '#fbbf24', textAlign: 'center', marginBottom: 20 },
});
