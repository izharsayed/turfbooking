import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { apiFetch } from '../utils/api';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();

  const safeRedirect = (path: string) => {
    setTimeout(() => {
      try {
        router.replace(path as any);
      } catch (err) {
        console.warn('Redirect failed, retrying...', err);
        setTimeout(() => router.replace(path as any), 300);
      }
    }, 100);
  };

  const theme = {
    bg: isDarkMode ? '#030712' : '#f8fafc',
    card: isDarkMode ? 'rgba(15, 23, 42, 0.65)' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#cbd5e1',
    inputBg: isDarkMode ? '#030712' : '#ffffff',
    bgImageOpacity: isDarkMode ? 0.35 : 0.22,
    overlayBg: isDarkMode ? 'rgba(3, 7, 18, 0.5)' : 'rgba(248, 250, 252, 0.6)',
  };

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('otp');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [devDropdownOpen, setDevDropdownOpen] = useState(false);

  // ── Dummy accounts for quick dev testing ──────────────────────────────
  const DUMMY_ACCOUNTS = [
    { label: '👤 Customer', phone: '9876543210', email: 'customer@turfbook.com', password: 'password', role: 'CUSTOMER',    name: 'Demo Customer' },
    { label: '🏟️ Owner',    phone: '9999988888', email: 'owner@turfbook.com',    password: 'password',    role: 'TURF_OWNER', name: 'Ahmednagar Sports Arena' },
  ];

  const applyDummyLogin = async (account: typeof DUMMY_ACCOUNTS[0]) => {
    // Helper to fetch with timeout
    const fetchWithTimeout = async (path: string, options: any, timeoutMs = 1500) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await apiFetch(path, {
          ...options,
          signal: controller.signal,
        });
        clearTimeout(id);
        return res;
      } catch (err) {
        clearTimeout(id);
        throw err;
      }
    };

    try {
      // 1. Try real login via email/password backend route (password is 'password' for seeded users)
      const res = await fetchWithTimeout('/auth/login', {
        method: 'POST',
        body: { email: account.email, password: 'password' },
      }, 1500);

      if (res.success && res.data) {
        login(
          {
            id: res.data.user.id,
            email: res.data.user.email,
            name: `${res.data.user.profile?.firstName || ''} ${res.data.user.profile?.lastName || ''}`.trim() || res.data.user.name || account.name,
            phone: res.data.user.phone,
            role: res.data.user.role,
          },
          res.data.accessToken
        );
        setDevDropdownOpen(false);
        safeRedirect(res.data.user.role === 'TURF_OWNER' ? '/owner' : '/');
        return;
      }
    } catch (e) {
      console.log('Real dev login failed or timed out, falling back to bypass mode', e);
    }

    // Offline / Backend Unavailable Fallback: Directly set store state
    login(
      {
        id: `dev-${account.role.toLowerCase()}`,
        email: account.email,
        name: account.name,
        phone: account.phone,
        role: account.role,
      },
      'dev-token-bypass'
    );
    setDevDropdownOpen(false);
    safeRedirect(account.role === 'TURF_OWNER' ? '/owner' : '/');
  };
  // ─────────────────────────────────────────────────────────────────────


  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }
    try {
      await apiFetch('/auth/send-otp', {
        method: 'POST',
        body: { phone },
      });
      Alert.alert('OTP Dispatched', `💬 SMS OTP Sent to +91 ${phone}. Check the backend server console log to see the code.`);
      setOtpSent(true);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to dispatch OTP. Make sure phone number is registered or use Email/Password.');
    }
  };

  const handleSubmit = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    if (isRegisterMode) {
      if (!name) {
        Alert.alert('Error', 'Please enter your name');
        return;
      }
      
      const generatedEmail = `${phone}@turfbook.com`;
      const generatedPassword = `TurfBookPass@123`;

      const [firstName, ...lastNameParts] = name.trim().split(' ');
      const lastName = lastNameParts.join(' ') || ' ';

      try {
        const payload = {
          firstName,
          lastName,
          email: generatedEmail,
          phone,
          password: generatedPassword,
          acceptTerms: true,
        };
        await apiFetch('/auth/register', {
          method: 'POST',
          body: payload,
        });

        // Automatically log them in after registration
        const loginRes = await apiFetch('/auth/login', {
          method: 'POST',
          body: { email: generatedEmail, password: generatedPassword },
        });

        login(
          {
            id: loginRes.data.user.id,
            email: loginRes.data.user.email,
            name: `${loginRes.data.user.profile?.firstName || ''} ${loginRes.data.user.profile?.lastName || ''}`.trim() || loginRes.data.user.name || 'User',
            phone: loginRes.data.user.phone,
            role: loginRes.data.user.role,
          },
          loginRes.data.accessToken
        );
        safeRedirect(loginRes.data.user.role === 'TURF_OWNER' ? '/owner' : '/');
      } catch (e: any) {
        Alert.alert('Registration Failed', e.message || 'Something went wrong.');
      }
    } else {
      if (loginMethod === 'otp') {
        if (!otpSent) {
          handleSendOtp();
          return;
        }
        try {
          const res = await apiFetch('/auth/verify-otp', {
            method: 'POST',
            body: { phone, code: otp },
          });
          login(
            {
              id: res.data.user.id,
              email: res.data.user.email,
              name: `${res.data.user.profile?.firstName || ''} ${res.data.user.profile?.lastName || ''}`.trim() || res.data.user.name || 'User',
              phone: res.data.user.phone,
              role: res.data.user.role,
            },
            res.data.accessToken
          );
          safeRedirect(res.data.user.role === 'TURF_OWNER' ? '/owner' : '/');
        } catch (e: any) {
          Alert.alert('OTP Verification Failed', e.message || 'Invalid or expired OTP');
        }
      } else {
        if (!password) {
          Alert.alert('Error', 'Please enter your password');
          return;
        }
        try {
          const emailStr = email || `${phone}@turfbook.com`;
          const res = await apiFetch('/auth/login', {
            method: 'POST',
            body: { email: emailStr, password },
          });
          login(
            {
              id: res.data.user.id,
              email: res.data.user.email,
              name: `${res.data.user.profile?.firstName || ''} ${res.data.user.profile?.lastName || ''}`.trim() || res.data.user.name || 'User',
              phone: res.data.user.phone,
              role: res.data.user.role,
            },
            res.data.accessToken
          );
          safeRedirect(res.data.user.role === 'TURF_OWNER' ? '/owner' : '/');
        } catch (e: any) {
          Alert.alert('Login Failed', e.message || 'Invalid email or password');
        }
      }
    }
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setOtpSent(false);
    setOtp('');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Image
        source={require('../assets/turf-bg.jpg')}
        style={[styles.backgroundImage as any, { opacity: theme.bgImageOpacity }]}
        resizeMode="cover"
      />
      <View style={[styles.overlay, { backgroundColor: theme.overlayBg }]} />

      <TouchableOpacity
        onPress={toggleTheme}
        style={{
          position: 'absolute',
          top: insets.top + 10,
          right: 20,
          width: 42,
          height: 42,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: theme.border,
          backgroundColor: theme.card,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
        activeOpacity={0.7}
      >
        <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={20} color={isDarkMode ? '#fbbf24' : '#6366f1'} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand */}
        <View style={styles.brand}>
          <View style={[styles.logoBadgeContainer, { borderColor: theme.border }]}>
            <View style={[styles.logoBadgeInner, { backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.08)' }]}>
              <MaterialCommunityIcons name="soccer" size={28} color="#10b981" />
            </View>
          </View>
          <Text style={[styles.brandName, { color: theme.text }]}>TurfBook</Text>
          <Text style={styles.brandTagline}>Book your game. Own the pitch.</Text>
        </View>

        {/* ── Dev Quick Login Dropdown ─────────────────────── */}
        <TouchableOpacity
          style={[styles.devBar, { backgroundColor: isDarkMode ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.3)' }]}
          onPress={() => setDevDropdownOpen(!devDropdownOpen)}
          activeOpacity={0.75}
        >
          <MaterialCommunityIcons name="test-tube" size={14} color="#6366f1" />
          <Text style={styles.devBarText}>Dev Quick Login</Text>
          <MaterialCommunityIcons
            name={devDropdownOpen ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#6366f1"
            style={{ marginLeft: 'auto' }}
          />
        </TouchableOpacity>

        {devDropdownOpen && (
          <View style={[styles.devDropdown, { backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', borderColor: 'rgba(99,102,241,0.25)' }]}>
            {DUMMY_ACCOUNTS.map((acct) => (
              <TouchableOpacity
                key={acct.role}
                style={[styles.devAccountRow, { borderBottomColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]}
                onPress={() => applyDummyLogin(acct)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.devAccountLabel, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>{acct.label}</Text>
                  <Text style={[styles.devAccountEmail, { color: '#6366f1' }]}>📱 {acct.phone} · Instant bypass</Text>
                </View>
                <View style={[styles.devFillBtn, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
                  <Text style={styles.devFillBtnText}>Fill</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {/* ─────────────────────────────────────────────────── */}

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>
            {isRegisterMode ? 'Create Account' : 'Welcome Back'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            {isRegisterMode
              ? 'Sign up to start booking turfs'
              : 'Sign in to continue to your bookings'}
          </Text>

          <View style={{ gap: 14, marginTop: 16 }}>
            {/* Register: Name */}
            {isRegisterMode && (
              <View>
                <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>FULL NAME</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor={theme.textMuted}
                  style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                />
              </View>
            )}

            {/* Phone */}
            <View>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>PHONE NUMBER</Text>
              <View style={styles.phoneInputRow}>
                <View style={[styles.phoneCodeContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                  <Text style={styles.phoneCodeText}>+91</Text>
                </View>
                <TextInput
                  value={phone}
                  onChangeText={(val) => setPhone(val.replace(/[^0-9]/g, ''))}
                  placeholder="9876543210"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="phone-pad"
                  maxLength={10}
                  style={[styles.phoneInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                />
              </View>
            </View>

            {/* OTP Code */}
            {!isRegisterMode && otpSent && (
              <View>
                <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>6-DIGIT OTP CODE</Text>
                <TextInput
                  value={otp}
                  onChangeText={(val) => setOtp(val.replace(/[^0-9]/g, ''))}
                  placeholder="------"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={[styles.input, styles.otpInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                />
              </View>
            )}
          </View>

          {/* Submit */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>
              {isRegisterMode
                ? 'Sign Up & Create Account'
                : otpSent
                  ? 'Verify & Login'
                  : 'Send Verification OTP'}
            </Text>
          </TouchableOpacity>

          {/* Mode toggle */}
          <TouchableOpacity onPress={toggleMode} style={styles.modeToggleContainer}>
            <Text style={[styles.modeToggleText, { color: theme.textMuted }]}>
              {isRegisterMode ? 'Already registered? ' : "Don't have an account? "}
              <Text style={styles.modeToggleHighlight}>
                {isRegisterMode ? 'Login' : 'Sign Up'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Guest browse */}
        <TouchableOpacity onPress={() => safeRedirect('/')} style={styles.guestButton}>
          <Text style={[styles.guestButtonText, { color: theme.textMuted }]}>Continue as guest →</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  backgroundImage: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.18,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(3, 7, 18, 0.65)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
  },
  brand: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadgeContainer: {
    width: 64,
    height: 64,
    borderRadius: 22,
    borderWidth: 2,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoBadgeInner: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 2,
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.15)',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#030712',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.1)',
  },
  authTabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#10b981',
  },
  authTabButtonText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
  },
  tabButtonTextActive: {
    color: '#030712',
  },
  fieldLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 1.5,
  },
  input: {
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 15,
  },
  otpInput: {
    textAlign: 'center',
    letterSpacing: 8,
    fontWeight: 'bold',
    fontSize: 18,
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  phoneCodeContainer: {
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneCodeText: {
    color: '#10b981',
    fontSize: 15,
    fontWeight: '700',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 15,
  },
  submitButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#030712',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  modeToggleContainer: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  modeToggleText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  modeToggleHighlight: {
    color: '#10b981',
    fontWeight: '700',
  },
  guestButton: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  guestButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  // Dev quick login styles
  devBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  devBarText: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  devDropdown: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  devAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  devAccountLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  devAccountEmail: {
    fontSize: 11,
    fontWeight: '600',
  },
  devFillBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  devFillBtnText: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '800',
  },
});
