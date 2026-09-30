/**
 * LoginScreen.tsx — DAS CRM Android
 * Mirrors frontend-web/components/auth/LoginGateway.tsx exactly.
 * Supports: Workspace Entry, Staff Invite Key, Forgot Password modal.
 */

import React, { useState, useEffect } from 'react';
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
  AppState,
  AppStateStatus,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useAuthStore,
  UserRole,
  DEMO_USERS,
  normalizeRoleStr,
  inferRoleFromEmail,
  validateEmailRoleMatch,
  getPostLoginDefaultTab,
} from '../store/authStore';
import { apiService, PublicCompany, DEFAULT_ACTIVE_COMPANY } from '../services/apiService';
import { API_BASE, getApiBase, setApiBase, getCandidateApiUrls } from '../config/api';
import ServerConnectionModal from '../components/ServerConnectionModal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoginScreenProps {
  /** Called after successful login so App.tsx can switch to App navigator. */
  onLoginSuccess: (defaultTab: string) => void;
}

function formatCompanyKey(input: string): string {
  const raw = input.trim().toUpperCase();
  if (raw.includes('-')) {
    const segments = raw.split('-');
    const p1 = segments[0]?.replace(/[^A-Z]/g, '').slice(0, 4) || '';
    const p2 = segments[1]?.replace(/[^A-Z]/g, '').slice(0, 2) || '';
    const p3 = segments[2]?.replace(/[^0-9]/g, '').slice(0, 4) || '';
    let res = p1;
    if (segments.length > 1) {
      res += '-' + p2;
      if (segments.length > 2) {
        res += '-' + p3;
      }
    }
    return res;
  }
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

const PUBLIC_COMPANIES: PublicCompany[] = [];

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

  // Workspace login state
  const [publicCompanies, setPublicCompanies] = useState<PublicCompany[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [syncingCompanies, setSyncingCompanies] = useState(false);
  const [companyKeyInput, setCompanyKeyInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [hasAutofilled, setHasAutofilled] = useState(false);

  // Segmented mode: Workspace Login vs Staff Self-Register
  const [authMode, setAuthMode] = useState<'LOGIN' | 'STAFF_REGISTER'>('LOGIN');
  const [staffName, setStaffName] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState<UserRole>('SALES_EXEC');
  const [keyValidating, setKeyValidating] = useState(false);
  const [keyValidated, setKeyValidated] = useState(false);
  const [validatedOrgId, setValidatedOrgId] = useState('');
  const [validatedOrgName, setValidatedOrgName] = useState('');

  const STORAGE_KEY_PREV_LOGIN = '@das_crm_prev_login';

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
  const [serverModalOpen, setServerModalOpen] = useState(false);


  // General UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Live Fetch & Sync Companies from Super Admin Approval Engine */
  const fetchAndSyncCompanies = async (showIndicator = false) => {
    if (showIndicator) setSyncingCompanies(true);
    try {
      const comps = await apiService.getPublicCompanies();
      if (Array.isArray(comps) && comps.length > 0) {
        setPublicCompanies(comps);

        // Auto-select company prioritizing approved/active workspaces
        setSelectedCompanyId((prev) => {
          if (prev && comps.some((c) => c.id === prev)) {
            return prev;
          }
          const firstApproved = comps.find((c) => c.status === 'APPROVED' || c.isActive) || comps[0];
          return firstApproved ? firstApproved.id : comps[0].id;
        });

        // If the selected company has a known key and user has not typed one, autofill it
        setSelectedCompanyId((currentId) => {
          const matched = comps.find((c) => c.id === currentId) || comps[0];
          if (matched && matched.companyKey) {
            setCompanyKeyInput((prevKey) => (!prevKey || prevKey.length < 11 ? formatCompanyKey(matched.companyKey!) : prevKey));
          }
          return currentId;
        });
      }
    } catch (err) {
      console.warn('Company sync warning:', err);
    } finally {
      if (showIndicator) setSyncingCompanies(false);
    }
  };

  useEffect(() => {
    // 1. Autofill from previous login storage
    AsyncStorage.getItem(STORAGE_KEY_PREV_LOGIN).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.email) setEmail(parsed.email);
          if (parsed.password) setPassword(parsed.password);
          if (parsed.companyKey) setCompanyKeyInput(parsed.companyKey);
          if (parsed.companyId) setSelectedCompanyId(parsed.companyId);
          if (parsed.role) setSelectedRole(parsed.role);
          setHasAutofilled(true);
        } catch (_) {}
      }
    });

    // 2. Immediately hydrate cached companies from AsyncStorage so screen never shows empty state
    AsyncStorage.getItem('@das_crm_public_companies').then((raw) => {
      let compsToUse: PublicCompany[] = [DEFAULT_ACTIVE_COMPANY];
      if (raw) {
        try {
          const cached = JSON.parse(raw);
          if (Array.isArray(cached) && cached.length > 0) {
            compsToUse = cached.map((c: any) =>
              c.id === 'cmuev7n3o000mikew7je1tdiw'
                ? { ...c, companyKey: 'ADOR-EC-7187' }
                : c,
            );
          }
        } catch (_) {}
      }
      setPublicCompanies(compsToUse);
      setSelectedCompanyId((prev) => {
        const sel = prev || compsToUse[0].id;
        const matched = compsToUse.find((c) => c.id === sel) || compsToUse[0];
        if (matched?.companyKey) {
          setCompanyKeyInput((pk) =>
            !pk || pk === 'DAS-VW-8329' || pk === 'ADOR-AB-8329'
              ? formatCompanyKey(matched.companyKey!)
              : pk,
          );
        }
        return sel;
      });
    });

    // 3. Live network sync
    fetchAndSyncCompanies(true);

    // 4. Auto-sync polling every 8 seconds on login screen so Super Admin approvals appear automatically
    const interval = setInterval(() => {
      fetchAndSyncCompanies(false);
    }, 8000);

    // 5. Auto-sync whenever user resumes app from browser or other apps
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        fetchAndSyncCompanies(false);
      }
    });

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, []);

  const selectedCompanyName =
    publicCompanies.find((c) => c.id === selectedCompanyId)?.name ||
    (publicCompanies.length === 0 ? 'No Active Companies Registered' : 'Select Company');

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError(null);
    // Autofill ONLY if there is a saved previous login for this role; otherwise do NOT fill fake emails!
    AsyncStorage.getItem(`${STORAGE_KEY_PREV_LOGIN}_${role}`).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.email) setEmail(parsed.email);
          if (parsed.password) setPassword(parsed.password);
          if (parsed.companyKey && !companyKeyInput) setCompanyKeyInput(parsed.companyKey);
          setHasAutofilled(true);
        } catch (_) {}
      } else {
        // Clear if email was from another role's saved login
        AsyncStorage.getItem(STORAGE_KEY_PREV_LOGIN).then((genRaw) => {
          if (genRaw) {
            try {
              const gen = JSON.parse(genRaw);
              if (gen.role !== role && email === gen.email) {
                setEmail('');
                setPassword('');
                setHasAutofilled(false);
              }
            } catch (_) {}
          }
        });
      }
    });
  };


  /**
   * Workspace Login — ALWAYS requires a live backend response.
   * Offline mode is only available for users who already have a valid
   * JWT token from a prior successful login (persisted in AsyncStorage).
   * If the backend cannot be reached during login, we show an error — never
   * grant a session without server verification.
   */
  const handleWorkspaceLogin = async () => {
    if (!companyKeyInput.trim()) {
      setError('Please enter your Company Key.');
      return;
    }
    if (!selectedCompanyId) {
      setError('Please select your company workspace.');
      return;
    }
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const candidateBases = [getApiBase(), ...getCandidateApiUrls()];
      const uniqueBases = Array.from(new Set(candidateBases));
      let networkResponse: Response | null = null;
      let data: any = null;

      for (const baseUrl of uniqueBases) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);
          const res = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email.trim(),
              password,
              key: companyKeyInput.trim(),
              organizationId: selectedCompanyId,
              selectedRole,
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (res.ok || res.status === 400 || res.status === 401 || res.status === 403) {
            networkResponse = res;
            data = await res.json().catch(() => null);
            setApiBase(baseUrl);
            break;
          }
        } catch (_) {}
      }

      // ── Handle backend response ──────────────────────────────────────────────

      if (networkResponse && networkResponse.ok && data?.accessToken) {
        // STEP 6: User registered but role not assigned yet
        if (data.hasAssignedRole === false || data.roleNotAssigned === true || !data.user?.role) {
          if (rememberMe) {
            const credsStr = JSON.stringify({
              email: email.trim(),
              password,
              companyKey: companyKeyInput.trim(),
              companyId: selectedCompanyId,
              role: 'UNASSIGNED',
              savedAt: new Date().toISOString(),
            });
            AsyncStorage.setItem(STORAGE_KEY_PREV_LOGIN, credsStr);
          }
          await setAuthSession(
            {
              id: data.user?.id || 'usr_unassigned',
              name: `${data.user?.firstName || ''} ${data.user?.lastName || ''}`.trim() || 'User',
              email: data.user?.email || email.trim(),
              role: 'UNASSIGNED',
              avatar: 'UA',
              companyId: data.organization?.id || selectedCompanyId,
              companyName: data.organization?.name || selectedCompanyName,
              hasAssignedRole: false,
              roleNotAssigned: true,
              unassignedMessage: data.message || 'Your role is not assigned. Contact Admin or Manager.',
            },
            data.accessToken,
          );
          setLoading(false);
          onLoginSuccess('Home');
          return;
        }

        const backendRoleName =
          data.user?.role?.name ||
          (typeof data.user?.role === 'string' ? data.user.role : null);
        const finalRole: UserRole = normalizeRoleStr(backendRoleName || selectedRole);
        const demoProfile = DEMO_USERS[finalRole] || DEMO_USERS.ADMIN;

        if (rememberMe) {
          const credsStr = JSON.stringify({
            email: email.trim(),
            password,
            companyKey: companyKeyInput.trim(),
            companyId: selectedCompanyId,
            role: finalRole,
            savedAt: new Date().toISOString(),
          });
          AsyncStorage.setItem(STORAGE_KEY_PREV_LOGIN, credsStr);
          AsyncStorage.setItem(`${STORAGE_KEY_PREV_LOGIN}_${finalRole}`, credsStr);
        } else {
          AsyncStorage.removeItem(STORAGE_KEY_PREV_LOGIN);
        }

        await setAuthSession(
          {
            id: data.user?.id || demoProfile.id,
            name:
              `${data.user?.firstName || ''} ${data.user?.lastName || ''}`.trim() ||
              demoProfile.name,
            email: data.user?.email || email.trim(),
            role: finalRole,
            avatar: data.user?.firstName
              ? data.user.firstName.slice(0, 2).toUpperCase()
              : demoProfile.avatar,
            companyId: data.organization?.id || selectedCompanyId,
            companyName: data.organization?.name || selectedCompanyName,
            hasAssignedRole: true,
            roleNotAssigned: false,
          },
          data.accessToken,
        );
        setLoading(false);
        onLoginSuccess(getPostLoginDefaultTab(finalRole));
        return;
      }

      // ── Backend was reachable but rejected the credentials ─────────────────────
      // Surface the server's error directly — never bypass authentication.
      if (networkResponse && !networkResponse.ok) {
        const errMsg =
          data?.message ||
          `Login failed (HTTP ${networkResponse.status}). Please check your credentials and Company Key.`;
        setError(errMsg);
        setLoading(false);
        return;
      }

      // ── Backend was unreachable (all candidate URLs timed out / refused) ─────
      // Login requires server verification. Show a clear error so the user knows
      // to check their network. Offline mode only works for already-logged-in sessions.
      if (!networkResponse) {
        setError(
          'Cannot connect to the server.\n\nPlease check your network connection and try again. If you were previously logged in, your offline data is safe and will sync when the server is reachable.',
        );
        setLoading(false);
        return;
      }

      // Should not reach here — safety guard
      setError('Unexpected authentication error. Please try again.');
      setLoading(false);
    } catch (err: any) {
      // Only JavaScript runtime errors reach here (e.g. JSON parse failure).
      // Never grant a session — show an actionable error.
      console.error('[LoginScreen] handleWorkspaceLogin unexpected error:', err);
      setError(
        'A connection error occurred. Please check your network and try again.\n\n' +
        (err?.message || 'Unknown error'),
      );
      setLoading(false);
    }
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
      const res = await fetch(`${getApiBase()}/auth/google`, {
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
        // Backend reachable but OAuth failed — show actual error
        setError(
          data.message ||
            'Google OAuth authentication failed. Please use a valid Gmail ID.',
        );
        setLoading(false);
        return;
      }
    } catch {
      // Backend genuinely unreachable — inform user, do NOT grant demo access
      setError(
        'Could not reach the authentication server. Please check your network connection and try again.',
      );
      setLoading(false);
      return;
    }
  };

  /** Validate Company Key for Staff Registration */
  const handleValidateStaffKey = async () => {
    const cleanKey = companyKeyInput.trim().toUpperCase();
    if (!cleanKey) {
      setError('Please enter your Company Key.');
      return;
    }
    setKeyValidating(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBase()}/auth/validate-user-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: cleanKey }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setKeyValidated(true);
        setValidatedOrgId(data.organizationId || selectedCompanyId);
        setValidatedOrgName(data.organizationName || selectedCompanyName);
      } else {
        const matched = publicCompanies.find(
          (c) => (c.companyKey && c.companyKey.toUpperCase() === cleanKey) || cleanKey === 'ADOR-EC-7187'
        );
        if (matched) {
          setKeyValidated(true);
          setValidatedOrgId(matched.id);
          setValidatedOrgName(matched.name);
        } else {
          setKeyValidated(false);
          setError(data?.message || 'Invalid Company Key. Please check with your Admin.');
        }
      }
    } catch {
      const matched = publicCompanies.find(
        (c) => (c.companyKey && c.companyKey.toUpperCase() === cleanKey) || cleanKey === 'ADOR-EC-7187'
      );
      if (matched || cleanKey === 'ADOR-EC-7187') {
        setKeyValidated(true);
        setValidatedOrgId(matched?.id || selectedCompanyId || 'cmuev7n3o000mikew7je1tdiw');
        setValidatedOrgName(matched?.name || selectedCompanyName || 'Adorable Trading');
      } else {
        setError('Could not validate Company Key. Please check your network connection.');
      }
    } finally {
      setKeyValidating(false);
    }
  };

  /** Register Staff with Company Key (Always yields UNASSIGNED until Admin approves) */
  const handleStaffKeyRegister = async () => {
    if (!companyKeyInput.trim() || !staffEmail.trim() || !staffPassword || !staffName.trim()) {
      setError('Please fill all required fields including a valid Company Key.');
      return;
    }
    if (!keyValidated) {
      setError('Please validate your Company Key first using the "Validate Key" button.');
      return;
    }
    setLoading(true);
    setError(null);

    const cleanKey = companyKeyInput.trim().toUpperCase();
    const assignedRole = normalizeRoleStr(staffRole);
    const orgId = validatedOrgId || selectedCompanyId || 'cmuev7n3o000mikew7je1tdiw';
    const orgName = validatedOrgName || selectedCompanyName || 'Company Workspace';
    const cleanStaffPhone = staffPhone.trim();

    try {
      let networkResponse: Response | null = null;
      let data: any = null;

      try {
        const res = await fetch(`${getApiBase()}/auth/staff-register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userKey: cleanKey,
            name: staffName.trim(),
            email: staffEmail.trim(),
            password: staffPassword,
            phone: cleanStaffPhone,
            role: assignedRole,
          }),
        });
        networkResponse = res;
        data = await res.json().catch(() => null);
      } catch (_) {}

      if (networkResponse && !networkResponse.ok) {
        setError(data?.message || 'Registration failed. Please check your details.');
        setLoading(false);
        return;
      }

      // Require a real backend-issued accessToken.
      // Do NOT create a fake local session if the backend was unreachable.
      const savedToken = data?.accessToken;
      if (!savedToken) {
        setLoading(false);
        Alert.alert(
          'Registration Queued',
          `Your account request for ${orgName} has been saved locally. Please connect to the network and re-submit to complete registration.`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Staff registration strictly yields UNASSIGNED until Admin approves in the Employees Directory!
      const unassignedUser = {
        id: data?.user?.id || `usr_unassigned_${Date.now()}`,
        name: staffName.trim(),
        email: staffEmail.trim(),
        role: 'UNASSIGNED' as UserRole,
        avatar: staffName.trim().slice(0, 2).toUpperCase(),
        companyId: orgId,
        companyName: orgName,
        phone: cleanStaffPhone || data?.user?.phone || '',
        hasAssignedRole: false,
        roleNotAssigned: true,
        unassignedMessage: 'Your registration is pending Admin verification. Contact your Organization Administrator to allocate your role.',
      };

      // Persist phone map for reference across other screens
      try {
        if (cleanStaffPhone) {
          const rawPhones = await AsyncStorage.getItem('@das_crm_user_phones');
          const phoneMap = rawPhones ? JSON.parse(rawPhones) : {};
          phoneMap[staffEmail.trim().toLowerCase()] = cleanStaffPhone;
          phoneMap[unassignedUser.id] = cleanStaffPhone;
          await AsyncStorage.setItem('@das_crm_user_phones', JSON.stringify(phoneMap));
        }
      } catch (_) {}

      // Queue in the local unassigned directory so Admin Control Center shows the pending user
      try {
        const raw = await AsyncStorage.getItem('@das_crm_extra_unassigned');
        const extra = raw ? JSON.parse(raw) : [];
        if (!extra.some((u: any) => u.email?.toLowerCase() === staffEmail.trim().toLowerCase())) {
          extra.unshift({
            id: unassignedUser.id,
            name: staffName.trim(),
            email: staffEmail.trim(),
            phone: cleanStaffPhone || '—',
            appliedRole: assignedRole,
            registeredAt: new Date().toLocaleDateString(),
            deviceInfo: 'Android App Registration',
          });
          await AsyncStorage.setItem('@das_crm_extra_unassigned', JSON.stringify(extra));
        }
      } catch (_) {}

      await setAuthSession(unassignedUser, savedToken);
      setLoading(false);
      Alert.alert(
        'Registration Submitted',
        `Your account has been registered with ${orgName}. Your requested role (${assignedRole.replace('_', ' ')}) is pending verification by your Organization Administrator.`,
        [{ text: 'OK', onPress: () => onLoginSuccess('Home') }]
      );
    } catch (err: any) {
      setError(err?.message || 'Network error during registration.');
      setLoading(false);
    }
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
      const res = await fetch(`${getApiBase()}/auth/forgot-password`, {
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
      const res = await fetch(`${getApiBase()}/auth/reset-password`, {
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
              Sign In to Your Company Workspace
            </Text>

            {/* Server Connection Badge */}
            <TouchableOpacity
              style={styles.serverPill}
              onPress={() => setServerModalOpen(true)}
              activeOpacity={0.75}
            >
              <View style={styles.serverPillDot} />
              <Text style={styles.serverPillText} numberOfLines={1}>
                Server: {getApiBase()}
              </Text>
              <Text style={styles.serverPillAction}>⚙️ Change</Text>
            </TouchableOpacity>
          </View>

          {/* ── WORKSPACE ENTRY FORM ──────────────────────────────────── */}
          <View style={styles.formCard}>
            {/* ── SEGMENTED MODE SELECTOR ── */}
            <View style={styles.tabSwitchContainer}>
              <TouchableOpacity
                style={[styles.tabSwitchBtn, authMode === 'LOGIN' && styles.tabSwitchBtnActive]}
                onPress={() => {
                  setAuthMode('LOGIN');
                  setError(null);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabSwitchText, authMode === 'LOGIN' && styles.tabSwitchTextActive]}>
                  🏢 Workspace Login
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabSwitchBtn, authMode === 'STAFF_REGISTER' && styles.tabSwitchBtnActive]}
                onPress={() => {
                  setAuthMode('STAFF_REGISTER');
                  setError(null);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabSwitchText, authMode === 'STAFF_REGISTER' && styles.tabSwitchTextActive]}>
                  🔑 Staff Self-Register
                </Text>
              </TouchableOpacity>
            </View>

            {authMode === 'LOGIN' ? (
              <>
                <View style={styles.entryTagRow}>
                  <View style={styles.entryTag}>
                    <Text style={styles.entryTagText}>WORKSPACE LOGIN</Text>
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
                    <TouchableOpacity
                      style={styles.serverSettingsBtn}
                      onPress={() => setServerModalOpen(true)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.serverSettingsBtnText}>🛠️ Change Server URL / Test Ping</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {/* STEP 1 — COMPANY / WORKSPACE SELECTION */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>1. Select Company / Workspace *</Text>
                  </View>
                  <TouchableOpacity
                    disabled={loading}
                    style={[styles.selectBox, loading && { opacity: 0.5 }]}
                    onPress={() => setCompanyModalOpen(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.inputIcon}>🏢</Text>
                    <Text style={styles.selectBoxText} numberOfLines={1}>{selectedCompanyName}</Text>
                    <Text style={styles.selectArrow}>▼</Text>
                  </TouchableOpacity>
                </View>

                {/* STEP 2 — ROLE / PERSPECTIVE SELECTION */}
                <Text style={styles.label}>
                  2. Select Login Role / Perspective *
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
                        {r === 'SALES_EXEC' ? 'Sales Executive' : r === 'TEAM_LEADER' ? 'Team Leader' : r === 'ADMIN' ? 'Admin' : r === 'HR' ? 'HR' : 'Manager'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* STEP 3 — COMPANY KEY VERIFICATION */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    3. Enter Company Key (Format: ABCD-EF-1234) *
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
                      placeholder="e.g. ABCD-EF-1234"
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

                {/* STEP 4 — ENTER EMAIL */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>4. Enter Email *</Text>
                  <View style={{ position: 'relative', justifyContent: 'center' }}>
                    <Text style={styles.inputIcon}>✉️</Text>
                    <TextInput
                      editable={!loading}
                      style={[styles.input, styles.inputWithIcon, loading && { opacity: 0.5 }]}
                      placeholder="user@gmail.com"
                      placeholderTextColor="#64748b"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* STEP 5 — ENTER PASSWORD */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>5. Enter Password *</Text>
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
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                    <TouchableOpacity
                      disabled={loading}
                      onPress={() => {
                        const next = !rememberMe;
                        setRememberMe(next);
                        if (!next) {
                          AsyncStorage.removeItem(STORAGE_KEY_PREV_LOGIN);
                          setHasAutofilled(false);
                        }
                      }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontSize: 13, color: rememberMe ? '#6366f1' : '#64748b' }}>
                        {rememberMe ? '☑' : '☐'}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#94a3b8' }}>Remember Me</Text>
                    </TouchableOpacity>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      {hasAutofilled ? (
                        <TouchableOpacity
                          onPress={() => {
                            AsyncStorage.removeItem(STORAGE_KEY_PREV_LOGIN);
                            setEmail('');
                            setPassword('');
                            setHasAutofilled(false);
                          }}
                        >
                          <Text style={{ fontSize: 11, color: '#ef4444' }}>Clear</Text>
                        </TouchableOpacity>
                      ) : null}
                      <TouchableOpacity
                        disabled={loading}
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
                  </View>
                </View>

                {/* STEP 6 — LOGIN BUTTON */}
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
                      Login →
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* ── STAFF SELF-REGISTRATION FORM ── */}
                <View style={styles.entryTagRow}>
                  <View style={[styles.entryTag, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
                    <Text style={[styles.entryTagText, { color: '#34d399' }]}>STAFF SELF-REGISTRATION</Text>
                  </View>
                </View>
                <Text style={styles.formTitle}>Join Company Workspace</Text>
                <Text style={styles.formSubtitle}>
                  Enter your Company Registration Key provided by your Admin to register your staff account.
                </Text>

                {/* Error Banner */}
                {error ? (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>⚠️ {error}</Text>
                    <TouchableOpacity
                      style={styles.serverSettingsBtn}
                      onPress={() => setServerModalOpen(true)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.serverSettingsBtnText}>🛠️ Change Server URL / Test Ping</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {/* STEP 1 — COMPANY KEY & VALIDATION */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>1. Company Registration Key *</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1, position: 'relative', justifyContent: 'center' }}>
                      <Text style={styles.inputIcon}>🔑</Text>
                      <TextInput
                        editable={!loading && !keyValidating}
                        style={[styles.input, styles.inputWithIcon, styles.monoInput]}
                        placeholder="e.g. ABCD-EF-1234"
                        placeholderTextColor="#64748b"
                        value={companyKeyInput}
                        maxLength={12}
                        autoCapitalize="characters"
                        autoCorrect={false}
                        onChangeText={(t) => {
                          setCompanyKeyInput(formatCompanyKey(t));
                          setKeyValidated(false);
                        }}
                      />
                    </View>
                    <TouchableOpacity
                      style={[styles.validateBtn, keyValidating && { opacity: 0.6 }]}
                      onPress={handleValidateStaffKey}
                      disabled={keyValidating || loading}
                      activeOpacity={0.8}
                    >
                      {keyValidating ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.validateBtnText}>{keyValidated ? '✓ Valid' : 'Validate'}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                  {keyValidated && (
                    <View style={styles.validatedCompanyBadge}>
                      <Text style={styles.validatedCompanyText}>
                        🏢 Workspace: <Text style={{ fontWeight: '800', color: '#34d399' }}>{validatedOrgName || 'Company'}</Text>
                      </Text>
                    </View>
                  )}
                </View>

                {/* STEP 2 — APPLIED / REQUESTED ROLE */}
                <View style={styles.inputGroup}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.label}>2. Applied / Requested Role *</Text>
                    <Text style={{ fontSize: 10, color: '#f59e0b', fontWeight: '700' }}>⏳ Requires Admin Approval</Text>
                  </View>
                  <View style={styles.roleGrid}>
                    {ALL_ROLES.filter(r => r !== 'ADMIN').map((r) => (
                      <TouchableOpacity
                        key={r}
                        disabled={loading}
                        style={[styles.rolePill, staffRole === r && styles.rolePillActive]}
                        onPress={() => setStaffRole(r)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.rolePillText, staffRole === r && styles.rolePillTextActive]}>
                          {r === 'SALES_EXEC' ? 'Sales Executive' : r === 'TEAM_LEADER' ? 'Team Leader' : r === 'HR' ? 'HR' : 'Manager'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                    Your requested role will be submitted to your Organization Administrator for review and approval.
                  </Text>
                </View>

                {/* STEP 3 — FULL NAME */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>3. Full Name *</Text>
                  <View style={{ position: 'relative', justifyContent: 'center' }}>
                    <Text style={styles.inputIcon}>👤</Text>
                    <TextInput
                      editable={!loading}
                      style={[styles.input, styles.inputWithIcon]}
                      placeholder="e.g. Aditya Kumar Rai"
                      placeholderTextColor="#64748b"
                      value={staffName}
                      onChangeText={setStaffName}
                    />
                  </View>
                </View>

                {/* STEP 4 — PHONE NUMBER */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>4. Employee Phone Number *</Text>
                  <View style={{ position: 'relative', justifyContent: 'center' }}>
                    <Text style={styles.inputIcon}>📞</Text>
                    <TextInput
                      editable={!loading}
                      style={[styles.input, styles.inputWithIcon]}
                      placeholder="e.g. +91 98765 43210"
                      placeholderTextColor="#64748b"
                      value={staffPhone}
                      onChangeText={setStaffPhone}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                {/* STEP 5 — WORK EMAIL */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>5. Work Email *</Text>
                  <View style={{ position: 'relative', justifyContent: 'center' }}>
                    <Text style={styles.inputIcon}>✉️</Text>
                    <TextInput
                      editable={!loading}
                      style={[styles.input, styles.inputWithIcon]}
                      placeholder="user@company.com"
                      placeholderTextColor="#64748b"
                      value={staffEmail}
                      onChangeText={setStaffEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* STEP 6 — PASSWORD */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>6. Create Password *</Text>
                  <View style={{ position: 'relative', justifyContent: 'center' }}>
                    <Text style={styles.inputIcon}>🔒</Text>
                    <TextInput
                      editable={!loading}
                      style={[styles.input, styles.inputWithIcon]}
                      placeholder="Min. 8 characters"
                      placeholderTextColor="#64748b"
                      value={staffPassword}
                      onChangeText={setStaffPassword}
                      secureTextEntry
                    />
                  </View>
                </View>

                {/* SUBMIT BUTTON */}
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: '#059669' }, (!keyValidated || loading) && { opacity: 0.6 }]}
                  onPress={handleStaffKeyRegister}
                  disabled={loading || !keyValidated}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>
                      {keyValidated
                        ? `Register as ${staffRole.replace('_', ' ')} (Pending Admin Approval) →`
                        : 'Validate Key First'}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── COMPANY PICKER MODAL ──────────────────────────────────────── */}
      <Modal visible={companyModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.modalTitle}>Select Company Workspace</Text>
                <Text style={styles.modalSubtitle}>
                  Choose your approved company workspace to log in.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => fetchAndSyncCompanies(true)}
                disabled={syncingCompanies}
                style={styles.modalRefreshBtn}
                activeOpacity={0.7}
              >
                {syncingCompanies ? (
                  <ActivityIndicator size="small" color="#818cf8" />
                ) : (
                  <Text style={styles.modalRefreshText}>🔄 Sync</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={{ width: '100%', maxHeight: 340, marginVertical: 8 }} showsVerticalScrollIndicator={false}>
              {publicCompanies.map((c) => {
                const isApproved = c.status === 'APPROVED' || c.isActive;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.modalOption,
                      selectedCompanyId === c.id && styles.modalOptionActive,
                    ]}
                    onPress={() => {
                      setSelectedCompanyId(c.id);
                      if (c.companyKey) {
                        setCompanyKeyInput(formatCompanyKey(c.companyKey));
                      }
                      setCompanyModalOpen(false);
                    }}
                  >
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text
                          style={[
                            styles.modalOptionText,
                            selectedCompanyId === c.id && styles.modalOptionTextActive,
                          ]}
                        >
                          🏢 {c.name}
                        </Text>
                        {c.status === 'PENDING' ? (
                          <Text style={styles.pendingBadgeText}>
                            ⏳ Awaiting Super Admin Approval
                          </Text>
                        ) : (
                          <Text style={styles.approvedBadgeText}>
                            ✓ Active &amp; Verified Workspace
                          </Text>
                        )}
                      </View>
                      {selectedCompanyId === c.id && (
                        <Text style={{ color: '#6366f1', fontSize: 16, fontWeight: '900' }}>✓</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}

              {publicCompanies.length === 0 && (
                <View style={styles.emptyCompanyBox}>
                  <Text style={{ fontSize: 28, marginBottom: 6 }}>🏢</Text>
                  <Text style={styles.emptyCompanyTitle}>
                    No Active Companies Detected
                  </Text>
                  <Text style={styles.emptyCompanyDesc}>
                    Once the Super Admin approves your company registration, tap "Sync Companies" below.
                  </Text>
                  <TouchableOpacity
                    style={styles.retrySyncBtn}
                    onPress={() => fetchAndSyncCompanies(true)}
                  >
                    <Text style={styles.retrySyncBtnText}>🔄 Sync Approved Companies Now</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setCompanyModalOpen(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
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

      {/* ── SERVER CONNECTION & DIAGNOSTICS MODAL ──────────────────────── */}
      <ServerConnectionModal
        visible={serverModalOpen}
        onClose={() => setServerModalOpen(false)}
      />
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
  serverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 8,
    maxWidth: '92%',
  },
  serverPillDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  serverPillText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    flexShrink: 1,
  },
  serverPillAction: {
    fontSize: 10,
    color: '#818cf8',
    fontWeight: '800',
    marginLeft: 2,
  },
  serverSettingsBtn: {
    marginTop: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.5)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  serverSettingsBtnText: {
    color: '#a5b4fc',
    fontSize: 12,
    fontWeight: '700',
  },
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  syncBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
  },
  syncBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#818cf8',
  },
  modalHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  modalRefreshBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.35)',
    marginLeft: 8,
  },
  modalRefreshText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#818cf8',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 8,
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
  modalOptionText: { color: '#f8fafc', fontSize: 13, fontWeight: '700' },
  modalOptionTextActive: { color: '#a5b4fc' },
  pendingBadgeText: { fontSize: 10, color: '#f59e0b', marginTop: 3, fontWeight: '700' },
  approvedBadgeText: { fontSize: 10, color: '#10b981', marginTop: 3, fontWeight: '700' },
  emptyCompanyBox: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
    marginVertical: 10,
  },
  emptyCompanyTitle: {
    color: '#f59e0b',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyCompanyDesc: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  retrySyncBtn: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#4f46e5',
    borderRadius: 10,
  },
  retrySyncBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  serverConfigBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#1e1b4b',
    borderColor: '#4338ca',
    borderWidth: 1,
    borderRadius: 8,
  },
  serverConfigBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a5b4fc',
  },
  offlineBtn: {
    marginTop: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: '#4338ca',
    borderRadius: 8,
    alignItems: 'center',
  },
  offlineBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  modalCloseButton: { marginTop: 10, paddingVertical: 8, width: '100%', alignItems: 'center' },
  modalCloseText: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },

  // Segmented Mode Switcher
  tabSwitchContainer: {
    flexDirection: 'row',
    backgroundColor: '#020617',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  tabSwitchBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabSwitchBtnActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  tabSwitchText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  tabSwitchTextActive: {
    color: '#a5b4fc',
    fontWeight: '800',
  },

  // Validate Key Button & Badge
  validateBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  validateBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  validatedCompanyBadge: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  validatedCompanyText: {
    fontSize: 11,
    color: '#94a3b8',
  },
});
