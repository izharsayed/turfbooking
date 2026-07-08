import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { apiFetch } from '../../utils/api';

const ACCENT = '#6366f1';

interface DashboardStats {
  totalRevenue?: number;
  todayRevenue?: number;
  totalBookings?: number;
  todayBookings?: number;
  totalTurfs?: number;
  activeTurfs?: number;
  pendingReviews?: number;
  recentBookings?: any[];
}

export default function OwnerDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const theme = {
    bg: isDarkMode ? '#030712' : '#f1f5f9',
    card: isDarkMode ? '#0f172a' : '#ffffff',
    cardBorder: isDarkMode ? '#1e293b' : '#e2e8f0',
    text: isDarkMode ? '#ffffff' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    headerBg: isDarkMode ? '#0f172a' : '#ffffff',
  };

  // Guard: only for TURF_OWNER role
  if (!isAuthenticated || !user) return <Redirect href="/login" />;
  if (user.role !== 'TURF_OWNER') return <Redirect href="/" />;

  const fetchDashboard = async () => {
    try {
      const res = await apiFetch('/owner/dashboard');
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.log('Dashboard fetch failed, using mock data', err);
      // Fallback mock data for development
      setStats({
        totalRevenue: 42500,
        todayRevenue: 3200,
        totalBookings: 148,
        todayBookings: 6,
        totalTurfs: 3,
        activeTurfs: 2,
        pendingReviews: 4,
        recentBookings: [
          { id: 'BK001', customerName: 'Ahmed Khan', turfName: 'Green Arena', time: '17:00 - 18:00', amount: 700, status: 'CONFIRMED' },
          { id: 'BK002', customerName: 'Raj Patel', turfName: 'Box Cricket Zone', time: '15:00 - 16:00', amount: 550, status: 'CONFIRMED' },
          { id: 'BK003', customerName: 'Sara Ali', turfName: 'Green Arena', time: '10:00 - 11:00', amount: 700, status: 'COMPLETED' },
        ],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard();
  }, []);

  const formatCurrency = (n: number = 0) => `₹${n.toLocaleString('en-IN')}`;

  const statCards = [
    { label: "Today's Revenue", value: formatCurrency(stats.todayRevenue), icon: 'cash-outline', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    { label: "Today's Bookings", value: String(stats.todayBookings ?? 0), icon: 'calendar', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
    { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: 'trending-up', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    { label: 'Active Turfs', value: `${stats.activeTurfs ?? 0}/${stats.totalTurfs ?? 0}`, icon: 'location', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  ];

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={ACCENT} />
        <Text style={[styles.loadingText, { color: theme.textMuted }]}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBg, paddingTop: insets.top + 12, borderBottomColor: theme.cardBorder }]}>
        <View>
          <Text style={[styles.greetingSmall, { color: theme.textMuted }]}>Welcome back,</Text>
          <Text style={[styles.greetingName, { color: theme.text }]}>{user.name} 👋</Text>
        </View>
        <View style={[styles.ownerBadge, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
          <MaterialCommunityIcons name="shield-check" size={14} color={ACCENT} />
          <Text style={[styles.ownerBadgeText, { color: ACCENT }]}>Owner</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
      >
        {/* Pending Reviews Alert */}
        {(stats.pendingReviews ?? 0) > 0 && (
          <TouchableOpacity style={styles.alertBanner} activeOpacity={0.85}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#f59e0b" />
            <Text style={styles.alertText}>
              You have <Text style={{ fontWeight: '800' }}>{stats.pendingReviews} pending reviews</Text> to respond to
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#f59e0b" />
          </TouchableOpacity>
        )}

        {/* Stats Grid */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Overview</Text>
        <View style={styles.statsGrid}>
          {statCards.map((card) => (
            <View key={card.label} style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={[styles.statIconWrap, { backgroundColor: card.bg }]}>
                <Ionicons name={card.icon as any} size={20} color={card.color} />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>{card.value}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>{card.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} onPress={() => router.push('/owner/bookings')}>
            <Ionicons name="calendar-outline" size={22} color={ACCENT} />
            <Text style={[styles.actionLabel, { color: theme.text }]}>Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} onPress={() => router.push('/owner/turfs')}>
            <MaterialCommunityIcons name="soccer-field" size={22} color="#10b981" />
            <Text style={[styles.actionLabel, { color: theme.text }]}>My Turfs</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} onPress={() => router.push('/owner/profile')}>
            <Ionicons name="person-outline" size={22} color="#f59e0b" />
            <Text style={[styles.actionLabel, { color: theme.text }]}>Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Bookings */}
        <View style={styles.recentHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>Recent Bookings</Text>
          <TouchableOpacity onPress={() => router.push('/owner/bookings')}>
            <Text style={[styles.viewAll, { color: ACCENT }]}>View all</Text>
          </TouchableOpacity>
        </View>

        {(stats.recentBookings ?? []).length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={40} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>No recent bookings</Text>
          </View>
        ) : (
          (stats.recentBookings ?? []).map((b: any) => (
            <View key={b.id} style={[styles.bookingRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={[styles.bookingAvatar, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
                <Text style={styles.bookingAvatarText}>
                  {(b.customerName || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bookingCustomer, { color: theme.text }]}>{b.customerName || 'Customer'}</Text>
                <Text style={[styles.bookingMeta, { color: theme.textMuted }]}>{b.turfName} · {b.time}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={[styles.bookingAmount, { color: theme.text }]}>₹{b.amount}</Text>
                <View style={[
                  styles.statusPill,
                  { backgroundColor: b.status === 'CONFIRMED' ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)' }
                ]}>
                  <Text style={[styles.statusText, { color: b.status === 'CONFIRMED' ? '#10b981' : theme.textMuted }]}>
                    {b.status}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, fontWeight: '600' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  greetingSmall: { fontSize: 12, fontWeight: '600' },
  greetingName: { fontSize: 20, fontWeight: '800', marginTop: 2 },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ownerBadgeText: { fontSize: 12, fontWeight: '800' },
  scrollContent: { padding: 20 },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  alertText: { flex: 1, color: '#f59e0b', fontSize: 13, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 14 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '47.5%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600' },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionLabel: { fontSize: 11, fontWeight: '700' },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  viewAll: { fontSize: 13, fontWeight: '700' },
  emptyCard: {
    alignItems: 'center',
    gap: 10,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyText: { fontSize: 13, fontWeight: '600' },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  bookingAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingAvatarText: { color: ACCENT, fontSize: 17, fontWeight: '800' },
  bookingCustomer: { fontSize: 14, fontWeight: '700' },
  bookingMeta: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  bookingAmount: { fontSize: 14, fontWeight: '800' },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800' },
});
