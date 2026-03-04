import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Platform, Alert, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { formatPrice } from "@/constants/data";
import { useApp } from "@/context/ProductsContext";
import { useAuth } from "@/context/AuthContext";

export default function OrderTrackingScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { orders } = useApp();
  const order = orders.find(o => o.id === id);

  if (!order) return null;

  const steps = [
    { key: "pending", label: "Qabul qilindi", icon: "checkmark-circle" },
    { key: "preparing", label: "Tayyorlanmoqda", icon: "restaurant" },
    { key: "transit", label: "Yo'lda", icon: "bicycle" },
    { key: "delivered", label: "Yetkazildi", icon: "home" },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()}><Ionicons name="arrow-back" size={24} /></Pressable>
        <Text style={styles.title}>Buyurtma holati</Text>
      </View>
      
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>{order.id}</Text>
          <Text style={styles.orderTotal}>{formatPrice(order.total)}</Text>
        </View>

        {isCancelled ? (
          <View style={styles.cancelledBox}>
            <Ionicons name="close-circle" size={48} color={Colors.error} />
            <Text style={styles.cancelledText}>Buyurtma bekor qilingan</Text>
          </View>
        ) : (
          <View style={styles.trackingBox}>
            {steps.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              return (
                <View key={step.key} style={styles.stepRow}>
                  <View style={styles.stepLeft}>
                    <View style={[styles.dot, isCompleted && { backgroundColor: Colors.primary }]}>
                      {isCompleted && <Ionicons name="checkmark" size={12} color="#fff" />}
                    </View>
                    {index < steps.length - 1 && <View style={[styles.line, index < currentStepIndex && { backgroundColor: Colors.primary }]} />}
                  </View>
                  <View style={styles.stepRight}>
                    <Text style={[styles.stepLabel, isCompleted && { color: Colors.text, fontWeight: 'bold' }]}>{step.label}</Text>
                    {isCurrent && <Text style={styles.currentHint}>Hozirgi holat</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Yetkazib berish manzili</Text>
          <Text style={styles.addressText}>{order.address}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", padding: 16, gap: 16 },
  title: { fontFamily: "Poppins_700Bold", fontSize: 18 },
  orderInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  orderId: { fontFamily: 'Poppins_700Bold', fontSize: 20 },
  orderTotal: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: Colors.primary },
  cancelledBox: { alignItems: 'center', padding: 40, backgroundColor: '#FEF2F2', borderRadius: 20 },
  cancelledText: { fontFamily: 'Poppins_700Bold', color: Colors.error, marginTop: 10 },
  trackingBox: { paddingLeft: 10 },
  stepRow: { flexDirection: 'row', gap: 20, height: 70 },
  stepLeft: { alignItems: 'center' },
  dot: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.divider, alignItems: 'center', justifyContent: 'center' },
  line: { width: 2, flex: 1, backgroundColor: Colors.divider },
  stepRight: { paddingTop: 2 },
  stepLabel: { fontFamily: 'Poppins_500Medium', color: Colors.textMuted, fontSize: 16 },
  currentHint: { color: Colors.primary, fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  detailsCard: { backgroundColor: Colors.card, padding: 20, borderRadius: 20, marginTop: 20 },
  cardTitle: { fontFamily: 'Poppins_700Bold', fontSize: 16, marginBottom: 8 },
  addressText: { color: Colors.textSecondary, fontFamily: 'Poppins_400Regular' },
});
