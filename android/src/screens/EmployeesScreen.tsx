/**
 * EmployeesScreen.tsx — DAS CRM Android
 * Employee Hierarchy & Admin Authority Re-assignment Editor.
 * Accessible to ADMIN, HR, and MANAGER roles.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore, UserRole, normalizeRoleStr } from '../store/authStore';

interface EmployeeItem {
  id: string;
  name: string;
  email: string;
  role: 'MANAGER' | 'TEAM_LEADER' | 'SALES_EXEC';
  assignedTo: string; // e.g. "Amit Shah (Manager)" or "Priya Sharma (TL)"
  callsMade: number;
  leadsHandled: number;
  revenue: string;
  status: 'ONLINE' | 'IN_CALL' | 'OFFLINE';
}

export default function EmployeesScreen() {
  const { currentUser } = useAuthStore();
  const role: UserRole = normalizeRoleStr(currentUser.role);
  const isAdmin = role === 'ADMIN';

  const [employees, setEmployees] = useState<EmployeeItem[]>([
    { id: 'e1', name: 'Amit Shah', email: 'amit@acme.com', role: 'MANAGER', assignedTo: 'Vikram Singh (Admin)', callsMade: 142, leadsHandled: 85, revenue: '$64,000', status: 'ONLINE' },
    { id: 'e2', name: 'Neha Joshi', email: 'neha@acme.com', role: 'MANAGER', assignedTo: 'Vikram Singh (Admin)', callsMade: 118, leadsHandled: 72, revenue: '$48,500', status: 'ONLINE' },
    { id: 'e3', name: 'Priya Sharma', email: 'priya@acme.com', role: 'TEAM_LEADER', assignedTo: 'Amit Shah (Manager)', callsMade: 184, leadsHandled: 42, revenue: '$38,500', status: 'IN_CALL' },
    { id: 'e4', name: 'Karan Verma', email: 'karan@acme.com', role: 'TEAM_LEADER', assignedTo: 'Neha Joshi (Manager)', callsMade: 156, leadsHandled: 38, revenue: '$32,000', status: 'ONLINE' },
    { id: 'e5', name: 'Rajesh Kumar', email: 'rajesh@acme.com', role: 'SALES_EXEC', assignedTo: 'Priya Sharma (TL)', callsMade: 84, leadsHandled: 31, revenue: '$22,000', status: 'IN_CALL' },
    { id: 'e6', name: 'Ananya Rep', email: 'ananya@acme.com', role: 'SALES_EXEC', assignedTo: 'Priya Sharma (TL)', callsMade: 65, leadsHandled: 24, revenue: '$18,500', status: 'ONLINE' },
  ]);

  // Authority Editor Modal State
  const [selectedEmp, setSelectedEmp] = useState<EmployeeItem | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [newSuperior, setNewSuperior] = useState('');

  const MANAGERS_LIST = ['Amit Shah (Manager)', 'Neha Joshi (Manager)', 'Vikram Singh (Admin)'];
  const TLS_LIST = ['Priya Sharma (TL)', 'Karan Verma (TL)'];

  const openAuthorityEditor = (emp: EmployeeItem) => {
    if (!isAdmin) {
      Alert.alert('Authority Guard', 'Only Tenant Administrators can re-assign employee authority.');
      return;
    }
    setSelectedEmp(emp);
    setNewSuperior(emp.assignedTo);
    setEditModalOpen(true);
  };

  const handleSaveAuthority = () => {
    if (!selectedEmp) return;
    setEmployees(prev => prev.map(e => e.id === selectedEmp.id ? { ...e, assignedTo: newSuperior } : e));
    setEditModalOpen(false);
    Alert.alert('Authority Updated', `${selectedEmp.name}'s supervisor updated to: ${newSuperior}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── HEADER ────────────────────────────────────────────────────────── */}
        <View style={styles.headerBox}>
          <Text style={styles.headerTitle}>Organization Hierarchy &amp; Employee Telemetry</Text>
          <Text style={styles.headerSubtitle}>
            {isAdmin ? '👑 Admin Authority Control Active — Tap any employee to re-assign supervisor.' : '👁️ Read-Only Employee Telemetry & Supervisor Directory.'}
          </Text>
        </View>

        {/* ── SUMMARY STATS ─────────────────────────────────────────────────── */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderColor: 'rgba(99,102,241,0.3)' }]}>
            <Text style={styles.statVal}>6 Staff</Text>
            <Text style={styles.statLbl}>Total Audited Staff</Text>
          </View>
          <View style={[styles.statCard, { borderColor: 'rgba(16,185,129,0.3)' }]}>
            <Text style={[styles.statVal, { color: '#34d399' }]}>849 Calls</Text>
            <Text style={styles.statLbl}>Calls Logged Today</Text>
          </View>
          <View style={[styles.statCard, { borderColor: 'rgba(56,189,248,0.3)' }]}>
            <Text style={[styles.statVal, { color: '#38bdf8' }]}>292 Leads</Text>
            <Text style={styles.statLbl}>Leads Managed</Text>
          </View>
        </View>

        {/* ── EMPLOYEES DIRECTORY & AUTHORITY HIERARCHY ─────────────────────── */}
        <Text style={styles.sectionTitle}>Employee Authority Directory</Text>

        <View style={styles.cardBox}>
          {employees.map((emp, idx) => {
            const roleBadgeBg = emp.role === 'MANAGER' ? 'rgba(192,132,252,0.15)' : emp.role === 'TEAM_LEADER' ? 'rgba(251,191,36,0.15)' : 'rgba(52,211,153,0.15)';
            const roleBadgeColor = emp.role === 'MANAGER' ? '#c084fc' : emp.role === 'TEAM_LEADER' ? '#fbbf24' : '#34d399';

            return (
              <TouchableOpacity
                key={emp.id}
                style={[styles.empRow, idx < employees.length - 1 && styles.borderBottom]}
                onPress={() => openAuthorityEditor(emp)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <Text style={styles.empName}>{emp.name}</Text>
                    <View style={[styles.roleTag, { backgroundColor: roleBadgeBg }]}>
                      <Text style={[styles.roleTagText, { color: roleBadgeColor }]}>{emp.role.replace('_', ' ')}</Text>
                    </View>
                  </View>
                  <Text style={styles.empSub}>{emp.email}</Text>
                  <Text style={styles.supervisorText}>👤 Supervisor: <Text style={{ color: '#818cf8', fontWeight: '700' }}>{emp.assignedTo}</Text></Text>
                  <Text style={styles.telemetryText}>📞 {emp.callsMade} Calls • 🎯 {emp.leadsHandled} Leads • 💰 {emp.revenue}</Text>
                </View>

                {isAdmin && (
                  <View style={styles.editBtn}>
                    <Text style={styles.editBtnText}>✏️ Edit Authority</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>

      {/* ── ADMIN AUTHORITY RE-ASSIGNMENT MODAL ──────────────────────────────── */}
      <Modal visible={editModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>✏️ Edit Employee Authority &amp; Supervisor</Text>
            <Text style={styles.modalSub}>Re-assign <Text style={{ color: '#ffffff', fontWeight: '800' }}>{selectedEmp?.name}</Text> ({selectedEmp?.role}) under a new Manager or Team Leader.</Text>

            <Text style={styles.label}>Select Supervisor / Manager *</Text>
            {(selectedEmp?.role === 'SALES_EXEC' ? [...MANAGERS_LIST, ...TLS_LIST] : MANAGERS_LIST).map(sup => (
              <TouchableOpacity
                key={sup}
                style={[styles.selectOption, newSuperior === sup && styles.selectOptionActive]}
                onPress={() => setNewSuperior(sup)}
              >
                <Text style={[styles.selectOptionText, newSuperior === sup && { color: '#818cf8', fontWeight: '800' }]}>
                  {newSuperior === sup ? '✓ ' : ''}{sup}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#1e293b' }]} onPress={() => setEditModalOpen(false)}>
                <Text style={{ color: '#94a3b8', fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#4f46e5' }]} onPress={handleSaveAuthority}>
                <Text style={{ color: '#ffffff', fontWeight: '800' }}>Save Authority ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060810' },
  content: { padding: 16, alignItems: 'center' },

  headerBox: { width: '100%', maxWidth: 600, marginBottom: 14 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#ffffff', marginBottom: 2 },
  headerSubtitle: { fontSize: 11, color: '#94a3b8' },

  statsGrid: { width: '100%', maxWidth: 600, flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', borderRadius: 14, padding: 10, alignItems: 'center' },
  statVal: { fontSize: 15, fontWeight: '800', color: '#818cf8' },
  statLbl: { fontSize: 9, color: '#94a3b8', textAlign: 'center', marginTop: 2 },

  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#f8fafc', marginBottom: 8, width: '100%', maxWidth: 600 },

  cardBox: { width: '100%', maxWidth: 600, backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 12, marginBottom: 16 },

  empRow: { paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  empName: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  empSub: { fontSize: 10, color: '#64748b' },
  supervisorText: { fontSize: 11, color: '#94a3b8', marginTop: 3 },
  telemetryText: { fontSize: 10, color: '#a5b4fc', marginTop: 3, fontWeight: '600' },

  roleTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  roleTagText: { fontSize: 8, fontWeight: '800' },

  editBtn: { backgroundColor: 'rgba(99,102,241,0.15)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  editBtnText: { fontSize: 10, fontWeight: '800', color: '#818cf8' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 480, backgroundColor: '#0f172a', borderRadius: 20, borderWidth: 1, borderColor: '#1e293b', padding: 18 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#ffffff', marginBottom: 4 },
  modalSub: { fontSize: 12, color: '#94a3b8', marginBottom: 14 },
  label: { fontSize: 11, color: '#94a3b8', fontWeight: '700', marginBottom: 8 },

  selectOption: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', padding: 10, borderRadius: 10, marginBottom: 6 },
  selectOptionActive: { backgroundColor: 'rgba(99,102,241,0.15)', borderColor: '#6366f1' },
  selectOptionText: { fontSize: 12, color: '#94a3b8' },

  modalBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
