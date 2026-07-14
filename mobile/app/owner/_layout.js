"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = OwnerLayout;
const react_1 = __importDefault(require("react"));
const expo_router_1 = require("expo-router");
const vector_icons_1 = require("@expo/vector-icons");
const themeStore_1 = require("../../store/themeStore");
function OwnerLayout() {
    const { isDarkMode } = (0, themeStore_1.useThemeStore)();
    const tabBarBg = isDarkMode ? '#0f172a' : '#ffffff';
    const tabBarBorder = isDarkMode ? '#1e293b' : '#e2e8f0';
    const inactiveColor = isDarkMode ? '#64748b' : '#94a3b8';
    const activeColor = '#10b981';
    return (<expo_router_1.Tabs screenOptions={{
            headerShown: false,
            tabBarStyle: {
                backgroundColor: tabBarBg,
                borderTopColor: tabBarBorder,
                borderTopWidth: 1,
                height: 62,
                paddingBottom: 8,
                paddingTop: 6,
            },
            tabBarActiveTintColor: activeColor,
            tabBarInactiveTintColor: inactiveColor,
            tabBarLabelStyle: {
                fontSize: 10,
                fontWeight: '700',
            },
        }}>
      <expo_router_1.Tabs.Screen name="index" options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (<vector_icons_1.MaterialCommunityIcons name="view-dashboard-outline" size={size} color={color}/>),
        }}/>
      <expo_router_1.Tabs.Screen name="bookings" options={{
            title: 'Bookings',
            tabBarIcon: ({ color, size }) => (<vector_icons_1.Ionicons name="calendar-outline" size={size} color={color}/>),
        }}/>
      <expo_router_1.Tabs.Screen name="turfs" options={{
            title: 'My Turfs',
            tabBarIcon: ({ color, size }) => (<vector_icons_1.MaterialCommunityIcons name="soccer-field" size={size} color={color}/>),
        }}/>
      <expo_router_1.Tabs.Screen name="profile" options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (<vector_icons_1.Ionicons name="person-outline" size={size} color={color}/>),
        }}/>
    </expo_router_1.Tabs>);
}
