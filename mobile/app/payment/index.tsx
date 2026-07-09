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
  ActivityIndicator,
  Switch,
  TextInput,
  Linking,
  AppState,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useBookingStore } from '../../store/bookingStore';
import { useAuthStore } from '../../store/authStore';
import { apiFetch } from '../../utils/api';
import { useThemeStore } from '../../store/themeStore';
import { getTurfById } from '../../data/turfs';
import { formatCurrency } from '../../utils';

export default function PaymentCheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    turfId: string;
    date: string;
    time: string;   // comma-separated slot strings e.g. "09:00 - 10:00,10:00 - 11:00"
    slots: string;  // count of selected slots
    court: string;
    sport: string;
  }>();

  // Parse multi-slot details
  const slotList = params.time ? params.time.split(',') : [];
  const slotCount = Math.max(slotList.length, 1);

  const addBooking = useBookingStore((s) => s.addBooking);
  const { isDarkMode } = useThemeStore();
  const { isAuthenticated } = useAuthStore();

  const [turf, setTurf] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!params.turfId) {
        setLoading(false);
        return;
      }

      // If it's a mock ID (e.g. '1', '2', '3'), bypass API completely to avoid 404 errors
      const isMockId = /^\d+$/.test(params.turfId) || params.turfId.length <= 2;
      if (isMockId) {
        const mockTurf = getTurfById(params.turfId);
        if (mockTurf) {
          setTurf(mockTurf);
        }
        setLoading(false);
        return;
      }

      try {
        const res = await apiFetch(`/turfs/${params.turfId}`);
        if (res.success && res.data) {
          const bt = res.data;
          setTurf({
            id: bt.id,
            name: bt.name,
            sport: Array.isArray(bt.sports) ? bt.sports[0] : (bt.sport || 'Football'),
            price: bt.pricePerHour || bt.price || 1200,
            rating: bt.rating || 4.5,
            area: bt.location?.address || bt.area || 'Ahmednagar',
            image: Array.isArray(bt.images) && bt.images.length > 0 ? bt.images[0] : (bt.image || 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=600&auto=format&fit=crop&q=60'),
            latitude: bt.location?.latitude || bt.latitude || 19.1158,
            longitude: bt.location?.longitude || bt.longitude || 74.742,
            description: bt.description || '',
            amenities: bt.amenities || [],
            slots: bt.slots || ['17:00 - 18:00', '18:00 - 19:00', '19:00 - 20:00', '20:00 - 21:00'],
            ownerProfile: bt.ownerProfile || null,
          });
          setLoading(false);
          return;
        }
      } catch (err) {
        console.log('Failed to fetch turf details in payment page', err);
      }
      
      // Fallback to static mock data
      const mockTurf = getTurfById(params.turfId);
      if (mockTurf) {
        setTurf(mockTurf);
      }
      setLoading(false);
    };
    fetchDetails();
  }, [params.turfId]);

  const bookingsCount = useBookingStore((s) => s.bookings).length;
  const playcoinsBalance = 350 + bookingsCount * 50;

  const [usePlaycoins, setUsePlaycoins] = useState(false);
  const [payOption, setPayOption] = useState<'full' | 'advance'>('full');
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'net' | 'coins'>('upi');
  const [selectedUpiApp, setSelectedUpiApp] = useState<string | null>('Google Pay');
  const [upiId, setUpiId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'gateway_simulation' | 'success' | 'failed'>('idle');
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [activeRazorpayOrderId, setActiveRazorpayOrderId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && paymentStatus === 'gateway_simulation' && selectedMethod === 'upi') {
        confirmPayment();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [paymentStatus, selectedMethod, activeBookingId, activeRazorpayOrderId]);

  const theme = {
    bg: isDarkMode ? '#030712' : '#f8fafc',
    card: isDarkMode ? 'rgba(15, 23, 42, 0.75)' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#e2e8f0',
    inputBg: isDarkMode ? 'rgba(3, 7, 18, 0.5)' : '#ffffff',
    bgImageOpacity: isDarkMode ? 0.35 : 0.22,
    overlayBg: isDarkMode ? 'rgba(3, 7, 18, 0.5)' : 'rgba(248, 250, 252, 0.6)',
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg }}>
        <Stack.Screen options={{ title: 'Checkout', headerShown: true }} />
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!turf) {
    return (
      <View style={[styles.notFound, { backgroundColor: theme.bg }]}>
        <Stack.Screen options={{ title: 'Invalid Checkout', headerShown: true }} />
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={[styles.notFoundText, { color: theme.text }]}>Invalid session details.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')}>
          <Text style={styles.backButtonText}>Back to Explore</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Calculate pricing breakdown — multiply by number of slots selected
  const basePrice = turf.price * slotCount;
  const convenienceFee = 45;
  const playcoinsDiscount = usePlaycoins ? Math.min(playcoinsBalance * 0.5, basePrice * 0.2) : 0;
  const finalTotal = basePrice + convenienceFee - playcoinsDiscount;

  // Advance Payment: 30% of base price + convenienceFee - playcoinsDiscount
  const advanceAmount = Math.round(basePrice * 0.3);
  const advanceTotal = advanceAmount + convenienceFee - playcoinsDiscount;

  const amountToPay = payOption === 'full' ? finalTotal : advanceTotal;

  // Step 1: Initiate booking on backend (sets PENDING status)
  const handlePayment = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (selectedMethod === 'upi' && !selectedUpiApp && (!upiId || !upiId.includes('@'))) {
      Alert.alert('UPI Verification Required', 'Please select a preferred UPI app or enter a valid UPI ID (e.g. user@okaxis) to proceed.');
      return;
    }

    setPaymentStatus('processing');
    setErrorMessage(null);

    try {
      const res = await apiFetch('/bookings', {
        method: 'POST',
        body: {
          turfId: turf.id,
          slotId: params.time,
          amount: amountToPay,
          totalAmount: finalTotal,
          time: params.time,
        },
      });

      if (res.success && res.data) {
        setActiveBookingId(res.data.booking.id);
        setActiveRazorpayOrderId(res.data.razorpayOrderId);
        
        // Launch deep-link UPI app if UPI is selected
        if (selectedMethod === 'upi') {
          const upiAddress = turf.ownerProfile?.businessUpiId || 'turfbook@hdfcbank';
          const merchantName = turf.ownerProfile?.companyName || turf.name || 'TurfBook';
          const query = `pa=${encodeURIComponent(upiAddress)}&pn=${encodeURIComponent(merchantName)}&tr=${res.data.razorpayOrderId}&am=${amountToPay}&cu=INR&tn=Booking%20for%20${encodeURIComponent(turf.name)}`;
          let targetUrl = `upi://pay?${query}`;
          
          if (selectedUpiApp === 'Google Pay') {
            targetUrl = Platform.OS === 'ios' ? `gpay://upi/pay?${query}` : `upi://pay?${query}`;
          } else if (selectedUpiApp === 'PhonePe') {
            targetUrl = `phonepe://upi/pay?${query}`;
          } else if (selectedUpiApp === 'Paytm') {
            targetUrl = `paytmmp://upi/pay?${query}`;
          } else if (selectedUpiApp === 'BHIM') {
            targetUrl = `bhim://upi/pay?${query}`;
          }

          try {
            await Linking.openURL(targetUrl);
          } catch (err) {
            console.log('Failed direct launch, trying generic upi:// link', err);
            try {
              await Linking.openURL(`upi://pay?${query}`);
            } catch (genericErr) {
              console.log('Generic UPI launcher failed', genericErr);
              // Emulator / no UPI apps fallback is handled elegantly since we still load the simulation gateway
            }
          }
        }

        // Show simulated secure payment gateway
        setPaymentStatus('gateway_simulation');
      } else {
        throw new Error(res.message || 'Failed to initiate booking');
      }
    } catch (e: any) {
      console.log('Initiating booking failed', e);
      setErrorMessage(e.message || 'Network request failed. Make sure server is running.');
      setPaymentStatus('failed');
    }
  };

  // Step 2A: Verify payment success on backend (confirms booking)
  const confirmPayment = async () => {
    if (!activeBookingId || !activeRazorpayOrderId) return;
    
    setPaymentStatus('processing');
    const paymentId = 'pay_' + Math.random().toString(36).substring(2, 10);
    const signature = 'sig_' + Math.random().toString(36).substring(2, 15);

    try {
      const res = await apiFetch('/bookings/verify', {
        method: 'POST',
        body: {
          bookingId: activeBookingId,
          razorpayOrderId: activeRazorpayOrderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
          status: 'PAID',
        },
      });

      if (res.success) {
        // Sync local store
        addBooking({
          id: activeBookingId,
          turfId: turf.id,
          turfName: turf.name,
          area: turf.area,
          date: params.date,
          time: params.time,
          amount: finalTotal,
        });
        setPaymentStatus('success');
      } else {
        throw new Error(res.message || 'Signature verification failed.');
      }
    } catch (e: any) {
      console.log('Verification failed', e);
      setErrorMessage(e.message || 'Signature verification failed. Transaction rejected.');
      setPaymentStatus('failed');
    }
  };

  // Step 2B: Handle payment failure / cancellation on backend (cancels booking)
  const cancelPayment = async () => {
    if (!activeBookingId) return;

    setPaymentStatus('processing');
    try {
      await apiFetch('/bookings/verify', {
        method: 'POST',
        body: {
          bookingId: activeBookingId,
          status: 'FAILED',
        },
      });
    } catch (e) {
      console.log('Failed to report transaction failure to backend', e);
    }
    setErrorMessage('The transaction was cancelled or declined by the payment provider.');
    setPaymentStatus('failed');
  };


  // Format date (e.g. Wed, Jul 8)
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

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
          title: 'Secure Checkout',
          headerTransparent: true,
          headerTintColor: theme.text,
        }}
      />

      {paymentStatus === 'processing' ? (
        <View style={styles.processingWrapper}>
          <ActivityIndicator size="large" color="#10b981" />
          <View style={{ marginVertical: 18, alignItems: 'center' }}>
            <Ionicons name="lock-closed" size={32} color="#10b981" style={{ marginBottom: 12 }} />
            <Text style={styles.processingText}>Verifying Transaction Status...</Text>
            <Text style={styles.processingSub}>Please wait, contacting the payment gateway securely.</Text>
          </View>
        </View>
      ) : paymentStatus === 'gateway_simulation' ? (
        <View style={[styles.simulatedAppWrapper, { backgroundColor: isDarkMode ? '#020617' : '#ffffff' }]}>
          <View style={[styles.simHeader, { borderBottomColor: theme.border }]}>
            <View style={styles.simHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="shield-checkmark" size={24} color="#10b981" />
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text }}>Razorpay Secure Gateway</Text>
              </View>
              <TouchableOpacity style={styles.simClose} onPress={cancelPayment}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.simScroll} showsVerticalScrollIndicator={false}>
            {/* Merchant Details */}
            <View style={[styles.simMerchantCard, { backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc', borderColor: theme.border, borderWidth: 1 }]}>
              <Text style={styles.simLabel}>MERCHANT DETAILS</Text>
              <Text style={[styles.simMerchantName, { color: theme.text }]}>TurfBook Arena Solutions</Text>
              <Text style={styles.simMerchantUpi}>Merchant UPI: pay@turfbook</Text>

              <View style={[styles.simAmountContainer, { backgroundColor: isDarkMode ? '#030712' : '#edf2f7' }]}>
                <Text style={[styles.simAmountText, { color: '#10b981' }]}>
                  {formatCurrency(amountToPay)}
                </Text>
              </View>
            </View>

            {/* Simulated Payment Box */}
            <View style={[styles.simDetailsBox, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
              <Text style={[styles.simLabel, { color: theme.textMuted }]}>PAYMENT METHOD REFERENCE</Text>
              <View style={styles.simDetailRow}>
                <Text style={styles.simDetailLabel}>Booking ID</Text>
                <Text style={[styles.simDetailVal, { color: theme.text }]}>{activeBookingId}</Text>
              </View>
              <View style={styles.simDetailRow}>
                <Text style={styles.simDetailLabel}>Razorpay Order ID</Text>
                <Text style={[styles.simDetailVal, { color: theme.text }]}>{activeRazorpayOrderId}</Text>
              </View>
              <View style={styles.simDetailRow}>
                <Text style={styles.simDetailLabel}>Selected Method</Text>
                <Text style={[styles.simDetailVal, { color: theme.text, textTransform: 'uppercase' }]}>{selectedMethod}</Text>
              </View>
            </View>

            <View style={styles.secureBadgeRow}>
              <Ionicons name="lock-closed" size={14} color="#64748b" />
              <Text style={styles.secureBadgeText}>128-bit SSL Secured Encryption by Razorpay</Text>
            </View>

            {/* Authorize/Decline Action Buttons */}
            <View style={{ gap: 12, marginTop: 10 }}>
              <TouchableOpacity style={styles.simPayBtn} onPress={confirmPayment}>
                <Text style={styles.simPayBtnText}>Authorize & Confirm Payment</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.simDeclineBtn} onPress={cancelPayment}>
                <Text style={styles.simDeclineBtnText}>Cancel / Decline Transaction</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      ) : paymentStatus === 'success' ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: theme.bg }}>
          <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(16, 185, 129, 0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <Ionicons name="checkmark-circle" size={64} color="#10b981" />
          </View>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.text, marginBottom: 12, textAlign: 'center' }}>
            Payment Successful!
          </Text>
          <Text style={{ fontSize: 15, color: theme.textMuted, textAlign: 'center', marginBottom: 32, paddingHorizontal: 16 }}>
            Your slot has been secured. A confirmation message has been sent to your registered number.
          </Text>

          <View style={[styles.simDetailsBox, { width: '100%', backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1, padding: 20, marginBottom: 40 }]}>
            <View style={styles.simDetailRow}>
              <Text style={styles.simDetailLabel}>Booking ID</Text>
              <Text style={[styles.simDetailVal, { color: theme.text }]}>{activeBookingId}</Text>
            </View>
            <View style={styles.simDetailRow}>
              <Text style={styles.simDetailLabel}>Turf</Text>
              <Text style={[styles.simDetailVal, { color: theme.text }]}>{turf.name}</Text>
            </View>
            <View style={styles.simDetailRow}>
              <Text style={styles.simDetailLabel}>Time Slot</Text>
              <Text style={[styles.simDetailVal, { color: theme.text }]}>{params.time}</Text>
            </View>
            <View style={styles.simDetailRow}>
              <Text style={styles.simDetailLabel}>Paid Amount</Text>
              <Text style={[styles.simDetailVal, { color: '#10b981', fontWeight: 'bold' }]}>{formatCurrency(amountToPay)}</Text>
            </View>
            {payOption === 'advance' && (
              <View style={styles.simDetailRow}>
                <Text style={styles.simDetailLabel}>Dues at Venue</Text>
                <Text style={[styles.simDetailVal, { color: '#ef4444', fontWeight: 'bold' }]}>{formatCurrency(finalTotal - advanceTotal)}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={{ width: '100%', backgroundColor: '#10b981', paddingVertical: 15, borderRadius: 12, alignItems: 'center' }}
            onPress={() => router.replace('/')}
          >
            <Text style={{ color: '#020617', fontWeight: 'bold', fontSize: 16 }}>Go to Bookings</Text>
          </TouchableOpacity>
        </View>
      ) : paymentStatus === 'failed' ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: theme.bg }}>
          <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(239, 68, 68, 0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <Ionicons name="close-circle" size={64} color="#ef4444" />
          </View>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.text, marginBottom: 12, textAlign: 'center' }}>
            Payment Failed
          </Text>
          <Text style={{ fontSize: 14, color: '#ef4444', textAlign: 'center', marginBottom: 32, paddingHorizontal: 16, fontWeight: '600' }}>
            {errorMessage || 'Something went wrong while authenticating your payment.'}
          </Text>

          <View style={[styles.simDetailsBox, { width: '100%', backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1, padding: 20, marginBottom: 40 }]}>
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: theme.text, marginBottom: 12 }}>Troubleshooting Tips:</Text>
            <Text style={{ fontSize: 12, color: theme.textMuted, marginBottom: 6 }}>• Ensure you have sufficient balance in your account.</Text>
            <Text style={{ fontSize: 12, color: theme.textMuted, marginBottom: 6 }}>• Double-check your UPI ID and PIN credentials.</Text>
            <Text style={{ fontSize: 12, color: theme.textMuted }}>• Do not close the app during gateway authentication.</Text>
          </View>

          <TouchableOpacity
            style={{ width: '100%', backgroundColor: '#ef4444', paddingVertical: 15, borderRadius: 12, alignItems: 'center' }}
            onPress={() => setPaymentStatus('idle')}
          >
            <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 16 }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Booking Summary Card */}
          <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={styles.sectionLabel}>BOOKING DETAILS</Text>
            <Text style={[styles.turfName, { color: theme.text }]}>{turf.name}</Text>
            <Text style={[styles.areaText, { color: theme.textMuted }]}>📍 {turf.area}</Text>

            <View style={styles.dividerThin} />

            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={15} color="#10b981" />
                <Text style={[styles.metaVal, { color: theme.text }]}>{formatDate(params.date)}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={15} color="#10b981" />
                <Text style={[styles.metaVal, { color: theme.text }]}>{params.time}</Text>
              </View>
            </View>

            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="soccer" size={15} color="#10b981" />
                <Text style={[styles.metaVal, { color: theme.text }]}>{params.court}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="ribbon-outline" size={15} color="#10b981" />
                <Text style={[styles.metaVal, { color: theme.text }]}>{params.sport}</Text>
              </View>
            </View>
          </View>

          {/* Payment Option Selection (Full vs Advance) */}
          <Text style={[styles.sectionHeader, { color: theme.text, marginTop: 24, marginBottom: 8 }]}>Select Payment Option</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: payOption === 'full' ? 'rgba(16, 185, 129, 0.08)' : theme.card,
                borderColor: payOption === 'full' ? '#10b981' : theme.border,
                borderWidth: 1.5,
                borderRadius: 16,
                padding: 16,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => setPayOption('full')}
            >
              <Ionicons name="card" size={20} color={payOption === 'full' ? '#10b981' : theme.textMuted} style={{ marginBottom: 6 }} />
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: theme.text }}>Full Payment</Text>
              <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>{formatCurrency(finalTotal)}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: payOption === 'advance' ? 'rgba(16, 185, 129, 0.08)' : theme.card,
                borderColor: payOption === 'advance' ? '#10b981' : theme.border,
                borderWidth: 1.5,
                borderRadius: 16,
                padding: 16,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => setPayOption('advance')}
            >
              <Ionicons name="sparkles" size={20} color={payOption === 'advance' ? '#10b981' : theme.textMuted} style={{ marginBottom: 6 }} />
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: theme.text }}>Pay Advance (30%)</Text>
              <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>{formatCurrency(advanceTotal)}</Text>
            </TouchableOpacity>
          </View>

          {/* Playcoins Reward Discount Strip */}
          {playcoinsBalance > 0 && (
            <View style={[styles.discountStrip, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <FontAwesome5 name="coins" size={18} color="#fbbf24" />
                <View>
                  <Text style={[styles.discountTitle, { color: theme.text }]}>
                    Apply Playcoins (Bal: {playcoinsBalance})
                  </Text>
                  <Text style={[styles.discountDesc, { color: theme.textMuted }]}>
                    Redeem to save ₹{Math.min(playcoinsBalance * 0.5, basePrice * 0.2)}
                  </Text>
                </View>
              </View>
              <Switch
                value={usePlaycoins}
                onValueChange={setUsePlaycoins}
                trackColor={{ false: '#475569', true: '#10b981' }}
                thumbColor="#ffffff"
              />
            </View>
          )}

          {/* Payment Methods */}
          <Text style={[styles.sectionHeader, { color: theme.text }]}>Select Payment Method</Text>

          <View style={styles.methodsWrapper}>
            {/* UPI Option */}
            <TouchableOpacity
              style={[
                styles.methodCard,
                { backgroundColor: theme.card, borderColor: selectedMethod === 'upi' ? '#10b981' : theme.border },
              ]}
              onPress={() => setSelectedMethod('upi')}
            >
              <View style={styles.methodLeft}>
                <MaterialCommunityIcons name="flash-outline" size={24} color="#10b981" />
                <View>
                  <Text style={[styles.methodTitle, { color: theme.text }]}>UPI Apps</Text>
                  <Text style={[styles.methodDesc, { color: theme.textMuted }]}>Google Pay, PhonePe, Paytm</Text>
                </View>
              </View>
              <View style={[styles.radioOuter, { borderColor: selectedMethod === 'upi' ? '#10b981' : '#64748b' }]}>
                {selectedMethod === 'upi' && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>

            {/* Expanded UPI Apps Panel */}
            {selectedMethod === 'upi' && (
              <View style={[styles.expandedUpiContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.subSectionHeader, { color: theme.text }]}>Select Preferred App</Text>
                <View style={styles.upiAppsRow}>
                  {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => {
                    const isAppSel = selectedUpiApp === app;
                    let appIconName = 'google';
                    let appIconColor = '#4285F4';
                    if (app === 'PhonePe') {
                      appIconName = 'wallet';
                      appIconColor = '#673ab7';
                    } else if (app === 'Paytm') {
                      appIconName = 'credit-card-outline';
                      appIconColor = '#00baf2';
                    } else if (app === 'BHIM') {
                      appIconName = 'bank';
                      appIconColor = '#e11d48';
                    }

                    return (
                      <TouchableOpacity
                        key={app}
                        style={[
                          styles.upiAppChip,
                          {
                            borderColor: isAppSel ? '#10b981' : theme.border,
                            backgroundColor: isAppSel ? 'rgba(16, 185, 129, 0.08)' : (isDarkMode ? 'rgba(15, 23, 42, 0.3)' : '#f1f5f9'),
                          },
                        ]}
                        onPress={() => {
                          setSelectedUpiApp(app);
                          setUpiId(''); // Clear custom ID when app selected
                        }}
                      >
                        <MaterialCommunityIcons name={appIconName as any} size={20} color={appIconColor} style={{ marginRight: 6 }} />
                        <Text style={[styles.upiAppText, { color: theme.text }]}>{app}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.orRow}>
                  <View style={[styles.orLine, { backgroundColor: theme.border }]} />
                  <Text style={[styles.orText, { color: theme.textMuted }]}>OR ENTER UPI ID</Text>
                  <View style={[styles.orLine, { backgroundColor: theme.border }]} />
                </View>

                <View style={[styles.upiInputBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                  <TextInput
                    value={upiId}
                    onChangeText={(val: string) => {
                      setUpiId(val);
                      setSelectedUpiApp(null); // Clear selected app chip
                    }}
                    placeholder="Enter UPI ID (e.g. user@okaxis)"
                    placeholderTextColor={theme.textMuted}
                    style={[styles.upiTextEntry, { color: theme.text }]}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {upiId.includes('@') && (
                    <Text style={styles.upiValidTag}>Valid ID</Text>
                  )}
                </View>
              </View>
            )}

            {/* Cards Option */}
            <TouchableOpacity
              style={[
                styles.methodCard,
                { backgroundColor: theme.card, borderColor: selectedMethod === 'card' ? '#10b981' : theme.border },
              ]}
              onPress={() => setSelectedMethod('card')}
            >
              <View style={styles.methodLeft}>
                <Ionicons name="card-outline" size={24} color="#10b981" />
                <View>
                  <Text style={[styles.methodTitle, { color: theme.text }]}>Credit / Debit Card</Text>
                  <Text style={[styles.methodDesc, { color: theme.textMuted }]}>Visa, MasterCard, RuPay</Text>
                </View>
              </View>
              <View style={[styles.radioOuter, { borderColor: selectedMethod === 'card' ? '#10b981' : '#64748b' }]}>
                {selectedMethod === 'card' && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>

            {/* Netbanking Option */}
            <TouchableOpacity
              style={[
                styles.methodCard,
                { backgroundColor: theme.card, borderColor: selectedMethod === 'net' ? '#10b981' : theme.border },
              ]}
              onPress={() => setSelectedMethod('net')}
            >
              <View style={styles.methodLeft}>
                <Ionicons name="business-outline" size={24} color="#10b981" />
                <View>
                  <Text style={[styles.methodTitle, { color: theme.text }]}>Net Banking</Text>
                  <Text style={[styles.methodDesc, { color: theme.textMuted }]}>All major Indian banks</Text>
                </View>
              </View>
              <View style={[styles.radioOuter, { borderColor: selectedMethod === 'net' ? '#10b981' : '#64748b' }]}>
                {selectedMethod === 'net' && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          </View>

          {/* Pricing Breakdown Sheet */}
          <View style={[styles.breakdownCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: theme.textMuted }]}>Slot Charge</Text>
              <Text style={[styles.breakdownVal, { color: theme.text }]}>{formatCurrency(basePrice)}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: theme.textMuted }]}>Convenience Fee</Text>
              <Text style={[styles.breakdownVal, { color: theme.text }]}>{formatCurrency(convenienceFee)}</Text>
            </View>

            {usePlaycoins && (
              <View style={styles.breakdownRow}>
                <Text style={styles.discountLabel}>Playcoins Discount</Text>
                <Text style={styles.discountVal}>- {formatCurrency(playcoinsDiscount)}</Text>
              </View>
            )}

            {payOption === 'advance' && (
              <>
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: theme.textMuted }]}>Booking Total</Text>
                  <Text style={[styles.breakdownVal, { color: theme.text, fontWeight: 'bold' }]}>{formatCurrency(finalTotal)}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.discountLabel}>Due Offline at Venue</Text>
                  <Text style={[styles.discountVal, { color: '#ef4444' }]}>{formatCurrency(finalTotal - advanceTotal)}</Text>
                </View>
              </>
            )}

            <View style={styles.dividerThin} />

            <View style={styles.breakdownRow}>
              <Text style={[styles.totalLabel, { color: theme.text }]}>
                {payOption === 'advance' ? 'Amount to Pay Now' : 'Grand Total'}
              </Text>
              <Text style={[styles.totalVal, { color: theme.text }]}>{formatCurrency(amountToPay)}</Text>
            </View>
          </View>

          {/* Pay Button */}
          <TouchableOpacity style={styles.payBtn} onPress={handlePayment}>
            <Ionicons name="lock-closed" size={16} color="#020617" style={{ marginRight: 6 }} />
            <Text style={styles.payBtnText}>Pay Securely {formatCurrency(amountToPay)}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
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
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 120 : 100,
    paddingHorizontal: 20,
    paddingBottom: 40,
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
  processingWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  processingText: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 18,
    marginTop: 10,
  },
  processingSub: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
  },
  summaryCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionLabel: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  turfName: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  areaText: {
    fontSize: 12,
    marginBottom: 14,
  },
  dividerThin: {
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    marginVertical: 12,
  },
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '48%',
  },
  metaVal: {
    fontSize: 12,
    fontWeight: '600',
  },
  discountStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 24,
  },
  discountTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  discountDesc: {
    fontSize: 10,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 14,
  },
  methodsWrapper: {
    gap: 12,
    marginBottom: 24,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  methodTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  methodDesc: {
    fontSize: 10,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
  },
  breakdownCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
    gap: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  breakdownVal: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  discountLabel: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '600',
  },
  discountVal: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: 'bold',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  totalVal: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  payBtn: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  payBtnText: {
    color: '#020617',
    fontWeight: 'bold',
    fontSize: 15,
  },
  expandedUpiContainer: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginTop: -8,
    marginBottom: 4,
    gap: 12,
  },
  subSectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  upiAppsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  upiAppChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    width: '48%',
  },
  upiAppText: {
    fontSize: 11,
    fontWeight: '700',
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 4,
  },
  orLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  upiInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  upiTextEntry: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    padding: 0,
  },
  upiValidTag: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  simulatedAppWrapper: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 25,
  },
  simHeader: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  simHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  simClose: {
    padding: 4,
  },
  simScroll: {
    padding: 20,
    gap: 16,
  },
  simMerchantCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  simLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  simMerchantName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  simMerchantUpi: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 16,
  },
  simAmountContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  simAmountText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  simDetailsBox: {
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  simDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  simDetailLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  simDetailVal: {
    fontSize: 11,
    color: '#0f172a',
    fontWeight: 'bold',
  },
  secureBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 10,
  },
  secureBadgeText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  simPayBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simPayBtnText: {
    color: '#020617',
    fontWeight: 'bold',
    fontSize: 14,
  },
  simDeclineBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simDeclineBtnText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
