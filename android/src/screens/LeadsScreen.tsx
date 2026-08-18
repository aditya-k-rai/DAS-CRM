import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LeadsStackParamList } from '../../App';

type LeadsNavProp = StackNavigationProp<LeadsStackParamList, 'LeadsList'>;

const MOCK_LEADS = [
  { id: '1', name: 'Vikram Mehta', company: 'Acme Corp', email: 'vikram@acme.com', phone: '+91 98765 43210', status: 'IN NEGOTIATION', value: '$14,200', source: 'Google Sheets', priority: 'High' },
  { id: '2', name: 'Sunita Rao', company: 'TechCorp India', email: 'No Email Provided', phone: '+91 98123 45678', status: 'NEW LEAD', value: '$8,500', source: 'Excel Import', priority: 'Medium' },
  { id: '3', name: 'Rajesh Kumar', company: 'Starlight Media', email: 'rajesh@starlight.com', phone: '+91 97111 22233', status: 'QUALIFIED', value: '$22,000', source: 'Meta Ads', priority: 'High' },
  { id: '4', name: 'Amit Shah', company: 'Global Freight', email: 'No Email Provided', phone: '+91 96555 44433', status: 'CONTACTED', value: '$6,800', source: 'Google Ads', priority: 'Low' },
  { id: '5', name: 'Priya Sharma', company: 'LogiTech Solutions', email: 'priya@logitech.com', phone: '+91 95444 33322', status: 'WON', value: '$35,000', source: 'Direct Import', priority: 'High' },
];

import { useAuthStore } from '../store/authStore';
import { apiService, LeadItem, FALLBACK_LEADS } from '../services/apiService';

const FILTERS = ['ALL', 'NEW LEAD', 'QUALIFIED', 'IN NEGOTIATION', 'WON'];

export default function LeadsScreen() {
  const navigation = useNavigation<LeadsNavProp>();
  const { token } = useAuthStore();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [leadsList, setLeadsList] = useState<LeadItem[]>(FALLBACK_LEADS);

  React.useEffect(() => {
    let isMounted = true;
    apiService.getLeads(token).then(data => {
      if (isMounted && data) {
        setLeadsList(data);
      }
    });
    return () => { isMounted = false; };
  }, [token]);

  const filteredLeads = leadsList.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase()) || l.company.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === 'ALL' || l.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.headerTitle}>Leads Directory & Pipeline</Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search leads by name, company..."
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={{ flexGrow: 0, marginBottom: 14 }}
        >
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterPillText, activeFilter === f && styles.filterPillTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Lead List */}
        <FlatList
          data={filteredLeads}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('LeadDetail', { lead: item })}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.company}>{item.company}</Text>
                </View>
                <Text style={styles.value}>{item.value}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.phone}>📞 {item.phone}</Text>
                {item.email === 'No Email Provided' ? (
                  <View style={styles.noEmailBadge}>
                    <Text style={styles.noEmailText}>No Email Provided</Text>
                  </View>
                ) : (
                  <Text style={styles.email}>✉️ {item.email}</Text>
                )}
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.sourcePill}>
                  <Text style={styles.sourceText}>🌐 {item.source}</Text>
                </View>

                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>
            </TouchableOpacity>
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

  searchContainer: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, color: '#f8fafc', fontSize: 13, paddingVertical: 10 },

  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  filterPill: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  filterPillActive: { backgroundColor: 'rgba(99, 102, 241, 0.25)', borderColor: '#6366f1' },
  filterPillText: { fontSize: 10, color: '#94a3b8', fontWeight: '700' },
  filterPillTextActive: { color: '#818cf8' },

  card: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  name: { fontSize: 15, fontWeight: '800', color: '#ffffff' },
  company: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
  value: { fontSize: 15, fontWeight: '900', color: '#34d399' },

  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  phone: { fontSize: 11, color: '#cbd5e1' },
  email: { fontSize: 11, color: '#cbd5e1' },
  noEmailBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  noEmailText: { fontSize: 9, fontWeight: '700', color: '#fbbf24' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#1e293b' },
  sourcePill: {
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sourceText: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },
  statusBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: { color: '#818cf8', fontSize: 10, fontWeight: '800' },
});
