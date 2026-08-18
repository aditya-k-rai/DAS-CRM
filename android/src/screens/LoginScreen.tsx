/**
 * LoginScreen.tsx — DAS CRM Android
 * Mirrors frontend-web/components/auth/LoginGateway.tsx exactly.
 * Supports: Workspace Entry, Staff Invite Key, Forgot Password modal.
 */

import React, { useState } from 'react';
import {
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useAuthStore,
  UserRole,
  DEMO_USERS,
  normalizeRoleStr,
  inferRoleFromEmail,
  validateEmailRoleMatch,
  getPostLoginDefaultTab,
} from '../store/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoginScreenProps {
  /** Called after successful login so App.tsx can switch to App navigator. */
  onLoginSuccess: (defaultTab: string) => void;
}

type EntryPoint = 'workspace' | 'staff_key';

interface PublicCompany {
  id: string;
  name: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

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

const PUBLIC_COMPANIES: PublicCompany[] = [
  { id: 'comp_1', name: 'Acme Sales Solutions' },
  { id: 'comp_2', name: 'Sunita Real Estate Ltd' },
  { id: 'comp_3', name: 'Lakshmi Auto Dealerships' },
  { id: 'comp_4', name: 'TechCorp Enterprise' },
];

const ALL_ROLES: UserRole[] = [
  'ADMIN',
  'HR',
  'MANAGER',
  'TEAM_LEADER',
  'SALES_EXEC',
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const { switchRole, setAuthSession } = useAuthStore();

  // Gateway mode
  const [entryPoint, setEntryPoint] = useState<EntryPoint>('workspace');

  // Workspace login state
  const [publicCompanies] = useState<PublicCompany[]>(PUBLIC_COMPANIES);
  const [selectedCompanyId, setSelectedCompanyId] = useState('comp_1');
  const [companyKeyInput, setCompanyKeyInput] = useState('ACME-KX-7421');
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');
  const [email, setEmail] = useState('vikram.admin@acme.com');
  const [password, setPassword] = useState('password123');

  // Staff key state
  const [userKey, setUserKey] = useState('');
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [keyValidating, setKeyValidating] = useState(false);
  const [keyInfo, setKeyInfo] = useState<{
    valid: boolean;
    assignedRole?: string;
  } | null>(null);

  // Forgot password state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<'email' | 'otp'>('email');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // Company picker modal
  const [companyModalOpen, setCompanyModalOpen] = useState(false);

  // General UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCompanyName =
    publicCompanies.find((c) => c.id === selectedCompanyId)?.name ||
    'Acme Sales Solutions';

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    const roleEmails: Record<UserRole, string> = {
      ADMIN: 'vikram.admin@acme.com',
      HR: 'sunita.hr@acme.com',
      MANAGER: 'rajesh.mgr@acme.com',
      TEAM_LEADER: 'amit.tl@acme.com',
      SALES_EXEC: 'rajesh.rep@acme.com',
      SUPER_ADMIN: 'adtyamighty@gmail.com',
    };
    setEmail(roleEmails[role]);
    setError(null);
  };

  /** Mirrors LoginGateway.tsx handleWorkspaceLogin */
  const handleWorkspaceLogin = async () => {
    if (!companyKeyInput.trim() || companyKeyInput.length < 12) {
      setError(
        'Please enter a valid Company Key (format: ACME-KX-7421).',
      );
      return;
    }
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    // Role vs email mismatch check
    const matchCheck = validateEmailRoleMatch(email, selectedRole);
    if (!matchCheck.valid && matchCheck.expectedRole) {
      setError(
        `Wrong credential or role mismatch: "${email}" is assigned to role "${matchCheck.expectedRole.replace('_', ' ')}", not "${selectedRole.replace('_', ' ')}". Check your email and selected role.`,
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          key: companyKeyInput.trim(),
          organizationId: selectedCompanyId,
        }),
      });

      const data = await res.json();

      if (res.ok && data.accessToken) {
        const inferred = inferRoleFromEmail(email);
        const backendRoleName =
          data.user?.role?.name ||
          (typeof data.user?.role === 'string' ? data.user.role : null);
        const finalRole: UserRole = normalizeRoleStr(
          inferred || backendRoleName || selectedRole,
        );
        const demoProfile = DEMO_USERS[finalRole] || DEMO_USERS.ADMIN;

        await setAuthSession(
          {
            id: data.user?.id || demoProfile.id,
            name:
              `${data.user?.firstName || ''} ${data.user?.lastName || ''}`.trim() ||
              demoProfile.name,
            email: data.user?.email || email,
            role: finalRole,
            avatar: data.user?.firstName
              ? data.user.firstName.slice(0, 2).toUpperCase()
              : demoProfile.avatar,
            companyId: data.organization?.id || selectedCompanyId,
            companyName:
              data.organization?.name ||
              selectedCompanyName,
          },
          data.accessToken,
        );
        setLoading(false);
        onLoginSuccess(getPostLoginDefaultTab(finalRole));
        return;
      }

      if (!res.ok) {
        setError(
          data.message ||
            'Login failed. Please verify your company workspace selection and registration key.',
        );
        setLoading(false);
        return;
      }
    } catch {
      // Backend unavailable — demo mode fallback
    }

    // Demo mode fallback
    const finalRole = normalizeRoleStr(
      inferRoleFromEmail(email) || selectedRole,
    );
    await switchRole(finalRole);
    setLoading(false);
    onLoginSuccess(getPostLoginDefaultTab(finalRole));
  };

  /** Mirrors LoginGateway.tsx handleGoogleSignIn */
  const handleGoogleSignIn = async () => {
    if (!companyKeyInput.trim()) {
      setError(
        'Company workspace selection and Registration Key are required before signing in with Google.',
      );
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email || 'user@gmail.com',
          googleId: 'google_oauth_' + Date.now(),
          name: email ? email.split('@')[0] : 'Google User',
          organizationId: selectedCompanyId,
          key: companyKeyInput.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.accessToken) {
        const backendRoleName =
          data.user?.role?.name ||
          (typeof data.user?.role === 'string' ? data.user.role : null);
        const finalRole = normalizeRoleStr(
          backendRoleName || inferRoleFromEmail(email) || selectedRole,
        );
        await setAuthSession(
          {
            id: data.user.id,
            name:
              `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim() ||
              'Google User',
            email: data.user.email,
            role: finalRole,
            avatar: data.user.firstName
              ? data.user.firstName.slice(0, 2).toUpperCase()
              : 'GU',
            companyId: data.organization?.id || selectedCompanyId,
            companyName: data.organization?.name || selectedCompanyName,
          },
          data.accessToken,
        );
        setLoading(false);
        onLoginSuccess(getPostLoginDefaultTab(finalRole));
        return;
      } else {
        setError(
          data.message ||
            'Google OAuth authentication failed. Please use a valid Gmail ID.',
        );
        setLoading(false);
        return;
      }
    } catch {
      // Demo fallback
    }

    const finalRole = normalizeRoleStr(
      inferRoleFromEmail(email) || selectedRole,
    );
    await switchRole(finalRole);
    setLoading(false);
    onLoginSuccess(getPostLoginDefaultTab(finalRole));
  };

  /** Mirrors LoginGateway.tsx handleValidateUserKey */
  const handleValidateUserKey = async () => {
    if (!userKey.trim()) return;
    setKeyValidating(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/validate-user-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: userKey }),
      });
      const data = await res.json();
      setKeyInfo(data);
      if (!data.valid) setError('Invalid, blocked, or expired Staff Invite Key.');
    } catch {
      setKeyInfo({ valid: true, assignedRole: 'SALES_EXEC' });
    } finally {
      setKeyValidating(false);
    }
  };

  /** Mirrors LoginGateway.tsx handleStaffKeyRegister */
  const handleStaffKeyRegister = async () => {
    if (!userKey || !staffEmail || !staffPassword || !staffName) {
      setError('Please fill all required fields including a valid User Key.');
      return;
    }
    setLoading(true);
    setError(null);

    const assignedRole = normalizeRoleStr(
      keyInfo?.assignedRole || inferRoleFromEmail(staffEmail) || 'SALES_EXEC',
    );

    try {
      const res = await fetch(`${API_BASE}/auth/staff-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userKey,
          name: staffName,
          email: staffEmail,
          password: staffPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.accessToken) {
        await setAuthSession(
          {
            id: data.user.id,
            name: staffName,
            email: staffEmail,
            role: assignedRole,
            avatar: staffName.slice(0, 2).toUpperCase(),
            companyId: 'comp_acme',
            companyName: 'Acme Sales Solutions',
          },
          data.accessToken,
        );
        setLoading(false);
        onLoginSuccess(getPostLoginDefaultTab(assignedRole));
        return;
      }
    } catch {
      // Demo fallback
    }

    await switchRole(assignedRole);
    setLoading(false);
    onLoginSuccess(getPostLoginDefaultTab(assignedRole));
  };

  /** Forgot password — step 1 */
  const handleRequestResetOtp = async () => {
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your email address.');
      return;
    }
    setForgotLoading(true);
    setForgotError(null);
    setForgotMsg(null);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setForgotStep('otp');
        setForgotMsg(
          data.message || `6-digit reset OTP sent to ${forgotEmail}`,
        );
      } else {
        setForgotError(data.message || 'Failed to send password reset email.');
      }
    } catch {
      setForgotStep('otp');
      setForgotMsg(
        `Security OTP sent to ${forgotEmail} (Demo: enter 123456)`,
      );
    } finally {
      setForgotLoading(false);
    }
  };

  /** Forgot password — step 2 */
  const handleResetPassword = async () => {
    if (forgotOtp.length < 6 || !newPassword.trim()) {
      setForgotError('Please enter a valid 6-digit OTP and new password.');
      return;
    }
    setForgotLoading(true);
    setForgotError(null);
    setForgotMsg(null);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          otp: forgotOtp.trim(),
          newPassword: newPassword.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setForgotMsg(
          data.message || 'Password reset successfully! You can now log in.',
        );
        setTimeout(() => {
          setForgotModalOpen(false);
          setPassword(newPassword.trim());
          setEmail(forgotEmail.trim());
        }, 1500);
      } else {
        setForgotError(data.message || 'Invalid or expired OTP code.');
      }
    } catch {
      setForgotMsg('Password updated successfully! (Demo Mode)');
      setTimeout(() => {
        setForgotModalOpen(false);
        setPassword(newPassword || 'password123');
      }, 1000);
    } finally {
      setForgotLoading(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── HEADER BRANDING ──────────────────────────────────────── */}
          <View style={styles.headerContainer}>
            <Image
              source={require('../../assets/DAS CRM small logo .png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>COMPANY WORKSPACE GATEWAY</Text>
            </View>
            <Text style={styles.title}>DAS CRM Platform</Text>
            <Text style={styles.subtitle}>
              Select your gateway option &amp; authenticate
            </Text>
          </View>

          {/* ── GATEWAY SWITCHER (mirrors left panel of LoginGateway) ── */}
          <View style={styles.gatewayPanel}>
            {/* Workspace Entry */}
            <TouchableOpacity
              style={[
                styles.gatewayOption,
                entryPoint === 'workspace' && styles.gatewayOptionActive,
              ]}
              onPress={() => {
                setEntryPoint('workspace');
                setError(null);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.gatewayIconWrap}>
                <Text style={styles.gatewayIcon}>🏢</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.gatewayOptionLabel,
                    entryPoint === 'workspace' && styles.gatewayOptionLabelActive,
                  ]}
                >
                  Tenant Admin &amp; Staff Login
                </Text>
                <Text style={styles.gatewayOptionSub}>
                  Company Key &amp; Email Workspace Login
                </Text>
              </View>
            </TouchableOpacity>

            {/* Staff Invite Key */}
            <TouchableOpacity
              style={[
                styles.gatewayOption,
                entryPoint === 'staff_key' && styles.gatewayOptionActiveGreen,
              ]}
              onPress={() => {
                setEntryPoint('staff_key');
                setError(null);
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.gatewayIconWrap, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                <Text style={styles.gatewayIcon}>🔑</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.gatewayOptionLabel,
                    entryPoint === 'staff_key' && { color: '#6ee7b7' },
                  ]}
                >
                  Staff User Key Registration
                </Text>
                <Text style={styles.gatewayOptionSub}>
                  Redeem Staff Invite Key (e.g. ACME-RX-4312)
                </Text>
              </View>
            </TouchableOpacity>

            {/* Register CTA */}
            <View style={styles.registerBox}>
              <Text style={styles.registerPrompt}>
                New Company? Activate workspace with Registration Key:
              </Text>
              <TouchableOpacity style={styles.registerCtaButton} activeOpacity={0.8}>
                <Text style={styles.registerCtaText}>
                  🏢 Register Company Workspace →
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── WORKSPACE ENTRY FORM ──────────────────────────────────── */}
          {entryPoint === 'workspace' && (
            <View style={styles.formCard}>
              <View style={styles.entryTagRow}>
                <View style={styles.entryTag}>
                  <Text style={styles.entryTagText}>WORKSPACE ENTRY</Text>
                </View>
              </View>
              <Text style={styles.formTitle}>
                Sign In to Your Company Workspace
              </Text>
              <Text style={styles.formSubtitle}>
                Select your company and provide your assigned key to authenticate.
              </Text>

              {/* Error Banner */}
              {error ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>⚠️ {error}</Text>
                </View>
              ) : null}

              {/* Role Pills */}
              <Text style={styles.label}>
                Select Login Role / Perspective *
                {loading ? (
                  <Text style={styles.labelNote}> (Locked during authentication)</Text>
                ) : null}
              </Text>
              <View style={[styles.roleGrid, loading && { opacity: 0.5 }]}>
                {ALL_ROLES.map((r) => (
                  <TouchableOpacity
                    key={r}
                    disabled={loading}
                    style={[
                      styles.rolePill,
                      selectedRole === r && styles.rolePillActive,
                    ]}
                    onPress={() => handleRoleSelect(r)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.rolePillText,
                        selectedRole === r && styles.rolePillTextActive,
                      ]}
                    >
                      {r.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Company Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Select Company / Workspace *</Text>
                <TouchableOpacity
                  disabled={loading}
                  style={[styles.selectBox, loading && { opacity: 0.5 }]}
                  onPress={() => setCompanyModalOpen(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.inputIcon}>🏢</Text>
                  <Text style={styles.selectBoxText}>{selectedCompanyName}</Text>
                  <Text style={styles.selectArrow}>▼</Text>
                </TouchableOpacity>
              </View>

              {/* Company Key */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Company / User Key (Format: ACME-KX-7421) *
                </Text>
                <View style={{ position: 'relative', justifyContent: 'center' }}>
                  <Text style={styles.inputIcon}>🔑</Text>
                  <TextInput
                    editable={!loading}
                    style={[
                      styles.input,
                      styles.inputWithIcon,
                      styles.monoInput,
                      loading && { opacity: 0.5 },
                    ]}
                    placeholder="ACME-KX-7421"
                    placeholderTextColor="#64748b"
                    value={companyKeyInput}
                    maxLength={12}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    keyboardType={companyKeyInput.length >= 8 ? 'numeric' : 'default'}
                    onChangeText={(t) => setCompanyKeyInput(formatCompanyKey(t))}
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address *</Text>
                <View style={{ position: 'relative', justifyContent: 'center' }}>
                  <Text style={styles.inputIcon}>✉️</Text>
                  <TextInput
                    editable={!loading}
                    style={[styles.input, styles.inputWithIcon, loading && { opacity: 0.5 }]}
                    placeholder="user@organization.com"
                    placeholderTextColor="#64748b"
                    value={email}
                    onChangeText={(val) => {
                      setEmail(val);
                      const inferred = inferRoleFromEmail(val);
                      if (inferred) setSelectedRole(inferred);
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password *</Text>
                <View style={{ position: 'relative', justifyContent: 'center' }}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    editable={!loading}
                    style={[styles.input, styles.inputWithIcon, loading && { opacity: 0.5 }]}
                    placeholder="••••••••"
                    placeholderTextColor="#64748b"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
                <TouchableOpacity
                  disabled={loading}
                  style={{ alignSelf: 'flex-end', marginTop: 6 }}
                  onPress={() => {
                    setForgotModalOpen(true);
                    setForgotEmail(email);
                    setForgotStep('email');
                    setForgotError(null);
                    setForgotMsg(null);
                  }}
                >
                  <Text style={[styles.forgotText, loading && { opacity: 0.4 }]}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Sign In Button */}
              <TouchableOpacity
                style={styles.button}
                onPress={handleWorkspaceLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    Sign In as {selectedRole.replace('_', ' ')} →
                  </Text>
                )}
              </TouchableOpacity>

              {/* Google Sign-In */}
              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleSignIn}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.googleButtonText}>
                  🌐 Sign in with Google (Gmail Verified)
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── STAFF INVITE KEY FORM ─────────────────────────────────── */}
          {entryPoint === 'staff_key' && (
            <View style={[styles.formCard, { borderColor: 'rgba(16,185,129,0.4)' }]}>
              <View style={styles.entryTagRow}>
                <View style={[styles.entryTag, styles.entryTagGreen]}>
                  <Text style={[styles.entryTagText, { color: '#6ee7b7' }]}>
                    STAFF USER INVITE KEY
                  </Text>
                </View>
              </View>
              <Text style={styles.formTitle}>Redeem Staff Invite Key</Text>
              <Text style={styles.formSubtitle}>
                Enter the user key generated by your Tenant Admin (e.g. ACME-RX-4312).
              </Text>

              {error ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>⚠️ {error}</Text>
                </View>
              ) : null}

              {/* Key Input + Validate */}
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
                    onChangeText={(t) => setUserKey(formatCompanyKey(t))}
                  />
                  <TouchableOpacity
                    style={styles.validateButton}
                    onPress={handleValidateUserKey}
                    disabled={keyValidating}
                  >
                    <Text style={styles.validateButtonText}>
                      {keyValidating ? '...' : 'Validate'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {keyInfo?.valid ? (
                  <Text style={styles.validKeyText}>
                    ✓ Valid Key! Grants Role: {keyInfo.assignedRole}
                  </Text>
                ) : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Your Full Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Rahul Sharma"
                  placeholderTextColor="#64748b"
                  value={staffName}
                  onChangeText={setStaffName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Official Email *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="rahul@company.com"
                  placeholderTextColor="#64748b"
                  value={staffEmail}
                  onChangeText={setStaffEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Create Password *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#64748b"
                  value={staffPassword}
                  onChangeText={setStaffPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#10b981' }]}
                onPress={handleStaffKeyRegister}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    Redeem Key &amp; Register Account →
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── COMPANY PICKER MODAL ──────────────────────────────────────── */}
      <Modal visible={companyModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Company Workspace</Text>
            {publicCompanies.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[
                  styles.modalOption,
                  selectedCompanyId === c.id && styles.modalOptionActive,
                ]}
                onPress={() => {
                  setSelectedCompanyId(c.id);
                  setCompanyModalOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    selectedCompanyId === c.id && styles.modalOptionTextActive,
                  ]}
                >
                  🏢 {c.name}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setCompanyModalOpen(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── FORGOT PASSWORD MODAL ─────────────────────────────────────── */}
      <Modal visible={forgotModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalCloseX}
              onPress={() => setForgotModalOpen(false)}
            >
              <Text style={styles.modalCloseXText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>🔑 Reset Account Password</Text>
            <Text style={styles.modalSubtitle}>
              Enter your registered email to receive a 6-digit verification code.
            </Text>

            {forgotError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>⚠️ {forgotError}</Text>
              </View>
            ) : null}
            {forgotMsg ? (
              <View style={styles.successBanner}>
                <Text style={styles.successText}>✓ {forgotMsg}</Text>
              </View>
            ) : null}

            {forgotStep === 'email' ? (
              <View style={{ width: '100%', gap: 12 }}>
                <Text style={styles.label}>Registered Email Address *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="user@company.com"
                  placeholderTextColor="#64748b"
                  value={forgotEmail}
                  onChangeText={setForgotEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleRequestResetOtp}
                  disabled={forgotLoading || !forgotEmail.trim()}
                >
                  {forgotLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>
                      Send 6-Digit Reset Code →
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ width: '100%', gap: 12 }}>
                <Text style={styles.label}>6-Digit Reset OTP Code *</Text>
                <TextInput
                  style={[styles.input, styles.monoInput, { textAlign: 'center', fontSize: 18, letterSpacing: 6 }]}
                  placeholder="123456"
                  placeholderTextColor="#64748b"
                  value={forgotOtp}
                  onChangeText={setForgotOtp}
                  keyboardType="numeric"
                  maxLength={6}
                />
                <Text style={styles.label}>New Secure Password *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  placeholderTextColor="#64748b"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: '#10b981' }]}
                  onPress={handleResetPassword}
                  disabled={
                    forgotLoading ||
                    forgotOtp.length < 6 ||
                    !newPassword.trim()
                  }
                >
                  {forgotLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>
                      Verify OTP &amp; Reset Password ✓
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setForgotModalOpen(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060810' },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },

  // Header
  headerContainer: { alignItems: 'center', marginBottom: 20, width: '100%', maxWidth: 560 },
  logoImage: { width: 68, height: 68, borderRadius: 16, marginBottom: 10 },
  badgeContainer: {
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#a5b4fc',
    letterSpacing: 0.5,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#ffffff', marginBottom: 2 },
  subtitle: { fontSize: 12, color: '#94a3b8', textAlign: 'center' },

  // Gateway Panel
  gatewayPanel: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  gatewayOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#020617',
  },
  gatewayOptionActive: {
    backgroundColor: 'rgba(99,102,241,0.2)',
    borderColor: '#6366f1',
  },
  gatewayOptionActiveGreen: {
    backgroundColor: 'rgba(16,185,129,0.2)',
    borderColor: '#10b981',
  },
  gatewayIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(99,102,241,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gatewayIcon: { fontSize: 18 },
  gatewayOptionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 2,
  },
  gatewayOptionLabelActive: { color: '#a5b4fc' },
  gatewayOptionSub: { fontSize: 10, color: '#64748b' },

  // Register CTA
  registerBox: { marginTop: 6 },
  registerPrompt: { fontSize: 11, color: '#64748b', marginBottom: 6 },
  registerCtaButton: {
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  registerCtaText: { color: '#a5b4fc', fontSize: 12, fontWeight: '700' },

  // Form Card
  formCard: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
    marginBottom: 16,
  },
  entryTagRow: { marginBottom: 8 },
  entryTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  entryTagGreen: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderColor: 'rgba(16,185,129,0.3)',
  },
  entryTagText: { fontSize: 9, fontWeight: '800', color: '#a5b4fc' },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  formSubtitle: { fontSize: 11, color: '#94a3b8', marginBottom: 14 },

  // Error / Success banners
  errorBanner: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderColor: 'rgba(239,68,68,0.4)',
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorText: { color: '#fca5a5', fontSize: 12, fontWeight: '600' },
  successBanner: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderColor: 'rgba(16,185,129,0.4)',
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  successText: { color: '#6ee7b7', fontSize: 12, fontWeight: '600' },

  // Inputs
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 11, color: '#94a3b8', fontWeight: '700', marginBottom: 5 },
  labelNote: { color: '#818cf8', fontWeight: '400' },
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
  inputIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 10,
    fontSize: 14,
  },
  monoInput: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
    color: '#c084fc',
    letterSpacing: 1.5,
  },

  // Role Pills
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 14 },
  rolePill: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
  },
  rolePillActive: {
    backgroundColor: 'rgba(99,102,241,0.25)',
    borderColor: '#6366f1',
  },
  rolePillText: { fontSize: 10, color: '#94a3b8', fontWeight: '700' },
  rolePillTextActive: { color: '#818cf8' },

  // Company Select Box
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

  // Forgot Password
  forgotText: {
    fontSize: 11,
    color: '#818cf8',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // Buttons
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

  // Validate button
  validateButton: {
    backgroundColor: 'rgba(16,185,129,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  validateButtonText: { color: '#6ee7b7', fontSize: 12, fontWeight: '700' },
  validKeyText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 20,
    alignItems: 'center',
  },
  modalCloseX: { position: 'absolute', top: 14, right: 16 },
  modalCloseXText: { color: '#64748b', fontSize: 16, fontWeight: '700' },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 14,
  },
  modalOption: {
    width: '100%',
    padding: 12,
    backgroundColor: '#020617',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 8,
  },
  modalOptionActive: {
    backgroundColor: 'rgba(99,102,241,0.2)',
    borderColor: '#6366f1',
  },
  modalOptionText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  modalOptionTextActive: { color: '#a5b4fc' },
  modalCloseButton: { marginTop: 10, paddingVertical: 8 },
  modalCloseText: { color: '#64748b', fontSize: 12, fontWeight: '600' },
});
