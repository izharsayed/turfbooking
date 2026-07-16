import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  Switch,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { apiFetch } from '../../utils/api';
import CustomMap, { Marker } from '../../components/CustomMap';
import * as Location from 'expo-location';

const ACCENT = '#10b981';

interface Turf {
  id: string;
  name: string;
  location?: { 
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  pricePerHour?: number;
  sport?: string;
  isActive?: boolean;
  description?: string;
  peakStartHour?: number;
  peakEndHour?: number;
  peakSurcharge?: number;
  weekendSurcharge?: number;
  images?: string[];
}

const MOCK_TURFS: Turf[] = [
  { id: 't1', name: 'Green Arena', location: { address: 'Ahmednagar, MH' }, pricePerHour: 700, sport: 'Football', isActive: true, description: 'Premium 5-a-side football turf with floodlights' },
  { id: 't2', name: 'Box Cricket Zone', location: { address: 'Savedi, Ahmednagar' }, pricePerHour: 550, sport: 'Box Cricket', isActive: true, description: 'Indoor box cricket facility' },
  { id: 't3', name: 'Premier Ground', location: { address: 'Camp, Ahmednagar' }, pricePerHour: 450, sport: 'Cricket', isActive: false, description: 'Full-size cricket pitch, currently under maintenance' },
];

const SPORT_OPTIONS = ['Football', 'Cricket', 'Box Cricket', 'Basketball', 'Badminton', 'Tennis'];

export default function OwnerTurfsScreen() {
  const { user, isAuthenticated } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<any>(null);

  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [editingTurf, setEditingTurf] = useState<Turf | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formLat, setFormLat] = useState(19.0948);
  const [formLng, setFormLng] = useState(74.7480);
  const [formPrice, setFormPrice] = useState('');
  const [formSport, setFormSport] = useState('Football');
  const [formDescription, setFormDescription] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formPeakStart, setFormPeakStart] = useState('18');
  const [formPeakEnd, setFormPeakEnd] = useState('22');
  const [formPeakSurcharge, setFormPeakSurcharge] = useState('300');
  const [formWeekendSurcharge, setFormWeekendSurcharge] = useState('200');
  const [formImage, setFormImage] = useState('');
  const [saving, setSaving] = useState(false);

  // Map Modal detailed location state
  const [mapAddress, setMapAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setMapAddress('Permission to access location was denied');
        return;
      }
      const result = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (result && result.length > 0) {
        const item = result[0];
        
        // Construct the street and number accurately
        const streetDetails = [item.streetNumber, item.street].filter(Boolean).join(' ');
        
        // De-duplicate name if it matches street
        const nameDetails = (item.name && item.name !== item.street) ? item.name : null;

        const parts = [
          nameDetails,
          streetDetails,
          item.district || item.subregion,
          item.city,
          item.region,
          item.postalCode
        ].filter(Boolean);
        
        setMapAddress(parts.join(', '));
      } else {
        setMapAddress('Unknown location address');
      }
    } catch (e) {
      console.warn('⚠️ Reverse geocode failed:', e);
      setMapAddress('Failed to retrieve location address');
    }
  };

  useEffect(() => {
    if (mapModalVisible) {
      reverseGeocode(formLat, formLng);
    }
  }, [formLat, formLng, mapModalVisible]);

  useEffect(() => {
    if (mapModalVisible) {
      const loc = editingTurf?.location;
      if (loc && loc.latitude && loc.longitude) {
        const lat = loc.latitude;
        const lng = loc.longitude;
        setFormLat(lat);
        setFormLng(lng);
        reverseGeocode(lat, lng);
        setTimeout(() => {
          mapRef.current?.animateToRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          }, 500);
        }, 300);
      } else {
        handleLocateUser();
      }
    }
  }, [mapModalVisible]);

  const handleSearch = () => {
    const queryStr = searchQuery.trim().toLowerCase();
    if (!queryStr) return;

    // Simulated landmark searches in Ahmednagar
    const landmarks: Record<string, { lat: number; lng: number; address: string }> = {
      'savedi': { lat: 19.115718, lng: 74.757197, address: 'Near Ganga Udyan, Savedi, Ahmednagar, Maharashtra 414003' },
      'camp': { lat: 19.0984, lng: 74.7512, address: 'Camp area, Ahmednagar, Maharashtra 414001' },
      'bhingar': { lat: 19.0911, lng: 74.7820, address: 'Bhingar, Ahmednagar, Maharashtra 414002' },
      'savedi road': { lat: 19.1120, lng: 74.7450, address: 'Savedi Road, Ahmednagar, Maharashtra 414003' },
      'kedgaon': { lat: 19.0720, lng: 74.7210, address: 'Kedgaon, Ahmednagar, Maharashtra 414005' },
      'savedi park': { lat: 19.1160, lng: 74.7580, address: 'Ganga Udyan, Savedi, Ahmednagar, Maharashtra 414003' },
      'ganga udyan': { lat: 19.115718, lng: 74.757197, address: 'Near Ganga Udyan, Savedi, Ahmednagar, Maharashtra 414003' }
    };

    let found = false;
    let targetLat = 19.0948;
    let targetLng = 74.7480;
    let targetAddr = '';

    for (const key of Object.keys(landmarks)) {
      if (queryStr.includes(key)) {
        const loc = landmarks[key];
        targetLat = loc.lat;
        targetLng = loc.lng;
        targetAddr = loc.address;
        found = true;
        break;
      }
    }

    if (!found) {
      const hash = queryStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const randomOffsetLat = (hash % 100) / 10000 - 0.005;
      const randomOffsetLng = (hash % 100) / 10000 - 0.005;
      targetLat = 19.0948 + randomOffsetLat;
      targetLng = 74.7480 + randomOffsetLng;
    }

    setFormLat(targetLat);
    setFormLng(targetLng);
    if (targetAddr) {
      setMapAddress(targetAddr);
      setFormAddress(targetAddr);
    } else {
      reverseGeocode(targetLat, targetLng);
    }

    // Animate map to coordinates
    mapRef.current?.animateToRegion({
      latitude: targetLat,
      longitude: targetLng,
      latitudeDelta: 0.015,
      longitudeDelta: 0.015,
    }, 1000);
  };

  const handleLocateUser = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const currentLat = loc.coords.latitude;
      const currentLng = loc.coords.longitude;
      
      setFormLat(currentLat);
      setFormLng(currentLng);
      reverseGeocode(currentLat, currentLng);
      
      mapRef.current?.animateToRegion({
        latitude: currentLat,
        longitude: currentLng,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }, 1000);
    } catch (e) {
      console.warn(e);
      Alert.alert('Location Error', 'Failed to retrieve your current location.');
    }
  };

  const toggleMapType = () => {
    setMapType((prev) => {
      if (prev === 'standard') return 'satellite';
      if (prev === 'satellite') return 'hybrid';
      return 'standard';
    });
  };

  const handleZoomToPin = () => {
    mapRef.current?.animateToRegion({
      latitude: formLat,
      longitude: formLng,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    }, 1000);
  };

  const theme = {
    bg: isDarkMode ? '#030712' : '#f1f5f9',
    card: isDarkMode ? '#0f172a' : '#ffffff',
    cardBorder: isDarkMode ? '#1e293b' : '#e2e8f0',
    text: isDarkMode ? '#ffffff' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    headerBg: isDarkMode ? '#0f172a' : '#ffffff',
    inputBg: isDarkMode ? '#1e293b' : '#f8fafc',
    modalBg: isDarkMode ? '#0f172a' : '#ffffff',
  };

  const fetchTurfs = async () => {
    if (!isAuthenticated || !user) return;
    try {
      const res = await apiFetch('/owner/turfs');
      if (res.success && Array.isArray(res.data)) {
        setTurfs(res.data);
      } else {
        setTurfs(MOCK_TURFS);
      }
    } catch {
      setTurfs(MOCK_TURFS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchTurfs(); }, []);

  const onRefresh = useCallback(() => {
    if (!isAuthenticated || !user) return;
    setRefreshing(true);
    fetchTurfs();
  }, [isAuthenticated, user]);

  // Guard: only for TURF_OWNER role
  if (!isAuthenticated || !user) return <Redirect href="/login" />;
  if (user.role !== 'TURF_OWNER') return <Redirect href="/" />;

  const openAddModal = () => {
    setEditingTurf(null);
    setFormName('');
    setFormAddress('');
    setFormLat(19.0948);
    setFormLng(74.7480);
    setFormPrice('');
    setFormSport('Football');
    setFormDescription('');
    setFormImage('');
    setFormActive(true);
    setFormPeakStart('18');
    setFormPeakEnd('22');
    setFormPeakSurcharge('300');
    setFormWeekendSurcharge('200');
    setModalVisible(true);
  };

  const openEditModal = (turf: Turf) => {
    setEditingTurf(turf);
    setFormName(turf.name);
    setFormAddress(turf.location?.address || '');
    setFormLat(turf.location?.latitude || 19.0948);
    setFormLng(turf.location?.longitude || 74.7480);
    setFormPrice(String(turf.pricePerHour || ''));
    setFormSport(turf.sport || 'Football');
    setFormDescription(turf.description || '');
    setFormImage(turf.images?.[0] || '');
    setFormActive(turf.isActive ?? true);
    setFormPeakStart(String(turf.peakStartHour ?? 18));
    setFormPeakEnd(String(turf.peakEndHour ?? 22));
    setFormPeakSurcharge(String(turf.peakSurcharge ?? 300));
    setFormWeekendSurcharge(String(turf.weekendSurcharge ?? 200));
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formPrice.trim()) {
      Alert.alert('Required Fields', 'Please enter turf name and price per hour.');
      return;
    }
    setSaving(true);
    const payload = {
      name: formName.trim(),
      location: { 
        address: formAddress.trim(),
        latitude: formLat,
        longitude: formLng
      },
      pricePerHour: parseFloat(formPrice),
      sport: formSport,
      description: formDescription.trim(),
      isActive: formActive,
      peakStartHour: parseInt(formPeakStart, 10),
      peakEndHour: parseInt(formPeakEnd, 10),
      peakSurcharge: parseFloat(formPeakSurcharge),
      weekendSurcharge: parseFloat(formWeekendSurcharge),
      images: formImage ? [formImage.trim()] : [],
    };
    try {
      if (editingTurf) {
        await apiFetch(`/owner/turfs/${editingTurf.id}`, { method: 'PUT', body: payload });
        setTurfs((prev) => prev.map((t) => t.id === editingTurf.id ? { ...t, ...payload, id: t.id } : t));
        Alert.alert('Updated', 'Turf updated successfully!');
      } else {
        const res = await apiFetch('/owner/turfs', { method: 'POST', body: payload });
        const newId = res.data?.id || `t${Date.now()}`;
        setTurfs((prev) => [...prev, { ...payload, id: newId }]);
        Alert.alert('Created', 'New turf added successfully!');
      }
    } catch {
      Alert.alert('Error', 'Failed to save turf. Please try again.');
    } finally {
      setSaving(false);
      setModalVisible(false);
    }
  };

  const handleDelete = (turf: Turf) => {
    Alert.alert(
      'Delete Turf',
      `Are you sure you want to delete "${turf.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiFetch(`/owner/turfs/${turf.id}`, { method: 'DELETE' });
            } catch {}
            setTurfs((prev) => prev.filter((t) => t.id !== turf.id));
            Alert.alert('Deleted', `"${turf.name}" has been removed.`);
          },
        },
      ]
    );
  };

  const sportIcon = (sport?: string): any => {
    if (sport === 'Cricket' || sport === 'Box Cricket') return 'cricket';
    if (sport === 'Basketball') return 'basketball';
    if (sport === 'Badminton') return 'badminton';
    if (sport === 'Tennis') return 'tennis';
    return 'soccer';
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
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBg, paddingTop: insets.top + 12, borderBottomColor: theme.cardBorder }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>My Turfs</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal} activeOpacity={0.85}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Add Turf</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
      >
        {turfs.length === 0 ? (
          <View style={styles.emptyWrapper}>
            <MaterialCommunityIcons name="soccer-field" size={64} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>No turfs added yet</Text>
            <TouchableOpacity style={styles.emptyAddBtn} onPress={openAddModal}>
              <Text style={styles.emptyAddBtnText}>Add Your First Turf</Text>
            </TouchableOpacity>
          </View>
        ) : (
          turfs.map((turf) => (
            <View key={turf.id} style={[styles.turfCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              {/* Status indicator strip */}
              <View style={[styles.statusStrip, { backgroundColor: turf.isActive ? '#10b981' : '#94a3b8' }]} />

              <View style={styles.turfContent}>
                <View style={styles.turfTopRow}>
                  {turf.images?.[0] ? (
                    <Image source={{ uri: turf.images[0] }} style={styles.turfCardImage} />
                  ) : (
                    <View style={[styles.sportIcon, { backgroundColor: turf.isActive ? 'rgba(99,102,241,0.12)' : 'rgba(100,116,139,0.12)' }]}>
                      <MaterialCommunityIcons name={sportIcon(turf.sport)} size={22} color={turf.isActive ? ACCENT : theme.textMuted} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.turfName, { color: theme.text }]}>{turf.name}</Text>
                    <Text style={[styles.turfSport, { color: theme.textMuted }]}>{turf.sport}</Text>
                  </View>
                  <View style={[styles.activeBadge, { backgroundColor: turf.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)' }]}>
                    <Text style={[styles.activeBadgeText, { color: turf.isActive ? '#10b981' : theme.textMuted }]}>
                      {turf.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                {turf.location?.address && (
                  <View style={styles.metaRow}>
                    <Ionicons name="location-outline" size={13} color={theme.textMuted} />
                    <Text style={[styles.metaText, { color: theme.textMuted }]}>{turf.location.address}</Text>
                  </View>
                )}

                {turf.peakSurcharge !== undefined && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 6 }}>
                    <Text style={{ fontSize: 10, color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.08)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontWeight: 'bold' }}>
                      🔥 Peak (+₹{turf.peakSurcharge}) {turf.peakStartHour}:00-{turf.peakEndHour}:00
                    </Text>
                    <Text style={{ fontSize: 10, color: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.08)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontWeight: 'bold' }}>
                      ⚡ Weekend (+₹{turf.weekendSurcharge ?? 200})
                    </Text>
                  </View>
                )}

                <View style={styles.priceRow}>
                  <Text style={[styles.priceText, { color: theme.text }]}>
                    ₹{turf.pricePerHour} <Text style={[styles.priceUnit, { color: theme.textMuted }]}>/ hour</Text>
                  </Text>
                  <View style={styles.actionBtns}>
                    <TouchableOpacity style={[styles.iconBtn, { backgroundColor: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.25)' }]} onPress={() => openEditModal(turf)}>
                      <Ionicons name="pencil-outline" size={16} color={ACCENT} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.iconBtn, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.25)' }]} onPress={() => handleDelete(turf)}>
                      <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.modalBg }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingTurf ? 'Edit Turf' : 'Add New Turf'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Name */}
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>TURF NAME *</Text>
              <TextInput
                value={formName}
                onChangeText={setFormName}
                placeholder="e.g. Green Arena"
                placeholderTextColor={theme.textMuted}
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}
              />

              {/* Address */}
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>LOCATION / ADDRESS</Text>
              <TextInput
                value={formAddress}
                onChangeText={setFormAddress}
                placeholder="e.g. Savedi, Ahmednagar"
                placeholderTextColor={theme.textMuted}
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}
              />

              {/* Coordinates & Map Locator */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>
                  Coords: {formLat.toFixed(4)}, {formLng.toFixed(4)}
                </Text>
                <TouchableOpacity 
                  style={{ borderWidth: 1, borderColor: ACCENT, borderRadius: 6, paddingVertical: 4, paddingHorizontal: 12 }} 
                  onPress={() => setMapModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: ACCENT, fontSize: 13, fontWeight: '600' }}>Set on Map</Text>
                </TouchableOpacity>
              </View>

              {/* Price */}
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>PRICE PER HOUR (₹) *</Text>
              <TextInput
                value={formPrice}
                onChangeText={setFormPrice}
                placeholder="e.g. 700"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}
              />

              {/* Sport */}
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>SPORT</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {SPORT_OPTIONS.map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.sportChip, { backgroundColor: formSport === s ? ACCENT : theme.inputBg, borderColor: formSport === s ? ACCENT : theme.cardBorder }]}
                      onPress={() => setFormSport(s)}
                    >
                      <Text style={[styles.sportChipText, { color: formSport === s ? '#fff' : theme.text }]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Description */}
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>DESCRIPTION</Text>
              <TextInput
                value={formDescription}
                onChangeText={setFormDescription}
                placeholder="Short description of your turf..."
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={3}
                style={[styles.input, styles.inputMultiline, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}
              />

              {/* Turf Photo URL */}
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>TURF PHOTO URL</Text>
              <TextInput
                value={formImage}
                onChangeText={setFormImage}
                placeholder="https://example.com/photo.jpg or select below"
                placeholderTextColor={theme.textMuted}
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}
              />

              {/* Quick Presets */}
              <Text style={[styles.fieldLabel, { color: theme.textMuted, fontSize: 8, marginTop: -8, marginBottom: 12 }]}>
                QUICK PRESETS
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                {[
                  { name: 'Soccer', url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=60' },
                  { name: 'Cricket', url: 'https://images.unsplash.com/photo-1531415080295-6ad6679ff877?w=600&auto=format&fit=crop&q=60' },
                  { name: 'Arena', url: 'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?w=600&auto=format&fit=crop&q=60' }
                ].map((preset) => (
                  <TouchableOpacity
                    key={preset.name}
                    style={{ 
                      backgroundColor: formImage === preset.url ? ACCENT : theme.inputBg, 
                      borderColor: formImage === preset.url ? ACCENT : theme.cardBorder,
                      borderWidth: 1.5,
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}
                    onPress={() => setFormImage(preset.url)}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: formImage === preset.url ? '#fff' : theme.text }}>
                      {preset.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Photo Preview inside modal */}
              {formImage ? (
                <View style={{ width: '100%', height: 120, borderRadius: 16, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: theme.cardBorder }}>
                  <Image source={{ uri: formImage }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                  <TouchableOpacity 
                    style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', padding: 6, borderRadius: 20 }}
                    onPress={() => setFormImage('')}
                  >
                    <Ionicons name="trash-outline" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* Dynamic Pricing Surcharges Section */}
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: theme.text, marginTop: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Dynamic Pricing Surcharges</Text>
              
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 4 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Peak Start Hour (24h)</Text>
                  <TextInput
                    value={formPeakStart}
                    onChangeText={setFormPeakStart}
                    placeholder="e.g. 18"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="numeric"
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Peak End Hour (24h)</Text>
                  <TextInput
                    value={formPeakEnd}
                    onChangeText={setFormPeakEnd}
                    placeholder="e.g. 22"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="numeric"
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Peak Surcharge (₹)</Text>
                  <TextInput
                    value={formPeakSurcharge}
                    onChangeText={setFormPeakSurcharge}
                    placeholder="e.g. 300"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="numeric"
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Weekend Surcharge (₹)</Text>
                  <TextInput
                    value={formWeekendSurcharge}
                    onChangeText={setFormWeekendSurcharge}
                    placeholder="e.g. 200"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="numeric"
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}
                  />
                </View>
              </View>
              <View style={styles.toggleRow}>
                <Text style={[styles.toggleLabel, { color: theme.text }]}>Turf is Active</Text>
                <Switch
                  value={formActive}
                  onValueChange={setFormActive}
                  trackColor={{ false: '#475569', true: ACCENT }}
                  thumbColor="#ffffff"
                />
              </View>

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: theme.cardBorder }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={[styles.cancelBtnText, { color: theme.textMuted }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveBtnText}>{editingTurf ? 'Save Changes' : 'Add Turf'}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Map Modal */}
      <Modal visible={mapModalVisible} animationType="slide" transparent onRequestClose={() => setMapModalVisible(false)}>
        <View style={styles.premiumOverlay}>
          <View style={styles.premiumModalSheet}>
            {/* Header */}
            <View style={styles.premiumHeader}>
              <TouchableOpacity onPress={() => setMapModalVisible(false)} style={styles.closeBtn} activeOpacity={0.8}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
              
              <View style={styles.premiumHeaderCenter}>
                <Text style={styles.premiumTitle}>Select Turf Location</Text>
                <Text style={styles.premiumSubtitle}>Search or tap anywhere on the map to set your turf's exact location.</Text>
              </View>

              <TouchableOpacity style={styles.howItWorksBtn} activeOpacity={0.8}>
                <Ionicons name="help-circle-outline" size={18} color="#10b981" />
                <Text style={styles.howItWorksText}>How it works</Text>
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchBarWrapper}>
              <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                placeholder="Search area, landmark or address"
                placeholderTextColor="#64748b"
                style={styles.searchInput}
              />
              <TouchableOpacity onPress={handleSearch} activeOpacity={0.8}>
                <Ionicons name="options-outline" size={20} color="#10b981" style={styles.filterIcon} />
              </TouchableOpacity>
            </View>

            {/* Map Wrapper with drag indicator */}
            <View style={styles.premiumMapWrapper}>
              <CustomMap
                ref={mapRef}
                style={styles.premiumMap}
                mapType={mapType}
                initialRegion={{
                  latitude: formLat,
                  longitude: formLng,
                  latitudeDelta: 0.015,
                  longitudeDelta: 0.015,
                }}
                onRegionChangeComplete={(region: any) => {
                  if (region?.latitude && region?.longitude) {
                    setFormLat(region.latitude);
                    setFormLng(region.longitude);
                  }
                }}
                onPress={(e: any) => {
                  if (e?.nativeEvent?.coordinate) {
                    setFormLat(e.nativeEvent.coordinate.latitude);
                    setFormLng(e.nativeEvent.coordinate.longitude);
                  }
                }}
              >
                <Marker
                  coordinate={{ latitude: formLat, longitude: formLng }}
                  title="Turf Location"
                />
              </CustomMap>

              {/* Floating Overlay Info */}
              <View style={styles.mapFloatingCard}>
                <MaterialCommunityIcons name="target" size={16} color="#10b981" />
                <View>
                  <Text style={styles.mapFloatingTitle}>Drag map to adjust</Text>
                  <Text style={styles.mapFloatingSubtitle}>Pin will update automatically</Text>
                </View>
              </View>

              {/* Map Controls */}
              <View style={styles.mapControls}>
                <TouchableOpacity style={styles.mapControlBtn} onPress={handleLocateUser} activeOpacity={0.8}>
                  <Ionicons name="locate-outline" size={20} color="#10b981" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.mapControlBtn} onPress={toggleMapType} activeOpacity={0.8}>
                  <Ionicons name="layers-outline" size={20} color={mapType !== 'standard' ? '#10b981' : '#ffffff'} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.mapControlBtn} onPress={handleZoomToPin} activeOpacity={0.8}>
                  <Ionicons name="scan-outline" size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Details Card */}
            <View style={styles.detailsCard}>
              <View style={styles.detailsHeader}>
                <View style={styles.detailsTitleRow}>
                  <Ionicons name="location-sharp" size={20} color="#10b981" />
                  <Text style={styles.detailsCardTitle}>Selected Location</Text>
                </View>
                <TouchableOpacity onPress={() => { setFormLat(19.0948); setFormLng(74.7480); }} activeOpacity={0.8}>
                  <Text style={styles.clearBtnText}>Clear</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.detailsCoords}>
                {formLat.toFixed(6)}, {formLng.toFixed(6)}
              </Text>

              <View style={styles.detailsAddressRow}>
                <Ionicons name="storefront-outline" size={18} color="#10b981" style={{ marginTop: 2 }} />
                <Text style={styles.detailsAddressText}>
                  {mapAddress || 'Fetching street address...'}
                </Text>
              </View>
            </View>

            {/* Badge Cards */}
            <View style={styles.badgesRow}>
              <View style={styles.badgeCard}>
                <Ionicons name="navigate-outline" size={18} color="#10b981" />
                <Text style={styles.badgeTitle}>High Accuracy</Text>
                <Text style={styles.badgeSubtitle}>~5 meters</Text>
              </View>
              <View style={styles.badgeCard}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#10b981" />
                <Text style={styles.badgeTitle}>Exact Location</Text>
                <Text style={styles.badgeSubtitle}>Set precise pin</Text>
              </View>
              <View style={styles.badgeCard}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#10b981" />
                <Text style={styles.badgeTitle}>Easy to find</Text>
                <Text style={styles.badgeSubtitle}>For customers</Text>
              </View>
            </View>

            {/* Confirm Button */}
            <TouchableOpacity 
              style={styles.premiumConfirmBtn} 
              onPress={() => {
                if (mapAddress && mapAddress !== 'Fetching street address...' && mapAddress !== 'Permission to access location was denied') {
                  setFormAddress(mapAddress);
                }
                setMapModalVisible(false);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.premiumConfirmText}>Confirm Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ACCENT,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  scrollContent: { padding: 16, gap: 12 },
  emptyWrapper: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 14 },
  emptyText: { fontSize: 15, fontWeight: '600' },
  emptyAddBtn: {
    backgroundColor: ACCENT,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyAddBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  turfCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: 2,
  },
  statusStrip: { width: 4 },
  turfContent: { flex: 1, padding: 14, gap: 8 },
  turfTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sportIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  turfCardImage: {
    width: 44,
    height: 44,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  turfName: { fontSize: 15, fontWeight: '800' },
  turfSport: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  activeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  activeBadgeText: { fontSize: 10, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, fontWeight: '500' },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  priceText: { fontSize: 18, fontWeight: '800' },
  priceUnit: { fontSize: 12, fontWeight: '500' },
  actionBtns: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#94a3b8',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20 },
  fieldLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    marginBottom: 16,
  },
  inputMultiline: { height: 80, textAlignVertical: 'top' },
  sportChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  sportChipText: { fontSize: 12, fontWeight: '700' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  toggleLabel: { fontSize: 15, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 16 },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '700' },
  saveBtn: {
    flex: 2,
    backgroundColor: ACCENT,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  premiumOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.95)',
    justifyContent: 'flex-end',
  },
  premiumModalSheet: {
    height: '98%',
    backgroundColor: '#030712',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumHeaderCenter: {
    flex: 1,
    paddingHorizontal: 12,
  },
  premiumTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  premiumSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
  },
  howItWorksBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#064e3b',
    backgroundColor: '#022c22',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  howItWorksText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '700',
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    height: '100%',
  },
  filterIcon: {
    marginLeft: 10,
  },
  premiumMapWrapper: {
    flex: 1,
    minHeight: 220,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e293b',
    position: 'relative',
  },
  premiumMap: {
    width: '100%',
    height: '100%',
  },
  mapFloatingCard: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#090d16',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  mapFloatingTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  mapFloatingSubtitle: {
    fontSize: 10,
    color: '#94a3b8',
  },
  mapControls: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    gap: 10,
  },
  mapControlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailsCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  clearBtnText: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '700',
  },
  detailsCoords: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  detailsAddressRow: {
    flexDirection: 'row',
    gap: 8,
  },
  detailsAddressText: {
    flex: 1,
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 12,
  },
  badgeCard: {
    flex: 1,
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
  },
  badgeTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  badgeSubtitle: {
    fontSize: 9,
    color: '#94a3b8',
  },
  premiumConfirmBtn: {
    backgroundColor: '#10b981',
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumConfirmText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});
