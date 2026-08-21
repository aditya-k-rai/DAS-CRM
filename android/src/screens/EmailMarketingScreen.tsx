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
}

interface EmailMarketingScreenProps {
  onClose?: () => void;
}

export const EmailMarketingScreen: React.FC<EmailMarketingScreenProps> = ({ onClose }) => {
  const [emailTo, setEmailTo] = useState('lead.rajesh@techcorp.com');
  const [emailSubject, setEmailSubject] = useState('DAS CRM Enterprise Suite 2026 Pitch & Demo');
  const [emailBody, setEmailBody] = useState(
    'Hi Rajesh,\n\nFollowing up on our call today. DAS CRM includes automated call recording, live GPS attendance tracking, and 2-way Google Sheets sync.\n\nBest regards,\nSales Operations Team'
  );
  const [emailCampaignsLog, setEmailCampaignsLog] = useState<EmailLogItem[]>([
    { to: 'rajesh@techcorp.com', subject: 'DAS CRM Enterprise Deck', time: '10:15 AM', status: 'DELIVERED' },
    { to: 'priya@logitech.com', subject: 'DAS CRM 18% GST Rate Card', time: 'Yesterday', status: 'OPENED' },
  ]);

  const handleDispatchEmail = () => {
    if (!emailTo || !emailSubject) {
      Alert.alert('Missing Info', 'Please enter recipient email and subject.');
      return;
    }
    Alert.alert(
      '📧 Email Campaign Dispatched',
      `Email campaign dispatched via AWS SES SMTP to ${emailTo}:\n\nSubject: ${emailSubject}`
    );
    setEmailCampaignsLog([{ to: emailTo, subject: emailSubject, time: 'Just Now', status: 'DISPATCHED' }, ...emailCampaignsLog]);
  };

  return (
    <View style={styles.container}>
      {/* Navigation Header */}
      <View style={styles.topHeader}>
        {onClose && (
          <TouchableOpacity style={styles.backBtn} onPress={onClose}>
            <Text style={styles.backBtnText}>← Back to Operations</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>📧 AWS SES Email Marketing</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.moduleCard}>
          <Text style={styles.moduleTitle}>📧 AWS SES Email Marketing Portal</Text>
          <Text style={styles.moduleSub}>Compose &amp; dispatch email campaigns to lead segments.</Text>

          {/* Template Quick Select */}
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
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

          <View style={{ gap: 10, marginTop: 10 }}>
            <TextInput style={styles.inputField} value={emailTo} onChangeText={setEmailTo} placeholder="Recipient Email" placeholderTextColor="#64748b" />
            <TextInput style={styles.inputField} value={emailSubject} onChangeText={setEmailSubject} placeholder="Email Subject" placeholderTextColor="#64748b" />
            <TextInput style={[styles.inputField, { height: 110, textAlignVertical: 'top' }]} value={emailBody} onChangeText={setEmailBody} multiline />
            <TouchableOpacity style={styles.dispatchBtn} onPress={handleDispatchEmail}>
              <Text style={{ color: '#090d16', fontWeight: '900', fontSize: 12 }}>🚀 Dispatch AWS SES Email Campaign →</Text>
            </TouchableOpacity>
          </View>

          {/* Dispatched History */}
          <View style={{ marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#1e293b' }}>
            <Text style={{ fontSize: 11, fontWeight: '900', color: '#ffffff', marginBottom: 6 }}>📬 AWS SES Dispatch History</Text>
            {emailCampaignsLog.map((log, idx) => (
              <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#020617' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, color: '#ffffff', fontWeight: '700' }}>To: {log.to}</Text>
                  <Text style={{ fontSize: 9, color: '#94a3b8' }}>{log.subject}</Text>
                </View>
                <Text style={{ fontSize: 9, color: '#34d399', fontWeight: '800' }}>{log.status} ({log.time})</Text>
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
  moduleCard: { backgroundColor: '#0f172a', borderRadius: 18, borderWidth: 1, borderColor: '#1e293b', padding: 14 },
  moduleTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  moduleSub: { fontSize: 10, color: '#94a3b8', marginTop: 2, lineHeight: 14 },
  tplChip: { backgroundColor: 'rgba(52,211,153,0.15)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.4)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tplChipText: { fontSize: 9, fontWeight: '800', color: '#34d399' },
  inputField: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, color: '#ffffff' },
  dispatchBtn: { backgroundColor: '#34d399', paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
});
