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
import { useCartActions } from "@/context/StateContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { formatPrice } from "@/constants/data";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import getColors from "@/constants/colors";

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const { items, totalAmount, totalItems, updateQuantity, removeFromCart, clearCart, createOrder } = useCartActions();
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const styles = getStyles(isDarkMode);
  const [promo, setPromo] = useState("");
  const [discount, setDiscount] = useState(0);
  const [ordered, setOrdered] = useState(false);

  const delivery = totalAmount > 100000 ? 0 : 15000;
  const finalTotal = Math.max(0, totalAmount + delivery - (totalAmount * discount / 100));

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
    
    // Get user location from storage if available
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
      await createOrder(data);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setOrdered(true);
      clearCart();
      router.push(`/order/${orderId}`);
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
          <Pressable style={styles.promoBtn} onPress={applyPromo}><Text style={{ color: "#fff" }}>Qo&apos;llash</Text></Pressable>
        </View>
        <View style={styles.summary}>
          <Text>Jami: {formatPrice(totalAmount)}</Text>
          <Text>Yetkazib berish: {formatPrice(delivery)}</Text>
          {discount > 0 && <Text style={{ color: Colors.primary }}>Chegirma: {discount}%</Text>}
          <Text style={styles.finalTotal}>To&apos;lov: {formatPrice(finalTotal)}</Text>
        </View>
        <Text style={{ fontSize: 12, color: Colors.textSecondary, textAlign: 'center', marginTop: 10 }}>
          Buyurtma kuryerga biriktirilguniga qadar bekor qilinishi mumkin.
        </Text>
        <Pressable style={styles.checkoutBtn} onPress={handleCheckout}><Text style={{ color: "#fff", fontWeight: "bold" }}>Buyurtma berish</Text></Pressable>
      </ScrollView>
    </View>
  );
}

const getStyles = (isDarkMode: boolean) => {
  const Colors = getColors(isDarkMode);
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    title: { fontSize: 24, fontWeight: "bold", padding: 16, color: Colors.text },
    card: { backgroundColor: Colors.card, padding: 16, borderRadius: 12, marginBottom: 10, flexDirection: "row", justifyContent: "space-between" },
    promoBox: { flexDirection: "row", gap: 10, marginVertical: 16 },
    promoInput: { flex: 1, backgroundColor: Colors.card, padding: 12, borderRadius: 12, color: Colors.text },
    promoBtn: { backgroundColor: Colors.primary, padding: 12, borderRadius: 12 },
    summary: { gap: 8, padding: 16, backgroundColor: Colors.card, borderRadius: 12 },
    finalTotal: { fontSize: 18, fontWeight: "bold", borderTopWidth: 1, paddingTop: 8, marginTop: 8, color: Colors.text },
    checkoutBtn: { backgroundColor: Colors.primary, padding: 18, borderRadius: 16, alignItems: "center", marginTop: 20 },
    successContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20 },
    successTitle: { fontSize: 24, fontWeight: "bold", color: Colors.text },
    successBtn: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12 },
  });
};
