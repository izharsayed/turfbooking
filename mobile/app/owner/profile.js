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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = OwnerProfileScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const expo_router_1 = require("expo-router");
const vector_icons_1 = require("@expo/vector-icons");
const authStore_1 = require("../../store/authStore");
const themeStore_1 = require("../../store/themeStore");
const api_1 = require("../../utils/api");
const { width: SCREEN_WIDTH } = react_native_1.Dimensions.get('window');
const ACCENT = '#10b981';
const TURF_BG = require('../../assets/turf-bg.jpg');
function OwnerProfileScreen() {
    const { user, isAuthenticated, updateUser, logout } = (0, authStore_1.useAuthStore)();
    const { isDarkMode, toggleTheme } = (0, themeStore_1.useThemeStore)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const router = (0, expo_router_1.useRouter)();
    const [profile, setProfile] = (0, react_1.useState)({});
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [isEditing, setIsEditing] = (0, react_1.useState)(false);
    // Modals Visibility States
    const [showPayoutModal, setShowPayoutModal] = (0, react_1.useState)(false);
    const [showAvailabilityModal, setShowAvailabilityModal] = (0, react_1.useState)(false);
    const [showNotificationModal, setShowNotificationModal] = (0, react_1.useState)(false);
    const [showChangePasswordModal, setShowChangePasswordModal] = (0, react_1.useState)(false);
    const [saving, setSaving] = (0, react_1.useState)(false);
    const [savingPayout, setSavingPayout] = (0, react_1.useState)(false);
    const [savingAvailability, setSavingAvailability] = (0, react_1.useState)(false);
    // Notification configurations
    const [emailNotif, setEmailNotif] = (0, react_1.useState)(true);
    const [smsNotif, setSmsNotif] = (0, react_1.useState)(true);
    const [bookingNotif, setBookingNotif] = (0, react_1.useState)(true);
    const [weeklyReports, setWeeklyReports] = (0, react_1.useState)(false);
    // Change Password states
    const [currentPassword, setCurrentPassword] = (0, react_1.useState)('');
    const [newPassword, setNewPassword] = (0, react_1.useState)('');
    const [confirmNewPassword, setConfirmNewPassword] = (0, react_1.useState)('');
    const [changingPassword, setChangingPassword] = (0, react_1.useState)(false);
    const [formName, setFormName] = (0, react_1.useState)('');
    const [formPhone, setFormPhone] = (0, react_1.useState)('');
    const [formBusiness, setFormBusiness] = (0, react_1.useState)('');
    // Configuration settings states
    const [razorpayKeyId, setRazorpayKeyId] = (0, react_1.useState)('');
    const [razorpayKeySecret, setRazorpayKeySecret] = (0, react_1.useState)('');
    const [businessUpiId, setBusinessUpiId] = (0, react_1.useState)('');
    const [advancePaymentPercent, setAdvancePaymentPercent] = (0, react_1.useState)('30');
    const [convenienceFee, setConvenienceFee] = (0, react_1.useState)('45');
    const [taxRate, setTaxRate] = (0, react_1.useState)('18');
    const [autoCancellationLimit, setAutoCancellationLimit] = (0, react_1.useState)('5');
    const [openingTime, setOpeningTime] = (0, react_1.useState)('06:00 AM');
    const [closingTime, setClosingTime] = (0, react_1.useState)('11:00 PM');
    const theme = {
        bg: isDarkMode ? '#030712' : '#f8fafc',
        card: isDarkMode ? '#0f172a' : '#ffffff',
        cardBorder: isDarkMode ? '#1e293b' : '#f1f5f9',
        text: isDarkMode ? '#ffffff' : '#1f2937',
        textMuted: isDarkMode ? '#94a3b8' : '#6b7280',
        headerBg: isDarkMode ? '#0f172a' : '#ffffff',
        inputBg: isDarkMode ? '#1e293b' : '#f8fafc',
        badgeGreen: isDarkMode ? '#064e3b' : '#ecfdf5',
        badgeGreenText: isDarkMode ? '#34d399' : '#059669',
        divider: isDarkMode ? '#1e293b' : '#f3f4f6',
    };
    const fetchProfileData = async () => {
        if (!isAuthenticated || !user)
            return;
        try {
            const [profileRes, dashboardRes, turfsRes] = await Promise.all([
                (0, api_1.apiFetch)('/owner/profile'),
                (0, api_1.apiFetch)('/owner/dashboard'),
                (0, api_1.apiFetch)('/owner/turfs'),
            ]);
            // Initialize with logged in user values as baseline
            let name = user?.name || '';
            let email = user?.email || '';
            let phone = user?.phone || '';
            let businessName = '';
            let turfAddress = '';
            let totalRevenue = 0;
            let totalTurfs = 0;
            let totalBookings = 0;
            let totalCustomers = 0;
            let rating = 0.0;
            if (profileRes.success && profileRes.data) {
                const u = profileRes.data.user || {};
                const op = profileRes.data.ownerProfile || {};
                name = u.name || name;
                email = u.email || email;
                phone = u.phone || phone;
                businessName = op.companyName || op.businessName || '';
                totalRevenue = op.totalRevenue ?? 0;
                totalTurfs = op.totalTurfs ?? 0;
                totalBookings = op.totalBookings ?? 0;
                // Populate settings states
                setRazorpayKeyId(op.razorpayKeyId || '');
                setRazorpayKeySecret(op.razorpayKeySecret || '');
                setBusinessUpiId(op.businessUpiId || '');
                setAdvancePaymentPercent(String(op.advancePaymentPercent ?? 30));
                setConvenienceFee(String(op.convenienceFee ?? 45));
                setTaxRate(String(op.taxRate ?? 18));
                setAutoCancellationLimit(String(op.autoCancellationLimit ?? 5));
                setOpeningTime(op.openingTime || '06:00 AM');
                setClosingTime(op.closingTime || '11:00 PM');
            }
            if (dashboardRes.success && dashboardRes.data) {
                totalCustomers = dashboardRes.data.totalCustomers ?? dashboardRes.data.recentCustomers?.length ?? 0;
                rating = dashboardRes.data.rating ?? dashboardRes.data.averageRating ?? 0.0;
                totalRevenue = dashboardRes.data.totalRevenue ?? totalRevenue;
                totalBookings = dashboardRes.data.totalBookings ?? totalBookings;
                totalTurfs = dashboardRes.data.totalTurfs ?? totalTurfs;
            }
            if (turfsRes.success && turfsRes.data && turfsRes.data.length > 0) {
                const firstTurf = turfsRes.data[0];
                businessName = firstTurf.name || businessName;
                turfAddress = firstTurf.location?.address || '';
            }
            setProfile({
                name,
                email,
                phone,
                businessName: businessName || 'No Turf Added Yet',
                turfAddress: turfAddress || 'Add your turf address',
                totalRevenue,
                totalTurfs,
                totalBookings,
                totalCustomers,
                rating,
            });
            setFormName(name);
            setFormPhone(phone);
            setFormBusiness(businessName);
        }
        catch (err) {
            console.log('Failed to fetch profile/dashboard/turf data', err);
            // Clean fallback using local user session store
            setProfile({
                name: user?.name || 'Owner',
                email: user?.email || '',
                phone: user?.phone || '',
                businessName: 'No Turf Added Yet',
                turfAddress: 'Add your turf address',
                totalRevenue: 0,
                totalTurfs: 0,
                totalBookings: 0,
                totalCustomers: 0,
                rating: 0.0,
            });
            setFormName(user?.name || '');
            setFormPhone(user?.phone || '');
            setFormBusiness('');
        }
        finally {
            setLoading(false);
        }
    };
    (0, react_1.useEffect)(() => {
        fetchProfileData();
    }, [isAuthenticated, user]);
    // Guard: only for TURF_OWNER role
    if (!isAuthenticated || !user)
        return <expo_router_1.Redirect href="/login"/>;
    if (user.role !== 'TURF_OWNER')
        return <expo_router_1.Redirect href="/"/>;
    const handleSave = async () => {
        if (!formName.trim()) {
            react_native_1.Alert.alert('Error', 'Name cannot be empty.');
            return;
        }
        setSaving(true);
        try {
            await (0, api_1.apiFetch)('/owner/profile', {
                method: 'PUT',
                body: {
                    name: formName,
                    phone: formPhone,
                    companyName: formBusiness,
                    businessName: formBusiness,
                },
            });
            updateUser({ name: formName, phone: formPhone });
            setProfile((prev) => ({ ...prev, name: formName, phone: formPhone, businessName: formBusiness }));
            react_native_1.Alert.alert('Saved', 'Your profile has been updated.');
            setIsEditing(false);
        }
        catch (err) {
            console.log('Failed to update profile', err);
            react_native_1.Alert.alert('Error', 'Failed to update profile.');
        }
        finally {
            setSaving(false);
        }
    };
    const handleSavePayout = async () => {
        setSavingPayout(true);
        try {
            await (0, api_1.apiFetch)('/owner/profile', {
                method: 'PUT',
                body: {
                    razorpayKeyId,
                    razorpayKeySecret,
                    businessUpiId,
                    convenienceFee: Number(convenienceFee),
                    taxRate: Number(taxRate),
                    advancePaymentPercent: Number(advancePaymentPercent),
                },
            });
            react_native_1.Alert.alert('Saved', 'Payout details saved successfully.');
            setShowPayoutModal(false);
        }
        catch (err) {
            console.log('Failed to save payout details', err);
            react_native_1.Alert.alert('Error', 'Failed to save payout details.');
        }
        finally {
            setSavingPayout(false);
        }
    };
    const handleSaveAvailability = async () => {
        setSavingAvailability(true);
        try {
            await (0, api_1.apiFetch)('/owner/profile', {
                method: 'PUT',
                body: {
                    openingTime,
                    closingTime,
                    autoCancellationLimit: Number(autoCancellationLimit),
                },
            });
            react_native_1.Alert.alert('Saved', 'Availability settings saved successfully.');
            setShowAvailabilityModal(false);
        }
        catch (err) {
            console.log('Failed to save availability settings', err);
            react_native_1.Alert.alert('Error', 'Failed to save availability settings.');
        }
        finally {
            setSavingAvailability(false);
        }
    };
    const handleSaveNotifications = () => {
        react_native_1.Alert.alert('Saved', 'Notification preferences saved successfully.');
        setShowNotificationModal(false);
    };
    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            react_native_1.Alert.alert('Error', 'Please fill in all password fields.');
            return;
        }
        if (newPassword !== confirmNewPassword) {
            react_native_1.Alert.alert('Error', 'New passwords do not match.');
            return;
        }
        setChangingPassword(true);
        try {
            const res = await (0, api_1.apiFetch)('/auth/change-password', {
                method: 'POST',
                body: {
                    currentPassword,
                    newPassword,
                },
            });
            if (res.success) {
                react_native_1.Alert.alert('Success', 'Password changed successfully.');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
                setShowChangePasswordModal(false);
            }
            else {
                react_native_1.Alert.alert('Error', res.message || 'Failed to change password.');
            }
        }
        catch (err) {
            console.log('Failed to change password', err);
            react_native_1.Alert.alert('Error', err.message || 'Failed to change password.');
        }
        finally {
            setChangingPassword(false);
        }
    };
    const handleLogout = () => {
        react_native_1.Alert.alert('Log Out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Log Out',
                style: 'destructive',
                onPress: () => {
                    logout();
                    router.replace('/login');
                },
            },
        ]);
    };
    if (loading) {
        return (<react_native_1.View style={[styles.center, { backgroundColor: theme.bg }]}>
        <react_native_1.ActivityIndicator size="large" color={ACCENT}/>
      </react_native_1.View>);
    }
    return (<react_native_1.View style={[styles.container, { backgroundColor: theme.bg }]}>
      <react_native_1.ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* Full-bleed header with premium curved styling */}
        <react_native_1.ImageBackground source={TURF_BG} style={[styles.headerBg, { paddingTop: insets.top + 16 }]} imageStyle={styles.headerImage} resizeMode="cover">
          <react_native_1.View style={styles.darkOverlay}/>
          
          <react_native_1.View style={styles.headerInnerContent}>
            <react_native_1.View style={styles.headerTopRow}>
              <react_native_1.TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => router.push('/owner')}>
                <vector_icons_1.Ionicons name="chevron-back" size={20} color="#ffffff"/>
              </react_native_1.TouchableOpacity>
              
              <react_native_1.TouchableOpacity onPress={toggleTheme} style={styles.themeBtn} hitSlop={8}>
                <vector_icons_1.Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={18} color="#ffffff"/>
              </react_native_1.TouchableOpacity>
            </react_native_1.View>
            
            <react_native_1.View style={styles.headerContent}>
              <react_native_1.Text style={styles.headerTitle}>Profile</react_native_1.Text>
              <react_native_1.Text style={styles.headerSubtitle}>Manage your profile and turf details</react_native_1.Text>
            </react_native_1.View>
          </react_native_1.View>
        </react_native_1.ImageBackground>

        {/* Profile Details Container (Overlapping) */}
        <react_native_1.View style={styles.overlapWrapper}>
          <react_native_1.View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            
            {/* Top row with Photo and Profile details next to it */}
            <react_native_1.View style={styles.profileMainRow}>
              <react_native_1.View style={styles.avatarContainer}>
                <react_native_1.View style={styles.avatarCircle}>
                  <react_native_1.Text style={styles.avatarInitial}>
                    {(profile.name || 'O').charAt(0).toUpperCase()}
                  </react_native_1.Text>
                </react_native_1.View>
                <react_native_1.TouchableOpacity style={styles.cameraIconBadge} activeOpacity={0.8}>
                  <vector_icons_1.Ionicons name="camera-outline" size={12} color="#ffffff"/>
                </react_native_1.TouchableOpacity>
              </react_native_1.View>

              <react_native_1.View style={styles.profileInfoColumn}>
                <react_native_1.Text style={[styles.profileName, { color: theme.text }]} numberOfLines={1}>{profile.name}</react_native_1.Text>
                
                <react_native_1.View style={[styles.roleBadge, { backgroundColor: theme.badgeGreen }]}>
                  <vector_icons_1.Ionicons name="ribbon-outline" size={10} color={theme.badgeGreenText} style={{ marginRight: 3 }}/>
                  <react_native_1.Text style={[styles.roleBadgeText, { color: theme.badgeGreenText }]}>Turf Owner</react_native_1.Text>
                </react_native_1.View>

                <react_native_1.View style={styles.contactsWrap}>
                  <react_native_1.View style={styles.contactRow}>
                    <vector_icons_1.Ionicons name="call-outline" size={13} color={theme.textMuted} style={{ marginRight: 6 }}/>
                    <react_native_1.Text style={[styles.contactText, { color: theme.textMuted }]}>{profile.phone}</react_native_1.Text>
                  </react_native_1.View>
                  <react_native_1.View style={styles.contactRow}>
                    <vector_icons_1.Ionicons name="mail-outline" size={13} color={theme.textMuted} style={{ marginRight: 6 }}/>
                    <react_native_1.Text style={[styles.contactText, { color: theme.textMuted }]} numberOfLines={1}>{profile.email}</react_native_1.Text>
                  </react_native_1.View>
                </react_native_1.View>
              </react_native_1.View>

              <react_native_1.TouchableOpacity style={styles.editProfileBtn} activeOpacity={0.7} onPress={() => setIsEditing(true)}>
                <vector_icons_1.Ionicons name="pencil-outline" size={14} color={ACCENT}/>
              </react_native_1.TouchableOpacity>
            </react_native_1.View>

          </react_native_1.View>
        </react_native_1.View>

        {/* Unified and consistently spaced main content */}
        <react_native_1.View style={styles.mainContent}>
          {/* Verification Status Bar */}
          <react_native_1.View style={[styles.verificationBar, { backgroundColor: isDarkMode ? 'rgba(16,185,129,0.08)' : '#ecfdf5', borderColor: isDarkMode ? 'rgba(16,185,129,0.15)' : '#d1fae5' }]}>
            <react_native_1.View style={styles.verificationLeft}>
              <vector_icons_1.Ionicons name="shield-checkmark-outline" size={20} color={ACCENT} style={{ marginRight: 10 }}/>
              <react_native_1.View>
                <react_native_1.Text style={[styles.verificationTitle, { color: theme.text }]}>Verified Owner</react_native_1.Text>
                <react_native_1.Text style={[styles.verificationSub, { color: theme.textMuted }]}>Your account is verified and active.</react_native_1.Text>
              </react_native_1.View>
            </react_native_1.View>
            <vector_icons_1.Ionicons name="checkmark-circle" size={18} color={ACCENT}/>
          </react_native_1.View>

          {/* Turf Details Section */}
          <react_native_1.View style={styles.section}>
            <react_native_1.Text style={[styles.sectionTitle, { color: theme.text }]}>Turf Details</react_native_1.Text>
            <react_native_1.TouchableOpacity style={[styles.turfCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} activeOpacity={0.7} onPress={() => router.push('/owner/turfs')}>
              <react_native_1.View style={styles.turfLeft}>
                <react_native_1.View style={[styles.turfIconBox, { backgroundColor: isDarkMode ? 'rgba(16,185,129,0.12)' : '#ecfdf5' }]}>
                  <vector_icons_1.Ionicons name="football-outline" size={20} color={ACCENT}/>
                </react_native_1.View>
                <react_native_1.View style={styles.turfInfo}>
                  <react_native_1.Text style={[styles.turfTitle, { color: theme.text }]}>{profile.businessName}</react_native_1.Text>
                  <react_native_1.View style={styles.turfSubRow}>
                    <vector_icons_1.Ionicons name="location-outline" size={13} color={theme.textMuted} style={{ marginRight: 4 }}/>
                    <react_native_1.Text style={[styles.turfSubtext, { color: theme.textMuted }]} numberOfLines={1}>
                      {profile.turfAddress}
                    </react_native_1.Text>
                  </react_native_1.View>
                  <react_native_1.View style={styles.turfSubRow}>
                    <vector_icons_1.Ionicons name="time-outline" size={13} color={theme.textMuted} style={{ marginRight: 4 }}/>
                    <react_native_1.Text style={[styles.turfSubtext, { color: theme.textMuted }]}>
                      {openingTime} - {closingTime}
                    </react_native_1.Text>
                  </react_native_1.View>
                </react_native_1.View>
              </react_native_1.View>
              <vector_icons_1.Ionicons name="chevron-forward" size={16} color={theme.textMuted}/>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>

          {/* Account Overview Section */}
          <react_native_1.View style={styles.section}>
            <react_native_1.Text style={[styles.sectionTitle, { color: theme.text }]}>Account Overview</react_native_1.Text>
            <react_native_1.View style={styles.metricsGrid}>
              <react_native_1.View style={styles.metricsRow}>
                {/* Box 1: Bookings */}
                <react_native_1.View style={[styles.metricBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <react_native_1.View style={[styles.metricIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                    <vector_icons_1.Ionicons name="calendar-outline" size={18} color={ACCENT}/>
                  </react_native_1.View>
                  <react_native_1.Text style={[styles.metricVal, { color: theme.text }]}>{profile.totalBookings}</react_native_1.Text>
                  <react_native_1.Text style={[styles.metricLbl, { color: theme.textMuted }]}>Total Bookings</react_native_1.Text>
                </react_native_1.View>
                {/* Box 2: Customers */}
                <react_native_1.View style={[styles.metricBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <react_native_1.View style={[styles.metricIconWrap, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                    <vector_icons_1.Ionicons name="people-outline" size={18} color="#3b82f6"/>
                  </react_native_1.View>
                  <react_native_1.Text style={[styles.metricVal, { color: theme.text }]}>{profile.totalCustomers}</react_native_1.Text>
                  <react_native_1.Text style={[styles.metricLbl, { color: theme.textMuted }]}>Total Customers</react_native_1.Text>
                </react_native_1.View>
              </react_native_1.View>

              <react_native_1.View style={styles.metricsRow}>
                {/* Box 3: Rating */}
                <react_native_1.View style={[styles.metricBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <react_native_1.View style={[styles.metricIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                    <vector_icons_1.Ionicons name="star-outline" size={18} color="#f59e0b"/>
                  </react_native_1.View>
                  <react_native_1.Text style={[styles.metricVal, { color: theme.text }]}>{profile.rating}</react_native_1.Text>
                  <react_native_1.Text style={[styles.metricLbl, { color: theme.textMuted }]}>Average Rating</react_native_1.Text>
                </react_native_1.View>
                {/* Box 4: Earnings */}
                <react_native_1.View style={[styles.metricBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <react_native_1.View style={[styles.metricIconWrap, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
                    <vector_icons_1.Ionicons name="wallet-outline" size={18} color="#a855f7"/>
                  </react_native_1.View>
                  <react_native_1.Text style={[styles.metricVal, { color: theme.text }]}>₹{profile.totalRevenue?.toLocaleString('en-IN')}</react_native_1.Text>
                  <react_native_1.Text style={[styles.metricLbl, { color: theme.textMuted }]}>Total Earnings</react_native_1.Text>
                </react_native_1.View>
              </react_native_1.View>
            </react_native_1.View>
          </react_native_1.View>

          {/* Options List Menu */}
          <react_native_1.View style={[styles.optionsListCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <react_native_1.TouchableOpacity style={styles.optionRow} activeOpacity={0.7} onPress={() => setShowPayoutModal(true)}>
              <react_native_1.View style={styles.optionLeft}>
                <react_native_1.View style={[styles.optionIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.08)' }]}>
                  <vector_icons_1.Ionicons name="card-outline" size={18} color={ACCENT}/>
                </react_native_1.View>
                <react_native_1.View style={styles.optionTextWrap}>
                  <react_native_1.Text style={[styles.optionTitle, { color: theme.text }]}>Payout Details</react_native_1.Text>
                  <react_native_1.Text style={[styles.optionSub, { color: theme.textMuted }]}>Manage your bank account and payouts</react_native_1.Text>
                </react_native_1.View>
              </react_native_1.View>
              <vector_icons_1.Ionicons name="chevron-forward" size={16} color={theme.textMuted}/>
            </react_native_1.TouchableOpacity>

            <react_native_1.View style={[styles.optionDivider, { backgroundColor: theme.divider }]}/>

            <react_native_1.TouchableOpacity style={styles.optionRow} activeOpacity={0.7} onPress={() => setShowAvailabilityModal(true)}>
              <react_native_1.View style={styles.optionLeft}>
                <react_native_1.View style={[styles.optionIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.08)' }]}>
                  <vector_icons_1.Ionicons name="calendar-outline" size={18} color="#3b82f6"/>
                </react_native_1.View>
                <react_native_1.View style={styles.optionTextWrap}>
                  <react_native_1.Text style={[styles.optionTitle, { color: theme.text }]}>Availability Settings</react_native_1.Text>
                  <react_native_1.Text style={[styles.optionSub, { color: theme.textMuted }]}>Set your turf availability and slot timings</react_native_1.Text>
                </react_native_1.View>
              </react_native_1.View>
              <vector_icons_1.Ionicons name="chevron-forward" size={16} color={theme.textMuted}/>
            </react_native_1.TouchableOpacity>

            <react_native_1.View style={[styles.optionDivider, { backgroundColor: theme.divider }]}/>

            <react_native_1.TouchableOpacity style={styles.optionRow} activeOpacity={0.7} onPress={() => setShowNotificationModal(true)}>
              <react_native_1.View style={styles.optionLeft}>
                <react_native_1.View style={[styles.optionIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.08)' }]}>
                  <vector_icons_1.Ionicons name="notifications-outline" size={18} color="#f59e0b"/>
                </react_native_1.View>
                <react_native_1.View style={styles.optionTextWrap}>
                  <react_native_1.Text style={[styles.optionTitle, { color: theme.text }]}>Notification Settings</react_native_1.Text>
                  <react_native_1.Text style={[styles.optionSub, { color: theme.textMuted }]}>Manage your notification preferences</react_native_1.Text>
                </react_native_1.View>
              </react_native_1.View>
              <vector_icons_1.Ionicons name="chevron-forward" size={16} color={theme.textMuted}/>
            </react_native_1.TouchableOpacity>

            <react_native_1.View style={[styles.optionDivider, { backgroundColor: theme.divider }]}/>

            <react_native_1.TouchableOpacity style={styles.optionRow} activeOpacity={0.7} onPress={() => setShowChangePasswordModal(true)}>
              <react_native_1.View style={styles.optionLeft}>
                <react_native_1.View style={[styles.optionIconBox, { backgroundColor: 'rgba(168, 85, 247, 0.08)' }]}>
                  <vector_icons_1.Ionicons name="lock-closed-outline" size={18} color="#a855f7"/>
                </react_native_1.View>
                <react_native_1.View style={styles.optionTextWrap}>
                  <react_native_1.Text style={[styles.optionTitle, { color: theme.text }]}>Change Password</react_native_1.Text>
                  <react_native_1.Text style={[styles.optionSub, { color: theme.textMuted }]}>Update your account password</react_native_1.Text>
                </react_native_1.View>
              </react_native_1.View>
              <vector_icons_1.Ionicons name="chevron-forward" size={16} color={theme.textMuted}/>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>

          {/* Logout Button */}
          <react_native_1.TouchableOpacity style={[styles.logoutButton, { backgroundColor: isDarkMode ? 'rgba(239,68,68,0.1)' : '#fef2f2', borderColor: isDarkMode ? 'rgba(239,68,68,0.2)' : '#fee2e2' }]} activeOpacity={0.7} onPress={handleLogout}>
            <vector_icons_1.Ionicons name="log-out-outline" size={18} color="#ef4444" style={{ marginRight: 6 }}/>
            <react_native_1.Text style={styles.logoutText}>Logout</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>

        <react_native_1.Text style={[styles.versionText, { color: theme.textMuted }]}>TurfBook Owner Panel · v1.0.0</react_native_1.Text>

      </react_native_1.ScrollView>

      {/* Edit Profile Dialog Modal */}
      <react_native_1.Modal visible={isEditing} transparent animationType="slide">
        <react_native_1.View style={styles.modalBackdrop}>
          <react_native_1.View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <react_native_1.Text style={[styles.modalTitle, { color: theme.text }]}>Edit Profile</react_native_1.Text>

            <react_native_1.Text style={[styles.inputLabel, { color: theme.textMuted }]}>FULL NAME</react_native_1.Text>
            <react_native_1.TextInput value={formName} onChangeText={setFormName} style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]} placeholderTextColor={theme.textMuted}/>

            <react_native_1.Text style={[styles.inputLabel, { color: theme.textMuted }]}>PHONE NUMBER</react_native_1.Text>
            <react_native_1.TextInput value={formPhone} onChangeText={setFormPhone} keyboardType="phone-pad" style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]} placeholderTextColor={theme.textMuted}/>

            <react_native_1.Text style={[styles.inputLabel, { color: theme.textMuted }]}>BUSINESS NAME</react_native_1.Text>
            <react_native_1.TextInput value={formBusiness} onChangeText={setFormBusiness} placeholder="Your turf business name" placeholderTextColor={theme.textMuted} style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}/>

            <react_native_1.View style={styles.modalActions}>
              <react_native_1.TouchableOpacity style={[styles.modalCancelBtn, { borderColor: theme.cardBorder }]} onPress={() => setIsEditing(false)}>
                <react_native_1.Text style={[styles.modalCancelText, { color: theme.textMuted }]}>Cancel</react_native_1.Text>
              </react_native_1.TouchableOpacity>
              <react_native_1.TouchableOpacity style={styles.modalSaveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <react_native_1.ActivityIndicator size="small" color="#fff"/> : (<react_native_1.Text style={styles.modalSaveText}>Save Changes</react_native_1.Text>)}
              </react_native_1.TouchableOpacity>
            </react_native_1.View>
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.Modal>

      {/* Payout Details Modal */}
      <react_native_1.Modal visible={showPayoutModal} transparent animationType="slide" onRequestClose={() => setShowPayoutModal(false)}>
        <react_native_1.View style={styles.modalBackdrop}>
          <react_native_1.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 40, alignItems: 'center' }}>
            <react_native_1.View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <react_native_1.Text style={[styles.modalTitle, { color: theme.text }]}>Payout Details</react_native_1.Text>
              
              <react_native_1.Text style={[styles.inputLabel, { color: theme.textMuted }]}>RAZORPAY KEY ID</react_native_1.Text>
              <react_native_1.TextInput value={razorpayKeyId} onChangeText={setRazorpayKeyId} placeholder="rzp_test_..." placeholderTextColor={theme.textMuted} style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}/>

              <react_native_1.Text style={[styles.inputLabel, { color: theme.textMuted }]}>RAZORPAY KEY SECRET</react_native_1.Text>
              <react_native_1.TextInput value={razorpayKeySecret} onChangeText={setRazorpayKeySecret} placeholder="••••••••••••••••" placeholderTextColor={theme.textMuted} secureTextEntry style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}/>

              <react_native_1.Text style={[styles.inputLabel, { color: theme.textMuted }]}>BUSINESS UPI ID (DIRECT SETTLEMENT)</react_native_1.Text>
              <react_native_1.TextInput value={businessUpiId} onChangeText={setBusinessUpiId} placeholder="merchant@upi" placeholderTextColor={theme.textMuted} autoCapitalize="none" style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}/>

              <react_native_1.View style={{ flexDirection: 'row', gap: 12 }}>
                <react_native_1.View style={{ flex: 1 }}>
                  <react_native_1.Text style={[styles.inputLabel, { color: theme.textMuted }]}>CONVENIENCE FEE (₹)</react_native_1.Text>
                  <react_native_1.TextInput value={convenienceFee} onChangeText={setConvenienceFee} keyboardType="numeric" style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}/>
                </react_native_1.View>
                <react_native_1.View style={{ flex: 1 }}>
                  <react_native_1.Text style={[styles.inputLabel, { color: theme.textMuted }]}>GST / TAX RATE (%)</react_native_1.Text>
                  <react_native_1.TextInput value={taxRate} onChangeText={setTaxRate} keyboardType="numeric" style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}/>
                </react_native_1.View>
              </react_native_1.View>

              <react_native_1.Text style={[styles.inputLabel, { color: theme.textMuted }]}>ADVANCE BOOKING PAY SPLIT (%)</react_native_1.Text>
              <react_native_1.TextInput value={advancePaymentPercent} onChangeText={setAdvancePaymentPercent} keyboardType="numeric" placeholder="30" placeholderTextColor={theme.textMuted} style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}/>

              <react_native_1.View style={styles.modalActions}>
                <react_native_1.TouchableOpacity style={[styles.modalCancelBtn, { borderColor: theme.cardBorder }]} onPress={() => setShowPayoutModal(false)}>
                  <react_native_1.Text style={[styles.modalCancelText, { color: theme.textMuted }]}>Cancel</react_native_1.Text>
                </react_native_1.TouchableOpacity>
                <react_native_1.TouchableOpacity style={styles.modalSaveBtn} onPress={handleSavePayout} disabled={savingPayout}>
                  {savingPayout ? <react_native_1.ActivityIndicator size="small" color="#fff"/> : (<react_native_1.Text style={styles.modalSaveText}>Save Payouts</react_native_1.Text>)}
                </react_native_1.TouchableOpacity>
              </react_native_1.View>
            </react_native_1.View>
          </react_native_1.ScrollView>
        </react_native_1.View>
      </react_native_1.Modal>

      {/* Availability Settings Modal */}
      <react_native_1.Modal visible={showAvailabilityModal} transparent animationType="slide" onRequestClose={() => setShowAvailabilityModal(false)}>
        <react_native_1.View style={styles.modalBackdrop}>
          <react_native_1.View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <react_native_1.Text style={[styles.modalTitle, { color: theme.text }]}>Availability Settings</react_native_1.Text>

            <react_native_1.View style={{ flexDirection: 'row', gap: 12 }}>
              <react_native_1.View style={{ flex: 1 }}>
                <react_native_1.Text style={[styles.inputLabel, { color: theme.textMuted }]}>OPEN TIME</react_native_1.Text>
                <react_native_1.TextInput value={openingTime} onChangeText={setOpeningTime} placeholder="HH:MM" placeholderTextColor={theme.textMuted} style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}/>
              </react_native_1.View>
              <react_native_1.View style={{ flex: 1 }}>
                <react_native_1.Text style={[styles.inputLabel, { color: theme.textMuted }]}>CLOSE TIME</react_native_1.Text>
                <react_native_1.TextInput value={closingTime} onChangeText={setClosingTime} placeholder="HH:MM" placeholderTextColor={theme.textMuted} style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}/>
              </react_native_1.View>
            </react_native_1.View>

            <react_native_1.Text style={[styles.inputLabel, { color: theme.textMuted }]}>AUTO-CANCELLATION TIMER (MINUTES)</react_native_1.Text>
            <react_native_1.TextInput value={autoCancellationLimit} onChangeText={setAutoCancellationLimit} keyboardType="numeric" style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}/>

            <react_native_1.View style={styles.modalActions}>
              <react_native_1.TouchableOpacity style={[styles.modalCancelBtn, { borderColor: theme.cardBorder }]} onPress={() => setShowAvailabilityModal(false)}>
                <react_native_1.Text style={[styles.modalCancelText, { color: theme.textMuted }]}>Cancel</react_native_1.Text>
              </react_native_1.TouchableOpacity>
              <react_native_1.TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveAvailability} disabled={savingAvailability}>
                {savingAvailability ? <react_native_1.ActivityIndicator size="small" color="#fff"/> : (<react_native_1.Text style={styles.modalSaveText}>Save Settings</react_native_1.Text>)}
              </react_native_1.TouchableOpacity>
            </react_native_1.View>
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.Modal>

      {/* Notification Settings Modal */}
      <react_native_1.Modal visible={showNotificationModal} transparent animationType="slide" onRequestClose={() => setShowNotificationModal(false)}>
        <react_native_1.View style={styles.modalBackdrop}>
          <react_native_1.View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <react_native_1.Text style={[styles.modalTitle, { color: theme.text }]}>Notification Settings</react_native_1.Text>

            <react_native_1.View style={styles.switchRow}>
              <react_native_1.View style={styles.switchTextWrap}>
                <react_native_1.Text style={[styles.switchLabel, { color: theme.text }]}>Email Notifications</react_native_1.Text>
                <react_native_1.Text style={[styles.switchSub, { color: theme.textMuted }]}>Receive daily activity reports</react_native_1.Text>
              </react_native_1.View>
              <react_native_1.Switch value={emailNotif} onValueChange={setEmailNotif} trackColor={{ false: theme.divider, true: ACCENT }} thumbColor={react_native_1.Platform.OS === 'android' ? '#ffffff' : undefined}/>
            </react_native_1.View>

            <react_native_1.View style={styles.switchRow}>
              <react_native_1.View style={styles.switchTextWrap}>
                <react_native_1.Text style={[styles.switchLabel, { color: theme.text }]}>SMS / WhatsApp Alerts</react_native_1.Text>
                <react_native_1.Text style={[styles.switchSub, { color: theme.textMuted }]}>Get customer booking alerts</react_native_1.Text>
              </react_native_1.View>
              <react_native_1.Switch value={smsNotif} onValueChange={smsNotif ? () => setSmsNotif(false) : () => setSmsNotif(true)} trackColor={{ false: theme.divider, true: ACCENT }} thumbColor={react_native_1.Platform.OS === 'android' ? '#ffffff' : undefined}/>
            </react_native_1.View>

            <react_native_1.View style={styles.switchRow}>
              <react_native_1.View style={styles.switchTextWrap}>
                <react_native_1.Text style={[styles.switchLabel, { color: theme.text }]}>New Booking Notification</react_native_1.Text>
                <react_native_1.Text style={[styles.switchSub, { color: theme.textMuted }]}>Instant notification for bookings</react_native_1.Text>
              </react_native_1.View>
              <react_native_1.Switch value={bookingNotif} onValueChange={setBookingNotif} trackColor={{ false: theme.divider, true: ACCENT }} thumbColor={react_native_1.Platform.OS === 'android' ? '#ffffff' : undefined}/>
            </react_native_1.View>

            <react_native_1.View style={styles.switchRow}>
              <react_native_1.View style={styles.switchTextWrap}>
                <react_native_1.Text style={[styles.switchLabel, { color: theme.text }]}>Weekly Payout Summary</react_native_1.Text>
                <react_native_1.Text style={[styles.switchSub, { color: theme.textMuted }]}>Receive revenue summaries</react_native_1.Text>
              </react_native_1.View>
              <react_native_1.Switch value={weeklyReports} onValueChange={setWeeklyReports} trackColor={{ false: theme.divider, true: ACCENT }} thumbColor={react_native_1.Platform.OS === 'android' ? '#ffffff' : undefined}/>
            </react_native_1.View>

            <react_native_1.View style={styles.modalActions}>
              <react_native_1.TouchableOpacity style={[styles.modalCancelBtn, { borderColor: theme.cardBorder }]} onPress={() => setShowNotificationModal(false)}>
                <react_native_1.Text style={[styles.modalCancelText, { color: theme.textMuted }]}>Cancel</react_native_1.Text>
              </react_native_1.TouchableOpacity>
              <react_native_1.TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveNotifications}>
                <react_native_1.Text style={styles.modalSaveText}>Save Preferences</react_native_1.Text>
              </react_native_1.TouchableOpacity>
            </react_native_1.View>
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.Modal>

      {/* Change Password Modal */}
      <react_native_1.Modal visible={showChangePasswordModal} transparent animationType="slide" onRequestClose={() => setShowChangePasswordModal(false)}>
        <react_native_1.View style={styles.modalBackdrop}>
          <react_native_1.View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <react_native_1.Text style={[styles.modalTitle, { color: theme.text }]}>Change Password</react_native_1.Text>

            <react_native_1.Text style={[styles.inputLabel, { color: theme.textMuted }]}>CURRENT PASSWORD</react_native_1.Text>
            <react_native_1.TextInput value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry placeholder="Enter current password" placeholderTextColor={theme.textMuted} style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}/>

            <react_native_1.Text style={[styles.inputLabel, { color: theme.textMuted }]}>NEW PASSWORD</react_native_1.Text>
            <react_native_1.TextInput value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="At least 8 characters" placeholderTextColor={theme.textMuted} style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}/>

            <react_native_1.Text style={[styles.inputLabel, { color: theme.textMuted }]}>CONFIRM NEW PASSWORD</react_native_1.Text>
            <react_native_1.TextInput value={confirmNewPassword} onChangeText={setConfirmNewPassword} secureTextEntry placeholder="Re-enter new password" placeholderTextColor={theme.textMuted} style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}/>

            <react_native_1.View style={styles.modalActions}>
              <react_native_1.TouchableOpacity style={[styles.modalCancelBtn, { borderColor: theme.cardBorder }]} onPress={() => setShowChangePasswordModal(false)}>
                <react_native_1.Text style={[styles.modalCancelText, { color: theme.textMuted }]}>Cancel</react_native_1.Text>
              </react_native_1.TouchableOpacity>
              <react_native_1.TouchableOpacity style={styles.modalSaveBtn} onPress={handleChangePassword} disabled={changingPassword}>
                {changingPassword ? <react_native_1.ActivityIndicator size="small" color="#fff"/> : (<react_native_1.Text style={styles.modalSaveText}>Change Password</react_native_1.Text>)}
              </react_native_1.TouchableOpacity>
            </react_native_1.View>
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.Modal>

    </react_native_1.View>);
}
const styles = react_native_1.StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    headerBg: {
        width: '100%',
        height: 240, // Matches Dashboard exactly
        overflow: 'hidden',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    headerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    headerInnerContent: {
        flex: 1,
        paddingHorizontal: 20,
        justifyContent: 'space-between',
        paddingBottom: 55,
    },
    darkOverlay: {
        ...react_native_1.StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.45)', // Dynamic overlay contrast
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    themeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    headerContent: {
        marginTop: 10,
    },
    headerTitle: {
        fontSize: 28, // Paved layout title font size
        fontWeight: '900', // Heavy weighted font for premium feel
        color: '#ffffff',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.85)',
        fontWeight: '600',
    },
    overlapWrapper: {
        marginTop: -40, // Matches Dashboard overlap offset exactly
        paddingHorizontal: 20, // Matches Dashboard overlap horizontal padding exactly
        zIndex: 20, // Matches Dashboard overlap layout stack ordering
    },
    profileCard: {
        borderRadius: 20, // Matches Dashboard overviewCard corner radius exactly
        borderWidth: 1,
        padding: 20,
        shadowColor: '#000000', // Matches Dashboard shadow configurations exactly
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    profileMainRow: {
        flexDirection: 'row',
        alignItems: 'center', // Aligned center for profile items
        position: 'relative',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 16,
    },
    avatarCircle: {
        width: 80, // Enlarged avatar dimensions
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: ACCENT,
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitial: {
        fontSize: 32,
        fontWeight: '800',
        color: ACCENT,
    },
    cameraIconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: ACCENT,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#ffffff',
    },
    profileInfoColumn: {
        flex: 1,
        justifyContent: 'center',
        paddingRight: 36, // Ensure name doesn't overlap the edit button
    },
    profileName: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 4,
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        marginBottom: 8,
    },
    roleBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    editProfileBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.25)',
        backgroundColor: 'rgba(16, 185, 129, 0.06)',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        right: 0,
        top: 0,
    },
    contactsWrap: {
        gap: 4,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    contactText: {
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 8,
    },
    mainContent: {
        paddingHorizontal: 20, // Matches Dashboard content margins exactly
        gap: 20,
        marginTop: 20,
    },
    verificationBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
    },
    verificationLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    verificationTitle: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 2,
    },
    verificationSub: {
        fontSize: 11,
        fontWeight: '600',
    },
    section: {
        gap: 10, // Spacing between header title and cards
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '800',
    },
    turfCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 20,
        borderWidth: 1,
    },
    turfLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    turfIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    turfInfo: {
        flex: 1,
    },
    turfTitle: {
        fontSize: 14,
        fontWeight: '800',
        marginBottom: 4,
    },
    turfSubRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    turfSubtext: {
        fontSize: 11,
        fontWeight: '600',
        flex: 1,
    },
    metricsGrid: {
        gap: 12,
    },
    metricsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    metricBox: {
        flex: 1,
        borderRadius: 20,
        borderWidth: 1,
        padding: 14,
    },
    metricIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    metricVal: {
        fontSize: 20, // Increased font size for statistics values
        fontWeight: '900',
        marginBottom: 2,
    },
    metricLbl: {
        fontSize: 11,
        fontWeight: '700',
    },
    optionsListCard: {
        borderRadius: 24,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 4,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
    },
    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    optionIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    optionTextWrap: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 2,
    },
    optionSub: {
        fontSize: 11,
        fontWeight: '600',
    },
    optionDivider: {
        height: 1,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
    },
    logoutText: {
        color: '#ef4444',
        fontSize: 14,
        fontWeight: '800',
    },
    versionText: {
        textAlign: 'center',
        fontSize: 11,
        fontWeight: '700',
        marginTop: 20,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCard: {
        width: SCREEN_WIDTH - 40,
        borderRadius: 24,
        borderWidth: 1,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 1.2,
        marginBottom: 6,
    },
    modalInput: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 12,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 8,
    },
    modalCancelBtn: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: 13,
        fontWeight: '700',
    },
    modalSaveBtn: {
        flex: 2,
        backgroundColor: ACCENT,
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalSaveText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '800',
    },
    settingsScroll: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    sectionSubtitle: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.2,
        marginVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(16,185,129,0.2)',
        paddingBottom: 4,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    switchTextWrap: {
        flex: 1,
        marginRight: 12,
    },
    switchLabel: {
        fontSize: 13.5,
        fontWeight: '700',
    },
    switchSub: {
        fontSize: 11,
        fontWeight: '500',
        marginTop: 2,
    },
});
