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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore.js';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const handleSendOtp = () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }
    Alert.alert('OTP Dispatched', `💬 SMS OTP Sent to +91 ${phone}: [ 123456 ] (Mock OTP)`);
    setOtpSent(true);
  };

  const handleSubmit = () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    if (isRegisterMode) {
      if (!name) {
        Alert.alert('Error', 'Please enter your name');
        return;
      }
      login(
        {
          id: 'USR-101',
          email: email || `${phone}@turfbook.com`,
          name,
          phone,
          role: 'CUSTOMER',
        },
        'dummy_token'
      );
    } else {
      if (loginMethod === 'otp') {
        if (!otpSent) {
          handleSendOtp();
          return;
        }
        if (otp !== '123456') {
          Alert.alert('Error', 'Invalid OTP code');
          return;
        }
      } else {
        if (!password) {
          Alert.alert('Error', 'Please enter your password');
          return;
        }
      }

      login(
        {
          id: 'USR-101',
          email: `${phone}@turfbook.com`,
          name: `User ${phone.slice(-4)}`,
          phone,
          role: 'CUSTOMER',
        },
        'dummy_token'
      );
    }

    router.replace('/');
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setOtpSent(false);
    setOtp('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand */}
        <View style={styles.brand}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>⚽</Text>
          </View>
          <Text style={styles.brandName}>TurfBook</Text>
          <Text style={styles.brandTagline}>Book your game. Own the pitch.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>
            {isRegisterMode ? 'Create Account' : 'Welcome Back'}
          </Text>
          <Text style={styles.subtitle}>
            {isRegisterMode
              ? 'Sign up to start booking turfs'
              : 'Sign in to continue to your bookings'}
          </Text>

          {/* Login method tabs */}
          {!isRegisterMode && (
            <View style={styles.tabContainer}>
              <TouchableOpacity
                onPress={() => {
                  setLoginMethod('password');
                  setOtpSent(false);
                  setOtp('');
                }}
                style={[styles.authTabButton, loginMethod === 'password' && styles.tabButtonActive]}
              >
                <Text
                  style={[
                    styles.authTabButtonText,
                    loginMethod === 'password' && styles.tabButtonTextActive,
                  ]}
                >
                  Password
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setLoginMethod('otp')}
                style={[styles.authTabButton, loginMethod === 'otp' && styles.tabButtonActive]}
              >
                <Text
                  style={[
                    styles.authTabButtonText,
                    loginMethod === 'otp' && styles.tabButtonTextActive,
                  ]}
                >
                  OTP Login
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ gap: 14 }}>
            {/* Register: Name */}
            {isRegisterMode && (
              <View>
                <Text style={styles.fieldLabel}>FULL NAME</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor="#64748b"
                  style={styles.input}
                />
              </View>
            )}

            {/* Phone */}
            <View>
              <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.phoneCodeContainer}>
                  <Text style={styles.phoneCodeText}>+91</Text>
                </View>
                <TextInput
                  value={phone}
                  onChangeText={(val) => setPhone(val.replace(/[^0-9]/g, ''))}
                  placeholder="9876543210"
                  placeholderTextColor="#64748b"
                  keyboardType="phone-pad"
                  maxLength={10}
                  style={styles.phoneInput}
                />
              </View>
            </View>

            {/* Register: Email (optional) */}
            {isRegisterMode && (
              <View>
                <Text style={styles.fieldLabel}>EMAIL ADDRESS (OPTIONAL)</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@example.com"
                  placeholderTextColor="#64748b"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>
            )}

            {/* Password or OTP */}
            {!isRegisterMode && loginMethod === 'otp' ? (
              otpSent && (
                <View>
                  <Text style={styles.fieldLabel}>6-DIGIT OTP CODE</Text>
                  <TextInput
                    value={otp}
                    onChangeText={(val) => setOtp(val.replace(/[^0-9]/g, ''))}
                    placeholder="------"
                    placeholderTextColor="#64748b"
                    keyboardType="number-pad"
                    maxLength={6}
                    style={[styles.input, styles.otpInput]}
                  />
                </View>
              )
            ) : (
              <View>
                <Text style={styles.fieldLabel}>PASSWORD</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#64748b"
                  secureTextEntry
                  style={styles.input}
                />
              </View>
            )}
          </View>

          {/* Submit */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>
              {isRegisterMode
                ? 'Sign Up & Create Account'
                : loginMethod === 'otp'
                  ? otpSent
                    ? 'Verify & Login'
                    : 'Send Verification OTP'
                  : 'Login'}
            </Text>
          </TouchableOpacity>

          {/* Mode toggle */}
          <TouchableOpacity onPress={toggleMode} style={styles.modeToggleContainer}>
            <Text style={styles.modeToggleText}>
              {isRegisterMode ? 'Already registered? ' : "Don't have an account? "}
              <Text style={styles.modeToggleHighlight}>
                {isRegisterMode ? 'Login' : 'Sign Up'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Guest browse */}
        <TouchableOpacity onPress={() => router.replace('/')} style={styles.guestButton}>
          <Text style={styles.guestButtonText}>Continue as guest →</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617', // Slate 950
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  brand: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoBadgeText: {
    fontSize: 30,
  },
  brandName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  brandTagline: {
    fontSize: 13,
    color: '#64748b',
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#020617',
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  authTabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  authTabButtonText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabButtonTextActive: {
    color: '#fff',
  },
  fieldLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    color: '#fff',
    fontSize: 14,
  },
  otpInput: {
    textAlign: 'center',
    letterSpacing: 8,
    fontWeight: 'bold',
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  phoneCodeContainer: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneCodeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    color: '#fff',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 22,
  },
  submitButtonText: {
    color: '#020617',
    fontWeight: 'bold',
    fontSize: 15,
  },
  modeToggleContainer: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  modeToggleText: {
    color: '#64748b',
    fontSize: 12,
  },
  modeToggleHighlight: {
    color: '#10b981',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  guestButton: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  guestButtonText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
});
