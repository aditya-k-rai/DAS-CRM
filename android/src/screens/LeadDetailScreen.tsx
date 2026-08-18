/**
 * LeadDetailScreen.tsx — DAS CRM Android
 * Uses React Navigation route params and goBack() for back navigation.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LeadsStackParamList } from '../../App';

type LeadDetailRouteProp = RouteProp<LeadsStackParamList, 'LeadDetail'>;

// Keep onBack prop for backward-compat with App.tsx inline usage
interface LeadDetailScreenProps {
  lead?: any;
  onBack?: () => void;
}

export default function LeadDetailScreen({ lead: propLead, onBack }: LeadDetailScreenProps) {
  const navigation = useNavigation();

  // Prefer route params if available (from Leads navigator), fall back to prop
  let lead = propLead;
  try {
    const route = useRoute<LeadDetailRouteProp>();
    if (route?.params?.lead) lead = route.params.lead;
  } catch {
    // If not inside a LeadsStack navigator, use prop
  }

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  const statusColor =
    lead?.status === 'WON'
      ? '#34d399'
      : lead?.status === 'IN NEGOTIATION'
      ? '#818cf8'
      : lead?.status === 'QUALIFIED'
      ? '#38bdf8'
      : lead?.status === 'CONTACTED'
      ? '#fbbf24'
      : '#94a3b8';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
          <Text style={styles.backText}>← Back to Leads</Text>
        </TouchableOpacity>

        {/* Lead Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={[styles.avatarCircle, { backgroundColor: statusColor + '25' }]}>
              <Text style={[styles.avatarText, { color: statusColor }]}>
                {(lead?.name || 'L').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{lead?.name || 'Lead Details'}</Text>
              <Text style={styles.company}>{lead?.company || '—'}</Text>
            </View>
            <View style={[styles.valueBadge]}>
              <Text style={styles.valueText}>{lead?.value || '—'}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor + '50' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{lead?.status || 'UNKNOWN'}</Text>
          </View>
        </View>

        {/* Contact Details */}
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.detailCard}>
          {[
            ['📞 Phone', lead?.phone || 'N/A'],
            ['✉️ Email', lead?.email || 'No Email Provided'],
            ['🏢 Company', lead?.company || 'N/A'],
            ['🌐 Source', lead?.source || 'N/A'],
          ].map(([label, value], i) => (
            <View
              key={label}
              style={[styles.row, i < 3 && { borderBottomWidth: 1, borderBottomColor: '#1e293b' }]}
            >
              <Text style={styles.rowLabel}>{label}</Text>
              <Text
                style={[
                  styles.rowValue,
                  value === 'No Email Provided' && { color: '#fbbf24' },
                ]}
              >
                {value}
              </Text>
            </View>
          ))}
        </View>

        {/* Lead Details */}
        <Text style={styles.sectionTitle}>Lead Details</Text>
        <View style={styles.detailCard}>
          {[
            ['💰 Deal Value', lead?.value || 'N/A'],
            ['🚦 Status', lead?.status || 'N/A'],
            ['⚡ Priority', lead?.priority || 'N/A'],
          ].map(([label, value], i) => (
            <View
              key={label}
              style={[styles.row, i < 2 && { borderBottomWidth: 1, borderBottomColor: '#1e293b' }]}
            >
              <Text style={styles.rowLabel}>{label}</Text>
              <Text style={[styles.rowValue, { color: statusColor }]}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.callBtn} activeOpacity={0.8}>
            <Text style={styles.callBtnText}>📞 Call Now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.whatsappBtn} activeOpacity={0.8}>
            <Text style={styles.whatsappBtnText}>💬 WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060810' },
  content: { padding: 16 },

  backButton: { marginBottom: 14 },
  backText: { color: '#818cf8', fontSize: 14, fontWeight: '700' },

  headerCard: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '900' },
  title: { fontSize: 18, fontWeight: '800', color: '#ffffff' },
  company: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  valueBadge: {
    backgroundColor: 'rgba(52,211,153,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  valueText: { fontSize: 14, fontWeight: '900', color: '#34d399' },
  statusBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: 10, fontWeight: '800' },

  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#94a3b8', marginBottom: 8, letterSpacing: 0.5 },

  detailCard: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  rowLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  rowValue: { fontSize: 12, color: '#f8fafc', fontWeight: '700' },

  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  callBtn: {
    flex: 1,
    backgroundColor: 'rgba(99,102,241,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.4)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  callBtnText: { color: '#818cf8', fontSize: 13, fontWeight: '700' },
  whatsappBtn: {
    flex: 1,
    backgroundColor: 'rgba(16,185,129,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.4)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  whatsappBtnText: { color: '#34d399', fontSize: 13, fontWeight: '700' },
});
