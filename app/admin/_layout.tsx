import { Tabs, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Colors from "@/constants/colors";
import getColors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";

export default function AdminLayout() {
  const { isDarkMode } = useTheme();
  const { user, isLoading } = useAuth();
  const Colors = getColors(isDarkMode);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/auth");
    }
  }, [user, isLoading]);

  if (isLoading) return null;

  // Protect admin routes - only allow admin users
  if (!user || user.role !== "admin") {
    return (
      <View style={[styles.container, { backgroundColor: Colors.background }]}>
        <View style={styles.content}>
          <Ionicons name="lock-closed" size={64} color={Colors.error} />
          <Text style={[styles.title, { color: Colors.text }]}>Ruxsat yo'q</Text>
          <Text style={[styles.message, { color: Colors.textSecondary }]}>
            Bu sahifaga faqat adminlar kirishi mumkin
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
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Sozlamalar",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: "Moliya",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cash" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="products" options={{ href: null }} />
      <Tabs.Screen name="add-product" options={{ href: null }} />
      <Tabs.Screen name="orders" options={{ href: null }} />
      <Tabs.Screen name="categories" options={{ href: null }} />
      <Tabs.Screen name="add-courier" options={{ href: null }} />
      <Tabs.Screen name="promo-codes" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
