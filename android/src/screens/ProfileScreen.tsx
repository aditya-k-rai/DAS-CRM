import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>User Profile</Text>

      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>AD</Text>
        </View>
        <Text style={styles.userName}>Aditya K Rai</Text>
        <Text style={styles.userRole}>Senior Sales Representative</Text>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.val}>aditya@dascrm.com</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Organization</Text>
          <Text style={styles.val}>DAS Global</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>App Version</Text>
          <Text style={styles.val}>v1.0.0 (Native)</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060810' },
  content: { padding: 20 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#f3f4f6', marginBottom: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 24, fontWeight: '700', color: '#ffffff' },
  userName: { fontSize: 18, fontWeight: '700', color: '#f3f4f6', marginBottom: 4 },
  userRole: { fontSize: 13, color: '#9ca3af' },
  infoCard: {
    backgroundColor: '#0f1117',
    borderWidth: 1,
    borderColor: '#1e2333',
    borderRadius: 14,
    padding: 16,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e2333' },
  label: { fontSize: 13, color: '#9ca3af' },
  val: { fontSize: 13, color: '#f3f4f6', fontWeight: '500' },
});
