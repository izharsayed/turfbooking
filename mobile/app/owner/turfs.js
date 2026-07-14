"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = OwnerTurfsScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const expo_router_1 = require("expo-router");
const vector_icons_1 = require("@expo/vector-icons");
const authStore_1 = require("../../store/authStore");
const themeStore_1 = require("../../store/themeStore");
const api_1 = require("../../utils/api");
const ACCENT = '#10b981';
const MOCK_TURFS = [
    { id: 't1', name: 'Green Arena', location: { address: 'Ahmednagar, MH' }, pricePerHour: 700, sport: 'Football', isActive: true, description: 'Premium 5-a-side football turf with floodlights' },
    { id: 't2', name: 'Box Cricket Zone', location: { address: 'Savedi, Ahmednagar' }, pricePerHour: 550, sport: 'Box Cricket', isActive: true, description: 'Indoor box cricket facility' },
    { id: 't3', name: 'Premier Ground', location: { address: 'Camp, Ahmednagar' }, pricePerHour: 450, sport: 'Cricket', isActive: false, description: 'Full-size cricket pitch, currently under maintenance' },
];
const SPORT_OPTIONS = ['Football', 'Cricket', 'Box Cricket', 'Basketball', 'Badminton', 'Tennis'];
function OwnerTurfsScreen() {
    const { user, isAuthenticated } = (0, authStore_1.useAuthStore)();
    const { isDarkMode } = (0, themeStore_1.useThemeStore)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const [turfs, setTurfs] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [refreshing, setRefreshing] = (0, react_1.useState)(false);
    const [modalVisible, setModalVisible] = (0, react_1.useState)(false);
    const [editingTurf, setEditingTurf] = (0, react_1.useState)(null);
    // Form state
    const [formName, setFormName] = (0, react_1.useState)('');
    const [formAddress, setFormAddress] = (0, react_1.useState)('');
    const [formPrice, setFormPrice] = (0, react_1.useState)('');
    const [formSport, setFormSport] = (0, react_1.useState)('Football');
    const [formDescription, setFormDescription] = (0, react_1.useState)('');
    const [formActive, setFormActive] = (0, react_1.useState)(true);
    const [formImage, setFormImage] = (0, react_1.useState)('');
    const [saving, setSaving] = (0, react_1.useState)(false);
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
        if (!isAuthenticated || !user)
            return;
        try {
            const res = await (0, api_1.apiFetch)('/owner/turfs');
            if (res.success && res.data?.length) {
                setTurfs(res.data);
            }
            else {
                setTurfs(MOCK_TURFS);
            }
        }
        catch {
            setTurfs(MOCK_TURFS);
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    (0, react_1.useEffect)(() => { fetchTurfs(); }, []);
    const onRefresh = (0, react_1.useCallback)(() => {
        if (!isAuthenticated || !user)
            return;
        setRefreshing(true);
        fetchTurfs();
    }, [isAuthenticated, user]);
    // Guard: only for TURF_OWNER role
    if (!isAuthenticated || !user)
        return <expo_router_1.Redirect href="/login"/>;
    if (user.role !== 'TURF_OWNER')
        return <expo_router_1.Redirect href="/"/>;
    const openAddModal = () => {
        setEditingTurf(null);
        setFormName('');
        setFormAddress('');
        setFormPrice('');
        setFormSport('Football');
        setFormDescription('');
        setFormImage('');
        setFormActive(true);
        setModalVisible(true);
    };
    const openEditModal = (turf) => {
        setEditingTurf(turf);
        setFormName(turf.name);
        setFormAddress(turf.location?.address || '');
        setFormPrice(String(turf.pricePerHour || ''));
        setFormSport(turf.sport || 'Football');
        setFormDescription(turf.description || '');
        setFormImage(turf.images?.[0] || '');
        setFormActive(turf.isActive ?? true);
        setModalVisible(true);
    };
    const handleSave = async () => {
        if (!formName.trim() || !formPrice.trim()) {
            react_native_1.Alert.alert('Required Fields', 'Please enter turf name and price per hour.');
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
            images: formImage ? [formImage.trim()] : [],
        };
        try {
            if (editingTurf) {
                await (0, api_1.apiFetch)(`/owner/turfs/${editingTurf.id}`, { method: 'PUT', body: payload });
                setTurfs((prev) => prev.map((t) => t.id === editingTurf.id ? { ...t, ...payload, id: t.id } : t));
                react_native_1.Alert.alert('Updated', 'Turf updated successfully!');
            }
            else {
                const res = await (0, api_1.apiFetch)('/owner/turfs', { method: 'POST', body: payload });
                const newId = res.data?.id || `t${Date.now()}`;
                setTurfs((prev) => [...prev, { ...payload, id: newId }]);
                react_native_1.Alert.alert('Created', 'New turf added successfully!');
            }
        }
        catch {
            react_native_1.Alert.alert('Error', 'Failed to save turf. Please try again.');
        }
        finally {
            setSaving(false);
            setModalVisible(false);
        }
    };
    const handleDelete = (turf) => {
        react_native_1.Alert.alert('Delete Turf', `Are you sure you want to delete "${turf.name}"? This action cannot be undone.`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await (0, api_1.apiFetch)(`/owner/turfs/${turf.id}`, { method: 'DELETE' });
                    }
                    catch { }
                    setTurfs((prev) => prev.filter((t) => t.id !== turf.id));
                    react_native_1.Alert.alert('Deleted', `"${turf.name}" has been removed.`);
                },
            },
        ]);
    };
    const sportIcon = (sport) => {
        if (sport === 'Cricket' || sport === 'Box Cricket')
            return 'cricket';
        if (sport === 'Basketball')
            return 'basketball';
        if (sport === 'Badminton')
            return 'badminton';
        if (sport === 'Tennis')
            return 'tennis';
        return 'soccer';
    };
    if (loading) {
        return (<react_native_1.View style={[styles.center, { backgroundColor: theme.bg }]}>
        <react_native_1.ActivityIndicator size="large" color={ACCENT}/>
      </react_native_1.View>);
    }
    return (<react_native_1.View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <react_native_1.View style={[styles.header, { backgroundColor: theme.headerBg, paddingTop: insets.top + 12, borderBottomColor: theme.cardBorder }]}>
        <react_native_1.Text style={[styles.headerTitle, { color: theme.text }]}>My Turfs</react_native_1.Text>
        <react_native_1.TouchableOpacity style={styles.addBtn} onPress={openAddModal} activeOpacity={0.85}>
          <vector_icons_1.Ionicons name="add" size={18} color="#fff"/>
          <react_native_1.Text style={styles.addBtnText}>Add Turf</react_native_1.Text>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>

      <react_native_1.ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} refreshControl={<react_native_1.RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT}/>}>
        {turfs.length === 0 ? (<react_native_1.View style={styles.emptyWrapper}>
            <vector_icons_1.MaterialCommunityIcons name="soccer-field" size={64} color={theme.textMuted}/>
            <react_native_1.Text style={[styles.emptyText, { color: theme.textMuted }]}>No turfs added yet</react_native_1.Text>
            <react_native_1.TouchableOpacity style={styles.emptyAddBtn} onPress={openAddModal}>
              <react_native_1.Text style={styles.emptyAddBtnText}>Add Your First Turf</react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>) : (turfs.map((turf) => (<react_native_1.View key={turf.id} style={[styles.turfCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              {/* Status indicator strip */}
              <react_native_1.View style={[styles.statusStrip, { backgroundColor: turf.isActive ? '#10b981' : '#94a3b8' }]}/>

              <react_native_1.View style={styles.turfContent}>
                <react_native_1.View style={styles.turfTopRow}>
                  {turf.images?.[0] ? (<react_native_1.Image source={{ uri: turf.images[0] }} style={styles.turfCardImage}/>) : (<react_native_1.View style={[styles.sportIcon, { backgroundColor: turf.isActive ? 'rgba(99,102,241,0.12)' : 'rgba(100,116,139,0.12)' }]}>
                      <vector_icons_1.MaterialCommunityIcons name={sportIcon(turf.sport)} size={22} color={turf.isActive ? ACCENT : theme.textMuted}/>
                    </react_native_1.View>)}
                  <react_native_1.View style={{ flex: 1 }}>
                    <react_native_1.Text style={[styles.turfName, { color: theme.text }]}>{turf.name}</react_native_1.Text>
                    <react_native_1.Text style={[styles.turfSport, { color: theme.textMuted }]}>{turf.sport}</react_native_1.Text>
                  </react_native_1.View>
                  <react_native_1.View style={[styles.activeBadge, { backgroundColor: turf.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)' }]}>
                    <react_native_1.Text style={[styles.activeBadgeText, { color: turf.isActive ? '#10b981' : theme.textMuted }]}>
                      {turf.isActive ? 'Active' : 'Inactive'}
                    </react_native_1.Text>
                  </react_native_1.View>
                </react_native_1.View>

                {turf.location?.address && (<react_native_1.View style={styles.metaRow}>
                    <vector_icons_1.Ionicons name="location-outline" size={13} color={theme.textMuted}/>
                    <react_native_1.Text style={[styles.metaText, { color: theme.textMuted }]}>{turf.location.address}</react_native_1.Text>
                  </react_native_1.View>)}

                <react_native_1.View style={styles.priceRow}>
                  <react_native_1.Text style={[styles.priceText, { color: theme.text }]}>
                    ₹{turf.pricePerHour} <react_native_1.Text style={[styles.priceUnit, { color: theme.textMuted }]}>/ hour</react_native_1.Text>
                  </react_native_1.Text>
                  <react_native_1.View style={styles.actionBtns}>
                    <react_native_1.TouchableOpacity style={[styles.iconBtn, { backgroundColor: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.25)' }]} onPress={() => openEditModal(turf)}>
                      <vector_icons_1.Ionicons name="pencil-outline" size={16} color={ACCENT}/>
                    </react_native_1.TouchableOpacity>
                    <react_native_1.TouchableOpacity style={[styles.iconBtn, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.25)' }]} onPress={() => handleDelete(turf)}>
                      <vector_icons_1.Ionicons name="trash-outline" size={16} color="#ef4444"/>
                    </react_native_1.TouchableOpacity>
                  </react_native_1.View>
                </react_native_1.View>
              </react_native_1.View>
            </react_native_1.View>)))}
      </react_native_1.ScrollView>

      {/* Add/Edit Modal */}
      <react_native_1.Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <react_native_1.View style={styles.modalOverlay}>
          <react_native_1.View style={[styles.modalSheet, { backgroundColor: theme.modalBg }]}>
            <react_native_1.View style={styles.modalHandle}/>
            <react_native_1.Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingTurf ? 'Edit Turf' : 'Add New Turf'}
            </react_native_1.Text>

            <react_native_1.ScrollView showsVerticalScrollIndicator={false}>
              {/* Name */}
              <react_native_1.Text style={[styles.fieldLabel, { color: theme.textMuted }]}>TURF NAME *</react_native_1.Text>
              <react_native_1.TextInput value={formName} onChangeText={setFormName} placeholder="e.g. Green Arena" placeholderTextColor={theme.textMuted} style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}/>

              {/* Address */}
              <react_native_1.Text style={[styles.fieldLabel, { color: theme.textMuted }]}>LOCATION / ADDRESS</react_native_1.Text>
              <react_native_1.TextInput value={formAddress} onChangeText={setFormAddress} placeholder="e.g. Savedi, Ahmednagar" placeholderTextColor={theme.textMuted} style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}/>

              {/* Price */}
              <react_native_1.Text style={[styles.fieldLabel, { color: theme.textMuted }]}>PRICE PER HOUR (₹) *</react_native_1.Text>
              <react_native_1.TextInput value={formPrice} onChangeText={setFormPrice} placeholder="e.g. 700" placeholderTextColor={theme.textMuted} keyboardType="numeric" style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}/>

              {/* Sport */}
              <react_native_1.Text style={[styles.fieldLabel, { color: theme.textMuted }]}>SPORT</react_native_1.Text>
              <react_native_1.ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <react_native_1.View style={{ flexDirection: 'row', gap: 8 }}>
                  {SPORT_OPTIONS.map((s) => (<react_native_1.TouchableOpacity key={s} style={[styles.sportChip, { backgroundColor: formSport === s ? ACCENT : theme.inputBg, borderColor: formSport === s ? ACCENT : theme.cardBorder }]} onPress={() => setFormSport(s)}>
                      <react_native_1.Text style={[styles.sportChipText, { color: formSport === s ? '#fff' : theme.text }]}>{s}</react_native_1.Text>
                    </react_native_1.TouchableOpacity>))}
                </react_native_1.View>
              </react_native_1.ScrollView>

              {/* Description */}
              <react_native_1.Text style={[styles.fieldLabel, { color: theme.textMuted }]}>DESCRIPTION</react_native_1.Text>
              <react_native_1.TextInput value={formDescription} onChangeText={setFormDescription} placeholder="Short description of your turf..." placeholderTextColor={theme.textMuted} multiline numberOfLines={3} style={[styles.input, styles.inputMultiline, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}/>

              {/* Turf Photo URL */}
              <react_native_1.Text style={[styles.fieldLabel, { color: theme.textMuted }]}>TURF PHOTO URL</react_native_1.Text>
              <react_native_1.TextInput value={formImage} onChangeText={setFormImage} placeholder="https://example.com/photo.jpg or select below" placeholderTextColor={theme.textMuted} style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}/>

              {/* Quick Presets */}
              <react_native_1.Text style={[styles.fieldLabel, { color: theme.textMuted, fontSize: 8, marginTop: -8, marginBottom: 12 }]}>
                QUICK PRESETS
              </react_native_1.Text>
              <react_native_1.View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                {[
            { name: 'Soccer', url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=60' },
            { name: 'Cricket', url: 'https://images.unsplash.com/photo-1531415080295-6ad6679ff877?w=600&auto=format&fit=crop&q=60' },
            { name: 'Arena', url: 'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?w=600&auto=format&fit=crop&q=60' }
        ].map((preset) => (<react_native_1.TouchableOpacity key={preset.name} style={{
                backgroundColor: formImage === preset.url ? ACCENT : theme.inputBg,
                borderColor: formImage === preset.url ? ACCENT : theme.cardBorder,
                borderWidth: 1.5,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 6,
            }} onPress={() => setFormImage(preset.url)}>
                    <react_native_1.Text style={{ fontSize: 11, fontWeight: '700', color: formImage === preset.url ? '#fff' : theme.text }}>
                      {preset.name}
                    </react_native_1.Text>
                  </react_native_1.TouchableOpacity>))}
              </react_native_1.View>

              {/* Photo Preview inside modal */}
              {formImage ? (<react_native_1.View style={{ width: '100%', height: 120, borderRadius: 16, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: theme.cardBorder }}>
                  <react_native_1.Image source={{ uri: formImage }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }}/>
                  <react_native_1.TouchableOpacity style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', padding: 6, borderRadius: 20 }} onPress={() => setFormImage('')}>
                    <vector_icons_1.Ionicons name="trash-outline" size={14} color="#fff"/>
                  </react_native_1.TouchableOpacity>
                </react_native_1.View>) : null}
              <react_native_1.View style={styles.toggleRow}>
                <react_native_1.Text style={[styles.toggleLabel, { color: theme.text }]}>Turf is Active</react_native_1.Text>
                <react_native_1.Switch value={formActive} onValueChange={setFormActive} trackColor={{ false: '#475569', true: ACCENT }} thumbColor="#ffffff"/>
              </react_native_1.View>

              {/* Actions */}
              <react_native_1.View style={styles.modalActions}>
                <react_native_1.TouchableOpacity style={[styles.cancelBtn, { borderColor: theme.cardBorder }]} onPress={() => setModalVisible(false)}>
                  <react_native_1.Text style={[styles.cancelBtnText, { color: theme.textMuted }]}>Cancel</react_native_1.Text>
                </react_native_1.TouchableOpacity>
                <react_native_1.TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                  {saving ? (<react_native_1.ActivityIndicator size="small" color="#fff"/>) : (<react_native_1.Text style={styles.saveBtnText}>{editingTurf ? 'Save Changes' : 'Add Turf'}</react_native_1.Text>)}
                </react_native_1.TouchableOpacity>
              </react_native_1.View>
            </react_native_1.ScrollView>
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.Modal>
    </react_native_1.View>);
}
const styles = react_native_1.StyleSheet.create({
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
});
