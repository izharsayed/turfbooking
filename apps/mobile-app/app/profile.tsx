import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore.js';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, updateUser, logout } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');

  // Guard: only accessible when signed in
  if (!isAuthenticated || !user) {
    return <Redirect href="/login" />;
  }

  const initials = user.name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    updateUser({ name: name.trim(), email: email.trim() });
    setIsEditing(false);
    Alert.alert('Saved', 'Your profile has been updated');
  };

  const handleCancel = () => {
    setName(user.name);
    setEmail(user.email);
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar + identity */}
      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>{user.role}</Text>
        </View>
      </View>

      {/* Account details */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Account Details</Text>
          {!isEditing && (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Name */}
        <Text style={styles.fieldLabel}>FULL NAME</Text>
        {isEditing ? (
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor="#64748b"
            style={styles.input}
          />
        ) : (
          <Text style={styles.fieldValue}>{user.name}</Text>
        )}

        {/* Email */}
        <Text style={[styles.fieldLabel, { marginTop: 16 }]}>EMAIL ADDRESS</Text>
        {isEditing ? (
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="name@example.com"
            placeholderTextColor="#64748b"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
        ) : (
          <Text style={styles.fieldValue}>{user.email}</Text>
        )}

        {/* Phone (read-only) */}
        <Text style={[styles.fieldLabel, { marginTop: 16 }]}>PHONE NUMBER</Text>
        <Text style={styles.fieldValue}>{user.phone ? `+91 ${user.phone}` : '—'}</Text>

        {isEditing && (
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Quick links */}
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => router.push('/')}
        >
          <Text style={styles.linkIcon}>📋</Text>
          <Text style={styles.linkText}>My Bookings</Text>
          <Text style={styles.linkChevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => Alert.alert('Support', 'Reach us at support@turfbook.com')}
        >
          <Text style={styles.linkIcon}>💬</Text>
          <Text style={styles.linkText}>Help & Support</Text>
          <Text style={styles.linkChevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => Alert.alert('About', 'TurfBook Mobile v1.0.0')}
        >
          <Text style={styles.linkIcon}>ℹ️</Text>
          <Text style={styles.linkText}>About</Text>
          <Text style={styles.linkChevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>TurfBook Mobile · v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617', // Slate 950
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  identity: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 2,
    borderColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: {
    color: '#10b981',
    fontSize: 30,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  roleBadgeText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  editLink: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '600',
  },
  fieldLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 1,
  },
  fieldValue: {
    color: '#fff',
    fontSize: 15,
  },
  input: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    fontSize: 14,
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cancelButtonText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 14,
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#10b981',
  },
  saveButtonText: {
    color: '#020617',
    fontWeight: 'bold',
    fontSize: 14,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  linkIcon: {
    fontSize: 18,
    marginRight: 14,
  },
  linkText: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  linkChevron: {
    color: '#64748b',
    fontSize: 22,
    fontWeight: '300',
  },
  divider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginVertical: 6,
  },
  logoutButton: {
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  logoutButtonText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 14,
  },
  version: {
    textAlign: 'center',
    color: '#475569',
    fontSize: 11,
    marginTop: 20,
  },
});
