import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';

interface ProfileScreenProps {
  onLogout?: () => void;
}

export default function ProfileScreen({ onLogout }: ProfileScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.headerTitle}>User & Workspace Profile</Text>

        {/* User Card */}
        <View style={styles.card}>
          <View style={styles.userHeader}>
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarText}>VM</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>Vikram Mehta</Text>
              <Text style={styles.userEmail}>vikram.admin@acme.com</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>ROLE: ADMIN</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Workspace Card */}
        <Text style={styles.sectionTitle}>Company Workspace Info</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Company Name</Text>
            <Text style={styles.infoValue}>Acme Sales Solutions</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Company Registration Key</Text>
            <Text style={styles.monoValue}>ACME-KX-7421</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Subscription Tier</Text>
            <Text style={styles.activeValue}>PRO PLAN (20 Seats)</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>2-Way Google Sheets Sync</Text>
            <Text style={styles.activeValue}>Connected (Realtime)</Text>
          </View>
        </View>

        {/* Security & System Info */}
        <Text style={styles.sectionTitle}>Security & Mobile App</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App Version</Text>
            <Text style={styles.infoValue}>DAS CRM v1.0.0 (Release)</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>2FA Authentication</Text>
            <Text style={styles.activeValue}>Enabled (Gmail Verified)</Text>
          </View>
        </View>

        {/* Logout CTA */}
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout} activeOpacity={0.8}>
          <Text style={styles.logoutButtonText}>🚪 Sign Out of Workspace</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060810' },
  content: { padding: 16 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#ffffff', marginBottom: 14 },

  card: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 16 },
  userHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarBadge: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '900', color: '#ffffff' },
  userName: { fontSize: 16, fontWeight: '800', color: '#ffffff' },
  userEmail: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
  roleBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(99, 102, 241, 0.2)', borderWidth: 1, borderColor: '#6366f1', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  roleBadgeText: { fontSize: 9, fontWeight: '800', color: '#818cf8' },

  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#94a3b8', marginBottom: 8, letterSpacing: 0.5 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  infoLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  infoValue: { fontSize: 12, color: '#ffffff', fontWeight: '700' },
  monoValue: { fontSize: 12, color: '#c084fc', fontWeight: '800', fontFamily: 'monospace' },
  activeValue: { fontSize: 12, color: '#34d399', fontWeight: '700' },

  logoutButton: { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.4)', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  logoutButtonText: { color: '#fca5a5', fontSize: 13, fontWeight: '800' },
});
