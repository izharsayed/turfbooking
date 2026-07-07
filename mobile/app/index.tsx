import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_DEFAULT } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { formatCurrency } from '@turf-booking/utils';
import { useAuthStore } from '../store/authStore.js';
import { useBookingStore } from '../store/bookingStore.js';
import { turfs, type Turf } from '../data/turfs.js';

export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const bookings = useBookingStore((s) => s.bookings);

  const [activeTab, setActiveTab] = useState<'explore' | 'bookings' | 'map' | 'support'>('explore');
  const [selectedMapTurf, setSelectedMapTurf] = useState<Turf | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTurfs = turfs.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.sport.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header Profile Info bar */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TurfBook</Text>
        {isAuthenticated ? (
          <TouchableOpacity style={styles.profileRow} onPress={() => router.push('/profile')}>
            <Text style={styles.profileText}>Hi, {user?.name}</Text>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>
                {(user?.name ?? '?').charAt(0).toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login')}>
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
            onPress={() => {
              setActiveTab(tab);
              setSelectedMapTurf(null);
            }}
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
              longitude: 74.748,
              latitudeDelta: 0.12,
              longitudeDelta: 0.12,
            }}
          >
            {turfs.map((turf) => (
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
                onPress={() => router.push(`/turf/${selectedMapTurf.id}`)}
              >
                <Text style={styles.mapCardButtonText}>Book This Turf →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <ScrollView style={[styles.scroll, activeTab === 'map' && { display: 'none' }]}>
        {/* Tab 1: Explore */}
        {activeTab === 'explore' && (
          <View style={styles.section}>
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
                onPress={() => router.push(`/turf/${turf.id}`)}
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
            {filteredTurfs.length === 0 && (
              <Text style={styles.emptyText}>No arenas match your search.</Text>
            )}
          </View>
        )}

        {/* Tab 2: Bookings */}
        {activeTab === 'bookings' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My reservations</Text>
            {bookings.length === 0 ? (
              <Text style={styles.emptyText}>You have no bookings yet.</Text>
            ) : (
              bookings.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={styles.bookingCard}
                  onPress={() => router.push(`/booking/${b.id}`)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bookingId}>{b.id}</Text>
                    <Text style={styles.bookingTitle}>{b.turfName}</Text>
                    <Text style={styles.bookingSub}>
                      {b.date} at {b.time}
                    </Text>
                  </View>
                  <View style={styles.bookingRight}>
                    <Text style={styles.bookingAmount}>{formatCurrency(b.amount)}</Text>
                    <Text
                      style={[
                        styles.statusBadge,
                        b.status === 'CANCELLED' && styles.statusCancelled,
                        b.status === 'COMPLETED' && styles.statusCompleted,
                      ]}
                    >
                      {b.status}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Tab 4: Support */}
        {activeTab === 'support' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Help center</Text>
            <Text style={styles.detailDesc}>
              Encountered issues with payment settlement or double slot booking? Create a ticket and
              our 24/7 staff support will address it immediately.
            </Text>

            <TouchableOpacity
              style={styles.supportButton}
              onPress={() => Alert.alert('Ticket Raised', 'Support ticket raised successfully!')}
            >
              <Text style={styles.supportButtonText}>Raise Support Ticket</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
    gap: 10,
  },
  profileText: {
    color: '#10b981',
    fontWeight: '600',
    fontSize: 14,
  },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 14,
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
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 30,
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
