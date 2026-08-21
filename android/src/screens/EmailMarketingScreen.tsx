import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';

export interface EmailLogItem {
  to: string;
  subject: string;
  time: string;
  status: string;
  openRate?: string;
}

interface EmailMarketingScreenProps {
  onClose?: () => void;
}

export const EmailMarketingScreen: React.FC<EmailMarketingScreenProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'COMPOSE' | 'PREVIEW'>('COMPOSE');
  const [selectedSegment, setSelectedSegment] = useState<'ALL_LEADS' | 'HOT_LEADS' | 'CLOSED_LOST' | 'ENTERPRISE'>('HOT_LEADS');

  const [emailTo, setEmailTo] = useState('lead.rajesh@techcorp.com');
  const [emailSubject, setEmailSubject] = useState('DAS CRM Enterprise Suite 2026 Pitch & Demo');
  const [emailBody, setEmailBody] = useState(
    'Hi Rajesh,\n\nFollowing up on our call today. DAS CRM includes automated call recording, live GPS attendance tracking, and 2-way Google Sheets sync.\n\nBest regards,\nSales Operations Team'
  );
  const [emailCampaignsLog, setEmailCampaignsLog] = useState<EmailLogItem[]>([
    { to: 'rajesh@techcorp.com', subject: 'DAS CRM Enterprise Deck', time: '10:15 AM', status: 'DELIVERED', openRate: 'Open Rate: 48%' },
    { to: 'priya@logitech.com', subject: 'DAS CRM 18% GST Rate Card', time: 'Yesterday', status: 'OPENED', openRate: 'Clicked 3x' },
  ]);

  const handleDispatchEmail = () => {
    if (!emailTo || !emailSubject) {
      Alert.alert('Missing Info', 'Please enter recipient email and subject.');
      return;
    }
    Alert.alert(
      '📧 Email Campaign Dispatched',
      `Email campaign dispatched via AWS SES SMTP to segment: ${selectedSegment}:\n\nSubject: ${emailSubject}`
    );
    setEmailCampaignsLog([{ to: emailTo, subject: emailSubject, time: 'Just Now', status: 'DISPATCHED', openRate: 'Pending' }, ...emailCampaignsLog]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.topHeader}>
        {onClose && (
          <TouchableOpacity style={styles.backBtn} onPress={onClose}>
            <Text style={styles.backBtnText}>← Back to Operations</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>📧 AWS SES Email Marketing</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Campaign Metrics Overview */}
        <View style={styles.summaryCard}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#34d399' }}>98.4%</Text>
            <Text style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>AWS SES Delivery Rate</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#1e293b' }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#38bdf8' }}>42.8%</Text>
            <Text style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>Avg Open Rate</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#1e293b' }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#c084fc' }}>18.5%</Text>
            <Text style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>Click-Through Rate</Text>
          </View>
        </View>

        <View style={[styles.moduleCard, { marginTop: 12 }]}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.moduleTitle}>📧 AWS SES Email Marketing Portal</Text>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <TouchableOpacity
                style={[styles.tabChip, activeTab === 'COMPOSE' && styles.tabChipActive]}
                onPress={() => setActiveTab('COMPOSE')}
              >
                <Text style={[styles.tabChipText, activeTab === 'COMPOSE' && styles.tabChipTextActive]}>Compose</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabChip, activeTab === 'PREVIEW' && styles.tabChipActive]}
                onPress={() => setActiveTab('PREVIEW')}
              >
                <Text style={[styles.tabChipText, activeTab === 'PREVIEW' && styles.tabChipTextActive]}>Preview</Text>
              </TouchableOpacity>
            </View>
          </View>

          {activeTab === 'COMPOSE' ? (
            <View style={{ gap: 10, marginTop: 8 }}>
              {/* Audience Segment Selector */}
              <View>
                <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '700', marginBottom: 4 }}>Target Audience Segment:</Text>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {(['ALL_LEADS', 'HOT_LEADS', 'CLOSED_LOST', 'ENTERPRISE'] as const).map((seg) => (
                    <TouchableOpacity
                      key={seg}
                      style={[{ flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b' }, selectedSegment === seg && { backgroundColor: '#34d399', borderColor: '#34d399' }]}
                      onPress={() => setSelectedSegment(seg)}
                    >
                      <Text style={{ fontSize: 7, fontWeight: '900', color: selectedSegment === seg ? '#090d16' : '#94a3b8' }}>{seg}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Template Quick Select */}
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {[
                  { label: 'Enterprise Pitch', subj: 'DAS CRM Enterprise Suite Proposal & Pricing', body: 'Hi,\n\nPlease find attached our enterprise proposal for DAS CRM.' },
                  { label: 'GST Rate Card', subj: 'DAS CRM 18% GST Tax Breakdown & Specs', body: 'Hi,\n\nHere is our 18% GST tax rate card and product specifications.' },
                ].map((tpl, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.tplChip}
                    onPress={() => {
                      setEmailSubject(tpl.subj);
                      setEmailBody(tpl.body);
                    }}
                  >
                    <Text style={styles.tplChipText}>+ {tpl.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput style={styles.inputField} value={emailTo} onChangeText={setEmailTo} placeholder="Recipient Email" placeholderTextColor="#64748b" />
              <TextInput style={styles.inputField} value={emailSubject} onChangeText={setEmailSubject} placeholder="Email Subject" placeholderTextColor="#64748b" />
              <TextInput style={[styles.inputField, { height: 110, textAlignVertical: 'top' }]} value={emailBody} onChangeText={setEmailBody} multiline />

              <TouchableOpacity style={styles.dispatchBtn} onPress={handleDispatchEmail}>
                <Text style={{ color: '#090d16', fontWeight: '900', fontSize: 12 }}>🚀 Dispatch AWS SES Email Campaign →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* HTML Preview */
            <View style={{ backgroundColor: '#020617', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#34d399', marginTop: 8 }}>
              <Text style={{ fontSize: 10, fontWeight: '900', color: '#38bdf8', marginBottom: 4 }}>Subject: {emailSubject}</Text>
              <Text style={{ fontSize: 9, color: '#94a3b8', marginBottom: 8 }}>To: {emailTo} (Segment: {selectedSegment})</Text>
              <View style={{ borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 8 }}>
                <Text style={{ fontSize: 11, color: '#ffffff', lineHeight: 16 }}>{emailBody}</Text>
              </View>
            </View>
          )}

          {/* Dispatched History */}
          <View style={{ marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#1e293b' }}>
            <Text style={{ fontSize: 11, fontWeight: '900', color: '#ffffff', marginBottom: 6 }}>📬 AWS SES Dispatch History</Text>
            {emailCampaignsLog.map((log, idx) => (
              <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#020617' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, color: '#ffffff', fontWeight: '700' }}>To: {log.to}</Text>
                  <Text style={{ fontSize: 9, color: '#94a3b8' }}>{log.subject}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 9, color: '#34d399', fontWeight: '800' }}>{log.status} ({log.time})</Text>
                  <Text style={{ fontSize: 8, color: '#38bdf8' }}>{log.openRate}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  topHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  backBtn: { backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  backBtnText: { color: '#38bdf8', fontWeight: '900', fontSize: 11 },
  headerTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  scrollContent: { padding: 14, paddingBottom: 32 },
  summaryCard: { backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 12, flexDirection: 'row' },
  moduleCard: { backgroundColor: '#0f172a', borderRadius: 18, borderWidth: 1, borderColor: '#1e293b', padding: 14 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  moduleTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  tabChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b' },
  tabChipActive: { backgroundColor: '#34d399', borderColor: '#34d399' },
  tabChipText: { fontSize: 9, fontWeight: '800', color: '#94a3b8' },
  tabChipTextActive: { color: '#090d16' },
  tplChip: { backgroundColor: 'rgba(52,211,153,0.15)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.4)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tplChipText: { fontSize: 9, fontWeight: '800', color: '#34d399' },
  inputField: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, color: '#ffffff' },
  dispatchBtn: { backgroundColor: '#34d399', paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
});
