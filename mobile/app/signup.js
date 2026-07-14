"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SignupScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const vector_icons_1 = require("@expo/vector-icons");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const authStore_1 = require("../store/authStore");
const themeStore_1 = require("../store/themeStore");
const api_1 = require("../utils/api");
const expo_constants_1 = __importDefault(require("expo-constants"));
const react_native_svg_1 = __importStar(require("react-native-svg"));
const GoogleIcon = ({ size = 18 }) => (<react_native_svg_1.default width={size} height={size} viewBox="0 0 24 24">
    <react_native_svg_1.Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <react_native_svg_1.Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <react_native_svg_1.Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.22-.66-.35-1.36-.35-2.09z"/>
    <react_native_svg_1.Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </react_native_svg_1.default>);
// ── Password strength meter ─────────────────────────────────────────────
const getPasswordStrength = (pw) => {
    if (!pw)
        return { label: '', color: '#334155', percent: 0 };
    let score = 0;
    if (pw.length >= 8)
        score++;
    if (/[A-Z]/.test(pw))
        score++;
    if (/[a-z]/.test(pw))
        score++;
    if (/[0-9]/.test(pw))
        score++;
    if (/[^A-Za-z0-9]/.test(pw))
        score++;
    if (score <= 2)
        return { label: 'Weak', color: '#ef4444', percent: 30 };
    if (score <= 3)
        return { label: 'Fair', color: '#f59e0b', percent: 55 };
    if (score <= 4)
        return { label: 'Good', color: '#3b82f6', percent: 80 };
    return { label: 'Strong', color: '#10b981', percent: 100 };
};
function SignupScreen() {
    const router = (0, expo_router_1.useRouter)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const { login } = (0, authStore_1.useAuthStore)();
    const { isDarkMode, toggleTheme } = (0, themeStore_1.useThemeStore)();
    // ── Step state ──
    const [step, setStep] = (0, react_1.useState)(1);
    // ── Step 1 fields ──
    const [firstName, setFirstName] = (0, react_1.useState)('');
    const [lastName, setLastName] = (0, react_1.useState)('');
    const [phone, setPhone] = (0, react_1.useState)('');
    const [email, setEmail] = (0, react_1.useState)('');
    // ── Step 2 fields ──
    const [password, setPassword] = (0, react_1.useState)('');
    const [confirmPassword, setConfirmPassword] = (0, react_1.useState)('');
    const [agreeTerms, setAgreeTerms] = (0, react_1.useState)(false);
    const [passwordVisible, setPasswordVisible] = (0, react_1.useState)(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)('');
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
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
    const validateStep1 = () => {
        setError('');
        if (!firstName.trim()) {
            setError('First name is required');
            return false;
        }
        if (!lastName.trim()) {
            setError('Last name is required');
            return false;
        }
        if (!phone || phone.length < 10) {
            setError('Enter a valid 10-digit phone number');
            return false;
        }
        if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
            setError('Enter a valid email address');
            return false;
        }
        return true;
    };
    // ── Step 2 validation ──
    const validateStep2 = () => {
        setError('');
        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return false;
        }
        if (!/[A-Z]/.test(password)) {
            setError('Password needs at least one uppercase letter');
            return false;
        }
        if (!/[a-z]/.test(password)) {
            setError('Password needs at least one lowercase letter');
            return false;
        }
        if (!/[0-9]/.test(password)) {
            setError('Password needs at least one number');
            return false;
        }
        if (!/[^A-Za-z0-9]/.test(password)) {
            setError('Password needs at least one special character');
            return false;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        if (!agreeTerms) {
            setError('You must accept the Terms & Conditions');
            return false;
        }
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
        if (!validateStep2())
            return;
        setIsLoading(true);
        setError('');
        try {
            const res = await (0, api_1.apiFetch)('/auth/register', {
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
                react_native_1.Alert.alert('Account Created! 🎉', 'Your TurfBook account has been created successfully. Please log in to continue.', [{ text: 'Go to Login', onPress: () => router.replace('/login') }]);
            }
            else {
                setError(res.message || 'Registration failed. Please try again.');
            }
        }
        catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleGoogleSignUp = async () => {
        const isExpoGo = expo_constants_1.default.appOwnership === 'expo';
        if (isExpoGo) {
            react_native_1.Alert.alert('Google Sign-Up Simulation', 'You are running in Expo Go. Native Google Sign-In requires a custom build.\n\nWould you like to simulate registration with a mock account?', [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Proceed (Simulate)',
                    onPress: () => {
                        login({
                            id: 'dev-google-customer',
                            email: 'google.mock@turfbook.com',
                            name: 'Google Mock User',
                            phone: '+919999988888',
                            role: 'CUSTOMER',
                        }, 'dev-token-bypass');
                        router.replace('/');
                    },
                },
            ]);
            return;
        }
        // Real Google Sign-In would go here (same as login.tsx handleGoogleSignIn)
        try {
            const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            const googleIdToken = userInfo.data?.idToken || userInfo.idToken;
            if (!googleIdToken)
                throw new Error('No ID Token returned.');
            const firebaseApiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
            const exchangeRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${firebaseApiKey}`, {
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
            if (!exchangeRes.ok)
                throw new Error(exchangeData.error?.message || 'Token exchange failed');
            const res = await (0, api_1.apiFetch)('/auth/google', {
                method: 'POST',
                body: { idToken: exchangeData.idToken },
            });
            if (res.success && res.data) {
                login({
                    id: res.data.user.id,
                    email: res.data.user.email,
                    name: `${res.data.user.profile?.firstName || ''} ${res.data.user.profile?.lastName || ''}`.trim() || 'Google User',
                    phone: res.data.user.phone,
                    role: res.data.user.role,
                }, res.data.accessToken);
                router.replace('/');
            }
        }
        catch (error) {
            if (error.code !== 'SIGN_IN_CANCELLED') {
                react_native_1.Alert.alert('Google Sign-Up Failed', error.message || 'An error occurred.');
            }
        }
    };
    const strength = getPasswordStrength(password);
    return (<react_native_1.KeyboardAvoidingView style={[styles.container, { backgroundColor: theme.bg }]} behavior={react_native_1.Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* ── Header Section ── */}
      <react_native_1.View style={styles.topSection}>
        <react_native_1.View style={styles.headerCurve}>
          <react_native_1.Image source={require('../assets/turf-bg.jpg')} style={styles.backgroundImage} resizeMode="cover"/>
          <react_native_1.View style={styles.topOverlay}/>

          {/* Dark Mode Toggle */}
          <react_native_1.TouchableOpacity onPress={toggleTheme} style={styles.themeToggleBtn} activeOpacity={0.7}>
            <vector_icons_1.Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={18} color={isDarkMode ? '#fbbf24' : '#fff'}/>
          </react_native_1.TouchableOpacity>

          {/* Back Arrow */}
          <react_native_1.TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <vector_icons_1.Ionicons name="arrow-back" size={20} color="#fff"/>
          </react_native_1.TouchableOpacity>

          {/* Brand Header */}
          <react_native_1.View style={[styles.brandContainer, { paddingTop: insets.top + 20 }]}>
            <react_native_1.View style={styles.logoRow}>
              <react_native_1.View style={styles.logoWrapper}>
                <react_native_1.View style={styles.shieldBackground}>
                  <vector_icons_1.Ionicons name="shield" size={40} color="#10b981"/>
                </react_native_1.View>
                <react_native_1.View style={styles.soccerOverlay}>
                  <vector_icons_1.MaterialCommunityIcons name="soccer" size={22} color="#ffffff"/>
                </react_native_1.View>
              </react_native_1.View>
              <react_native_1.Text style={styles.brandTitle}>
                <react_native_1.Text style={{ color: '#ffffff' }}>Turf</react_native_1.Text>
                <react_native_1.Text style={{ color: '#10b981' }}>Book</react_native_1.Text>
              </react_native_1.Text>
            </react_native_1.View>

            <react_native_1.Text style={styles.headlineText}>Create Your{"\n"}Account</react_native_1.Text>
            <react_native_1.Text style={styles.taglineText}>Join thousands of players booking turfs every day.</react_native_1.Text>
          </react_native_1.View>
        </react_native_1.View>

        {/* Step Indicator Card */}
        <react_native_1.View style={styles.stepsCard}>
          <react_native_1.View style={styles.stepItem}>
            <react_native_1.View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}>
              {step > 1 ? (<vector_icons_1.Ionicons name="checkmark" size={12} color="#fff"/>) : (<react_native_1.Text style={[styles.stepDotText, step >= 1 && styles.stepDotTextActive]}>1</react_native_1.Text>)}
            </react_native_1.View>
            <react_native_1.Text style={[styles.stepLabel, step >= 1 && styles.stepLabelActive]}>Personal Info</react_native_1.Text>
          </react_native_1.View>
          <react_native_1.View style={[styles.stepLine, step >= 2 && styles.stepLineActive]}/>
          <react_native_1.View style={styles.stepItem}>
            <react_native_1.View style={[styles.stepDot, step >= 2 && styles.stepDotActive]}>
              <react_native_1.Text style={[styles.stepDotText, step >= 2 && styles.stepDotTextActive]}>2</react_native_1.Text>
            </react_native_1.View>
            <react_native_1.Text style={[styles.stepLabel, step >= 2 && styles.stepLabelActive]}>Security</react_native_1.Text>
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.View>

      {/* ── Form Section ── */}
      <react_native_1.ScrollView style={[styles.bottomSection, { backgroundColor: theme.bg }]} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 30 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <react_native_1.View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <react_native_1.Text style={[styles.cardTitle, { color: theme.text }]}>
            {step === 1 ? 'Personal Details' : 'Set Password'}
          </react_native_1.Text>
          <react_native_1.Text style={styles.cardSubtitle}>
            {step === 1 ? 'Tell us about yourself' : 'Choose a strong password for your account'}
          </react_native_1.Text>

          {/* Error Banner */}
          {error !== '' && (<react_native_1.View style={styles.errorBanner}>
              <vector_icons_1.Ionicons name="alert-circle" size={16} color="#ef4444"/>
              <react_native_1.Text style={styles.errorText}>{error}</react_native_1.Text>
            </react_native_1.View>)}

          {/* ── Step 1: Personal Info ── */}
          {step === 1 && (<>
              {/* Name Row */}
              <react_native_1.View style={styles.nameRow}>
                <react_native_1.View style={[styles.inputWrapper, { flex: 1, backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                  <vector_icons_1.Ionicons name="person-outline" size={18} color="#64748b" style={styles.inputIcon}/>
                  <react_native_1.TextInput value={firstName} onChangeText={setFirstName} placeholder="First Name" placeholderTextColor="#94a3b8" style={[styles.formInput, { color: theme.text }]} autoCapitalize="words"/>
                </react_native_1.View>
                <react_native_1.View style={[styles.inputWrapper, { flex: 1, backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                  <react_native_1.TextInput value={lastName} onChangeText={setLastName} placeholder="Last Name" placeholderTextColor="#94a3b8" style={[styles.formInput, { color: theme.text }]} autoCapitalize="words"/>
                </react_native_1.View>
              </react_native_1.View>

              {/* Phone */}
              <react_native_1.View style={[styles.phoneInputContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, marginTop: 14 }]}>
                <react_native_1.TouchableOpacity style={styles.countryPicker} activeOpacity={0.8}>
                  <react_native_1.Text style={styles.flagEmoji}>🇮🇳</react_native_1.Text>
                  <react_native_1.Text style={[styles.countryCode, { color: theme.text }]}>+91</react_native_1.Text>
                  <vector_icons_1.Ionicons name="chevron-down" size={12} color="#64748b"/>
                </react_native_1.TouchableOpacity>
                <react_native_1.View style={[styles.fieldDivider, { backgroundColor: theme.divider }]}/>
                <react_native_1.View style={styles.phoneInputWrapper}>
                  <vector_icons_1.Ionicons name="call-outline" size={18} color="#64748b" style={styles.phoneIcon}/>
                  <react_native_1.TextInput value={phone} onChangeText={(val) => setPhone(val.replace(/[^0-9]/g, ''))} placeholder="Mobile Number" placeholderTextColor="#94a3b8" keyboardType="phone-pad" maxLength={10} style={[styles.formInput, { color: theme.text }]}/>
                </react_native_1.View>
              </react_native_1.View>

              {/* Email */}
              <react_native_1.View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, marginTop: 14 }]}>
                <vector_icons_1.Ionicons name="mail-outline" size={18} color="#64748b" style={styles.inputIcon}/>
                <react_native_1.TextInput value={email} onChangeText={setEmail} placeholder="Email Address" placeholderTextColor="#94a3b8" keyboardType="email-address" autoCapitalize="none" style={[styles.formInput, { color: theme.text }]}/>
              </react_native_1.View>

              {/* Next Button */}
              <react_native_1.TouchableOpacity style={styles.greenButton} onPress={handleNext} activeOpacity={0.9}>
                <react_native_1.Text style={styles.greenButtonText}>Continue</react_native_1.Text>
                <vector_icons_1.Ionicons name="arrow-forward-outline" size={16} color="#ffffff" style={{ marginLeft: 6 }}/>
              </react_native_1.TouchableOpacity>
            </>)}

          {/* ── Step 2: Password ── */}
          {step === 2 && (<>
              {/* Password */}
              <react_native_1.View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                <vector_icons_1.Ionicons name="lock-closed-outline" size={18} color="#64748b" style={styles.inputIcon}/>
                <react_native_1.TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor="#94a3b8" secureTextEntry={!passwordVisible} style={[styles.formInput, { color: theme.text }]}/>
                <react_native_1.TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <vector_icons_1.Ionicons name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} size={20} color="#64748b"/>
                </react_native_1.TouchableOpacity>
              </react_native_1.View>

              {/* Password Strength */}
              {password.length > 0 && (<react_native_1.View style={styles.strengthContainer}>
                  <react_native_1.View style={styles.strengthBarBg}>
                    <react_native_1.View style={[styles.strengthBarFill, { width: `${strength.percent}%`, backgroundColor: strength.color }]}/>
                  </react_native_1.View>
                  <react_native_1.Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</react_native_1.Text>
                </react_native_1.View>)}

              {/* Password Requirements */}
              {password.length > 0 && (<react_native_1.View style={styles.reqContainer}>
                  {[
                    { test: password.length >= 8, label: '8+ characters' },
                    { test: /[A-Z]/.test(password), label: 'Uppercase letter' },
                    { test: /[a-z]/.test(password), label: 'Lowercase letter' },
                    { test: /[0-9]/.test(password), label: 'Number' },
                    { test: /[^A-Za-z0-9]/.test(password), label: 'Special character' },
                ].map((req) => (<react_native_1.View key={req.label} style={styles.reqRow}>
                      <vector_icons_1.Ionicons name={req.test ? 'checkmark-circle' : 'ellipse-outline'} size={14} color={req.test ? '#10b981' : '#64748b'}/>
                      <react_native_1.Text style={[styles.reqText, req.test && styles.reqTextPassed]}>{req.label}</react_native_1.Text>
                    </react_native_1.View>))}
                </react_native_1.View>)}

              {/* Confirm Password */}
              <react_native_1.View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, marginTop: 14 }]}>
                <vector_icons_1.Ionicons name="lock-closed-outline" size={18} color="#64748b" style={styles.inputIcon}/>
                <react_native_1.TextInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm Password" placeholderTextColor="#94a3b8" secureTextEntry={!confirmPasswordVisible} style={[styles.formInput, { color: theme.text }]}/>
                <react_native_1.TouchableOpacity onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <vector_icons_1.Ionicons name={confirmPasswordVisible ? 'eye-off-outline' : 'eye-outline'} size={20} color="#64748b"/>
                </react_native_1.TouchableOpacity>
              </react_native_1.View>

              {/* Password match indicator */}
              {confirmPassword.length > 0 && (<react_native_1.View style={styles.matchRow}>
                  <vector_icons_1.Ionicons name={password === confirmPassword ? 'checkmark-circle' : 'close-circle'} size={14} color={password === confirmPassword ? '#10b981' : '#ef4444'}/>
                  <react_native_1.Text style={{ fontSize: 11, fontWeight: '600', color: password === confirmPassword ? '#10b981' : '#ef4444', marginLeft: 4 }}>
                    {password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                  </react_native_1.Text>
                </react_native_1.View>)}

              {/* Terms Checkbox */}
              <react_native_1.TouchableOpacity style={styles.termsRow} onPress={() => setAgreeTerms(!agreeTerms)} activeOpacity={0.7}>
                <react_native_1.View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                  {agreeTerms && <vector_icons_1.Ionicons name="checkmark" size={14} color="#fff"/>}
                </react_native_1.View>
                <react_native_1.Text style={[styles.termsLabelText, { color: theme.muted }]}>
                  I agree to the{' '}
                  <react_native_1.Text style={styles.linkText}>Terms of Service</react_native_1.Text> and{' '}
                  <react_native_1.Text style={styles.linkText}>Privacy Policy</react_native_1.Text>
                </react_native_1.Text>
              </react_native_1.TouchableOpacity>

              {/* Action Buttons */}
              <react_native_1.View style={styles.actionRow}>
                <react_native_1.TouchableOpacity style={[styles.backButton, { borderColor: theme.cardBorder }]} onPress={handleBack} activeOpacity={0.8}>
                  <vector_icons_1.Ionicons name="arrow-back" size={18} color={theme.muted}/>
                  <react_native_1.Text style={[styles.backButtonText, { color: theme.muted }]}>Back</react_native_1.Text>
                </react_native_1.TouchableOpacity>

                <react_native_1.TouchableOpacity style={[styles.greenButton, { flex: 1, marginTop: 0 }]} onPress={handleRegister} activeOpacity={0.9} disabled={isLoading}>
                  {isLoading ? (<react_native_1.ActivityIndicator color="#ffffff" size="small"/>) : (<>
                      <react_native_1.Text style={styles.greenButtonText}>Create Account</react_native_1.Text>
                      <vector_icons_1.Ionicons name="arrow-forward-outline" size={16} color="#ffffff" style={{ marginLeft: 6 }}/>
                    </>)}
                </react_native_1.TouchableOpacity>
              </react_native_1.View>
            </>)}
        </react_native_1.View>

        {/* Divider */}
        <react_native_1.View style={styles.orContainer}>
          <react_native_1.View style={[styles.orLine, { backgroundColor: theme.divider }]}/>
          <react_native_1.Text style={styles.orText}>or</react_native_1.Text>
          <react_native_1.View style={[styles.orLine, { backgroundColor: theme.divider }]}/>
        </react_native_1.View>

        {/* Google Sign Up */}
        <react_native_1.TouchableOpacity style={[styles.googleButton, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} onPress={handleGoogleSignUp} activeOpacity={0.8}>
          <GoogleIcon size={18}/>
          <react_native_1.Text style={[styles.googleButtonText, { color: theme.text }]}>Sign up with Google</react_native_1.Text>
        </react_native_1.TouchableOpacity>

        {/* Already have an account */}
        <react_native_1.View style={styles.footerRow}>
          <react_native_1.TouchableOpacity onPress={() => router.replace('/login')} activeOpacity={0.7}>
            <react_native_1.Text style={styles.loginLinkText}>
              Already have an account? <react_native_1.Text style={styles.loginLinkGreen}>Login</react_native_1.Text>
            </react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>
      </react_native_1.ScrollView>
    </react_native_1.KeyboardAvoidingView>);
}
const styles = react_native_1.StyleSheet.create({
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
