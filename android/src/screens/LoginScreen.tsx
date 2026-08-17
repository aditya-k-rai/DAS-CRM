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
} from 'react-native';

interface LoginScreenProps {
  onLogin: (token: string) => void;
}

type UserRole = 'ADMIN' | 'HR' | 'MANAGER' | 'TEAM_LEADER' | 'SALES_EXEC';

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
  const [selectedCompanyId, setSelectedCompanyId] = useState('comp_acme');
  const [companyKeyInput, setCompanyKeyInput]     = useState('ACME-KX-7421');
  const [selectedRole, setSelectedRole]           = useState<UserRole>('ADMIN');
  const [email, setEmail]                         = useState('vikram.admin@acme.com');
  const [password, setPassword]                   = useState('password123');
  const [loading, setLoading]                     = useState(false);
  const [error, setError]                         = useState('');

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
              style={{ width: 72, height: 72, borderRadius: 18, marginBottom: 12 }}
              resizeMode="contain"
            />
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>ORGANIZATION WORKSPACE GATEWAY</Text>
            </View>
            <Text style={styles.title}>DAS CRM</Text>
            <Text style={styles.subtitle}>Sign in to your organization workspace</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            ) : null}

            {/* 1. Company Workspace Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Select Company / Workspace *</Text>
              <View style={styles.companyPillRow}>
                {PUBLIC_COMPANIES.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.companyPill, selectedCompanyId === c.id && styles.companyPillActive]}
                    onPress={() => setSelectedCompanyId(c.id)}
                  >
                    <Text style={[styles.companyPillText, selectedCompanyId === c.id && styles.companyPillTextActive]}>
                      🏢 {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 2. Company / User Key Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company / User Key (Format: ACME-KX-7421) *</Text>
              <TextInput
                style={[styles.input, styles.monoInput]}
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

            {/* 3. Role Selector */}
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

            {/* 4. Email & Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="user@organization.com"
                placeholderTextColor="#64748b"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#64748b"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {/* Submit Buttons */}
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060810' },
  scrollContainer: { paddingHorizontal: 20, paddingVertical: 24, alignItems: 'center' },
  headerContainer: { alignItems: 'center', marginBottom: 20 },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoIcon: { fontSize: 26 },
  badgeContainer: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#a5b4fc', letterSpacing: 0.5 },
  title: { fontSize: 26, fontWeight: '800', color: '#ffffff', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#94a3b8' },

  card: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 20,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: { color: '#fca5a5', fontSize: 12, fontWeight: '600' },

  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, color: '#94a3b8', fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f8fafc',
    fontSize: 14,
  },
  monoInput: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
    color: '#c084fc',
    letterSpacing: 1.5,
  },

  companyPillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  companyPill: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  companyPillActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: '#6366f1',
  },
  companyPillText: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  companyPillTextActive: { color: '#a5b4fc' },

  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  rolePill: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
  },
  rolePillActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    borderColor: '#6366f1',
  },
  rolePillText: { fontSize: 10, color: '#94a3b8', fontWeight: '700' },
  rolePillTextActive: { color: '#818cf8' },

  button: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },

  googleButton: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  googleButtonText: { color: '#f8fafc', fontSize: 12, fontWeight: '600' },
});
