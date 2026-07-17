import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useNavigation, Redirect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { apiFetch } from '../../utils/api';

const ACCENT = '#10b981';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Transaction {
  id: string;
  customerName: string;
  turfName: string;
  amount: number;
  date: string;
  method: string;
  status: string;
  refId: string;
}

export default function OwnerPaymentsScreen() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const navigation = useNavigation() as any;
  const { isDarkMode } = useThemeStore();
  const insets = useSafeAreaInsets();

  if (!isAuthenticated || !user) return <Redirect href="/login" />;
  if (user.role !== 'TURF_OWNER') return <Redirect href="/owner" />;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Real stats & Balances state
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [thisMonthEarnings, setThisMonthEarnings] = useState(0);
  const [pendingClearances, setPendingClearances] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const fetchPaymentsData = async () => {
    try {
      // 1. Fetch bookings list (includes customer names, turf names, final amounts)
      const bookingsRes = await apiFetch('/owner/bookings');
      // 2. Fetch dashboard stats (contains calculated revenue sums from the backend)
      const statsRes = await apiFetch('/owner/dashboard');
      
      let allBookings: any[] = [];
      if (bookingsRes.success && bookingsRes.data) {
        allBookings = bookingsRes.data;
      }

      // Calculate stats locally as a fallback
      let calculatedTotal = 0;
      let calculatedMonth = 0;
      let calculatedPending = 0;

      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth(); // 0-indexed

      const mappedTxns: Transaction[] = allBookings.map((b: any) => {
        let isThisMonth = false;
        try {
          if (b.date) {
            const dateParts = b.date.split('-');
            const bYear = parseInt(dateParts[0], 10);
            const bMonth = parseInt(dateParts[1], 10) - 1; // 0-indexed
            if (bYear === currentYear && bMonth === currentMonth) {
              isThisMonth = true;
            }
          }
        } catch (e) {}

        const bAmount = Number(b.amount) || 0;
        const isPaid = b.status === 'CONFIRMED' || b.status === 'COMPLETED';

        if (isPaid) {
          calculatedTotal += bAmount;
          if (isThisMonth) {
            calculatedMonth += bAmount;
          }
        } else if (b.status === 'PENDING') {
          calculatedPending += bAmount;
        }

        return {
          id: b.id,
          customerName: b.customerName || 'Customer',
          turfName: b.turfName || 'Arena',
          amount: bAmount,
          date: b.date ? `${b.date} • ${b.time}` : `${b.time}`,
          method: b.transactionId ? 'Online Payment' : 'Offline Entry',
          status: isPaid ? 'Settled' : b.status === 'CANCELLED' ? 'Cancelled' : 'Pending',
          refId: b.transactionId || 'Offline Entry',
        };
      });

      // Prefer backend calculated stats if available, otherwise use local sum
      if (statsRes.success && statsRes.data) {
        setTotalEarnings(statsRes.data.totalRevenue ?? calculatedTotal);
        setThisMonthEarnings(statsRes.data.monthlyRevenue ?? calculatedMonth);
      } else {
        setTotalEarnings(calculatedTotal);
        setThisMonthEarnings(calculatedMonth);
      }
      
      setPendingClearances(calculatedPending);
      setTransactions(mappedTxns);
    } catch (err) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPaymentsData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPaymentsData();
  };

  const theme = {
    bg: isDarkMode ? '#030712' : '#f1f5f9',
    card: isDarkMode ? '#0f172a' : '#ffffff',
    cardBorder: isDarkMode ? '#1e293b' : '#e2e8f0',
    text: isDarkMode ? '#ffffff' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    divider: isDarkMode ? '#1e293b' : '#e2e8f0',
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('index')}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Payments & Payouts</Text>
        <TouchableOpacity style={styles.helpBtn} onPress={fetchPaymentsData}>
          <Ionicons name="refresh" size={22} color={ACCENT} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />
        }
      >
        {/* Earnings Card */}
        <View style={[styles.balanceCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={styles.balanceLabel}>TOTAL REVENUE</Text>
          <Text style={styles.balanceValue}>₹{totalEarnings.toLocaleString('en-IN')}</Text>

          <View style={styles.payoutTargetRow}>
            <Ionicons name="checkmark-circle" size={16} color={ACCENT} />
            <Text style={[styles.payoutTargetText, { color: theme.textMuted }]}>
              All payouts settled directly to Bank Account (**** 4829)
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={styles.statLabel}>This Month</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>₹{thisMonthEarnings.toLocaleString('en-IN')}</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={styles.statLabel}>Pending Clearances</Text>
            <Text style={[styles.statValue, { color: '#eab308' }]}>₹{pendingClearances.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* Payout Bank Info */}
        <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.infoTitleRow}>
            <MaterialCommunityIcons name="bank-outline" size={20} color={ACCENT} />
            <Text style={[styles.infoTitle, { color: theme.text }]}>Registered Payout Profile</Text>
          </View>
          <Text style={[styles.bankName, { color: theme.text }]}>HDFC BANK LTD</Text>
          <Text style={[styles.bankDetails, { color: theme.textMuted }]}>Account Number: *******4829</Text>
          <Text style={[styles.bankDetails, { color: theme.textMuted }]}>IFS Code: HDFC0000072</Text>
          <Text style={[styles.bankDetails, { color: theme.textMuted }]}>Primary UPI ID: owner@upi (Verified)</Text>
        </View>

        {/* Transactions List */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Transactions</Text>
          <TouchableOpacity onPress={fetchPaymentsData}>
            <Text style={styles.filterLink}>Sync Data</Text>
          </TouchableOpacity>
        </View>

        {transactions.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Ionicons name="card-outline" size={32} color={theme.textMuted} style={{ marginBottom: 8 }} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>No transactions recorded yet.</Text>
          </View>
        ) : (
          transactions.map((txn, index) => (
            <View 
              key={txn.id} 
              style={[
                styles.txnCard, 
                { backgroundColor: theme.card, borderColor: theme.cardBorder },
                index === transactions.length - 1 && { marginBottom: 30 }
              ]}
            >
              <View style={styles.txnTop}>
                <View style={styles.txnLeft}>
                  <Text style={[styles.txnCustomer, { color: theme.text }]}>{txn.customerName}</Text>
                  <Text style={[styles.txnTurf, { color: theme.textMuted }]}>{txn.turfName}</Text>
                </View>
                <Text style={styles.txnAmount}>+₹{txn.amount}</Text>
              </View>
              
              <View style={[styles.txnDivider, { backgroundColor: theme.divider }]} />
              
              <View style={styles.txnBottom}>
                <Text style={[styles.txnMeta, { color: theme.textMuted }]}>
                  {txn.date} • {txn.method}
                </Text>
                <View style={[
                  styles.statusBadge, 
                  txn.status === 'Settled' ? styles.statusBadgeSettled : txn.status === 'Pending' ? styles.statusBadgePending : styles.statusBadgeCancelled
                ]}>
                  <View style={[
                    styles.statusDot, 
                    txn.status === 'Settled' ? styles.statusDotSettled : txn.status === 'Pending' ? styles.statusDotPending : styles.statusDotCancelled
                  ]} />
                  <Text style={[
                    styles.statusText, 
                    txn.status === 'Settled' ? styles.statusTextSettled : txn.status === 'Pending' ? styles.statusTextPending : styles.statusTextCancelled
                  ]}>
                    {txn.status}
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
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  helpBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  balanceCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 34,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 16,
  },
  payoutTargetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  payoutTargetText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  infoCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  bankName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  bankDetails: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  filterLink: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyState: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
  },
  txnCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  txnTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txnLeft: {
    flex: 1,
  },
  txnCustomer: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  txnTurf: {
    fontSize: 13,
    fontWeight: '600',
  },
  txnAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#10b981',
  },
  txnDivider: {
    height: 1,
    marginVertical: 10,
  },
  txnBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txnMeta: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  statusBadgeSettled: {
    backgroundColor: 'rgba(16,185,129,0.08)',
  },
  statusBadgePending: {
    backgroundColor: 'rgba(234,179,8,0.08)',
  },
  statusBadgeCancelled: {
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotSettled: {
    backgroundColor: '#10b981',
  },
  statusDotPending: {
    backgroundColor: '#eab308',
  },
  statusDotCancelled: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextSettled: {
    color: '#10b981',
  },
  statusTextPending: {
    color: '#eab308',
  },
  statusTextCancelled: {
    color: '#ef4444',
  },
});
