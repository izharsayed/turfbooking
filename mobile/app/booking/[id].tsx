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
  TextInput,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { Modal } from 'react-native';
import { useBookingStore, type Booking } from '../../store/bookingStore';
import { useThemeStore } from '../../store/themeStore';
import { formatCurrency, getBookingStatus } from '../../utils';
import { apiFetch } from '../../utils/api';
import QRCode from 'react-native-qrcode-svg';

const { width } = Dimensions.get('window');

export default function BookingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const getBookingById = useBookingStore((s) => s.getBookingById);
  const cancelBooking = useBookingStore((s) => s.cancelBooking);
  const [booking, setBooking] = useState<Booking | undefined>(getBookingById(id));
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const rescheduleBooking = useBookingStore((s) => s.rescheduleBooking);

  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [turfBookings, setTurfBookings] = useState<any[]>([]);
  const [rescheduling, setRescheduling] = useState(false);

  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of plans');
  const [cancelComments, setCancelComments] = useState('');

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
            totalAmount: b.totalAmount,
            paidAmount: b.paidAmount,
            pendingAmount: b.pendingAmount,
            transactionId: b.transactionId,
            customerName: b.customerName,
            customerPhone: b.customerPhone,
            status: b.status === 'active' ? 'UPCOMING' : b.status === 'completed' ? 'COMPLETED' : 'CANCELLED',
          });
        }
      } catch (err) {
      } finally {
        setLoadingBooking(false);
      }
    };
    fetchBookingDetails();
  }, [id]);

  const openRescheduleModal = async () => {
    if (!booking) return;
    setLoadingSlots(true);
    setRescheduleModalVisible(true);
    // Default reschedule date is tomorrow (to avoid current time slots conflict for today)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDate = tomorrow.toISOString().split('T')[0];
    setRescheduleDate(defaultDate);
    setRescheduleTime('');

    try {
      const res = await apiFetch(`/turfs/${booking.turfId}/bookings`);
      if (res.success && Array.isArray(res.data)) {
        setTurfBookings(res.data);
      }
    } catch (err) {
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!booking || !rescheduleDate || !rescheduleTime) return;
    setRescheduling(true);
    try {
      const res = await apiFetch(`/bookings/${booking.id}/reschedule`, {
        method: 'PUT',
        body: {
          date: rescheduleDate,
          time: rescheduleTime,
        },
      });

      if (res.success) {
        rescheduleBooking(booking.id, rescheduleDate, rescheduleTime);
        setBooking((prev) => prev ? { ...prev, date: rescheduleDate, time: rescheduleTime } : prev);
        setRescheduleModalVisible(false);
        Alert.alert('Booking Rescheduled', 'Your reservation was rescheduled successfully!');
      } else {
        Alert.alert('Reschedule Failed', res.message || 'Could not reschedule booking.');
      }
    } catch (err: any) {
      Alert.alert('Reschedule Failed', err.message || 'Could not reschedule booking. Please try again.');
    } finally {
      setRescheduling(false);
    }
  };

  // 7-day date options
  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      isoString: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
    };
  });

  const generated24Slots = Array.from({ length: 24 }, (_, i) => {
    const startHour = (i + 12) % 24;
    const endHour = (startHour + 1) % 24;
    const startStr = `${startHour.toString().padStart(2, '0')}:00`;
    const endStr = `${endHour.toString().padStart(2, '0')}:00`;
    return `${startStr} - ${endStr}`;
  });

  const normalizeSlot = (timeSlotStr: string): string => {
    if (!timeSlotStr) return '';
    const parts = timeSlotStr.split(' - ').map(s => s.trim());
    if (parts.length !== 2) return timeSlotStr;
    const [start, end] = parts;
    const [sH, sM] = start.split(':');
    const [eH, eM] = end.split(':');
    return `${sH.padStart(2, '0')}:${sM || '00'} - ${eH.padStart(2, '0')}:${eM || '00'}`;
  };

  const isSlotBooked = (slotTime: string) => {
    const targetNorm = normalizeSlot(slotTime);
    return turfBookings.some((res: any) => {
      if (res.id === id) return false;
      
      let bDate = '';
      if (res.date) {
        bDate = res.date.split('T')[0];
      } else if (res.bookingDate) {
        try {
          bDate = new Date(res.bookingDate).toISOString().split('T')[0];
        } catch (e) {}
      }

      if (bDate !== rescheduleDate) return false;

      const slotVal = res.time || res.timeSlot || res.slotId || '';
      const dbSlots = slotVal.split(',').map((s: string) => s.trim());
      return dbSlots.some((dbSlot: string) => dbSlot && normalizeSlot(dbSlot) === targetNorm);
    });
  };

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

  const turfSport = (booking as any).sport || 'Sports';

  const handleCancel = () => {
    setCancelReason('Change of plans');
    setCancelComments('');
    setCancelModalVisible(true);
  };

  const handleCancelSubmit = async () => {
    if (!booking) return;
    const finalReason = cancelReason === 'Other'
      ? (cancelComments.trim() || 'Other reasons')
      : cancelReason;

    setCancelling(true);
    try {
      // Cancel on backend first (sending reason in body)
      await apiFetch(`/bookings/${booking.id}`, {
        method: 'DELETE',
        body: { reason: finalReason },
      });
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
    setCancelModalVisible(false);
    Alert.alert('Booking Cancelled', 'Your booking has been cancelled and a 100% refund has been initiated.');
  };

  const cancellationReasons = [
    'Change of plans',
    'Weather issues',
    'Booked by mistake',
    'Emergency',
    'Other',
  ];

  const getCanCancel = () => {
    if (!booking) return false;
    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') return false;

    try {
      const dateStr = booking.date; // YYYY-MM-DD
      const timeSlotStr = booking.time; // HH:MM - HH:MM
      if (!dateStr || !timeSlotStr) return false;

      const startPart = timeSlotStr.split('-')[0].trim();
      const [hPart, mPart] = startPart.split(':');
      const hr = parseInt(hPart, 10);
      const mn = parseInt(mPart || '0', 10);

      const [year, month, day] = dateStr.split('-').map(Number);
      const slotStart = new Date(year, month - 1, day, hr, mn, 0, 0);

      const diffHours = (slotStart.getTime() - new Date().getTime()) / (1000 * 60 * 60);
      return diffHours >= 3;
    } catch {
      return false;
    }
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

  const visualStatus = getBookingStatus(booking.status, booking.date, booking.time);
  const isCancelled = visualStatus === 'CANCELLED';
  const isCompleted = visualStatus === 'COMPLETED';

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Image
        source={require('../../assets/turf-bg.jpg')}
        style={[styles.backgroundImage, { opacity: theme.bgImageOpacity }]}
        resizeMode="cover"
      />
      <View style={[styles.overlay, { backgroundColor: theme.overlayBg }]} />

      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header Bar */}
      <View style={[styles.customHeader, { paddingTop: Platform.OS === 'ios' ? 50 : 35 }]}>
        <TouchableOpacity 
          onPress={() => router.replace('/')} 
          style={styles.customHeaderBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.customHeaderTitle, { color: theme.text }]}>Your Ticket</Text>
        <View style={styles.customHeaderRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Confirmed Banner */}
        <View style={styles.headerBanner}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: isCancelled 
                  ? 'rgba(239, 68, 68, 0.12)' 
                  : isCompleted 
                  ? 'rgba(59, 130, 246, 0.12)' 
                  : 'rgba(16, 185, 129, 0.12)',
                borderColor: isCancelled ? '#ef4444' : isCompleted ? '#3b82f6' : '#10b981',
              },
            ]}
          >
            <Ionicons
              name={isCancelled ? 'close' : 'checkmark-circle'}
              size={36}
              color={isCancelled ? '#ef4444' : isCompleted ? '#3b82f6' : '#10b981'}
            />
          </View>
          <Text style={[styles.successTitle, { color: theme.text }]}>
            {isCancelled ? 'Booking Cancelled' : isCompleted ? 'Booking Completed' : 'Booking Confirmed!'}
          </Text>
          <Text style={[styles.successSubtitle, { color: theme.textMuted }]}>
            {isCancelled
              ? 'This booking is cancelled. Feel free to book another slot.'
              : isCompleted
              ? 'This booking is completed. We hope you had a great game!'
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
              <View style={[styles.statusBadge, { backgroundColor: isCancelled ? 'rgba(239, 68, 68, 0.15)' : isCompleted ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)' }]}>
                <Text style={[styles.statusBadgeText, { color: isCancelled ? '#ef4444' : isCompleted ? '#3b82f6' : '#10b981' }]}>
                  {visualStatus}
                </Text>
              </View>
            </View>

            <View style={styles.separatorThin} />

            <Text style={styles.ticketLabel}>VENUE</Text>
            <Text style={[styles.ticketVenueName, { color: theme.text }]}>{booking.turfName}</Text>
            <Text style={[styles.ticketVenueArea, { color: theme.textMuted }]}>
              <Ionicons name="location-outline" size={12} color={theme.textMuted} /> {booking.area}
            </Text>

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
                  {turfSport}
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
            ) : isCompleted ? (
              <View style={styles.cancelledOverlay}>
                <Ionicons name="checkmark-circle-outline" size={60} color="rgba(16, 185, 129, 0.4)" />
                <Text style={[styles.cancelledText, { color: '#10b981' }]}>SESSION COMPLETED</Text>
              </View>
            ) : (
              <View style={styles.qrContainer}>
                 <QRCode
                  value={JSON.stringify({
                    bookingId: booking.id,
                    transactionId: booking.transactionId || `txn_${booking.id}`,
                  })}
                  size={180}
                  color={isDarkMode ? '#ffffff' : '#020617'}
                  backgroundColor="transparent"
                />
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

          {!isCancelled && !isCompleted && (
            <>
              <TouchableOpacity
                style={[styles.rescheduleBtn, (rescheduling || !getCanCancel()) && { opacity: 0.5 }]}
                onPress={openRescheduleModal}
                disabled={rescheduling || !getCanCancel()}
              >
                <Text style={styles.rescheduleBtnText}>Reschedule Booking</Text>
              </TouchableOpacity>

              {getCanCancel() ? (
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
              ) : (
                <View style={[styles.policyNoticeCard, { backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.05)' : '#fef2f2', borderColor: 'rgba(239, 68, 68, 0.15)' }]}>
                  <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
                  <Text style={[styles.policyNoticeText, { color: theme.textMuted }]}>
                    Cancellation/reschedule is only allowed up to 3 hours before the slot start time.
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Reschedule Modal Sheet */}
      <Modal
        visible={rescheduleModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setRescheduleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Reschedule Booking</Text>
              <TouchableOpacity onPress={() => setRescheduleModalVisible(false)}>
                <Ionicons name="close-circle-outline" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {loadingSlots ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={{ color: theme.textMuted, marginTop: 10 }}>Fetching available slots...</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Date Picker Strip */}
                <Text style={[styles.sectionHeader, { color: theme.text, marginTop: 10, marginBottom: 8 }]}>Select New Date</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.datesContainer}
                  contentContainerStyle={styles.datesContent}
                >
                  {dateOptions.map((opt) => {
                    const isActive = rescheduleDate === opt.isoString;
                    return (
                      <TouchableOpacity
                        key={opt.isoString}
                        onPress={() => {
                          setRescheduleDate(opt.isoString);
                          setRescheduleTime('');
                        }}
                        style={[
                          styles.dateChipCard,
                          {
                            borderColor: isActive ? '#10b981' : theme.border,
                            backgroundColor: isActive ? 'rgba(16, 185, 129, 0.08)' : theme.card,
                          }
                        ]}
                      >
                        <Text style={[styles.dateMonthText, { color: isActive ? '#10b981' : theme.textMuted }]}>
                          {opt.month}
                        </Text>
                        <Text style={[styles.dateDayNumText, { color: isActive ? '#10b981' : theme.text }]}>
                          {opt.dayNum}
                        </Text>
                        <Text style={[styles.dateDayNameText, { color: isActive ? '#10b981' : theme.textMuted }]}>
                          {opt.dayName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Time Slots Grid */}
                <Text style={[styles.sectionHeader, { color: theme.text, marginTop: 20, marginBottom: 8 }]}>Select New Time Slot</Text>
                <View style={styles.slotsRowGrid}>
                  {generated24Slots.map((time) => {
                    const isSel = rescheduleTime === time;
                    const isBooked = isSlotBooked(time);

                    const startLabel = time.split(' - ')[0];
                    const [hours] = startLabel.split(':').map(Number);
                    const period = hours >= 12 ? 'PM' : 'AM';
                    const displayHours = hours % 12 === 0 ? 12 : hours % 12;

                    // Check if slot has passed
                    const [sYear, sMonth, sDay] = rescheduleDate.split('-').map(Number);
                    const slotStartTime = new Date(sYear, sMonth - 1, sDay, hours, 0, 0, 0);
                    const isPast = new Date().getTime() >= slotStartTime.getTime();

                    const displayLabel = isBooked
                      ? `${displayHours}:00\nBooked`
                      : isPast
                        ? `${displayHours}:00\nPassed`
                        : `${displayHours}:00\n${period}`;

                    return (
                      <TouchableOpacity
                        key={time}
                        disabled={isBooked || isPast}
                        style={[
                          styles.slotCardBadge,
                          {
                            backgroundColor: isBooked
                              ? 'rgba(239, 68, 68, 0.08)'
                              : isPast
                                ? (isDarkMode ? 'rgba(30, 41, 59, 0.2)' : 'rgba(241, 245, 249, 0.5)')
                                : isSel
                                  ? 'rgba(16, 185, 129, 0.18)'
                                  : (isDarkMode ? 'rgba(30, 41, 59, 0.4)' : '#f1f5f9'),
                            borderColor: isBooked
                              ? 'rgba(239, 68, 68, 0.4)'
                              : isPast
                                ? (isDarkMode ? 'rgba(226, 232, 240, 0.1)' : 'rgba(226, 232, 240, 0.5)')
                                : isSel
                                  ? '#10b981'
                                  : theme.border,
                            opacity: isBooked ? 0.8 : isPast ? 0.4 : 1,
                          }
                        ]}
                        onPress={() => setRescheduleTime(time)}
                      >
                        <Text style={[
                          styles.slotBadgeText,
                          {
                            color: isBooked
                              ? '#f87171'
                              : isPast
                                ? theme.textMuted
                                : isSel
                                  ? '#10b981'
                                  : theme.text,
                            fontWeight: (isSel || isBooked || isPast) ? 'bold' : 'normal',
                            textAlign: 'center',
                            fontSize: (isBooked || isPast) ? 10 : 11,
                          }
                        ]}>
                          {displayLabel}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Confirm Action Button */}
                <TouchableOpacity
                  style={[
                    styles.confirmRescheduleBtn,
                    {
                      backgroundColor: rescheduleTime ? '#10b981' : 'rgba(16, 185, 129, 0.3)',
                      marginTop: 30,
                    }
                  ]}
                  disabled={!rescheduleTime || rescheduling}
                  onPress={handleRescheduleSubmit}
                >
                  {rescheduling ? (
                    <ActivityIndicator size="small" color="#020617" />
                  ) : (
                    <Text style={styles.confirmRescheduleText}>Confirm & Reschedule</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Improved Cancellation Modal Sheet */}
      <Modal
        visible={cancelModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Cancel Booking</Text>
              <TouchableOpacity onPress={() => setCancelModalVisible(false)}>
                <Ionicons name="close-circle-outline" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Refund Summary Breakdown Card */}
              <View style={[styles.refundCard, { backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.05)' : '#fef2f2', borderColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <View style={styles.refundRow}>
                  <Text style={[styles.refundLabel, { color: theme.textMuted }]}>Total Amount Paid:</Text>
                  <Text style={[styles.refundValue, { color: theme.text }]}>{formatCurrency(booking?.amount || 0)}</Text>
                </View>
                <View style={styles.refundRow}>
                  <Text style={[styles.refundLabel, { color: theme.textMuted }]}>Cancellation Fee:</Text>
                  <Text style={[styles.refundValue, { color: '#10b981', fontWeight: 'bold' }]}>FREE (₹0)</Text>
                </View>
                <View style={[styles.menuDivider, { backgroundColor: 'rgba(239, 68, 68, 0.1)', marginVertical: 8 }]} />
                <View style={styles.refundRow}>
                  <Text style={[styles.refundTotalLabel, { color: theme.text }]}>Estimated Refund:</Text>
                  <Text style={[styles.refundTotalValue, { color: '#ef4444' }]}>{formatCurrency(booking?.amount || 0)}</Text>
                </View>
                <Text style={styles.refundMethodHint}>
                  * Cancellations are free up to 3 hours before the slot. Refund is processed to original payment method.
                </Text>
              </View>

              {/* Select Cancellation Reason */}
              <Text style={[styles.sectionHeader, { color: theme.text, marginTop: 20, marginBottom: 12 }]}>Reason for Cancellation</Text>
              <View style={styles.reasonsListContainer}>
                {cancellationReasons.map((reason) => {
                  const isSelected = cancelReason === reason;
                  return (
                    <TouchableOpacity
                      key={reason}
                      style={[
                        styles.reasonRow,
                        { borderColor: isSelected ? '#ef4444' : theme.border, backgroundColor: isSelected ? 'rgba(239, 68, 68, 0.04)' : theme.card }
                      ]}
                      onPress={() => setCancelReason(reason)}
                    >
                      <View style={styles.radioOutter}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                      <Text style={[styles.reasonLabelText, { color: theme.text, fontWeight: isSelected ? 'bold' : 'normal' }]}>
                        {reason}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom comment input box if "Other" is chosen */}
              {cancelReason === 'Other' && (
                <View style={styles.commentsBox}>
                  <TextInput
                    style={[styles.commentsInput, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                    placeholder="Describe your reason (Optional)..."
                    placeholderTextColor={theme.textMuted}
                    value={cancelComments}
                    onChangeText={setCancelComments}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              )}

              {/* Action Button Controls */}
              <View style={[styles.modalActions, { marginTop: 24 }]}>
                <TouchableOpacity
                  style={[
                    styles.confirmCancelBtn,
                    cancelling && { opacity: 0.6 }
                  ]}
                  disabled={cancelling}
                  onPress={handleCancelSubmit}
                >
                  {cancelling ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.confirmCancelText}>Yes, Cancel Booking</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.keepBookingBtn, { borderColor: theme.border }]}
                  disabled={cancelling}
                  onPress={() => setCancelModalVisible(false)}
                >
                  <Text style={[styles.keepBookingText, { color: theme.textMuted }]}>No, Keep Booking</Text>
                </TouchableOpacity>
              </View>
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
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 100,
  },
  customHeaderBack: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  customHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  customHeaderRight: {
    width: 40,
    height: 40,
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
  rescheduleBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
  },
  rescheduleBtnText: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1.5,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalLoading: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  datesContainer: {
    marginBottom: 8,
  },
  datesContent: {
    gap: 10,
    paddingRight: 20,
  },
  dateChipCard: {
    width: 60,
    height: 80,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  dateMonthText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dateDayNumText: {
    fontSize: 18,
    fontWeight: '800',
  },
  dateDayNameText: {
    fontSize: 9,
    fontWeight: '600',
  },
  slotsRowGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotCardBadge: {
    width: (width - 48 - 30) / 4,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotBadgeText: {
    fontSize: 11,
    lineHeight: 14,
  },
  confirmRescheduleBtn: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmRescheduleText: {
    color: '#020617',
    fontWeight: 'bold',
    fontSize: 14,
  },
  refundCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  refundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  refundLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  refundValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  refundTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  refundTotalValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  refundMethodHint: {
    fontSize: 10,
    color: '#ef4444',
    marginTop: 10,
    fontWeight: '500',
  },
  reasonsListContainer: {
    gap: 8,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 12,
  },
  radioOutter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
  },
  reasonLabelText: {
    fontSize: 13,
  },
  commentsBox: {
    marginTop: 12,
  },
  commentsInput: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    fontSize: 13,
    minHeight: 64,
    textAlignVertical: 'top',
  },
  modalActions: {
    gap: 10,
    width: '100%',
  },
  confirmCancelBtn: {
    backgroundColor: '#ef4444',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  confirmCancelText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  keepBookingBtn: {
    borderWidth: 1.5,
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
  },
  keepBookingText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  menuDivider: {
    height: 1,
    width: '100%',
  },
  policyNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
    width: '100%',
    marginTop: 6,
  },
  policyNoticeText: {
    fontSize: 11,
    flex: 1,
    fontWeight: '500',
    lineHeight: 15,
  },
});
