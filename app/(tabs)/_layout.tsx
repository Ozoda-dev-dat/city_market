import { Tabs, Redirect } from "expo-router";
import { Platform, StyleSheet, View, Text } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import getColors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "@/lib/I18nProvider";

function GlassTabBar({ isDarkMode }: { isDarkMode: boolean }) {
  if (Platform.OS === "web") {
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDarkMode
              ? "rgba(18,24,36,0.96)"
              : "rgba(255,255,255,0.96)",
            borderRadius: 28,
          },
        ]}
      />
    );
  }
  return (
    <BlurView
      intensity={isDarkMode ? 70 : 80}
      tint={isDarkMode ? "dark" : "light"}
      style={[StyleSheet.absoluteFill, { borderRadius: 28, overflow: "hidden" }]}
    />
  );
}

function ClassicTabLayout() {
  const { totalItems } = useCart();
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { t } = useTranslation();

  const tabBottom = isWeb ? 14 : Math.max(insets.bottom, 4) + 10;
  const tabHeight = 64;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#16A34A",
        tabBarInactiveTintColor: isDarkMode ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.28)",
        tabBarLabelStyle: {
          fontFamily: "Poppins_600SemiBold",
          fontSize: 10,
          marginTop: -2,
          marginBottom: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarStyle: {
          position: "absolute",
          bottom: tabBottom,
          left: 12,
          right: 12,
          height: tabHeight,
          borderRadius: 28,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: isDarkMode
            ? "rgba(255,255,255,0.09)"
            : "rgba(0,0,0,0.06)",
          backgroundColor: "transparent",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDarkMode ? 0.5 : 0.12,
          shadowRadius: 24,
          elevation: 20,
        },
        tabBarBackground: () => <GlassTabBar isDarkMode={isDarkMode} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: t("tab_home"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          tabBarLabel: t("tab_browse"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "search" : "search-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          tabBarLabel: t("tab_cart"),
          tabBarBadge: totalItems > 0 ? totalItems : undefined,
          tabBarBadgeStyle: {
            backgroundColor: "#16A34A",
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
        options={{
          tabBarLabel: t("tab_orders") ?? "Buyurtmalar",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "receipt" : "receipt-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: t("tab_profile"),
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
