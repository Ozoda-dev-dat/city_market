import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Linking,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/ProductsContext";
import { formatPrice } from "@/constants/data";

export default function CourierOrderDetail() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { orders, updateOrderStatus } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const order = orders.find(o => o.id === id);

  if (!order) return null;

  const handleAction = () => {
    if (order.status === "preparing") {
      updateOrderStatus(order.id, "transit");
    } else if (order.status === "transit") {
      updateOrderStatus(order.id, "delivered");
      router.back();
    }
  };

  const openMaps = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=${order.address}`,
      android: `geo:0,0?q=${order.address}`,
      web: `https://www.google.com/maps/search/?api=1&query=${order.address}`,
    });
    if (url) Linking.openURL(url);
  };

  const buttonConfig = {
    preparing: { label: "Olishni tasdiqlash", icon: "bicycle", color: Colors.primary },
    transit: { label: "Yetkazilganligini tasdiqlash", icon: "checkmark-circle", color: "#10B981" },
    delivered: { label: "Yetkazilgan", icon: "checkmark", color: Colors.textMuted, disabled: true },
    pending: { label: "Tayyorlanmoqda...", icon: "time", color: Colors.textMuted, disabled: true },
  };

  const config = buttonConfig[order.status as keyof typeof buttonConfig];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Buyurtma ma'lumoti</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Mijoz ma'lumotlari</Text>
          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="person-outline" size={20} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.infoLabel}>Mijoz</Text>
              <Text style={styles.infoValue}>{order.customerName}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="call-outline" size={20} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.infoLabel}>Telefon</Text>
              <Text style={styles.infoValue}>{order.phoneNumber}</Text>
            </View>
          </View>
          <Pressable style={styles.infoRow} onPress={openMaps}>
            <View style={styles.iconCircle}>
              <Ionicons name="location-outline" size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Manzil</Text>
              <Text style={styles.infoValue}>{order.address}</Text>
            </View>
            <Ionicons name="map-outline" size={20} color={Colors.primary} />
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Mahsulotlar</Text>
          {(order.items as any[]).map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQty}>x{item.qty}</Text>
              <Text style={styles.itemPrice}>{formatPrice(item.price * item.qty)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Jami:</Text>
            <Text style={styles.totalValue}>{formatPrice(order.total)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Pressable
          style={[styles.mainBtn, { backgroundColor: config.color }, config.disabled && styles.disabledBtn]}
          onPress={handleAction}
          disabled={config.disabled}
        >
          <Ionicons name={config.icon as any} size={20} color="#fff" />
          <Text style={styles.mainBtnText}>{config.label}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.card, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Poppins_700Bold", fontSize: 18, color: Colors.text },
  content: { padding: 16, gap: 16 },
  card: { backgroundColor: Colors.card, borderRadius: 20, padding: 16, gap: 16 },
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: 16, color: Colors.text, marginBottom: 4 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center" },
  infoLabel: { fontFamily: "Poppins_400Regular", fontSize: 12, color: Colors.textSecondary },
  infoValue: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: Colors.text },
  itemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemName: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 14, color: Colors.text },
  itemQty: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: Colors.textSecondary, marginHorizontal: 12 },
  itemPrice: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: Colors.text, width: 80, textAlign: "right" },
  divider: { height: 1, backgroundColor: Colors.divider },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontFamily: "Poppins_700Bold", fontSize: 16, color: Colors.text },
  totalValue: { fontFamily: "Poppins_700Bold", fontSize: 18, color: Colors.primary },
  footer: { padding: 16, backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  mainBtn: { height: 56, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  mainBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: "#fff" },
  disabledBtn: { opacity: 0.6 },
});
