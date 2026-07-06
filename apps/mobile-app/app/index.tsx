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
  Alert
} from 'react-native';
import { formatCurrency } from '@turf-booking/utils';
import { useAuthStore } from '../store/authStore.js';

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
    area: 'Andheri West',
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: '2',
    name: 'Lords Cricket Indoor',
    sport: 'Cricket',
    price: 1500,
    rating: 4.9,
    area: 'Bandra East',
    image: 'https://images.unsplash.com/photo-1531415080290-bc9854503f37?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: '3',
    name: 'Wembley Futsal Dome',
    sport: 'Box Cricket',
    price: 1000,
    rating: 4.7,
    area: 'Dwarka Sector 10',
    image: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=600&auto=format&fit=crop&q=60'
  }
];

export default function HomeScreen() {
  const { isAuthenticated, user, login, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'explore' | 'bookings' | 'support'>('explore');
  const [selectedTurf, setSelectedTurf] = useState<Turf | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Auth simulation
  const [email, setEmail] = useState('');
  const [authModalVisible, setAuthModalVisible] = useState(false);

  // Booking items
  const [bookings, setBookings] = useState<any[]>([
    { id: 'B-88392', turfName: 'Old Trafford Arena', date: '2026-07-06', time: '18:00 - 19:00', amount: 1200, status: 'UPCOMING' }
  ]);

  const handleLogin = () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    login({ id: 'USR-101', email, name: email.split('@')[0], role: 'CUSTOMER' }, 'dummy_token');
    setAuthModalVisible(false);
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
        {(['explore', 'bookings', 'support'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
            onPress={() => { setActiveTab(tab); setSelectedTurf(null); }}
          >
            <Text style={[styles.tabButtonText, activeTab === tab && styles.activeTabButtonText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll}>
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

        {/* Tab 3: Support */}
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
      </ScrollView>

      {/* Auth Modal */}
      <Modal visible={authModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sign In</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email address"
              placeholderTextColor="#64748b"
              style={styles.modalInput}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.modalButton} onPress={handleLogin}>
              <Text style={styles.modalButtonText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setAuthModalVisible(false)} style={styles.modalClose}>
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
    backgroundColor: '#0f172a',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
  },
  cardImage: {
    height: 150,
    width: '100%',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  rating: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 13,
  },
  cardArea: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sportBadge: {
    backgroundColor: '#1e293b',
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  price: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
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
  modalButton: {
    backgroundColor: '#10b981',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalButtonText: {
    color: '#020617',
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
});
