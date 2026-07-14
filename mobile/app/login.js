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
exports.default = LoginScreen;
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
function LoginScreen() {
    const router = (0, expo_router_1.useRouter)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const { login } = (0, authStore_1.useAuthStore)();
    const { isDarkMode, toggleTheme } = (0, themeStore_1.useThemeStore)();
    const [phone, setPhone] = (0, react_1.useState)('');
    const [otp, setOtp] = (0, react_1.useState)('');
    const [otpSent, setOtpSent] = (0, react_1.useState)(false);
    const [devDropdownOpen, setDevDropdownOpen] = (0, react_1.useState)(false);
    const safeRedirect = (path) => {
        setTimeout(() => {
            try {
                router.replace(path);
            }
            catch (err) {
                console.warn('Redirect failed, retrying...', err);
                setTimeout(() => router.replace(path), 300);
            }
        }, 100);
    };
    // ── Dummy accounts for quick dev testing ──────────────────────────────
    const DUMMY_ACCOUNTS = [
        { label: '👤 Customer', phone: '9876543210', email: 'customer@turfbook.com', password: 'password', role: 'CUSTOMER', name: 'Demo Customer' },
        { label: '🏟️ Owner', phone: '9999988888', email: 'owner@turfbook.com', password: 'password', role: 'TURF_OWNER', name: 'Ahmednagar Sports Arena' },
        { label: '🔑 Admin', phone: '8888877777', email: 'admin@turfbook.com', password: 'password', role: 'SUPER_ADMIN', name: 'System Administrator' },
    ];
    const applyDummyLogin = async (account) => {
        const fetchWithTimeout = async (path, options, timeoutMs = 1500) => {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeoutMs);
            try {
                const res = await (0, api_1.apiFetch)(path, {
                    ...options,
                    signal: controller.signal,
                });
                clearTimeout(id);
                return res;
            }
            catch (err) {
                clearTimeout(id);
                throw err;
            }
        };
        try {
            const res = await fetchWithTimeout('/auth/login', {
                method: 'POST',
                body: { email: account.email, password: 'password' },
            }, 1500);
            if (res.success && res.data) {
                login({
                    id: res.data.user.id,
                    email: res.data.user.email,
                    name: `${res.data.user.profile?.firstName || ''} ${res.data.user.profile?.lastName || ''}`.trim() || res.data.user.name || account.name,
                    phone: res.data.user.phone,
                    role: res.data.user.role,
                }, res.data.accessToken);
                setDevDropdownOpen(false);
                safeRedirect(res.data.user.role === 'SUPER_ADMIN' ? '/admin' : (res.data.user.role === 'TURF_OWNER' ? '/owner' : '/'));
                return;
            }
        }
        catch (e) {
            console.log('Real dev login failed or timed out, falling back to bypass mode', e);
        }
        login({
            id: `dev-${account.role.toLowerCase()}`,
            email: account.email,
            name: account.name,
            phone: account.phone,
            role: account.role,
        }, 'dev-token-bypass');
        setDevDropdownOpen(false);
        safeRedirect(account.role === 'SUPER_ADMIN' ? '/admin' : (account.role === 'TURF_OWNER' ? '/owner' : '/'));
    };
    // Google Sign-In credentials check
    const isGoogleConfigured = () => {
        const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
        const firebaseApiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
        return (webClientId &&
            webClientId !== 'YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com' &&
            firebaseApiKey &&
            firebaseApiKey !== 'YOUR_FIREBASE_WEB_API_KEY');
    };
    (0, react_1.useEffect)(() => {
        // Check if we are running in Expo Go
        const isExpoGo = expo_constants_1.default.appOwnership === 'expo';
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
                    console.error('Failed to configure Google Sign-In dynamically:', err);
                });
            }
            else {
                console.warn('⚠️ Google Web Client ID is not configured in .env file.');
            }
        }
    }, []);
    const handleGoogleSignIn = async () => {
        const isExpoGo = expo_constants_1.default.appOwnership === 'expo';
        const configured = isGoogleConfigured();
        if (isExpoGo || !configured) {
            // Prompt user with simulation/bypass details
            let alertMessage = 'You are currently running the app in ';
            if (isExpoGo) {
                alertMessage += 'Expo Go. Native Google Sign-In requires a custom Development Client build.';
            }
            else {
                alertMessage += 'a native build, but the Google Web Client ID or Firebase API Key is not configured in your .env file.';
            }
            alertMessage += '\n\nWould you like to simulate Google authentication with a mock developer account?';
            react_native_1.Alert.alert('Google Sign-In Simulation', alertMessage, [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Proceed (Simulate)',
                    onPress: () => {
                        // Direct local bypass for simulation to avoid backend verification failures
                        login({
                            id: 'dev-google-customer',
                            email: 'google.mock@turfbook.com',
                            name: 'Google Mock User',
                            phone: '+919999988888',
                            role: 'CUSTOMER',
                        }, 'dev-token-bypass');
                        safeRedirect('/');
                    },
                },
            ]);
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
            const res = await (0, api_1.apiFetch)('/auth/google', {
                method: 'POST',
                body: { idToken: firebaseIdToken },
            });
            if (res.success && res.data) {
                login({
                    id: res.data.user.id,
                    email: res.data.user.email,
                    name: `${res.data.user.profile?.firstName || ''} ${res.data.user.profile?.lastName || ''}`.trim() || res.data.user.name || 'Google User',
                    phone: res.data.user.phone,
                    role: res.data.user.role,
                }, res.data.accessToken);
                safeRedirect(res.data.user.role === 'SUPER_ADMIN' ? '/admin' : (res.data.user.role === 'TURF_OWNER' ? '/owner' : '/'));
            }
            else {
                throw new Error('TurfBook server auth failed.');
            }
        }
        catch (error) {
            const { statusCodes } = await import('@react-native-google-signin/google-signin');
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                console.log('Google Sign-in cancelled by user');
            }
            else if (error.code === statusCodes.IN_PROGRESS) {
                console.log('Google Sign-in already in progress');
            }
            else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                react_native_1.Alert.alert('Google Services Error', 'Google Play Services are not available or out of date.');
            }
            else {
                react_native_1.Alert.alert('Google Authentication Failed', error.message || 'An unknown error occurred during sign-in.');
                console.error(error);
            }
        }
    };
    const handleSubmit = async () => {
        if (!phone || phone.length < 10) {
            react_native_1.Alert.alert('Error', 'Please enter a valid 10-digit phone number');
            return;
        }
        if (!otpSent) {
            try {
                await (0, api_1.apiFetch)('/auth/send-otp', {
                    method: 'POST',
                    body: { phone },
                });
                react_native_1.Alert.alert('OTP Dispatched', `💬 SMS OTP Sent to +91 ${phone}. Check the backend server console log to see the code.`);
                setOtpSent(true);
            }
            catch (e) {
                react_native_1.Alert.alert('Error', e.message || 'Failed to dispatch OTP. Make sure phone number is registered.');
            }
        }
        else {
            if (!otp || otp.length !== 6) {
                react_native_1.Alert.alert('Error', 'Please enter your 6-digit verification code');
                return;
            }
            try {
                const res = await (0, api_1.apiFetch)('/auth/verify-otp', {
                    method: 'POST',
                    body: { phone, code: otp },
                });
                login({
                    id: res.data.user.id,
                    email: res.data.user.email,
                    name: `${res.data.user.profile?.firstName || ''} ${res.data.user.profile?.lastName || ''}`.trim() || res.data.user.name || 'User',
                    phone: res.data.user.phone,
                    role: res.data.user.role,
                }, res.data.accessToken);
                setDevDropdownOpen(false);
                safeRedirect(res.data.user.role === 'SUPER_ADMIN' ? '/admin' : (res.data.user.role === 'TURF_OWNER' ? '/owner' : '/'));
            }
            catch (e) {
                react_native_1.Alert.alert('OTP Verification Failed', e.message || 'Invalid or expired OTP');
            }
        }
    };
    const handleSignUpClick = () => {
        router.push('/signup');
    };
    return (<react_native_1.KeyboardAvoidingView style={[styles.container, { backgroundColor: isDarkMode ? '#030712' : '#f8fafc' }]} behavior={react_native_1.Platform.OS === 'ios' ? 'padding' : undefined}>
      <react_native_1.View style={styles.topSection}>
        <react_native_1.View style={styles.headerCurve}>
          <react_native_1.Image source={require('../assets/turf-bg.jpg')} style={styles.backgroundImage} resizeMode="cover"/>
          <react_native_1.View style={styles.topOverlay}/>
          
          {/* Dark Mode Switcher */}
          <react_native_1.TouchableOpacity onPress={toggleTheme} style={styles.themeToggleBtn} activeOpacity={0.7}>
            <vector_icons_1.Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={18} color={isDarkMode ? '#fbbf24' : '#fff'}/>
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

            <react_native_1.Text style={styles.headlineText}>Book Your Turf,{"\n"}Play Your Game!</react_native_1.Text>
            <react_native_1.Text style={styles.taglineText}>Discover, book and play at the best turfs near you.</react_native_1.Text>
          </react_native_1.View>
        </react_native_1.View>

        {/* Features Floating Card */}
        <react_native_1.View style={styles.featuresCard}>
          <react_native_1.View style={styles.featureItem}>
            <vector_icons_1.Ionicons name="shield-checkmark" size={18} color="#10b981"/>
            <react_native_1.Text style={styles.featureText}>Secure{"\n"}Booking</react_native_1.Text>
          </react_native_1.View>
          <react_native_1.View style={styles.featureDivider}/>
          <react_native_1.View style={styles.featureItem}>
            <vector_icons_1.Ionicons name="calendar" size={18} color="#10b981"/>
            <react_native_1.Text style={styles.featureText}>Real-time{"\n"}Availability</react_native_1.Text>
          </react_native_1.View>
          <react_native_1.View style={styles.featureDivider}/>
          <react_native_1.View style={styles.featureItem}>
            <vector_icons_1.Ionicons name="ribbon" size={18} color="#10b981"/>
            <react_native_1.Text style={styles.featureText}>Best{"\n"}Prices</react_native_1.Text>
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.View>

      <react_native_1.ScrollView style={[styles.bottomSection, { backgroundColor: isDarkMode ? '#030712' : '#f8fafc' }]} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]} keyboardShouldPersistTaps="handled">
        <react_native_1.View style={[styles.loginCard, { backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', borderColor: isDarkMode ? '#1e293b' : '#e2e8f0' }]}>
          <react_native_1.Text style={[styles.cardTitle, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>
            Welcome Back!
          </react_native_1.Text>
          <react_native_1.Text style={styles.cardSubtitle}>
            Login to continue to your account
          </react_native_1.Text>

          {/* Phone input row */}
          <react_native_1.View style={[styles.phoneInputContainer, { backgroundColor: isDarkMode ? '#030712' : '#ffffff', borderColor: isDarkMode ? '#1e293b' : '#e2e8f0' }]}>
            <react_native_1.TouchableOpacity style={styles.countryPicker} activeOpacity={0.8}>
              <react_native_1.Text style={styles.flagEmoji}>🇮🇳</react_native_1.Text>
              <react_native_1.Text style={[styles.countryCode, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>+91</react_native_1.Text>
              <vector_icons_1.Ionicons name="chevron-down" size={12} color="#64748b"/>
            </react_native_1.TouchableOpacity>
            <react_native_1.View style={[styles.fieldDivider, { backgroundColor: isDarkMode ? '#1e293b' : '#cbd5e1' }]}/>
            <react_native_1.View style={styles.phoneInputWrapper}>
              <vector_icons_1.Ionicons name="call-outline" size={18} color="#64748b" style={styles.phoneIcon}/>
              <react_native_1.TextInput value={phone} onChangeText={(val) => setPhone(val.replace(/[^0-9]/g, ''))} placeholder="Enter your mobile number" placeholderTextColor="#64748b" keyboardType="phone-pad" maxLength={10} style={[styles.formInput, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}/>
            </react_native_1.View>
          </react_native_1.View>

          {/* OTP Code */}
          {otpSent && (<react_native_1.View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? '#030712' : '#ffffff', borderColor: isDarkMode ? '#1e293b' : '#e2e8f0', marginTop: 14 }]}>
              <vector_icons_1.Ionicons name="shield-checkmark-outline" size={18} color="#64748b" style={styles.inputIcon}/>
              <react_native_1.TextInput value={otp} onChangeText={(val) => setOtp(val.replace(/[^0-9]/g, ''))} placeholder="Enter 6-digit OTP" placeholderTextColor="#94a3b8" keyboardType="number-pad" maxLength={6} style={[styles.formInput, { color: isDarkMode ? '#ffffff' : '#0f172a', letterSpacing: otp ? 6 : 0 }]}/>
            </react_native_1.View>)}

          <react_native_1.TouchableOpacity style={styles.greenButton} onPress={handleSubmit} activeOpacity={0.9}>
            <react_native_1.Text style={styles.greenButtonText}>
              {otpSent ? 'Verify & Login' : 'Continue with Mobile'}
            </react_native_1.Text>
            <vector_icons_1.Ionicons name="arrow-forward-outline" size={16} color="#ffffff" style={{ marginLeft: 6 }}/>
          </react_native_1.TouchableOpacity>

          <react_native_1.View style={styles.orContainer}>
            <react_native_1.View style={[styles.orLine, { backgroundColor: isDarkMode ? '#1e293b' : '#e2e8f0' }]}/>
            <react_native_1.Text style={styles.orText}>or</react_native_1.Text>
            <react_native_1.View style={[styles.orLine, { backgroundColor: isDarkMode ? '#1e293b' : '#e2e8f0' }]}/>
          </react_native_1.View>

          {/* Google Sign In */}
          <react_native_1.TouchableOpacity style={[styles.googleButton, { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#cbd5e1' }]} onPress={handleGoogleSignIn} activeOpacity={0.8}>
            <GoogleIcon size={18}/>
            <react_native_1.Text style={[styles.googleButtonText, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>Continue with Google</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>

        {/* Footer info links */}
        <react_native_1.View style={styles.footerRow}>
          <react_native_1.View style={styles.termsBox}>
            <vector_icons_1.Ionicons name="shield-checkmark-outline" size={14} color="#10b981"/>
            <react_native_1.Text style={styles.termsText}>
              By continuing, you agree to our{"\n"}
              <react_native_1.Text style={styles.linkText}>Terms of Service</react_native_1.Text> and <react_native_1.Text style={styles.linkText}>Privacy Policy</react_native_1.Text>
            </react_native_1.Text>
          </react_native_1.View>
          <react_native_1.TouchableOpacity onPress={handleSignUpClick} activeOpacity={0.7} style={styles.signUpLink}>
            <react_native_1.Text style={styles.signUpTextMuted}>
              New here? <react_native_1.Text style={styles.signUpTextGreen}>Sign Up</react_native_1.Text>
            </react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>

        {/* Guest browse */}
        <react_native_1.TouchableOpacity onPress={() => safeRedirect('/')} style={styles.guestButton} activeOpacity={0.7}>
          <react_native_1.Text style={styles.guestButtonText}>Continue as guest →</react_native_1.Text>
        </react_native_1.TouchableOpacity>

        {/* Dev Quick Login (At the very bottom) */}
        <react_native_1.TouchableOpacity style={[styles.devBar, { backgroundColor: isDarkMode ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.2)', marginTop: 20 }]} onPress={() => setDevDropdownOpen(!devDropdownOpen)} activeOpacity={0.75}>
          <vector_icons_1.MaterialCommunityIcons name="test-tube" size={14} color="#6366f1"/>
          <react_native_1.Text style={styles.devBarText}>Dev Quick Login</react_native_1.Text>
          <vector_icons_1.MaterialCommunityIcons name={devDropdownOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#6366f1" style={{ marginLeft: 'auto' }}/>
        </react_native_1.TouchableOpacity>

        {devDropdownOpen && (<react_native_1.View style={[styles.devDropdown, { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: 'rgba(99,102,241,0.25)' }]}>
            {DUMMY_ACCOUNTS.map((acct) => (<react_native_1.TouchableOpacity key={acct.role} style={[styles.devAccountRow, { borderBottomColor: isDarkMode ? '#334155' : '#f1f5f9' }]} onPress={() => applyDummyLogin(acct)} activeOpacity={0.7}>
                <react_native_1.View style={{ flex: 1 }}>
                  <react_native_1.Text style={[styles.devAccountLabel, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>{acct.label}</react_native_1.Text>
                  <react_native_1.Text style={[styles.devAccountEmail, { color: '#6366f1' }]}>📱 {acct.phone} · Bypass</react_native_1.Text>
                </react_native_1.View>
                <react_native_1.View style={[styles.devFillBtn, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
                  <react_native_1.Text style={styles.devFillBtnText}>Fill</react_native_1.Text>
                </react_native_1.View>
              </react_native_1.TouchableOpacity>))}
          </react_native_1.View>)}
      </react_native_1.ScrollView>
    </react_native_1.KeyboardAvoidingView>);
}
const styles = react_native_1.StyleSheet.create({
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
