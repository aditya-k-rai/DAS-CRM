import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

interface LeadsScreenProps {
  onSelectLead: (lead: any) => void;
}

const MOCK_LEADS = [
  { id: '1', name: 'Acme Corp', contact: 'John Doe', status: 'In Negotiation', value: '$12,000', priority: 'High' },
  { id: '2', name: 'Starlight Media', contact: 'Jane Smith', status: 'New Lead', value: '$8,500', priority: 'Medium' },
  { id: '3', name: 'Apex Solutions', contact: 'Robert Brown', status: 'Qualified', value: '$24,000', priority: 'High' },
  { id: '4', name: 'Nexus Tech', contact: 'Alice Davis', status: 'Contacted', value: '$5,200', priority: 'Low' },
];

export default function LeadsScreen({ onSelectLead }: LeadsScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Leads Pipeline</Text>

      <FlatList
        data={MOCK_LEADS}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => onSelectLead(item)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.value}>{item.value}</Text>
            </View>
            <Text style={styles.contact}>Contact: {item.contact}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
              <Text style={styles.priority}>Priority: {item.priority}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060810', padding: 20 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#f3f4f6', marginBottom: 16 },
  card: {
    backgroundColor: '#0f1117',
    borderWidth: 1,
    borderColor: '#1e2333',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  name: { fontSize: 16, fontWeight: '600', color: '#f3f4f6' },
  value: { fontSize: 16, fontWeight: '700', color: '#10b981' },
  contact: { fontSize: 13, color: '#9ca3af', marginBottom: 10 },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { backgroundColor: 'rgba(79,70,229,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#818cf8', fontSize: 12, fontWeight: '600' },
  priority: { color: '#6b7280', fontSize: 12 },
});
