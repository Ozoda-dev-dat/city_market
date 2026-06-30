import { Tabs, Redirect } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
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
              ? "rgba(18,24,36,0.94)"
              : "rgba(255,255,255,0.93)",
            borderRadius: 32,
          },
        ]}
      />
    );
  }
  return (
    <BlurView
      intensity={isDarkMode ? 60 : 72}
      tint={isDarkMode ? "dark" : "light"}
      style={[StyleSheet.absoluteFill, { borderRadius: 32, overflow: "hidden" }]}
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

  const tabBottom = isWeb ? 16 : Math.max(insets.bottom, 6) + 12;
  const tabHeight = 62;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: isDarkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)",
        tabBarLabelStyle: {
          fontFamily: "Poppins_600SemiBold",
          fontSize: 10,
          marginTop: -2,
        },
        tabBarItemStyle: {
          paddingVertical: 6,
        },
        tabBarStyle: {
          position: "absolute",
          bottom: tabBottom,
          left: 16,
          right: 16,
          height: tabHeight,
          borderRadius: 32,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: isDarkMode
            ? "rgba(255,255,255,0.1)"
            : "rgba(255,255,255,0.92)",
          backgroundColor: "transparent",
          shadowColor: isDarkMode ? "#000" : "#16A34A",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: isDarkMode ? 0.45 : 0.14,
          shadowRadius: 28,
          elevation: 24,
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
        options={{ href: null }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          tabBarLabel: t("tab_cart"),
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
