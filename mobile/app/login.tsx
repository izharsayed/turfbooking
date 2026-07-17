import React, { useState, useEffect } from 'react';
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

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const safeRedirect = (path: string) => {
    setTimeout(() => {
      try {
        router.replace(path as any);
      } catch (err) {
        setTimeout(() => router.replace(path as any), 300);
      }
    }, 100);
  };

  // Google Sign-In credentials check
  const isGoogleConfigured = () => {
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    const firebaseApiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
    return (
      webClientId &&
      webClientId !== 'YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com' &&
      firebaseApiKey &&
      firebaseApiKey !== 'YOUR_FIREBASE_WEB_API_KEY'
    );
  };

  useEffect(() => {
    // Check if we are running in Expo Go
    const isExpoGo = Constants.appOwnership === 'expo';
    if (!isExpoGo) {
      const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
      if (webClientId && webClientId !== 'YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com') {
        import('@react-native-google-signin/google-signin')
          .then(({ GoogleSignin }) => {
            GoogleSignin.configure({
              webClientId,
              offlineAccess: false,
            });
          })
          .catch((err) => {
          });
      } else {
      }
    }
  }, []);

  const handleGoogleSignIn = async () => {
    const isExpoGo = Constants.appOwnership === 'expo';
    const configured = isGoogleConfigured();

    if (isExpoGo || !configured) {
      let alertMessage = 'You are currently running the app in ';
      if (isExpoGo) {
        alertMessage += 'Expo Go. Native Google Sign-In requires a custom Development Client build.';
      } else {
        alertMessage += 'a native build, but the Google Web Client ID or Firebase API Key is not configured in the application environment.';
      }
      Alert.alert('Google Sign-In Unconfigured', alertMessage);
      return;
    }

    // --- Real Google Auth Flow ---
    try {
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      const googleIdToken = userInfo.data?.idToken || userInfo.idToken;
      
      if (!googleIdToken) {
        throw new Error('Google authentication succeeded, but no ID Token was returned.');
      }

      // Exchange Google ID Token for Firebase ID Token
      const firebaseApiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
      const firebaseExchangeUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${firebaseApiKey}`;
      
      const exchangeRes = await fetch(firebaseExchangeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postBody: `id_token=${googleIdToken}&providerId=google.com`,
          requestUri: 'http://localhost',
          returnIdpCredential: true,
          returnSecureToken: true,
        }),
      });

      const exchangeData = await exchangeRes.json();
      if (!exchangeRes.ok) {
        throw new Error(exchangeData.error?.message || 'Failed to exchange Google token for Firebase token.');
      }

      const firebaseIdToken = exchangeData.idToken;
      if (!firebaseIdToken) {
        throw new Error('Firebase token exchange succeeded, but no Firebase ID Token was returned.');
      }

      // Send Firebase ID Token to backend
      const res = await apiFetch('/auth/google', {
        method: 'POST',
        body: { idToken: firebaseIdToken },
      });

      if (res.success && res.data) {
        login(
          {
            id: res.data.user.id,
            email: res.data.user.email,
            name: `${res.data.user.profile?.firstName || ''} ${res.data.user.profile?.lastName || ''}`.trim() || res.data.user.name || 'Google User',
            phone: res.data.user.phone,
            role: res.data.user.role,
          },
          res.data.accessToken,
          res.data.refreshToken
        );
        safeRedirect(res.data.user.role === 'SUPER_ADMIN' ? '/admin' : ((res.data.user.role === 'TURF_OWNER' || res.data.user.role === 'CARETAKER') ? '/owner' : '/'));
      } else {
        throw new Error('TurfBook server auth failed.');
      }

    } catch (error: any) {
      const { statusCodes } = await import('@react-native-google-signin/google-signin');
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // Handled silently
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // Handled silently
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Google Services Error', 'Google Play Services are not available or out of date.');
      } else {
        Alert.alert('Google Authentication Failed', error.message || 'An unknown error occurred during sign-in.');
      }
    }
  };

  const handlePasswordLogin = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: {
          email: email.trim().toLowerCase(),
          password,
        },
      });

      if (res.success && res.data) {
        login(
          {
            id: res.data.user.id,
            email: res.data.user.email,
            name: `${res.data.user.profile?.firstName || ''} ${res.data.user.profile?.lastName || ''}`.trim() || res.data.user.name || 'User',
            phone: res.data.user.phone,
            role: res.data.user.role,
          },
          res.data.accessToken,
          res.data.refreshToken
        );
        safeRedirect(res.data.user.role === 'SUPER_ADMIN' ? '/admin' : ((res.data.user.role === 'TURF_OWNER' || res.data.user.role === 'CARETAKER') ? '/owner' : '/'));
      } else {
        Alert.alert('Login Failed', res.message || 'Invalid email or password');
      }
    } catch (e: any) {
      Alert.alert('Login Error', e.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };



  const handleSignUpClick = () => {
    router.push('/signup');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: isDarkMode ? '#030712' : '#f8fafc' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.topSection}>
        <View style={styles.headerCurve}>
          <Image
            source={require('../assets/turf-bg.jpg')}
            style={styles.backgroundImage as any}
            resizeMode="cover"
          />
          <View style={styles.topOverlay} />
          
          {/* Dark Mode Switcher */}
          <TouchableOpacity
            onPress={toggleTheme}
            style={styles.themeToggleBtn}
            activeOpacity={0.7}
          >
            <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={18} color={isDarkMode ? '#fbbf24' : '#fff'} />
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

            <Text style={styles.headlineText}>Book Your Turf,{"\n"}Play Your Game!</Text>
            <Text style={styles.taglineText}>Discover, book and play at the best turfs near you.</Text>
          </View>
        </View>

        {/* Features Floating Card */}
        <View style={styles.featuresCard}>
          <View style={styles.featureItem}>
            <Ionicons name="shield-checkmark" size={18} color="#10b981" />
            <Text style={styles.featureText}>Secure{"\n"}Booking</Text>
          </View>
          <View style={styles.featureDivider} />
          <View style={styles.featureItem}>
            <Ionicons name="calendar" size={18} color="#10b981" />
            <Text style={styles.featureText}>Real-time{"\n"}Availability</Text>
          </View>
          <View style={styles.featureDivider} />
          <View style={styles.featureItem}>
            <Ionicons name="ribbon" size={18} color="#10b981" />
            <Text style={styles.featureText}>Best{"\n"}Prices</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={[styles.bottomSection, { backgroundColor: isDarkMode ? '#030712' : '#f8fafc' }]}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.loginCard, { backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', borderColor: isDarkMode ? '#1e293b' : '#e2e8f0' }]}>
          <Text style={[styles.cardTitle, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>
            Welcome Back!
          </Text>
          <Text style={styles.cardSubtitle}>
            Login to continue to your account
          </Text>

           {/* Email input */}
          <View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? '#030712' : '#ffffff', borderColor: isDarkMode ? '#1e293b' : '#e2e8f0', marginTop: 14 }]}>
            <Ionicons name="mail-outline" size={18} color="#64748b" style={styles.inputIcon} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email Address"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.formInput, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}
            />
          </View>

          {/* Password input */}
          <View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? '#030712' : '#ffffff', borderColor: isDarkMode ? '#1e293b' : '#e2e8f0', marginTop: 14 }]}>
            <Ionicons name="lock-closed-outline" size={18} color="#64748b" style={styles.inputIcon} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!passwordVisible}
              autoCapitalize="none"
              style={[styles.formInput, { color: isDarkMode ? '#ffffff' : '#0f172a', flex: 1 }]}
            />
            <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)} style={{ paddingHorizontal: 10 }}>
              <Ionicons name={passwordVisible ? "eye-off-outline" : "eye-outline"} size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.greenButton, { marginTop: 20 }]} 
            onPress={handlePasswordLogin} 
            activeOpacity={0.9}
            disabled={isLoading}
          >
            <Text style={styles.greenButtonText}>
              {isLoading ? 'Logging In...' : 'Sign In'}
            </Text>
            <Ionicons name="arrow-forward-outline" size={16} color="#ffffff" style={{ marginLeft: 6 }} />
          </TouchableOpacity>

          {/* OR Divider */}
          <View style={styles.orContainer}>
            <View style={[styles.orLine, { backgroundColor: isDarkMode ? '#1e293b' : '#e2e8f0' }]} />
            <Text style={styles.orText}>or</Text>
            <View style={[styles.orLine, { backgroundColor: isDarkMode ? '#1e293b' : '#e2e8f0' }]} />
          </View>

          {/* Google Sign In */}
          <TouchableOpacity 
            style={[styles.googleButton, { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#cbd5e1' }]} 
            onPress={handleGoogleSignIn}
            activeOpacity={0.8}
          >
            <GoogleIcon size={18} />
            <Text style={[styles.googleButtonText, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        {/* Footer info links */}
        <View style={styles.footerRow}>
          <View style={styles.termsBox}>
            <Ionicons name="shield-checkmark-outline" size={14} color="#10b981" />
            <Text style={styles.termsText}>
              By continuing, you agree to our{"\n"}
              <Text style={styles.linkText} onPress={() => router.push('/terms')}>Terms of Service</Text> and <Text style={styles.linkText} onPress={() => router.push('/privacy')}>Privacy Policy</Text>
            </Text>
          </View>
          <TouchableOpacity onPress={handleSignUpClick} activeOpacity={0.7} style={styles.signUpLink}>
            <Text style={styles.signUpTextMuted}>
              New here? <Text style={styles.signUpTextGreen}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Guest browse */}
        <TouchableOpacity onPress={() => safeRedirect('/')} style={styles.guestButton} activeOpacity={0.7}>
          <Text style={styles.guestButtonText}>Continue as guest →</Text>
        </TouchableOpacity>


      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    height: 300,
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
  brandContainer: {
    paddingHorizontal: 24,
    zIndex: 2,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
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
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  taglineText: {
    fontSize: 13,
    color: '#cbd5e1',
    marginTop: 8,
    lineHeight: 18,
  },
  featuresCard: {
    position: 'absolute',
    bottom: -35,
    left: 20,
    right: 20,
    height: 70,
    backgroundColor: 'rgba(6, 78, 59, 0.95)',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  featureItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  featureText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 12,
  },
  featureDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  bottomSection: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 55,
    paddingHorizontal: 20,
    gap: 16,
  },
  loginCard: {
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
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 20,
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
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
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
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  termsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  termsText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    lineHeight: 13,
  },
  linkText: {
    color: '#10b981',
    fontWeight: '700',
  },
  signUpLink: {
    paddingLeft: 10,
  },
  signUpTextMuted: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  signUpTextGreen: {
    color: '#10b981',
    fontWeight: '800',
  },
  guestButton: {
    alignItems: 'center',
    marginVertical: 10,
  },
  guestButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  // Dev quick login
  devBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
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
    marginBottom: 8,
    overflow: 'hidden',
  },
  devAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  devAccountLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  devAccountEmail: {
    fontSize: 10,
    fontWeight: '600',
  },
  devFillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  devFillBtnText: {
    color: '#6366f1',
    fontSize: 11,
    fontWeight: '800',
  },
});
