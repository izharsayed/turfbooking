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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { apiFetch } from '../utils/api';
import Constants from 'expo-constants';
import Svg, { Path } from 'react-native-svg';

const GoogleIcon = ({ size = 18 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <Path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <Path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.22-.66-.35-1.36-.35-2.09z"
    />
    <Path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </Svg>
);

// ── Password strength meter ─────────────────────────────────────────────
const getPasswordStrength = (pw: string): { label: string; color: string; percent: number } => {
  if (!pw) return { label: '', color: '#334155', percent: 0 };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 2) return { label: 'Weak', color: '#ef4444', percent: 30 };
  if (score <= 3) return { label: 'Fair', color: '#f59e0b', percent: 55 };
  if (score <= 4) return { label: 'Good', color: '#3b82f6', percent: 80 };
  return { label: 'Strong', color: '#10b981', percent: 100 };
};

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();

  // ── Step state ──
  const [step, setStep] = useState<1 | 2>(1);

  // ── Step 1 fields ──
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // ── Step 2 fields ──
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const theme = {
    bg: isDarkMode ? '#030712' : '#f8fafc',
    card: isDarkMode ? '#0f172a' : '#ffffff',
    cardBorder: isDarkMode ? '#1e293b' : '#e2e8f0',
    text: isDarkMode ? '#ffffff' : '#0f172a',
    inputBg: isDarkMode ? '#030712' : '#ffffff',
    inputBorder: isDarkMode ? '#1e293b' : '#e2e8f0',
    muted: '#64748b',
    divider: isDarkMode ? '#1e293b' : '#cbd5e1',
  };

  // ── Step 1 validation ──
  const validateStep1 = (): boolean => {
    setError('');
    if (!firstName.trim()) { setError('First name is required'); return false; }
    if (!lastName.trim()) { setError('Last name is required'); return false; }
    if (!phone || phone.length < 10) { setError('Enter a valid 10-digit phone number'); return false; }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email address'); return false; }
    return true;
  };

  // ── Step 2 validation ──
  const validateStep2 = (): boolean => {
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters'); return false; }
    if (!/[A-Z]/.test(password)) { setError('Password needs at least one uppercase letter'); return false; }
    if (!/[a-z]/.test(password)) { setError('Password needs at least one lowercase letter'); return false; }
    if (!/[0-9]/.test(password)) { setError('Password needs at least one number'); return false; }
    if (!/[^A-Za-z0-9]/.test(password)) { setError('Password needs at least one special character'); return false; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return false; }
    if (!agreeTerms) { setError('You must accept the Terms & Conditions'); return false; }
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setError('');
      setStep(2);
    }
  };

  const handleBack = () => {
    setError('');
    setStep(1);
  };

  const handleRegister = async () => {
    if (!validateStep2()) return;

    setIsLoading(true);
    setError('');
    try {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password,
          acceptTerms: true,
        },
      });

      if (res.success) {
        Alert.alert(
          'Account Created! 🎉',
          'Your TurfBook account has been created successfully. Please log in to continue.',
          [{ text: 'Go to Login', onPress: () => router.replace('/login') }]
        );
      } else {
        setError(res.message || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    const isExpoGo = Constants.appOwnership === 'expo';
    if (isExpoGo) {
      Alert.alert(
        'Google Sign-Up Simulation',
        'You are running in Expo Go. Native Google Sign-In requires a custom build.\n\nWould you like to simulate registration with a mock account?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Proceed (Simulate)',
            onPress: () => {
              login(
                {
                  id: 'dev-google-customer',
                  email: 'google.mock@turfbook.com',
                  name: 'Google Mock User',
                  phone: '+919999988888',
                  role: 'CUSTOMER',
                },
                'dev-token-bypass'
              );
              router.replace('/');
            },
          },
        ]
      );
      return;
    }

    // Real Google Sign-In would go here (same as login.tsx handleGoogleSignIn)
    try {
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const googleIdToken = userInfo.data?.idToken || (userInfo as any).idToken;
      if (!googleIdToken) throw new Error('No ID Token returned.');

      const firebaseApiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
      const exchangeRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${firebaseApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postBody: `id_token=${googleIdToken}&providerId=google.com`,
            requestUri: 'http://localhost',
            returnIdpCredential: true,
            returnSecureToken: true,
          }),
        }
      );
      const exchangeData = await exchangeRes.json();
      if (!exchangeRes.ok) throw new Error(exchangeData.error?.message || 'Token exchange failed');

      const res = await apiFetch('/auth/google', {
        method: 'POST',
        body: { idToken: exchangeData.idToken },
      });

      if (res.success && res.data) {
        login(
          {
            id: res.data.user.id,
            email: res.data.user.email,
            name: `${res.data.user.profile?.firstName || ''} ${res.data.user.profile?.lastName || ''}`.trim() || 'Google User',
            phone: res.data.user.phone,
            role: res.data.user.role,
          },
          res.data.accessToken
        );
        router.replace('/');
      }
    } catch (error: any) {
      if (error.code !== 'SIGN_IN_CANCELLED') {
        Alert.alert('Google Sign-Up Failed', error.message || 'An error occurred.');
      }
    }
  };

  const strength = getPasswordStrength(password);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Header Section ── */}
      <View style={styles.topSection}>
        <View style={styles.headerCurve}>
          <Image
            source={require('../assets/turf-bg.jpg')}
            style={styles.backgroundImage as any}
            resizeMode="cover"
          />
          <View style={styles.topOverlay} />

          {/* Dark Mode Toggle */}
          <TouchableOpacity
            onPress={toggleTheme}
            style={styles.themeToggleBtn}
            activeOpacity={0.7}
          >
            <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={18} color={isDarkMode ? '#fbbf24' : '#fff'} />
          </TouchableOpacity>

          {/* Back Arrow */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>

          {/* Brand Header */}
          <View style={[styles.brandContainer, { paddingTop: insets.top + 20 }]}>
            <View style={styles.logoRow}>
              <View style={styles.logoWrapper}>
                <View style={styles.shieldBackground}>
                  <Ionicons name="shield" size={40} color="#10b981" />
                </View>
                <View style={styles.soccerOverlay}>
                  <MaterialCommunityIcons name="soccer" size={22} color="#ffffff" />
                </View>
              </View>
              <Text style={styles.brandTitle}>
                <Text style={{ color: '#ffffff' }}>Turf</Text>
                <Text style={{ color: '#10b981' }}>Book</Text>
              </Text>
            </View>

            <Text style={styles.headlineText}>Create Your{"\n"}Account</Text>
            <Text style={styles.taglineText}>Join thousands of players booking turfs every day.</Text>
          </View>
        </View>

        {/* Step Indicator Card */}
        <View style={styles.stepsCard}>
          <View style={styles.stepItem}>
            <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}>
              {step > 1 ? (
                <Ionicons name="checkmark" size={12} color="#fff" />
              ) : (
                <Text style={[styles.stepDotText, step >= 1 && styles.stepDotTextActive]}>1</Text>
              )}
            </View>
            <Text style={[styles.stepLabel, step >= 1 && styles.stepLabelActive]}>Personal Info</Text>
          </View>
          <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
          <View style={styles.stepItem}>
            <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]}>
              <Text style={[styles.stepDotText, step >= 2 && styles.stepDotTextActive]}>2</Text>
            </View>
            <Text style={[styles.stepLabel, step >= 2 && styles.stepLabelActive]}>Security</Text>
          </View>
        </View>
      </View>

      {/* ── Form Section ── */}
      <ScrollView
        style={[styles.bottomSection, { backgroundColor: theme.bg }]}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 30 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            {step === 1 ? 'Personal Details' : 'Set Password'}
          </Text>
          <Text style={styles.cardSubtitle}>
            {step === 1 ? 'Tell us about yourself' : 'Choose a strong password for your account'}
          </Text>

          {/* Error Banner */}
          {error !== '' && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* ── Step 1: Personal Info ── */}
          {step === 1 && (
            <>
              {/* Name Row */}
              <View style={styles.nameRow}>
                <View style={[styles.inputWrapper, { flex: 1, backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                  <Ionicons name="person-outline" size={18} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="First Name"
                    placeholderTextColor="#94a3b8"
                    style={[styles.formInput, { color: theme.text }]}
                    autoCapitalize="words"
                  />
                </View>
                <View style={[styles.inputWrapper, { flex: 1, backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                  <TextInput
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Last Name"
                    placeholderTextColor="#94a3b8"
                    style={[styles.formInput, { color: theme.text }]}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Phone */}
              <View style={[styles.phoneInputContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, marginTop: 14 }]}>
                <TouchableOpacity style={styles.countryPicker} activeOpacity={0.8}>
                  <Text style={styles.flagEmoji}>🇮🇳</Text>
                  <Text style={[styles.countryCode, { color: theme.text }]}>+91</Text>
                  <Ionicons name="chevron-down" size={12} color="#64748b" />
                </TouchableOpacity>
                <View style={[styles.fieldDivider, { backgroundColor: theme.divider }]} />
                <View style={styles.phoneInputWrapper}>
                  <Ionicons name="call-outline" size={18} color="#64748b" style={styles.phoneIcon} />
                  <TextInput
                    value={phone}
                    onChangeText={(val) => setPhone(val.replace(/[^0-9]/g, ''))}
                    placeholder="Mobile Number"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                    maxLength={10}
                    style={[styles.formInput, { color: theme.text }]}
                  />
                </View>
              </View>

              {/* Email */}
              <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, marginTop: 14 }]}>
                <Ionicons name="mail-outline" size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email Address"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.formInput, { color: theme.text }]}
                />
              </View>

              {/* Next Button */}
              <TouchableOpacity style={styles.greenButton} onPress={handleNext} activeOpacity={0.9}>
                <Text style={styles.greenButtonText}>Continue</Text>
                <Ionicons name="arrow-forward-outline" size={16} color="#ffffff" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </>
          )}

          {/* ── Step 2: Password ── */}
          {step === 2 && (
            <>
              {/* Password */}
              <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                <Ionicons name="lock-closed-outline" size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!passwordVisible}
                  style={[styles.formInput, { color: theme.text }]}
                />
                <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Password Strength */}
              {password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBarBg}>
                    <View style={[styles.strengthBarFill, { width: `${strength.percent}%`, backgroundColor: strength.color }]} />
                  </View>
                  <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
                </View>
              )}

              {/* Password Requirements */}
              {password.length > 0 && (
                <View style={styles.reqContainer}>
                  {[
                    { test: password.length >= 8, label: '8+ characters' },
                    { test: /[A-Z]/.test(password), label: 'Uppercase letter' },
                    { test: /[a-z]/.test(password), label: 'Lowercase letter' },
                    { test: /[0-9]/.test(password), label: 'Number' },
                    { test: /[^A-Za-z0-9]/.test(password), label: 'Special character' },
                  ].map((req) => (
                    <View key={req.label} style={styles.reqRow}>
                      <Ionicons
                        name={req.test ? 'checkmark-circle' : 'ellipse-outline'}
                        size={14}
                        color={req.test ? '#10b981' : '#64748b'}
                      />
                      <Text style={[styles.reqText, req.test && styles.reqTextPassed]}>{req.label}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Confirm Password */}
              <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, marginTop: 14 }]}>
                <Ionicons name="lock-closed-outline" size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm Password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!confirmPasswordVisible}
                  style={[styles.formInput, { color: theme.text }]}
                />
                <TouchableOpacity onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name={confirmPasswordVisible ? 'eye-off-outline' : 'eye-outline'} size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Password match indicator */}
              {confirmPassword.length > 0 && (
                <View style={styles.matchRow}>
                  <Ionicons
                    name={password === confirmPassword ? 'checkmark-circle' : 'close-circle'}
                    size={14}
                    color={password === confirmPassword ? '#10b981' : '#ef4444'}
                  />
                  <Text style={{ fontSize: 11, fontWeight: '600', color: password === confirmPassword ? '#10b981' : '#ef4444', marginLeft: 4 }}>
                    {password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                  </Text>
                </View>
              )}

              {/* Terms Checkbox */}
              <TouchableOpacity
                style={styles.termsRow}
                onPress={() => setAgreeTerms(!agreeTerms)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                  {agreeTerms && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={[styles.termsLabelText, { color: theme.muted }]}>
                  I agree to the{' '}
                  <Text style={styles.linkText}>Terms of Service</Text> and{' '}
                  <Text style={styles.linkText}>Privacy Policy</Text>
                </Text>
              </TouchableOpacity>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.backButton, { borderColor: theme.cardBorder }]} onPress={handleBack} activeOpacity={0.8}>
                  <Ionicons name="arrow-back" size={18} color={theme.muted} />
                  <Text style={[styles.backButtonText, { color: theme.muted }]}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.greenButton, { flex: 1, marginTop: 0 }]}
                  onPress={handleRegister}
                  activeOpacity={0.9}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Text style={styles.greenButtonText}>Create Account</Text>
                      <Ionicons name="arrow-forward-outline" size={16} color="#ffffff" style={{ marginLeft: 6 }} />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Divider */}
        <View style={styles.orContainer}>
          <View style={[styles.orLine, { backgroundColor: theme.divider }]} />
          <Text style={styles.orText}>or</Text>
          <View style={[styles.orLine, { backgroundColor: theme.divider }]} />
        </View>

        {/* Google Sign Up */}
        <TouchableOpacity
          style={[styles.googleButton, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          onPress={handleGoogleSignUp}
          activeOpacity={0.8}
        >
          <GoogleIcon size={18} />
          <Text style={[styles.googleButtonText, { color: theme.text }]}>Sign up with Google</Text>
        </TouchableOpacity>

        {/* Already have an account */}
        <View style={styles.footerRow}>
          <TouchableOpacity onPress={() => router.replace('/login')} activeOpacity={0.7}>
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={styles.loginLinkGreen}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Header ──
  topSection: {
    height: 280,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  headerCurve: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    backgroundColor: '#020617',
  },
  backgroundImage: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    height: '100%',
    width: '100%',
    opacity: 0.55,
  },
  topOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    height: '100%',
    backgroundColor: 'rgba(2, 6, 23, 0.45)',
  },
  themeToggleBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  brandContainer: {
    paddingHorizontal: 24,
    zIndex: 2,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  logoWrapper: {
    position: 'relative',
    width: 40,
    height: 40,
  },
  shieldBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  soccerOverlay: {
    position: 'absolute',
    top: 9,
    left: 9,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headlineText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  taglineText: {
    fontSize: 13,
    color: '#cbd5e1',
    marginTop: 6,
    lineHeight: 18,
  },

  // ── Step Indicator ──
  stepsCard: {
    position: 'absolute',
    bottom: -28,
    left: 20,
    right: 20,
    height: 56,
    backgroundColor: 'rgba(6, 78, 59, 0.95)',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
    gap: 0,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: '#10b981',
  },
  stepDotText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '800',
  },
  stepDotTextActive: {
    color: '#ffffff',
  },
  stepLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '700',
  },
  stepLabelActive: {
    color: '#ffffff',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 10,
    borderRadius: 1,
  },
  stepLineActive: {
    backgroundColor: '#10b981',
  },

  // ── Form Card ──
  bottomSection: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 45,
    paddingHorizontal: 20,
    gap: 16,
  },
  formCard: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 20,
  },

  // ── Error ──
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },

  // ── Inputs ──
  nameRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  formInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 10,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    height: 52,
    overflow: 'hidden',
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 6,
    height: '100%',
  },
  flagEmoji: {
    fontSize: 16,
  },
  countryCode: {
    fontSize: 14,
    fontWeight: '700',
  },
  fieldDivider: {
    width: 1,
    height: 24,
  },
  phoneInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: '100%',
  },
  phoneIcon: {
    marginRight: 8,
  },

  // ── Password Strength ──
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  strengthBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Requirements ──
  reqContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    marginBottom: 4,
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(100, 116, 139, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  reqText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  reqTextPassed: {
    color: '#10b981',
  },

  // ── Match indicator ──
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingLeft: 4,
  },

  // ── Terms ──
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  termsLabelText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 17,
  },
  linkText: {
    color: '#10b981',
    fontWeight: '700',
  },

  // ── Buttons ──
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  greenButton: {
    backgroundColor: '#10b981',
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  greenButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },

  // ── Divider ──
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  orLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },

  // ── Google ──
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // ── Footer ──
  footerRow: {
    alignItems: 'center',
    marginTop: 6,
  },
  loginLinkText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  loginLinkGreen: {
    color: '#10b981',
    fontWeight: '800',
  },
});
