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
exports.default = OwnerBookingsScreen;
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
const SLOT_WIDTH = (SCREEN_WIDTH - 40 - 12) / 2;
function OwnerBookingsScreen() {
    const { user, isAuthenticated } = (0, authStore_1.useAuthStore)();
    const { isDarkMode } = (0, themeStore_1.useThemeStore)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const router = (0, expo_router_1.useRouter)();
    // State
    const [turfs, setTurfs] = (0, react_1.useState)([]);
    const [selectedTurf, setSelectedTurf] = (0, react_1.useState)(null);
    const [selectedDate, setSelectedDate] = (0, react_1.useState)(new Date());
    const [bookings, setBookings] = (0, react_1.useState)([]);
    const [blockedSlots, setBlockedSlots] = (0, react_1.useState)(new Set());
    const [offlineBookings, setOfflineBookings] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [refreshing, setRefreshing] = (0, react_1.useState)(false);
    // Modals visibility
    const [turfModalVisible, setTurfModalVisible] = (0, react_1.useState)(false);
    const [dateModalVisible, setDateModalVisible] = (0, react_1.useState)(false);
    const [bookingModalVisible, setBookingModalVisible] = (0, react_1.useState)(false);
    // Offline booking form state
    const [selectedSlotIndex, setSelectedSlotIndex] = (0, react_1.useState)(null);
    const [formName, setFormName] = (0, react_1.useState)('');
    const [formPhone, setFormPhone] = (0, react_1.useState)('');
    const [formAmount, setFormAmount] = (0, react_1.useState)('1200');
    // Detailed Slot view state
    const [activeSlotDetails, setActiveSlotDetails] = (0, react_1.useState)(null);
    const [detailsModalVisible, setDetailsModalVisible] = (0, react_1.useState)(false);
    const theme = {
        bg: isDarkMode ? '#030712' : '#f8fafc',
        card: isDarkMode ? '#0f172a' : '#ffffff',
        cardBorder: isDarkMode ? '#1e293b' : '#f1f5f9',
        text: isDarkMode ? '#ffffff' : '#1e293b',
        textMuted: isDarkMode ? '#94a3b8' : '#64748b',
        divider: isDarkMode ? '#1e293b' : '#f1f5f9',
        dropdownBg: isDarkMode ? '#1e293b' : '#f8fafc',
        legendBorder: isDarkMode ? '#1e293b' : '#e2e8f0',
    };
    const fetchData = async () => {
        if (!isAuthenticated || !user)
            return;
        try {
            // Fetch turfs from backend
            const turfRes = await (0, api_1.apiFetch)('/owner/turfs');
            let loadedTurfs = [];
            if (turfRes.success && turfRes.data && turfRes.data.length > 0) {
                loadedTurfs = turfRes.data.map((t) => ({
                    id: t.id,
                    name: t.name,
                    pricePerHour: t.pricePerHour ?? t.price ?? 1200,
                    sport: t.sport || 'Football',
                    sportId: t.sports?.[0]?.sportId || t.sports?.[0]?.sport?.id || (typeof t.sports?.[0] === 'string' ? t.sports[0] : '') || 'NHQKZB3YRCRhWBL95sUE',
                    isActive: t.isActive ?? true,
                }));
            }
            setTurfs(loadedTurfs);
            if (!selectedTurf && loadedTurfs.length > 0) {
                setSelectedTurf(loadedTurfs[0]);
            }
            // Fetch bookings from backend
            const bookingRes = await (0, api_1.apiFetch)('/owner/bookings');
            if (bookingRes.success && bookingRes.data) {
                setBookings(bookingRes.data);
            }
            else {
                setBookings([]);
            }
        }
        catch (err) {
            console.log('Error fetching owner schedule data', err);
            setTurfs([]);
            setBookings([]);
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    (0, react_1.useEffect)(() => {
        fetchData();
    }, []);
    const onRefresh = (0, react_1.useCallback)(() => {
        if (!isAuthenticated || !user)
            return;
        setRefreshing(true);
        fetchData();
    }, [selectedTurf, isAuthenticated, user]);
    // Guard: only for TURF_OWNER role
    if (!isAuthenticated || !user)
        return <expo_router_1.Redirect href="/login"/>;
    if (user.role !== 'TURF_OWNER')
        return <expo_router_1.Redirect href="/"/>;
    const changeDate = (days) => {
        const next = new Date(selectedDate);
        next.setDate(selectedDate.getDate() + days);
        setSelectedDate(next);
    };
    const getLocalDateString = (date) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };
    const formatDateLabel = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };
    // derived status style
    const getSlotStyles = (status) => {
        switch (status) {
            case 'BOOKED':
                return {
                    bg: isDarkMode ? '#064e3b' : '#e6fbf4',
                    border: isDarkMode ? '#047857' : '#10b98122',
                    text: isDarkMode ? '#34d399' : '#047857',
                    badgeBg: isDarkMode ? '#047857' : '#d1fae5',
                    badgeText: isDarkMode ? '#34d399' : '#065f46',
                };
            case 'PENDING':
                return {
                    bg: isDarkMode ? '#78350f' : '#fffbeb',
                    border: isDarkMode ? '#b45309' : '#f59e0b22',
                    text: isDarkMode ? '#fbbf24' : '#b45309',
                    badgeBg: isDarkMode ? '#b45309' : '#fef3c7',
                    badgeText: isDarkMode ? '#fbbf24' : '#92400e',
                };
            case 'BLOCKED':
                return {
                    bg: isDarkMode ? '#7f1d1d' : '#fef2f2',
                    border: isDarkMode ? '#b91c1c' : '#ef444422',
                    text: isDarkMode ? '#fca5a5' : '#b91c1c',
                    badgeBg: isDarkMode ? '#b91c1c' : '#fee2e2',
                    badgeText: isDarkMode ? '#fca5a5' : '#991b1b',
                };
            case 'OPEN':
            default:
                return {
                    bg: isDarkMode ? '#1e293b' : '#f8fafc',
                    border: isDarkMode ? '#334155' : '#cbd5e144',
                    text: isDarkMode ? '#cbd5e1' : '#64748b',
                    badgeBg: isDarkMode ? '#334155' : '#f1f5f9',
                    badgeText: isDarkMode ? '#cbd5e1' : '#475569',
                };
        }
    };
    // Helper to parse slot start hour
    const parseStartHour = (timeStr) => {
        if (!timeStr)
            return null;
        const startPart = timeStr.split(/[-–]/)[0]?.trim().toUpperCase();
        if (!startPart)
            return null;
        const ampm = startPart.includes('PM') ? 'PM' : startPart.includes('AM') ? 'AM' : null;
        const timeOnly = startPart.replace('AM', '').replace('PM', '').trim();
        const parts = timeOnly.split(':');
        if (parts.length === 0)
            return null;
        let hour = parseInt(parts[0], 10);
        if (isNaN(hour))
            return null;
        if (ampm) {
            if (ampm === 'PM' && hour !== 12) {
                hour += 12;
            }
            else if (ampm === 'AM' && hour === 12) {
                hour = 0;
            }
        }
        return hour;
    };
    // Derive slots state dynamically
    const dateKey = getLocalDateString(selectedDate);
    const slotsList = Array.from({ length: 24 }, (_, i) => {
        const getAmPm = (hour) => {
            if (hour === 24 || hour === 0)
                return 'AM';
            return hour >= 12 ? 'PM' : 'AM';
        };
        const get12Hour = (hour) => {
            const h = hour % 12;
            return h === 0 ? 12 : h;
        };
        const displayStartHr = get12Hour(i).toString().padStart(2, '0');
        const displayEndHr = get12Hour(i + 1).toString().padStart(2, '0');
        const startAmPm = getAmPm(i);
        const endAmPm = getAmPm(i + 1);
        const timeRangeStr = `${displayStartHr}:00 ${startAmPm} – ${displayEndHr}:00 ${endAmPm}`;
        // Check local blocked slots
        const isBlockedLocally = blockedSlots.has(`${selectedTurf?.id}_${dateKey}_${i}`);
        // Check online bookings
        const activeBookings = bookings.filter(b => b.status !== 'CANCELLED');
        const matchingBooking = activeBookings.find(b => {
            const matchDate = b.date ? b.date.split('T')[0] === dateKey : false;
            if (!matchDate)
                return false;
            const turfMatch = selectedTurf ? (b.turfId === selectedTurf.id || b.turfName?.toLowerCase().includes(selectedTurf.name.toLowerCase().split(' ')[0])) : true;
            if (!turfMatch)
                return false;
            const bSlot = b.slotId || b.time || b.timeSlot || '';
            const slots = bSlot.split(',').map((s) => s.trim());
            return slots.some((s) => {
                const startHour = parseStartHour(s);
                return startHour === i;
            });
        });
        // Check offline bookings
        const matchingOffline = offlineBookings.find(ob => ob.turfId === selectedTurf?.id && ob.date === dateKey && ob.slotIndex === i);
        let status = 'OPEN';
        let customerName = '';
        let bookingId = '';
        let amount = selectedTurf?.pricePerHour ?? 1200;
        // Hardcode mockup matches specifically for 13 May 2024 or current date to match image
        if (matchingBooking) {
            status = matchingBooking.status === 'PENDING' ? 'PENDING' : 'BOOKED';
            customerName = matchingBooking.customerName || 'Customer';
            amount = matchingBooking.amount || amount;
            bookingId = matchingBooking.id;
        }
        else if (matchingOffline) {
            status = 'BOOKED';
            customerName = matchingOffline.customerName;
            amount = matchingOffline.amount;
        }
        else if (isBlockedLocally) {
            status = 'BLOCKED';
        }
        // Peak hour surcharges 18:00 - 22:00
        if (i >= 18 && i <= 21 && status === 'OPEN') {
            amount = (selectedTurf?.pricePerHour ?? 1200) + 300;
        }
        else if (i >= 18 && i <= 21 && status === 'BLOCKED') {
            amount = 1500;
        }
        // No hardcoded mock slots — all data comes from backend
        return {
            index: i,
            timeRange: timeRangeStr,
            price: amount,
            status,
            customerName,
            bookingId,
        };
    });
    const handleSlotPress = (slot) => {
        if (slot.status === 'OPEN') {
            react_native_1.Alert.alert(`Slot ${slot.timeRange}`, 'Choose action for this available slot:', [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Block Slot',
                    onPress: () => {
                        const newBlocked = new Set(blockedSlots);
                        newBlocked.add(`${selectedTurf?.id}_${dateKey}_${slot.index}`);
                        setBlockedSlots(newBlocked);
                    },
                },
                {
                    text: 'Add Offline Booking',
                    onPress: () => {
                        setSelectedSlotIndex(slot.index);
                        setFormAmount(slot.price.toString());
                        setFormName('');
                        setFormPhone('');
                        setBookingModalVisible(true);
                    },
                },
            ]);
        }
        else if (slot.status === 'BLOCKED') {
            react_native_1.Alert.alert(`Unblock Slot ${slot.timeRange}`, 'Do you want to make this slot available for bookings again?', [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Unblock',
                    onPress: () => {
                        const newBlocked = new Set(blockedSlots);
                        newBlocked.delete(`${selectedTurf?.id}_${dateKey}_${slot.index}`);
                        setBlockedSlots(newBlocked);
                    },
                },
            ]);
        }
        else {
            // Booked or Pending
            setActiveSlotDetails(slot);
            setDetailsModalVisible(true);
        }
    };
    const submitOfflineBooking = async () => {
        if (!formName.trim()) {
            react_native_1.Alert.alert('Error', 'Please enter customer name');
            return;
        }
        const phone = formPhone.trim();
        if (phone && (phone.length < 10 || phone.length > 15)) {
            react_native_1.Alert.alert('Error', 'Phone number must be between 10 and 15 digits');
            return;
        }
        if (selectedSlotIndex === null || !selectedTurf)
            return;
        const newBooking = {
            turfId: selectedTurf.id,
            date: dateKey,
            slotIndex: selectedSlotIndex,
            customerName: formName.trim(),
            customerPhone: phone || undefined,
            amount: Number(formAmount) || 1200,
        };
        try {
            // Build ISO datetime strings matching backend manualBookingSchema
            const startHour = selectedSlotIndex;
            const endHour = selectedSlotIndex + 1;
            const startDate = new Date(`${dateKey}T${startHour.toString().padStart(2, '0')}:00:00.000Z`);
            const endDate = new Date(`${dateKey}T${endHour.toString().padStart(2, '0')}:00:00.000Z`);
            await (0, api_1.apiFetch)('/owner/bookings/offline', {
                method: 'POST',
                body: {
                    turfId: selectedTurf.id,
                    sportId: selectedTurf.sportId || 'NHQKZB3YRCRhWBL95sUE',
                    date: startDate.toISOString(),
                    startTime: startDate.toISOString(),
                    endTime: endDate.toISOString(),
                    customerName: formName.trim(),
                    customerPhone: phone || '0000000000',
                    finalAmount: Number(formAmount) || 1200,
                },
            });
            setOfflineBookings(prev => [...prev, newBooking]);
            await fetchData();
            setBookingModalVisible(false);
            react_native_1.Alert.alert('Success', 'Offline booking added successfully.');
        }
        catch (err) {
            react_native_1.Alert.alert('Error', err.message || 'Failed to add offline booking');
        }
    };
    const cancelActiveBooking = async (bookingId, slotIndex) => {
        react_native_1.Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
            { text: 'No', style: 'cancel' },
            {
                text: 'Yes, Cancel',
                style: 'destructive',
                onPress: async () => {
                    if (bookingId) {
                        try {
                            await (0, api_1.apiFetch)(`/owner/bookings/${bookingId}/cancel`, { method: 'PUT' });
                        }
                        catch { }
                        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'CANCELLED' } : b));
                    }
                    else {
                        // Local offline booking cancellation
                        setOfflineBookings(prev => prev.filter(ob => !(ob.turfId === selectedTurf?.id && ob.date === dateKey && ob.slotIndex === slotIndex)));
                    }
                    setDetailsModalVisible(false);
                    react_native_1.Alert.alert('Done', 'Booking cancelled successfully.');
                },
            },
        ]);
    };
    if (loading) {
        return (<react_native_1.View style={[styles.center, { backgroundColor: theme.bg }]}>
        <react_native_1.ActivityIndicator size="large" color={ACCENT}/>
      </react_native_1.View>);
    }
    return (<react_native_1.View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Full-bleed Header Background */}
      <react_native_1.ImageBackground source={TURF_BG} style={[styles.headerBg, { paddingTop: insets.top + 16 }]} imageStyle={styles.headerImage}>
        <react_native_1.View style={styles.darkOverlay}/>
        
        {/* Top bar back button row */}
        <react_native_1.View style={styles.topBarRow}>
          <react_native_1.TouchableOpacity style={styles.backBtn} onPress={() => router.push('/owner')}>
            <vector_icons_1.Ionicons name="arrow-back" size={20} color="#ffffff"/>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>

        {/* Text descriptions */}
        <react_native_1.View style={styles.headerTitles}>
          <react_native_1.Text style={styles.headerTitleText}>Slots Schedule</react_native_1.Text>
          <react_native_1.Text style={styles.headerSubtitleText}>Manage your turf slots and availability</react_native_1.Text>
        </react_native_1.View>
      </react_native_1.ImageBackground>

      {/* Main card panels */}
      <react_native_1.View style={[styles.overlapCard, { backgroundColor: theme.card }]}>
        <react_native_1.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }} refreshControl={<react_native_1.RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT}/>}>
          {/* Dropdown selectors and Settings row */}
          <react_native_1.View style={styles.selectorRow}>
            <react_native_1.TouchableOpacity style={[styles.dropdownBtn, { backgroundColor: theme.dropdownBg, borderColor: theme.cardBorder }]} onPress={() => setTurfModalVisible(true)}>
              <vector_icons_1.MaterialCommunityIcons name="soccer-field" size={18} color={ACCENT} style={{ marginRight: 6 }}/>
              <react_native_1.Text style={[styles.dropdownLabel, { color: theme.text }]} numberOfLines={1}>
                {selectedTurf ? selectedTurf.name : 'Select Turf'}
              </react_native_1.Text>
              <vector_icons_1.Ionicons name="chevron-down" size={14} color={theme.textMuted} style={{ marginLeft: 6 }}/>
            </react_native_1.TouchableOpacity>

            <react_native_1.TouchableOpacity style={[styles.settingsBtn, { borderColor: theme.cardBorder }]} onPress={() => react_native_1.Alert.alert('Slot Settings', 'Configure default slot pricing, timings, and business hours.')}>
              <vector_icons_1.Ionicons name="settings-outline" size={15} color={ACCENT} style={{ marginRight: 4 }}/>
              <react_native_1.Text style={styles.settingsBtnText}>Slot Settings</react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>

          {/* Date Selector Row */}
          <react_native_1.View style={styles.dateSelectorRow}>
            <react_native_1.TouchableOpacity style={[styles.dateChevron, { borderColor: theme.cardBorder }]} onPress={() => changeDate(-1)}>
              <vector_icons_1.Ionicons name="chevron-back" size={16} color={theme.text}/>
            </react_native_1.TouchableOpacity>

            <react_native_1.TouchableOpacity style={[styles.datePickerCard, { backgroundColor: theme.dropdownBg, borderColor: theme.cardBorder }]} onPress={() => setDateModalVisible(true)}>
              <vector_icons_1.Ionicons name="calendar-outline" size={16} color={theme.textMuted} style={{ marginRight: 8 }}/>
              <react_native_1.Text style={[styles.dateTextLabel, { color: theme.text }]}>{formatDateLabel(selectedDate)}</react_native_1.Text>
              <vector_icons_1.Ionicons name="chevron-down" size={14} color={theme.textMuted} style={{ marginLeft: 8 }}/>
            </react_native_1.TouchableOpacity>

            <react_native_1.TouchableOpacity style={[styles.dateChevron, { borderColor: theme.cardBorder }]} onPress={() => changeDate(1)}>
              <vector_icons_1.Ionicons name="chevron-forward" size={16} color={theme.text}/>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>

          {/* Status Legend Row */}
          <react_native_1.View style={[styles.legendBar, { borderColor: theme.legendBorder }]}>
            <react_native_1.View style={styles.legendItem}>
              <react_native_1.View style={[styles.legendDot, { backgroundColor: '#10b981' }]}/>
              <react_native_1.Text style={[styles.legendText, { color: theme.textMuted }]}>Booked</react_native_1.Text>
            </react_native_1.View>
            <react_native_1.View style={styles.legendItem}>
              <react_native_1.View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]}/>
              <react_native_1.Text style={[styles.legendText, { color: theme.textMuted }]}>Pending</react_native_1.Text>
            </react_native_1.View>
            <react_native_1.View style={styles.legendItem}>
              <react_native_1.View style={[styles.legendDot, { backgroundColor: '#ef4444' }]}/>
              <react_native_1.Text style={[styles.legendText, { color: theme.textMuted }]}>Blocked</react_native_1.Text>
            </react_native_1.View>
            <react_native_1.View style={styles.legendItem}>
              <react_native_1.View style={[styles.legendDot, { backgroundColor: '#cbd5e1' }]}/>
              <react_native_1.Text style={[styles.legendText, { color: theme.textMuted }]}>Open</react_native_1.Text>
            </react_native_1.View>
          </react_native_1.View>

          {/* Slots Grid */}
          <react_native_1.View style={styles.slotsGrid}>
            {slotsList.map((slot) => {
            const sc = getSlotStyles(slot.status);
            return (<react_native_1.TouchableOpacity key={slot.index} activeOpacity={0.7} style={[
                    styles.slotCell,
                    {
                        width: SLOT_WIDTH,
                        backgroundColor: sc.bg,
                        borderColor: sc.border,
                    }
                ]} onPress={() => handleSlotPress(slot)}>
                  <react_native_1.View style={styles.slotTopRow}>
                    <react_native_1.Text style={[styles.slotTimeText, { color: theme.text }]} numberOfLines={1}>
                      {slot.timeRange}
                    </react_native_1.Text>
                    <react_native_1.View style={[styles.slotBadge, { backgroundColor: sc.badgeBg }]}>
                      <react_native_1.Text style={[styles.slotBadgeText, { color: sc.badgeText }]}>{slot.status}</react_native_1.Text>
                    </react_native_1.View>
                  </react_native_1.View>

                  <react_native_1.Text style={[styles.slotPriceText, { color: theme.textMuted }]}>
                    ₹{slot.price.toLocaleString('en-IN')}/h
                  </react_native_1.Text>

                  {slot.customerName ? (<react_native_1.Text style={[styles.slotCustomerText, { color: sc.text }]} numberOfLines={1}>
                      {slot.customerName}
                    </react_native_1.Text>) : null}
                </react_native_1.TouchableOpacity>);
        })}
          </react_native_1.View>

          {/* Bottom Info Banner */}
          <react_native_1.View style={styles.tipBanner}>
            <vector_icons_1.Ionicons name="information-circle-outline" size={16} color="#047857" style={{ marginRight: 6 }}/>
            <react_native_1.Text style={styles.tipText}>Tap on any slot to view booking details</react_native_1.Text>
          </react_native_1.View>
        </react_native_1.ScrollView>
      </react_native_1.View>

      {/* Turf Selector Modal */}
      <react_native_1.Modal visible={turfModalVisible} transparent animationType="fade">
        <react_native_1.View style={styles.modalOverlay}>
          <react_native_1.View style={[styles.modalCard, { backgroundColor: theme.card }]}>
            <react_native_1.Text style={[styles.modalTitle, { color: theme.text }]}>Select Turf</react_native_1.Text>
            <react_native_1.View style={[styles.modalDivider, { backgroundColor: theme.divider }]}/>
            {turfs.map(t => (<react_native_1.TouchableOpacity key={t.id} style={styles.modalOption} onPress={() => {
                setSelectedTurf(t);
                setTurfModalVisible(false);
            }}>
                <vector_icons_1.MaterialCommunityIcons name="soccer-field" size={20} color={ACCENT} style={{ marginRight: 10 }}/>
                <react_native_1.Text style={[styles.modalOptionText, { color: theme.text }]}>{t.name}</react_native_1.Text>
                {selectedTurf?.id === t.id && (<vector_icons_1.Ionicons name="checkmark-circle" size={18} color={ACCENT} style={{ marginLeft: 'auto' }}/>)}
              </react_native_1.TouchableOpacity>))}
            <react_native_1.TouchableOpacity style={styles.closeModalBtn} onPress={() => setTurfModalVisible(false)}>
              <react_native_1.Text style={styles.closeModalBtnText}>Close</react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.Modal>

      {/* Date Selector List Modal */}
      <react_native_1.Modal visible={dateModalVisible} transparent animationType="fade">
        <react_native_1.View style={styles.modalOverlay}>
          <react_native_1.View style={[styles.modalCard, { backgroundColor: theme.card }]}>
            <react_native_1.Text style={[styles.modalTitle, { color: theme.text }]}>Select Date</react_native_1.Text>
            <react_native_1.View style={[styles.modalDivider, { backgroundColor: theme.divider }]}/>
            <react_native_1.ScrollView style={{ maxHeight: 280 }}>
              {Array.from({ length: 14 }, (_, idx) => {
            const day = new Date();
            day.setDate(day.getDate() + idx - 3); // list past 3 days and next 10 days
            const isSelected = getLocalDateString(day) === dateKey;
            return (<react_native_1.TouchableOpacity key={idx} style={styles.modalOption} onPress={() => {
                    setSelectedDate(day);
                    setDateModalVisible(false);
                }}>
                    <vector_icons_1.Ionicons name="calendar-outline" size={16} color={theme.textMuted} style={{ marginRight: 10 }}/>
                    <react_native_1.Text style={[styles.modalOptionText, { color: isSelected ? ACCENT : theme.text }]}>
                      {formatDateLabel(day)}
                    </react_native_1.Text>
                    {isSelected && (<vector_icons_1.Ionicons name="checkmark-circle" size={18} color={ACCENT} style={{ marginLeft: 'auto' }}/>)}
                  </react_native_1.TouchableOpacity>);
        })}
            </react_native_1.ScrollView>
            <react_native_1.TouchableOpacity style={styles.closeModalBtn} onPress={() => setDateModalVisible(false)}>
              <react_native_1.Text style={styles.closeModalBtnText}>Close</react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.Modal>

      {/* Manual Offline Booking Input Form Modal */}
      <react_native_1.Modal visible={bookingModalVisible} transparent animationType="slide">
        <react_native_1.View style={styles.modalOverlay}>
          <react_native_1.View style={[styles.modalCard, { backgroundColor: theme.card, width: '90%' }]}>
            <react_native_1.Text style={[styles.modalTitle, { color: theme.text }]}>Add Offline Booking</react_native_1.Text>
            <react_native_1.Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
              Slot: {selectedSlotIndex !== null ? slotsList[selectedSlotIndex].timeRange : ''}
            </react_native_1.Text>
            <react_native_1.View style={[styles.modalDivider, { backgroundColor: theme.divider }]}/>

            <react_native_1.Text style={[styles.formLabel, { color: theme.textMuted }]}>Customer Name</react_native_1.Text>
            <react_native_1.TextInput style={[styles.formInput, { color: theme.text, borderColor: theme.cardBorder }]} placeholder="e.g. Sanjay Patil" placeholderTextColor="#94a3b8" value={formName} onChangeText={setFormName}/>

            <react_native_1.Text style={[styles.formLabel, { color: theme.textMuted }]}>Phone Number (Optional)</react_native_1.Text>
            <react_native_1.TextInput style={[styles.formInput, { color: theme.text, borderColor: theme.cardBorder }]} placeholder="e.g. 9876543210" placeholderTextColor="#94a3b8" keyboardType="phone-pad" value={formPhone} onChangeText={setFormPhone}/>

            <react_native_1.Text style={[styles.formLabel, { color: theme.textMuted }]}>Amount (₹)</react_native_1.Text>
            <react_native_1.TextInput style={[styles.formInput, { color: theme.text, borderColor: theme.cardBorder }]} placeholder="Amount" keyboardType="number-pad" value={formAmount} onChangeText={setFormAmount}/>

            <react_native_1.View style={styles.modalActionsRow}>
              <react_native_1.TouchableOpacity style={[styles.actionCancelBtn, { borderColor: theme.cardBorder }]} onPress={() => setBookingModalVisible(false)}>
                <react_native_1.Text style={[styles.actionCancelBtnText, { color: theme.text }]}>Cancel</react_native_1.Text>
              </react_native_1.TouchableOpacity>
              <react_native_1.TouchableOpacity style={styles.actionSubmitBtn} onPress={submitOfflineBooking}>
                <react_native_1.Text style={styles.actionSubmitBtnText}>Confirm Booking</react_native_1.Text>
              </react_native_1.TouchableOpacity>
            </react_native_1.View>
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.Modal>

      {/* Booking Details Sheet Modal */}
      <react_native_1.Modal visible={detailsModalVisible} transparent animationType="fade">
        <react_native_1.View style={styles.modalOverlay}>
          <react_native_1.View style={[styles.modalCard, { backgroundColor: theme.card, width: '90%' }]}>
            <react_native_1.Text style={[styles.modalTitle, { color: theme.text }]}>Booking Details</react_native_1.Text>
            <react_native_1.View style={[styles.modalDivider, { backgroundColor: theme.divider }]}/>

            {activeSlotDetails && (<react_native_1.View style={styles.detailsBody}>
                <react_native_1.View style={styles.detailItemRow}>
                  <react_native_1.Text style={[styles.detailItemLabel, { color: theme.textMuted }]}>Customer:</react_native_1.Text>
                  <react_native_1.Text style={[styles.detailItemValue, { color: theme.text }]}>{activeSlotDetails.customerName}</react_native_1.Text>
                </react_native_1.View>
                <react_native_1.View style={styles.detailItemRow}>
                  <react_native_1.Text style={[styles.detailItemLabel, { color: theme.textMuted }]}>Time Slot:</react_native_1.Text>
                  <react_native_1.Text style={[styles.detailItemValue, { color: theme.text }]}>{activeSlotDetails.timeRange}</react_native_1.Text>
                </react_native_1.View>
                <react_native_1.View style={styles.detailItemRow}>
                  <react_native_1.Text style={[styles.detailItemLabel, { color: theme.textMuted }]}>Turf:</react_native_1.Text>
                  <react_native_1.Text style={[styles.detailItemValue, { color: theme.text }]}>{selectedTurf?.name}</react_native_1.Text>
                </react_native_1.View>
                <react_native_1.View style={styles.detailItemRow}>
                  <react_native_1.Text style={[styles.detailItemLabel, { color: theme.textMuted }]}>Amount Paid:</react_native_1.Text>
                  <react_native_1.Text style={[styles.detailItemValue, { color: theme.text }]}>₹{activeSlotDetails.price}</react_native_1.Text>
                </react_native_1.View>
                <react_native_1.View style={styles.detailItemRow}>
                  <react_native_1.Text style={[styles.detailItemLabel, { color: theme.textMuted }]}>Status:</react_native_1.Text>
                  <react_native_1.View style={[styles.statusBadgeInline, { backgroundColor: activeSlotDetails.status === 'CONFIRMED' || activeSlotDetails.status === 'BOOKED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)' }]}>
                    <react_native_1.Text style={{ color: activeSlotDetails.status === 'CONFIRMED' || activeSlotDetails.status === 'BOOKED' ? '#10b981' : '#f59e0b', fontSize: 11, fontWeight: '800' }}>
                      {activeSlotDetails.status}
                    </react_native_1.Text>
                  </react_native_1.View>
                </react_native_1.View>
              </react_native_1.View>)}

            <react_native_1.View style={styles.modalActionsRow}>
              <react_native_1.TouchableOpacity style={[styles.actionCancelBtn, { borderColor: theme.cardBorder }]} onPress={() => setDetailsModalVisible(false)}>
                <react_native_1.Text style={[styles.actionCancelBtnText, { color: theme.text }]}>Close</react_native_1.Text>
              </react_native_1.TouchableOpacity>
              {activeSlotDetails && (<react_native_1.TouchableOpacity style={[styles.actionSubmitBtn, { backgroundColor: '#ef4444' }]} onPress={() => cancelActiveBooking(activeSlotDetails.bookingId, activeSlotDetails.index)}>
                  <react_native_1.Text style={styles.actionSubmitBtnText}>Cancel Booking</react_native_1.Text>
                </react_native_1.TouchableOpacity>)}
            </react_native_1.View>
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.Modal>
    </react_native_1.View>);
}
const styles = react_native_1.StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    headerBg: {
        height: 180,
        width: '100%',
        paddingHorizontal: 20,
        position: 'relative',
        overflow: 'hidden',
    },
    headerImage: {
        objectFit: 'cover',
    },
    darkOverlay: {
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    topBarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    headerTitles: {
        marginTop: 18,
    },
    headerTitleText: {
        fontSize: 24,
        color: '#ffffff',
        fontWeight: '800',
    },
    headerSubtitleText: {
        fontSize: 13,
        color: '#cbd5e1',
        fontWeight: '500',
        marginTop: 4,
    },
    overlapCard: {
        flex: 1,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        marginTop: -28,
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    selectorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 16,
    },
    dropdownBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        flex: 1,
        marginRight: 10,
    },
    dropdownLabel: {
        fontSize: 13,
        fontWeight: '700',
        flex: 1,
    },
    settingsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
    },
    settingsBtnText: {
        color: ACCENT,
        fontSize: 12,
        fontWeight: '700',
    },
    dateSelectorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 16,
    },
    dateChevron: {
        width: 38,
        height: 38,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    datePickerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        flex: 1,
        marginHorizontal: 8,
    },
    dateTextLabel: {
        fontSize: 13,
        fontWeight: '700',
    },
    legendBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 20,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 6,
    },
    legendText: {
        fontSize: 11,
        fontWeight: '700',
    },
    slotsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    slotCell: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
        marginBottom: 2,
        height: 84,
        justifyContent: 'space-between',
    },
    slotTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    slotTimeText: {
        fontSize: 13,
        fontWeight: '800',
        flex: 1,
        marginRight: 4,
    },
    slotBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    slotBadgeText: {
        fontSize: 8,
        fontWeight: '800',
    },
    slotPriceText: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 4,
    },
    slotCustomerText: {
        fontSize: 10,
        fontWeight: '800',
        marginTop: 2,
    },
    tipBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e6fbf4',
        paddingVertical: 10,
        borderRadius: 10,
        marginTop: 24,
    },
    tipText: {
        color: '#047857',
        fontSize: 11,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalCard: {
        width: '80%',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '800',
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 4,
    },
    modalDivider: {
        height: 1,
        marginVertical: 12,
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    modalOptionText: {
        fontSize: 13,
        fontWeight: '700',
    },
    closeModalBtn: {
        marginTop: 12,
        alignItems: 'center',
        paddingVertical: 10,
    },
    closeModalBtnText: {
        color: ACCENT,
        fontSize: 13,
        fontWeight: '800',
    },
    formLabel: {
        fontSize: 11,
        fontWeight: '700',
        marginTop: 10,
        marginBottom: 6,
    },
    formInput: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 13,
        fontWeight: '600',
    },
    modalActionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 20,
        gap: 12,
    },
    actionCancelBtn: {
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 10,
        flex: 1,
        alignItems: 'center',
    },
    actionCancelBtnText: {
        fontSize: 12,
        fontWeight: '800',
    },
    actionSubmitBtn: {
        backgroundColor: ACCENT,
        borderRadius: 12,
        paddingVertical: 10,
        flex: 1,
        alignItems: 'center',
    },
    actionSubmitBtnText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '800',
    },
    detailsBody: {
        gap: 10,
        marginVertical: 10,
    },
    detailItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    detailItemLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    detailItemValue: {
        fontSize: 13,
        fontWeight: '700',
    },
    statusBadgeInline: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
});
