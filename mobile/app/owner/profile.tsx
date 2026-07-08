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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { apiFetch } from '../../utils/api';

const ACCENT = '#6366f1';

interface OwnerProfile {
  name?: string;
  email?: string;
  phone?: string;
  businessName?: string;
  totalRevenue?: number;
  totalTurfs?: number;
  totalBookings?: number;
}

export default function OwnerProfileScreen() {
  const { user, isAuthenticated, updateUser, logout } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [profile, setProfile] = useState<OwnerProfile>({});
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formBusiness, setFormBusiness] = useState('');

  const theme = {
    bg: isDarkMode ? '#030712' : '#f1f5f9',
    card: isDarkMode ? '#0f172a' : '#ffffff',
    cardBorder: isDarkMode ? '#1e293b' : '#e2e8f0',
    text: isDarkMode ? '#ffffff' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    headerBg: isDarkMode ? '#0f172a' : '#ffffff',
    inputBg: isDarkMode ? '#1e293b' : '#f8fafc',
  };

  if (!isAuthenticated || !user) return <Redirect href="/login" />;
  if (user.role !== 'TURF_OWNER') return <Redirect href="/" />;

  const initials = (user.name || 'O')
    .split(' ')
    .map((p) => p.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiFetch('/owner/profile');
        if (res.success && res.data) {
          setProfile(res.data);
          setFormName(res.data.name || user.name || '');
          setFormPhone(res.data.phone || user.phone || '');
          setFormBusiness(res.data.businessName || '');
        } else {
          throw new Error('No data');
        }
      } catch {
        // Fallback to store values
        setProfile({ name: user.name, email: user.email, phone: user.phone });
        setFormName(user.name || '');
        setFormPhone(user.phone || '');
        setFormBusiness('TurfBook Owner');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!formName.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      await apiFetch('/owner/profile', {
        method: 'PUT',
        body: { name: formName, phone: formPhone, businessName: formBusiness },
      });
    } catch {}
    updateUser({ name: formName, phone: formPhone });
    setProfile((prev) => ({ ...prev, name: formName, phone: formPhone, businessName: formBusiness }));
    setSaving(false);
    setIsEditing(false);
    Alert.alert('Saved', 'Your profile has been updated.');
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

  const statsItems = [
    { label: 'Turfs', value: profile.totalTurfs ?? '-', icon: 'soccer-field', color: ACCENT },
    { label: 'Bookings', value: profile.totalBookings ?? '-', icon: 'calendar-check', color: '#10b981' },
    { label: 'Revenue', value: profile.totalRevenue ? `₹${profile.totalRevenue}` : '-', icon: 'cash', color: '#f59e0b' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBg, paddingTop: insets.top + 12, borderBottomColor: theme.cardBorder }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
        {!isEditing && (
          <TouchableOpacity style={[styles.editBtn, { borderColor: theme.cardBorder }]} onPress={() => setIsEditing(true)}>
            <Ionicons name="pencil-outline" size={16} color={ACCENT} />
            <Text style={[styles.editBtnText, { color: ACCENT }]}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Identity Card */}
        <View style={[styles.identityCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarOuter}>
              <View style={styles.avatarInner}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.ownerDot}>
                <MaterialCommunityIcons name="shield-check" size={10} color="#fff" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileName, { color: theme.text }]}>{profile.name || user.name}</Text>
              {formBusiness ? (
                <Text style={[styles.businessName, { color: ACCENT }]}>{formBusiness}</Text>
              ) : null}
              <View style={[styles.roleBadge, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
                <Text style={[styles.roleBadgeText, { color: ACCENT }]}>Turf Owner</Text>
              </View>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

          <View style={styles.contactRow}>
            <Ionicons name="mail-outline" size={15} color={theme.textMuted} />
            <Text style={[styles.contactText, { color: theme.textMuted }]}>{profile.email || user.email}</Text>
          </View>
          {(profile.phone || user.phone) && (
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={15} color={theme.textMuted} />
              <Text style={[styles.contactText, { color: theme.textMuted }]}>{profile.phone || user.phone}</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={[styles.statsCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          {statsItems.map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <View style={[styles.statDivider, { backgroundColor: theme.cardBorder }]} />}
              <View style={styles.statItem}>
                <MaterialCommunityIcons name={s.icon as any} size={20} color={s.color} />
                <Text style={[styles.statValue, { color: theme.text }]}>{String(s.value)}</Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* Edit Form */}
        {isEditing && (
          <View style={[styles.editCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.editCardTitle, { color: theme.text }]}>Edit Profile</Text>

            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>FULL NAME</Text>
            <TextInput
              value={formName}
              onChangeText={setFormName}
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}
              placeholderTextColor={theme.textMuted}
            />

            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>PHONE NUMBER</Text>
            <TextInput
              value={formPhone}
              onChangeText={setFormPhone}
              keyboardType="phone-pad"
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}
              placeholderTextColor={theme.textMuted}
            />

            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>BUSINESS NAME</Text>
            <TextInput
              value={formBusiness}
              onChangeText={setFormBusiness}
              placeholder="Your turf business name"
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}
            />

            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: theme.cardBorder }]}
                onPress={() => setIsEditing(false)}
              >
                <Text style={[styles.cancelBtnText, { color: theme.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : (
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Menu */}
        <View style={[styles.menuCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <MenuRow
            icon="business-outline"
            label="Manage Turfs"
            color={ACCENT}
            onPress={() => router.push('/owner/turfs')}
            theme={theme}
          />
          <View style={[styles.menuDivider, { backgroundColor: theme.cardBorder }]} />
          <MenuRow
            icon="calendar-outline"
            label="View Bookings"
            color="#10b981"
            onPress={() => router.push('/owner/bookings')}
            theme={theme}
          />
          <View style={[styles.menuDivider, { backgroundColor: theme.cardBorder }]} />
          <MenuRow
            icon="headset-outline"
            label="Help & Support"
            color="#3b82f6"
            onPress={() => Alert.alert('Support', 'Email us at owner@turfbook.com')}
            theme={theme}
          />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#ef4444" />
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: theme.textMuted }]}>TurfBook Owner Panel · v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

function MenuRow({ icon, label, color, onPress, theme }: any) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.65}>
      <View style={styles.menuLeft}>
        <View style={[styles.menuIconBox, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={17} color={color} />
        </View>
        <Text style={[styles.menuLabel, { color: theme.text }]}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  editBtnText: { fontSize: 13, fontWeight: '700' },
  scrollContent: { padding: 20, gap: 16 },
  identityCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  avatarOuter: { position: 'relative' },
  avatarInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(99,102,241,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: ACCENT,
  },
  avatarText: { color: ACCENT, fontSize: 26, fontWeight: '800' },
  ownerDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  profileName: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
  businessName: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  roleBadgeText: { fontSize: 10, fontWeight: '800' },
  divider: { height: 1, marginVertical: 14 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  contactText: { fontSize: 13, fontWeight: '500' },
  statsCard: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  statItem: { flex: 1, alignItems: 'center', gap: 5 },
  statDivider: { width: 1, height: 40 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600' },
  editCard: { borderRadius: 20, borderWidth: 1, padding: 18 },
  editCardTitle: { fontSize: 17, fontWeight: '800', marginBottom: 16 },
  fieldLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 13, fontSize: 14, marginBottom: 14 },
  editActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  cancelBtn: {
    flex: 1,
    padding: 13,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '700' },
  saveBtn: {
    flex: 2,
    backgroundColor: ACCENT,
    padding: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  menuCard: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 6 },
  menuRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13 },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuIconBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: 14, fontWeight: '600' },
  menuDivider: { height: 1 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 15,
    borderRadius: 16,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
  },
  logoutBtnText: { color: '#ef4444', fontWeight: '800', fontSize: 15 },
  version: { textAlign: 'center', fontSize: 11, fontWeight: '600', paddingBottom: 8 },
});
