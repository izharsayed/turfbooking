import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ImageBackground,
  Platform,
  Dimensions,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Redirect, useRouter, useNavigation } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { apiFetch } from '../../utils/api';

const ACCENT = '#10b981';
const TURF_BG = require('../../assets/turf-bg.jpg');

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (SCREEN_WIDTH - 40 - 24) / 4;

const formatTimeSub = (timeStr: string) => {
  if (!timeStr) return '';
  const parts = timeStr.split(/[-–]/).map(s => s.trim());
  const start = parts[0] || '12:00';
  const end = parts[1] || '13:00';
  const startHr = parseInt(start.split(':')[0] || '12', 10);
  const endHr = parseInt(end.split(':')[0] || '13', 10);
  const startMins = start.split(':')[1] || '00';
  const endMins = end.split(':')[1] || '00';

  const startAmPm = startHr >= 12 ? 'PM' : 'AM';
  const endAmPm = endHr >= 12 ? 'PM' : 'AM';

  const displayEndHr = endHr % 12 === 0 ? 12 : endHr % 12;
  const formattedEnd = `${displayEndHr.toString().padStart(2, '0')}:${endMins} ${endAmPm}`;

  return `${startAmPm} - ${formattedEnd}`;
};

interface DashboardStats {
  totalRevenue?: number;
  todayRevenue?: number;
  totalBookings?: number;
  todayBookings?: number;
  totalTurfs?: number;
  activeTurfs?: number;
  pendingReviews?: number;
  fillRate?: number;
  rating?: number;
  recentBookings?: any[];
}

export default function OwnerDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation() as any;

  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'New Booking Confirmed',
      message: 'Vikas Kale booked Old Trafford Arena for 03:00 PM today.',
      time: '10m ago',
      read: false,
      icon: 'calendar-outline',
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.08)',
    },
    {
      id: '2',
      title: 'New Review Received',
      message: 'A customer left a 4.8 star review: "Great turf and well maintained."',
      time: '1h ago',
      read: false,
      icon: 'star-outline',
      color: '#fbbf24',
      bgColor: 'rgba(251, 191, 36, 0.08)',
    },
    {
      id: '3',
      title: 'Payout Processed',
      message: 'Your daily payout of ₹1,200 has been transferred to your bank account.',
      time: '3h ago',
      read: false,
      icon: 'wallet-outline',
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.08)',
    },
  ]);

  const theme = {
    bg: isDarkMode ? '#030712' : '#f8fafc',
    card: isDarkMode ? '#0f172a' : '#ffffff',
    cardBorder: isDarkMode ? '#1e293b' : '#f1f5f9',
    text: isDarkMode ? '#ffffff' : '#1e293b',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    divider: isDarkMode ? '#1e293b' : '#f1f5f9',
    alertBg: isDarkMode ? 'rgba(16,185,129,0.08)' : '#e6fbf4',
  };

  const fetchDashboard = async () => {
    if (!isAuthenticated || !user) return;
    try {
      // Fetch dashboard stats from backend
      const res = await apiFetch('/owner/dashboard');
      if (res.success && res.data) {
        setStats({
          ...res.data,
          fillRate: res.data.fillRate ?? res.data.occupancyRate ?? 0,
          rating: res.data.rating ?? res.data.averageRating ?? 0,
        });
      }

      // Fetch recent bookings from backend
      const bookingsRes = await apiFetch('/owner/bookings');
      if (bookingsRes.success && bookingsRes.data) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;

        // Filter to only include bookings scheduled for today
        const todaysBookings = bookingsRes.data.filter((b: any) => {
          const bDateStr = b.date ? b.date.split('T')[0] : '';
          return bDateStr === todayStr;
        });

        // Map backend booking shape to dashboard card shape
        const recent = todaysBookings.slice(0, 3).map((b: any) => {
          const parts = (b.time || '').split(/[-–]/).map((s: string) => s.trim());
          const startTime = parts[0] || '12:00';
          const fullTime = b.time || '12:00 - 13:00';
          return {
            id: b.id,
            startTime,
            timeRange: fullTime,
            label: b.turfName || 'Booking',
            turfName: b.turfName || 'Arena',
            customerName: b.customerName || 'Customer',
            amount: b.amount || 0,
            status: b.status || 'CONFIRMED',
          };
        });
        setStats(prev => ({ ...prev, recentBookings: recent }));
      }
    } catch (err) {
      console.log('Dashboard fetch failed', err);
      // Show empty state — no fake data
      setStats({});
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const onRefresh = useCallback(() => {
    if (!isAuthenticated || !user) return;
    setRefreshing(true);
    fetchDashboard();
  }, [isAuthenticated, user]);

  // Guard: only for TURF_OWNER & CARETAKER role
  if (!isAuthenticated || !user) return <Redirect href="/login" />;
  if (user.role !== 'TURF_OWNER' && user.role !== 'CARETAKER') return <Redirect href="/" />;

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
      <ScrollView
        style={{ backgroundColor: theme.bg }}
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
      >
        {/* Full-bleed background header */}
        <ImageBackground
          source={TURF_BG}
          style={styles.headerBg}
          imageStyle={styles.headerImage}
          resizeMode="cover"
        >
          <View style={styles.darkOverlay} />

          <View style={[styles.headerInnerContent, { paddingTop: insets.top + 16 }]}>
            {/* Top Navbar Row */}
            <View style={styles.topNavbar}>
              <TouchableOpacity style={styles.menuBtn} activeOpacity={0.7}>
                <Ionicons name="menu-outline" size={24} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuBtn}
                activeOpacity={0.7}
                onPress={() => setShowNotifications(true)}
              >
                <Ionicons name="notifications-outline" size={22} color="#ffffff" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <View style={styles.bellBadge}>
                    <Text style={styles.bellBadgeText}>{notifications.filter(n => !n.read).length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Slogans and status */}
            <View style={styles.headerGreetings}>
              <Text style={styles.helloText}>Hello, {user?.name || 'Owner'} <Ionicons name="hand-left-outline" size={18} color="#fbbf24" /></Text>
              <Text style={styles.arenaTitle}>TurfBook Arena</Text>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusLabel}>Active</Text>
              </View>
            </View>
          </View>
        </ImageBackground>

        {/* Today's Overview Container (Overlapping) */}
        <View style={styles.overlapWrapper}>
          <View style={styles.overviewCard}>
            <View style={styles.overviewHeader}>
              <Text style={styles.overviewTitle}>Today's Overview</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.viewAllText}>View All {'>'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.overviewDivider} />

            <View style={styles.metricsRow}>
              {/* Metric 1 */}
              <View style={styles.metricCol}>
                <View style={[styles.circleIcon, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                  <Ionicons name="calendar-outline" size={16} color={ACCENT} />
                </View>
                <Text style={styles.metricValue}>{stats.todayBookings ?? 0}</Text>
                <Text style={styles.metricLabel}>Bookings</Text>
                <Text style={styles.metricTrend}>+2 today</Text>
              </View>

              {/* Metric 2 */}
              {user?.role !== 'CARETAKER' ? (
                <View style={styles.metricCol}>
                  <View style={[styles.circleIcon, { backgroundColor: 'rgba(234, 179, 8, 0.12)' }]}>
                    <Text style={{ color: '#eab308', fontWeight: 'bold', fontSize: 13 }}>₹</Text>
                  </View>
                  <Text style={styles.metricValue}>₹{(stats.todayRevenue ?? 0).toLocaleString('en-IN')}</Text>
                  <Text style={styles.metricLabel}>Revenue</Text>
                  <Text style={styles.metricTrend}>+14% today</Text>
                </View>
              ) : (
                <View style={styles.metricCol}>
                  <View style={[styles.circleIcon, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                    <Ionicons name="location-outline" size={16} color="#3b82f6" />
                  </View>
                  <Text style={styles.metricValue}>{stats.totalTurfs ?? 1}</Text>
                  <Text style={styles.metricLabel}>Managed Fields</Text>
                  <Text style={styles.metricTrend}>Active</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Today's Bookings Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Bookings</Text>
          <TouchableOpacity onPress={() => navigation.navigate('bookings' as any)}>
            <Text style={styles.sectionLink}>View Schedule {'>'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contentPadding}>
          <View style={[styles.bookingsCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            {(stats.recentBookings ?? []).length === 0 ? (
              <View style={styles.emptyBookingsState}>
                <Ionicons name="calendar-outline" size={32} color={theme.textMuted} style={{ marginBottom: 8 }} />
                <Text style={[styles.emptyBookingsText, { color: theme.textMuted }]}>
                  No bookings scheduled for today
                </Text>
              </View>
            ) : (
              (stats.recentBookings ?? []).map((b, index) => (
                <View key={b.id || index.toString()}>
                  <TouchableOpacity
                    style={styles.bookingRow}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('bookings' as any)}
                  >
                    {/* Left Column: Time */}
                    <View style={styles.bookingTimeWrap}>
                      <Text style={[styles.timeMain, { color: theme.text }]}>{b.startTime}</Text>
                      <Text style={styles.timeSub}>{formatTimeSub(b.timeRange)}</Text>
                    </View>

                    {/* Middle Column: Details */}
                    <View style={styles.bookingDetails}>
                      <Text style={[styles.bookingLabel, { color: theme.text }]}>{b.label}</Text>
                      <Text style={[styles.bookingTurf, { color: theme.textMuted }]}>{b.turfName}</Text>
                      <View style={styles.customerRow}>
                        <Ionicons name="person-outline" size={12} color={theme.textMuted} style={{ marginRight: 4 }} />
                        <Text style={[styles.customerName, { color: theme.textMuted }]}>{b.customerName}</Text>
                      </View>
                    </View>

                    {/* Right Column: Status & Price */}
                    <View style={styles.bookingRight}>
                      <View style={[
                        styles.statusPill,
                        { backgroundColor: b.status === 'CONFIRMED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)' }
                      ]}>
                        <Text style={[
                          styles.statusText,
                          { color: b.status === 'CONFIRMED' ? '#10b981' : '#f59e0b' }
                        ]}>
                          {b.status === 'CONFIRMED' ? 'Confirmed' : 'Pending'}
                        </Text>
                      </View>
                      <Text style={[styles.bookingAmount, { color: theme.text }]}>₹{b.amount}</Text>
                    </View>

                    <Ionicons name="chevron-forward" size={16} color="#cbd5e1" style={{ marginLeft: 8 }} />
                  </TouchableOpacity>

                  {index < (stats.recentBookings ?? []).length - 1 && (
                    <View style={[styles.dividerLine, { backgroundColor: theme.divider }]} />
                  )}
                </View>
              ))
            )}
          </View>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.contentPadding}>
          <View style={styles.actionsGrid}>
            {[
              { label: 'Add Booking', icon: 'calendar-plus', library: 'MaterialCommunityIcons', route: '/owner/bookings' },
              { label: 'Slots Manager', icon: 'grid-large', library: 'MaterialCommunityIcons', route: '/owner/bookings' },
              { label: 'Block Slot', icon: 'calendar-lock', library: 'MaterialCommunityIcons', route: '/owner/turfs' },
              { label: 'Employees', icon: 'people-outline', library: 'Ionicons', route: '/owner/employees' },
              { label: 'Payments', icon: 'credit-card-outline', library: 'MaterialCommunityIcons', route: '/owner/payments' },
              { label: 'Reports', icon: 'bar-chart-outline', library: 'Ionicons', route: '/owner/bookings' },
              { label: 'Reviews', icon: 'star-outline', library: 'Ionicons', route: '/owner/profile' },
              { label: 'More', icon: 'ellipsis-horizontal-circle-outline', library: 'Ionicons', route: '/owner/profile' },
            ].filter(item => {
              if (user?.role === 'CARETAKER') {
                return ['Add Booking', 'Slots Manager', 'Block Slot', 'Reviews'].includes(item.label);
              }
              return true;
            }).map((item) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                activeOpacity={0.7}
                onPress={() => {
                  if (item.route.startsWith('/owner/')) {
                    const screenName = item.route.replace('/owner/', '');
                    navigation.navigate(screenName as any);
                  } else {
                    router.push(item.route as any);
                  }
                }}
              >
                <View style={styles.actionIconCircle}>
                  {item.library === 'MaterialCommunityIcons' ? (
                    <MaterialCommunityIcons name={item.icon as any} size={22} color={ACCENT} />
                  ) : (
                    <Ionicons name={item.icon as any} size={22} color={ACCENT} />
                  )}
                </View>
                <Text style={[styles.actionLabel, { color: theme.text }]} numberOfLines={1}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>


        {/* Recent Reviews Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Reviews</Text>
          <TouchableOpacity onPress={() => navigation.navigate('profile' as any)}>
            <Text style={styles.sectionLink}>View All {'>'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contentPadding}>
          <View style={[styles.reviewCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.reviewBadge}>
              <Ionicons name="star" size={14} color="#eab308" style={{ marginRight: 4 }} />
              <Text style={styles.reviewBadgeText}>4.8</Text>
            </View>
            <View style={[styles.reviewDivider, { backgroundColor: theme.divider }]} />
            <View style={styles.reviewBody}>
              <Text style={[styles.reviewText, { color: theme.text }]}>
                <Text style={styles.quoteMark}>“ </Text>
                Great turf and well maintained.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Notifications Modal */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              {notifications.length === 0 ? (
                <View style={styles.emptyNotifications}>
                  <Ionicons name="notifications-off-outline" size={48} color={theme.textMuted} />
                  <Text style={[styles.emptyNotificationsText, { color: theme.textMuted }]}>
                    No new notifications
                  </Text>
                </View>
              ) : (
                notifications.map((n) => (
                  <TouchableOpacity
                    key={n.id}
                    style={[
                      styles.notificationItem,
                      { borderColor: theme.divider },
                      !n.read && { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setNotifications(prev =>
                        prev.map(item => item.id === n.id ? { ...item, read: true } : item)
                      );
                    }}
                  >
                    <View style={[styles.notifIconWrap, { backgroundColor: n.bgColor }]}>
                      <Ionicons name={n.icon as any} size={20} color={n.color} />
                    </View>
                    <View style={styles.notifTextWrap}>
                      <View style={styles.notifMeta}>
                        <Text style={[styles.notifTitle, { color: theme.text }, !n.read && { fontWeight: '800' }]}>
                          {n.title}
                        </Text>
                        <Text style={[styles.notifTime, { color: theme.textMuted }]}>{n.time}</Text>
                      </View>
                      <Text style={[styles.notifMessage, { color: theme.textMuted }]} numberOfLines={2}>
                        {n.message}
                      </Text>
                    </View>
                    {!n.read && <View style={styles.unreadDot} />}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            {notifications.length > 0 && (
              <TouchableOpacity
                style={styles.clearAllBtn}
                activeOpacity={0.7}
                onPress={() => {
                  setNotifications([]);
                }}
              >
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, fontWeight: '600' },
  headerBg: {
    width: '100%',
    height: 240,
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
    paddingBottom: 55, // Matches the overlap offset layout spacing
  },
  darkOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  topNavbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
  },
  menuBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  headerGreetings: {
    marginTop: 20,
    alignSelf: 'stretch',
  },
  helloText: {
    fontSize: 14,
    color: '#e2e8f0',
    fontWeight: '600',
  },
  arenaTitle: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: '900',
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  statusLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  overlapWrapper: {
    paddingHorizontal: 20,
    marginTop: -40,
    zIndex: 20,
  },
  overviewCard: {
    backgroundColor: '#07241e',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#10b98133',
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  viewAllText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '800',
  },
  overviewDivider: {
    height: 1,
    backgroundColor: 'rgba(16,185,129,0.1)',
    marginVertical: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  circleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  metricLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 4,
  },
  metricTrend: {
    color: '#10b981',
    fontSize: 8,
    fontWeight: '800',
    textAlign: 'center',
  },
  metricLink: {
    color: '#10b981',
    fontSize: 8,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  sectionLink: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '800',
  },
  contentPadding: {
    paddingHorizontal: 20,
  },
  bookingsCard: {
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  bookingTimeWrap: {
    width: 82,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    paddingRight: 8,
  },
  timeMain: {
    fontSize: 16,
    fontWeight: '900',
  },
  timeSub: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 2,
  },
  bookingDetails: {
    flex: 1,
    paddingHorizontal: 12,
  },
  bookingLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  bookingTurf: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  customerName: {
    fontSize: 11,
    fontWeight: '700',
  },
  bookingRight: {
    alignItems: 'flex-end',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  bookingAmount: {
    fontSize: 14,
    fontWeight: '900',
  },
  dividerLine: {
    height: 1,
  },
  emptyBookingsState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyBookingsText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  actionBtn: {
    width: GRID_ITEM_WIDTH,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  actionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#10b9810f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 9,
    fontWeight: '800',
  },

  reviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  modalScroll: {
    marginBottom: 10,
  },
  emptyNotifications: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyNotificationsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    position: 'relative',
  },
  notifIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  notifTextWrap: {
    flex: 1,
  },
  notifMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  notifTime: {
    fontSize: 10,
    fontWeight: '600',
  },
  notifMessage: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginLeft: 10,
  },
  clearAllBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  clearAllText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '800',
  },
  reviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 179, 8, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  reviewBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#eab308',
  },
  reviewDivider: {
    width: 1,
    height: 24,
    marginHorizontal: 16,
  },
  reviewBody: {
    flex: 1,
  },
  reviewText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  quoteMark: {
    color: '#10b981',
    fontSize: 18,
    fontWeight: '900',
  },
});

