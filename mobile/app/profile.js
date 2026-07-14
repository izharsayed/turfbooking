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
exports.default = ProfileScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const expo_router_1 = require("expo-router");
const vector_icons_1 = require("@expo/vector-icons");
const authStore_1 = require("../store/authStore");
const themeStore_1 = require("../store/themeStore");
const bookingStore_1 = require("../store/bookingStore");
const api_1 = require("../utils/api");
const ACCENT = '#10b981';
function ProfileScreen() {
    const router = (0, expo_router_1.useRouter)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const { user, isAuthenticated, updateUser, logout } = (0, authStore_1.useAuthStore)();
    const { isDarkMode, toggleTheme } = (0, themeStore_1.useThemeStore)();
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
    const [isEditing, setIsEditing] = (0, react_1.useState)(false);
    const [name, setName] = (0, react_1.useState)(user?.name ?? '');
    const [email, setEmail] = (0, react_1.useState)(user?.email ?? '');
    const [phone, setPhone] = (0, react_1.useState)(user?.phone ?? '');
    const [status, setStatus] = (0, react_1.useState)(user?.status ?? '');
    const [avatarFailed, setAvatarFailed] = (0, react_1.useState)(false);
    const [saving, setSaving] = (0, react_1.useState)(false);
    const [loadingProfile, setLoadingProfile] = (0, react_1.useState)(false);
    // Fetch fresh profile from backend on mount
    (0, react_1.useEffect)(() => {
        const fetchProfile = async () => {
            if (!user)
                return;
            setLoadingProfile(true);
            try {
                const res = await (0, api_1.apiFetch)('/profile');
                if (res.success && res.data) {
                    const u = res.data.user;
                    const p = res.data.profile;
                    const fullName = p
                        ? `${p.firstName || ''} ${p.lastName || ''}`.trim() || u.name
                        : u.name;
                    // Update store + local state
                    updateUser({
                        name: fullName,
                        email: u.email,
                        phone: u.phone,
                        avatarUrl: u.avatarUrl,
                    });
                    setName(fullName);
                    setEmail(u.email || '');
                    setPhone(u.phone || '');
                }
            }
            catch (err) {
                console.warn('Could not refresh profile from backend:', err);
            }
            finally {
                setLoadingProfile(false);
            }
        };
        fetchProfile();
    }, []);
    // Bookings live query
    const bookings = (0, bookingStore_1.useBookingStore)((s) => s.bookings);
    // Teams list state
    const [teams, setTeams] = (0, react_1.useState)([
        { name: 'Red Devils savedi', sport: 'Football' }
    ]);
    const [isAddTeamModalVisible, setIsAddTeamModalVisible] = (0, react_1.useState)(false);
    const [newTeamName, setNewTeamName] = (0, react_1.useState)('');
    const [newTeamSport, setNewTeamSport] = (0, react_1.useState)('Football');
    const handleAddTeam = () => {
        if (!newTeamName.trim()) {
            react_native_1.Alert.alert('Error', 'Team name cannot be empty');
            return;
        }
        setTeams([...teams, { name: newTeamName.trim(), sport: newTeamSport }]);
        setNewTeamName('');
        setIsAddTeamModalVisible(false);
        react_native_1.Alert.alert('Success', `Team "${newTeamName.trim()}" created successfully!`);
    };
    // Guard: only accessible when signed in
    if (!isAuthenticated || !user) {
        return <expo_router_1.Redirect href="/login"/>;
    }
    const initials = user.name
        .split(' ')
        .map((part) => part.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase();
    const handleSave = async () => {
        if (!name.trim()) {
            react_native_1.Alert.alert('Error', 'Name cannot be empty');
            return;
        }
        setSaving(true);
        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '';
        try {
            await (0, api_1.apiFetch)('/profile', {
                method: 'PUT',
                body: { firstName, lastName },
            });
            // Update local store with new data
            updateUser({
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                status: status.trim(),
            });
            setIsEditing(false);
            react_native_1.Alert.alert('Saved', 'Your profile has been updated successfully.');
        }
        catch (err) {
            // Network error: apply locally without backend sync
            if (err?.statusCode) {
                react_native_1.Alert.alert('Save Failed', err.message || 'Could not update profile.');
            }
            else {
                updateUser({
                    name: name.trim(),
                    email: email.trim(),
                    phone: phone.trim(),
                    status: status.trim(),
                });
                setIsEditing(false);
                react_native_1.Alert.alert('Saved Locally', 'Profile saved locally. Will sync when online.');
            }
        }
        finally {
            setSaving(false);
        }
    };
    const handleCancel = () => {
        setName(user.name);
        setEmail(user.email);
        setPhone(user.phone ?? '9359473030');
        setStatus(user.status ?? 'Mera namaste ahmwd hai nai roz cricket Khatami hu');
        setIsEditing(false);
    };
    const handleLogout = () => {
        react_native_1.Alert.alert('Log out', 'Are you sure you want to log out?', [
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
    const sportIcon = (sport) => {
        if (sport === 'Cricket')
            return 'cricket';
        if (sport === 'Box Cricket')
            return 'cricket';
        return 'soccer';
    };
    return (<react_native_1.View style={[styles.container, { backgroundColor: theme.bg }]}>
      <react_native_1.ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 60, 80) }} showsVerticalScrollIndicator={false}>
        {/* Full-bleed background header */}
        <react_native_1.ImageBackground source={require('../assets/turf-bg.jpg')} style={styles.headerBg} imageStyle={styles.headerImage} resizeMode="cover">
          <react_native_1.View style={styles.darkOverlay}/>
          
          <react_native_1.View style={[styles.headerInnerContent, { paddingTop: insets.top + 16 }]}>
            {/* Top Navbar Row */}
            <react_native_1.View style={styles.topNavbar}>
              <react_native_1.TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => router.back()}>
                <vector_icons_1.Ionicons name="arrow-back" size={22} color="#ffffff"/>
              </react_native_1.TouchableOpacity>

              <react_native_1.View style={{ flexDirection: 'row', gap: 10 }}>
                <react_native_1.TouchableOpacity style={styles.themeBtn} activeOpacity={0.7} onPress={toggleTheme}>
                  <vector_icons_1.Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={20} color="#ffffff"/>
                </react_native_1.TouchableOpacity>

                {!isEditing && (<react_native_1.TouchableOpacity style={styles.editBtn} activeOpacity={0.7} onPress={() => setIsEditing(true)}>
                    <vector_icons_1.MaterialCommunityIcons name="pencil" size={20} color="#ffffff"/>
                  </react_native_1.TouchableOpacity>)}
              </react_native_1.View>
            </react_native_1.View>

            {/* Header Content */}
            <react_native_1.View style={styles.headerTextWrap}>
              <react_native_1.Text style={styles.headerTitleText}>My Profile</react_native_1.Text>
            </react_native_1.View>
          </react_native_1.View>
        </react_native_1.ImageBackground>

        {/* Profile Card & Info */}
        <react_native_1.View style={styles.overlapWrapper}>
        {isEditing ? (<react_native_1.View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <react_native_1.Text style={[styles.cardTitle, { color: theme.text }]}>Edit Profile</react_native_1.Text>

            <react_native_1.Text style={[styles.fieldLabel, { color: theme.textMuted }]}>FULL NAME</react_native_1.Text>
            <react_native_1.TextInput value={name} onChangeText={setName} placeholder="Enter your name" placeholderTextColor={theme.textMuted} style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}/>

            <react_native_1.Text style={[styles.fieldLabel, { color: theme.textMuted, marginTop: 16 }]}>PHONE NUMBER</react_native_1.Text>
            <react_native_1.TextInput value={phone} onChangeText={setPhone} placeholder="Enter phone number" placeholderTextColor={theme.textMuted} keyboardType="phone-pad" style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}/>

            <react_native_1.Text style={[styles.fieldLabel, { color: theme.textMuted, marginTop: 16 }]}>EMAIL ADDRESS</react_native_1.Text>
            <react_native_1.TextInput value={email} onChangeText={setEmail} placeholder="name@example.com" placeholderTextColor={theme.textMuted} keyboardType="email-address" autoCapitalize="none" style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}/>

            <react_native_1.Text style={[styles.fieldLabel, { color: theme.textMuted, marginTop: 16 }]}>STATUS STATEMENT</react_native_1.Text>
            <react_native_1.TextInput value={status} onChangeText={setStatus} placeholder="Mera namaste ahmwd hai..." placeholderTextColor={theme.textMuted} multiline numberOfLines={3} style={[styles.input, styles.inputMultiline, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}/>

            <react_native_1.View style={styles.editActions}>
              <react_native_1.TouchableOpacity style={[styles.cancelButton, { backgroundColor: theme.inputBg, borderColor: theme.border }]} onPress={handleCancel}>
                <react_native_1.Text style={[styles.cancelButtonText, { color: theme.textMuted }]}>Cancel</react_native_1.Text>
              </react_native_1.TouchableOpacity>
              <react_native_1.TouchableOpacity style={[styles.saveButton, saving && { opacity: 0.7 }]} onPress={handleSave} activeOpacity={0.85} disabled={saving}>
                {saving ? (<react_native_1.ActivityIndicator size="small" color="#030712"/>) : (<>
                    <vector_icons_1.Ionicons name="checkmark" size={18} color="#030712" style={{ marginRight: 6 }}/>
                    <react_native_1.Text style={styles.saveButtonText}>Save Changes</react_native_1.Text>
                  </>)}
              </react_native_1.TouchableOpacity>
            </react_native_1.View>
          </react_native_1.View>) : (<>
            {/* Identity Hero Card */}
            <react_native_1.View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <react_native_1.View style={styles.heroTop}>
                <react_native_1.View style={styles.avatarWrapper}>
                  <react_native_1.View style={styles.avatarRing}>
                    <react_native_1.View style={styles.avatarInner}>
                      <react_native_1.Text style={styles.avatarInitials}>{initials}</react_native_1.Text>
                      {!avatarFailed && (<react_native_1.Image source={{ uri: `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(name || 'ahmed')}` }} style={styles.avatarImage} onError={() => setAvatarFailed(true)}/>)}
                    </react_native_1.View>
                  </react_native_1.View>
                  <react_native_1.View style={styles.onlineDot}/>
                </react_native_1.View>

                <react_native_1.View style={styles.userInfo}>
                  <react_native_1.View style={styles.nameRow}>
                    <react_native_1.Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>{user.name}</react_native_1.Text>
                    <vector_icons_1.MaterialCommunityIcons name="check-decagram" size={18} color={ACCENT} style={{ marginLeft: 6 }}/>
                  </react_native_1.View>
                  <react_native_1.View style={styles.metaRow}>
                    <vector_icons_1.Ionicons name="call-outline" size={13} color={theme.textMuted}/>
                    <react_native_1.Text style={[styles.userSubText, { color: theme.textMuted }]} numberOfLines={1}>{phone}</react_native_1.Text>
                  </react_native_1.View>
                  <react_native_1.View style={styles.metaRow}>
                    <vector_icons_1.Ionicons name="mail-outline" size={13} color={theme.textMuted}/>
                    <react_native_1.Text style={[styles.userSubText, { color: theme.textMuted }]} numberOfLines={1}>{user.email}</react_native_1.Text>
                  </react_native_1.View>
                </react_native_1.View>
              </react_native_1.View>

              {status ? (<react_native_1.View style={styles.statusBubble}>
                  <vector_icons_1.MaterialCommunityIcons name="format-quote-open" size={16} color={ACCENT}/>
                  <react_native_1.Text style={styles.statusText}>{status}</react_native_1.Text>
                </react_native_1.View>) : null}


            </react_native_1.View>



            {/* My Teams Section */}
            <react_native_1.View style={styles.teamsSection}>
              <react_native_1.Text style={[styles.sectionHeader, { color: theme.text }]}>My Teams</react_native_1.Text>
              <react_native_1.TouchableOpacity style={styles.addTeamButton} onPress={() => setIsAddTeamModalVisible(true)} activeOpacity={0.8}>
                <vector_icons_1.Ionicons name="add" size={16} color={ACCENT}/>
                <react_native_1.Text style={styles.addTeamText}>Add Team</react_native_1.Text>
              </react_native_1.TouchableOpacity>
            </react_native_1.View>

            {/* Teams Horizontal ScrollView */}
            {teams.length > 0 ? (<react_native_1.ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.teamsList} contentContainerStyle={styles.teamsListContent}>
                {teams.map((t, idx) => (<react_native_1.View key={idx} style={[styles.teamCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <react_native_1.View style={styles.teamAvatar}>
                      <vector_icons_1.MaterialCommunityIcons name={sportIcon(t.sport)} size={20} color={ACCENT}/>
                    </react_native_1.View>
                    <react_native_1.View style={{ flex: 1 }}>
                      <react_native_1.Text style={[styles.teamName, { color: theme.text }]} numberOfLines={1}>
                        {t.name}
                      </react_native_1.Text>
                      <react_native_1.View style={styles.metaRow}>
                        <vector_icons_1.MaterialCommunityIcons name={sportIcon(t.sport)} size={12} color={theme.textMuted}/>
                        <react_native_1.Text style={[styles.teamSport, { color: theme.textMuted }]}>{t.sport}</react_native_1.Text>
                      </react_native_1.View>
                    </react_native_1.View>
                    <vector_icons_1.Ionicons name="chevron-forward" size={16} color={theme.textMuted}/>
                  </react_native_1.View>))}
              </react_native_1.ScrollView>) : (<react_native_1.Text style={[styles.emptyTeamsText, { color: theme.textMuted }]}>
                You have not joined or created any teams yet.
              </react_native_1.Text>)}

            {/* Menu Group 1 */}
            <react_native_1.Text style={[styles.groupLabel, { color: theme.textMuted }]}>ACTIVITY</react_native_1.Text>
            <react_native_1.View style={[styles.menuCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <MenuRow theme={theme} icon={<vector_icons_1.MaterialCommunityIcons name="ticket-confirmation" size={17} color="#fff"/>} color="#10b981" label="My Bookings" onPress={() => router.replace({ pathname: '/', params: { tab: 'bookings' } })}/>
              <react_native_1.View style={[styles.menuDivider, { backgroundColor: theme.border }]}/>
              <MenuRow theme={theme} icon={<vector_icons_1.Ionicons name="heart" size={16} color="#fff"/>} color="#f43f5e" label="My Favourites" onPress={() => react_native_1.Alert.alert('My Favourites', 'Favourites list is empty')}/>

            </react_native_1.View>

            {/* Menu Group 2 */}
            <react_native_1.Text style={[styles.groupLabel, { color: theme.textMuted }]}>SUPPORT</react_native_1.Text>
            <react_native_1.View style={[styles.menuCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <MenuRow theme={theme} icon={<vector_icons_1.MaterialCommunityIcons name="calendar-refresh" size={16} color="#fff"/>} color="#ef4444" label="Cancellation / Reschedule" onPress={() => router.replace({ pathname: '/', params: { tab: 'bookings' } })}/>
              <react_native_1.View style={[styles.menuDivider, { backgroundColor: theme.border }]}/>
              <MenuRow theme={theme} icon={<vector_icons_1.Ionicons name="headset" size={16} color="#fff"/>} color="#3b82f6" label="Help & Support" onPress={() => router.replace({ pathname: '/', params: { tab: 'support' } })}/>
              <react_native_1.View style={[styles.menuDivider, { backgroundColor: theme.border }]}/>
              <MenuRow theme={theme} icon={<vector_icons_1.Ionicons name="help-circle" size={17} color="#fff"/>} color="#6366f1" label="FAQ" onPress={() => router.replace({ pathname: '/', params: { tab: 'support' } })}/>
            </react_native_1.View>

            {/* Logout */}
            <react_native_1.TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
              <vector_icons_1.Ionicons name="log-out-outline" size={18} color="#ef4444" style={{ marginRight: 8 }}/>
              <react_native_1.Text style={styles.logoutButtonText}>Log Out</react_native_1.Text>
            </react_native_1.TouchableOpacity>

            <react_native_1.Text style={[styles.versionText, { color: theme.textMuted }]}>TurfBook · v1.0.0</react_native_1.Text>

            {/* Add Team Modal popup */}
            <react_native_1.Modal animationType="fade" transparent={true} visible={isAddTeamModalVisible} onRequestClose={() => setIsAddTeamModalVisible(false)}>
              <react_native_1.View style={styles.modalOverlay}>
                <react_native_1.View style={[styles.modalContent, { backgroundColor: theme.cardSolid, borderColor: theme.border }]}>
                  <react_native_1.View style={styles.modalHandle}/>
                  <react_native_1.Text style={[styles.modalTitle, { color: theme.text }]}>Create a Team</react_native_1.Text>

                  <react_native_1.Text style={[styles.fieldLabel, { color: theme.textMuted }]}>TEAM NAME</react_native_1.Text>
                  <react_native_1.TextInput value={newTeamName} onChangeText={setNewTeamName} placeholder="Enter team name" placeholderTextColor={theme.textMuted} style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text, marginBottom: 16 }]}/>

                  <react_native_1.Text style={[styles.fieldLabel, { color: theme.textMuted }]}>SELECT SPORT</react_native_1.Text>
                  <react_native_1.View style={styles.sportsSelector}>
                    {['Football', 'Cricket', 'Box Cricket'].map((sport) => {
                const isSel = newTeamSport === sport;
                return (<react_native_1.TouchableOpacity key={sport} onPress={() => setNewTeamSport(sport)} activeOpacity={0.8} style={[
                        styles.sportSelectButton,
                        {
                            backgroundColor: isSel ? ACCENT : theme.inputBg,
                            borderColor: isSel ? ACCENT : theme.border,
                        }
                    ]}>
                          <react_native_1.Text style={{ color: isSel ? '#030712' : theme.text, fontWeight: 'bold', fontSize: 12 }}>
                            {sport}
                          </react_native_1.Text>
                        </react_native_1.TouchableOpacity>);
            })}
                  </react_native_1.View>

                  <react_native_1.View style={styles.editActions}>
                    <react_native_1.TouchableOpacity style={[styles.cancelButton, { backgroundColor: theme.inputBg, borderColor: theme.border }]} onPress={() => setIsAddTeamModalVisible(false)}>
                      <react_native_1.Text style={[styles.cancelButtonText, { color: theme.textMuted }]}>Cancel</react_native_1.Text>
                    </react_native_1.TouchableOpacity>
                    <react_native_1.TouchableOpacity style={styles.saveButton} onPress={handleAddTeam} activeOpacity={0.85}>
                      <react_native_1.Text style={styles.saveButtonText}>Create</react_native_1.Text>
                    </react_native_1.TouchableOpacity>
                  </react_native_1.View>
                </react_native_1.View>
              </react_native_1.View>
            </react_native_1.Modal>
          </>)}
        </react_native_1.View>
      </react_native_1.ScrollView>

      {/* Bottom Navigation Bar */}
      <react_native_1.View style={[
            styles.bottomTabBar,
            { paddingBottom: Math.max(insets.bottom, 10), backgroundColor: theme.card, borderTopColor: theme.border },
        ]}>
        <TabItem icon="home-outline" label="Home" onPress={() => router.replace({ pathname: '/', params: { tab: 'explore' } })} color={theme.textMuted}/>
        <TabItem icon="map-outline" label="Nearby" onPress={() => router.replace({ pathname: '/', params: { tab: 'map' } })} color={theme.textMuted}/>
        <TabItem icon="calendar-outline" label="Booking" onPress={() => {
            if (!isAuthenticated) {
                router.push('/login');
            }
            else {
                router.replace({ pathname: '/', params: { tab: 'bookings' } });
            }
        }} color={theme.textMuted}/>
        <TabItem icon="person" label="Profile" onPress={() => { }} color={ACCENT} active/>
      </react_native_1.View>
    </react_native_1.View>);
}
function MenuRow({ theme, icon, color, label, onPress, }) {
    return (<react_native_1.TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.6}>
      <react_native_1.View style={styles.menuRowLeft}>
        <react_native_1.View style={[styles.iconBox, { backgroundColor: color }]}>{icon}</react_native_1.View>
        <react_native_1.Text style={[styles.menuRowText, { color: theme.text }]}>{label}</react_native_1.Text>
      </react_native_1.View>
      <vector_icons_1.Ionicons name="chevron-forward" size={16} color={theme.textMuted}/>
    </react_native_1.TouchableOpacity>);
}
function TabItem({ icon, label, onPress, color, active, }) {
    return (<react_native_1.TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.7}>
      <vector_icons_1.Ionicons name={icon} size={22} color={color}/>
      <react_native_1.Text style={[styles.tabLabel, { color, fontWeight: active ? '800' : '600' }]}>{label}</react_native_1.Text>
    </react_native_1.TouchableOpacity>);
}
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
    },
    headerBg: {
        width: '100%',
        height: 240,
        overflow: 'hidden',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    headerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    headerInnerContent: {
        flex: 1,
        paddingHorizontal: 20,
        justifyContent: 'space-between',
        paddingBottom: 55,
    },
    darkOverlay: {
        ...react_native_1.StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
    },
    topNavbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    themeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    editBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    headerTextWrap: {
        marginTop: 10,
    },
    headerTitleText: {
        fontSize: 28,
        fontWeight: '900',
        color: '#ffffff',
        marginBottom: 4,
    },
    overlapWrapper: {
        marginTop: -40,
        paddingHorizontal: 20,
        zIndex: 20,
    },
    // Hero card
    heroCard: {
        borderRadius: 24,
        padding: 18,
        borderWidth: 1.5,
        marginBottom: 18,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 6,
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
        backgroundColor: 'rgba(16, 185, 129, 0.06)',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.15)',
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
        alignItems: 'center',
        justifyContent: 'center',
    },
    playcoinLabel: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 1,
    },
    playcoinValue: {
        fontSize: 18,
        fontWeight: '800',
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
    statsCardContainer: {
        flexDirection: 'row',
        borderRadius: 20,
        paddingVertical: 18,
        backgroundColor: '#1e293b',
        marginBottom: 24,
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    statsDividerLine: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    statsValueText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#ffffff',
    },
    statsLabelText: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(255, 255, 255, 0.6)',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        gap: 5,
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
