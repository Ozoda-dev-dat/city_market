import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { apiRequest, queryClient } from "@/lib/query-client";
import { formatPrice } from "@/constants/data";
import * as Haptics from "expo-haptics";
import getColors from "@/constants/colors";

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const { items, totalPrice, totalItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const styles = getStyles(isDarkMode);
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
    const orderId = `order-${Date.now()}`;

    let userLocation = null;
    try {
      const locationData = await AsyncStorage.getItem('@user_location');
      if (locationData) {
        userLocation = JSON.parse(locationData);
      }
    } catch (e) {
      // Ignore location errors
    }

    const data = {
      id: orderId,
      customerId: user?.id,
      customerName: user?.name || "Mehmon",
      phoneNumber: user?.phoneNumber || "",
      address: userLocation?.address || "Toshkent shahri",
      latitude: userLocation?.latitude || null,
      longitude: userLocation?.longitude || null,
      total: finalTotal,
      discount: discount,
      items: items.map(i => ({ name: i.product.name, qty: i.quantity, price: i.product.price })),
    };

    try {
      const res = await apiRequest("POST", "/api/orders", data);
      const newOrder = await res.json();
      await queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/orders/my"] });
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setOrdered(true);
      clearCart();
      router.push(`/order/${newOrder.id}`);
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

  if (items.length === 0) return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Savat</Text>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
        <Ionicons name="cart-outline" size={64} color={Colors.textSecondary} />
        <Text style={{ color: Colors.textSecondary, fontSize: 16 }}>Savat bo'sh</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Savat ({totalItems})</Text>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {items.map(item => (
          <View key={item.product.id} style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: Colors.text, fontWeight: "600" }}>{item.product.name}</Text>
              <Text style={{ color: Colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                {formatPrice(item.product.price)} × {item.quantity}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Pressable onPress={() => updateQuantity(item.product.id, item.quantity - 1)}>
                <Ionicons name="remove-circle" size={28} color={Colors.primary} />
              </Pressable>
              <Text style={{ color: Colors.text, fontSize: 16, fontWeight: "600", minWidth: 24, textAlign: "center" }}>{item.quantity}</Text>
              <Pressable onPress={() => updateQuantity(item.product.id, item.quantity + 1)}>
                <Ionicons name="add-circle" size={28} color={Colors.primary} />
              </Pressable>
              <Pressable onPress={() => removeFromCart(item.product.id)}>
                <Ionicons name="trash-outline" size={22} color="#ff5252" />
              </Pressable>
            </View>
          </View>
        ))}

        <View style={styles.promoBox}>
          <TextInput
            style={styles.promoInput}
            placeholder="Promokod"
            placeholderTextColor={Colors.textSecondary}
            value={promo}
            onChangeText={setPromo}
          />
          <Pressable style={styles.promoBtn} onPress={applyPromo}>
            <Text style={{ color: "#fff" }}>Qo'llash</Text>
          </Pressable>
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={{ color: Colors.textSecondary }}>Mahsulotlar:</Text>
            <Text style={{ color: Colors.text }}>{formatPrice(totalPrice)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={{ color: Colors.textSecondary }}>Yetkazib berish:</Text>
            <Text style={{ color: Colors.text }}>{delivery === 0 ? "Bepul" : formatPrice(delivery)}</Text>
          </View>
          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={{ color: Colors.primary }}>Chegirma:</Text>
              <Text style={{ color: Colors.primary }}>-{discount}%</Text>
            </View>
          )}
          <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10, marginTop: 6 }]}>
            <Text style={[styles.finalTotal, { color: Colors.text }]}>Jami to'lov:</Text>
            <Text style={[styles.finalTotal, { color: Colors.primary }]}>{formatPrice(finalTotal)}</Text>
          </View>
        </View>

        <Text style={{ fontSize: 12, color: Colors.textSecondary, textAlign: 'center', marginTop: 10 }}>
          Buyurtma kuryerga biriktirilguniga qadar bekor qilinishi mumkin.
        </Text>
        <Pressable style={styles.checkoutBtn} onPress={handleCheckout}>
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>Buyurtma berish</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const getStyles = (isDarkMode: boolean) => {
  const Colors = getColors(isDarkMode);
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    title: { fontSize: 24, fontWeight: "bold", padding: 16, color: Colors.text },
    card: {
      backgroundColor: Colors.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    promoBox: { flexDirection: "row", gap: 10, marginVertical: 16 },
    promoInput: {
      flex: 1,
      backgroundColor: Colors.card,
      padding: 12,
      borderRadius: 12,
      color: Colors.text,
    },
    promoBtn: { backgroundColor: Colors.primary, padding: 12, borderRadius: 12, justifyContent: "center" },
    summary: { gap: 8, padding: 16, backgroundColor: Colors.card, borderRadius: 12 },
    summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    finalTotal: { fontSize: 18, fontWeight: "bold" },
    checkoutBtn: {
      backgroundColor: Colors.primary,
      padding: 18,
      borderRadius: 16,
      alignItems: "center",
      marginTop: 20,
      marginBottom: 20,
    },
    successContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20 },
    successTitle: { fontSize: 24, fontWeight: "bold", color: Colors.text },
    successBtn: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12 },
  });
};
