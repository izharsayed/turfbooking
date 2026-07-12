import React, { useState, useEffect, useRef } from 'react';
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
import { turfs, type Turf } from '../data/turfs';
import { apiFetch } from '../utils/api';

const ACCENT = '#10b981';

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

export default function HomeScreen() {
  const router = useRouter();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user } = useAuthStore();
  const bookings = useBookingStore((s) => s.bookings);
  const setBookings = useBookingStore((s) => s.setBookings);
  const { isDarkMode, toggleTheme } = useThemeStore();

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

  const [activeTab, setActiveTab] = useState<'explore' | 'bookings' | 'map' | 'support'>('explore');
  const [selectedMapTurf, setSelectedMapTurf] = useState<Turf | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('All');
  const [loadedTurfs, setLoadedTurfs] = useState<Turf[]>(turfs);
  const [loadingTurfs, setLoadingTurfs] = useState(false);

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    const fetchTurfs = async () => {
      setLoadingTurfs(true);
      try {
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
      } catch (err) {
        console.log('Failed to fetch active turfs from API, falling back to mock data', err);
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
          console.log('Failed to fetch bookings from backend', err);
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
          console.log('Error requesting location', e);
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
                        <Text style={styles.pinEmoji}>🏏</Text>
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
                  <Text style={[styles.mapCardArea, { color: theme.textMuted }]}>📍 {selectedMapTurf.area}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedMapTurf(null)} style={{ padding: 4 }}>
                  <Ionicons name="close-circle-outline" size={22} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
              <View style={styles.mapCardRow}>
                <View style={styles.mapCardBadge}>
                  <Text style={styles.mapCardBadgeText}>{selectedMapTurf.sport}</Text>
                </View>
                <Text style={[styles.mapCardRating, { color: isDarkMode ? '#facc15' : '#eab308' }]}>★ {selectedMapTurf.rating}</Text>
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

      <ScrollView
        style={[styles.scroll, activeTab === 'map' && { display: 'none' }]}
        contentContainerStyle={{ paddingBottom: 100 }}
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
                let sportIcon = '';
                if (sport === 'All') sportIcon = '🏟️';
                else if (sport === 'Football') sportIcon = '⚽';
                else if (sport === 'Cricket') sportIcon = '🏏';
                else if (sport === 'Box Cricket') sportIcon = '🥅';

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
                  <Image source={{ uri: turf.image }} style={styles.cardImage} />
                  
                  {/* Sport overlay badge on top-left */}
                  <View style={styles.cardSportOverlayBadge}>
                    <Text style={styles.cardSportOverlayBadgeText}>{turf.sport.toUpperCase()}</Text>
                  </View>

                  {/* Rating overlay badge on top-right */}
                  <View style={styles.cardRatingOverlayBadge}>
                    <Text style={styles.cardRatingOverlayBadgeText}>★ {turf.rating}</Text>
                  </View>
                </View>

                <View style={styles.cardContentNew}>
                  <View style={styles.cardInfoRow}>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={[styles.cardTitleNew, { color: theme.text }]} numberOfLines={1}>
                        {turf.name}
                      </Text>
                      <Text style={[styles.cardAreaNew, { color: theme.textMuted }]}>
                        📍 {turf.area}
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
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Help center</Text>
            <Text style={[styles.detailDesc, { color: theme.textMuted }]}>
              Encountered issues with payment settlement or double slot booking? Create a ticket and
              our 24/7 staff support will address it immediately.
            </Text>

            <TouchableOpacity
              style={[
                styles.supportButton,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => Alert.alert('Ticket Raised', 'Support ticket raised successfully!')}
            >
              <Text style={[styles.supportButtonText, { color: theme.text }]}>Raise Support Ticket</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

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
          icon="trophy-outline"
          label="Matches"
          onPress={() => Alert.alert('Matches', 'Matches feature coming soon!')}
          color={theme.textMuted}
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
});
