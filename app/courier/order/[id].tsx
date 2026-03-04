import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Platform, Linking } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useApp } from "@/context/ProductsContext";
import { formatPrice } from "@/constants/data";

export default function CourierOrderDetail() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { orders, updateOrderStatus } = useApp();
  const order = orders.find(o => o.id === id);

  if (!order) return null;

  const handleAction = async () => {
    const statusMap: any = { preparing: "transit", transit: "delivered" };
    const next = statusMap[order.status];
    if (!next) return;

    try {
      await updateOrderStatus(order.id, next);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Removed router.back() to allow viewing delivered state or manual navigation
    } catch (e) {
      Alert.alert("Xatolik", "Statusni yangilashda xatolik yuz berdi");
    }
  };

  const buttonConfig: any = {
    preparing: { label: "Olishni tasdiqlash", icon: "bicycle", color: Colors.primary },
    transit: { label: "Yetkazilganligini tasdiqlash", icon: "checkmark-circle", color: "#10B981" },
    delivered: { label: "Yetkazilgan", icon: "checkmark", color: Colors.textMuted, disabled: true },
    pending: { label: "Tayyorlanmoqda...", icon: "time", color: Colors.textMuted, disabled: true },
  };

  const config = buttonConfig[order.status] || buttonConfig.pending;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()}><Ionicons name="arrow-back" size={24} /></Pressable>
        <Text style={styles.title}>Buyurtma ma'lumoti</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📍 {order.address}</Text>
          <Text style={styles.infoValue}>📞 {order.phoneNumber}</Text>
          <Text style={styles.infoValue}>👤 {order.customerName}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Mahsulotlar</Text>
          {(order.items as any[]).map((item, i) => (
            <Text key={i} style={styles.infoValue}>{item.name} x{item.qty}</Text>
          ))}
          <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Jami: {formatPrice(order.total)}</Text>
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Pressable style={[styles.mainBtn, { backgroundColor: config.color }]} onPress={handleAction} disabled={config.disabled}>
          <Ionicons name={config.icon} size={20} color="#fff" />
          <Text style={styles.mainBtnText}>{config.label}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", padding: 16, gap: 16 },
  title: { fontFamily: "Poppins_700Bold", fontSize: 18 },
  card: { backgroundColor: Colors.card, borderRadius: 20, padding: 16 },
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: 16, marginBottom: 8 },
  infoValue: { fontFamily: "Poppins_400Regular", color: Colors.textSecondary, marginBottom: 4 },
  footer: { padding: 16 },
  mainBtn: { height: 56, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  mainBtnText: { fontFamily: "Poppins_700Bold", color: "#fff" },
});
