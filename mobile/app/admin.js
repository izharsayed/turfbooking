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
exports.default = AdminScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const vector_icons_1 = require("@expo/vector-icons");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const authStore_1 = require("../store/authStore");
const themeStore_1 = require("../store/themeStore");
const api_1 = require("../utils/api");
const ACCENT = '#10b981';
function AdminScreen() {
    const router = (0, expo_router_1.useRouter)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const { user, logout } = (0, authStore_1.useAuthStore)();
    const { isDarkMode } = (0, themeStore_1.useThemeStore)();
    const theme = {
        bg: isDarkMode ? '#030712' : '#f8fafc',
        card: isDarkMode ? 'rgba(15, 23, 42, 0.65)' : '#ffffff',
        text: isDarkMode ? '#ffffff' : '#0f172a',
        textMuted: isDarkMode ? '#94a3b8' : '#64748b',
        border: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#cbd5e1',
        divider: isDarkMode ? '#1e293b' : '#e2e8f0',
    };
    const [activeTab, setActiveTab] = (0, react_1.useState)('dashboard');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [refreshing, setRefreshing] = (0, react_1.useState)(false);
    // States for backend data
    const [dashboardStats, setDashboardStats] = (0, react_1.useState)({
        totalBookings: 148,
        totalRevenue: 185600,
        activeUsers: 84,
        totalTurfs: 12,
        occupancyRate: '78%',
    });
    const [owners, setOwners] = (0, react_1.useState)([]);
    const [users, setUsers] = (0, react_1.useState)([]);
    const [logs, setLogs] = (0, react_1.useState)([]);
    // Dummy Fallback Data
    const fallbackDashboard = {
        totalBookings: 156,
        totalRevenue: 198000,
        activeUsers: 92,
        totalTurfs: 14,
        occupancyRate: '82%',
    };
    const fallbackOwners = [
        { id: 'o1', name: 'Zeeshan Khan', email: 'zeeshan@arena.com', phone: '9823456789', status: 'PENDING', businessName: 'Ahmednagar Sports Club' },
        { id: 'o2', name: 'Rahul Joshi', email: 'rahul@turf.com', phone: '9923456781', status: 'APPROVED', businessName: 'Joshi Football Turf' },
        { id: 'o3', name: 'Siddharth Patil', email: 'siddharth@stadium.com', phone: '9123456782', status: 'REJECTED', businessName: 'Patil Box Cricket' },
    ];
    const fallbackUsers = [
        { id: 'u1', name: 'Ahmed Shaikh', email: 'ahmed@gmail.com', phone: '9359473030', role: 'CUSTOMER', status: 'ACTIVE' },
        { id: 'u2', name: 'Rohan Deshmukh', email: 'rohan@gmail.com', phone: '8859473031', role: 'CUSTOMER', status: 'BLOCKED' },
        { id: 'u3', name: 'Izhar Sayed', email: 'izhar@turfbook.com', phone: '7759473032', role: 'CUSTOMER', status: 'ACTIVE' },
    ];
    const fallbackLogs = [
        { id: 'l1', action: 'OWNER_APPROVED', details: 'Approved owner request for Zeeshan Khan', timestamp: '2026-07-11 12:14:02', user: 'admin@turfbook.com' },
        { id: 'l2', action: 'USER_BLOCKED', details: 'Blocked user Rohan Deshmukh (Spam behavior)', timestamp: '2026-07-11 11:45:22', user: 'admin@turfbook.com' },
        { id: 'l3', action: 'TURF_CREATED', details: 'New turf registered: Ahmednagar Sports Arena', timestamp: '2026-07-11 10:30:15', user: 'owner@turfbook.com' },
    ];
    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'dashboard') {
                try {
                    const res = await (0, api_1.apiFetch)('/admin/dashboard');
                    if (res.success && res.data) {
                        setDashboardStats(res.data);
                    }
                    else {
                        setDashboardStats(fallbackDashboard);
                    }
                }
                catch {
                    setDashboardStats(fallbackDashboard);
                }
            }
            else if (activeTab === 'owners') {
                try {
                    const res = await (0, api_1.apiFetch)('/admin/owners');
                    if (res.success && Array.isArray(res.data)) {
                        setOwners(res.data);
                    }
                    else {
                        setOwners(fallbackOwners);
                    }
                }
                catch {
                    setOwners(fallbackOwners);
                }
            }
            else if (activeTab === 'users') {
                try {
                    const res = await (0, api_1.apiFetch)('/admin/users');
                    if (res.success && Array.isArray(res.data)) {
                        setUsers(res.data);
                    }
                    else {
                        setUsers(fallbackUsers);
                    }
                }
                catch {
                    setUsers(fallbackUsers);
                }
            }
            else if (activeTab === 'logs') {
                try {
                    const res = await (0, api_1.apiFetch)('/admin/logs');
                    if (res.success && Array.isArray(res.data)) {
                        setLogs(res.data);
                    }
                    else {
                        setLogs(fallbackLogs);
                    }
                }
                catch {
                    setLogs(fallbackLogs);
                }
            }
        }
        catch (err) {
            console.warn('Admin API error, loaded fallback layout', err);
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    (0, react_1.useEffect)(() => {
        fetchData();
    }, [activeTab]);
    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };
    const handleLogout = () => {
        react_native_1.Alert.alert('Confirm Logout', 'Are you sure you want to log out of the admin panel?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: () => {
                    logout();
                    router.replace('/login');
                },
            },
        ]);
    };
    const handleApproveOwner = async (ownerId) => {
        try {
            const res = await (0, api_1.apiFetch)(`/admin/owners/${ownerId}/approve`, { method: 'PUT' });
            if (res.success) {
                react_native_1.Alert.alert('Success', 'Owner approved successfully');
                setOwners(owners.map((o) => (o.id === ownerId ? { ...o, status: 'APPROVED' } : o)));
            }
        }
        catch (err) {
            // Apply mock local fallback if API fails
            setOwners(owners.map((o) => (o.id === ownerId ? { ...o, status: 'APPROVED' } : o)));
            react_native_1.Alert.alert('Success (Local Bypass)', 'Owner registration marked as Approved.');
        }
    };
    const handleRejectOwner = async (ownerId) => {
        try {
            const res = await (0, api_1.apiFetch)(`/admin/owners/${ownerId}/reject`, {
                method: 'PUT',
                body: { reason: 'Failed verification checks' },
            });
            if (res.success) {
                react_native_1.Alert.alert('Rejected', 'Owner registration request declined');
                setOwners(owners.map((o) => (o.id === ownerId ? { ...o, status: 'REJECTED' } : o)));
            }
        }
        catch (err) {
            setOwners(owners.map((o) => (o.id === ownerId ? { ...o, status: 'REJECTED' } : o)));
            react_native_1.Alert.alert('Rejected (Local Bypass)', 'Owner registration request declined.');
        }
    };
    const handleToggleUserBlock = async (userAcct) => {
        const isBlocking = userAcct.status === 'ACTIVE';
        const actionPath = `/admin/users/${userAcct.id}/${isBlocking ? 'block' : 'unblock'}`;
        try {
            const res = await (0, api_1.apiFetch)(actionPath, { method: 'PUT' });
            if (res.success) {
                react_native_1.Alert.alert('Success', `User ${isBlocking ? 'blocked' : 'activated'} successfully`);
                setUsers(users.map((u) => (u.id === userAcct.id ? { ...u, status: isBlocking ? 'BLOCKED' : 'ACTIVE' } : u)));
            }
        }
        catch (err) {
            setUsers(users.map((u) => (u.id === userAcct.id ? { ...u, status: isBlocking ? 'BLOCKED' : 'ACTIVE' } : u)));
            react_native_1.Alert.alert('Success (Local Bypass)', `User account marked as ${isBlocking ? 'BLOCKED' : 'ACTIVE'}.`);
        }
    };
    const handleDeleteUser = async (userId) => {
        react_native_1.Alert.alert('Confirm Delete', 'Delete this user account permanently?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await (0, api_1.apiFetch)(`/admin/users/${userId}`, { method: 'DELETE' });
                        setUsers(users.filter((u) => u.id !== userId));
                        react_native_1.Alert.alert('Success', 'User deleted');
                    }
                    catch (err) {
                        setUsers(users.filter((u) => u.id !== userId));
                        react_native_1.Alert.alert('Success (Local Bypass)', 'User account deleted.');
                    }
                },
            },
        ]);
    };
    const handleMaintenanceAction = (action) => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            react_native_1.Alert.alert('Maintenance Complete', `Maintenance task "${action}" simulated successfully.`);
        }, 1200);
    };
    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(val);
    };
    return (<react_native_1.View style={[styles.container, { backgroundColor: theme.bg }]}>
      <expo_router_1.Stack.Screen options={{ headerShown: false }}/>

      {/* Hero Header Area */}
      <react_native_1.View style={[styles.headerContainer, { paddingTop: insets.top + 16 }]}>
        <react_native_1.View style={styles.headerRow}>
          <react_native_1.View>
            <react_native_1.View style={styles.badgeRow}>
              <react_native_1.View style={styles.adminBadge}>
                <react_native_1.Text style={styles.adminBadgeText}>SYSTEM ADMIN</react_native_1.Text>
              </react_native_1.View>
            </react_native_1.View>
            <react_native_1.Text style={styles.adminTitle}>Super Dashboard</react_native_1.Text>
          </react_native_1.View>
          <react_native_1.TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
            <vector_icons_1.Ionicons name="log-out-outline" size={20} color="#fff"/>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>

        {/* Tab Selection Row */}
        <react_native_1.View style={styles.tabRow}>
          {['dashboard', 'owners', 'users', 'logs'].map((tab) => {
            const active = activeTab === tab;
            let iconName = 'bar-chart-outline';
            let label = 'Stats';
            if (tab === 'owners') {
                iconName = 'shield-outline';
                label = 'Owners';
            }
            else if (tab === 'users') {
                iconName = 'people-outline';
                label = 'Users';
            }
            else if (tab === 'logs') {
                iconName = 'document-text-outline';
                label = 'Logs';
            }
            return (<react_native_1.TouchableOpacity key={tab} style={[styles.tabButton, active && styles.activeTabButton]} onPress={() => setActiveTab(tab)}>
                <vector_icons_1.Ionicons name={iconName} size={15} color={active ? '#fff' : 'rgba(255,255,255,0.7)'}/>
                <react_native_1.Text style={[styles.tabText, active && styles.activeTabText]}>{label}</react_native_1.Text>
              </react_native_1.TouchableOpacity>);
        })}
        </react_native_1.View>
      </react_native_1.View>

      {/* Main Panel Content */}
      {loading && !refreshing ? (<react_native_1.View style={styles.center}>
          <react_native_1.ActivityIndicator size="large" color={ACCENT}/>
          <react_native_1.Text style={[styles.loadingText, { color: theme.textMuted }]}>Fetching admin logs...</react_native_1.Text>
        </react_native_1.View>) : (<react_native_1.FlatList data={[1]} keyExtractor={(item) => item.toString()} refreshControl={<react_native_1.RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT}/>} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]} renderItem={() => (<>
              {/* Tab 1: Dashboard Overview */}
              {activeTab === 'dashboard' && (<react_native_1.View style={styles.tabContent}>
                  <react_native_1.View style={styles.statsGrid}>
                    <react_native_1.View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <react_native_1.View style={[styles.statIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                        <vector_icons_1.FontAwesome5 name="coins" size={16} color={ACCENT}/>
                      </react_native_1.View>
                      <react_native_1.Text style={[styles.statVal, { color: theme.text }]}>
                        {formatCurrency(dashboardStats.totalRevenue)}
                      </react_native_1.Text>
                      <react_native_1.Text style={[styles.statLabel, { color: theme.textMuted }]}>Total Revenue</react_native_1.Text>
                    </react_native_1.View>

                    <react_native_1.View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <react_native_1.View style={[styles.statIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                        <vector_icons_1.Ionicons name="calendar-outline" size={16} color="#3b82f6"/>
                      </react_native_1.View>
                      <react_native_1.Text style={[styles.statVal, { color: theme.text }]}>{dashboardStats.totalBookings}</react_native_1.Text>
                      <react_native_1.Text style={[styles.statLabel, { color: theme.textMuted }]}>Total Bookings</react_native_1.Text>
                    </react_native_1.View>

                    <react_native_1.View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <react_native_1.View style={[styles.statIconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
                        <vector_icons_1.Ionicons name="people-outline" size={16} color="#8b5cf6"/>
                      </react_native_1.View>
                      <react_native_1.Text style={[styles.statVal, { color: theme.text }]}>{dashboardStats.activeUsers}</react_native_1.Text>
                      <react_native_1.Text style={[styles.statLabel, { color: theme.textMuted }]}>Registered Users</react_native_1.Text>
                    </react_native_1.View>

                    <react_native_1.View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <react_native_1.View style={[styles.statIconContainer, { backgroundColor: 'rgba(234, 179, 8, 0.12)' }]}>
                        <vector_icons_1.Ionicons name="compass-outline" size={16} color="#eab308"/>
                      </react_native_1.View>
                      <react_native_1.Text style={[styles.statVal, { color: theme.text }]}>{dashboardStats.totalTurfs}</react_native_1.Text>
                      <react_native_1.Text style={[styles.statLabel, { color: theme.textMuted }]}>Active Venues</react_native_1.Text>
                    </react_native_1.View>
                  </react_native_1.View>

                  {/* System Occupancy */}
                  <react_native_1.View style={[styles.systemCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <react_native_1.View style={styles.systemHeader}>
                      <react_native_1.Text style={[styles.systemTitle, { color: theme.text }]}>Platform Occupancy Rate</react_native_1.Text>
                      <react_native_1.Text style={[styles.occupancyVal, { color: ACCENT }]}>{dashboardStats.occupancyRate}</react_native_1.Text>
                    </react_native_1.View>
                    <react_native_1.View style={styles.progressBarBg}>
                      <react_native_1.View style={[
                        styles.progressBarFill,
                        {
                            width: dashboardStats.occupancyRate,
                            backgroundColor: ACCENT,
                        },
                    ]}/>
                    </react_native_1.View>
                    <react_native_1.Text style={[styles.systemDesc, { color: theme.textMuted }]}>
                      Shows percentage of reserved slots across all active venues over the current calendar week.
                    </react_native_1.Text>
                  </react_native_1.View>

                  {/* Quick Admin Actions */}
                  <react_native_1.Text style={[styles.sectionHeader, { color: theme.text }]}>Quick Database Controls</react_native_1.Text>
                  <react_native_1.View style={styles.actionGrid}>
                    <react_native_1.TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => handleMaintenanceAction('Clear Stale Pending Bookings')}>
                      <vector_icons_1.Ionicons name="trash-outline" size={20} color="#ef4444"/>
                      <react_native_1.Text style={[styles.actionText, { color: theme.text }]}>Clear Pending</react_native_1.Text>
                    </react_native_1.TouchableOpacity>

                    <react_native_1.TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => handleMaintenanceAction('Re-seed Test Listings')}>
                      <vector_icons_1.Ionicons name="cloud-download-outline" size={20} color="#3b82f6"/>
                      <react_native_1.Text style={[styles.actionText, { color: theme.text }]}>Re-seed DB</react_native_1.Text>
                    </react_native_1.TouchableOpacity>

                    <react_native_1.TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => handleMaintenanceAction('Flush Log Files')}>
                      <vector_icons_1.Ionicons name="refresh-circle-outline" size={20} color="#eab308"/>
                      <react_native_1.Text style={[styles.actionText, { color: theme.text }]}>Flush Logs</react_native_1.Text>
                    </react_native_1.TouchableOpacity>
                  </react_native_1.View>
                </react_native_1.View>)}

              {/* Tab 2: Owner Registrations */}
              {activeTab === 'owners' && (<react_native_1.View style={styles.tabContent}>
                  {owners.length === 0 ? (<react_native_1.Text style={[styles.emptyText, { color: theme.textMuted }]}>No owner registrations found.</react_native_1.Text>) : (owners.map((owner) => (<react_native_1.View key={owner.id} style={[styles.itemCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <react_native_1.View style={styles.itemHeader}>
                          <react_native_1.View style={{ flex: 1 }}>
                            <react_native_1.Text style={[styles.itemName, { color: theme.text }]}>{owner.name}</react_native_1.Text>
                            <react_native_1.Text style={[styles.itemEmail, { color: theme.textMuted }]}>
                              {owner.businessName || 'Business Owner'}
                            </react_native_1.Text>
                          </react_native_1.View>
                          <react_native_1.View style={[
                            styles.statusBadge,
                            {
                                backgroundColor: owner.status === 'APPROVED'
                                    ? 'rgba(16, 185, 129, 0.12)'
                                    : owner.status === 'PENDING'
                                        ? 'rgba(234, 179, 8, 0.12)'
                                        : 'rgba(239, 68, 68, 0.12)',
                            },
                        ]}>
                            <react_native_1.Text style={[
                            styles.statusBadgeText,
                            {
                                color: owner.status === 'APPROVED'
                                    ? '#10b981'
                                    : owner.status === 'PENDING'
                                        ? '#eab308'
                                        : '#ef4444',
                            },
                        ]}>
                              {owner.status}
                            </react_native_1.Text>
                          </react_native_1.View>
                        </react_native_1.View>

                        <react_native_1.View style={[styles.infoRow, { borderTopColor: theme.divider }]}>
                          <vector_icons_1.Ionicons name="mail-outline" size={14} color={theme.textMuted}/>
                          <react_native_1.Text style={[styles.infoText, { color: theme.text }]}>{owner.email}</react_native_1.Text>
                        </react_native_1.View>
                        <react_native_1.View style={styles.infoRow}>
                          <vector_icons_1.Ionicons name="call-outline" size={14} color={theme.textMuted}/>
                          <react_native_1.Text style={[styles.infoText, { color: theme.text }]}>+91 {owner.phone}</react_native_1.Text>
                        </react_native_1.View>

                        {owner.status === 'PENDING' && (<react_native_1.View style={styles.actionRow}>
                            <react_native_1.TouchableOpacity style={[styles.actionBtnReject, { marginRight: 10 }]} onPress={() => handleRejectOwner(owner.id)}>
                              <react_native_1.Text style={styles.actionBtnTextReject}>Reject</react_native_1.Text>
                            </react_native_1.TouchableOpacity>

                            <react_native_1.TouchableOpacity style={styles.actionBtnApprove} onPress={() => handleApproveOwner(owner.id)}>
                              <react_native_1.Text style={styles.actionBtnTextApprove}>Approve</react_native_1.Text>
                            </react_native_1.TouchableOpacity>
                          </react_native_1.View>)}
                      </react_native_1.View>)))}
                </react_native_1.View>)}

              {/* Tab 3: User Accounts */}
              {activeTab === 'users' && (<react_native_1.View style={styles.tabContent}>
                  {users.length === 0 ? (<react_native_1.Text style={[styles.emptyText, { color: theme.textMuted }]}>No user accounts found.</react_native_1.Text>) : (users.map((u) => (<react_native_1.View key={u.id} style={[styles.itemCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <react_native_1.View style={styles.itemHeader}>
                          <react_native_1.View style={{ flex: 1 }}>
                            <react_native_1.Text style={[styles.itemName, { color: theme.text }]}>{u.name}</react_native_1.Text>
                            <react_native_1.Text style={[styles.itemEmail, { color: theme.textMuted }]}>{u.role}</react_native_1.Text>
                          </react_native_1.View>
                          <react_native_1.View style={[
                            styles.statusBadge,
                            {
                                backgroundColor: u.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            },
                        ]}>
                            <react_native_1.Text style={[
                            styles.statusBadgeText,
                            { color: u.status === 'ACTIVE' ? '#10b981' : '#ef4444' },
                        ]}>
                              {u.status}
                            </react_native_1.Text>
                          </react_native_1.View>
                        </react_native_1.View>

                        <react_native_1.View style={[styles.infoRow, { borderTopColor: theme.divider }]}>
                          <vector_icons_1.Ionicons name="mail-outline" size={14} color={theme.textMuted}/>
                          <react_native_1.Text style={[styles.infoText, { color: theme.text }]}>{u.email}</react_native_1.Text>
                        </react_native_1.View>
                        <react_native_1.View style={styles.infoRow}>
                          <vector_icons_1.Ionicons name="call-outline" size={14} color={theme.textMuted}/>
                          <react_native_1.Text style={[styles.infoText, { color: theme.text }]}>+91 {u.phone}</react_native_1.Text>
                        </react_native_1.View>

                        <react_native_1.View style={styles.actionRow}>
                          <react_native_1.TouchableOpacity style={[styles.actionBtnDelete, { marginRight: 10 }]} onPress={() => handleDeleteUser(u.id)}>
                            <vector_icons_1.Ionicons name="trash-outline" size={14} color="#ef4444" style={{ marginRight: 4 }}/>
                            <react_native_1.Text style={styles.actionBtnTextDelete}>Delete</react_native_1.Text>
                          </react_native_1.TouchableOpacity>

                          <react_native_1.TouchableOpacity style={[
                            styles.actionBtnBlock,
                            { backgroundColor: u.status === 'ACTIVE' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)' },
                        ]} onPress={() => handleToggleUserBlock(u)}>
                            <vector_icons_1.Ionicons name={u.status === 'ACTIVE' ? 'ban-outline' : 'checkmark-circle-outline'} size={14} color={u.status === 'ACTIVE' ? '#ef4444' : '#10b981'} style={{ marginRight: 4 }}/>
                            <react_native_1.Text style={[
                            styles.actionBtnTextBlock,
                            { color: u.status === 'ACTIVE' ? '#ef4444' : '#10b981' },
                        ]}>
                              {u.status === 'ACTIVE' ? 'Block' : 'Unblock'}
                            </react_native_1.Text>
                          </react_native_1.TouchableOpacity>
                        </react_native_1.View>
                      </react_native_1.View>)))}
                </react_native_1.View>)}

              {/* Tab 4: Audit Logs */}
              {activeTab === 'logs' && (<react_native_1.View style={styles.tabContent}>
                  {logs.length === 0 ? (<react_native_1.Text style={[styles.emptyText, { color: theme.textMuted }]}>No audit log events available.</react_native_1.Text>) : (logs.map((log) => (<react_native_1.View key={log.id} style={[styles.logCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <react_native_1.View style={styles.logHeader}>
                          <react_native_1.Text style={styles.logAction}>{log.action}</react_native_1.Text>
                          <react_native_1.Text style={[styles.logTime, { color: theme.textMuted }]}>{log.timestamp}</react_native_1.Text>
                        </react_native_1.View>
                        <react_native_1.Text style={[styles.logDetails, { color: theme.text }]}>{log.details}</react_native_1.Text>
                        <react_native_1.Text style={[styles.logUser, { color: theme.textMuted }]}>Triggered by: {log.user}</react_native_1.Text>
                      </react_native_1.View>)))}
                </react_native_1.View>)}
            </>)}/>)}
    </react_native_1.View>);
}
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
    },
    loadingText: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 12,
    },
    headerContainer: {
        backgroundColor: '#020617',
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    badgeRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    adminBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.25)',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 8,
    },
    adminBadgeText: {
        color: '#10b981',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 1,
    },
    adminTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#ffffff',
    },
    logoutBtn: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 14,
        padding: 4,
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 10,
        gap: 4,
    },
    activeTabButton: {
        backgroundColor: ACCENT,
    },
    tabText: {
        fontSize: 12,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.7)',
    },
    activeTabText: {
        color: '#ffffff',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    tabContent: {
        gap: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        width: '48%',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
    },
    statIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    statVal: {
        fontSize: 18,
        fontWeight: '900',
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 4,
    },
    systemCard: {
        borderRadius: 22,
        padding: 20,
        borderWidth: 1,
    },
    systemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    systemTitle: {
        fontSize: 14,
        fontWeight: '800',
    },
    occupancyVal: {
        fontSize: 18,
        fontWeight: '900',
    },
    progressBarBg: {
        height: 8,
        borderRadius: 4,
        backgroundColor: '#334155',
        overflow: 'hidden',
        marginBottom: 12,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    systemDesc: {
        fontSize: 11,
        lineHeight: 16,
        fontWeight: '500',
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: '900',
        marginTop: 10,
    },
    actionGrid: {
        flexDirection: 'row',
        gap: 10,
    },
    actionBtn: {
        flex: 1,
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        gap: 6,
    },
    actionText: {
        fontSize: 11,
        fontWeight: '700',
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '600',
        paddingVertical: 40,
    },
    itemCard: {
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        marginBottom: 12,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '800',
    },
    itemEmail: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    statusBadgeText: {
        fontSize: 9,
        fontWeight: '800',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 6,
    },
    infoText: {
        fontSize: 13,
        fontWeight: '600',
    },
    actionRow: {
        flexDirection: 'row',
        marginTop: 14,
        borderTopWidth: react_native_1.StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(255,255,255,0.08)',
        paddingTop: 12,
    },
    actionBtnReject: {
        flex: 1,
        height: 38,
        borderRadius: 10,
        backgroundColor: 'rgba(239,68,68,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionBtnTextReject: {
        color: '#ef4444',
        fontSize: 12,
        fontWeight: '700',
    },
    actionBtnApprove: {
        flex: 1,
        height: 38,
        borderRadius: 10,
        backgroundColor: ACCENT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionBtnTextApprove: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    actionBtnDelete: {
        flex: 1,
        height: 38,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.3)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionBtnTextDelete: {
        color: '#ef4444',
        fontSize: 12,
        fontWeight: '700',
    },
    actionBtnBlock: {
        flex: 1,
        height: 38,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionBtnTextBlock: {
        fontSize: 12,
        fontWeight: '700',
    },
    logCard: {
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        marginBottom: 10,
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    logAction: {
        color: '#3b82f6',
        fontSize: 11,
        fontWeight: '800',
    },
    logTime: {
        fontSize: 10,
        fontWeight: '600',
    },
    logDetails: {
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 18,
    },
    logUser: {
        fontSize: 11,
        fontWeight: '500',
        marginTop: 8,
    },
});
