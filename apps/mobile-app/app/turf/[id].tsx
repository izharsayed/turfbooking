import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { formatCurrency } from '@turf-booking/utils';
import { useAuthStore } from '../../store/authStore.js';
import { useBookingStore } from '../../store/bookingStore.js';
import { getTurfById } from '../../data/turfs.js';

export default function TurfDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addBooking = useBookingStore((s) => s.addBooking);

  const turf = getTurfById(id);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

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

    const booking = addBooking({
      turfId: turf.id,
      turfName: turf.name,
      area: turf.area,
      date: '2026-07-07',
      time: selectedTime,
      amount: turf.price,
    });

    router.replace(`/booking/${booking.id}`);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: turf.name }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image source={{ uri: turf.image }} style={styles.hero} />

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{turf.name}</Text>
              <Text style={styles.area}>📍 {turf.area}</Text>
            </View>
            <Text style={styles.rating}>★ {turf.rating}</Text>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.sportBadge}>
              <Text style={styles.sportBadgeText}>{turf.sport}</Text>
            </View>
            <Text style={styles.price}>{formatCurrency(turf.price)}/hr</Text>
          </View>

          <Text style={styles.desc}>{turf.description}</Text>

          {/* Amenities */}
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesRow}>
            {turf.amenities.map((a) => (
              <View key={a} style={styles.amenityChip}>
                <Text style={styles.amenityText}>{a}</Text>
              </View>
            ))}
          </View>

          {/* Slots */}
          <Text style={styles.sectionTitle}>Select time slot</Text>
          <View style={styles.slotsRow}>
            {turf.slots.map((time) => (
              <TouchableOpacity
                key={time}
                style={[styles.slotCard, selectedTime === time && styles.activeSlotCard]}
                onPress={() => setSelectedTime(time)}
              >
                <Text style={[styles.slotText, selectedTime === time && styles.activeSlotText]}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Sticky booking bar */}
      <View style={styles.bookingBar}>
        <View>
          <Text style={styles.bookingBarLabel}>Total</Text>
          <Text style={styles.bookingBarPrice}>{formatCurrency(turf.price)}</Text>
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
    backgroundColor: '#020617',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  hero: {
    width: '100%',
    height: 240,
  },
  body: {
    padding: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  area: {
    fontSize: 13,
    color: '#64748b',
  },
  rating: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 13,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sportBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  sportBadgeText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  desc: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 21,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 14,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  amenityChip: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  amenityText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '500',
  },
  slotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotCard: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  activeSlotCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: '#10b981',
  },
  slotText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  activeSlotText: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  bookingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  bookingBarLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 2,
  },
  bookingBarPrice: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  bookButton: {
    backgroundColor: '#10b981',
    paddingVertical: 15,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  bookButtonDisabled: {
    backgroundColor: '#1e293b',
  },
  bookButtonText: {
    color: '#020617',
    fontSize: 15,
    fontWeight: 'bold',
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
