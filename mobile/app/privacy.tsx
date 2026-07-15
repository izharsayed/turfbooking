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

export default function PrivacyScreen() {
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Privacy Policy</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.contentCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.titleText, { color: theme.text }]}>Privacy Policy</Text>
          <Text style={styles.dateText}>Last updated: July 14, 2026</Text>

          <Text style={[styles.paragraph, { color: theme.text }]}>
            At TurfBook, we respect your privacy and are committed to protecting the personal data you share with us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information.
          </Text>

          {/* Section 1 */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>1. Information We Collect</Text>
          <Text style={[styles.paragraph, { color: theme.text }]}>
            We collect information you provide directly to us when creating an account, including your Name, Mobile Number, Email Address, and password. If you register as a Turf Owner, we also collect business details such as business name and address.
          </Text>

          {/* Section 2 */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>2. Location Permissions</Text>
          <Text style={[styles.paragraph, { color: theme.text }]}>
            Our application requests access to your device's location to display nearby turf arenas, compute distances, and provide localized search results. You can control location sharing inside your phone settings.
          </Text>

          {/* Section 3 */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>3. How We Use Information</Text>
          <Text style={[styles.paragraph, { color: theme.text }]}>
            We use your data to facilitate reservations, verify credentials, process secure booking transactions, send notification updates, and improve platform service performance.
          </Text>

          {/* Section 4 */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>4. Data Security and Storage</Text>
          <Text style={[styles.paragraph, { color: theme.text }]}>
            We implement administrative, technical, and physical security measures to safeguard your personal data. However, please be aware that no security system is absolutely impenetrable.
          </Text>

          {/* Section 5 */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>5. Third-Party Services</Text>
          <Text style={[styles.paragraph, { color: theme.text }]}>
            TurfBook may link to or utilize third-party services (such as Firebase auth, Google Sign-in, or payment gateways). We are not responsible for the privacy practices of those external services.
          </Text>

          {/* Section 6 */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>6. Contact Us</Text>
          <Text style={[styles.paragraph, { color: theme.text }]}>
            If you have any questions or feedback regarding this Privacy Policy, please reach out to us at support@turfbook.com.
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
