import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { apiFetch } from '../../utils/api';

const ACCENT = '#6366f1';

interface Turf {
  id: string;
  name: string;
  location?: { address?: string };
  pricePerHour?: number;
  sport?: string;
  isActive?: boolean;
  description?: string;
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

  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTurf, setEditingTurf] = useState<Turf | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formSport, setFormSport] = useState('Football');
  const [formDescription, setFormDescription] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);

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

  if (!isAuthenticated || !user) return <Redirect href="/login" />;
  if (user.role !== 'TURF_OWNER') return <Redirect href="/" />;

  const fetchTurfs = async () => {
    try {
      const res = await apiFetch('/owner/turfs');
      if (res.success && res.data?.length) {
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
    setRefreshing(true);
    fetchTurfs();
  }, []);

  const openAddModal = () => {
    setEditingTurf(null);
    setFormName('');
    setFormAddress('');
    setFormPrice('');
    setFormSport('Football');
    setFormDescription('');
    setFormActive(true);
    setModalVisible(true);
  };

  const openEditModal = (turf: Turf) => {
    setEditingTurf(turf);
    setFormName(turf.name);
    setFormAddress(turf.location?.address || '');
    setFormPrice(String(turf.pricePerHour || ''));
    setFormSport(turf.sport || 'Football');
    setFormDescription(turf.description || '');
    setFormActive(turf.isActive ?? true);
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
      location: { address: formAddress.trim() },
      pricePerHour: parseFloat(formPrice),
      sport: formSport,
      description: formDescription.trim(),
      isActive: formActive,
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
                  <View style={[styles.sportIcon, { backgroundColor: turf.isActive ? 'rgba(99,102,241,0.12)' : 'rgba(100,116,139,0.12)' }]}>
                    <MaterialCommunityIcons name={sportIcon(turf.sport)} size={22} color={turf.isActive ? ACCENT : theme.textMuted} />
                  </View>
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

              {/* Active Toggle */}
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
});
