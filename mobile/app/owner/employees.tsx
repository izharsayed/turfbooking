import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Switch,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useNavigation, Redirect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { apiFetch } from '../../utils/api';

const ACCENT = '#10b981';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Employee {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: 'Caretaker' | 'Manager' | 'Staff';
  turfId: string;
  turfName: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

interface Turf {
  id: string;
  name: string;
}

export default function OwnerEmployeesScreen() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const navigation = useNavigation() as any;
  const { isDarkMode } = useThemeStore();
  const insets = useSafeAreaInsets();

  if (!isAuthenticated || !user) return <Redirect href="/login" />;
  if (user.role !== 'TURF_OWNER') return <Redirect href="/owner" />;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data lists
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [turfs, setTurfs] = useState<Turf[]>([]);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  
  // Form State
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'Caretaker' | 'Manager' | 'Staff'>('Caretaker');
  const [formTurfId, setFormTurfId] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      // Fetch employees
      const empRes = await apiFetch('/owner/employees');
      if (empRes.success && empRes.data) {
        setEmployees(empRes.data);
      } else {
        setEmployees([]);
      }

      // Fetch turfs list
      const turfRes = await apiFetch('/owner/turfs');
      if (turfRes.success && turfRes.data) {
        setTurfs(turfRes.data);
        if (turfRes.data.length > 0 && !formTurfId) {
          setFormTurfId(turfRes.data[0].id);
        }
      }
    } catch (e) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const openAddModal = () => {
    setEditingEmp(null);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('Caretaker');
    if (turfs.length > 0) {
      setFormTurfId(turfs[0].id);
    } else {
      setFormTurfId('');
    }
    setFormStatus('Active');
    setModalVisible(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmp(emp);
    setFormName(emp.name);
    setFormPhone(emp.phone);
    setFormEmail(emp.email);
    setFormPassword('');
    setFormRole(emp.role);
    setFormTurfId(emp.turfId);
    setFormStatus(emp.status);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formPhone.trim()) {
      Alert.alert('Validation Error', 'Name and Phone number are required.');
      return;
    }

    if (!editingEmp && !formPassword.trim()) {
      Alert.alert('Validation Error', 'Password is required for new employees.');
      return;
    }

    setSaving(true);
    try {
      // Find assigned turf name
      const assignedTurf = turfs.find(t => t.id === formTurfId);
      const turfName = assignedTurf ? assignedTurf.name : 'All Turfs';

      const payload: any = {
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim(),
        role: formRole,
        turfId: formTurfId,
        turfName,
        status: formStatus,
      };

      if (formPassword.trim()) {
        payload.password = formPassword.trim();
      }

      if (editingEmp) {
        // Edit Mode
        const res = await apiFetch(`/owner/employees/${editingEmp.id}`, {
          method: 'PUT',
          body: payload,
        });
        if (res.success) {
          setModalVisible(false);
          loadData();
        } else {
          Alert.alert('Error', res.message || 'Failed to update employee details.');
        }
      } else {
        // Add Mode
        const res = await apiFetch('/owner/employees', {
          method: 'POST',
          body: payload,
        });
        if (res.success) {
          setModalVisible(false);
          loadData();
        } else {
          Alert.alert('Error', res.message || 'Failed to create employee profile.');
        }
      }
    } catch (e) {
      Alert.alert('Error', 'An unexpected error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (emp: Employee) => {
    Alert.alert(
      'Remove Staff',
      `Are you sure you want to remove ${emp.name} from your employees list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await apiFetch(`/owner/employees/${emp.id}`, {
                method: 'DELETE',
              });
              if (res.success) {
                loadData();
              } else {
                Alert.alert('Error', 'Failed to remove employee.');
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to remove employee due to connection issue.');
            }
          }
        }
      ]
    );
  };

  const toggleStatusDirect = async (emp: Employee) => {
    const nextStatus = emp.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const res = await apiFetch(`/owner/employees/${emp.id}`, {
        method: 'PUT',
        body: { status: nextStatus },
      });
      if (res.success) {
        loadData();
      }
    } catch (e) {
    }
  };

  const theme = {
    bg: isDarkMode ? '#030712' : '#f1f5f9',
    card: isDarkMode ? '#0f172a' : '#ffffff',
    cardBorder: isDarkMode ? '#1e293b' : '#e2e8f0',
    text: isDarkMode ? '#ffffff' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    inputBg: isDarkMode ? '#1e293b' : '#f8fafc',
    divider: isDarkMode ? '#1e293b' : '#e2e8f0',
    modalBg: isDarkMode ? '#0f172a' : '#ffffff',
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('index')}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Staff & Caretakers</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Ionicons name="add" size={26} color={ACCENT} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />
        }
      >
        {employees.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <MaterialCommunityIcons name="account-group-outline" size={64} color={theme.textMuted} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Staff Registered</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
              Add caretakers or managers to help you run bookings and maintain slots.
            </Text>
            <TouchableOpacity style={styles.emptyAddBtn} onPress={openAddModal}>
              <Text style={styles.emptyAddBtnText}>Add Caretaker</Text>
            </TouchableOpacity>
          </View>
        ) : (
          employees.map((emp) => (
            <View key={emp.id} style={[styles.empCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.empHeader}>
                <View style={styles.empInfoLeft}>
                  <Text style={[styles.empName, { color: theme.text }]}>{emp.name}</Text>
                  <View style={[
                    styles.roleBadge,
                    emp.role === 'Manager' ? styles.roleBadgeManager : emp.role === 'Caretaker' ? styles.roleBadgeCaretaker : styles.roleBadgeStaff
                  ]}>
                    <Text style={[
                      styles.roleText,
                      emp.role === 'Manager' ? styles.roleTextManager : emp.role === 'Caretaker' ? styles.roleTextCaretaker : styles.roleTextStaff
                    ]}>
                      {emp.role}
                    </Text>
                  </View>
                </View>

                {/* Status Toggle Switch */}
                <View style={styles.statusSwitchRow}>
                  <Text style={[styles.statusLabel, { color: emp.status === 'Active' ? ACCENT : theme.textMuted }]}>
                    {emp.status}
                  </Text>
                  <Switch
                    value={emp.status === 'Active'}
                    onValueChange={() => toggleStatusDirect(emp)}
                    trackColor={{ false: '#374151', true: 'rgba(16,185,129,0.2)' }}
                    thumbColor={emp.status === 'Active' ? ACCENT : '#9ca3af'}
                    style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                  />
                </View>
              </View>

              <View style={[styles.dividerLine, { backgroundColor: theme.divider }]} />

              {/* Contact and Assignment info */}
              <View style={styles.empMetaRow}>
                <Ionicons name="call-outline" size={14} color={theme.textMuted} style={{ marginRight: 6 }} />
                <Text style={[styles.empMetaText, { color: theme.text }]}>{emp.phone}</Text>
              </View>
              {emp.email ? (
                <View style={styles.empMetaRow}>
                  <Ionicons name="mail-outline" size={14} color={theme.textMuted} style={{ marginRight: 6 }} />
                  <Text style={[styles.empMetaText, { color: theme.text }]}>{emp.email}</Text>
                </View>
              ) : null}
              <View style={styles.empMetaRow}>
                <MaterialCommunityIcons name="soccer-field" size={14} color={theme.textMuted} style={{ marginRight: 6 }} />
                <Text style={[styles.empMetaText, { color: theme.textMuted }]}>
                  Assigned Turf: <Text style={{ color: theme.text, fontWeight: '700' }}>{emp.turfName}</Text>
                </Text>
              </View>

              <View style={[styles.dividerLine, { backgroundColor: theme.divider }]} />

              {/* Card Actions */}
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(emp)}>
                  <Ionicons name="pencil" size={16} color={ACCENT} style={{ marginRight: 4 }} />
                  <Text style={styles.editBtnText}>Edit Details</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(emp)}>
                  <Ionicons name="trash-outline" size={16} color="#ef4444" style={{ marginRight: 4 }} />
                  <Text style={styles.deleteBtnText}>Remove</Text>
                </TouchableOpacity>
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
              {editingEmp ? 'Edit Employee' : 'Add Employee/Caretaker'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Name */}
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>FULL NAME *</Text>
              <TextInput
                value={formName}
                onChangeText={setFormName}
                placeholder="e.g. Ramesh Kumar"
                placeholderTextColor={theme.textMuted}
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}
              />

              {/* Phone */}
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>PHONE NUMBER *</Text>
              <TextInput
                value={formPhone}
                onChangeText={setFormPhone}
                placeholder="e.g. 9876543210"
                placeholderTextColor={theme.textMuted}
                keyboardType="phone-pad"
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}
              />

              {/* Email */}
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>EMAIL ADDRESS</Text>
              <TextInput
                value={formEmail}
                onChangeText={setFormEmail}
                placeholder="e.g. ramesh@example.com"
                placeholderTextColor={theme.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}
              />

              {/* Password */}
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
                PASSWORD {editingEmp ? '(LEAVE BLANK TO KEEP UNCHANGED)' : '*'}
              </Text>
              <TextInput
                value={formPassword}
                onChangeText={setFormPassword}
                placeholder="Enter login password"
                placeholderTextColor={theme.textMuted}
                secureTextEntry
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.text }]}
              />

              {/* Role */}
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>ROLE</Text>
              <View style={styles.roleChipsRow}>
                {(['Caretaker', 'Manager', 'Staff'] as const).map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.roleChip,
                      { backgroundColor: formRole === r ? ACCENT : theme.inputBg, borderColor: formRole === r ? ACCENT : theme.cardBorder }
                    ]}
                    onPress={() => setFormRole(r)}
                  >
                    <Text style={[styles.roleChipText, { color: formRole === r ? '#fff' : theme.text }]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Turf Assignment */}
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>ASSIGNED TURF</Text>
              <View style={styles.turfChipsRow}>
                {turfs.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.turfChip,
                      { backgroundColor: formTurfId === t.id ? ACCENT : theme.inputBg, borderColor: formTurfId === t.id ? ACCENT : theme.cardBorder }
                    ]}
                    onPress={() => setFormTurfId(t.id)}
                  >
                    <Text style={[styles.turfChipText, { color: formTurfId === t.id ? '#fff' : theme.text }]} numberOfLines={1}>{t.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Status */}
              <View style={styles.modalStatusRow}>
                <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}>Employee is Active</Text>
                <Switch
                  value={formStatus === 'Active'}
                  onValueChange={(val) => setFormStatus(val ? 'Active' : 'Inactive')}
                  trackColor={{ false: '#374151', true: 'rgba(16,185,129,0.2)' }}
                  thumbColor={formStatus === 'Active' ? ACCENT : '#9ca3af'}
                />
              </View>

              {/* Save / Cancel Action Buttons */}
              <View style={styles.formActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)} disabled={saving}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveBtnText}>{editingEmp ? 'Save Changes' : 'Add Employee'}</Text>
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
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  addBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyState: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  emptyAddBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  emptyAddBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  empCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  empHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  empInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  empName: {
    fontSize: 16,
    fontWeight: '800',
  },
  roleBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  roleBadgeCaretaker: {
    backgroundColor: 'rgba(16,185,129,0.08)',
  },
  roleBadgeManager: {
    backgroundColor: 'rgba(99,102,241,0.08)',
  },
  roleBadgeStaff: {
    backgroundColor: 'rgba(59,130,246,0.08)',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  roleTextCaretaker: {
    color: '#10b981',
  },
  roleTextManager: {
    color: '#6366f1',
  },
  roleTextStaff: {
    color: '#3b82f6',
  },
  statusSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  dividerLine: {
    height: 1,
    marginVertical: 12,
  },
  empMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  empMetaText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  editBtnText: {
    color: '#10b981',
    fontWeight: '700',
    fontSize: 13,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  deleteBtnText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3,7,18,0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    height: '80%',
  },
  modalHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#374151',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 14,
    marginBottom: 16,
  },
  roleChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  roleChip: {
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  turfChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  turfChip: {
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: SCREEN_WIDTH * 0.4,
  },
  turfChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#9ca3af',
    fontWeight: '800',
    fontSize: 14,
  },
  saveBtn: {
    flex: 2,
    height: 50,
    backgroundColor: '#10b981',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
});
