import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import getColors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";

function useUnreadOrderNotifications() {
  const { data } = useQuery({
    queryKey: ["/api/notifications", "store"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/notifications");
      return res.json();
    },
    refetchInterval: 15000,
  });
  const notifications: any[] = Array.isArray(data) ? data : (data?.notifications ?? []);
  return notifications.filter((n: any) => !n.isRead && n.type === "new_order").length;
}

export default function StoreLayout() {
  const { isDarkMode } = useTheme();
  const { user, isLoading } = useAuth();
  const Colors = getColors(isDarkMode);
  const unread = useUnreadOrderNotifications();

  if (isLoading) return null;

  if (!user) return <Redirect href="/auth" />;

  if (user.role !== "store") {
    return (
      <View style={[styles.container, { backgroundColor: Colors.background }]}>
        <View style={styles.content}>
          <Ionicons name="lock-closed" size={64} color={Colors.error} />
          <Text style={[styles.title, { color: Colors.text }]}>Ruxsat yo'q</Text>
          <Text style={[styles.message, { color: Colors.textSecondary }]}>
            Bu sahifaga faqat do'kon egalari kirishi mumkin
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: "Poppins_500Medium",
          fontSize: 11,
          marginTop: -2,
        },
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopWidth: 1,
          borderTopColor: Colors.divider,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Bosh sahifa",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Mahsulotlar",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Buyurtmalar",
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarBadgeStyle: { backgroundColor: Colors.primary, fontSize: 10 },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { alignItems: "center", paddingHorizontal: 32 },
  title: { fontSize: 24, fontWeight: "bold", marginTop: 16, marginBottom: 8, textAlign: "center" },
  message: { fontSize: 16, textAlign: "center", lineHeight: 24 },
});
