import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';

const MOCK_TASKS = [
  { id: '1', title: 'Follow up on Acme Corp Quote', lead: 'Vikram Mehta', dueDate: 'Today, 4:00 PM', priority: 'HIGH', status: 'PENDING' },
  { id: '2', title: 'Schedule Product Demo Call', lead: 'Sunita Rao', dueDate: 'Tomorrow, 11:30 AM', priority: 'URGENT', status: 'PENDING' },
  { id: '3', title: 'Send Contract Proposal PDF', lead: 'Rajesh Kumar', dueDate: 'Yesterday', priority: 'MEDIUM', status: 'OVERDUE' },
  { id: '4', title: 'Review WhatsApp Lead Ingest Audit', lead: 'Priya Sharma', dueDate: '15 Aug 2026', priority: 'LOW', status: 'COMPLETED' },
];

export default function TasksScreen() {
  const [activeTab, setActiveTab] = useState<'PENDING' | 'OVERDUE' | 'COMPLETED'>('PENDING');

  const filteredTasks = MOCK_TASKS.filter(t => t.status === activeTab);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.headerTitle}>Task Operations & Reminders</Text>

        {/* Tab Selector */}
        <View style={styles.tabRow}>
          {(['PENDING', 'OVERDUE', 'COMPLETED'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab} ({MOCK_TASKS.filter(t => t.status === tab).length})
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tasks List */}
        <FlatList
          data={filteredTasks}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.taskTitle}>{item.title}</Text>
                <View style={[
                  styles.priorityBadge,
                  item.priority === 'URGENT' ? styles.priorityUrgent :
                  item.priority === 'HIGH' ? styles.priorityHigh : styles.priorityMedium
                ]}>
                  <Text style={styles.priorityText}>{item.priority}</Text>
                </View>
              </View>

              <Text style={styles.leadText}>👤 Lead: {item.lead}</Text>

              <View style={styles.cardFooter}>
                <Text style={[styles.dueText, item.status === 'OVERDUE' && styles.overdueText]}>
                  ⏰ Due: {item.dueDate}
                </Text>
                <TouchableOpacity style={styles.completeButton}>
                  <Text style={styles.completeButtonText}>
                    {item.status === 'COMPLETED' ? '✓ Done' : 'Mark Complete'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060810' },
  content: { flex: 1, padding: 16 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#ffffff', marginBottom: 12 },

  tabRow: { flexDirection: 'row', backgroundColor: '#0f172a', borderRadius: 12, padding: 4, marginBottom: 14, borderWidth: 1, borderColor: '#1e293b' },
  tabButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabButtonActive: { backgroundColor: 'rgba(99, 102, 241, 0.25)' },
  tabText: { fontSize: 11, color: '#94a3b8', fontWeight: '700' },
  tabTextActive: { color: '#a5b4fc' },

  card: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', borderRadius: 16, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  taskTitle: { fontSize: 14, fontWeight: '800', color: '#ffffff', flex: 1, marginRight: 8 },
  
  priorityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  priorityUrgent: { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' },
  priorityHigh: { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)' },
  priorityMedium: { backgroundColor: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.3)' },
  priorityText: { fontSize: 9, fontWeight: '800', color: '#f8fafc' },

  leadText: { fontSize: 12, color: '#94a3b8', marginBottom: 10 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#1e293b' },
  dueText: { fontSize: 11, color: '#cbd5e1' },
  overdueText: { color: '#fca5a5', fontWeight: '700' },

  completeButton: { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  completeButtonText: { color: '#34d399', fontSize: 10, fontWeight: '800' },
});
