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
exports.default = OwnerDashboard;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const expo_router_1 = require("expo-router");
const vector_icons_1 = require("@expo/vector-icons");
const authStore_1 = require("../../store/authStore");
const themeStore_1 = require("../../store/themeStore");
const api_1 = require("../../utils/api");
const ACCENT = '#10b981';
const TURF_BG = require('../../assets/turf-bg.jpg');
const { width: SCREEN_WIDTH } = react_native_1.Dimensions.get('window');
const GRID_ITEM_WIDTH = (SCREEN_WIDTH - 40 - 24) / 4;
const formatTimeSub = (timeStr) => {
    if (!timeStr)
        return '';
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
function OwnerDashboard() {
    const { user, isAuthenticated } = (0, authStore_1.useAuthStore)();
    const { isDarkMode } = (0, themeStore_1.useThemeStore)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const router = (0, expo_router_1.useRouter)();
    const [stats, setStats] = (0, react_1.useState)({});
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [refreshing, setRefreshing] = (0, react_1.useState)(false);
    const [showNotifications, setShowNotifications] = (0, react_1.useState)(false);
    const [notifications, setNotifications] = (0, react_1.useState)([
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
        if (!isAuthenticated || !user)
            return;
        try {
            // Fetch dashboard stats from backend
            const res = await (0, api_1.apiFetch)('/owner/dashboard');
            if (res.success && res.data) {
                setStats({
                    ...res.data,
                    fillRate: res.data.fillRate ?? res.data.occupancyRate ?? 0,
                    rating: res.data.rating ?? res.data.averageRating ?? 0,
                });
            }
            // Fetch recent bookings from backend
            const bookingsRes = await (0, api_1.apiFetch)('/owner/bookings');
            if (bookingsRes.success && bookingsRes.data) {
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                const todayStr = `${yyyy}-${mm}-${dd}`;
                // Filter to only include bookings scheduled for today
                const todaysBookings = bookingsRes.data.filter((b) => {
                    const bDateStr = b.date ? b.date.split('T')[0] : '';
                    return bDateStr === todayStr;
                });
                // Map backend booking shape to dashboard card shape
                const recent = todaysBookings.slice(0, 3).map((b) => {
                    const parts = (b.time || '').split(/[-–]/).map((s) => s.trim());
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
        }
        catch (err) {
            console.log('Dashboard fetch failed', err);
            // Show empty state — no fake data
            setStats({});
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    (0, react_1.useEffect)(() => { fetchDashboard(); }, []);
    const onRefresh = (0, react_1.useCallback)(() => {
        if (!isAuthenticated || !user)
            return;
        setRefreshing(true);
        fetchDashboard();
    }, [isAuthenticated, user]);
    // Guard: only for TURF_OWNER role
    if (!isAuthenticated || !user)
        return <expo_router_1.Redirect href="/login"/>;
    if (user.role !== 'TURF_OWNER')
        return <expo_router_1.Redirect href="/"/>;
    if (loading) {
        return (<react_native_1.View style={[styles.loadingContainer, { backgroundColor: theme.bg }]}>
        <react_native_1.ActivityIndicator size="large" color={ACCENT}/>
        <react_native_1.Text style={[styles.loadingText, { color: theme.textMuted }]}>Loading dashboard...</react_native_1.Text>
      </react_native_1.View>);
    }
    return (<react_native_1.View style={[styles.container, { backgroundColor: theme.bg }]}>
      <react_native_1.ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false} refreshControl={<react_native_1.RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT}/>}>
        {/* Full-bleed background header */}
        <react_native_1.ImageBackground source={TURF_BG} style={styles.headerBg} imageStyle={styles.headerImage} resizeMode="cover">
          <react_native_1.View style={styles.darkOverlay}/>

          <react_native_1.View style={[styles.headerInnerContent, { paddingTop: insets.top + 16 }]}>
            {/* Top Navbar Row */}
            <react_native_1.View style={styles.topNavbar}>
              <react_native_1.TouchableOpacity style={styles.menuBtn} activeOpacity={0.7}>
                <vector_icons_1.Ionicons name="menu-outline" size={24} color="#ffffff"/>
              </react_native_1.TouchableOpacity>
              <react_native_1.TouchableOpacity style={styles.menuBtn} activeOpacity={0.7} onPress={() => setShowNotifications(true)}>
                <vector_icons_1.Ionicons name="notifications-outline" size={22} color="#ffffff"/>
                {notifications.filter(n => !n.read).length > 0 && (<react_native_1.View style={styles.bellBadge}>
                    <react_native_1.Text style={styles.bellBadgeText}>{notifications.filter(n => !n.read).length}</react_native_1.Text>
                  </react_native_1.View>)}
              </react_native_1.TouchableOpacity>
            </react_native_1.View>

            {/* Slogans and status */}
            <react_native_1.View style={styles.headerGreetings}>
              <react_native_1.Text style={styles.helloText}>Hello, Owner <vector_icons_1.Ionicons name="hand-left-outline" size={18} color="#fbbf24"/></react_native_1.Text>
              <react_native_1.Text style={styles.arenaTitle}>TurfBook Arena</react_native_1.Text>
              <react_native_1.View style={styles.statusRow}>
                <react_native_1.View style={styles.statusDot}/>
                <react_native_1.Text style={styles.statusLabel}>Active</react_native_1.Text>
              </react_native_1.View>
            </react_native_1.View>
          </react_native_1.View>
        </react_native_1.ImageBackground>

        {/* Today's Overview Container (Overlapping) */}
        <react_native_1.View style={styles.overlapWrapper}>
          <react_native_1.View style={styles.overviewCard}>
            <react_native_1.View style={styles.overviewHeader}>
              <react_native_1.Text style={styles.overviewTitle}>Today's Overview</react_native_1.Text>
              <react_native_1.TouchableOpacity activeOpacity={0.7}>
                <react_native_1.Text style={styles.viewAllText}>View All {'>'}</react_native_1.Text>
              </react_native_1.TouchableOpacity>
            </react_native_1.View>
            <react_native_1.View style={styles.overviewDivider}/>

            <react_native_1.View style={styles.metricsRow}>
              {/* Metric 1 */}
              <react_native_1.View style={styles.metricCol}>
                <react_native_1.View style={[styles.circleIcon, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                  <vector_icons_1.Ionicons name="calendar-outline" size={16} color={ACCENT}/>
                </react_native_1.View>
                <react_native_1.Text style={styles.metricValue}>{stats.todayBookings ?? 0}</react_native_1.Text>
                <react_native_1.Text style={styles.metricLabel}>Bookings</react_native_1.Text>
                <react_native_1.Text style={styles.metricTrend}>+2 today</react_native_1.Text>
              </react_native_1.View>

              {/* Metric 2 */}
              <react_native_1.View style={styles.metricCol}>
                <react_native_1.View style={[styles.circleIcon, { backgroundColor: 'rgba(234, 179, 8, 0.12)' }]}>
                  <react_native_1.Text style={{ color: '#eab308', fontWeight: 'bold', fontSize: 13 }}>₹</react_native_1.Text>
                </react_native_1.View>
                <react_native_1.Text style={styles.metricValue}>₹{(stats.todayRevenue ?? 0).toLocaleString('en-IN')}</react_native_1.Text>
                <react_native_1.Text style={styles.metricLabel}>Revenue</react_native_1.Text>
                <react_native_1.Text style={styles.metricTrend}>+14% today</react_native_1.Text>
              </react_native_1.View>

              {/* Metric 3 */}
              <react_native_1.View style={styles.metricCol}>
                <react_native_1.View style={[styles.circleIcon, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                  <vector_icons_1.Ionicons name="time-outline" size={16} color="#3b82f6"/>
                </react_native_1.View>
                <react_native_1.Text style={styles.metricValue}>{stats.fillRate ?? 0}%</react_native_1.Text>
                <react_native_1.Text style={styles.metricLabel}>Fill Rate</react_native_1.Text>
                <react_native_1.Text style={styles.metricTrend}>+8% today</react_native_1.Text>
              </react_native_1.View>

              {/* Metric 4 */}
              <react_native_1.View style={styles.metricCol}>
                <react_native_1.View style={[styles.circleIcon, { backgroundColor: 'rgba(168, 85, 247, 0.12)' }]}>
                  <vector_icons_1.Ionicons name="star-outline" size={16} color="#a855f7"/>
                </react_native_1.View>
                <react_native_1.Text style={styles.metricValue}>{stats.rating ?? 0}</react_native_1.Text>
                <react_native_1.Text style={styles.metricLabel}>Rating</react_native_1.Text>
                <react_native_1.TouchableOpacity>
                  <react_native_1.Text style={styles.metricLink}>View Reviews</react_native_1.Text>
                </react_native_1.TouchableOpacity>
              </react_native_1.View>
            </react_native_1.View>
          </react_native_1.View>
        </react_native_1.View>

        {/* Today's Bookings Section */}
        <react_native_1.View style={styles.sectionHeader}>
          <react_native_1.Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Bookings</react_native_1.Text>
          <react_native_1.TouchableOpacity onPress={() => router.push('/owner/bookings')}>
            <react_native_1.Text style={styles.sectionLink}>View Schedule {'>'}</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>

        <react_native_1.View style={styles.contentPadding}>
          <react_native_1.View style={[styles.bookingsCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            {(stats.recentBookings ?? []).length === 0 ? (<react_native_1.View style={styles.emptyBookingsState}>
                <vector_icons_1.Ionicons name="calendar-outline" size={32} color={theme.textMuted} style={{ marginBottom: 8 }}/>
                <react_native_1.Text style={[styles.emptyBookingsText, { color: theme.textMuted }]}>
                  No bookings scheduled for today
                </react_native_1.Text>
              </react_native_1.View>) : ((stats.recentBookings ?? []).map((b, index) => (<react_native_1.View key={b.id || index.toString()}>
                  <react_native_1.TouchableOpacity style={styles.bookingRow} activeOpacity={0.7} onPress={() => router.push('/owner/bookings')}>
                    {/* Left Column: Time */}
                    <react_native_1.View style={styles.bookingTimeWrap}>
                      <react_native_1.Text style={[styles.timeMain, { color: theme.text }]}>{b.startTime}</react_native_1.Text>
                      <react_native_1.Text style={styles.timeSub}>{formatTimeSub(b.timeRange)}</react_native_1.Text>
                    </react_native_1.View>

                    {/* Middle Column: Details */}
                    <react_native_1.View style={styles.bookingDetails}>
                      <react_native_1.Text style={[styles.bookingLabel, { color: theme.text }]}>{b.label}</react_native_1.Text>
                      <react_native_1.Text style={[styles.bookingTurf, { color: theme.textMuted }]}>{b.turfName}</react_native_1.Text>
                      <react_native_1.View style={styles.customerRow}>
                        <vector_icons_1.Ionicons name="person-outline" size={12} color={theme.textMuted} style={{ marginRight: 4 }}/>
                        <react_native_1.Text style={[styles.customerName, { color: theme.textMuted }]}>{b.customerName}</react_native_1.Text>
                      </react_native_1.View>
                    </react_native_1.View>

                    {/* Right Column: Status & Price */}
                    <react_native_1.View style={styles.bookingRight}>
                      <react_native_1.View style={[
                styles.statusPill,
                { backgroundColor: b.status === 'CONFIRMED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)' }
            ]}>
                        <react_native_1.Text style={[
                styles.statusText,
                { color: b.status === 'CONFIRMED' ? '#10b981' : '#f59e0b' }
            ]}>
                          {b.status === 'CONFIRMED' ? 'Confirmed' : 'Pending'}
                        </react_native_1.Text>
                      </react_native_1.View>
                      <react_native_1.Text style={[styles.bookingAmount, { color: theme.text }]}>₹{b.amount}</react_native_1.Text>
                    </react_native_1.View>

                    <vector_icons_1.Ionicons name="chevron-forward" size={16} color="#cbd5e1" style={{ marginLeft: 8 }}/>
                  </react_native_1.TouchableOpacity>

                  {index < (stats.recentBookings ?? []).length - 1 && (<react_native_1.View style={[styles.dividerLine, { backgroundColor: theme.divider }]}/>)}
                </react_native_1.View>)))}
          </react_native_1.View>
        </react_native_1.View>

        {/* Quick Actions Grid */}
        <react_native_1.View style={styles.contentPadding}>
          <react_native_1.View style={styles.actionsGrid}>
            {[
            { label: 'Add Booking', icon: 'calendar-plus', library: 'MaterialCommunityIcons', route: '/owner/bookings' },
            { label: 'Slots Manager', icon: 'grid-large', library: 'MaterialCommunityIcons', route: '/owner/turfs' },
            { label: 'Block Slot', icon: 'calendar-lock', library: 'MaterialCommunityIcons', route: '/owner/turfs' },
            { label: 'Customers', icon: 'people-outline', library: 'Ionicons', route: '/owner/profile' },
            { label: 'Payments', icon: 'credit-card-outline', library: 'MaterialCommunityIcons', route: '/owner/bookings' },
            { label: 'Reports', icon: 'bar-chart-outline', library: 'Ionicons', route: '/owner/bookings' },
            { label: 'Reviews', icon: 'star-outline', library: 'Ionicons', route: '/owner/profile' },
            { label: 'More', icon: 'ellipsis-horizontal-circle-outline', library: 'Ionicons', route: '/owner/profile' },
        ].map((item) => (<react_native_1.TouchableOpacity key={item.label} style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} activeOpacity={0.7} onPress={() => router.push(item.route)}>
                <react_native_1.View style={styles.actionIconCircle}>
                  {item.library === 'MaterialCommunityIcons' ? (<vector_icons_1.MaterialCommunityIcons name={item.icon} size={22} color={ACCENT}/>) : (<vector_icons_1.Ionicons name={item.icon} size={22} color={ACCENT}/>)}
                </react_native_1.View>
                <react_native_1.Text style={[styles.actionLabel, { color: theme.text }]} numberOfLines={1}>{item.label}</react_native_1.Text>
              </react_native_1.TouchableOpacity>))}
          </react_native_1.View>
        </react_native_1.View>


        {/* Recent Reviews Section */}
        <react_native_1.View style={styles.sectionHeader}>
          <react_native_1.Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Reviews</react_native_1.Text>
          <react_native_1.TouchableOpacity onPress={() => router.push('/owner/profile')}>
            <react_native_1.Text style={styles.sectionLink}>View All {'>'}</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>

        <react_native_1.View style={styles.contentPadding}>
          <react_native_1.View style={[styles.reviewCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <react_native_1.View style={styles.reviewBadge}>
              <vector_icons_1.Ionicons name="star" size={14} color="#eab308" style={{ marginRight: 4 }}/>
              <react_native_1.Text style={styles.reviewBadgeText}>4.8</react_native_1.Text>
            </react_native_1.View>
            <react_native_1.View style={[styles.reviewDivider, { backgroundColor: theme.divider }]}/>
            <react_native_1.View style={styles.reviewBody}>
              <react_native_1.Text style={[styles.reviewText, { color: theme.text }]}>
                <react_native_1.Text style={styles.quoteMark}>“ </react_native_1.Text>
                Great turf and well maintained.
              </react_native_1.Text>
            </react_native_1.View>
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.ScrollView>

      {/* Notifications Modal */}
      <react_native_1.Modal visible={showNotifications} animationType="slide" transparent={true} onRequestClose={() => setShowNotifications(false)}>
        <react_native_1.View style={styles.modalOverlay}>
          <react_native_1.View style={[styles.modalContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <react_native_1.View style={styles.modalHeader}>
              <react_native_1.Text style={[styles.modalTitle, { color: theme.text }]}>Notifications</react_native_1.Text>
              <react_native_1.TouchableOpacity onPress={() => setShowNotifications(false)} hitSlop={8}>
                <vector_icons_1.Ionicons name="close" size={24} color={theme.text}/>
              </react_native_1.TouchableOpacity>
            </react_native_1.View>

            <react_native_1.ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              {notifications.length === 0 ? (<react_native_1.View style={styles.emptyNotifications}>
                  <vector_icons_1.Ionicons name="notifications-off-outline" size={48} color={theme.textMuted}/>
                  <react_native_1.Text style={[styles.emptyNotificationsText, { color: theme.textMuted }]}>
                    No new notifications
                  </react_native_1.Text>
                </react_native_1.View>) : (notifications.map((n) => (<react_native_1.TouchableOpacity key={n.id} style={[
                styles.notificationItem,
                { borderColor: theme.divider },
                !n.read && { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }
            ]} activeOpacity={0.7} onPress={() => {
                setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
            }}>
                    <react_native_1.View style={[styles.notifIconWrap, { backgroundColor: n.bgColor }]}>
                      <vector_icons_1.Ionicons name={n.icon} size={20} color={n.color}/>
                    </react_native_1.View>
                    <react_native_1.View style={styles.notifTextWrap}>
                      <react_native_1.View style={styles.notifMeta}>
                        <react_native_1.Text style={[styles.notifTitle, { color: theme.text }, !n.read && { fontWeight: '800' }]}>
                          {n.title}
                        </react_native_1.Text>
                        <react_native_1.Text style={[styles.notifTime, { color: theme.textMuted }]}>{n.time}</react_native_1.Text>
                      </react_native_1.View>
                      <react_native_1.Text style={[styles.notifMessage, { color: theme.textMuted }]} numberOfLines={2}>
                        {n.message}
                      </react_native_1.Text>
                    </react_native_1.View>
                    {!n.read && <react_native_1.View style={styles.unreadDot}/>}
                  </react_native_1.TouchableOpacity>)))}
            </react_native_1.ScrollView>

            {notifications.length > 0 && (<react_native_1.TouchableOpacity style={styles.clearAllBtn} activeOpacity={0.7} onPress={() => {
                setNotifications([]);
            }}>
                <react_native_1.Text style={styles.clearAllText}>Clear All</react_native_1.Text>
              </react_native_1.TouchableOpacity>)}
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.Modal>
    </react_native_1.View>);
}
const styles = react_native_1.StyleSheet.create({
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
