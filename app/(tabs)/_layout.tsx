import { Tabs, Redirect } from "expo-router";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View } from "react-native";
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
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  const tabBarBottom = isWeb ? 20 : Math.max(insets.bottom, 8) + 8;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarItemStyle: {
          paddingVertical: 0,
          marginHorizontal: 4,
        },
        tabBarStyle: {
          position: "absolute",
          bottom: tabBarBottom,
          marginHorizontal: 40,
          height: 62,
          borderRadius: 31,
          paddingHorizontal: 20,
          backgroundColor: isDarkMode ? "#1C1C1E" : "#FFFFFF",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDarkMode ? 0.4 : 0.14,
          shadowRadius: 24,
          elevation: 16,
          borderTopWidth: 0,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={90}
              tint={isDarkMode ? "dark" : "light"}
              style={[StyleSheet.absoluteFill, { borderRadius: 31, overflow: "hidden" }]}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: 31,
                  backgroundColor: isDarkMode ? "#1C1C1E" : "#FFFFFF",
                },
              ]}
            />
          ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "grid" : "grid-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          tabBarBadge: totalItems > 0 ? totalItems : undefined,
          tabBarBadgeStyle: {
            backgroundColor: Colors.primary,
            fontSize: 10,
            fontFamily: "Poppins_700Bold",
            minWidth: 18,
            height: 18,
            borderRadius: 9,
          },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "bag" : "bag-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "receipt" : "receipt-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
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
