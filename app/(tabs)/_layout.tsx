import { Tabs, Redirect } from "expo-router";
import { Platform, View, Text } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import getColors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function ClassicTabLayout() {
  const { totalItems } = useCart();
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const tabBarHeight = isWeb ? 64 : 60 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: "Poppins_600SemiBold",
          fontSize: 10,
          marginTop: -2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarStyle: {
          height: tabBarHeight,
          paddingBottom: isWeb ? 8 : insets.bottom + 4,
          paddingTop: 6,
          backgroundColor: isDarkMode ? "#1C1C1E" : "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: isDarkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDarkMode ? 0.3 : 0.08,
          shadowRadius: 16,
          elevation: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          tabBarLabel: "Browse",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "grid" : "grid-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          tabBarLabel: "Cart",
          tabBarBadge: totalItems > 0 ? totalItems : undefined,
          tabBarBadgeStyle: {
            backgroundColor: Colors.primary,
            fontSize: 9,
            fontFamily: "Poppins_700Bold",
            minWidth: 16,
            height: 16,
            borderRadius: 8,
          },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "bag" : "bag-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  const { user } = useAuth();
  if (!user) return <Redirect href="/auth" />;
  if (user.role === "admin") return <Redirect href="/admin" />;
  if (user.role === "courier") return <Redirect href="/courier" />;
  if (user.role === "store") return <Redirect href="/(store)" />;
  return <ClassicTabLayout />;
}
