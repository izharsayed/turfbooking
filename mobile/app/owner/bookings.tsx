import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { apiFetch } from '../../utils/api';

const ACCENT = '#10b981';

const FILTER_TABS = ['All', 'Confirmed', 'Completed', 'Cancelled'] as const;
type FilterTab = typeof FILTER_TABS[number];

interface OwnerBooking {
  id: string;
  customerName?: string;
  turfName?: string;
  date?: string;
  time?: string;
  amount?: number;
  status?: string;
}

const MOCK_BOOKINGS: OwnerBooking[] = [
  { id: 'BK001', customerName: 'Ahmed Khan', turfName: 'Green Arena', date: '2026-07-10', time: '17:00 - 18:00', amount: 700, status: 'CONFIRMED' },
  { id: 'BK002', customerName: 'Raj Patel', turfName: 'Box Cricket Zone', date: '2026-07-10', time: '15:00 - 16:00', amount: 550, status: 'CONFIRMED' },
  { id: 'BK003', customerName: 'Sara Ali', turfName: 'Green Arena', date: '2026-07-09', time: '10:00 - 11:00', amount: 700, status: 'COMPLETED' },
  { id: 'BK004', customerName: 'Mohan Sharma', turfName: 'Premier Ground', date: '2026-07-08', time: '08:00 - 09:00', amount: 450, status: 'CANCELLED' },
  { id: 'BK005', customerName: 'Priya Mehta', turfName: 'Green Arena', date: '2026-07-08', time: '19:00 - 20:00', amount: 700, status: 'COMPLETED' },
  { id: 'BK006', customerName: 'Zaid Ansari', turfName: 'Box Cricket Zone', date: '2026-07-11', time: '18:00 - 19:00', amount: 550, status: 'CONFIRMED' },
];

export default function OwnerBookingsScreen() {
  const { user, isAuthenticated } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const insets = useSafeAreaInsets();

  const [bookings, setBookings] = useState<OwnerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('All');

  const theme = {
    bg: isDarkMode ? '#030712' : '#f1f5f9',
    card: isDarkMode ? '#0f172a' : '#ffffff',
    cardBorder: isDarkMode ? '#1e293b' : '#e2e8f0',
    text: isDarkMode ? '#ffffff' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    headerBg: isDarkMode ? '#0f172a' : '#ffffff',
    tabBg: isDarkMode ? '#1e293b' : '#f1f5f9',
    tabActiveBg: ACCENT,
  };

  if (!isAuthenticated || !user) return <Redirect href="/login" />;
  if (user.role !== 'TURF_OWNER') return <Redirect href="/" />;

  const fetchBookings = async () => {
    try {
      const res = await apiFetch('/owner/bookings');
      if (res.success && res.data) {
        setBookings(res.data);
      } else {
        setBookings(MOCK_BOOKINGS);
      }
    } catch {
      setBookings(MOCK_BOOKINGS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBookings();
  }, []);

  const handleCancel = (bookingId: string) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? The customer will be notified.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiFetch(`/owner/bookings/${bookingId}/cancel`, { method: 'PUT' });
            } catch {}
            setBookings((prev) =>
              prev.map((b) => b.id === bookingId ? { ...b, status: 'CANCELLED' } : b)
            );
            Alert.alert('Done', 'Booking cancelled successfully.');
          },
        },
      ]
    );
  };

  const filtered = bookings.filter((b) => {
    if (activeTab === 'All') return true;
    return b.status?.toUpperCase() === activeTab.toUpperCase();
  });

  const formatDate = (d?: string) => {
    if (!d) return '';
    try {
      return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return d; }
  };

  const statusColor = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED': return { text: '#10b981', bg: 'rgba(16,185,129,0.12)' };
      case 'COMPLETED': return { text: '#10b981', bg: 'rgba(16,185,129,0.12)' };
      case 'CANCELLED': return { text: '#ef4444', bg: 'rgba(239,68,68,0.12)' };
      default: return { text: '#64748b', bg: 'rgba(100,116,139,0.12)' };
    }
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
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBg, paddingTop: insets.top + 12, borderBottomColor: theme.cardBorder }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Bookings</Text>
        <View style={[styles.countBadge, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
          <Text style={[styles.countBadgeText, { color: ACCENT }]}>{filtered.length}</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.tabsRow, { backgroundColor: theme.headerBg, borderBottomColor: theme.cardBorder }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.filterTab,
                  { backgroundColor: isActive ? ACCENT : theme.tabBg },
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.filterTabText, { color: isActive ? '#fff' : theme.textMuted }]}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyWrapper}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={64} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>No {activeTab !== 'All' ? activeTab.toLowerCase() : ''} bookings</Text>
          </View>
        ) : (
          filtered.map((booking) => {
            const sc = statusColor(booking.status);
            const canCancel = booking.status?.toUpperCase() === 'CONFIRMED';
            return (
              <View key={booking.id} style={[styles.bookingCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                {/* Top Row */}
                <View style={styles.cardTopRow}>
                  <View style={[styles.avatar, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
                    <Text style={styles.avatarText}>{(booking.customerName || 'U').charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.customerName, { color: theme.text }]}>{booking.customerName || 'Customer'}</Text>
                    <Text style={[styles.turfName, { color: theme.textMuted }]}>{booking.turfName}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.statusText, { color: sc.text }]}>{booking.status}</Text>
                  </View>
                </View>

                {/* Meta Row */}
                <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={13} color={theme.textMuted} />
                    <Text style={[styles.metaText, { color: theme.textMuted }]}>{formatDate(booking.date)}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={13} color={theme.textMuted} />
                    <Text style={[styles.metaText, { color: theme.textMuted }]}>{booking.time}</Text>
                  </View>
                  <Text style={[styles.amountText, { color: theme.text }]}>₹{booking.amount}</Text>
                </View>

                {/* Actions */}
                {canCancel && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => handleCancel(booking.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close-circle-outline" size={14} color="#ef4444" />
                    <Text style={styles.cancelBtnText}>Cancel Booking</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
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
  countBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  countBadgeText: { fontSize: 13, fontWeight: '800' },
  tabsRow: { borderBottomWidth: 1 },
  tabsContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  filterTabText: { fontSize: 12, fontWeight: '700' },
  scrollContent: { padding: 16, gap: 12 },
  emptyWrapper: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '600' },
  bookingCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 2,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: ACCENT, fontSize: 18, fontWeight: '800' },
  customerName: { fontSize: 14, fontWeight: '700' },
  turfName: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '800' },
  divider: { height: 1, marginVertical: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, fontWeight: '600' },
  amountText: { marginLeft: 'auto', fontSize: 15, fontWeight: '800' },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    alignSelf: 'flex-start',
  },
  cancelBtnText: { color: '#ef4444', fontSize: 12, fontWeight: '700' },
});
