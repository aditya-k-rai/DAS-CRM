import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image,
  Modal,
} from 'react-native';

interface LoginScreenProps {
  onLogin: (token: string) => void;
}

type UserRole = 'ADMIN' | 'HR' | 'MANAGER' | 'TEAM_LEADER' | 'SALES_EXEC';
type EntryPoint = 'workspace' | 'staff_key';

function formatCompanyKey(input: string): string {
  const clean = input.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  let part1 = '';
  let part2 = '';
  let part3 = '';

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    if (part1.length < 4) {
      if (/[A-Z]/.test(char)) part1 += char;
    } else if (part2.length < 2) {
      if (/[A-Z]/.test(char)) part2 += char;
    } else if (part3.length < 4) {
      if (/[0-9]/.test(char)) part3 += char;
    }
  }

  let formatted = part1;
  if (part1.length === 4) {
    formatted += '-';
    if (part2.length > 0) {
      formatted += part2;
      if (part2.length === 2) {
        formatted += '-';
        if (part3.length > 0) {
          formatted += part3;
        }
      }
    }
  }
  return formatted;
}

const PUBLIC_COMPANIES = [
  { id: 'comp_acme', name: 'Acme Sales Solutions' },
  { id: 'comp_techcorp', name: 'TechCorp Enterprise' },
  { id: 'comp_globalhealth', name: 'Global Health CRM' },
  { id: 'comp_logitech', name: 'LogiTech Freight' },
];

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [entryPoint, setEntryPoint]               = useState<EntryPoint>('workspace');
  const [selectedCompanyId, setSelectedCompanyId] = useState('comp_acme');
  const [companyKeyInput, setCompanyKeyInput]     = useState('ACME-KX-7421');
  const [selectedRole, setSelectedRole]           = useState<UserRole>('ADMIN');
  const [email, setEmail]                         = useState('vikram.admin@acme.com');
  const [password, setPassword]                   = useState('password123');
  
  // Staff Key Redeem State
  const [userKey, setUserKey]                     = useState('');
  const [staffName, setStaffName]                 = useState('');
  const [staffEmail, setStaffEmail]               = useState('');
  const [staffPassword, setStaffPassword]         = useState('');
  const [keyValidating, setKeyValidating]         = useState(false);
  const [keyInfo, setKeyInfo]                     = useState<{ valid: boolean; assignedRole?: string } | null>(null);

  // Modals & UI State
  const [companyModalOpen, setCompanyModalOpen]   = useState(false);
  const [forgotModalOpen, setForgotModalOpen]     = useState(false);
  const [forgotEmail, setForgotEmail]             = useState('');
  const [forgotOtp, setForgotOtp]                 = useState('');
  const [newPassword, setNewPassword]             = useState('');
  const [forgotStep, setForgotStep]               = useState<'email' | 'otp'>('email');
  const [forgotMsg, setForgotMsg]                 = useState<string | null>(null);

  const [loading, setLoading]                     = useState(false);
  const [error, setError]                         = useState('');

  const selectedCompanyName = PUBLIC_COMPANIES.find(c => c.id === selectedCompanyId)?.name || 'Acme Sales Solutions';

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    if (role === 'ADMIN') setEmail('vikram.admin@acme.com');
    if (role === 'HR') setEmail('sunita.hr@acme.com');
    if (role === 'MANAGER') setEmail('rajesh.mgr@acme.com');
    if (role === 'TEAM_LEADER') setEmail('amit.tl@acme.com');
    if (role === 'SALES_EXEC') setEmail('rajesh.rep@acme.com');
  };

  const handleLogin = () => {
    if (!companyKeyInput.trim() || companyKeyInput.length < 12) {
      setError('Please enter a valid 12-character Company Key (e.g. ACME-KX-7421)');
      return;
    }
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }
    setLoading(true);
    setError('');
    setTimeout(() => {
      setLoading(false);
      onLogin('demo-jwt-token-mobile-12345');
    }, 600);
  };

  const handleValidateUserKey = () => {
    if (!userKey.trim()) return;
    setKeyValidating(true);
    setError('');
    setTimeout(() => {
      setKeyValidating(false);
      setKeyInfo({ valid: true, assignedRole: 'SALES_EXEC' });
    }, 500);
  };

  const handleForgotSubmit = () => {
    if (forgotStep === 'email') {
      if (!forgotEmail) return;
      setForgotStep('otp');
      setForgotMsg(`Security OTP sent to ${forgotEmail}`);
    } else {
      setForgotMsg('Password updated successfully!');
      setTimeout(() => {
        setForgotModalOpen(false);
        setPassword(newPassword || 'password123');
      }, 1000);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          {/* Header Branding */}
          <View style={styles.headerContainer}>
            <Image
              source={require('../../assets/DAS CRM small logo .png')}
              style={{ width: 68, height: 68, borderRadius: 16, marginBottom: 10 }}
              resizeMode="contain"
            />
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>COMPANY WORKSPACE GATEWAY</Text>
            </View>
            <Text style={styles.title}>DAS CRM Platform</Text>
            <Text style={styles.subtitle}>Select your gateway option & authenticate</Text>
          </View>

          {/* Gateway Switcher Tabs */}
          <View style={styles.switcherContainer}>
            <TouchableOpacity
              style={[styles.switcherTab, entryPoint === 'workspace' && styles.switcherTabActive]}
              onPress={() => { setEntryPoint('workspace'); setError(''); }}
            >
              <Text style={[styles.switcherTabText, entryPoint === 'workspace' && styles.switcherTabTextActive]}>
                🏢 Workspace Entry
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.switcherTab, entryPoint === 'staff_key' && styles.switcherTabActiveStaff]}
              onPress={() => { setEntryPoint('staff_key'); setError(''); }}
            >
              <Text style={[styles.switcherTabText, entryPoint === 'staff_key' && styles.switcherTabTextActiveStaff]}>
                🔑 Staff Invite Key
              </Text>
            </TouchableOpacity>
          </View>

          {/* Workspace Entry Card */}
          {entryPoint === 'workspace' && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.entryTag}>
                  <Text style={styles.entryTagText}>WORKSPACE ENTRY</Text>
                </View>
                <Text style={styles.cardTitle}>Sign In to Your Company Workspace</Text>
                <Text style={styles.cardSubtitle}>Select company & enter assigned key to sign in.</Text>
              </View>

              {error ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>⚠️ {error}</Text>
                </View>
              ) : null}

              {/* Role Selection Pills */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Select Login Role / Perspective *</Text>
                <View style={styles.roleGrid}>
                  {(['ADMIN', 'HR', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC'] as UserRole[]).map(r => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.rolePill, selectedRole === r && styles.rolePillActive]}
                      onPress={() => handleRoleSelect(r)}
                    >
                      <Text style={[styles.rolePillText, selectedRole === r && styles.rolePillTextActive]}>
                        {r.replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Company Selector Dropdown Box */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Select Company / Workspace *</Text>
                <TouchableOpacity
                  style={styles.selectBox}
                  onPress={() => setCompanyModalOpen(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.inputIcon}>🏢</Text>
                  <Text style={styles.selectBoxText}>{selectedCompanyName}</Text>
                  <Text style={styles.selectArrow}>▼</Text>
                </TouchableOpacity>
              </View>

              {/* Company Key Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Company / User Key (Format: ACME-KX-7421) *</Text>
                <View style={{ position: 'relative', justifyContent: 'center' }}>
                  <Text style={styles.inputIcon}>🔑</Text>
                  <TextInput
                    style={[styles.input, styles.inputWithIcon, styles.monoInput]}
                    placeholder="ACME-KX-7421"
                    placeholderTextColor="#64748b"
                    value={companyKeyInput}
                    maxLength={12}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    keyboardType={companyKeyInput.length >= 8 ? 'numeric' : 'default'}
                    onChangeText={t => setCompanyKeyInput(formatCompanyKey(t))}
                  />
                </View>
              </View>

              {/* Email & Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address *</Text>
                <View style={{ position: 'relative', justifyContent: 'center' }}>
                  <Text style={styles.inputIcon}>✉️</Text>
                  <TextInput
                    style={[styles.input, styles.inputWithIcon]}
                    placeholder="user@organization.com"
                    placeholderTextColor="#64748b"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password *</Text>
                <View style={{ position: 'relative', justifyContent: 'center' }}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    style={[styles.input, styles.inputWithIcon]}
                    placeholder="••••••••"
                    placeholderTextColor="#64748b"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
                <TouchableOpacity
                  style={{ alignSelf: 'flex-end', marginTop: 6 }}
                  onPress={() => { setForgotModalOpen(true); setForgotEmail(email); setForgotStep('email'); }}
                >
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              {/* Buttons */}
              <TouchableOpacity
                style={styles.button}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Sign In as {selectedRole.replace('_', ' ')} →</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.googleButton} onPress={handleLogin} activeOpacity={0.8}>
                <Text style={styles.googleButtonText}>🌐 Sign in with Google (Gmail Verified)</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Staff Invite Key Redeem Mode */}
          {entryPoint === 'staff_key' && (
            <View style={[styles.card, { borderColor: 'rgba(16, 185, 129, 0.4)' }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.entryTag, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
                  <Text style={[styles.entryTagText, { color: '#6ee7b7' }]}>STAFF USER INVITE KEY</Text>
                </View>
                <Text style={styles.cardTitle}>Redeem Staff Invite Key</Text>
                <Text style={styles.cardSubtitle}>Enter key generated by your Tenant Admin (e.g. ACME-RX-4312).</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>User Invite Key (Format: ACME-RX-4312) *</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    style={[styles.input, styles.monoInput, { flex: 1 }]}
                    placeholder="ACME-RX-4312"
                    placeholderTextColor="#64748b"
                    value={userKey}
                    maxLength={12}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    keyboardType={userKey.length >= 8 ? 'numeric' : 'default'}
                    onChangeText={t => setUserKey(formatCompanyKey(t))}
                  />
                  <TouchableOpacity style={styles.validateButton} onPress={handleValidateUserKey} disabled={keyValidating}>
                    <Text style={styles.validateButtonText}>{keyValidating ? '...' : 'Validate'}</Text>
                  </TouchableOpacity>
                </View>
                {keyInfo?.valid ? (
                  <Text style={styles.validKeyText}>✓ Valid Key! Grants Role: {keyInfo.assignedRole}</Text>
                ) : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput style={styles.input} placeholder="Rajesh Sharma" placeholderTextColor="#64748b" value={staffName} onChangeText={setStaffName} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Official Email *</Text>
                <TextInput style={styles.input} placeholder="rajesh@acme.com" placeholderTextColor="#64748b" value={staffEmail} onChangeText={setStaffEmail} keyboardType="email-address" />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Create Password *</Text>
                <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="#64748b" value={staffPassword} onChangeText={setStaffPassword} secureTextEntry />
              </View>

              <TouchableOpacity style={[styles.button, { backgroundColor: '#10b981' }]} onPress={handleLogin} disabled={loading}>
                <Text style={styles.buttonText}>Register Staff Account →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Footer Register Workspace Prompt */}
          <View style={styles.registerBox}>
            <Text style={styles.registerPrompt}>New Company? Activate workspace with Registration Key:</Text>
            <TouchableOpacity style={styles.registerCtaButton} activeOpacity={0.8}>
              <Text style={styles.registerCtaText}>🏢 Register Company Workspace →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Company Select Modal */}
      <Modal visible={companyModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Company Workspace</Text>
            {PUBLIC_COMPANIES.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[styles.modalOption, selectedCompanyId === c.id && styles.modalOptionActive]}
                onPress={() => { setSelectedCompanyId(c.id); setCompanyModalOpen(false); }}
              >
                <Text style={[styles.modalOptionText, selectedCompanyId === c.id && styles.modalOptionTextActive]}>
                  🏢 {c.name}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setCompanyModalOpen(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Forgot Password Modal */}
      <Modal visible={forgotModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🔑 Reset Account Password</Text>
            {forgotMsg ? <Text style={styles.modalMsg}>{forgotMsg}</Text> : null}
            {forgotStep === 'email' ? (
              <View style={{ width: '100%', gap: 12 }}>
                <Text style={styles.label}>Enter Registered Email *</Text>
                <TextInput style={styles.input} placeholder="user@acme.com" placeholderTextColor="#64748b" value={forgotEmail} onChangeText={setForgotEmail} keyboardType="email-address" />
                <TouchableOpacity style={styles.button} onPress={handleForgotSubmit}>
                  <Text style={styles.buttonText}>Send Security Code →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ width: '100%', gap: 12 }}>
                <Text style={styles.label}>Enter 6-Digit Security OTP *</Text>
                <TextInput style={styles.input} placeholder="123456" placeholderTextColor="#64748b" value={forgotOtp} onChangeText={setForgotOtp} keyboardType="numeric" maxLength={6} />
                <Text style={styles.label}>Enter New Password *</Text>
                <TextInput style={styles.input} placeholder="New password" placeholderTextColor="#64748b" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
                <TouchableOpacity style={styles.button} onPress={handleForgotSubmit}>
                  <Text style={styles.buttonText}>Reset Password Now</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setForgotModalOpen(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060810' },
  scrollContainer: { paddingHorizontal: 16, paddingVertical: 20, alignItems: 'center' },
  headerContainer: { alignItems: 'center', marginBottom: 16 },
  badgeContainer: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 6,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#a5b4fc', letterSpacing: 0.5 },
  title: { fontSize: 24, fontWeight: '800', color: '#ffffff', marginBottom: 2 },
  subtitle: { fontSize: 12, color: '#94a3b8' },

  switcherContainer: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 4,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  switcherTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  switcherTabActive: { backgroundColor: 'rgba(99, 102, 241, 0.25)' },
  switcherTabActiveStaff: { backgroundColor: 'rgba(16, 185, 129, 0.25)' },
  switcherTabText: { fontSize: 12, color: '#94a3b8', fontWeight: '700' },
  switcherTabTextActive: { color: '#a5b4fc' },
  switcherTabTextActiveStaff: { color: '#6ee7b7' },

  card: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
  },
  cardHeader: { marginBottom: 14 },
  entryTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 6,
  },
  entryTagText: { fontSize: 9, fontWeight: '800', color: '#a5b4fc' },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#ffffff', marginBottom: 2 },
  cardSubtitle: { fontSize: 11, color: '#94a3b8' },

  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorText: { color: '#fca5a5', fontSize: 12, fontWeight: '600' },

  inputGroup: { marginBottom: 14 },
  label: { fontSize: 11, color: '#94a3b8', fontWeight: '700', marginBottom: 5 },
  input: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 13,
  },
  inputWithIcon: { paddingLeft: 38 },
  inputIcon: { position: 'absolute', left: 12, zIndex: 10, fontSize: 14 },
  monoInput: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
    color: '#c084fc',
    letterSpacing: 1.5,
  },

  selectBox: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectBoxText: { color: '#f8fafc', fontSize: 13, fontWeight: '600', flex: 1, marginLeft: 24 },
  selectArrow: { color: '#64748b', fontSize: 10 },

  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  rolePill: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
  },
  rolePillActive: { backgroundColor: 'rgba(99, 102, 241, 0.25)', borderColor: '#6366f1' },
  rolePillText: { fontSize: 10, color: '#94a3b8', fontWeight: '700' },
  rolePillTextActive: { color: '#818cf8' },

  forgotText: { fontSize: 11, color: '#818cf8', fontWeight: '600', textDecorationLine: 'underline' },

  button: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },

  googleButton: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 8,
  },
  googleButtonText: { color: '#f8fafc', fontSize: 12, fontWeight: '600' },

  validateButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  validateButtonText: { color: '#6ee7b7', fontSize: 12, fontWeight: '700' },
  validKeyText: { color: '#34d399', fontSize: 11, fontWeight: '700', marginTop: 4 },

  registerBox: { width: '100%', marginTop: 16, alignItems: 'center' },
  registerPrompt: { fontSize: 11, color: '#64748b', marginBottom: 6 },
  registerCtaButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    width: '100%',
    alignItems: 'center',
  },
  registerCtaText: { color: '#a5b4fc', fontSize: 12, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: '#0f172a', borderRadius: 20, borderWidth: 1, borderColor: '#1e293b', padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#ffffff', marginBottom: 14 },
  modalMsg: { fontSize: 12, color: '#34d399', fontWeight: '600', marginBottom: 10, textAlign: 'center' },
  modalOption: { width: '100%', padding: 12, backgroundColor: '#020617', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', marginBottom: 8 },
  modalOptionActive: { backgroundColor: 'rgba(99, 102, 241, 0.2)', borderColor: '#6366f1' },
  modalOptionText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  modalOptionTextActive: { color: '#a5b4fc' },
  modalCloseButton: { marginTop: 10, paddingVertical: 8 },
  modalCloseText: { color: '#64748b', fontSize: 12, fontWeight: '600' },
});
