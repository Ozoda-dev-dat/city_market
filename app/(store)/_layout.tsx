import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import getColors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import { useStoreRealtime } from "@/hooks/useStoreRealtime";
import { wsManager } from "@/lib/websocket";

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

function NewOrderBanner() {
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const [visible, setVisible] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(-90)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.timing(slideAnim, { toValue: -90, useNativeDriver: true, duration: 280 }).start(() => setVisible(false));
  };

  useEffect(() => {
    const off = wsManager.on("new-order", (data: any) => {
      const id = data?.orderId ? String(data.orderId).slice(-6).toUpperCase() : null;
      setOrderId(id);
      if (timerRef.current) clearTimeout(timerRef.current);
      setVisible(true);
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 14 }).start();
      timerRef.current = setTimeout(dismiss, 5000);
    });
    return () => { off(); if (timerRef.current) clearTimeout(timerRef.current); };
  }, [slideAnim]);

  if (!visible) return null;

  return (
    <Animated.View style={[bannerStyles.banner, { backgroundColor: Colors.primary, transform: [{ translateY: slideAnim }] }]}>
      <Pressable style={bannerStyles.row} onPress={() => { dismiss(); }}>
        <View style={bannerStyles.iconBox}>
          <Ionicons name="receipt" size={20} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={bannerStyles.title}>
            Yangi buyurtma{orderId ? ` #${orderId}` : ""}!
          </Text>
          <Text style={bannerStyles.sub}>Buyurtmalar bo'limini tekshiring</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
      </Pressable>
    </Animated.View>
  );
}

const bannerStyles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontFamily: "Poppins_700Bold", fontSize: 14, color: "#fff" },
  sub: { fontFamily: "Poppins_400Regular", fontSize: 12, color: "rgba(255,255,255,0.85)" },
});

export default function StoreLayout() {
  const { isDarkMode } = useTheme();
  const { user, isLoading } = useAuth();
  const Colors = getColors(isDarkMode);
  const unread = useUnreadOrderNotifications();
  useStoreRealtime();

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
    <>
    <NewOrderBanner />
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
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { alignItems: "center", paddingHorizontal: 32 },
  title: { fontSize: 24, fontWeight: "bold", marginTop: 16, marginBottom: 8, textAlign: "center" },
  message: { fontSize: 16, textAlign: "center", lineHeight: 24 },
});
