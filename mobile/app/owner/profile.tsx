import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  ImageBackground,
  Dimensions,
  Modal,
  Switch,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { apiFetch } from '../../utils/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ACCENT = '#10b981';
const TURF_BG = require('../../assets/turf-bg.jpg');

interface OwnerProfile {
  name?: string;
  email?: string;
  phone?: string;
  businessName?: string;
  totalRevenue?: number;
  totalTurfs?: number;
  totalBookings?: number;
  totalCustomers?: number;
  rating?: number;
  turfAddress?: string;
}

export default function OwnerProfileScreen() {
  const { user, isAuthenticated, updateUser, logout } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [profile, setProfile] = useState<OwnerProfile>({});
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // Modals Visibility States
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  const [saving, setSaving] = useState(false);
  const [savingPayout, setSavingPayout] = useState(false);
  const [savingAvailability, setSavingAvailability] = useState(false);

  // Notification configurations
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(true);
  const [bookingNotif, setBookingNotif] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);

  // Change Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formBusiness, setFormBusiness] = useState('');

  // Configuration settings states
  const [businessUpiId, setBusinessUpiId] = useState('');
  const [advancePaymentPercent, setAdvancePaymentPercent] = useState('30');
  const [convenienceFee, setConvenienceFee] = useState('45');
  const [taxRate, setTaxRate] = useState('18');
  const [autoCancellationLimit, setAutoCancellationLimit] = useState('5');
  const [openingTime, setOpeningTime] = useState('06:00 AM');
  const [closingTime, setClosingTime] = useState('11:00 PM');

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
    if (!isAuthenticated || !user) return;
    try {
      const [profileRes, dashboardRes, turfsRes] = await Promise.all([
        apiFetch('/owner/profile'),
        apiFetch('/owner/dashboard'),
        apiFetch('/owner/turfs'),
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
    } catch (err) {
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [isAuthenticated, user]);

  // Guard: only for TURF_OWNER & CARETAKER role
  if (!isAuthenticated || !user) return <Redirect href="/login" />;
  if (user.role !== 'TURF_OWNER' && user.role !== 'CARETAKER') return <Redirect href="/" />;

  const handleSave = async () => {
    if (!formName.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      await apiFetch('/owner/profile', {
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
      Alert.alert('Saved', 'Your profile has been updated.');
      setIsEditing(false);
    } catch (err) {
      console.log('Failed to update profile', err);
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePayout = async () => {
    setSavingPayout(true);
    try {
      await apiFetch('/owner/profile', {
        method: 'PUT',
        body: {
          businessUpiId,
          convenienceFee: Number(convenienceFee),
          taxRate: Number(taxRate),
          advancePaymentPercent: Number(advancePaymentPercent),
        },
      });
      Alert.alert('Saved', 'Payout details saved successfully.');
      setShowPayoutModal(false);
    } catch (err) {
      console.log('Failed to save payout details', err);
      Alert.alert('Error', 'Failed to save payout details.');
    } finally {
      setSavingPayout(false);
    }
  };

  const handleSaveAvailability = async () => {
    setSavingAvailability(true);
    try {
      await apiFetch('/owner/profile', {
        method: 'PUT',
        body: {
          openingTime,
          closingTime,
          autoCancellationLimit: Number(autoCancellationLimit),
        },
      });
      Alert.alert('Saved', 'Availability settings saved successfully.');
      setShowAvailabilityModal(false);
    } catch (err) {
      console.log('Failed to save availability settings', err);
      Alert.alert('Error', 'Failed to save availability settings.');
    } finally {
      setSavingAvailability(false);
    }
  };

  const handleSaveNotifications = () => {
    Alert.alert('Saved', 'Notification preferences saved successfully.');
    setShowNotificationModal(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Alert.alert('Error', 'Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
    setChangingPassword(true);
    try {
      const res = await apiFetch('/auth/change-password', {
        method: 'POST',
        body: {
          currentPassword,
          newPassword,
        },
      });
      if (res.success) {
        Alert.alert('Success', 'Password changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setShowChangePasswordModal(false);
      } else {
        Alert.alert('Error', res.message || 'Failed to change password.');
      }
    } catch (err: any) {
      console.log('Failed to change password', err);
      Alert.alert('Error', err.message || 'Failed to change password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
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
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView 
        style={{ backgroundColor: theme.bg }}
        contentContainerStyle={{ paddingBottom: 40 }} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* Full-bleed header with premium curved styling */}
        <ImageBackground
          source={TURF_BG}
          style={[styles.headerBg, { paddingTop: insets.top + 16 }]}
          imageStyle={styles.headerImage}
          resizeMode="cover"
        >
          <View style={styles.darkOverlay} />
          
          <View style={styles.headerInnerContent}>
            <View style={styles.headerTopRow}>
              <TouchableOpacity 
                style={styles.backBtn} 
                activeOpacity={0.7}
                onPress={() => router.push('/owner')}
              >
                <Ionicons name="chevron-back" size={20} color="#ffffff" />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={toggleTheme}
                style={styles.themeBtn}
                hitSlop={8}
              >
                <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Profile</Text>
              <Text style={styles.headerSubtitle}>Manage your profile and turf details</Text>
            </View>
          </View>
        </ImageBackground>

        {/* Profile Details Container (Overlapping) */}
        <View style={styles.overlapWrapper}>
          <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            
            {/* Top row with Photo and Profile details next to it */}
            <View style={styles.profileMainRow}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>
                    {(profile.name || 'O').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <TouchableOpacity style={styles.cameraIconBadge} activeOpacity={0.8}>
                  <Ionicons name="camera-outline" size={12} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <View style={styles.profileInfoColumn}>
                <Text style={[styles.profileName, { color: theme.text }]} numberOfLines={1}>{profile.name}</Text>
                
                <View style={[styles.roleBadge, { backgroundColor: theme.badgeGreen }]}>
                  <Ionicons name="ribbon-outline" size={10} color={theme.badgeGreenText} style={{ marginRight: 3 }} />
                  <Text style={[styles.roleBadgeText, { color: theme.badgeGreenText }]}>Turf Owner</Text>
                </View>

                <View style={styles.contactsWrap}>
                  <View style={styles.contactRow}>
                    <Ionicons name="call-outline" size={13} color={theme.textMuted} style={{ marginRight: 6 }} />
                    <Text style={[styles.contactText, { color: theme.textMuted }]}>{profile.phone}</Text>
                  </View>
                  <View style={styles.contactRow}>
                    <Ionicons name="mail-outline" size={13} color={theme.textMuted} style={{ marginRight: 6 }} />
                    <Text style={[styles.contactText, { color: theme.textMuted }]} numberOfLines={1}>{profile.email}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.editProfileBtn} 
                activeOpacity={0.7}
                onPress={() => setIsEditing(true)}
              >
                <Ionicons name="pencil-outline" size={14} color={ACCENT} />
              </TouchableOpacity>
            </View>

          </View>
        </View>

        {/* Unified and consistently spaced main content */}
        <View style={styles.mainContent}>
          {/* Verification Status Bar */}
          <View style={[styles.verificationBar, { backgroundColor: isDarkMode ? 'rgba(16,185,129,0.08)' : '#ecfdf5', borderColor: isDarkMode ? 'rgba(16,185,129,0.15)' : '#d1fae5' }]}>
            <View style={styles.verificationLeft}>
              <Ionicons name="shield-checkmark-outline" size={20} color={ACCENT} style={{ marginRight: 10 }} />
              <View>
                <Text style={[styles.verificationTitle, { color: theme.text }]}>Verified Owner</Text>
                <Text style={[styles.verificationSub, { color: theme.textMuted }]}>Your account is verified and active.</Text>
              </View>
            </View>
            <Ionicons name="checkmark-circle" size={18} color={ACCENT} />
          </View>

          {/* Turf Details Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Turf Details</Text>
            <TouchableOpacity 
              style={[styles.turfCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              activeOpacity={0.7}
              onPress={() => router.push('/owner/turfs')}
            >
              <View style={styles.turfLeft}>
                <View style={[styles.turfIconBox, { backgroundColor: isDarkMode ? 'rgba(16,185,129,0.12)' : '#ecfdf5' }]}>
                  <Ionicons name="football-outline" size={20} color={ACCENT} />
                </View>
                <View style={styles.turfInfo}>
                  <Text style={[styles.turfTitle, { color: theme.text }]}>{profile.businessName}</Text>
                  <View style={styles.turfSubRow}>
                    <Ionicons name="location-outline" size={13} color={theme.textMuted} style={{ marginRight: 4 }} />
                    <Text style={[styles.turfSubtext, { color: theme.textMuted }]} numberOfLines={1}>
                      {profile.turfAddress}
                    </Text>
                  </View>
                  <View style={styles.turfSubRow}>
                    <Ionicons name="time-outline" size={13} color={theme.textMuted} style={{ marginRight: 4 }} />
                    <Text style={[styles.turfSubtext, { color: theme.textMuted }]}>
                      {openingTime} - {closingTime}
                    </Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Account Overview Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Account Overview</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricsRow}>
                {/* Box 1: Bookings */}
                <View style={[styles.metricBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                    <Ionicons name="calendar-outline" size={18} color={ACCENT} />
                  </View>
                  <Text style={[styles.metricVal, { color: theme.text }]}>{profile.totalBookings}</Text>
                  <Text style={[styles.metricLbl, { color: theme.textMuted }]}>Total Bookings</Text>
                </View>
                {/* Box 2: Customers */}
                <View style={[styles.metricBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                    <Ionicons name="people-outline" size={18} color="#3b82f6" />
                  </View>
                  <Text style={[styles.metricVal, { color: theme.text }]}>{profile.totalCustomers}</Text>
                  <Text style={[styles.metricLbl, { color: theme.textMuted }]}>Total Customers</Text>
                </View>
              </View>

              <View style={styles.metricsRow}>
                {/* Box 3: Rating */}
                <View style={[styles.metricBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                    <Ionicons name="star-outline" size={18} color="#f59e0b" />
                  </View>
                  <Text style={[styles.metricVal, { color: theme.text }]}>{profile.rating}</Text>
                  <Text style={[styles.metricLbl, { color: theme.textMuted }]}>Average Rating</Text>
                </View>
                {/* Box 4: Earnings */}
                <View style={[styles.metricBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
                    <Ionicons name="wallet-outline" size={18} color="#a855f7" />
                  </View>
                  <Text style={[styles.metricVal, { color: theme.text }]}>₹{profile.totalRevenue?.toLocaleString('en-IN')}</Text>
                  <Text style={[styles.metricLbl, { color: theme.textMuted }]}>Total Earnings</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Options List Menu */}
          <View style={[styles.optionsListCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <TouchableOpacity 
              style={styles.optionRow} 
              activeOpacity={0.7}
              onPress={() => setShowPayoutModal(true)}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.optionIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.08)' }]}>
                  <Ionicons name="card-outline" size={18} color={ACCENT} />
                </View>
                <View style={styles.optionTextWrap}>
                  <Text style={[styles.optionTitle, { color: theme.text }]}>Payout Details</Text>
                  <Text style={[styles.optionSub, { color: theme.textMuted }]}>Manage your bank account and payouts</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </TouchableOpacity>

            <View style={[styles.optionDivider, { backgroundColor: theme.divider }]} />

            <TouchableOpacity 
              style={styles.optionRow} 
              activeOpacity={0.7}
              onPress={() => setShowAvailabilityModal(true)}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.optionIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.08)' }]}>
                  <Ionicons name="calendar-outline" size={18} color="#3b82f6" />
                </View>
                <View style={styles.optionTextWrap}>
                  <Text style={[styles.optionTitle, { color: theme.text }]}>Availability Settings</Text>
                  <Text style={[styles.optionSub, { color: theme.textMuted }]}>Set your turf availability and slot timings</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </TouchableOpacity>

            <View style={[styles.optionDivider, { backgroundColor: theme.divider }]} />

            <TouchableOpacity 
              style={styles.optionRow} 
              activeOpacity={0.7}
              onPress={() => setShowNotificationModal(true)}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.optionIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.08)' }]}>
                  <Ionicons name="notifications-outline" size={18} color="#f59e0b" />
                </View>
                <View style={styles.optionTextWrap}>
                  <Text style={[styles.optionTitle, { color: theme.text }]}>Notification Settings</Text>
                  <Text style={[styles.optionSub, { color: theme.textMuted }]}>Manage your notification preferences</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </TouchableOpacity>

            <View style={[styles.optionDivider, { backgroundColor: theme.divider }]} />

            <TouchableOpacity 
              style={styles.optionRow} 
              activeOpacity={0.7}
              onPress={() => setShowChangePasswordModal(true)}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.optionIconBox, { backgroundColor: 'rgba(168, 85, 247, 0.08)' }]}>
                  <Ionicons name="lock-closed-outline" size={18} color="#a855f7" />
                </View>
                <View style={styles.optionTextWrap}>
                  <Text style={[styles.optionTitle, { color: theme.text }]}>Change Password</Text>
                  <Text style={[styles.optionSub, { color: theme.textMuted }]}>Update your account password</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: isDarkMode ? 'rgba(239,68,68,0.1)' : '#fef2f2', borderColor: isDarkMode ? 'rgba(239,68,68,0.2)' : '#fee2e2' }]} 
            activeOpacity={0.7}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={18} color="#ef4444" style={{ marginRight: 6 }} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.versionText, { color: theme.textMuted }]}>TurfBook Owner Panel · v1.0.0</Text>

      </ScrollView>

      {/* Edit Profile Dialog Modal */}
      <Modal visible={isEditing} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Profile</Text>

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>FULL NAME</Text>
            <TextInput
              value={formName}
              onChangeText={setFormName}
              style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}
              placeholderTextColor={theme.textMuted}
            />

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>PHONE NUMBER</Text>
            <TextInput
              value={formPhone}
              onChangeText={setFormPhone}
              keyboardType="phone-pad"
              style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}
              placeholderTextColor={theme.textMuted}
            />

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>BUSINESS NAME</Text>
            <TextInput
              value={formBusiness}
              onChangeText={setFormBusiness}
              placeholder="Your turf business name"
              placeholderTextColor={theme.textMuted}
              style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: theme.cardBorder }]}
                onPress={() => setIsEditing(false)}
              >
                <Text style={[styles.modalCancelText, { color: theme.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : (
                  <Text style={styles.modalSaveText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payout Details Modal */}
      <Modal visible={showPayoutModal} transparent animationType="slide" onRequestClose={() => setShowPayoutModal(false)}>
        <View style={styles.modalBackdrop}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 40, alignItems: 'center' }}>
            <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Payout Details</Text>

              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>BUSINESS UPI ID (DIRECT SETTLEMENT)</Text>
              <TextInput
                value={businessUpiId}
                onChangeText={setBusinessUpiId}
                placeholder="merchant@upi"
                placeholderTextColor={theme.textMuted}
                autoCapitalize="none"
                style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: theme.textMuted }]}>CONVENIENCE FEE (₹)</Text>
                  <TextInput
                    value={convenienceFee}
                    onChangeText={setConvenienceFee}
                    keyboardType="numeric"
                    style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: theme.textMuted }]}>GST / TAX RATE (%)</Text>
                  <TextInput
                    value={taxRate}
                    onChangeText={setTaxRate}
                    keyboardType="numeric"
                    style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}
                  />
                </View>
              </View>

              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>ADVANCE BOOKING PAY SPLIT (%)</Text>
              <TextInput
                value={advancePaymentPercent}
                onChangeText={setAdvancePaymentPercent}
                keyboardType="numeric"
                placeholder="30"
                placeholderTextColor={theme.textMuted}
                style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalCancelBtn, { borderColor: theme.cardBorder }]}
                  onPress={() => setShowPayoutModal(false)}
                >
                  <Text style={[styles.modalCancelText, { color: theme.textMuted }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSavePayout} disabled={savingPayout}>
                  {savingPayout ? <ActivityIndicator size="small" color="#fff" /> : (
                    <Text style={styles.modalSaveText}>Save Payouts</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Availability Settings Modal */}
      <Modal visible={showAvailabilityModal} transparent animationType="slide" onRequestClose={() => setShowAvailabilityModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Availability Settings</Text>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>OPEN TIME</Text>
                <TextInput
                  value={openingTime}
                  onChangeText={setOpeningTime}
                  placeholder="HH:MM"
                  placeholderTextColor={theme.textMuted}
                  style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>CLOSE TIME</Text>
                <TextInput
                  value={closingTime}
                  onChangeText={setClosingTime}
                  placeholder="HH:MM"
                  placeholderTextColor={theme.textMuted}
                  style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}
                />
              </View>
            </View>

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>AUTO-CANCELLATION TIMER (MINUTES)</Text>
            <TextInput
              value={autoCancellationLimit}
              onChangeText={setAutoCancellationLimit}
              keyboardType="numeric"
              style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: theme.cardBorder }]}
                onPress={() => setShowAvailabilityModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: theme.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveAvailability} disabled={savingAvailability}>
                {savingAvailability ? <ActivityIndicator size="small" color="#fff" /> : (
                  <Text style={styles.modalSaveText}>Save Settings</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notification Settings Modal */}
      <Modal visible={showNotificationModal} transparent animationType="slide" onRequestClose={() => setShowNotificationModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Notification Settings</Text>

            <View style={styles.switchRow}>
              <View style={styles.switchTextWrap}>
                <Text style={[styles.switchLabel, { color: theme.text }]}>Email Notifications</Text>
                <Text style={[styles.switchSub, { color: theme.textMuted }]}>Receive daily activity reports</Text>
              </View>
              <Switch
                value={emailNotif}
                onValueChange={setEmailNotif}
                trackColor={{ false: theme.divider, true: ACCENT }}
                thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchTextWrap}>
                <Text style={[styles.switchLabel, { color: theme.text }]}>SMS / WhatsApp Alerts</Text>
                <Text style={[styles.switchSub, { color: theme.textMuted }]}>Get customer booking alerts</Text>
              </View>
              <Switch
                value={smsNotif}
                onValueChange={smsNotif ? () => setSmsNotif(false) : () => setSmsNotif(true)}
                trackColor={{ false: theme.divider, true: ACCENT }}
                thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchTextWrap}>
                <Text style={[styles.switchLabel, { color: theme.text }]}>New Booking Notification</Text>
                <Text style={[styles.switchSub, { color: theme.textMuted }]}>Instant notification for bookings</Text>
              </View>
              <Switch
                value={bookingNotif}
                onValueChange={setBookingNotif}
                trackColor={{ false: theme.divider, true: ACCENT }}
                thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchTextWrap}>
                <Text style={[styles.switchLabel, { color: theme.text }]}>Weekly Payout Summary</Text>
                <Text style={[styles.switchSub, { color: theme.textMuted }]}>Receive revenue summaries</Text>
              </View>
              <Switch
                value={weeklyReports}
                onValueChange={setWeeklyReports}
                trackColor={{ false: theme.divider, true: ACCENT }}
                thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: theme.cardBorder }]}
                onPress={() => setShowNotificationModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: theme.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveNotifications}>
                <Text style={styles.modalSaveText}>Save Preferences</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={showChangePasswordModal} transparent animationType="slide" onRequestClose={() => setShowChangePasswordModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Change Password</Text>

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>CURRENT PASSWORD</Text>
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              placeholder="Enter current password"
              placeholderTextColor={theme.textMuted}
              style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}
            />

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>NEW PASSWORD</Text>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="At least 8 characters"
              placeholderTextColor={theme.textMuted}
              style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}
            />

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>CONFIRM NEW PASSWORD</Text>
            <TextInput
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              secureTextEntry
              placeholder="Re-enter new password"
              placeholderTextColor={theme.textMuted}
              style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: theme.cardBorder }]}
                onPress={() => setShowChangePasswordModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: theme.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleChangePassword} disabled={changingPassword}>
                {changingPassword ? <ActivityIndicator size="small" color="#fff" /> : (
                  <Text style={styles.modalSaveText}>Change Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
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
    ...StyleSheet.absoluteFillObject,
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
