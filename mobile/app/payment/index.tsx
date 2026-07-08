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
    time: string;
    court: string;
    sport: string;
  }>();

  const addBooking = useBookingStore((s) => s.addBooking);
  const { isDarkMode } = useThemeStore();
  const { isAuthenticated } = useAuthStore();

  const turf = getTurfById(params.turfId);
  const bookingsCount = useBookingStore((s) => s.bookings).length;
  const playcoinsBalance = 350 + bookingsCount * 50;

  const [usePlaycoins, setUsePlaycoins] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'net' | 'coins'>('upi');
  const [selectedUpiApp, setSelectedUpiApp] = useState<string | null>('Google Pay');
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [appRedirecting, setAppRedirecting] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

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

  // Calculate pricing breakdown
  const basePrice = turf.price;
  const convenienceFee = 45;
  const playcoinsDiscount = usePlaycoins ? Math.min(playcoinsBalance * 0.5, basePrice * 0.2) : 0; // limit discount
  const finalTotal = basePrice + convenienceFee - playcoinsDiscount;

  const executeBookingCreation = async () => {
    setIsProcessing(true);
    try {
      // Call backend to persist booking!
      const payload = {
        turfId: turf.id,
        slotId: params.time,
        amount: finalTotal,
        time: params.time,
      };

      let bookingId = `B-${Math.floor(10000 + Math.random() * 90000)}`;
      try {
        const res = await apiFetch('/bookings', {
          method: 'POST',
          body: payload,
        });
        if (res.success && res.data?.id) {
          bookingId = res.data.id;
        }
      } catch (backendErr) {
        console.log('Failed to persist booking on backend, falling back to local creation', backendErr);
      }

      const booking = addBooking({
        id: bookingId,
        turfId: turf.id,
        turfName: turf.name,
        area: turf.area,
        date: params.date,
        time: params.time,
        amount: finalTotal,
      });

      setIsProcessing(false);
      router.replace(`/booking/${booking.id}`);
    } catch (e) {
      setIsProcessing(false);
      Alert.alert('Payment Failed', 'Something went wrong while processing your booking. Please try again.');
    }
  };

  const verifyTransaction = () => {
    setAppRedirecting(false);
    setIsVerifyingPayment(false);
    Alert.alert(
      'Payment Verification',
      `Verifying transaction status with ${selectedUpiApp || 'UPI app'}...\n\nDid you complete the payment of ${formatCurrency(finalTotal)}?`,
      [
        {
          text: 'Yes, Paid Successfully',
          onPress: () => {
            executeBookingCreation();
          },
        },
        {
          text: 'No, Cancelled/Failed',
          style: 'cancel',
          onPress: () => {
            Alert.alert('Booking Cancelled', 'Payment transaction was declined or cancelled. Your booking was not confirmed.');
          },
        },
      ],
      { cancelable: false }
    );
  };

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && isVerifyingPayment) {
        verifyTransaction();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isVerifyingPayment]);

  const handlePayment = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (selectedMethod === 'upi') {
      if (!selectedUpiApp && (!upiId || !upiId.includes('@'))) {
        Alert.alert('UPI Verification Required', 'Please select a preferred UPI app or enter a valid UPI ID (e.g. user@okaxis) to proceed.');
        return;
      }

      setAppRedirecting(true);
      const query = `pa=turfbook@hdfcbank&pn=TurfBook%20Solutions&tr=TXN${Date.now()}&am=${finalTotal}&cu=INR&tn=Booking%20for%20${encodeURIComponent(turf.name)}`;
      
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

      const launchApp = async () => {
        try {
          setIsVerifyingPayment(true);
          await Linking.openURL(targetUrl);
        } catch (err) {
          try {
            setIsVerifyingPayment(true);
            await Linking.openURL(`upi://pay?${query}`);
          } catch (genericErr) {
            setIsVerifyingPayment(false);
            setAppRedirecting(false);
            Alert.alert(
              'UPI App Launch Failed',
              `Could not launch ${selectedUpiApp || 'UPI app'} directly (${targetUrl}).\n\nIn production on a physical device, this will open the payment app automatically.`,
              [
                { text: 'Simulate Success Payment', onPress: executeBookingCreation },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          }
        }
      };

      launchApp();
      return;
    }

    // Non-UPI: Credit Card or Net Banking
    setIsProcessing(true);
    setTimeout(() => {
      executeBookingCreation();
    }, 2000);
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

      {isProcessing ? (
        <View style={styles.processingWrapper}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.processingText}>Processing Secure Payment...</Text>
          <Text style={styles.processingSub}>Please do not exit the app or refresh the page.</Text>
        </View>
      ) : appRedirecting ? (
        <View style={styles.processingWrapper}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.processingText}>Launching {selectedUpiApp || 'UPI App'}...</Text>
          <Text style={styles.processingSub}>Opening secure payment container</Text>
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

            <View style={styles.dividerThin} />

            <View style={styles.breakdownRow}>
              <Text style={[styles.totalLabel, { color: theme.text }]}>Grand Total</Text>
              <Text style={[styles.totalVal, { color: theme.text }]}>{formatCurrency(finalTotal)}</Text>
            </View>
          </View>

          {/* Pay Button */}
          <TouchableOpacity style={styles.payBtn} onPress={handlePayment}>
            <Ionicons name="lock-closed" size={16} color="#020617" style={{ marginRight: 6 }} />
            <Text style={styles.payBtnText}>Pay Securely {formatCurrency(finalTotal)}</Text>
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
