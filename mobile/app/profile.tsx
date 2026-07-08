import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useBookingStore } from '../store/bookingStore';

const ACCENT = '#10b981';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, updateUser, logout } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();

  const theme = {
    bg: isDarkMode ? '#030712' : '#f8fafc',
    card: isDarkMode ? 'rgba(15, 23, 42, 0.72)' : '#ffffff',
    cardSolid: isDarkMode ? '#0f172a' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? 'rgba(16, 185, 129, 0.16)' : '#e2e8f0',
    inputBg: isDarkMode ? '#030712' : '#f1f5f9',
    bgImageOpacity: isDarkMode ? 0.35 : 0.22,
    overlayBg: isDarkMode ? 'rgba(3, 7, 18, 0.5)' : 'rgba(248, 250, 252, 0.6)',
  };

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '9359473030');
  const [status, setStatus] = useState(user?.status ?? 'Mera namaste ahmwd hai nai roz cricket Khatami hu');
  const [avatarFailed, setAvatarFailed] = useState(false);

  // Bookings live query
  const bookings = useBookingStore((s) => s.bookings);
  const playcoinsBalance = 350 + (bookings.length * 50);

  // Teams list state
  const [teams, setTeams] = useState<Array<{ name: string; sport: string }>>([
    { name: 'Red Devils savedi', sport: 'Football' }
  ]);
  const [isAddTeamModalVisible, setIsAddTeamModalVisible] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamSport, setNewTeamSport] = useState('Football');

  const handleAddTeam = () => {
    if (!newTeamName.trim()) {
      Alert.alert('Error', 'Team name cannot be empty');
      return;
    }
    setTeams([...teams, { name: newTeamName.trim(), sport: newTeamSport }]);
    setNewTeamName('');
    setIsAddTeamModalVisible(false);
    Alert.alert('Success', `Team "${newTeamName.trim()}" created successfully!`);
  };

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
    updateUser({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      status: status.trim()
    });
    setIsEditing(false);
    Alert.alert('Saved', 'Your profile has been updated');
  };

  const handleCancel = () => {
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone ?? '9359473030');
    setStatus(user.status ?? 'Mera namaste ahmwd hai nai roz cricket Khatami hu');
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

  const sportIcon = (sport: string) => {
    if (sport === 'Cricket') return 'cricket';
    if (sport === 'Box Cricket') return 'cricket';
    return 'soccer';
  };

  const stats = [
    { label: 'Games', value: String(bookings.length), icon: 'gamepad-variant', color: '#10b981' },
    { label: 'Upcoming', value: String(bookings.filter((b) => b.status === 'UPCOMING').length), icon: 'calendar-clock', color: '#3b82f6' },
    { label: 'Matches', value: String(teams.length * 2), icon: 'trophy', color: '#f59e0b' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Image
        source={require('../assets/turf-bg.jpg')}
        style={[styles.backgroundImage as any, { opacity: theme.bgImageOpacity }]}
        resizeMode="cover"
      />
      <View style={[styles.overlay, { backgroundColor: theme.overlayBg }]} />

      {/* Header Profile Title bar */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 12, backgroundColor: theme.card, borderBottomColor: theme.border },
        ]}
      >
        <View style={styles.headerLeftContainer}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.iconButton, { borderColor: theme.border }]}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>My Profile</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            onPress={toggleTheme}
            style={[styles.iconButton, { borderColor: theme.border }]}
            hitSlop={8}
          >
            <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={20} color={isDarkMode ? '#fbbf24' : '#6366f1'} />
          </TouchableOpacity>
          {!isEditing && (
            <TouchableOpacity
              onPress={() => setIsEditing(true)}
              style={[styles.iconButton, { borderColor: theme.border }]}
              hitSlop={8}
            >
              <MaterialCommunityIcons name="pencil" size={20} color={ACCENT} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isEditing ? (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Edit Profile</Text>

            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>FULL NAME</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
            />

            <Text style={[styles.fieldLabel, { color: theme.textMuted, marginTop: 16 }]}>PHONE NUMBER</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter phone number"
              placeholderTextColor={theme.textMuted}
              keyboardType="phone-pad"
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
            />

            <Text style={[styles.fieldLabel, { color: theme.textMuted, marginTop: 16 }]}>EMAIL ADDRESS</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="name@example.com"
              placeholderTextColor={theme.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
            />

            <Text style={[styles.fieldLabel, { color: theme.textMuted, marginTop: 16 }]}>STATUS STATEMENT</Text>
            <TextInput
              value={status}
              onChangeText={setStatus}
              placeholder="Mera namaste ahmwd hai..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={3}
              style={[styles.input, styles.inputMultiline, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
            />

            <View style={styles.editActions}>
              <TouchableOpacity style={[styles.cancelButton, { backgroundColor: theme.inputBg, borderColor: theme.border }]} onPress={handleCancel}>
                <Text style={[styles.cancelButtonText, { color: theme.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
                <Ionicons name="checkmark" size={18} color="#030712" style={{ marginRight: 6 }} />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* Identity Hero Card */}
            <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.heroTop}>
                <View style={styles.avatarWrapper}>
                  <View style={styles.avatarRing}>
                    <View style={styles.avatarInner}>
                      <Text style={styles.avatarInitials}>{initials}</Text>
                      {!avatarFailed && (
                        <Image
                          source={{ uri: `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(name || 'ahmed')}` }}
                          style={styles.avatarImage as any}
                          onError={() => setAvatarFailed(true)}
                        />
                      )}
                    </View>
                  </View>
                  <View style={styles.onlineDot} />
                </View>

                <View style={styles.userInfo}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>{user.name}</Text>
                    <MaterialCommunityIcons name="check-decagram" size={18} color={ACCENT} style={{ marginLeft: 6 }} />
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="call-outline" size={13} color={theme.textMuted} />
                    <Text style={[styles.userSubText, { color: theme.textMuted }]} numberOfLines={1}>{phone}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="mail-outline" size={13} color={theme.textMuted} />
                    <Text style={[styles.userSubText, { color: theme.textMuted }]} numberOfLines={1}>{user.email}</Text>
                  </View>
                </View>
              </View>

              {status ? (
                <View style={styles.statusBubble}>
                  <MaterialCommunityIcons name="format-quote-open" size={16} color={ACCENT} />
                  <Text style={styles.statusText}>{status}</Text>
                </View>
              ) : null}

              {/* Playcoins pill */}
              <View style={styles.playcoinBanner}>
                <View style={styles.playcoinLeft}>
                  <View style={styles.coinBadge}>
                    <FontAwesome5 name="coins" size={13} color="#030712" />
                  </View>
                  <View>
                    <Text style={styles.playcoinLabel}>PLAYCOINS BALANCE</Text>
                    <Text style={styles.playcoinValue}>{playcoinsBalance}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.topUpButton}
                  activeOpacity={0.85}
                  onPress={() => Alert.alert('Playcoins', `You have ${playcoinsBalance} Playcoins!`)}
                >
                  <Text style={styles.topUpText}>Top up</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Stats Card */}
            <View style={[styles.statsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {stats.map((s, idx) => (
                <React.Fragment key={s.label}>
                  {idx > 0 && <View style={[styles.statDivider, { backgroundColor: theme.border }]} />}
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons name={s.icon as any} size={18} color={s.color} />
                    <Text style={[styles.statValue, { color: theme.text }]}>{s.value}</Text>
                    <Text style={[styles.statLabel, { color: theme.textMuted }]}>{s.label}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>

            {/* My Teams Section */}
            <View style={styles.teamsSection}>
              <Text style={[styles.sectionHeader, { color: theme.text }]}>My Teams</Text>
              <TouchableOpacity
                style={styles.addTeamButton}
                onPress={() => setIsAddTeamModalVisible(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={16} color={ACCENT} />
                <Text style={styles.addTeamText}>Add Team</Text>
              </TouchableOpacity>
            </View>

            {/* Teams Horizontal ScrollView */}
            {teams.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.teamsList}
                contentContainerStyle={styles.teamsListContent}
              >
                {teams.map((t, idx) => (
                  <View key={idx} style={[styles.teamCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.teamAvatar}>
                      <MaterialCommunityIcons name={sportIcon(t.sport) as any} size={20} color={ACCENT} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.teamName, { color: theme.text }]} numberOfLines={1}>
                        {t.name}
                      </Text>
                      <View style={styles.metaRow}>
                        <MaterialCommunityIcons name={sportIcon(t.sport) as any} size={12} color={theme.textMuted} />
                        <Text style={[styles.teamSport, { color: theme.textMuted }]}>{t.sport}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={[styles.emptyTeamsText, { color: theme.textMuted }]}>
                You have not joined or created any teams yet.
              </Text>
            )}

            {/* Menu Group 1 */}
            <Text style={[styles.groupLabel, { color: theme.textMuted }]}>ACTIVITY</Text>
            <View style={[styles.menuCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <MenuRow
                theme={theme}
                icon={<MaterialCommunityIcons name="ticket-confirmation" size={17} color="#fff" />}
                color="#10b981"
                label="My Bookings"
                onPress={() => router.push('/')}
              />
              <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />
              <MenuRow
                theme={theme}
                icon={<Ionicons name="heart" size={16} color="#fff" />}
                color="#f43f5e"
                label="My Favourites"
                onPress={() => Alert.alert('My Favourites', 'Favourites list is empty')}
              />
              <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />
              <MenuRow
                theme={theme}
                icon={<FontAwesome5 name="coins" size={12} color="#fff" />}
                color="#fbbf24"
                label="Playcoins"
                onPress={() => Alert.alert('Playcoins', `You have ${playcoinsBalance} Playcoins!`)}
              />
            </View>

            {/* Menu Group 2 */}
            <Text style={[styles.groupLabel, { color: theme.textMuted }]}>SUPPORT</Text>
            <View style={[styles.menuCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <MenuRow
                theme={theme}
                icon={<MaterialCommunityIcons name="calendar-refresh" size={16} color="#fff" />}
                color="#ef4444"
                label="Cancellation / Reschedule"
                onPress={() => Alert.alert('Cancellation / Reschedule', 'Please contact support to reschedule slot')}
              />
              <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />
              <MenuRow
                theme={theme}
                icon={<Ionicons name="headset" size={16} color="#fff" />}
                color="#3b82f6"
                label="Help & Support"
                onPress={() => Alert.alert('Help & Support', 'Reach us at support@turfbook.com')}
              />
              <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />
              <MenuRow
                theme={theme}
                icon={<Ionicons name="help-circle" size={17} color="#fff" />}
                color="#6366f1"
                label="FAQ"
                onPress={() => Alert.alert('FAQ', 'Frequently asked questions')}
              />
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
              <Ionicons name="log-out-outline" size={18} color="#ef4444" style={{ marginRight: 8 }} />
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>

            <Text style={[styles.versionText, { color: theme.textMuted }]}>TurfBook · v1.0.0</Text>

            {/* Add Team Modal popup */}
            <Modal
              animationType="fade"
              transparent={true}
              visible={isAddTeamModalVisible}
              onRequestClose={() => setIsAddTeamModalVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.cardSolid, borderColor: theme.border }]}>
                  <View style={styles.modalHandle} />
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Create a Team</Text>

                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>TEAM NAME</Text>
                  <TextInput
                    value={newTeamName}
                    onChangeText={setNewTeamName}
                    placeholder="Enter team name"
                    placeholderTextColor={theme.textMuted}
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text, marginBottom: 16 }]}
                  />

                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>SELECT SPORT</Text>
                  <View style={styles.sportsSelector}>
                    {['Football', 'Cricket', 'Box Cricket'].map((sport) => {
                      const isSel = newTeamSport === sport;
                      return (
                        <TouchableOpacity
                          key={sport}
                          onPress={() => setNewTeamSport(sport)}
                          activeOpacity={0.8}
                          style={[
                            styles.sportSelectButton,
                            {
                              backgroundColor: isSel ? ACCENT : theme.inputBg,
                              borderColor: isSel ? ACCENT : theme.border,
                            }
                          ]}
                        >
                          <Text style={{ color: isSel ? '#030712' : theme.text, fontWeight: 'bold', fontSize: 12 }}>
                            {sport}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.editActions}>
                    <TouchableOpacity
                      style={[styles.cancelButton, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                      onPress={() => setIsAddTeamModalVisible(false)}
                    >
                      <Text style={[styles.cancelButtonText, { color: theme.textMuted }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveButton} onPress={handleAddTeam} activeOpacity={0.85}>
                      <Text style={styles.saveButtonText}>Create</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </>
        )}
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View
        style={[
          styles.bottomTabBar,
          { paddingBottom: Math.max(insets.bottom, 10), backgroundColor: theme.card, borderTopColor: theme.border },
        ]}
      >
        <TabItem icon="home-outline" label="Home" onPress={() => router.replace('/')} color={theme.textMuted} />
        <TabItem icon="compass-outline" label="Explore" onPress={() => router.replace('/')} color={theme.textMuted} />
        <TabItem icon="trophy-outline" label="Matches" onPress={() => Alert.alert('Matches', 'Matches feature coming soon!')} color={theme.textMuted} />
        <TabItem icon="person" label="Profile" onPress={() => {}} color={ACCENT} active />
      </View>
    </View>
  );
}

function MenuRow({
  theme,
  icon,
  color,
  label,
  onPress,
}: {
  theme: { text: string; textMuted: string };
  icon: React.ReactNode;
  color: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.6}>
      <View style={styles.menuRowLeft}>
        <View style={[styles.iconBox, { backgroundColor: color }]}>{icon}</View>
        <Text style={[styles.menuRowText, { color: theme.text }]}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
    </TouchableOpacity>
  );
}

function TabItem({
  icon,
  label,
  onPress,
  color,
  active,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color: string;
  active?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.tabLabel, { color, fontWeight: active ? '800' : '600' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  backgroundImage: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.18,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(3, 7, 18, 0.65)',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  headerLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Hero card
  heroCard: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.5,
    marginBottom: 18,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarRing: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 2.5,
    borderColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarInitials: {
    position: 'absolute',
    color: '#e2e8f0',
    fontSize: 26,
    fontWeight: '800',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: ACCENT,
    borderWidth: 2.5,
    borderColor: '#030712',
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 21,
    fontWeight: '800',
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userSubText: {
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 1,
  },
  statusBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statusText: {
    flex: 1,
    color: ACCENT,
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 17,
  },
  playcoinBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  playcoinLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  coinBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#fbbf24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playcoinLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 1,
  },
  playcoinValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fbbf24',
  },
  topUpButton: {
    backgroundColor: '#fbbf24',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  topUpText: {
    color: '#030712',
    fontWeight: '800',
    fontSize: 12,
  },

  // Stats
  statsCard: {
    flexDirection: 'row',
    borderRadius: 20,
    paddingVertical: 18,
    borderWidth: 1.5,
    marginBottom: 24,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },

  teamsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '800',
  },
  addTeamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: ACCENT,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addTeamText: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: '700',
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 10,
    marginLeft: 4,
  },
  menuCard: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuRowText: {
    fontSize: 15,
    fontWeight: '600',
  },
  menuDivider: {
    height: 1,
  },
  bottomTabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 10,
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  card: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 1.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontWeight: '700',
    fontSize: 14,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT,
  },
  saveButtonText: {
    color: '#030712',
    fontWeight: '800',
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    marginTop: 4,
  },
  logoutButtonText: {
    color: '#ef4444',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 16,
  },
  teamsList: {
    marginBottom: 22,
    marginTop: -2,
  },
  teamsListContent: {
    gap: 12,
    paddingRight: 20,
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    width: 210,
  },
  teamAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamName: {
    fontSize: 14,
    fontWeight: '700',
  },
  teamSport: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyTeamsText: {
    textAlign: 'center',
    paddingVertical: 14,
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(148, 163, 184, 0.4)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
  },
  sportsSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  sportSelectButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
