import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Platform, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useCart } from "@/context/CartContext";
import { useApp } from "@/context/ProductsContext";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/constants/data";
import { router } from "expo-router";
import { apiRequest } from "@/lib/query-client";

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const { items, clearCart, totalPrice, totalItems, updateQuantity, removeFromCart } = useCart();
  const { createOrder } = useApp();
  const { user } = useAuth();
  const [promo, setPromo] = useState("");
  const [discount, setDiscount] = useState(0);
  const [ordered, setOrdered] = useState(false);

  const delivery = totalPrice > 100000 ? 0 : 15000;
  const finalTotal = Math.max(0, totalPrice + delivery - (totalPrice * discount / 100));

  const applyPromo = async () => {
    try {
      const res = await apiRequest("GET", `/api/promo-codes/${promo}`);
      const data = await res.json();
      setDiscount(data.discountPercent);
      Alert.alert("Muvaffaqiyat", `${data.discountPercent}% chegirma qo'llanildi`);
    } catch (e) {
      Alert.alert("Xatolik", "Promokod noto'g'ri");
    }
  };

  const handleCheckout = async () => {
    const data = {
      customerId: user?.id,
      customerName: user?.name || "Mehmon",
      phoneNumber: user?.phoneNumber || "",
      address: "Toshkent shahri",
      total: finalTotal,
      discount: discount,
      items: items.map(i => ({ name: i.product.name, qty: i.quantity, price: i.product.price })),
    };

    try {
      await createOrder(data);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setOrdered(true);
      clearCart();
    } catch (e) {
      Alert.alert("Xatolik", "Buyurtma berishda xatolik yuz berdi");
    }
  };

  if (ordered) return (
    <View style={styles.successContainer}>
      <Ionicons name="checkmark-circle" size={80} color={Colors.primary} />
      <Text style={styles.successTitle}>Buyurtma qabul qilindi!</Text>
      <Pressable style={styles.successBtn} onPress={() => { setOrdered(false); router.push("/") }}>
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Asosiyga qaytish</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Savat</Text>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {items.map(item => (
          <View key={item.product.id} style={styles.card}>
            <Text>{item.product.name}</Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable onPress={() => updateQuantity(item.product.id, item.quantity - 1)}><Ionicons name="remove-circle" size={24} color={Colors.primary} /></Pressable>
              <Text>{item.quantity}</Text>
              <Pressable onPress={() => updateQuantity(item.product.id, item.quantity + 1)}><Ionicons name="add-circle" size={24} color={Colors.primary} /></Pressable>
            </View>
          </View>
        ))}
        <View style={styles.promoBox}>
          <TextInput style={styles.promoInput} placeholder="Promokod" value={promo} onChangeText={setPromo} />
          <Pressable style={styles.promoBtn} onPress={applyPromo}><Text style={{ color: "#fff" }}>Qo'llash</Text></Pressable>
        </View>
        <View style={styles.summary}>
          <Text>Jami: {formatPrice(totalPrice)}</Text>
          <Text>Yetkazib berish: {formatPrice(delivery)}</Text>
          {discount > 0 && <Text style={{ color: Colors.primary }}>Chegirma: {discount}%</Text>}
          <Text style={styles.finalTotal}>To'lov: {formatPrice(finalTotal)}</Text>
        </View>
        <Pressable style={styles.checkoutBtn} onPress={handleCheckout}><Text style={{ color: "#fff", fontWeight: "bold" }}>Buyurtma berish</Text></Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { fontSize: 24, fontWeight: "bold", padding: 16 },
  card: { backgroundColor: Colors.card, padding: 16, borderRadius: 12, marginBottom: 10, flexDirection: "row", justifyContent: "space-between" },
  promoBox: { flexDirection: "row", gap: 10, marginVertical: 16 },
  promoInput: { flex: 1, backgroundColor: Colors.card, padding: 12, borderRadius: 12 },
  promoBtn: { backgroundColor: Colors.primary, padding: 12, borderRadius: 12 },
  summary: { gap: 8, padding: 16, backgroundColor: Colors.card, borderRadius: 12 },
  finalTotal: { fontSize: 18, fontWeight: "bold", borderTopWidth: 1, paddingTop: 8, marginTop: 8 },
  checkoutBtn: { backgroundColor: Colors.primary, padding: 18, borderRadius: 16, alignItems: "center", marginTop: 20 },
  successContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20 },
  successTitle: { fontSize: 24, fontWeight: "bold" },
  successBtn: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12 },
});
