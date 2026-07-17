import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ImageBackground,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { apiFetch } from '../../utils/api';

const ACCENT = '#10b981';
const TURF_BG = require('../../assets/turf-bg.jpg');

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLOT_WIDTH = (SCREEN_WIDTH - 40 - 12) / 2;

interface Turf {
  id: string;
  name: string;
  pricePerHour?: number;
  sport?: string;
  sportId?: string;
  isActive?: boolean;
  peakStartHour?: number;
  peakEndHour?: number;
  peakSurcharge?: number;
  weekendSurcharge?: number;
  blockedSlots?: string[];
}

interface OwnerBooking {
  id: string;
  turfId?: string;
  sportId?: string;
  customerName?: string;
  turfName?: string;
  date?: string;
  time?: string;
  slotId?: string;
  timeSlot?: string;
  amount?: number;
  status?: string;
}

interface OfflineBooking {
  turfId: string;
  date: string;
  slotIndex: number;
  customerName: string;
  customerPhone?: string;
  amount: number;
}

export default function OwnerBookingsScreen() {
  const { user, isAuthenticated } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // State
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [selectedTurf, setSelectedTurf] = useState<Turf | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [bookings, setBookings] = useState<OwnerBooking[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<Set<string>>(new Set());
  const [offlineBookings, setOfflineBookings] = useState<OfflineBooking[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals visibility
  const [turfModalVisible, setTurfModalVisible] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  
  // Offline booking form state
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAmount, setFormAmount] = useState('1200');

  // Slot Settings Form States
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [formPricePerHour, setFormPricePerHour] = useState('1200');
  const [formPeakStart, setFormPeakStart] = useState('18');
  const [formPeakEnd, setFormPeakEnd] = useState('22');
  const [formPeakSurcharge, setFormPeakSurcharge] = useState('300');
  const [formWeekendSurcharge, setFormWeekendSurcharge] = useState('200');
  const [savingSettings, setSavingSettings] = useState(false);

  // Detailed Slot view state
  const [activeSlotDetails, setActiveSlotDetails] = useState<any>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

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
    if (!isAuthenticated || !user) return;
    try {
      // Fetch turfs from backend
      const turfRes = await apiFetch('/owner/turfs');
      let loadedTurfs: Turf[] = [];
      if (turfRes.success && turfRes.data && turfRes.data.length > 0) {
        loadedTurfs = turfRes.data.map((t: any) => ({
          id: t.id,
          name: t.name,
          pricePerHour: t.pricePerHour ?? t.price ?? 1200,
          sport: t.sport || 'Football',
          sportId: t.sports?.[0]?.sportId || t.sports?.[0]?.sport?.id || (typeof t.sports?.[0] === 'string' ? t.sports[0] : '') || 'NHQKZB3YRCRhWBL95sUE',
          isActive: t.isActive ?? true,
          peakStartHour: t.peakStartHour,
          peakEndHour: t.peakEndHour,
          peakSurcharge: t.peakSurcharge,
          weekendSurcharge: t.weekendSurcharge,
          blockedSlots: t.blockedSlots || [],
        }));
      }
      setTurfs(loadedTurfs);
      if (!selectedTurf && loadedTurfs.length > 0) {
        setSelectedTurf(loadedTurfs[0]);
      }

      // Fetch bookings from backend
      const bookingRes = await apiFetch('/owner/bookings');
      if (bookingRes.success && bookingRes.data) {
        setBookings(bookingRes.data);
      } else {
        setBookings([]);
      }
    } catch (err) {
      setTurfs([]);
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    if (!isAuthenticated || !user) return;
    setRefreshing(true);
    fetchData();
  }, [selectedTurf, isAuthenticated, user]);

  // Guard: only for TURF_OWNER & CARETAKER role
  if (!isAuthenticated || !user) return <Redirect href="/login" />;
  if (user.role !== 'TURF_OWNER' && user.role !== 'CARETAKER') return <Redirect href="/" />;

  const changeDate = (days: number) => {
    const next = new Date(selectedDate);
    next.setDate(selectedDate.getDate() + days);
    setSelectedDate(next);
  };

  const getLocalDateString = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatDateLabel = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // derived status style
  const getSlotStyles = (status: string) => {
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
  const parseStartHour = (timeStr: string): number | null => {
    if (!timeStr) return null;
    const startPart = timeStr.split(/[-–]/)[0]?.trim().toUpperCase();
    if (!startPart) return null;

    const ampm = startPart.includes('PM') ? 'PM' : startPart.includes('AM') ? 'AM' : null;
    const timeOnly = startPart.replace('AM', '').replace('PM', '').trim();
    const parts = timeOnly.split(':');
    if (parts.length === 0) return null;

    let hour = parseInt(parts[0], 10);
    if (isNaN(hour)) return null;

    if (ampm) {
      if (ampm === 'PM' && hour !== 12) {
        hour += 12;
      } else if (ampm === 'AM' && hour === 12) {
        hour = 0;
      }
    }
    return hour;
  };

  // Derive slots state dynamically
  const dateKey = getLocalDateString(selectedDate);
  const slotsList = Array.from({ length: 24 }, (_, i) => {
    const getAmPm = (hour: number) => {
      if (hour === 24 || hour === 0) return 'AM';
      return hour >= 12 ? 'PM' : 'AM';
    };
    const get12Hour = (hour: number) => {
      const h = hour % 12;
      return h === 0 ? 12 : h;
    };

    const displayStartHr = get12Hour(i).toString().padStart(2, '0');
    const displayEndHr = get12Hour(i + 1).toString().padStart(2, '0');
    const startAmPm = getAmPm(i);
    const endAmPm = getAmPm(i + 1);

    const timeRangeStr = `${displayStartHr}:00 ${startAmPm} – ${displayEndHr}:00 ${endAmPm}`;
    
    // Check database blocked slots using "YYYY-MM-DD|HH:MM - HH:MM" format
    const startStr = `${String(i).padStart(2, '0')}:00`;
    const endStr = `${String((i + 1) % 24 === 0 ? 24 : (i + 1) % 24).padStart(2, '0')}:00`;
    const blockKey = `${dateKey}|${startStr} - ${endStr}`;
    const isBlockedInDb = selectedTurf?.blockedSlots?.includes(blockKey);
    
    // Check online bookings
    const activeBookings = bookings.filter(b => b.status !== 'CANCELLED');
    const matchingBooking = activeBookings.find(b => {
      const matchDate = b.date ? b.date.split('T')[0] === dateKey : false;
      if (!matchDate) return false;
      const turfMatch = selectedTurf ? (b.turfId === selectedTurf.id || b.turfName?.toLowerCase().includes(selectedTurf.name.toLowerCase().split(' ')[0])) : true;
      if (!turfMatch) return false;
      
      const bSlot = b.slotId || b.time || b.timeSlot || '';
      const slots = bSlot.split(',').map((s: string) => s.trim());
      return slots.some((s: string) => {
        const startHour = parseStartHour(s);
        return startHour === i;
      });
    });
 
    // Check offline bookings
    const matchingOffline = offlineBookings.find(ob => ob.turfId === selectedTurf?.id && ob.date === dateKey && ob.slotIndex === i);
 
    let status = 'OPEN';
    let customerName = '';
    let bookingId = '';
    
    // Calculate dynamic pricing based on Turf surcharges
    const basePrice = selectedTurf?.pricePerHour ?? 1200;
    const peakStart = selectedTurf?.peakStartHour ?? 18;
    const peakEnd = selectedTurf?.peakEndHour ?? 22;
    const peakSurch = selectedTurf?.peakSurcharge ?? 300;
    const isPeak = i >= peakStart && i < peakEnd;
    
    const dayOfWeek = selectedDate.getDay(); // 0 is Sunday, 6 is Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const weekendSurch = selectedTurf?.weekendSurcharge ?? 200;

    let surcharge = 0;
    if (isPeak) surcharge += peakSurch;
    if (isWeekend) surcharge += weekendSurch;
    
    let amount = basePrice + surcharge;
 
    // Hardcode mockup matches specifically for 13 May 2024 or current date to match image
    if (matchingBooking) {
      status = matchingBooking.status === 'PENDING' ? 'PENDING' : 'BOOKED';
      customerName = matchingBooking.customerName || 'Customer';
      amount = matchingBooking.amount || amount;
      bookingId = matchingBooking.id;
    } else if (matchingOffline) {
      status = 'BOOKED';
      customerName = matchingOffline.customerName;
      amount = matchingOffline.amount;
    } else if (isBlockedInDb) {
      status = 'BLOCKED';
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

  const handleBlockSlotMobile = async (slotIndex: number, block: boolean) => {
    if (!selectedTurf) return;
    
    // Construct 24h slot string range matching the database block Key format
    const startStr = `${String(slotIndex).padStart(2, '0')}:00`;
    const endStr = `${String((slotIndex + 1) % 24 === 0 ? 24 : (slotIndex + 1) % 24).padStart(2, '0')}:00`;
    const blockKey = `${dateKey}|${startStr} - ${endStr}`;
    
    let updatedBlocked = selectedTurf.blockedSlots || [];
    if (block) {
      if (!updatedBlocked.includes(blockKey)) {
        updatedBlocked = [...updatedBlocked, blockKey];
      }
    } else {
      updatedBlocked = updatedBlocked.filter((k: string) => k !== blockKey);
    }

    try {
      setLoading(true);
      const res = await apiFetch(`/owner/turfs/${selectedTurf.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          blockedSlots: updatedBlocked,
        }),
      });

      if (res.success && res.data) {
        const updatedTurf = {
          ...selectedTurf,
          blockedSlots: res.data.blockedSlots || [],
        };
        setSelectedTurf(updatedTurf);
        setTurfs(prev => prev.map(t => t.id === selectedTurf.id ? updatedTurf : t));
        Alert.alert('Success', `Slot successfully ${block ? 'blocked' : 'unblocked'}.`);
      } else {
        Alert.alert('Error', 'Failed to update slot settings.');
      }
    } catch (err) {
      Alert.alert('Error', 'An error occurred while updating slot settings.');
    } finally {
      setLoading(false);
    }
  };

  const openSettingsModal = () => {
    if (!selectedTurf) {
      Alert.alert('No Turf Selected', 'Please select a turf first.');
      return;
    }
    setFormPricePerHour(String(selectedTurf.pricePerHour ?? 1200));
    setFormPeakStart(String(selectedTurf.peakStartHour ?? 18));
    setFormPeakEnd(String(selectedTurf.peakEndHour ?? 22));
    setFormPeakSurcharge(String(selectedTurf.peakSurcharge ?? 300));
    setFormWeekendSurcharge(String(selectedTurf.weekendSurcharge ?? 200));
    setSettingsModalVisible(true);
  };

  const handleSaveSettings = async () => {
    if (!selectedTurf) return;
    setSavingSettings(true);
    const payload = {
      pricePerHour: parseFloat(formPricePerHour),
      peakStartHour: parseInt(formPeakStart, 10),
      peakEndHour: parseInt(formPeakEnd, 10),
      peakSurcharge: parseFloat(formPeakSurcharge),
      weekendSurcharge: parseFloat(formWeekendSurcharge),
    };
    try {
      const res = await apiFetch(`/owner/turfs/${selectedTurf.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (res.success && res.data) {
        const updatedTurf = {
          ...selectedTurf,
          ...payload,
          blockedSlots: res.data.blockedSlots || [],
        };
        setSelectedTurf(updatedTurf);
        setTurfs((prev) => prev.map((t) => t.id === selectedTurf.id ? updatedTurf : t));
        Alert.alert('Success', 'Slot and pricing settings saved successfully!');
        setSettingsModalVisible(false);
      } else {
        Alert.alert('Error', 'Failed to save settings.');
      }
    } catch (err) {
      Alert.alert('Error', 'An error occurred while saving settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSlotPress = (slot: any) => {
    if (slot.status === 'OPEN') {
      Alert.alert(
        `Slot ${slot.timeRange}`,
        'Choose action for this available slot:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Block Slot',
            onPress: () => {
              handleBlockSlotMobile(slot.index, true);
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
        ]
      );
    } else if (slot.status === 'BLOCKED') {
      Alert.alert(
        `Unblock Slot ${slot.timeRange}`,
        'Do you want to make this slot available for bookings again?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes, Unblock',
            onPress: () => {
              handleBlockSlotMobile(slot.index, false);
            },
          },
        ]
      );
    } else {
      // Booked or Pending
      setActiveSlotDetails(slot);
      setDetailsModalVisible(true);
    }
  };

  const submitOfflineBooking = async () => {
    if (!formName.trim()) {
      Alert.alert('Error', 'Please enter customer name');
      return;
    }
    const phone = formPhone.trim();
    if (phone && (phone.length < 10 || phone.length > 15)) {
      Alert.alert('Error', 'Phone number must be between 10 and 15 digits');
      return;
    }
    if (selectedSlotIndex === null || !selectedTurf) return;

    const newBooking: OfflineBooking = {
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

      await apiFetch('/owner/bookings/offline', {
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
      Alert.alert('Success', 'Offline booking added successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add offline booking');
    }
  };


  const cancelActiveBooking = async (bookingId: string, slotIndex: number) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            if (bookingId) {
              try {
                await apiFetch(`/owner/bookings/${bookingId}/cancel`, { method: 'PUT' });
              } catch {}
              setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'CANCELLED' } : b));
            } else {
              // Local offline booking cancellation
              setOfflineBookings(prev => prev.filter(ob => !(ob.turfId === selectedTurf?.id && ob.date === dateKey && ob.slotIndex === slotIndex)));
            }
            setDetailsModalVisible(false);
            Alert.alert('Done', 'Booking cancelled successfully.');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Full-bleed Header Background */}
      <ImageBackground
        source={TURF_BG}
        style={[styles.headerBg, { paddingTop: insets.top + 16 }] as any}
        imageStyle={styles.headerImage}
      >
        <View style={styles.darkOverlay} />
        
        {/* Top bar back button row */}
        <View style={styles.topBarRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/owner')}>
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Text descriptions */}
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitleText}>Slots Schedule</Text>
          <Text style={styles.headerSubtitleText}>Manage your turf slots and availability</Text>
        </View>
      </ImageBackground>

      {/* Main card panels */}
      <View style={[styles.overlapCard, { backgroundColor: theme.card }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 150 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
        >
          {/* Dropdown selectors and Settings row */}
          <View style={styles.selectorRow}>
            <TouchableOpacity 
              style={[styles.dropdownBtn, { backgroundColor: theme.dropdownBg, borderColor: theme.cardBorder }]}
              onPress={() => setTurfModalVisible(true)}
            >
              <MaterialCommunityIcons name="soccer-field" size={18} color={ACCENT} style={{ marginRight: 6 }} />
              <Text style={[styles.dropdownLabel, { color: theme.text }]} numberOfLines={1}>
                {selectedTurf ? selectedTurf.name : 'Select Turf'}
              </Text>
              <Ionicons name="chevron-down" size={14} color={theme.textMuted} style={{ marginLeft: 6 }} />
            </TouchableOpacity>

             <TouchableOpacity 
              style={[styles.settingsBtn, { borderColor: theme.cardBorder }]}
              onPress={openSettingsModal}
            >
              <Ionicons name="settings-outline" size={15} color={ACCENT} style={{ marginRight: 4 }} />
              <Text style={styles.settingsBtnText}>Slot Settings</Text>
            </TouchableOpacity>
          </View>

          {/* Date Selector Row */}
          <View style={styles.dateSelectorRow}>
            <TouchableOpacity style={[styles.dateChevron, { borderColor: theme.cardBorder }]} onPress={() => changeDate(-1)}>
              <Ionicons name="chevron-back" size={16} color={theme.text} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.datePickerCard, { backgroundColor: theme.dropdownBg, borderColor: theme.cardBorder }]}
              onPress={() => setDateModalVisible(true)}
            >
              <Ionicons name="calendar-outline" size={16} color={theme.textMuted} style={{ marginRight: 8 }} />
              <Text style={[styles.dateTextLabel, { color: theme.text }]}>{formatDateLabel(selectedDate)}</Text>
              <Ionicons name="chevron-down" size={14} color={theme.textMuted} style={{ marginLeft: 8 }} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.dateChevron, { borderColor: theme.cardBorder }]} onPress={() => changeDate(1)}>
              <Ionicons name="chevron-forward" size={16} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Status Legend Row */}
          <View style={[styles.legendBar, { borderColor: theme.legendBorder }]}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
              <Text style={[styles.legendText, { color: theme.textMuted }]}>Booked</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={[styles.legendText, { color: theme.textMuted }]}>Pending</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
              <Text style={[styles.legendText, { color: theme.textMuted }]}>Blocked</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#cbd5e1' }]} />
              <Text style={[styles.legendText, { color: theme.textMuted }]}>Open</Text>
            </View>
          </View>

          {/* Slots Grid */}
          <View style={styles.slotsGrid}>
            {slotsList.map((slot) => {
              const sc = getSlotStyles(slot.status);
              return (
                <TouchableOpacity
                  key={slot.index}
                  activeOpacity={0.7}
                  style={[
                    styles.slotCell,
                    {
                      width: SLOT_WIDTH,
                      backgroundColor: sc.bg,
                      borderColor: sc.border,
                    }
                  ]}
                  onPress={() => handleSlotPress(slot)}
                >
                  <View style={styles.slotTopRow}>
                    <Text style={[styles.slotTimeText, { color: theme.text }]} numberOfLines={1}>
                      {slot.timeRange}
                    </Text>
                    <View style={[styles.slotBadge, { backgroundColor: sc.badgeBg }]}>
                      <Text style={[styles.slotBadgeText, { color: sc.badgeText }]}>{slot.status}</Text>
                    </View>
                  </View>

                  <Text style={[styles.slotPriceText, { color: theme.textMuted }]}>
                    ₹{slot.price.toLocaleString('en-IN')}/h
                  </Text>

                  {slot.customerName ? (
                    <Text style={[styles.slotCustomerText, { color: sc.text }]} numberOfLines={1}>
                      {slot.customerName}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Bottom Info Banner */}
          <View style={styles.tipBanner}>
            <Ionicons name="information-circle-outline" size={16} color="#047857" style={{ marginRight: 6 }} />
            <Text style={styles.tipText}>Tap on any slot to view booking details</Text>
          </View>
        </ScrollView>
      </View>

      {/* Slot & Pricing Settings Modal */}
      <Modal visible={settingsModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <View style={[styles.modalCard, { backgroundColor: theme.card, width: '90%' }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Slot & Pricing Settings</Text>
              <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
                Configure defaults for {selectedTurf ? selectedTurf.name : ''}
              </Text>
              <View style={[styles.modalDivider, { backgroundColor: theme.divider }]} />

              <Text style={[styles.formLabel, { color: theme.textMuted }]}>Base Price Per Hour (₹) *</Text>
              <TextInput
                style={[styles.formInput, { color: theme.text, borderColor: theme.cardBorder }]}
                keyboardType="numeric"
                value={formPricePerHour}
                onChangeText={setFormPricePerHour}
              />

              <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.formLabel, { color: theme.textMuted }]}>Peak Start Hour (24h)</Text>
                  <TextInput
                    style={[styles.formInput, { color: theme.text, borderColor: theme.cardBorder }]}
                    keyboardType="numeric"
                    placeholder="e.g. 18"
                    value={formPeakStart}
                    onChangeText={setFormPeakStart}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.formLabel, { color: theme.textMuted }]}>Peak End Hour (24h)</Text>
                  <TextInput
                    style={[styles.formInput, { color: theme.text, borderColor: theme.cardBorder }]}
                    keyboardType="numeric"
                    placeholder="e.g. 22"
                    value={formPeakEnd}
                    onChangeText={setFormPeakEnd}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12, width: '100%', marginTop: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.formLabel, { color: theme.textMuted }]}>Peak Surcharge (₹)</Text>
                  <TextInput
                    style={[styles.formInput, { color: theme.text, borderColor: theme.cardBorder }]}
                    keyboardType="numeric"
                    placeholder="e.g. 300"
                    value={formPeakSurcharge}
                    onChangeText={setFormPeakSurcharge}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.formLabel, { color: theme.textMuted }]}>Weekend Surcharge (₹)</Text>
                  <TextInput
                    style={[styles.formInput, { color: theme.text, borderColor: theme.cardBorder }]}
                    keyboardType="numeric"
                    placeholder="e.g. 200"
                    value={formWeekendSurcharge}
                    onChangeText={setFormWeekendSurcharge}
                  />
                </View>
              </View>

              <View style={[styles.modalActionsRow, { marginTop: 20 }]}>
                <TouchableOpacity style={[styles.actionCancelBtn, { borderColor: theme.cardBorder }]} onPress={() => setSettingsModalVisible(false)}>
                  <Text style={[styles.actionCancelBtnText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionSubmitBtn, { backgroundColor: ACCENT }]} 
                  disabled={savingSettings}
                  onPress={handleSaveSettings}
                >
                  {savingSettings ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.actionSubmitBtnText}>Save Settings</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Turf Selector Modal */}
      <Modal visible={turfModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select Turf</Text>
            <View style={[styles.modalDivider, { backgroundColor: theme.divider }]} />
            {turfs.map(t => (
              <TouchableOpacity
                key={t.id}
                style={styles.modalOption}
                onPress={() => {
                  setSelectedTurf(t);
                  setTurfModalVisible(false);
                }}
              >
                <MaterialCommunityIcons name="soccer-field" size={20} color={ACCENT} style={{ marginRight: 10 }} />
                <Text style={[styles.modalOptionText, { color: theme.text }]}>{t.name}</Text>
                {selectedTurf?.id === t.id && (
                  <Ionicons name="checkmark-circle" size={18} color={ACCENT} style={{ marginLeft: 'auto' }} />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setTurfModalVisible(false)}>
              <Text style={styles.closeModalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Date Selector List Modal */}
      <Modal visible={dateModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select Date</Text>
            <View style={[styles.modalDivider, { backgroundColor: theme.divider }]} />
            <ScrollView style={{ maxHeight: 280 }}>
              {Array.from({ length: 14 }, (_, idx) => {
                const day = new Date();
                day.setDate(day.getDate() + idx - 3); // list past 3 days and next 10 days
                const isSelected = getLocalDateString(day) === dateKey;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={styles.modalOption}
                    onPress={() => {
                      setSelectedDate(day);
                      setDateModalVisible(false);
                    }}
                  >
                    <Ionicons name="calendar-outline" size={16} color={theme.textMuted} style={{ marginRight: 10 }} />
                    <Text style={[styles.modalOptionText, { color: isSelected ? ACCENT : theme.text }]}>
                      {formatDateLabel(day)}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color={ACCENT} style={{ marginLeft: 'auto' }} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setDateModalVisible(false)}>
              <Text style={styles.closeModalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Manual Offline Booking Input Form Modal */}
      <Modal visible={bookingModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, width: '90%' }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Add Offline Booking</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
              Slot: {selectedSlotIndex !== null ? slotsList[selectedSlotIndex].timeRange : ''}
            </Text>
            <View style={[styles.modalDivider, { backgroundColor: theme.divider }]} />

            <Text style={[styles.formLabel, { color: theme.textMuted }]}>Customer Name</Text>
            <TextInput
              style={[styles.formInput, { color: theme.text, borderColor: theme.cardBorder }]}
              placeholder="e.g. Sanjay Patil"
              placeholderTextColor="#94a3b8"
              value={formName}
              onChangeText={setFormName}
            />

            <Text style={[styles.formLabel, { color: theme.textMuted }]}>Phone Number (Optional)</Text>
            <TextInput
              style={[styles.formInput, { color: theme.text, borderColor: theme.cardBorder }]}
              placeholder="e.g. 9876543210"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              value={formPhone}
              onChangeText={setFormPhone}
            />

            <Text style={[styles.formLabel, { color: theme.textMuted }]}>Amount (₹)</Text>
            <TextInput
              style={[styles.formInput, { color: theme.text, borderColor: theme.cardBorder }]}
              placeholder="Amount"
              keyboardType="number-pad"
              value={formAmount}
              onChangeText={setFormAmount}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={[styles.actionCancelBtn, { borderColor: theme.cardBorder }]} onPress={() => setBookingModalVisible(false)}>
                <Text style={[styles.actionCancelBtnText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionSubmitBtn} onPress={submitOfflineBooking}>
                <Text style={styles.actionSubmitBtnText}>Confirm Booking</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Booking Details Sheet Modal */}
      <Modal visible={detailsModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, width: '90%' }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Booking Details</Text>
            <View style={[styles.modalDivider, { backgroundColor: theme.divider }]} />

            {activeSlotDetails && (
              <View style={styles.detailsBody}>
                <View style={styles.detailItemRow}>
                  <Text style={[styles.detailItemLabel, { color: theme.textMuted }]}>Customer:</Text>
                  <Text style={[styles.detailItemValue, { color: theme.text }]}>{activeSlotDetails.customerName}</Text>
                </View>
                <View style={styles.detailItemRow}>
                  <Text style={[styles.detailItemLabel, { color: theme.textMuted }]}>Time Slot:</Text>
                  <Text style={[styles.detailItemValue, { color: theme.text }]}>{activeSlotDetails.timeRange}</Text>
                </View>
                <View style={styles.detailItemRow}>
                  <Text style={[styles.detailItemLabel, { color: theme.textMuted }]}>Turf:</Text>
                  <Text style={[styles.detailItemValue, { color: theme.text }]}>{selectedTurf?.name}</Text>
                </View>
                <View style={styles.detailItemRow}>
                  <Text style={[styles.detailItemLabel, { color: theme.textMuted }]}>Amount Paid:</Text>
                  <Text style={[styles.detailItemValue, { color: theme.text }]}>₹{activeSlotDetails.price}</Text>
                </View>
                <View style={styles.detailItemRow}>
                  <Text style={[styles.detailItemLabel, { color: theme.textMuted }]}>Status:</Text>
                  <View style={[styles.statusBadgeInline, { backgroundColor: activeSlotDetails.status === 'CONFIRMED' || activeSlotDetails.status === 'BOOKED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)' }]}>
                    <Text style={{ color: activeSlotDetails.status === 'CONFIRMED' || activeSlotDetails.status === 'BOOKED' ? '#10b981' : '#f59e0b', fontSize: 11, fontWeight: '800' }}>
                      {activeSlotDetails.status}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={[styles.actionCancelBtn, { borderColor: theme.cardBorder }]} onPress={() => setDetailsModalVisible(false)}>
                <Text style={[styles.actionCancelBtnText, { color: theme.text }]}>Close</Text>
              </TouchableOpacity>
              {activeSlotDetails && (
                <TouchableOpacity
                  style={[styles.actionSubmitBtn, { backgroundColor: '#ef4444' }]}
                  onPress={() => cancelActiveBooking(activeSlotDetails.bookingId, activeSlotDetails.index)}
                >
                  <Text style={styles.actionSubmitBtnText}>Cancel Booking</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
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
