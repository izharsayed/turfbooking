import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  Platform,
  RefreshControl,
  Modal,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_DEFAULT } from '../components/CustomMap';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { formatCurrency, getBookingStatus } from '../utils/index';
import { useAuthStore } from '../store/authStore';
import { useBookingStore } from '../store/bookingStore';
import { useThemeStore } from '../store/themeStore';
export interface Turf {
  id: string;
  name: string;
  sport: string;
  price: number;
  rating: number;
  area: string;
  image: string;
  latitude: number;
  longitude: number;
  description: string;
  amenities: string[];
  slots: string[];
}
import { apiFetch } from '../utils/api';

const ACCENT = '#10b981';

const getTurfImageSource = (imagePath: string) => {
  if (!imagePath) {
    return require('../assets/football.jpg');
  }
  if (
    imagePath === '/images/football.jpg' ||
    imagePath.includes('football.jpg') ||
    imagePath.includes('photo-1575361204480-aadea25e6e68')
  ) {
    return require('../assets/football.jpg');
  }
  if (
    imagePath === '/images/cricket.jpg' ||
    imagePath.includes('cricket.jpg') ||
    imagePath.includes('photo-1607734834519-d8576ae60ea6') ||
    imagePath.includes('photo-1531415080290-bc98513989fe')
  ) {
    return require('../assets/cricket.jpg');
  }
  return { uri: imagePath };
};

function getBookingTimestamp(dateStr: string, timeStr: string): number {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    // Parse time
    const startPart = timeStr.split(' - ')[0]?.trim() || '';
    let hours = 0;
    let minutes = 0;
    
    if (startPart.toUpperCase().includes('AM') || startPart.toUpperCase().includes('PM')) {
      const cleanTime = startPart.replace(/(AM|PM)/i, '').trim();
      const [hStr, mStr] = cleanTime.split(':');
      hours = Number(hStr);
      minutes = Number(mStr);
      
      const isPM = startPart.toUpperCase().includes('PM');
      if (isPM && hours !== 12) {
        hours += 12;
      } else if (!isPM && hours === 12) {
        hours = 0;
      }
    } else {
      const [hStr, mStr] = startPart.split(':');
      hours = Number(hStr) || 0;
      minutes = Number(mStr) || 0;
    }
    date.setHours(hours, minutes, 0, 0);
    return date.getTime();
  } catch (e) {
    return 0;
  }
}

function TabItem({
  icon,
  label,
  onPress,
  color,
  active,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color: string;
  active?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.tabLabel, { color, fontWeight: active ? '800' : '600' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const faqs = [
  {
    q: 'Can I cancel my slot booking?',
    a: 'Yes! Cancellations are free up to 3 hours before the slot start time. The refund is credited back to your original payment method.',
  },
  {
    q: 'How long do refunds take to process?',
    a: 'Once cancelled, refunds are initiated immediately and usually reflect in your bank account in 2-3 business days.',
  },
  {
    q: 'How do I reschedule a booking?',
    a: 'You can reschedule from your reservation ticket details page. Select a new date and open slot at least 3 hours before the game start time.',
  },
  {
    q: 'Can I book multiple slots at once?',
    a: 'Yes, you can select multiple slots at once from the turf details grid and proceed to checkout.',
  },
  {
    q: 'Is my payment secure?',
    a: 'Absolutely. Payments are made directly to the venue via secure UPI transfer, and every booking is verified by the turf owner.',
  },
];

const getCategoryColor = (cat: string) => {
  switch (cat?.toUpperCase()) {
    case 'PAYMENTS': return '#ef4444';
    case 'BOOKINGS': return '#3b82f6';
    case 'TECHNICAL': return '#10b981';
    case 'COMPLAINT': return '#f59e0b';
    default: return '#6b7280';
  }
};

const getCategoryBg = (cat: string) => {
  switch (cat?.toUpperCase()) {
    case 'PAYMENTS': return 'rgba(239, 68, 68, 0.1)';
    case 'BOOKINGS': return 'rgba(59, 130, 246, 0.1)';
    case 'TECHNICAL': return 'rgba(16, 185, 129, 0.1)';
    case 'COMPLAINT': return 'rgba(245, 158, 11, 0.1)';
    default: return 'rgba(107, 114, 128, 0.1)';
  }
};

const getStatusColor = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'OPEN': return '#3b82f6';
    case 'IN_PROGRESS': return '#f59e0b';
    case 'RESOLVED': return '#10b981';
    case 'CLOSED': return '#6b7280';
    default: return '#6b7280';
  }
};

const getStatusBg = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'OPEN': return 'rgba(59, 130, 246, 0.1)';
    case 'IN_PROGRESS': return 'rgba(245, 158, 11, 0.1)';
    case 'RESOLVED': return 'rgba(16, 185, 129, 0.1)';
    case 'CLOSED': return 'rgba(107, 114, 128, 0.1)';
    default: return 'rgba(107, 114, 128, 0.1)';
  }
};

export default function HomeScreen() {
  const router = useRouter();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user } = useAuthStore();
  const bookings = useBookingStore((s) => s.bookings);
  const setBookings = useBookingStore((s) => s.setBookings);
  const { isDarkMode, toggleTheme } = useThemeStore();
  const [refreshing, setRefreshing] = useState(false);

  const [activeTab, setActiveTab] = useState<'explore' | 'bookings' | 'map' | 'support'>('explore');
  const [selectedMapTurf, setSelectedMapTurf] = useState<Turf | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('All');
  const [loadedTurfs, setLoadedTurfs] = useState<Turf[]>([]);
  const [loadingTurfs, setLoadingTurfs] = useState(false);

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const mapRef = useRef<MapView | null>(null);

  // Help & Support state variables
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('PAYMENTS');
  const [ticketDescription, setTicketDescription] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);
  const [supportSubTab, setSupportSubTab] = useState<'faq' | 'tickets'>('faq');

  const fetchTickets = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingTickets(true);
    try {
      const res = await apiFetch('/tickets');
      if (res.success && Array.isArray(res.data)) {
        setTickets(res.data);
      }
    } catch (err) {
    } finally {
      setLoadingTickets(false);
    }
  }, [isAuthenticated]);

  const handleRaiseTicket = async () => {
    if (!ticketSubject || !ticketDescription) return;
    setSubmittingTicket(true);
    try {
      const res = await apiFetch('/tickets', {
        method: 'POST',
        body: {
          subject: ticketSubject,
          description: ticketDescription,
          category: ticketCategory,
        },
      });

      if (res.success) {
        Alert.alert('Ticket Raised', 'Support ticket raised successfully!');
        setTicketSubject('');
        setTicketDescription('');
        setSupportModalVisible(false);
        fetchTickets();
      } else {
        Alert.alert('Submission Failed', res.message || 'Could not submit support ticket.');
      }
    } catch (err: any) {
      Alert.alert('Submission Failed', err.message || 'Could not submit support ticket. Please try again.');
    } finally {
      setSubmittingTicket(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'support' && isAuthenticated) {
      fetchTickets();
    }
  }, [activeTab, isAuthenticated, fetchTickets]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (activeTab === 'explore') {
        const res = await apiFetch('/turfs');
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const normalized = res.data.map((bt: any) => ({
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
          }));
          setLoadedTurfs(normalized);
        }
      } else if (activeTab === 'bookings' && isAuthenticated) {
        const res = await apiFetch('/bookings');
        if (res.success && Array.isArray(res.data)) {
          const mapped = res.data.map((b: any) => ({
            id: b.id,
            turfId: b.turfId,
            turfName: b.turfName,
            area: b.area,
            date: b.date,
            time: b.time,
            amount: b.amount,
            status: b.status === 'active' ? 'UPCOMING' : b.status === 'completed' ? 'COMPLETED' : 'CANCELLED',
          }));
          setBookings(mapped);
        }
      } else if (activeTab === 'support' && isAuthenticated) {
        await fetchTickets();
      }
    } catch (err) {
    } finally {
      setRefreshing(false);
    }
  }, [activeTab, isAuthenticated, fetchTickets]);

  useEffect(() => {
    if (tab === 'explore' || tab === 'bookings' || tab === 'map' || tab === 'support') {
      setActiveTab(tab);
      setSelectedMapTurf(null);
    }
  }, [tab]);

  const theme = {
    bg: isDarkMode ? '#030712' : '#f8fafc',
    card: isDarkMode ? 'rgba(15, 23, 42, 0.65)' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#cbd5e1',
    inputBg: isDarkMode ? 'rgba(3, 7, 18, 0.5)' : '#ffffff',
    headerBg: isDarkMode ? 'rgba(3, 7, 18, 0.6)' : 'rgba(255, 255, 255, 0.8)',
    tabBarBg: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : '#ffffff',
    bgImageOpacity: isDarkMode ? 0.35 : 0.22,
    overlayBg: isDarkMode ? 'rgba(3, 7, 18, 0.5)' : 'rgba(248, 250, 252, 0.6)',
  };

  useEffect(() => {
    const fetchTurfs = async () => {
      setLoadingTurfs(true);
      try {
        const res = await apiFetch('/turfs');
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const normalized = res.data.map((bt: any) => {
            const getMobileSportName = (s: string): string => {
              const map: Record<string, string> = {
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
            return {
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
            };
          });
          setLoadedTurfs(normalized);
        }
      } catch (err) {
      } finally {
        setLoadingTurfs(false);
      }
    };
    fetchTurfs();
  }, []);

  useEffect(() => {
    if (activeTab === 'bookings' && isAuthenticated) {
      const fetchBookings = async () => {
        try {
          const res = await apiFetch('/bookings');
          if (res.success && Array.isArray(res.data)) {
            const mapped = res.data.map((b: any) => ({
              id: b.id,
              turfId: b.turfId,
              turfName: b.turfName,
              area: b.area,
              date: b.date,
              time: b.time,
              amount: b.amount,
              status: b.status === 'active' ? 'UPCOMING' : b.status === 'completed' ? 'COMPLETED' : 'CANCELLED',
            }));
            setBookings(mapped);
          }
        } catch (err) {
        }
      };
      fetchBookings();
    }
  }, [activeTab, isAuthenticated]);

  useEffect(() => {
    if (activeTab === 'map') {
      (async () => {
        try {
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            setLocationPermission(false);
            return;
          }
          setLocationPermission(true);
          let location = await Location.getCurrentPositionAsync({});
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        } catch (e) {
        }
      })();
    }
  }, [activeTab]);

  const centerToUserLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location permissions in settings to view your position on the map.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(coords);

      mapRef.current?.animateToRegion({
        ...coords,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      }, 1000);
    } catch (e) {
      Alert.alert('Error', 'Unable to fetch your current GPS coordinates. Make sure location services are enabled on your device.');
    }
  };

  const filteredTurfs = loadedTurfs.filter(
    (t) =>
      (selectedSport === 'All' || t.sport === selectedSport) &&
      (t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.sport.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.area.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Image
        source={require('../assets/turf-bg.jpg')}
        style={[styles.backgroundImage, { opacity: theme.bgImageOpacity }]}
        resizeMode="cover"
      />
      <View style={[styles.overlay, { backgroundColor: theme.overlayBg }]} />

      {/* Header Profile Info bar */}
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>TurfBook</Text>
          <View style={styles.headerDot} />
          <TouchableOpacity onPress={toggleTheme} style={[styles.themeToggle, { borderColor: theme.border }]}>
            <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={15} color={isDarkMode ? '#fbbf24' : '#6366f1'} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.headerRight}>
          {isAuthenticated ? (
            <TouchableOpacity style={styles.profileRow} onPress={() => router.push('/profile')}>
              <Text style={[styles.profileText, { color: theme.textMuted }]}>Hi, {user?.name.split(' ')[0]}</Text>
              <Image
                source={{ uri: `https://avatar.iran.liara.run/public/boy?username=${user?.name || 'ahmed'}` }}
                style={styles.profileAvatarImage as any}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login')}>
              <Text style={styles.loginBtnText}>Sign In</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>


      {/* Map Tab — outside ScrollView so it fills the screen */}
      {activeTab === 'map' && (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_DEFAULT}
            style={styles.map}
            showsUserLocation={true}
            showsMyLocationButton={false}
            initialRegion={{
              latitude: 19.0948,
              longitude: 74.748,
              latitudeDelta: 0.12,
              longitudeDelta: 0.12,
            }}
          >
            {loadedTurfs.map((turf) => {
              const isFootball = turf.sport === 'Football';
              const markerColor = isFootball ? '#10b981' : '#eab308';

              return (
                <Marker
                  key={turf.id}
                  coordinate={{ latitude: turf.latitude, longitude: turf.longitude }}
                  onPress={() => setSelectedMapTurf(turf)}
                >
                  <View style={styles.pinContainer}>
                    <View style={[styles.pinCircle, { borderColor: markerColor, backgroundColor: theme.card }]}>
                      {isFootball ? (
                        <MaterialCommunityIcons name="soccer" size={18} color="#10b981" />
                      ) : (
                        <MaterialCommunityIcons name="cricket" size={18} color="#eab308" />
                      )}
                    </View>
                    <View style={[styles.pinArrow, { borderTopColor: markerColor }]} />
                  </View>
                  <Callout tooltip onPress={() => router.push(`/turf/${turf.id}`)}>
                    <View style={[styles.calloutBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <Text style={[styles.calloutName, { color: theme.text }]}>{turf.name}</Text>
                      <Text style={styles.calloutSport}>{turf.sport}</Text>
                      <Text style={[styles.calloutPrice, { color: theme.textMuted }]}>{formatCurrency(turf.price)}/hr</Text>
                    </View>
                  </Callout>
                </Marker>
              );
            })}
          </MapView>

          {/* Custom locate button floating on map */}
          <TouchableOpacity
            style={[
              styles.locateButton,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                bottom: selectedMapTurf ? 200 : 30
              }
            ]}
            onPress={centerToUserLocation}
          >
            <Ionicons name="locate" size={24} color="#10b981" />
          </TouchableOpacity>

          {/* Selected turf bottom card */}
          {selectedMapTurf && (
            <View style={[styles.mapCard, { backgroundColor: theme.card, borderColor: theme.border, bottom: 16 }]}>
              <View style={styles.mapCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.mapCardTitle, { color: theme.text }]}>{selectedMapTurf.name}</Text>
                  <Text style={[styles.mapCardArea, { color: theme.textMuted }]}>
                    <Ionicons name="location-outline" size={13} color={theme.textMuted} /> {selectedMapTurf.area}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedMapTurf(null)} style={{ padding: 4 }}>
                  <Ionicons name="close-circle-outline" size={22} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
              <View style={styles.mapCardRow}>
                <View style={styles.mapCardBadge}>
                  <Text style={styles.mapCardBadgeText}>{selectedMapTurf.sport}</Text>
                </View>
                <Text style={[styles.mapCardRating, { color: isDarkMode ? '#facc15' : '#eab308' }]}>
                  <Ionicons name="star" size={13} color={isDarkMode ? '#facc15' : '#eab308'} /> {selectedMapTurf.rating}
                </Text>
                <Text style={[styles.mapCardPrice, { color: theme.text }]}>{formatCurrency(selectedMapTurf.price)}/hr</Text>
              </View>
              <TouchableOpacity
                style={styles.mapCardButton}
                onPress={() => router.push(`/turf/${selectedMapTurf.id}`)}
              >
                <Text style={styles.mapCardButtonText}>Book This Turf →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {activeTab !== 'map' && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#10b981']}
              tintColor="#10b981"
            />
          }
        >
        {/* Tab 1: Explore */}
        {activeTab === 'explore' && (
          <View style={styles.section}>
            {/* Search Input Box */}
            <View style={[styles.searchContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <Ionicons name="search" size={18} color={theme.textMuted} style={{ marginRight: 10 }} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by city, sport or arena..."
                placeholderTextColor={theme.textMuted}
                style={[styles.searchInputNew, { color: theme.text }]}
              />
            </View>

            {/* Sport Categories Horizontal Strip */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesContainer}
              contentContainerStyle={styles.categoriesContent}
            >
              {['All', 'Football', 'Cricket', 'Box Cricket'].map((sport) => {
                const isActive = selectedSport === sport;
                let sportIcon = null;
                if (sport === 'All') {
                  sportIcon = <MaterialCommunityIcons name="stadium-variant" size={14} color={isActive ? '#030712' : '#10b981'} />;
                } else if (sport === 'Football') {
                  sportIcon = <Ionicons name="football" size={14} color={isActive ? '#030712' : '#10b981'} />;
                } else if (sport === 'Cricket') {
                  sportIcon = <MaterialCommunityIcons name="cricket" size={14} color={isActive ? '#030712' : '#eab308'} />;
                } else if (sport === 'Box Cricket') {
                  sportIcon = <MaterialCommunityIcons name="soccer-field" size={14} color={isActive ? '#030712' : '#10b981'} />;
                }

                return (
                  <TouchableOpacity
                    key={sport}
                    onPress={() => setSelectedSport(sport)}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isActive
                          ? '#10b981'
                          : isDarkMode
                          ? 'rgba(15, 23, 42, 0.65)'
                          : '#ffffff',
                        borderColor: isActive ? '#10b981' : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        {
                          color: isActive ? '#030712' : theme.text,
                          fontWeight: isActive ? '800' : '600',
                        },
                      ]}
                    >
                      {sportIcon} {sport}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[styles.sectionTitle, { color: theme.text }]}>Featured Arenas</Text>
            {filteredTurfs.map((turf) => (
              <TouchableOpacity
                key={turf.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => router.push(`/turf/${turf.id}`)}
              >
                {/* Image wrapper with relative positioning so badges can be absolute */}
                <View style={styles.cardImageWrapper}>
                  <Image source={getTurfImageSource(turf.image)} style={styles.cardImage} />
                  
                  {/* Sport overlay badge on top-left */}
                  <View style={styles.cardSportOverlayBadge}>
                    <Text style={styles.cardSportOverlayBadgeText}>{turf.sport.toUpperCase()}</Text>
                  </View>

                  {/* Rating overlay badge on top-right */}
                  <View style={styles.cardRatingOverlayBadge}>
                    <Text style={styles.cardRatingOverlayBadgeText}>
                      <Ionicons name="star" size={10} color="#facc15" /> {turf.rating}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardContentNew}>
                  <View style={styles.cardInfoRow}>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={[styles.cardTitleNew, { color: theme.text }]} numberOfLines={1}>
                        {turf.name}
                      </Text>
                      <Text style={[styles.cardAreaNew, { color: theme.textMuted }]}>
                        <Ionicons name="location-outline" size={11} color={theme.textMuted} /> {turf.area}
                      </Text>
                    </View>
                    <View style={styles.cardPriceWrapper}>
                      <Text style={[styles.cardPriceNew, { color: theme.text }]}>
                        {formatCurrency(turf.price)}
                      </Text>
                      <Text style={styles.cardPriceUnit}>/hr</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            {filteredTurfs.length === 0 && (
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>No arenas match your search.</Text>
            )}
          </View>
        )}

        {/* Tab 2: Bookings */}
        {activeTab === 'bookings' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>My reservations</Text>
            {bookings.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>You have no bookings yet.</Text>
            ) : (
              [...bookings]
                .sort((a, b) => {
                  const statusA = getBookingStatus(a.status, a.date, a.time);
                  const statusB = getBookingStatus(b.status, b.date, b.time);
                  
                  if (statusA === 'UPCOMING' && statusB !== 'UPCOMING') return -1;
                  if (statusA !== 'UPCOMING' && statusB === 'UPCOMING') return 1;
                  
                  const timeA = getBookingTimestamp(a.date, a.time);
                  const timeB = getBookingTimestamp(b.date, b.time);
                  
                  if (statusA === 'UPCOMING' && statusB === 'UPCOMING') {
                    return timeA - timeB; // soonest first
                  }
                  return timeB - timeA; // most recent past first
                })
                .map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={[
                    styles.bookingCard,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => router.push(`/booking/${b.id}`)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bookingId}>{b.id}</Text>
                    <Text style={[styles.bookingTitle, { color: theme.text }]}>{b.turfName}</Text>
                    <Text style={[styles.bookingSub, { color: theme.textMuted }]}>
                      {b.date} at {b.time}
                    </Text>
                  </View>
                  <View style={styles.bookingRight}>
                    <Text style={[styles.bookingAmount, { color: theme.text }]}>{formatCurrency(b.amount)}</Text>
                    {(() => {
                      const visualStatus = getBookingStatus(b.status, b.date, b.time);
                      return (
                        <Text
                          style={[
                            styles.statusBadge,
                            visualStatus === 'CANCELLED' && styles.statusCancelled,
                            visualStatus === 'COMPLETED' && styles.statusCompleted,
                          ]}
                        >
                          {visualStatus}
                        </Text>
                      );
                    })()}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Tab 4: Support */}
        {activeTab === 'support' && (
          <View style={styles.supportContainer}>
            <View style={styles.supportHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 4 }]}>Help & Support</Text>
              <Text style={[styles.detailDesc, { color: theme.textMuted, marginBottom: 16 }]}>
                Find quick answers to common questions or submit a support query below.
              </Text>
            </View>

            {/* Sub Tabs Switcher */}
            <View style={[styles.supportTabSwitcher, { backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.4)' : '#f1f5f9', borderColor: theme.border }]}>
              <TouchableOpacity
                style={[styles.supportSubTabItem, supportSubTab === 'faq' && { backgroundColor: theme.card }]}
                onPress={() => setSupportSubTab('faq')}
              >
                <Text style={[styles.supportSubTabText, { color: supportSubTab === 'faq' ? '#10b981' : theme.textMuted, fontWeight: supportSubTab === 'faq' ? 'bold' : 'normal' }]}>
                  FAQs
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.supportSubTabItem, supportSubTab === 'tickets' && { backgroundColor: theme.card }]}
                onPress={() => setSupportSubTab('tickets')}
              >
                <Text style={[styles.supportSubTabText, { color: supportSubTab === 'tickets' ? '#10b981' : theme.textMuted, fontWeight: supportSubTab === 'tickets' ? 'bold' : 'normal' }]}>
                  My Tickets
                </Text>
              </TouchableOpacity>
            </View>

            {supportSubTab === 'faq' ? (
              <View style={styles.faqSection}>
                {/* Accordion List */}
                {faqs.map((faq, index) => {
                  const isExp = expandedFaqIndex === index;
                  return (
                    <View key={index} style={[styles.faqCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <TouchableOpacity
                        style={styles.faqQuestionHeader}
                        onPress={() => setExpandedFaqIndex(isExp ? null : index)}
                      >
                        <Text style={[styles.faqQuestionText, { color: theme.text }]}>{faq.q}</Text>
                        <Ionicons
                          name={isExp ? 'chevron-up-outline' : 'chevron-down-outline'}
                          size={18}
                          color={theme.textMuted}
                        />
                      </TouchableOpacity>
                      {isExp && (
                        <View style={[styles.faqAnswerContainer, { borderTopColor: theme.border }]}>
                          <Text style={[styles.faqAnswerText, { color: theme.textMuted }]}>{faq.a}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}

                {/* Contact Channels */}
                <Text style={[styles.channelTitle, { color: theme.text, marginTop: 24 }]}>Still Need Help?</Text>
                <View style={styles.channelsContainer}>
                  <TouchableOpacity
                    style={[styles.channelCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                    onPress={() => Alert.alert('Calling Support', 'Connecting you to our helpline +1-800-TURF-BOOK...')}
                  >
                    <Ionicons name="call-outline" size={20} color="#10b981" />
                    <Text style={[styles.channelLabel, { color: theme.text }]}>Call Helpline</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.channelCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                    onPress={() => Alert.alert('WhatsApp Support', 'Opening WhatsApp Support...')}
                  >
                    <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                    <Text style={[styles.channelLabel, { color: theme.text }]}>WhatsApp Us</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.ticketsSection}>
                {/* Tickets History List */}
                {!isAuthenticated ? (
                  <View style={styles.emptySupportContainer}>
                    <Text style={{ color: theme.textMuted, textAlign: 'center' }}>
                      Please sign in to view and create support tickets.
                    </Text>
                  </View>
                ) : loadingTickets && tickets.length === 0 ? (
                  <ActivityIndicator size="small" color="#10b981" style={{ marginVertical: 30 }} />
                ) : tickets.length === 0 ? (
                  <View style={styles.emptySupportContainer}>
                    <Ionicons name="chatbubbles-outline" size={48} color={theme.textMuted} style={{ opacity: 0.5, marginBottom: 8 }} />
                    <Text style={{ color: theme.textMuted, textAlign: 'center', fontSize: 13 }}>
                      You haven't raised any support tickets yet.
                    </Text>
                  </View>
                ) : (
                  tickets.map((t) => (
                    <View key={t.id} style={[styles.ticketCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <View style={styles.ticketHeaderRow}>
                        <View style={[styles.ticketCategoryBadge, { backgroundColor: getCategoryBg(t.category) }]}>
                          <Text style={[styles.ticketCategoryBadgeText, { color: getCategoryColor(t.category) }]}>
                            {t.category}
                          </Text>
                        </View>
                        <View style={[styles.ticketStatusBadge, { backgroundColor: getStatusBg(t.status) }]}>
                          <Text style={[styles.ticketStatusBadgeText, { color: getStatusColor(t.status) }]}>
                            {t.status}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.ticketSubjectText, { color: theme.text }]}>{t.subject}</Text>
                      <Text style={[styles.ticketDescText, { color: theme.textMuted }]}>{t.description}</Text>
                      <Text style={[styles.ticketDateText, { color: theme.textMuted }]}>
                        {new Date(t.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  ))
                )}

                {isAuthenticated && (
                  <TouchableOpacity
                    style={styles.raiseTicketFloatingBtn}
                    onPress={() => setSupportModalVisible(true)}
                  >
                    <Ionicons name="add-circle" size={18} color="#020617" />
                    <Text style={styles.raiseTicketFloatingBtnText}>New Support Ticket</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
      )}

      {/* Raise Ticket Modal */}
      <Modal
        visible={supportModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSupportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Raise Support Ticket</Text>
              <TouchableOpacity onPress={() => setSupportModalVisible(false)}>
                <Ionicons name="close-circle-outline" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Category selector chips */}
              <Text style={[styles.inputLabel, { color: theme.textMuted, marginBottom: 8 }]}>Category</Text>
              <View style={styles.ticketCategoryChipsContainer}>
                {['PAYMENTS', 'BOOKINGS', 'TECHNICAL', 'COMPLAINT'].map((cat) => {
                  const isActive = ticketCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.ticketCategoryChip,
                        {
                          backgroundColor: isActive ? 'rgba(16, 185, 129, 0.1)' : theme.card,
                          borderColor: isActive ? '#10b981' : theme.border,
                        }
                      ]}
                      onPress={() => setTicketCategory(cat)}
                    >
                      <Text style={[styles.ticketCategoryChipText, { color: isActive ? '#10b981' : theme.textMuted, fontWeight: isActive ? 'bold' : 'normal' }]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Subject Input */}
              <Text style={[styles.inputLabel, { color: theme.textMuted, marginTop: 20, marginBottom: 8 }]}>Subject</Text>
              <TextInput
                style={[styles.supportTextInput, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                placeholder="Briefly state the issue..."
                placeholderTextColor={theme.textMuted}
                value={ticketSubject}
                onChangeText={setTicketSubject}
              />

              {/* Description Input */}
              <Text style={[styles.inputLabel, { color: theme.textMuted, marginTop: 20, marginBottom: 8 }]}>Description</Text>
              <TextInput
                style={[styles.supportTextArea, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                placeholder="Describe your issue in detail..."
                placeholderTextColor={theme.textMuted}
                value={ticketDescription}
                onChangeText={setTicketDescription}
                multiline
                numberOfLines={4}
              />

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitTicketBtn,
                  {
                    backgroundColor: ticketSubject && ticketDescription ? '#10b981' : 'rgba(16, 185, 129, 0.3)',
                    marginTop: 30,
                  }
                ]}
                disabled={!ticketSubject || !ticketDescription || submittingTicket}
                onPress={handleRaiseTicket}
              >
                {submittingTicket ? (
                  <ActivityIndicator size="small" color="#020617" />
                ) : (
                  <Text style={styles.submitTicketText}>Submit Ticket</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation Bar */}
      <View
        style={[
          styles.bottomTabBar,
          { paddingBottom: Math.max(insets.bottom, 10), backgroundColor: theme.card, borderTopColor: theme.border },
        ]}
      >
        <TabItem
          icon={activeTab === 'explore' ? 'home' : 'home-outline'}
          label="Home"
          onPress={() => {
            setActiveTab('explore');
            setSelectedMapTurf(null);
          }}
          color={activeTab === 'explore' ? ACCENT : theme.textMuted}
          active={activeTab === 'explore'}
        />
        <TabItem
          icon={activeTab === 'map' ? 'map' : 'map-outline'}
          label="Nearby"
          onPress={() => {
            setActiveTab('map');
            setSelectedMapTurf(null);
          }}
          color={activeTab === 'map' ? ACCENT : theme.textMuted}
          active={activeTab === 'map'}
        />
        <TabItem
          icon={activeTab === 'bookings' ? 'calendar' : 'calendar-outline'}
          label="Booking"
          onPress={() => {
            if (!isAuthenticated) {
              router.push('/login');
            } else {
              setActiveTab('bookings');
              setSelectedMapTurf(null);
            }
          }}
          color={activeTab === 'bookings' ? ACCENT : theme.textMuted}
          active={activeTab === 'bookings'}
        />
        <TabItem
          icon="person-outline"
          label="Profile"
          onPress={() => {
            if (!isAuthenticated) {
              router.push('/login');
            } else {
              router.push('/profile');
            }
          }}
          color={theme.textMuted}
        />
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
    opacity: 0.18,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(3, 7, 18, 0.65)',
  },
  header: {
    paddingTop: 55,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeToggle: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.15)',
  },
  themeToggleText: {
    fontSize: 14,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileText: {
    fontWeight: '700',
    fontSize: 13,
  },
  profileAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
  },
  loginBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  loginBtnText: {
    color: '#030712',
    fontWeight: '800',
    fontSize: 12,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
  },
  activeTabButton: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  activeTabButtonText: {
    color: '#020617',
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
  },
  searchInputNew: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    padding: 0,
  },
  categoriesContainer: {
    marginBottom: 20,
    marginTop: -8,
  },
  categoriesContent: {
    gap: 8,
    paddingRight: 20,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  categoryChipText: {
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 30,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    marginBottom: 20,
  },
  cardImageWrapper: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardSportOverlayBadge: {
    position: 'absolute',
    left: 14,
    top: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cardSportOverlayBadgeText: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardRatingOverlayBadge: {
    position: 'absolute',
    right: 14,
    top: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.95)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cardRatingOverlayBadgeText: {
    color: '#030712',
    fontSize: 10,
    fontWeight: '800',
  },
  cardContentNew: {
    padding: 16,
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitleNew: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardAreaNew: {
    fontSize: 12,
  },
  cardPriceWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  cardPriceNew: {
    fontSize: 18,
    fontWeight: '900',
  },
  cardPriceUnit: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  sportBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    color: '#10b981',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  detailDesc: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 20,
  },
  bookingCard: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingId: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bookingTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  bookingSub: {
    fontSize: 12,
    color: '#94a3b8',
  },
  bookingRight: {
    alignItems: 'flex-end',
  },
  bookingAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  statusBadge: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: 'bold',
  },
  statusCancelled: {
    color: '#ef4444',
  },
  statusCompleted: {
    color: '#94a3b8',
  },
  supportButton: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  supportButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },

  // ---- Map Tab Styles ----
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
    width: '100%',
  },
  pinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  pinCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinEmoji: {
    fontSize: 16,
  },
  pinArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1.5,
  },
  calloutBox: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#10b981',
    minWidth: 150,
  },
  calloutName: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 2,
  },
  calloutSport: {
    color: '#10b981',
    fontSize: 11,
    marginBottom: 4,
  },
  calloutPrice: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  mapCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#0c1122',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  mapCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  mapCardTitle: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
  },
  mapCardArea: {
    color: '#64748b',
    fontSize: 12,
  },
  mapCardClose: {
    color: '#64748b',
    fontSize: 18,
    paddingLeft: 12,
  },
  mapCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  mapCardBadge: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  mapCardBadgeText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  mapCardRating: {
    color: '#facc15',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  mapCardPrice: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  mapCardButton: {
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  mapCardButtonText: {
    color: '#020617',
    fontWeight: 'bold',
    fontSize: 14,
  },
  bottomTabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 10,
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  locateButton: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  supportContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  supportHeader: {
    marginBottom: 5,
  },
  supportTabSwitcher: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 4,
    marginBottom: 20,
  },
  supportSubTabItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportSubTabText: {
    fontSize: 13,
  },
  faqSection: {
    gap: 12,
  },
  faqCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  faqQuestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestionText: {
    fontSize: 13.5,
    fontWeight: '700',
    flex: 1,
    paddingRight: 10,
  },
  faqAnswerContainer: {
    borderTopWidth: 1,
    marginTop: 10,
    paddingTop: 10,
  },
  faqAnswerText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  channelTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  channelsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  channelCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  channelLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  ticketsSection: {
    gap: 12,
    paddingBottom: 20,
  },
  emptySupportContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
  },
  ticketHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ticketCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ticketCategoryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  ticketStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ticketStatusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  ticketSubjectText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ticketDescText: {
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 8,
  },
  ticketDateText: {
    fontSize: 10,
  },
  raiseTicketFloatingBtn: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
    marginTop: 10,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  raiseTicketFloatingBtnText: {
    color: '#020617',
    fontWeight: 'bold',
    fontSize: 13,
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
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  ticketCategoryChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ticketCategoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  ticketCategoryChipText: {
    fontSize: 11,
  },
  supportTextInput: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    fontSize: 13,
  },
  supportTextArea: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitTicketBtn: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitTicketText: {
    color: '#020617',
    fontWeight: 'bold',
    fontSize: 14,
  },
  menuDivider: {
    height: 1,
    width: '100%',
  },
});
