import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../store/themeStore';

export default function TermsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useThemeStore();

  const theme = {
    bg: isDarkMode ? '#030712' : '#f8fafc',
    card: isDarkMode ? '#0f172a' : '#ffffff',
    cardBorder: isDarkMode ? '#1e293b' : '#e2e8f0',
    text: isDarkMode ? '#ffffff' : '#0f172a',
    muted: '#64748b',
    headerBg: isDarkMode ? '#0f172a' : '#ffffff',
    border: isDarkMode ? '#1e293b' : '#cbd5e1',
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header Bar */}
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: theme.headerBg, borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { borderColor: theme.cardBorder }]}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Terms of Service</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.contentCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.titleText, { color: theme.text }]}>Terms of Service</Text>
          <Text style={styles.dateText}>Last updated: July 14, 2026</Text>

          <Text style={[styles.paragraph, { color: theme.text }]}>
            Welcome to TurfBook. By downloading, accessing, or using our mobile application, you agree to comply with and be bound by the following Terms of Service. Please read them carefully.
          </Text>

          {/* Section 1 */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>1. Acceptance of Terms</Text>
          <Text style={[styles.paragraph, { color: theme.text }]}>
            By creating an account or using TurfBook, you confirm that you accept these terms and agree to comply with them. If you do not agree to these terms, you must not use the application.
          </Text>

          {/* Section 2 */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>2. Booking and Payments</Text>
          <Text style={[styles.paragraph, { color: theme.text }]}>
            TurfBook provides a platform to reserve sports turf slots. All bookings are subject to availability and acceptance by the respective turf owner. You agree to pay all charges incurred under your account, including taxes and convenience fees.
          </Text>

          {/* Section 3 */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>3. Cancellation and Refund Policy</Text>
          <Text style={[styles.paragraph, { color: theme.text }]}>
            Each turf owner maintains their own cancellation window. Refunds for cancelled bookings will be processed in accordance with the turf's refund policy. Platforms fees or convenience charges may be non-refundable.
          </Text>

          {/* Section 4 */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>4. Account Registration and Security</Text>
          <Text style={[styles.paragraph, { color: theme.text }]}>
            You are responsible for maintaining the confidentiality of your account password and for all activities that occur under your credentials. TurfBook reserves the right to suspend accounts violating our guidelines.
          </Text>

          {/* Section 5 */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>5. Platform Modifications</Text>
          <Text style={[styles.paragraph, { color: theme.text }]}>
            We reserve the right to modify, suspend, or discontinue any part of the TurfBook platform at any time, with or without notice.
          </Text>

          {/* Section 6 */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>6. Limitation of Liability</Text>
          <Text style={[styles.paragraph, { color: theme.text }]}>
            TurfBook acts as an intermediary booking service. We are not responsible for the physical condition, safety, or services provided at the actual turf venues.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
  },
  contentCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 13,
    lineHeight: 20,
    color: '#475569',
    fontWeight: '500',
  },
});
