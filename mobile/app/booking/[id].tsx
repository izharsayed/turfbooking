import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useBookingStore, type Booking } from '../../store/bookingStore';
import { useThemeStore } from '../../store/themeStore';
import { getTurfById } from '../../data/turfs';
import { formatCurrency } from '../../utils';
import { apiFetch } from '../../utils/api';

const { width } = Dimensions.get('window');

export default function BookingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const getBookingById = useBookingStore((s) => s.getBookingById);
  const cancelBooking = useBookingStore((s) => s.cancelBooking);
  const [booking, setBooking] = useState<Booking | undefined>(getBookingById(id));
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const { isDarkMode } = useThemeStore();

  const theme = {
    bg: isDarkMode ? '#030712' : '#f8fafc',
    card: isDarkMode ? 'rgba(15, 23, 42, 0.75)' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#e2e8f0',
    bgImageOpacity: isDarkMode ? 0.35 : 0.22,
    overlayBg: isDarkMode ? 'rgba(3, 7, 18, 0.5)' : 'rgba(248, 250, 252, 0.6)',
  };

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!id) return;
      setLoadingBooking(true);
      try {
        const res = await apiFetch(`/bookings/${id}`);
        if (res.success && res.data) {
          const b = res.data;
          setBooking({
            id: b.id,
            turfId: b.turfId,
            turfName: b.turfName,
            area: b.area,
            date: b.date,
            time: b.time,
            amount: b.amount,
            status: b.status === 'active' ? 'UPCOMING' : b.status === 'completed' ? 'COMPLETED' : 'CANCELLED',
          });
        }
      } catch (err) {
        console.log('Failed to fetch booking details from backend, using store fallback', err);
      } finally {
        setLoadingBooking(false);
      }
    };
    fetchBookingDetails();
  }, [id]);

  if (loadingBooking && !booking) {
    return (
      <View style={[styles.notFound, { backgroundColor: theme.bg, justifyContent: 'center' }]}>
        <Stack.Screen options={{ title: 'Loading...', headerShown: true }} />
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={[styles.notFound, { backgroundColor: theme.bg }]}>
        <Stack.Screen options={{ title: 'Booking Not Found', headerShown: true }} />
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={[styles.notFoundText, { color: theme.text }]}>Booking not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')}>
          <Text style={styles.backButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const turf = getBookingById(id) ? getTurfById(booking.turfId) : undefined;

  const handleCancel = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? A refund will be credited back to your account.',
      [
        { text: 'No, Keep It', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              // Cancel on backend first
              await apiFetch(`/bookings/${booking.id}`, { method: 'DELETE' });
            } catch (err: any) {
              // If booking isn't found on backend (e.g. dev/mock booking), continue with local cancel
              if (err?.statusCode !== 404) {
                setCancelling(false);
                Alert.alert('Cancellation Failed', err.message || 'Could not cancel booking. Please try again.');
                return;
              }
            }
            // Update local store
            cancelBooking(booking.id);
            setBooking((prev) => prev ? { ...prev, status: 'CANCELLED' } : prev);
            setCancelling(false);
            Alert.alert('Booking Cancelled', 'Your booking has been cancelled and a refund has been initiated.');
          },
        },
      ]
    );
  };

  // Format date display (e.g. Wednesday, Jul 8, 2026)
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const isCancelled = booking.status === 'CANCELLED';

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Image
        source={require('../../assets/turf-bg.jpg')}
        style={[styles.backgroundImage, { opacity: theme.bgImageOpacity }]}
        resizeMode="cover"
      />
      <View style={[styles.overlay, { backgroundColor: theme.overlayBg }]} />

      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Your Ticket',
          headerTransparent: true,
          headerTintColor: theme.text,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.replace('/')} style={styles.headerBackBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Confirmed Banner */}
        <View style={styles.headerBanner}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: isCancelled ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                borderColor: isCancelled ? '#ef4444' : '#10b981',
              },
            ]}
          >
            <Ionicons
              name={isCancelled ? 'close' : 'checkmark-circle'}
              size={36}
              color={isCancelled ? '#ef4444' : '#10b981'}
            />
          </View>
          <Text style={[styles.successTitle, { color: theme.text }]}>
            {isCancelled ? 'Booking Cancelled' : 'Booking Confirmed!'}
          </Text>
          <Text style={[styles.successSubtitle, { color: theme.textMuted }]}>
            {isCancelled
              ? 'This booking is cancelled. Feel free to book another slot.'
              : 'Show this ticket at the turf counter to start your session.'}
          </Text>
        </View>

        {/* Ticket Boarding Pass */}
        <View style={[styles.ticketCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Top Section: Info */}
          <View style={styles.ticketTop}>
            <View style={styles.ticketRow}>
              <View>
                <Text style={styles.ticketLabel}>BOOKING ID</Text>
                <Text style={[styles.ticketValue, { color: theme.text }]}>{booking.id}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: isCancelled ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)' }]}>
                <Text style={[styles.statusBadgeText, { color: isCancelled ? '#ef4444' : '#10b981' }]}>
                  {booking.status}
                </Text>
              </View>
            </View>

            <View style={styles.separatorThin} />

            <Text style={styles.ticketLabel}>VENUE</Text>
            <Text style={[styles.ticketVenueName, { color: theme.text }]}>{booking.turfName}</Text>
            <Text style={[styles.ticketVenueArea, { color: theme.textMuted }]}>📍 {booking.area}</Text>

            <View style={styles.separatorThin} />

            <View style={styles.ticketGrid}>
              <View style={styles.gridCol}>
                <Text style={styles.ticketLabel}>DATE</Text>
                <Text style={[styles.gridValue, { color: theme.text }]}>{formatDate(booking.date)}</Text>
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.ticketLabel}>TIME SLOT</Text>
                <Text style={[styles.gridValue, { color: theme.text }]}>{booking.time}</Text>
              </View>
            </View>

            <View style={styles.ticketGrid}>
              <View style={styles.gridCol}>
                <Text style={styles.ticketLabel}>SPORT</Text>
                <Text style={[styles.gridValue, { color: theme.text }]}>
                  {turf ? turf.sport : 'Sports'}
                </Text>
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.ticketLabel}>PRICE</Text>
                <Text style={[styles.gridValue, { color: theme.text, fontWeight: 'bold' }]}>
                  {formatCurrency(booking.amount)}
                </Text>
              </View>
            </View>
          </View>

          {/* Ticket Dashed Divider Line */}
          <View style={styles.dashedDividerWrapper}>
            <View style={[styles.ticketSideCutout, styles.cutoutLeft, { backgroundColor: theme.bg }]} />
            <View style={styles.dashedLine} />
            <View style={[styles.ticketSideCutout, styles.cutoutRight, { backgroundColor: theme.bg }]} />
          </View>

          {/* Bottom Section: Scan QR Code */}
          <View style={styles.ticketBottom}>
            {isCancelled ? (
              <View style={styles.cancelledOverlay}>
                <Ionicons name="ban" size={60} color="rgba(239, 68, 68, 0.4)" />
                <Text style={styles.cancelledText}>TICKET VOID</Text>
              </View>
            ) : (
              <View style={styles.qrContainer}>
                <MaterialCommunityIcons name="qrcode" size={130} color={isDarkMode ? '#ffffff' : '#020617'} />
                <Text style={[styles.scanInstruction, { color: theme.textMuted }]}>
                  Scan QR code at the turf entry gate
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/')}>
            <Text style={styles.homeBtnText}>Back to Explore</Text>
          </TouchableOpacity>

          {!isCancelled && (
            <TouchableOpacity
              style={[styles.cancelBtn, cancelling && { opacity: 0.6 }]}
              onPress={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <Text style={styles.cancelBtnText}>Cancel Booking</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    zIndex: -2,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  headerBackBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginLeft: 10,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 120 : 100,
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  notFoundText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#020617',
    fontWeight: 'bold',
    fontSize: 14,
  },
  headerBanner: {
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  ticketCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
    marginBottom: 24,
  },
  ticketTop: {
    padding: 20,
  },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  ticketValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  separatorThin: {
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    marginVertical: 12,
  },
  ticketVenueName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  ticketVenueArea: {
    fontSize: 12,
  },
  ticketGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridCol: {
    flex: 1,
  },
  gridValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  dashedDividerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
    width: '100%',
    position: 'relative',
  },
  ticketSideCutout: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
    zIndex: 2,
  },
  cutoutLeft: {
    left: -10,
  },
  cutoutRight: {
    right: -10,
  },
  dashedLine: {
    width: '90%',
    height: 1.5,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  ticketBottom: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelledOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  cancelledText: {
    color: '#ef4444',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 1.5,
  },
  qrContainer: {
    alignItems: 'center',
    gap: 12,
  },
  scanInstruction: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  homeBtn: {
    backgroundColor: '#10b981',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  homeBtnText: {
    color: '#020617',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cancelBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
