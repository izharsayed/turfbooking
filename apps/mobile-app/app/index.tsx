import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Modal,
  Alert,
  Dimensions
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_DEFAULT } from 'react-native-maps';
import { formatCurrency } from '@turf-booking/utils';
import { useAuthStore } from '../store/authStore.js';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Turf {
  id: string;
  name: string;
  sport: string;
  price: number;
  rating: number;
  area: string;
  image: string;
}

const mockTurfs: Turf[] = [
  {
    id: '1',
    name: 'Old Trafford Arena',
    sport: 'Football',
    price: 1200,
    rating: 4.8,
    area: 'Savedi, Ahmednagar',
    image: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: '2',
    name: 'Lords Cricket Club',
    sport: 'Cricket',
    price: 1500,
    rating: 4.9,
    area: 'Pipeline Road, Ahmednagar',
    image: 'https://images.unsplash.com/photo-1607734834519-d8576ae60ea6?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: '3',
    name: 'Wembley Futsal Dome',
    sport: 'Box Cricket',
    price: 1000,
    rating: 4.7,
    area: 'Kedgaon, Ahmednagar',
    image: 'https://images.unsplash.com/photo-1518605076385-7bf7b1f54411?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: '4',
    name: 'Camp Nou Arena',
    sport: 'Football',
    price: 1800,
    rating: 4.9,
    area: 'Gulmohar Road, Ahmednagar',
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=60'
  }
];

const turfLocations = [
  {
    id: '1',
    name: 'Old Trafford Arena',
    sport: 'Football',
    price: 1200,
    rating: 4.8,
    area: 'Savedi, Ahmednagar',
    latitude: 19.1158,
    longitude: 74.7420,
  },
  {
    id: '2',
    name: 'Lords Cricket Club',
    sport: 'Cricket',
    price: 1500,
    rating: 4.9,
    area: 'Pipeline Road, Ahmednagar',
    latitude: 19.1035,
    longitude: 74.7562,
  },
  {
    id: '3',
    name: 'Wembley Futsal Dome',
    sport: 'Box Cricket',
    price: 1000,
    rating: 4.7,
    area: 'Kedgaon, Ahmednagar',
    latitude: 19.0745,
    longitude: 74.7335,
  },
  {
    id: '4',
    name: 'Camp Nou Arena',
    sport: 'Football',
    price: 1800,
    rating: 4.9,
    area: 'Gulmohar Road, Ahmednagar',
    latitude: 19.1235,
    longitude: 74.7485,
  },
];

export default function HomeScreen() {
  const { isAuthenticated, user, login, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'explore' | 'bookings' | 'map' | 'support'>('explore');
  const [selectedMapTurf, setSelectedMapTurf] = useState<(typeof turfLocations)[0] | null>(null);
  const [selectedTurf, setSelectedTurf] = useState<Turf | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Auth simulation
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);

  // Booking items
  const [bookings, setBookings] = useState<any[]>([
    { id: 'B-88392', turfName: 'Old Trafford Arena', date: '2026-07-06', time: '18:00 - 19:00', amount: 1200, status: 'UPCOMING' }
  ]);

  const handleSendOtp = () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }
    Alert.alert('OTP Dispatched', `💬 SMS OTP Sent to +91 ${phone}: [ 123456 ] (Mock OTP)`);
    setOtpSent(true);
  };

  const handleLogin = () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    if (isRegisterMode) {
      if (!name) {
        Alert.alert('Error', 'Please enter your name');
        return;
      }
      login({ 
        id: 'USR-101', 
        email: email || `${phone}@turfbook.com`, 
        name, 
        phone, 
        role: 'CUSTOMER' 
      }, 'dummy_token');
    } else {
      // Login
      if (loginMethod === 'otp') {
        if (!otpSent) {
          handleSendOtp();
          return;
        }
        if (otp !== '123456') {
          Alert.alert('Error', 'Invalid OTP code');
          return;
        }
      } else {
        if (!password) {
          Alert.alert('Error', 'Please enter your password');
          return;
        }
      }

      login({ 
        id: 'USR-101', 
        email: `${phone}@turfbook.com`, 
        name: `User ${phone.slice(-4)}`, 
        phone, 
        role: 'CUSTOMER' 
      }, 'dummy_token');
    }

    setAuthModalVisible(false);
    setOtpSent(false);
    setOtp('');
  };

  const handleBook = () => {
    if (!isAuthenticated) {
      setAuthModalVisible(true);
      return;
    }
    if (!selectedTime) {
      Alert.alert('Error', 'Please select a time slot');
      return;
    }

    const newBooking = {
      id: `B-${Math.floor(10000 + Math.random() * 90000)}`,
      turfName: selectedTurf!.name,
      date: '2026-07-05',
      time: selectedTime,
      amount: selectedTurf!.price,
      status: 'UPCOMING'
    };

    setBookings([newBooking, ...bookings]);
    setSelectedTurf(null);
    setSelectedTime(null);
    Alert.alert('Success', 'Your slot has been successfully booked via Razorpay mock!');
  };

  const filteredTurfs = mockTurfs.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.sport.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header Profile Info bar */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TurfBook</Text>
        {isAuthenticated ? (
          <View style={styles.profileRow}>
            <Text style={styles.profileText}>Hi, {user?.name}</Text>
            <TouchableOpacity onPress={logout}>
              <Text style={styles.logoutBtn}>Logout</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.loginBtn} onPress={() => setAuthModalVisible(true)}>
            <Text style={styles.loginBtnText}>Sign In</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {(['explore', 'bookings', 'map', 'support'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
            onPress={() => { setActiveTab(tab); setSelectedTurf(null); setSelectedMapTurf(null); }}
          >
            <Text style={[styles.tabButtonText, activeTab === tab && styles.activeTabButtonText]}>
              {tab === 'map' ? '🗺️ Map' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Map Tab — outside ScrollView so it fills the screen */}
      {activeTab === 'map' && (
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_DEFAULT}
            style={styles.map}
            initialRegion={{
              latitude: 19.0948,
              longitude: 74.7480,
              latitudeDelta: 0.12,
              longitudeDelta: 0.12,
            }}
          >
            {turfLocations.map((turf) => (
              <Marker
                key={turf.id}
                coordinate={{ latitude: turf.latitude, longitude: turf.longitude }}
                onPress={() => setSelectedMapTurf(turf)}
              >
                <View style={styles.markerBubble}>
                  <Text style={styles.markerText}>⚽</Text>
                </View>
                <Callout tooltip>
                  <View style={styles.calloutBox}>
                    <Text style={styles.calloutName}>{turf.name}</Text>
                    <Text style={styles.calloutSport}>{turf.sport}</Text>
                    <Text style={styles.calloutPrice}>{formatCurrency(turf.price)}/hr</Text>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>

          {/* Selected turf bottom card */}
          {selectedMapTurf && (
            <View style={styles.mapCard}>
              <View style={styles.mapCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mapCardTitle}>{selectedMapTurf.name}</Text>
                  <Text style={styles.mapCardArea}>📍 {selectedMapTurf.area}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedMapTurf(null)}>
                  <Text style={styles.mapCardClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.mapCardRow}>
                <View style={styles.mapCardBadge}>
                  <Text style={styles.mapCardBadgeText}>{selectedMapTurf.sport}</Text>
                </View>
                <Text style={styles.mapCardRating}>★ {selectedMapTurf.rating}</Text>
                <Text style={styles.mapCardPrice}>{formatCurrency(selectedMapTurf.price)}/hr</Text>
              </View>
              <TouchableOpacity
                style={styles.mapCardButton}
                onPress={() => {
                  const turf = mockTurfs.find(t => t.id === selectedMapTurf.id);
                  if (turf) { setSelectedTurf(turf); setActiveTab('explore'); setSelectedMapTurf(null); }
                }}
              >
                <Text style={styles.mapCardButtonText}>Book This Turf →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <ScrollView style={[styles.scroll, activeTab === 'map' && { display: 'none' }]}>
        {activeTab === 'explore' && !selectedTurf && (
          <View style={styles.section}>
            {/* Search Input */}
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by city, sport or arena..."
              placeholderTextColor="#64748b"
              style={styles.searchInput}
            />

            <Text style={styles.sectionTitle}>Featured Arenas</Text>
            {filteredTurfs.map((turf) => (
              <TouchableOpacity
                key={turf.id}
                style={styles.card}
                onPress={() => setSelectedTurf(turf)}
              >
                <Image source={{ uri: turf.image }} style={styles.cardImage} />
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{turf.name}</Text>
                    <Text style={styles.rating}>★ {turf.rating}</Text>
                  </View>
                  <Text style={styles.cardArea}>{turf.area}</Text>
                  <View style={styles.cardFooter}>
                    <Text style={styles.sportBadge}>{turf.sport}</Text>
                    <Text style={styles.price}>{formatCurrency(turf.price)}/hr</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Selected Turf Detail modal */}
        {selectedTurf && (
          <View style={styles.detailSection}>
            <TouchableOpacity onPress={() => setSelectedTurf(null)}>
              <Text style={styles.backLink}>&larr; Back to Explore</Text>
            </TouchableOpacity>

            <Image source={{ uri: selectedTurf.image }} style={styles.detailImage} />
            <Text style={styles.detailTitle}>{selectedTurf.name}</Text>
            <Text style={styles.detailSport}>{selectedTurf.sport} Pitch</Text>
            
            <Text style={styles.detailDesc}>
              Premium synthetic grass dome offering professional lighting towers, high-grade shock absorption pads, and fully secure locker rooms.
            </Text>

            <Text style={styles.subTitle}>Select time slot</Text>
            <View style={styles.slotsRow}>
              {['17:00 - 18:00', '18:00 - 19:00', '19:00 - 20:00', '20:00 - 21:00'].map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[styles.slotCard, selectedTime === time && styles.activeSlotCard]}
                  onPress={() => setSelectedTime(time)}
                >
                  <Text style={[styles.slotText, selectedTime === time && styles.activeSlotText]}>{time}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.bookButton} onPress={handleBook}>
              <Text style={styles.bookButtonText}>Book Slot via Razorpay</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tab 2: Bookings */}
        {activeTab === 'bookings' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My active reservations</Text>
            {bookings.map((b) => (
              <View key={b.id} style={styles.bookingCard}>
                <View>
                  <Text style={styles.bookingId}>{b.id}</Text>
                  <Text style={styles.bookingTitle}>{b.turfName}</Text>
                  <Text style={styles.bookingSub}>{b.date} at {b.time}</Text>
                </View>
                <View style={styles.bookingRight}>
                  <Text style={styles.bookingAmount}>{formatCurrency(b.amount)}</Text>
                  <Text style={styles.statusBadge}>{b.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Tab 3: Map — rendered outside ScrollView above */}

        {/* Tab 4: Support */}
        {activeTab === 'support' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Help center</Text>
            <Text style={styles.detailDesc}>
              Encountered issues with payment settlement or double slot booking? Create a ticket and our 24/7 staff support will address it immediately.
            </Text>
            
            <TouchableOpacity style={styles.supportButton} onPress={() => Alert.alert('Ticket Raised', 'Support ticket raised successfully!')}>
              <Text style={styles.supportButtonText}>Raise Support Ticket</Text>
            </TouchableOpacity>
          </View>
        )}
      {activeTab !== 'map' && <View />}
      </ScrollView>

      {/* Auth Modal */}
      <Modal visible={authModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Title */}
            <Text style={styles.modalTitle}>
              {isRegisterMode ? 'Create Account' : 'Welcome Back'}
            </Text>

            {/* Login Method Toggle Tabs */}
            {!isRegisterMode && (
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  onPress={() => {
                    setLoginMethod('password');
                    setOtpSent(false);
                    setOtp('');
                  }}
                  style={[styles.authTabButton, loginMethod === 'password' && styles.tabButtonActive]}
                >
                  <Text style={[styles.authTabButtonText, loginMethod === 'password' && styles.tabButtonTextActive]}>
                    Password
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setLoginMethod('otp')}
                  style={[styles.authTabButton, loginMethod === 'otp' && styles.tabButtonActive]}
                >
                  <Text style={[styles.authTabButtonText, loginMethod === 'otp' && styles.tabButtonTextActive]}>
                    OTP Login
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Form Fields */}
            <View style={{ gap: 12, marginBottom: 16 }}>
              {/* REGISTER ONLY: Name */}
              {isRegisterMode && (
                <View>
                  <Text style={styles.fieldLabel}>FULL NAME</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your name"
                    placeholderTextColor="#64748b"
                    style={styles.modalInputText}
                  />
                </View>
              )}

              {/* PRIMARY: Phone Number */}
              <View>
                <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
                <View style={styles.phoneInputRow}>
                  <View style={styles.phoneCodeContainer}>
                    <Text style={styles.phoneCodeText}>+91</Text>
                  </View>
                  <TextInput
                    value={phone}
                    onChangeText={(val) => setPhone(val.replace(/[^0-9]/g, ''))}
                    placeholder="9876543210"
                    placeholderTextColor="#64748b"
                    keyboardType="phone-pad"
                    maxLength={10}
                    style={styles.phoneInputText}
                  />
                </View>
              </View>

              {/* REGISTER ONLY: Email (Optional) */}
              {isRegisterMode && (
                <View>
                  <Text style={styles.fieldLabel}>EMAIL ADDRESS (OPTIONAL)</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="name@example.com"
                    placeholderTextColor="#64748b"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.modalInputText}
                  />
                </View>
              )}

              {/* DYNAMIC: Password or OTP Code */}
              {!isRegisterMode && loginMethod === 'otp' ? (
                otpSent && (
                  <View>
                    <Text style={styles.fieldLabel}>6-DIGIT OTP CODE</Text>
                    <TextInput
                      value={otp}
                      onChangeText={(val) => setOtp(val.replace(/[^0-9]/g, ''))}
                      placeholder="------"
                      placeholderTextColor="#64748b"
                      keyboardType="number-pad"
                      maxLength={6}
                      style={[styles.modalInputText, { textAlign: 'center', letterSpacing: 8, fontWeight: 'bold' }]}
                    />
                  </View>
                )
              ) : (
                /* PASSWORD FIELD (Login with Password OR Register with Password) */
                <View>
                  <Text style={styles.fieldLabel}>PASSWORD</Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#64748b"
                    secureTextEntry={true}
                    style={styles.modalInputText}
                  />
                </View>
              )}
            </View>

            {/* Action Button */}
            <TouchableOpacity style={styles.modalButton} onPress={handleLogin}>
              <Text style={styles.modalButtonText}>
                {isRegisterMode
                  ? 'Sign Up & Create Account'
                  : loginMethod === 'otp'
                    ? otpSent ? 'Verify & Login' : 'Send Verification OTP'
                    : 'Login'}
              </Text>
            </TouchableOpacity>

            {/* Mode Toggle Link */}
            <TouchableOpacity
              onPress={() => {
                setIsRegisterMode(!isRegisterMode);
                setOtpSent(false);
                setOtp('');
              }}
              style={styles.modeToggleContainer}
            >
              <Text style={styles.modeToggleText}>
                {isRegisterMode ? 'Already registered? ' : "Don't have an account? "}
                <Text style={styles.modeToggleHighlight}>
                  {isRegisterMode ? 'Login' : 'Sign Up'}
                </Text>
              </Text>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={() => {
                setAuthModalVisible(false);
                setOtpSent(false);
                setOtp('');
              }}
              style={styles.modalClose}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617', // Slate 950
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#020617',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileText: {
    color: '#10b981',
    fontWeight: '600',
    fontSize: 14,
  },
  logoutBtn: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
  },
  loginBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  loginBtnText: {
    color: '#020617',
    fontWeight: 'bold',
    fontSize: 12,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#0f172a',
  },
  activeTabButton: {
    backgroundColor: '#10b981',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  activeTabButtonText: {
    color: '#020617',
    fontWeight: 'bold',
  },
  scroll: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  searchInput: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#0c1122',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 18,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  cardImage: {
    height: 160,
    width: '100%',
  },
  cardContent: {
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  rating: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  cardArea: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.5)',
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
  detailSection: {
    padding: 20,
  },
  backLink: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 16,
  },
  detailImage: {
    height: 200,
    width: '100%',
    borderRadius: 14,
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  detailSport: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  detailDesc: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 20,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  slotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  slotCard: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  activeSlotCard: {
    backgroundColor: '#10b98120',
    borderColor: '#10b981',
  },
  slotText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  activeSlotText: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  bookButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#020617',
    fontSize: 14,
    fontWeight: 'bold',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    marginBottom: 16,
  },
  modalInputText: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 14,
    color: '#0f172a',
    fontSize: 14,
  },
  modalButton: {
    backgroundColor: '#10b981',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  modalButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalClose: {
    alignItems: 'center',
    padding: 10,
  },
  modalCloseText: {
    color: '#64748b',
    fontSize: 13,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#020617',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  authTabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  authTabButtonText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabButtonTextActive: {
    color: '#fff',
  },
  fieldLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 1,
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  phoneCodeContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneCodeText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: 'bold',
  },
  phoneInputText: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 14,
    color: '#0f172a',
    fontSize: 14,
  },
  modeToggleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  modeToggleText: {
    color: '#64748b',
    fontSize: 12,
  },
  modeToggleHighlight: {
    color: '#10b981',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
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
  markerBubble: {
    backgroundColor: '#020617',
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  markerText: {
    fontSize: 18,
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
});
