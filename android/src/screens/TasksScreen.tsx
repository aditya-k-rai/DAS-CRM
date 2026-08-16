import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const MOCK_TASKS = [
  { id: '1', title: 'Call John from Acme Corp', due: 'Today, 2:00 PM', status: 'Pending' },
  { id: '2', title: 'Send quotation to Starlight Media', due: 'Tomorrow, 10:00 AM', status: 'In Progress' },
  { id: '3', title: 'Follow up on contract renewal', due: 'Aug 20, 2026', status: 'Pending' },
];

export default function TasksScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Tasks</Text>
      <FlatList
        data={MOCK_TASKS}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <View style={styles.row}>
              <Text style={styles.due}>Due: {item.due}</Text>
              <Text style={styles.status}>{item.status}</Text>
            </View>
          </View>
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
  title: { fontSize: 15, fontWeight: '600', color: '#f3f4f6', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  due: { fontSize: 12, color: '#9ca3af' },
  status: { fontSize: 12, color: '#818cf8', fontWeight: '500' },
});
