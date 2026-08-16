import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

interface LeadDetailScreenProps {
  lead: any;
  onBack: () => void;
}

export default function LeadDetailScreen({ lead, onBack }: LeadDetailScreenProps) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>← Back to Leads</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{lead?.name || 'Lead Details'}</Text>

      <View style={styles.detailCard}>
        <View style={styles.row}>
          <Text style={styles.label}>Contact Person:</Text>
          <Text style={styles.value}>{lead?.contact || 'N/A'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Estimated Value:</Text>
          <Text style={styles.value}>{lead?.value || 'N/A'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Status:</Text>
          <Text style={styles.value}>{lead?.status || 'N/A'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Priority Level:</Text>
          <Text style={styles.value}>{lead?.priority || 'N/A'}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060810' },
  content: { padding: 20 },
  backButton: { marginBottom: 16 },
  backText: { color: '#818cf8', fontSize: 15, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '700', color: '#f3f4f6', marginBottom: 20 },
  detailCard: {
    backgroundColor: '#0f1117',
    borderWidth: 1,
    borderColor: '#1e2333',
    borderRadius: 14,
    padding: 18,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e2333' },
  label: { fontSize: 14, color: '#9ca3af' },
  value: { fontSize: 14, color: '#f3f4f6', fontWeight: '600' },
});
