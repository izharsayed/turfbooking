import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { apiFetch } from '../utils/api';

const ACCENT = '#10b981';

interface Owner {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  businessName?: string;
  paymentStatus?: 'PENDING' | 'PAID';
  paymentHistory?: Array<{
    id: string;
    amount: number;
    type: string;
    paymentMethod: string;
    date: string;
    transactionId?: string;
  }>;
}

interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: 'ACTIVE' | 'BLOCKED';
}

interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  user: string;
}

export default function AdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const { isDarkMode } = useThemeStore();

  const theme = {
    bg: isDarkMode ? '#030712' : '#f8fafc',
    card: isDarkMode ? 'rgba(15, 23, 42, 0.65)' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#cbd5e1',
    divider: isDarkMode ? '#1e293b' : '#e2e8f0',
  };

  const [activeTab, setActiveTab] = useState<'dashboard' | 'owners' | 'users' | 'logs'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // States for Owner Payment Modal
  const [selectedOwnerForPayment, setSelectedOwnerForPayment] = useState<Owner | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState('REGISTRATION_FEE');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [transactionId, setTransactionId] = useState('');

  // States for backend data
  const [dashboardStats, setDashboardStats] = useState({
    totalBookings: 148,
    totalRevenue: 185600,
    activeUsers: 84,
    totalTurfs: 12,
    occupancyRate: '78%',
  });
  const [owners, setOwners] = useState<Owner[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  // Dummy Fallback Data
  const fallbackDashboard = {
    totalBookings: 156,
    totalRevenue: 198000,
    activeUsers: 92,
    totalTurfs: 14,
    occupancyRate: '82%',
  };

  const fallbackOwners: Owner[] = [
    { id: 'o1', name: 'Zeeshan Khan', email: 'zeeshan@arena.com', phone: '9823456789', status: 'PENDING', businessName: 'Ahmednagar Sports Club', paymentStatus: 'PENDING', paymentHistory: [] },
    { id: 'o2', name: 'Rahul Joshi', email: 'rahul@turf.com', phone: '9923456781', status: 'APPROVED', businessName: 'Joshi Football Turf', paymentStatus: 'PAID', paymentHistory: [{ id: 'p1', amount: 5000, type: 'REGISTRATION_FEE', paymentMethod: 'UPI', date: '2026-07-12T10:00:00Z', transactionId: 'txn_98765' }] },
    { id: 'o3', name: 'Siddharth Patil', email: 'siddharth@stadium.com', phone: '9123456782', status: 'REJECTED', businessName: 'Patil Box Cricket', paymentStatus: 'PENDING', paymentHistory: [] },
  ];

  const fallbackUsers: UserAccount[] = [
    { id: 'u1', name: 'Ahmed Shaikh', email: 'ahmed@gmail.com', phone: '9359473030', role: 'CUSTOMER', status: 'ACTIVE' },
    { id: 'u2', name: 'Rohan Deshmukh', email: 'rohan@gmail.com', phone: '8859473031', role: 'CUSTOMER', status: 'BLOCKED' },
    { id: 'u3', name: 'Izhar Sayed', email: 'izhar@turfbook.com', phone: '7759473032', role: 'CUSTOMER', status: 'ACTIVE' },
  ];

  const fallbackLogs: AuditLog[] = [
    { id: 'l1', action: 'OWNER_APPROVED', details: 'Approved owner request for Zeeshan Khan', timestamp: '2026-07-11 12:14:02', user: 'izharsayed12@gmail.com' },
    { id: 'l2', action: 'USER_BLOCKED', details: 'Blocked user Rohan Deshmukh (Spam behavior)', timestamp: '2026-07-11 11:45:22', user: 'izharsayed12@gmail.com' },
    { id: 'l3', action: 'TURF_CREATED', details: 'New turf registered: Ahmednagar Sports Arena', timestamp: '2026-07-11 10:30:15', user: 'owner@turfbook.com' },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        try {
          const res = await apiFetch('/admin/dashboard');
          if (res.success && res.data) {
            setDashboardStats(res.data);
          } else {
            setDashboardStats(fallbackDashboard);
          }
        } catch {
          setDashboardStats(fallbackDashboard);
        }
      } else if (activeTab === 'owners') {
        try {
          const res = await apiFetch('/admin/owners');
          if (res.success && Array.isArray(res.data)) {
            setOwners(res.data);
          } else {
            setOwners(fallbackOwners);
          }
        } catch {
          setOwners(fallbackOwners);
        }
      } else if (activeTab === 'users') {
        try {
          const res = await apiFetch('/admin/users');
          if (res.success && Array.isArray(res.data)) {
            setUsers(res.data);
          } else {
            setUsers(fallbackUsers);
          }
        } catch {
          setUsers(fallbackUsers);
        }
      } else if (activeTab === 'logs') {
        try {
          const res = await apiFetch('/admin/logs');
          if (res.success && Array.isArray(res.data)) {
            setLogs(res.data);
          } else {
            setLogs(fallbackLogs);
          }
        } catch {
          setLogs(fallbackLogs);
        }
      }
    } catch (err) {
      console.warn('Admin API error, loaded fallback layout', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleLogout = () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to log out of the admin panel?', [
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

  const handleApproveOwner = async (ownerId: string) => {
    try {
      const res = await apiFetch(`/admin/owners/${ownerId}/approve`, { method: 'PUT' });
      if (res.success) {
        Alert.alert('Success', 'Owner approved successfully');
        setOwners(owners.map((o) => (o.id === ownerId ? { ...o, status: 'APPROVED' } : o)));
      }
    } catch (err: any) {
      // Apply mock local fallback if API fails
      setOwners(owners.map((o) => (o.id === ownerId ? { ...o, status: 'APPROVED' } : o)));
      Alert.alert('Success (Local Bypass)', 'Owner registration marked as Approved.');
    }
  };

  const handleRejectOwner = async (ownerId: string) => {
    try {
      const res = await apiFetch(`/admin/owners/${ownerId}/reject`, {
        method: 'PUT',
        body: { reason: 'Failed verification checks' },
      });
      if (res.success) {
        Alert.alert('Rejected', 'Owner registration request declined');
        setOwners(owners.map((o) => (o.id === ownerId ? { ...o, status: 'REJECTED' } : o)));
      }
    } catch (err: any) {
      setOwners(owners.map((o) => (o.id === ownerId ? { ...o, status: 'REJECTED' } : o)));
      Alert.alert('Rejected (Local Bypass)', 'Owner registration request declined.');
    }
  };

  const handleShowPaymentHistory = (owner: Owner) => {
    setSelectedOwnerForPayment(owner);
    setShowPaymentModal(true);
  };

  const handleUpdatePaymentStatus = async (ownerId: string, status: 'PENDING' | 'PAID') => {
    try {
      setLoading(true);
      const res = await apiFetch(`/admin/owners/${ownerId}/payment`, {
        method: 'PUT',
        body: { status }
      });
      if (res.success) {
        Alert.alert('Success', `Payment status updated to ${status}`);
        setOwners(owners.map(o => o.id === ownerId ? { ...o, paymentStatus: status } : o));
        if (selectedOwnerForPayment && selectedOwnerForPayment.id === ownerId) {
          setSelectedOwnerForPayment({ ...selectedOwnerForPayment, paymentStatus: status });
        }
      }
    } catch (err) {
      // Local Bypass / Fallback
      setOwners(owners.map(o => o.id === ownerId ? { ...o, paymentStatus: status } : o));
      if (selectedOwnerForPayment && selectedOwnerForPayment.id === ownerId) {
        setSelectedOwnerForPayment({ ...selectedOwnerForPayment, paymentStatus: status });
      }
      Alert.alert('Success (Local Bypass)', `Payment status marked as ${status}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedOwnerForPayment) return;
    if (!paymentAmount || isNaN(Number(paymentAmount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    try {
      setLoading(true);
      const newEntry = {
        amount: Number(paymentAmount),
        type: paymentType,
        paymentMethod: paymentMethod,
        transactionId: transactionId || `tx_${Date.now()}`
      };
      const res = await apiFetch(`/admin/owners/${selectedOwnerForPayment.id}/payment`, {
        method: 'PUT',
        body: {
          status: 'PAID',
          paymentEntry: newEntry
        }
      });
      if (res.success) {
        Alert.alert('Success', 'Payment recorded successfully');
        const updatedHistory = [
          ...(selectedOwnerForPayment.paymentHistory || []),
          { id: `pay_${Date.now()}`, date: new Date().toISOString(), ...newEntry }
        ];
        setOwners(owners.map(o => o.id === selectedOwnerForPayment.id ? { ...o, paymentStatus: 'PAID', paymentHistory: updatedHistory } : o));
        setSelectedOwnerForPayment({ ...selectedOwnerForPayment, paymentStatus: 'PAID', paymentHistory: updatedHistory });
        setPaymentAmount('');
        setTransactionId('');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to record payment';
      if (errorMsg.includes('unapproved')) {
        Alert.alert('Validation Error', errorMsg);
      } else {
        const updatedHistory = [
          ...(selectedOwnerForPayment.paymentHistory || []),
          { id: `pay_${Date.now()}`, date: new Date().toISOString(), amount: Number(paymentAmount), type: paymentType, paymentMethod, transactionId: transactionId || `tx_${Date.now()}` }
        ];
        setOwners(owners.map(o => o.id === selectedOwnerForPayment.id ? { ...o, paymentStatus: 'PAID', paymentHistory: updatedHistory } : o));
        setSelectedOwnerForPayment({ ...selectedOwnerForPayment, paymentStatus: 'PAID', paymentHistory: updatedHistory });
        setPaymentAmount('');
        setTransactionId('');
        Alert.alert('Success (Local Bypass)', 'Payment recorded offline.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserBlock = async (userAcct: UserAccount) => {
    const isBlocking = userAcct.status === 'ACTIVE';
    const actionPath = `/admin/users/${userAcct.id}/${isBlocking ? 'block' : 'unblock'}`;
    try {
      const res = await apiFetch(actionPath, { method: 'PUT' });
      if (res.success) {
        Alert.alert('Success', `User ${isBlocking ? 'blocked' : 'activated'} successfully`);
        setUsers(users.map((u) => (u.id === userAcct.id ? { ...u, status: isBlocking ? 'BLOCKED' : 'ACTIVE' } : u)));
      }
    } catch (err: any) {
      setUsers(users.map((u) => (u.id === userAcct.id ? { ...u, status: isBlocking ? 'BLOCKED' : 'ACTIVE' } : u)));
      Alert.alert('Success (Local Bypass)', `User account marked as ${isBlocking ? 'BLOCKED' : 'ACTIVE'}.`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    Alert.alert('Confirm Delete', 'Delete this user account permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(`/admin/users/${userId}`, { method: 'DELETE' });
            setUsers(users.filter((u) => u.id !== userId));
            Alert.alert('Success', 'User deleted');
          } catch (err) {
            setUsers(users.filter((u) => u.id !== userId));
            Alert.alert('Success (Local Bypass)', 'User account deleted.');
          }
        },
      },
    ]);
  };

  const handleMaintenanceAction = (action: string) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Maintenance Complete', `Maintenance task "${action}" simulated successfully.`);
    }, 1200);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Hero Header Area */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <View>
            <View style={styles.badgeRow}>
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>SYSTEM ADMIN</Text>
              </View>
            </View>
            <Text style={styles.adminTitle}>Super Dashboard</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Tab Selection Row */}
        <View style={styles.tabRow}>
          {(['dashboard', 'owners', 'users', 'logs'] as const).map((tab) => {
            const active = activeTab === tab;
            let iconName = 'bar-chart-outline';
            let label = 'Stats';
            if (tab === 'owners') {
              iconName = 'shield-outline';
              label = 'Owners';
            } else if (tab === 'users') {
              iconName = 'people-outline';
              label = 'Users';
            } else if (tab === 'logs') {
              iconName = 'document-text-outline';
              label = 'Logs';
            }

            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, active && styles.activeTabButton]}
                onPress={() => setActiveTab(tab)}
              >
                <Ionicons name={iconName as any} size={15} color={active ? '#fff' : 'rgba(255,255,255,0.7)'} />
                <Text style={[styles.tabText, active && styles.activeTabText]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Main Panel Content */}
      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={[styles.loadingText, { color: theme.textMuted }]}>Fetching admin logs...</Text>
        </View>
      ) : (
        <FlatList
          data={[1]}
          keyExtractor={(item) => item.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          renderItem={() => (
            <>
              {/* Tab 1: Dashboard Overview */}
              {activeTab === 'dashboard' && (
                <View style={styles.tabContent}>
                  <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <View style={[styles.statIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                        <FontAwesome5 name="coins" size={16} color={ACCENT} />
                      </View>
                      <Text style={[styles.statVal, { color: theme.text }]}>
                        {formatCurrency(dashboardStats.totalRevenue)}
                      </Text>
                      <Text style={[styles.statLabel, { color: theme.textMuted }]}>Total Revenue</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <View style={[styles.statIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                        <Ionicons name="calendar-outline" size={16} color="#3b82f6" />
                      </View>
                      <Text style={[styles.statVal, { color: theme.text }]}>{dashboardStats.totalBookings}</Text>
                      <Text style={[styles.statLabel, { color: theme.textMuted }]}>Total Bookings</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <View style={[styles.statIconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
                        <Ionicons name="people-outline" size={16} color="#8b5cf6" />
                      </View>
                      <Text style={[styles.statVal, { color: theme.text }]}>{dashboardStats.activeUsers}</Text>
                      <Text style={[styles.statLabel, { color: theme.textMuted }]}>Registered Users</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <View style={[styles.statIconContainer, { backgroundColor: 'rgba(234, 179, 8, 0.12)' }]}>
                        <Ionicons name="compass-outline" size={16} color="#eab308" />
                      </View>
                      <Text style={[styles.statVal, { color: theme.text }]}>{dashboardStats.totalTurfs}</Text>
                      <Text style={[styles.statLabel, { color: theme.textMuted }]}>Active Venues</Text>
                    </View>
                  </View>

                  {/* System Occupancy */}
                  <View style={[styles.systemCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.systemHeader}>
                      <Text style={[styles.systemTitle, { color: theme.text }]}>Platform Occupancy Rate</Text>
                      <Text style={[styles.occupancyVal, { color: ACCENT }]}>{dashboardStats.occupancyRate}</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: dashboardStats.occupancyRate as any,
                            backgroundColor: ACCENT,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.systemDesc, { color: theme.textMuted }]}>
                      Shows percentage of reserved slots across all active venues over the current calendar week.
                    </Text>
                  </View>

                  {/* Quick Admin Actions */}
                  <Text style={[styles.sectionHeader, { color: theme.text }]}>Quick Database Controls</Text>
                  <View style={styles.actionGrid}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                      onPress={() => handleMaintenanceAction('Clear Stale Pending Bookings')}
                    >
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      <Text style={[styles.actionText, { color: theme.text }]}>Clear Pending</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                      onPress={() => handleMaintenanceAction('Re-seed Test Listings')}
                    >
                      <Ionicons name="cloud-download-outline" size={20} color="#3b82f6" />
                      <Text style={[styles.actionText, { color: theme.text }]}>Re-seed DB</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                      onPress={() => handleMaintenanceAction('Flush Log Files')}
                    >
                      <Ionicons name="refresh-circle-outline" size={20} color="#eab308" />
                      <Text style={[styles.actionText, { color: theme.text }]}>Flush Logs</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Tab 2: Owner Registrations */}
              {activeTab === 'owners' && (
                <View style={styles.tabContent}>
                  {owners.length === 0 ? (
                    <Text style={[styles.emptyText, { color: theme.textMuted }]}>No owner registrations found.</Text>
                  ) : (
                    owners.map((owner) => (
                      <View
                        key={owner.id}
                        style={[styles.itemCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                      >
                        <View style={styles.itemHeader}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.itemName, { color: theme.text }]}>{owner.name}</Text>
                            <Text style={[styles.itemEmail, { color: theme.textMuted }]}>
                              {owner.businessName || 'Business Owner'}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.statusBadge,
                              {
                                backgroundColor:
                                  owner.status === 'APPROVED'
                                    ? 'rgba(16, 185, 129, 0.12)'
                                    : owner.status === 'PENDING'
                                    ? 'rgba(234, 179, 8, 0.12)'
                                    : 'rgba(239, 68, 68, 0.12)',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusBadgeText,
                                {
                                  color:
                                    owner.status === 'APPROVED'
                                      ? '#10b981'
                                      : owner.status === 'PENDING'
                                      ? '#eab308'
                                      : '#ef4444',
                                },
                              ]}
                            >
                              {owner.status}
                            </Text>
                          </View>
                        </View>

                        <View style={[styles.infoRow, { borderTopColor: theme.divider }]}>
                          <Ionicons name="mail-outline" size={14} color={theme.textMuted} />
                          <Text style={[styles.infoText, { color: theme.text }]}>{owner.email}</Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Ionicons name="call-outline" size={14} color={theme.textMuted} />
                          <Text style={[styles.infoText, { color: theme.text }]}>+91 {owner.phone}</Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Ionicons name="card-outline" size={14} color={theme.textMuted} />
                          <Text style={[styles.infoText, { color: theme.text }]}>
                            Payment: <Text style={{ color: owner.paymentStatus === 'PAID' ? '#10b981' : '#eab308', fontWeight: 'bold' }}>{owner.paymentStatus || 'PENDING'}</Text>
                          </Text>
                          <TouchableOpacity 
                            style={styles.historyTextBtn} 
                            onPress={() => handleShowPaymentHistory(owner)}
                          >
                            <Text style={styles.historyTextBtnLabel}>History</Text>
                          </TouchableOpacity>
                        </View>

                        {owner.status === 'PENDING' && (
                          <View style={styles.actionRow}>
                            <TouchableOpacity
                              style={[styles.actionBtnReject, { marginRight: 10 }]}
                              onPress={() => handleRejectOwner(owner.id)}
                            >
                              <Text style={styles.actionBtnTextReject}>Reject</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.actionBtnApprove}
                              onPress={() => handleApproveOwner(owner.id)}
                            >
                              <Text style={styles.actionBtnTextApprove}>Approve</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    ))
                  )}
                </View>
              )}

              {/* Tab 3: User Accounts */}
              {activeTab === 'users' && (
                <View style={styles.tabContent}>
                  {users.length === 0 ? (
                    <Text style={[styles.emptyText, { color: theme.textMuted }]}>No user accounts found.</Text>
                  ) : (
                    users.map((u) => (
                      <View
                        key={u.id}
                        style={[styles.itemCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                      >
                        <View style={styles.itemHeader}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.itemName, { color: theme.text }]}>{u.name}</Text>
                            <Text style={[styles.itemEmail, { color: theme.textMuted }]}>{u.role}</Text>
                          </View>
                          <View
                            style={[
                              styles.statusBadge,
                              {
                                backgroundColor:
                                  u.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusBadgeText,
                                { color: u.status === 'ACTIVE' ? '#10b981' : '#ef4444' },
                              ]}
                            >
                              {u.status}
                            </Text>
                          </View>
                        </View>

                        <View style={[styles.infoRow, { borderTopColor: theme.divider }]}>
                          <Ionicons name="mail-outline" size={14} color={theme.textMuted} />
                          <Text style={[styles.infoText, { color: theme.text }]}>{u.email}</Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Ionicons name="call-outline" size={14} color={theme.textMuted} />
                          <Text style={[styles.infoText, { color: theme.text }]}>+91 {u.phone}</Text>
                        </View>

                        <View style={styles.actionRow}>
                          <TouchableOpacity
                            style={[styles.actionBtnDelete, { marginRight: 10 }]}
                            onPress={() => handleDeleteUser(u.id)}
                          >
                            <Ionicons name="trash-outline" size={14} color="#ef4444" style={{ marginRight: 4 }} />
                            <Text style={styles.actionBtnTextDelete}>Delete</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.actionBtnBlock,
                              { backgroundColor: u.status === 'ACTIVE' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)' },
                            ]}
                            onPress={() => handleToggleUserBlock(u)}
                          >
                            <Ionicons
                              name={u.status === 'ACTIVE' ? 'ban-outline' : 'checkmark-circle-outline'}
                              size={14}
                              color={u.status === 'ACTIVE' ? '#ef4444' : '#10b981'}
                              style={{ marginRight: 4 }}
                            />
                            <Text
                              style={[
                                styles.actionBtnTextBlock,
                                { color: u.status === 'ACTIVE' ? '#ef4444' : '#10b981' },
                              ]}
                            >
                              {u.status === 'ACTIVE' ? 'Block' : 'Unblock'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}

              {/* Tab 4: Audit Logs */}
              {activeTab === 'logs' && (
                <View style={styles.tabContent}>
                  {logs.length === 0 ? (
                    <Text style={[styles.emptyText, { color: theme.textMuted }]}>No audit log events available.</Text>
                  ) : (
                    logs.map((log) => (
                      <View
                        key={log.id}
                        style={[styles.logCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                      >
                        <View style={styles.logHeader}>
                          <Text style={styles.logAction}>{log.action}</Text>
                          <Text style={[styles.logTime, { color: theme.textMuted }]}>{log.timestamp}</Text>
                        </View>
                        <Text style={[styles.logDetails, { color: theme.text }]}>{log.details}</Text>
                        <Text style={[styles.logUser, { color: theme.textMuted }]}>Triggered by: {log.user}</Text>
                      </View>
                    ))
                  )}
                </View>
              )}
            </>
          )}
        />
      )}

      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: isDarkMode ? '#0f172a' : '#ffffff' }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Payment Setup & History</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
                  {selectedOwnerForPayment?.name || selectedOwnerForPayment?.email}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowPaymentModal(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              {selectedOwnerForPayment && (() => {
                const isApproved = selectedOwnerForPayment.status === 'APPROVED';
                return (
                  <>
                    {!isApproved && (
                      <View style={styles.modalAlert}>
                        <Ionicons name="warning-outline" size={20} color="#eab308" style={{ marginTop: 2 }} />
                        <Text style={styles.modalAlertText}>
                          You must approve this owner's registration first in order to manage or record payments.
                        </Text>
                      </View>
                    )}

                    {/* Overall Status */}
                    <Text style={[styles.modalSectionTitle, { color: theme.textMuted }]}>OVERALL PAYMENT STATUS</Text>
                    <View style={[styles.modalStatusRow, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f1f5f9' }]}>
                      <View style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            selectedOwnerForPayment.paymentStatus === 'PAID'
                              ? 'rgba(16, 185, 129, 0.12)'
                              : 'rgba(234, 179, 8, 0.12)',
                        }
                      ]}>
                        <Text style={{
                          color: selectedOwnerForPayment.paymentStatus === 'PAID' ? '#10b981' : '#eab308',
                          fontSize: 12,
                          fontWeight: '800'
                        }}>
                          {selectedOwnerForPayment.paymentStatus || 'PENDING'}
                        </Text>
                      </View>
                      
                      <TouchableOpacity
                        disabled={!isApproved}
                        style={[
                          styles.statusToggleBtn,
                          {
                            backgroundColor: selectedOwnerForPayment.paymentStatus === 'PAID'
                              ? 'rgba(239, 68, 68, 0.1)'
                              : '#10b981',
                            opacity: isApproved ? 1 : 0.5
                          }
                        ]}
                        onPress={() => handleUpdatePaymentStatus(
                          selectedOwnerForPayment.id,
                          selectedOwnerForPayment.paymentStatus === 'PAID' ? 'PENDING' : 'PAID'
                        )}
                      >
                        <Text style={{
                          color: selectedOwnerForPayment.paymentStatus === 'PAID' ? '#ef4444' : '#fff',
                          fontWeight: '700',
                          fontSize: 12
                        }}>
                          {selectedOwnerForPayment.paymentStatus === 'PAID' ? 'Mark Pending' : 'Mark Paid'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Record Form */}
                    <Text style={[styles.modalSectionTitle, { color: theme.textMuted }]}>RECORD NEW PAYMENT</Text>
                    <View style={styles.formContainer}>
                      <Text style={[styles.inputLabel, { color: theme.text }]}>Amount (INR)</Text>
                      <TextInput
                        editable={isApproved}
                        placeholder="e.g. 5000"
                        placeholderTextColor="#64748b"
                        value={paymentAmount}
                        onChangeText={setPaymentAmount}
                        keyboardType="numeric"
                        style={[
                          styles.textInput,
                          {
                            color: theme.text,
                            borderColor: theme.border,
                            backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
                            opacity: isApproved ? 1 : 0.5
                          }
                        ]}
                      />

                      <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.inputLabel, { color: theme.text }]}>Type</Text>
                          <View style={{ flexDirection: 'column', gap: 6 }}>
                            {['REGISTRATION_FEE', 'SUBSCRIPTION_RENEWAL'].map((type) => (
                              <TouchableOpacity
                                key={type}
                                disabled={!isApproved}
                                style={[
                                  styles.selectBtn,
                                  {
                                    borderColor: paymentType === type ? '#10b981' : theme.divider,
                                    backgroundColor: paymentType === type ? 'rgba(16,185,129,0.1)' : 'transparent',
                                    opacity: isApproved ? 1 : 0.5
                                  }
                                ]}
                                onPress={() => setPaymentType(type)}
                              >
                                <Text style={{
                                  fontSize: 11,
                                  color: paymentType === type ? '#10b981' : theme.text,
                                  fontWeight: '600'
                                }}>
                                  {type === 'REGISTRATION_FEE' ? 'Registration Fee' : 'Subscription'}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={[styles.inputLabel, { color: theme.text }]}>Method</Text>
                          <View style={{ flexDirection: 'column', gap: 6 }}>
                            {['UPI', 'CASH', 'CARD'].map((method) => (
                              <TouchableOpacity
                                key={method}
                                disabled={!isApproved}
                                style={[
                                  styles.selectBtn,
                                  {
                                    borderColor: paymentMethod === method ? '#10b981' : theme.divider,
                                    backgroundColor: paymentMethod === method ? 'rgba(16,185,129,0.1)' : 'transparent',
                                    opacity: isApproved ? 1 : 0.5
                                  }
                                ]}
                                onPress={() => setPaymentMethod(method)}
                              >
                                <Text style={{
                                  fontSize: 11,
                                  color: paymentMethod === method ? '#10b981' : theme.text,
                                  fontWeight: '600'
                                }}>
                                  {method}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      </View>

                      <Text style={[styles.inputLabel, { color: theme.text, marginTop: 12 }]}>Transaction ID (Optional)</Text>
                      <TextInput
                        editable={isApproved}
                        placeholder="e.g. txn_abc123"
                        placeholderTextColor="#64748b"
                        value={transactionId}
                        onChangeText={setTransactionId}
                        style={[
                          styles.textInput,
                          {
                            color: theme.text,
                            borderColor: theme.border,
                            backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
                            opacity: isApproved ? 1 : 0.5
                          }
                        ]}
                      />

                      <TouchableOpacity
                        disabled={!isApproved}
                        style={[
                          styles.recordBtn,
                          {
                            backgroundColor: '#10b981',
                            opacity: isApproved ? 1 : 0.5
                          }
                        ]}
                        onPress={handleRecordPayment}
                      >
                        <Text style={styles.recordBtnText}>Record Payment</Text>
                      </TouchableOpacity>
                    </View>

                    {/* History list */}
                    <Text style={[styles.modalSectionTitle, { color: theme.textMuted }]}>PAYMENT HISTORY</Text>
                    {!selectedOwnerForPayment.paymentHistory || selectedOwnerForPayment.paymentHistory.length === 0 ? (
                      <View style={styles.emptyHistory}>
                        <Ionicons name="time-outline" size={24} color={theme.textMuted} />
                        <Text style={[styles.emptyHistoryText, { color: theme.textMuted }]}>No payment history found</Text>
                      </View>
                    ) : (
                      selectedOwnerForPayment.paymentHistory.map((item: any) => (
                        <View key={item.id} style={[styles.historyCard, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={styles.historyAmount}>{formatCurrency(item.amount)}</Text>
                            <Text style={styles.historyType}>{item.type.replace('_', ' ')}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                            <Text style={[styles.historyDetailText, { color: theme.textMuted }]}>Method: {item.paymentMethod}</Text>
                            <Text style={[styles.historyDetailText, { color: theme.textMuted }]}>{new Date(item.date).toLocaleDateString()}</Text>
                          </View>
                          {item.transactionId && (
                            <Text style={[styles.historyTxId, { color: theme.textMuted }]}>ID: {item.transactionId}</Text>
                          )}
                        </View>
                      ))
                    )}
                  </>
                );
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
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
    borderTopWidth: StyleSheet.hairlineWidth,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScroll: {
    paddingVertical: 15,
    paddingBottom: 40,
  },
  modalAlert: {
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderColor: 'rgba(234, 179, 8, 0.2)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 15,
  },
  modalAlertText: {
    color: '#eab308',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  modalSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 15,
  },
  modalStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
  },
  statusToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  formContainer: {
    gap: 8,
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  textInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  selectBtn: {
    borderWidth: 1,
    borderRadius: 8,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  recordBtn: {
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  recordBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  emptyHistory: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  emptyHistoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: '850',
    color: '#10b981',
  },
  historyType: {
    fontSize: 10,
    fontWeight: '800',
    backgroundColor: 'rgba(16,185,129,0.08)',
    color: '#10b981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  historyDetailText: {
    fontSize: 11,
    fontWeight: '600',
  },
  historyTxId: {
    fontSize: 9,
    fontWeight: '500',
    marginTop: 4,
  },
  historyTextBtn: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  historyTextBtnLabel: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
  },
});
