import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { formatCurrency } from '../../utils/index';
import { useAuthStore } from '../../store/authStore';
import { useBookingStore } from '../../store/bookingStore';
import { useThemeStore } from '../../store/themeStore';
import { getTurfById, type Turf } from '../../data/turfs';
import { apiFetch } from '../../utils/api';

export default function TurfDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { isDarkMode } = useThemeStore();

  const theme = {
    bg: isDarkMode ? '#030712' : '#f8fafc',
    card: isDarkMode ? 'rgba(15, 23, 42, 0.65)' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#e2e8f0',
    inputBg: isDarkMode ? '#030712' : '#ffffff',
    bgImageOpacity: isDarkMode ? 0.35 : 0.22,
    overlayBg: isDarkMode ? 'rgba(3, 7, 18, 0.5)' : 'rgba(248, 250, 252, 0.6)',
  };
  const addBooking = useBookingStore((s) => s.addBooking);
  const [turf, setTurf] = useState<Turf | undefined>(getTurfById(id));
  const [loadingTurf, setLoadingTurf] = useState(false);
  const [bookedReservations, setBookedReservations] = useState<any[]>([]);

  useEffect(() => {
    const fetchReservations = async () => {
      if (!id || /^\d+$/.test(id) || id.length <= 2) return;
      try {
        const res = await apiFetch(`/turfs/${id}/bookings`);
        if (res.success && Array.isArray(res.data)) {
          setBookedReservations(res.data);
        }
      } catch (err) {
        console.log('Failed to fetch reservations for turf', err);
      }
    };
    fetchReservations();
  }, [id]);

  const localBookings = useBookingStore((s) => s.bookings);

  const isSlotBooked = (slotTime: string) => {
    const isBackendBooked = bookedReservations.some((res) => {
      const bDate = res.bookingDate ? new Date(res.bookingDate).toISOString().split('T')[0] : '';
      return bDate === selectedDate && res.slotId === slotTime;
    });

    const isLocalBooked = localBookings.some((b) => {
      return b.turfId === id && b.date === selectedDate && b.time === slotTime;
    });

    return isBackendBooked || isLocalBooked;
  };

  // Generate next 7 days starting from today for date selection
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

  const [selectedDate, setSelectedDate] = useState<string>(dateOptions[0].isoString);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [selectedSport, setSelectedSport] = useState<'Cricket' | 'Football'>(
    turf?.sport === 'Football' ? 'Football' : 'Cricket'
  );
  const [selectedCourt, setSelectedCourt] = useState<string>('Full Ground');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');

  useEffect(() => {
    const fetchTurfDetails = async () => {
      if (!id) return;
      
      // If it's a mock ID (e.g. '1', '2', '3'), bypass API completely to avoid 404 errors
      const isMockId = /^\d+$/.test(id) || id.length <= 2;
      if (isMockId) {
        const mockTurf = getTurfById(id);
        if (mockTurf) {
          setTurf(mockTurf);
          setSelectedSport(mockTurf.sport === 'Football' ? 'Football' : 'Cricket');
        }
        return;
      }

      setLoadingTurf(true);
      try {
        const res = await apiFetch(`/turfs/${id}`);
        if (res.success && res.data) {
          const bt = res.data;
          const normalized: Turf = {
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
          };
          setTurf(normalized);
          setSelectedSport(normalized.sport === 'Football' ? 'Football' : 'Cricket');
        }
      } catch (err) {
        console.log('Failed to fetch turf details from backend, using mock fallback', err);
      } finally {
        setLoadingTurf(false);
      }
    };
    fetchTurfDetails();
  }, [id]);

  const user = useAuthStore((s) => s.user);
  const playcoinsBalance = 350 + (useBookingStore((s) => s.bookings).length * 50);

  const generated24Slots = Array.from({ length: 24 }, (_, i) => {
    const startHour = i;
    const endHour = (i + 1) % 24;
    const startStr = `${startHour.toString().padStart(2, '0')}:00`;
    const endStr = `${endHour.toString().padStart(2, '0')}:00`;
    return `${startStr} - ${endStr}`;
  });

  if (!turf) {
    return (
      <View style={styles.notFound}>
        <Stack.Screen options={{ title: 'Not found' }} />
        <Text style={styles.notFoundText}>This turf could not be found.</Text>
        <TouchableOpacity onPress={() => router.replace('/')}>
          <Text style={styles.backLink}>← Back to Explore</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBook = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!selectedTime) return;

    router.push({
      pathname: '/payment',
      params: {
        turfId: turf.id,
        date: selectedDate,
        time: selectedTime,
        court: selectedCourt,
        sport: selectedSport,
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Image
        source={require('../../assets/turf-bg.jpg')}
        style={[styles.backgroundImage as any, { opacity: theme.bgImageOpacity }]}
        resizeMode="cover"
      />
      <View style={[styles.overlay, { backgroundColor: theme.overlayBg }]} />

      <Stack.Screen options={{ headerShown: false }} />

      {/* Greeting Header Bar */}
      <View style={styles.topGreetHeader}>
        <View style={styles.greetLeft}>
          <Image
            source={{ uri: `https://avatar.iran.liara.run/public/boy?username=${user?.name || 'ahmed'}` }}
            style={styles.headerAvatar}
          />
          <View>
            <Text style={styles.greetText}>Hi {user?.name || 'ahmed'} 👋</Text>
            <Text style={styles.greetSubText}>{'Ahmednagar >'}</Text>
          </View>
        </View>
        <View style={styles.greetRight}>
          <View style={styles.headerPlaycoins}>
            <FontAwesome5 name="coins" size={11} color="#fbbf24" style={{ marginRight: 5 }} />
            <Text style={styles.playcoinsText}>{playcoinsBalance}</Text>
          </View>
          <TouchableOpacity style={styles.headerBell} onPress={() => router.push('/profile')}>
            <Ionicons name="notifications-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Simple venue indicator */}
        <Text style={styles.venueCountText}>Venue Details & Booking Panel</Text>

        {/* Turf details banner card */}
        <View style={[styles.bodyBanner, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.text }]}>{turf.name}</Text>
              <Text style={[styles.area, { color: theme.textMuted }]}>📍 {turf.area}</Text>
            </View>
            <Text style={styles.rating}>★ {turf.rating}</Text>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.sportBadge}>
              <Text style={styles.sportBadgeText}>{turf.sport}</Text>
            </View>
            <Text style={[styles.price, { color: theme.text }]}>{formatCurrency(turf.price)}/hr</Text>
          </View>
          <Text style={[styles.desc, { color: theme.textMuted }]}>{turf.description}</Text>
        </View>

        {/* Booking Sheet Panel Card */}
        <View style={[styles.bookingPanel, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Panel Top Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Date Picker Strip with Month at top, large Day, dayName at bottom */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.datesContainer}
            contentContainerStyle={styles.datesContent}
          >
            {dateOptions.map((opt) => {
              const isActive = selectedDate === opt.isoString;
              return (
                <TouchableOpacity
                  key={opt.isoString}
                  onPress={() => setSelectedDate(opt.isoString)}
                  style={[
                    styles.dateChipCard,
                    {
                      backgroundColor: isActive
                        ? 'rgba(16, 185, 129, 0.12)'
                        : isDarkMode
                        ? 'rgba(15, 23, 42, 0.3)'
                        : '#f1f5f9',
                      borderColor: isActive ? '#10b981' : theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.dateMonthText, { color: isActive ? '#10b981' : theme.textMuted }]}>
                    {opt.month}
                  </Text>
                  <Text style={[styles.dateDayNumText, { color: isActive ? '#10b981' : theme.text }]}>
                    {opt.dayNum.toString().padStart(2, '0')}
                  </Text>
                  <Text style={[styles.dateDayNameText, { color: isActive ? '#10b981' : theme.textMuted }]}>
                    {opt.dayName.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
            
            {/* Calendar icon card */}
            <TouchableOpacity style={[styles.calendarIconCard, { backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.3)' : '#f1f5f9', borderColor: theme.border }]}>
              <Ionicons name="calendar-outline" size={20} color="#10b981" />
            </TouchableOpacity>
          </ScrollView>

          {/* Horizontal Sport category selector */}
          <View style={[styles.sportTabRow, { borderColor: theme.border }]}>
            <TouchableOpacity
              style={[
                styles.sportTab,
                selectedSport === 'Cricket' && styles.activeSportTab,
                {
                  backgroundColor: selectedSport === 'Cricket'
                    ? 'rgba(16, 185, 129, 0.12)'
                    : (isDarkMode ? 'rgba(15, 23, 42, 0.4)' : '#f1f5f9')
                }
              ]}
              onPress={() => setSelectedSport('Cricket')}
            >
              <MaterialCommunityIcons
                name="cricket"
                size={22}
                color={selectedSport === 'Cricket' ? '#10b981' : '#64748b'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sportTab,
                selectedSport === 'Football' && styles.activeSportTab,
                {
                  backgroundColor: selectedSport === 'Football'
                    ? 'rgba(16, 185, 129, 0.12)'
                    : (isDarkMode ? 'rgba(15, 23, 42, 0.4)' : '#f1f5f9')
                }
              ]}
              onPress={() => setSelectedSport('Football')}
            >
              <Ionicons
                name="football"
                size={22}
                color={selectedSport === 'Football' ? '#10b981' : '#64748b'}
              />
            </TouchableOpacity>
          </View>

          {/* Select Court Options */}
          <Text style={[styles.panelSectionTitle, { color: theme.textMuted }]}>SELECT COURT</Text>
          <Text style={[styles.courtHeaderName, { color: theme.text }]}>
            {selectedSport === 'Cricket' ? '🏏 7A Cricket' : '⚽ Full Ground Futsal'}
          </Text>
          <View style={styles.courtsRow}>
            <TouchableOpacity
              style={[
                styles.courtChip,
                {
                  backgroundColor: selectedCourt === 'Full Ground'
                    ? 'rgba(16, 185, 129, 0.12)'
                    : (isDarkMode ? 'rgba(15, 23, 42, 0.3)' : '#f1f5f9'),
                  borderColor: selectedCourt === 'Full Ground' ? '#10b981' : theme.border
                }
              ]}
              onPress={() => setSelectedCourt('Full Ground')}
            >
              <Text style={[styles.courtChipText, selectedCourt === 'Full Ground' ? { color: '#10b981', fontWeight: 'bold' } : { color: theme.textMuted }]}>
                Full Ground
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.courtChip,
                {
                  backgroundColor: selectedCourt === 'Half Ground'
                    ? 'rgba(16, 185, 129, 0.12)'
                    : (isDarkMode ? 'rgba(15, 23, 42, 0.3)' : '#f1f5f9'),
                  borderColor: selectedCourt === 'Half Ground' ? '#10b981' : theme.border
                }
              ]}
              onPress={() => setSelectedCourt('Half Ground')}
            >
              <Text style={[styles.courtChipText, selectedCourt === 'Half Ground' ? { color: '#10b981', fontWeight: 'bold' } : { color: theme.textMuted }]}>
                Half Ground
              </Text>
            </TouchableOpacity>
          </View>

          {/* Timeline availability slider / ruler */}
          <Text style={[styles.availabilitySliderTitle, { color: theme.text }]}>Slide to check availability</Text>
          <View style={styles.rulerContainer}>
            <View style={[styles.rulerLine, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#cbd5e1' }]} />
            <View style={styles.rulerLabels}>
              {['6 PM', '7 PM', '8 PM', '9 PM', '10 PM', '11 PM'].map((label) => (
                <View key={label} style={styles.rulerMark}>
                  <View style={[styles.rulerTick, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.25)' : '#94a3b8' }]} />
                  <Text style={[styles.rulerLabelText, { color: theme.textMuted }]}>{label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Time range text input boxes From and To */}
          <View style={styles.timeRangeContainer}>
            <View style={styles.timeInputWrapper}>
              <Text style={[styles.timeInputLabel, { color: theme.textMuted }]}>From</Text>
              <View style={[styles.timeInputBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                <Ionicons name="time-outline" size={16} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="HH:MM"
                  placeholderTextColor={theme.textMuted}
                  style={[styles.timeTextEntry, { color: theme.text }]}
                />
              </View>
            </View>

            <View style={styles.timeInputWrapper}>
              <Text style={[styles.timeInputLabel, { color: theme.textMuted }]}>To</Text>
              <View style={[styles.timeInputBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                <Ionicons name="time-outline" size={16} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="HH:MM"
                  placeholderTextColor={theme.textMuted}
                  style={[styles.timeTextEntry, { color: theme.text }]}
                />
              </View>
            </View>
          </View>

          {/* Time Slots Grid display */}
          <View style={styles.slotsRowGrid}>
            {generated24Slots.map((time) => {
              const isSel = selectedTime === time;
              const isBooked = isSlotBooked(time);

              // format label display to match mockup start hours (e.g. 6:00 PM)
              const startLabel = time.split(' - ')[0]; 
              const [hours, minutes] = startLabel.split(':').map(Number);
              const period = hours >= 12 ? 'PM' : 'AM';
              const displayHours = hours % 12 === 0 ? 12 : hours % 12;
              
              const displayLabel = isBooked 
                ? `${displayHours}:00\nBooked` 
                : `${displayHours}:00\n${period}`;

              return (
                <TouchableOpacity
                  key={time}
                  disabled={isBooked}
                  style={[
                    styles.slotCardBadge,
                    {
                      backgroundColor: isBooked
                        ? 'rgba(239, 68, 68, 0.08)'
                        : isSel 
                          ? 'rgba(16, 185, 129, 0.15)' 
                          : (isDarkMode ? 'rgba(30, 41, 59, 0.4)' : '#f1f5f9'),
                      borderColor: isBooked
                        ? 'rgba(239, 68, 68, 0.4)'
                        : isSel 
                          ? '#10b981' 
                          : theme.border,
                      opacity: isBooked ? 0.8 : 1,
                    }
                  ]}
                  onPress={() => {
                    setSelectedTime(time);
                    const [start, end] = time.split(' - ');
                    setStartTime(start);
                    setEndTime(end);
                  }}
                >
                  <Text style={[
                    styles.slotBadgeText, 
                    { 
                      color: isBooked 
                        ? '#f87171' 
                        : isSel 
                          ? '#10b981' 
                          : theme.text,
                      fontWeight: (isSel || isBooked) ? 'bold' : 'normal',
                      textAlign: 'center',
                      fontSize: isBooked ? 10 : 11,
                    }
                  ]}>
                    {displayLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Sticky booking bar */}
      <View style={[styles.bookingBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <View>
          <Text style={styles.bookingBarLabel}>Total</Text>
          <Text style={[styles.bookingBarPrice, { color: theme.text }]}>{formatCurrency(turf.price)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.bookButton, !selectedTime && styles.bookButtonDisabled]}
          onPress={handleBook}
          disabled={!selectedTime}
        >
          <Text style={styles.bookButtonText}>
            {isAuthenticated ? 'Book Slot' : 'Sign in to Book'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  backgroundImage: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
  topGreetHeader: {
    paddingTop: 55,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#1e293b',
  },
  greetText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  greetSubText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
  },
  greetRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerPlaycoins: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  playcoinsText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '800',
  },
  headerBell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 100,
  },
  venueCountText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  bodyBanner: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  area: {
    fontSize: 12,
  },
  rating: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sportBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sportBadgeText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
  },
  desc: {
    fontSize: 12,
    lineHeight: 18,
  },
  bookingPanel: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 20,
    paddingBottom: 24,
    marginBottom: 20,
  },
  dragHandle: {
    width: 40,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  datesContainer: {
    marginBottom: 20,
  },
  datesContent: {
    gap: 10,
    paddingRight: 10,
  },
  dateChipCard: {
    width: 60,
    height: 80,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
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
    fontWeight: '700',
  },
  calendarIconCard: {
    width: 50,
    height: 80,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportTabRow: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
  },
  sportTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  activeSportTab: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  panelSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  courtHeaderName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  courtsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  courtChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(148, 163, 184, 0.15)',
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    alignItems: 'center',
  },
  activeCourtChip: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  courtChipText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  activeCourtChipText: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  availabilitySliderTitle: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  rulerContainer: {
    paddingVertical: 8,
    marginBottom: 24,
    alignItems: 'center',
    width: '100%',
  },
  rulerLine: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: '90%',
    position: 'absolute',
    top: 8,
  },
  rulerLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
  },
  rulerMark: {
    alignItems: 'center',
    gap: 4,
  },
  rulerTick: {
    width: 2,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  rulerLabelText: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '700',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 24,
  },
  timeInputWrapper: {
    flex: 1,
    gap: 6,
  },
  timeInputLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  timeInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  timeTextEntry: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    padding: 0,
  },
  slotsRowGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  slotCardBadge: {
    width: '23%',
    aspectRatio: 1.25,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 12,
  },
  bookingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    borderTopWidth: 1,
  },
  bookingBarLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 2,
  },
  bookingBarPrice: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  bookButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  bookButtonDisabled: {
    backgroundColor: '#1e293b',
  },
  bookButtonText: {
    color: '#020617',
    fontSize: 14,
    fontWeight: '800',
  },
  notFound: {
    flex: 1,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  notFoundText: {
    color: '#94a3b8',
    fontSize: 15,
  },
  backLink: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
});
