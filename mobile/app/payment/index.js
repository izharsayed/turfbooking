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
exports.default = PaymentCheckoutScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const vector_icons_1 = require("@expo/vector-icons");
const bookingStore_1 = require("../../store/bookingStore");
const authStore_1 = require("../../store/authStore");
const api_1 = require("../../utils/api");
const themeStore_1 = require("../../store/themeStore");
const turfs_1 = require("../../data/turfs");
const utils_1 = require("../../utils");
function PaymentCheckoutScreen() {
    const router = (0, expo_router_1.useRouter)();
    const params = (0, expo_router_1.useLocalSearchParams)();
    // Parse multi-slot details
    const slotList = params.time ? params.time.split(',') : [];
    const slotCount = Math.max(slotList.length, 1);
    const addBooking = (0, bookingStore_1.useBookingStore)((s) => s.addBooking);
    const { isDarkMode } = (0, themeStore_1.useThemeStore)();
    const { isAuthenticated } = (0, authStore_1.useAuthStore)();
    const [turf, setTurf] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        const fetchDetails = async () => {
            if (!params.turfId) {
                setLoading(false);
                return;
            }
            // If it's a mock ID (e.g. '1', '2', '3'), bypass API completely to avoid 404 errors
            const isMockId = /^\d+$/.test(params.turfId) || params.turfId.length <= 2;
            if (isMockId) {
                const mockTurf = (0, turfs_1.getTurfById)(params.turfId);
                if (mockTurf) {
                    setTurf(mockTurf);
                }
                setLoading(false);
                return;
            }
            try {
                const res = await (0, api_1.apiFetch)(`/turfs/${params.turfId}`);
                if (res.success && res.data) {
                    const bt = res.data;
                    const getMobileSportName = (s) => {
                        const map = {
                            'NHQKZB3YRCRhWBL95sUE': 'Football',
                            'nB4mpucB3cyLZA8gXxiA': 'Cricket',
                            'HV8G3I9zmsYnUWFqqqMV': 'Box Cricket'
                        };
                        return map[s] || s;
                    };
                    const rawSport = Array.isArray(bt.sports) ? bt.sports[0] : (bt.sport || 'Football');
                    const sport = getMobileSportName(rawSport);
                    let imagePath = Array.isArray(bt.images) && bt.images.length > 0 ? bt.images[0] : (bt.image || '/images/football.jpg');
                    if ((sport === 'Cricket' || sport === 'Box Cricket') && (imagePath === '/images/football.jpg' || imagePath.includes('football.jpg') || imagePath.includes('photo-1575361204480-aadea25e6e68'))) {
                        imagePath = '/images/cricket.jpg';
                    }
                    setTurf({
                        id: bt.id,
                        name: bt.name,
                        sport: sport,
                        price: bt.pricePerHour || bt.price || 1200,
                        rating: bt.rating || 4.5,
                        area: bt.location?.address || bt.area || 'Ahmednagar',
                        image: imagePath,
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
            }
            catch (err) {
                console.log('Failed to fetch turf details in payment page', err);
            }
            // Fallback to static mock data
            const mockTurf = (0, turfs_1.getTurfById)(params.turfId);
            if (mockTurf) {
                setTurf(mockTurf);
            }
            setLoading(false);
        };
        fetchDetails();
    }, [params.turfId]);
    const [payOption, setPayOption] = (0, react_1.useState)('full');
    const [selectedMethod, setSelectedMethod] = (0, react_1.useState)('upi');
    const [selectedUpiApp, setSelectedUpiApp] = (0, react_1.useState)('Google Pay');
    const [upiId, setUpiId] = (0, react_1.useState)('');
    const [paymentStatus, setPaymentStatus] = (0, react_1.useState)('idle');
    const [activeBookingId, setActiveBookingId] = (0, react_1.useState)(null);
    const [activeRazorpayOrderId, setActiveRazorpayOrderId] = (0, react_1.useState)(null);
    const [errorMessage, setErrorMessage] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const subscription = react_native_1.AppState.addEventListener('change', (nextAppState) => {
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
        return (<react_native_1.View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg }}>
        <expo_router_1.Stack.Screen options={{ title: 'Checkout', headerShown: true }}/>
        <react_native_1.ActivityIndicator size="large" color="#10b981"/>
      </react_native_1.View>);
    }
    if (!turf) {
        return (<react_native_1.View style={[styles.notFound, { backgroundColor: theme.bg }]}>
        <expo_router_1.Stack.Screen options={{ title: 'Invalid Checkout', headerShown: true }}/>
        <vector_icons_1.Ionicons name="alert-circle-outline" size={64} color="#ef4444"/>
        <react_native_1.Text style={[styles.notFoundText, { color: theme.text }]}>Invalid session details.</react_native_1.Text>
        <react_native_1.TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')}>
          <react_native_1.Text style={styles.backButtonText}>Back to Explore</react_native_1.Text>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>);
    }
    // Calculate pricing breakdown — multiply by number of slots selected
    const basePrice = turf.price * slotCount;
    const convenienceFee = 45;
    const finalTotal = basePrice + convenienceFee;
    // Advance Payment: 30% of base price + convenienceFee
    const advanceAmount = Math.round(basePrice * 0.3);
    const advanceTotal = advanceAmount + convenienceFee;
    const amountToPay = payOption === 'full' ? finalTotal : advanceTotal;
    // Step 1: Initiate booking on backend (sets PENDING status)
    const handlePayment = async () => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        if (selectedMethod === 'upi' && !selectedUpiApp && (!upiId || !upiId.includes('@'))) {
            react_native_1.Alert.alert('UPI Verification Required', 'Please select a preferred UPI app or enter a valid UPI ID (e.g. user@okaxis) to proceed.');
            return;
        }
        setPaymentStatus('processing');
        setErrorMessage(null);
        try {
            const res = await (0, api_1.apiFetch)('/bookings', {
                method: 'POST',
                body: {
                    turfId: turf.id,
                    slotId: params.time,
                    amount: amountToPay,
                    totalAmount: finalTotal,
                    time: params.time,
                    date: params.date,
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
                        targetUrl = react_native_1.Platform.OS === 'ios' ? `gpay://upi/pay?${query}` : `upi://pay?${query}`;
                    }
                    else if (selectedUpiApp === 'PhonePe') {
                        targetUrl = `phonepe://upi/pay?${query}`;
                    }
                    else if (selectedUpiApp === 'Paytm') {
                        targetUrl = `paytmmp://upi/pay?${query}`;
                    }
                    else if (selectedUpiApp === 'BHIM') {
                        targetUrl = `bhim://upi/pay?${query}`;
                    }
                    try {
                        await react_native_1.Linking.openURL(targetUrl);
                    }
                    catch (err) {
                        console.log('Failed direct launch, trying generic upi:// link', err);
                        try {
                            await react_native_1.Linking.openURL(`upi://pay?${query}`);
                        }
                        catch (genericErr) {
                            console.log('Generic UPI launcher failed', genericErr);
                            // Emulator / no UPI apps fallback is handled elegantly since we still load the simulation gateway
                        }
                    }
                }
                // Show simulated secure payment gateway
                setPaymentStatus('gateway_simulation');
            }
            else {
                throw new Error(res.message || 'Failed to initiate booking');
            }
        }
        catch (e) {
            console.log('Initiating booking failed', e);
            setErrorMessage(e.message || 'Network request failed. Make sure server is running.');
            setPaymentStatus('failed');
        }
    };
    // Step 2A: Verify payment success on backend (confirms booking)
    const confirmPayment = async () => {
        if (!activeBookingId || !activeRazorpayOrderId)
            return;
        setPaymentStatus('processing');
        const paymentId = 'pay_' + Math.random().toString(36).substring(2, 10);
        const signature = 'sig_' + Math.random().toString(36).substring(2, 15);
        try {
            const res = await (0, api_1.apiFetch)('/bookings/verify', {
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
            }
            else {
                throw new Error(res.message || 'Signature verification failed.');
            }
        }
        catch (e) {
            console.log('Verification failed', e);
            setErrorMessage(e.message || 'Signature verification failed. Transaction rejected.');
            setPaymentStatus('failed');
        }
    };
    // Step 2B: Handle payment failure / cancellation on backend (cancels booking)
    const cancelPayment = async () => {
        if (!activeBookingId)
            return;
        setPaymentStatus('processing');
        try {
            await (0, api_1.apiFetch)('/bookings/verify', {
                method: 'POST',
                body: {
                    bookingId: activeBookingId,
                    status: 'FAILED',
                },
            });
        }
        catch (e) {
            console.log('Failed to report transaction failure to backend', e);
        }
        setErrorMessage('The transaction was cancelled or declined by the payment provider.');
        setPaymentStatus('failed');
    };
    // Format date (e.g. Wed, Jul 8)
    const formatDate = (dateStr) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
            });
        }
        catch {
            return dateStr;
        }
    };
    return (<react_native_1.View style={[styles.container, { backgroundColor: theme.bg }]}>
      <react_native_1.Image source={require('../../assets/turf-bg.jpg')} style={[styles.backgroundImage, { opacity: theme.bgImageOpacity }]} resizeMode="cover"/>
      <react_native_1.View style={[styles.overlay, { backgroundColor: theme.overlayBg }]}/>

      <expo_router_1.Stack.Screen options={{
            headerShown: true,
            title: 'Secure Checkout',
            headerTransparent: true,
            headerTintColor: theme.text,
        }}/>

      {paymentStatus === 'processing' ? (<react_native_1.View style={styles.processingWrapper}>
          <react_native_1.ActivityIndicator size="large" color="#10b981"/>
          <react_native_1.View style={{ marginVertical: 18, alignItems: 'center' }}>
            <vector_icons_1.Ionicons name="lock-closed" size={32} color="#10b981" style={{ marginBottom: 12 }}/>
            <react_native_1.Text style={styles.processingText}>Verifying Transaction Status...</react_native_1.Text>
            <react_native_1.Text style={styles.processingSub}>Please wait, contacting the payment gateway securely.</react_native_1.Text>
          </react_native_1.View>
        </react_native_1.View>) : paymentStatus === 'gateway_simulation' ? (<react_native_1.View style={[styles.simulatedAppWrapper, { backgroundColor: isDarkMode ? '#020617' : '#ffffff' }]}>
          <react_native_1.View style={[styles.simHeader, { borderBottomColor: theme.border }]}>
            <react_native_1.View style={styles.simHeaderRow}>
              <react_native_1.View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <vector_icons_1.Ionicons name="shield-checkmark" size={24} color="#10b981"/>
                <react_native_1.Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text }}>Razorpay Secure Gateway</react_native_1.Text>
              </react_native_1.View>
              <react_native_1.TouchableOpacity style={styles.simClose} onPress={cancelPayment}>
                <vector_icons_1.Ionicons name="close" size={24} color={theme.textMuted}/>
              </react_native_1.TouchableOpacity>
            </react_native_1.View>
          </react_native_1.View>

          <react_native_1.ScrollView contentContainerStyle={styles.simScroll} showsVerticalScrollIndicator={false}>
            {/* Merchant Details */}
            <react_native_1.View style={[styles.simMerchantCard, { backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc', borderColor: theme.border, borderWidth: 1 }]}>
              <react_native_1.Text style={styles.simLabel}>MERCHANT DETAILS</react_native_1.Text>
              <react_native_1.Text style={[styles.simMerchantName, { color: theme.text }]}>TurfBook Arena Solutions</react_native_1.Text>
              <react_native_1.Text style={styles.simMerchantUpi}>Merchant UPI: pay@turfbook</react_native_1.Text>

              <react_native_1.View style={[styles.simAmountContainer, { backgroundColor: isDarkMode ? '#030712' : '#edf2f7' }]}>
                <react_native_1.Text style={[styles.simAmountText, { color: '#10b981' }]}>
                  {(0, utils_1.formatCurrency)(amountToPay)}
                </react_native_1.Text>
              </react_native_1.View>
            </react_native_1.View>

            {/* Simulated Payment Box */}
            <react_native_1.View style={[styles.simDetailsBox, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
              <react_native_1.Text style={[styles.simLabel, { color: theme.textMuted }]}>PAYMENT METHOD REFERENCE</react_native_1.Text>
              <react_native_1.View style={styles.simDetailRow}>
                <react_native_1.Text style={styles.simDetailLabel}>Booking ID</react_native_1.Text>
                <react_native_1.Text style={[styles.simDetailVal, { color: theme.text }]}>{activeBookingId}</react_native_1.Text>
              </react_native_1.View>
              <react_native_1.View style={styles.simDetailRow}>
                <react_native_1.Text style={styles.simDetailLabel}>Razorpay Order ID</react_native_1.Text>
                <react_native_1.Text style={[styles.simDetailVal, { color: theme.text }]}>{activeRazorpayOrderId}</react_native_1.Text>
              </react_native_1.View>
              <react_native_1.View style={styles.simDetailRow}>
                <react_native_1.Text style={styles.simDetailLabel}>Selected Method</react_native_1.Text>
                <react_native_1.Text style={[styles.simDetailVal, { color: theme.text, textTransform: 'uppercase' }]}>{selectedMethod}</react_native_1.Text>
              </react_native_1.View>
            </react_native_1.View>

            <react_native_1.View style={styles.secureBadgeRow}>
              <vector_icons_1.Ionicons name="lock-closed" size={14} color="#64748b"/>
              <react_native_1.Text style={styles.secureBadgeText}>128-bit SSL Secured Encryption by Razorpay</react_native_1.Text>
            </react_native_1.View>

            {/* Authorize/Decline Action Buttons */}
            <react_native_1.View style={{ gap: 12, marginTop: 10 }}>
              <react_native_1.TouchableOpacity style={styles.simPayBtn} onPress={confirmPayment}>
                <react_native_1.Text style={styles.simPayBtnText}>Authorize & Confirm Payment</react_native_1.Text>
              </react_native_1.TouchableOpacity>

              <react_native_1.TouchableOpacity style={styles.simDeclineBtn} onPress={cancelPayment}>
                <react_native_1.Text style={styles.simDeclineBtnText}>Cancel / Decline Transaction</react_native_1.Text>
              </react_native_1.TouchableOpacity>
            </react_native_1.View>
          </react_native_1.ScrollView>
        </react_native_1.View>) : paymentStatus === 'success' ? (<react_native_1.View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: theme.bg }}>
          <react_native_1.View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(16, 185, 129, 0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <vector_icons_1.Ionicons name="checkmark-circle" size={64} color="#10b981"/>
          </react_native_1.View>
          <react_native_1.Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.text, marginBottom: 12, textAlign: 'center' }}>
            Payment Successful!
          </react_native_1.Text>
          <react_native_1.Text style={{ fontSize: 15, color: theme.textMuted, textAlign: 'center', marginBottom: 32, paddingHorizontal: 16 }}>
            Your slot has been secured. A confirmation message has been sent to your registered number.
          </react_native_1.Text>

          <react_native_1.View style={[styles.simDetailsBox, { width: '100%', backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1, padding: 20, marginBottom: 40 }]}>
            <react_native_1.View style={styles.simDetailRow}>
              <react_native_1.Text style={styles.simDetailLabel}>Booking ID</react_native_1.Text>
              <react_native_1.Text style={[styles.simDetailVal, { color: theme.text }]}>{activeBookingId}</react_native_1.Text>
            </react_native_1.View>
            <react_native_1.View style={styles.simDetailRow}>
              <react_native_1.Text style={styles.simDetailLabel}>Turf</react_native_1.Text>
              <react_native_1.Text style={[styles.simDetailVal, { color: theme.text }]}>{turf.name}</react_native_1.Text>
            </react_native_1.View>
            <react_native_1.View style={styles.simDetailRow}>
              <react_native_1.Text style={styles.simDetailLabel}>Time Slot</react_native_1.Text>
              <react_native_1.Text style={[styles.simDetailVal, { color: theme.text }]}>{params.time}</react_native_1.Text>
            </react_native_1.View>
            <react_native_1.View style={styles.simDetailRow}>
              <react_native_1.Text style={styles.simDetailLabel}>Paid Amount</react_native_1.Text>
              <react_native_1.Text style={[styles.simDetailVal, { color: '#10b981', fontWeight: 'bold' }]}>{(0, utils_1.formatCurrency)(amountToPay)}</react_native_1.Text>
            </react_native_1.View>
            {payOption === 'advance' && (<react_native_1.View style={styles.simDetailRow}>
                <react_native_1.Text style={styles.simDetailLabel}>Dues at Venue</react_native_1.Text>
                <react_native_1.Text style={[styles.simDetailVal, { color: '#ef4444', fontWeight: 'bold' }]}>{(0, utils_1.formatCurrency)(finalTotal - advanceTotal)}</react_native_1.Text>
              </react_native_1.View>)}
          </react_native_1.View>

          <react_native_1.TouchableOpacity style={{ width: '100%', backgroundColor: '#10b981', paddingVertical: 15, borderRadius: 12, alignItems: 'center' }} onPress={() => router.replace({ pathname: '/', params: { tab: 'bookings' } })}>
            <react_native_1.Text style={{ color: '#020617', fontWeight: 'bold', fontSize: 16 }}>Go to Bookings</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>) : paymentStatus === 'failed' ? (<react_native_1.View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: theme.bg }}>
          <react_native_1.View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(239, 68, 68, 0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <vector_icons_1.Ionicons name="close-circle" size={64} color="#ef4444"/>
          </react_native_1.View>
          <react_native_1.Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.text, marginBottom: 12, textAlign: 'center' }}>
            Payment Failed
          </react_native_1.Text>
          <react_native_1.Text style={{ fontSize: 14, color: '#ef4444', textAlign: 'center', marginBottom: 32, paddingHorizontal: 16, fontWeight: '600' }}>
            {errorMessage || 'Something went wrong while authenticating your payment.'}
          </react_native_1.Text>

          <react_native_1.View style={[styles.simDetailsBox, { width: '100%', backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1, padding: 20, marginBottom: 40 }]}>
            <react_native_1.Text style={{ fontSize: 13, fontWeight: 'bold', color: theme.text, marginBottom: 12 }}>Troubleshooting Tips:</react_native_1.Text>
            <react_native_1.Text style={{ fontSize: 12, color: theme.textMuted, marginBottom: 6 }}>• Ensure you have sufficient balance in your account.</react_native_1.Text>
            <react_native_1.Text style={{ fontSize: 12, color: theme.textMuted, marginBottom: 6 }}>• Double-check your UPI ID and PIN credentials.</react_native_1.Text>
            <react_native_1.Text style={{ fontSize: 12, color: theme.textMuted }}>• Do not close the app during gateway authentication.</react_native_1.Text>
          </react_native_1.View>

          <react_native_1.TouchableOpacity style={{ width: '100%', backgroundColor: '#ef4444', paddingVertical: 15, borderRadius: 12, alignItems: 'center' }} onPress={() => setPaymentStatus('idle')}>
            <react_native_1.Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 16 }}>Try Again</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>) : (<react_native_1.ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Booking Summary Card */}
          <react_native_1.View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <react_native_1.Text style={styles.sectionLabel}>BOOKING DETAILS</react_native_1.Text>
            <react_native_1.Text style={[styles.turfName, { color: theme.text }]}>{turf.name}</react_native_1.Text>
            <react_native_1.Text style={[styles.areaText, { color: theme.textMuted }]}>
              <vector_icons_1.Ionicons name="location-outline" size={12} color={theme.textMuted}/> {turf.area}
            </react_native_1.Text>

            <react_native_1.View style={styles.dividerThin}/>

            <react_native_1.View style={styles.metaGrid}>
              <react_native_1.View style={styles.metaItem}>
                <vector_icons_1.Ionicons name="calendar-outline" size={15} color="#10b981"/>
                <react_native_1.Text style={[styles.metaVal, { color: theme.text }]}>{formatDate(params.date)}</react_native_1.Text>
              </react_native_1.View>
              <react_native_1.View style={styles.metaItem}>
                <vector_icons_1.Ionicons name="time-outline" size={15} color="#10b981"/>
                <react_native_1.Text style={[styles.metaVal, { color: theme.text }]}>{params.time}</react_native_1.Text>
              </react_native_1.View>
            </react_native_1.View>

            <react_native_1.View style={styles.metaGrid}>
              <react_native_1.View style={styles.metaItem}>
                <vector_icons_1.MaterialCommunityIcons name="soccer" size={15} color="#10b981"/>
                <react_native_1.Text style={[styles.metaVal, { color: theme.text }]}>{params.court}</react_native_1.Text>
              </react_native_1.View>
              <react_native_1.View style={styles.metaItem}>
                <vector_icons_1.Ionicons name="ribbon-outline" size={15} color="#10b981"/>
                <react_native_1.Text style={[styles.metaVal, { color: theme.text }]}>{params.sport}</react_native_1.Text>
              </react_native_1.View>
            </react_native_1.View>
          </react_native_1.View>

          {/* Payment Option Selection (Full vs Advance) */}
          <react_native_1.Text style={[styles.sectionHeader, { color: theme.text, marginTop: 24, marginBottom: 8 }]}>Select Payment Option</react_native_1.Text>
          <react_native_1.View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            <react_native_1.TouchableOpacity style={{
                flex: 1,
                backgroundColor: payOption === 'full' ? 'rgba(16, 185, 129, 0.08)' : theme.card,
                borderColor: payOption === 'full' ? '#10b981' : theme.border,
                borderWidth: 1.5,
                borderRadius: 16,
                padding: 16,
                alignItems: 'center',
                justifyContent: 'center',
            }} onPress={() => setPayOption('full')}>
              <vector_icons_1.Ionicons name="card" size={20} color={payOption === 'full' ? '#10b981' : theme.textMuted} style={{ marginBottom: 6 }}/>
              <react_native_1.Text style={{ fontSize: 13, fontWeight: 'bold', color: theme.text }}>Full Payment</react_native_1.Text>
              <react_native_1.Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>{(0, utils_1.formatCurrency)(finalTotal)}</react_native_1.Text>
            </react_native_1.TouchableOpacity>

            <react_native_1.TouchableOpacity style={{
                flex: 1,
                backgroundColor: payOption === 'advance' ? 'rgba(16, 185, 129, 0.08)' : theme.card,
                borderColor: payOption === 'advance' ? '#10b981' : theme.border,
                borderWidth: 1.5,
                borderRadius: 16,
                padding: 16,
                alignItems: 'center',
                justifyContent: 'center',
            }} onPress={() => setPayOption('advance')}>
              <vector_icons_1.Ionicons name="sparkles" size={20} color={payOption === 'advance' ? '#10b981' : theme.textMuted} style={{ marginBottom: 6 }}/>
              <react_native_1.Text style={{ fontSize: 13, fontWeight: 'bold', color: theme.text }}>Pay Advance (30%)</react_native_1.Text>
              <react_native_1.Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>{(0, utils_1.formatCurrency)(advanceTotal)}</react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>


          {/* Payment Methods */}
          <react_native_1.Text style={[styles.sectionHeader, { color: theme.text }]}>Select Payment Method</react_native_1.Text>

          <react_native_1.View style={styles.methodsWrapper}>
            {/* UPI Option */}
            <react_native_1.TouchableOpacity style={[
                styles.methodCard,
                { backgroundColor: theme.card, borderColor: selectedMethod === 'upi' ? '#10b981' : theme.border },
            ]} onPress={() => setSelectedMethod('upi')}>
              <react_native_1.View style={styles.methodLeft}>
                <vector_icons_1.MaterialCommunityIcons name="flash-outline" size={24} color="#10b981"/>
                <react_native_1.View>
                  <react_native_1.Text style={[styles.methodTitle, { color: theme.text }]}>UPI Apps</react_native_1.Text>
                  <react_native_1.Text style={[styles.methodDesc, { color: theme.textMuted }]}>Google Pay, PhonePe, Paytm</react_native_1.Text>
                </react_native_1.View>
              </react_native_1.View>
              <react_native_1.View style={[styles.radioOuter, { borderColor: selectedMethod === 'upi' ? '#10b981' : '#64748b' }]}>
                {selectedMethod === 'upi' && <react_native_1.View style={styles.radioInner}/>}
              </react_native_1.View>
            </react_native_1.TouchableOpacity>

            {/* Expanded UPI Apps Panel */}
            {selectedMethod === 'upi' && (<react_native_1.View style={[styles.expandedUpiContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <react_native_1.Text style={[styles.subSectionHeader, { color: theme.text }]}>Select Preferred App</react_native_1.Text>
                <react_native_1.View style={styles.upiAppsRow}>
                  {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => {
                    const isAppSel = selectedUpiApp === app;
                    let appIconName = 'google';
                    let appIconColor = '#4285F4';
                    if (app === 'PhonePe') {
                        appIconName = 'wallet';
                        appIconColor = '#673ab7';
                    }
                    else if (app === 'Paytm') {
                        appIconName = 'credit-card-outline';
                        appIconColor = '#00baf2';
                    }
                    else if (app === 'BHIM') {
                        appIconName = 'bank';
                        appIconColor = '#e11d48';
                    }
                    return (<react_native_1.TouchableOpacity key={app} style={[
                            styles.upiAppChip,
                            {
                                borderColor: isAppSel ? '#10b981' : theme.border,
                                backgroundColor: isAppSel ? 'rgba(16, 185, 129, 0.08)' : (isDarkMode ? 'rgba(15, 23, 42, 0.3)' : '#f1f5f9'),
                            },
                        ]} onPress={() => {
                            setSelectedUpiApp(app);
                            setUpiId(''); // Clear custom ID when app selected
                        }}>
                        <vector_icons_1.MaterialCommunityIcons name={appIconName} size={20} color={appIconColor} style={{ marginRight: 6 }}/>
                        <react_native_1.Text style={[styles.upiAppText, { color: theme.text }]}>{app}</react_native_1.Text>
                      </react_native_1.TouchableOpacity>);
                })}
                </react_native_1.View>

                <react_native_1.View style={styles.orRow}>
                  <react_native_1.View style={[styles.orLine, { backgroundColor: theme.border }]}/>
                  <react_native_1.Text style={[styles.orText, { color: theme.textMuted }]}>OR ENTER UPI ID</react_native_1.Text>
                  <react_native_1.View style={[styles.orLine, { backgroundColor: theme.border }]}/>
                </react_native_1.View>

                <react_native_1.View style={[styles.upiInputBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                  <react_native_1.TextInput value={upiId} onChangeText={(val) => {
                    setUpiId(val);
                    setSelectedUpiApp(null); // Clear selected app chip
                }} placeholder="Enter UPI ID (e.g. user@okaxis)" placeholderTextColor={theme.textMuted} style={[styles.upiTextEntry, { color: theme.text }]} autoCapitalize="none" autoCorrect={false}/>
                  {upiId.includes('@') && (<react_native_1.Text style={styles.upiValidTag}>Valid ID</react_native_1.Text>)}
                </react_native_1.View>
              </react_native_1.View>)}

            {/* Cards Option */}
            <react_native_1.TouchableOpacity style={[
                styles.methodCard,
                { backgroundColor: theme.card, borderColor: selectedMethod === 'card' ? '#10b981' : theme.border },
            ]} onPress={() => setSelectedMethod('card')}>
              <react_native_1.View style={styles.methodLeft}>
                <vector_icons_1.Ionicons name="card-outline" size={24} color="#10b981"/>
                <react_native_1.View>
                  <react_native_1.Text style={[styles.methodTitle, { color: theme.text }]}>Credit / Debit Card</react_native_1.Text>
                  <react_native_1.Text style={[styles.methodDesc, { color: theme.textMuted }]}>Visa, MasterCard, RuPay</react_native_1.Text>
                </react_native_1.View>
              </react_native_1.View>
              <react_native_1.View style={[styles.radioOuter, { borderColor: selectedMethod === 'card' ? '#10b981' : '#64748b' }]}>
                {selectedMethod === 'card' && <react_native_1.View style={styles.radioInner}/>}
              </react_native_1.View>
            </react_native_1.TouchableOpacity>

            {/* Netbanking Option */}
            <react_native_1.TouchableOpacity style={[
                styles.methodCard,
                { backgroundColor: theme.card, borderColor: selectedMethod === 'net' ? '#10b981' : theme.border },
            ]} onPress={() => setSelectedMethod('net')}>
              <react_native_1.View style={styles.methodLeft}>
                <vector_icons_1.Ionicons name="business-outline" size={24} color="#10b981"/>
                <react_native_1.View>
                  <react_native_1.Text style={[styles.methodTitle, { color: theme.text }]}>Net Banking</react_native_1.Text>
                  <react_native_1.Text style={[styles.methodDesc, { color: theme.textMuted }]}>All major Indian banks</react_native_1.Text>
                </react_native_1.View>
              </react_native_1.View>
              <react_native_1.View style={[styles.radioOuter, { borderColor: selectedMethod === 'net' ? '#10b981' : '#64748b' }]}>
                {selectedMethod === 'net' && <react_native_1.View style={styles.radioInner}/>}
              </react_native_1.View>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>

          {/* Pricing Breakdown Sheet */}
          <react_native_1.View style={[styles.breakdownCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <react_native_1.View style={styles.breakdownRow}>
              <react_native_1.Text style={[styles.breakdownLabel, { color: theme.textMuted }]}>Slot Charge</react_native_1.Text>
              <react_native_1.Text style={[styles.breakdownVal, { color: theme.text }]}>{(0, utils_1.formatCurrency)(basePrice)}</react_native_1.Text>
            </react_native_1.View>
            <react_native_1.View style={styles.breakdownRow}>
              <react_native_1.Text style={[styles.breakdownLabel, { color: theme.textMuted }]}>Convenience Fee</react_native_1.Text>
              <react_native_1.Text style={[styles.breakdownVal, { color: theme.text }]}>{(0, utils_1.formatCurrency)(convenienceFee)}</react_native_1.Text>
            </react_native_1.View>


            {payOption === 'advance' && (<>
                <react_native_1.View style={styles.breakdownRow}>
                  <react_native_1.Text style={[styles.breakdownLabel, { color: theme.textMuted }]}>Booking Total</react_native_1.Text>
                  <react_native_1.Text style={[styles.breakdownVal, { color: theme.text, fontWeight: 'bold' }]}>{(0, utils_1.formatCurrency)(finalTotal)}</react_native_1.Text>
                </react_native_1.View>
                <react_native_1.View style={styles.breakdownRow}>
                  <react_native_1.Text style={styles.discountLabel}>Due Offline at Venue</react_native_1.Text>
                  <react_native_1.Text style={[styles.discountVal, { color: '#ef4444' }]}>{(0, utils_1.formatCurrency)(finalTotal - advanceTotal)}</react_native_1.Text>
                </react_native_1.View>
              </>)}

            <react_native_1.View style={styles.dividerThin}/>

            <react_native_1.View style={styles.breakdownRow}>
              <react_native_1.Text style={[styles.totalLabel, { color: theme.text }]}>
                {payOption === 'advance' ? 'Amount to Pay Now' : 'Grand Total'}
              </react_native_1.Text>
              <react_native_1.Text style={[styles.totalVal, { color: theme.text }]}>{(0, utils_1.formatCurrency)(amountToPay)}</react_native_1.Text>
            </react_native_1.View>
          </react_native_1.View>

          {/* Pay Button */}
          <react_native_1.TouchableOpacity style={styles.payBtn} onPress={handlePayment}>
            <vector_icons_1.Ionicons name="lock-closed" size={16} color="#020617" style={{ marginRight: 6 }}/>
            <react_native_1.Text style={styles.payBtnText}>Pay Securely {(0, utils_1.formatCurrency)(amountToPay)}</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.ScrollView>)}
    </react_native_1.View>);
}
const styles = react_native_1.StyleSheet.create({
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
        paddingTop: react_native_1.Platform.OS === 'ios' ? 120 : 100,
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
        paddingTop: react_native_1.Platform.OS === 'ios' ? 50 : 25,
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
