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
  Image,
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

  const topPad = Platform.OS === "web" ? 67 : insets.top;
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
    } catch (e) {}

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

  const isValidImage = (uri: string) =>
    uri && (uri.startsWith("http") || uri.startsWith("data:image"));

  if (items.length === 0) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: topPad }]}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="bag-outline" size={48} color={Colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>Savat bo'sh</Text>
        <Text style={styles.emptySubtitle}>Mahsulotlarni katalogdan qo'shing</Text>
        <Pressable style={styles.shopBtn} onPress={() => router.push("/(tabs)/catalog")}>
          <Text style={styles.shopBtnText}>Xarid qilish</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Savat</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{totalItems}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.itemsCard}>
          {items.map((item, index) => (
            <React.Fragment key={item.product.id}>
              <View style={styles.cartItem}>
                <View style={styles.itemImageBox}>
                  {isValidImage(item.product.image) ? (
                    <Image
                      source={{ uri: item.product.image }}
                      style={styles.itemImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.itemImage, styles.itemImageFallback]}>
                      <Text style={styles.itemImageLetter}>
                        {item.product.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
                  <Text style={styles.itemPrice}>{formatPrice(item.product.price)}</Text>
                </View>

                <View style={styles.itemControls}>
                  <Pressable
                    style={styles.qtyBtn}
                    onPress={() => {
                      if (item.quantity === 1) removeFromCart(item.product.id);
                      else updateQuantity(item.product.id, item.quantity - 1);
                    }}
                  >
                    <Ionicons name={item.quantity === 1 ? "trash-outline" : "remove"} size={16} color={Colors.primary} />
                  </Pressable>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <Pressable
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                  >
                    <Ionicons name="add" size={16} color={Colors.primary} />
                  </Pressable>
                </View>
              </View>
              {index < items.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        <View style={styles.promoRow}>
          <TextInput
            style={styles.promoInput}
            placeholder="Promokod kiriting"
            placeholderTextColor={Colors.textMuted}
            value={promo}
            onChangeText={setPromo}
          />
          <Pressable style={styles.promoBtn} onPress={applyPromo}>
            <Text style={styles.promoBtnText}>Qo'llash</Text>
          </Pressable>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Mahsulotlar</Text>
            <Text style={styles.summaryValue}>{formatPrice(totalPrice)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Yetkazib berish</Text>
            <Text style={[styles.summaryValue, delivery === 0 && { color: Colors.primary }]}>
              {delivery === 0 ? "Bepul" : formatPrice(delivery)}
            </Text>
          </View>
          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: Colors.error }]}>Chegirma</Text>
              <Text style={[styles.summaryValue, { color: Colors.error }]}>-{discount}%</Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Jami</Text>
            <Text style={styles.totalValue}>{formatPrice(finalTotal)}</Text>
          </View>
        </View>

        {delivery === 0 && (
          <View style={styles.freeDeliveryBanner}>
            <Ionicons name="bicycle-outline" size={16} color={Colors.primary} />
            <Text style={styles.freeDeliveryText}>Bepul yetkazib berish</Text>
          </View>
        )}

        <Text style={styles.note}>
          Buyurtma kuryerga biriktirilguniga qadar bekor qilinishi mumkin.
        </Text>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Platform.OS === "web" ? 24 : insets.bottom + 12 }]}>
        <Pressable style={styles.checkoutBtn} onPress={handleCheckout}>
          <Text style={styles.checkoutText}>Buyurtma berish</Text>
          <View style={styles.checkoutBadge}>
            <Text style={styles.checkoutBadgeText}>{formatPrice(finalTotal)}</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const getStyles = (isDarkMode: boolean) => {
  const Colors = getColors(isDarkMode);
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    emptyContainer: {
      flex: 1,
      backgroundColor: Colors.background,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      paddingHorizontal: 32,
    },
    emptyIconWrap: {
      width: 88,
      height: 88,
      borderRadius: 28,
      backgroundColor: Colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    emptyTitle: {
      fontFamily: "Poppins_700Bold",
      fontSize: 22,
      color: Colors.text,
    },
    emptySubtitle: {
      fontFamily: "Poppins_400Regular",
      fontSize: 15,
      color: Colors.textSecondary,
      textAlign: "center",
    },
    shopBtn: {
      backgroundColor: Colors.primary,
      paddingHorizontal: 32,
      paddingVertical: 14,
      borderRadius: 16,
      marginTop: 8,
    },
    shopBtnText: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 16,
      color: "#fff",
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    title: {
      fontFamily: "Poppins_700Bold",
      fontSize: 26,
      color: Colors.text,
    },
    countBadge: {
      backgroundColor: Colors.primary,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    countText: {
      fontFamily: "Poppins_700Bold",
      fontSize: 13,
      color: "#fff",
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 24,
      gap: 12,
    },
    itemsCard: {
      backgroundColor: Colors.card,
      borderRadius: 20,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDarkMode ? 0.3 : 0.07,
      shadowRadius: 12,
      elevation: 4,
    },
    cartItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      gap: 12,
    },
    itemImageBox: {
      width: 64,
      height: 64,
      borderRadius: 14,
      overflow: "hidden",
      backgroundColor: isDarkMode ? "#2C2C2E" : "#F5F6F5",
    },
    itemImage: {
      width: "100%",
      height: "100%",
    },
    itemImageFallback: {
      backgroundColor: "#DCFCE7",
      alignItems: "center",
      justifyContent: "center",
    },
    itemImageLetter: {
      fontFamily: "Poppins_700Bold",
      fontSize: 24,
      color: "#16A34A",
    },
    itemInfo: {
      flex: 1,
      gap: 4,
    },
    itemName: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 14,
      color: Colors.text,
      lineHeight: 20,
    },
    itemPrice: {
      fontFamily: "Poppins_700Bold",
      fontSize: 14,
      color: Colors.primary,
    },
    itemControls: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDarkMode ? "#2C2C2E" : "#F4F6F4",
      borderRadius: 12,
      padding: 3,
      gap: 4,
    },
    qtyBtn: {
      width: 30,
      height: 30,
      backgroundColor: Colors.card,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
    },
    qtyText: {
      fontFamily: "Poppins_700Bold",
      fontSize: 14,
      color: Colors.text,
      minWidth: 22,
      textAlign: "center",
    },
    divider: {
      height: 1,
      backgroundColor: Colors.divider,
      marginHorizontal: 14,
    },
    promoRow: {
      flexDirection: "row",
      gap: 10,
    },
    promoInput: {
      flex: 1,
      backgroundColor: Colors.card,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 13,
      fontFamily: "Poppins_400Regular",
      fontSize: 14,
      color: Colors.text,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    promoBtn: {
      backgroundColor: Colors.primary,
      borderRadius: 14,
      paddingHorizontal: 18,
      justifyContent: "center",
    },
    promoBtnText: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 14,
      color: "#fff",
    },
    summaryCard: {
      backgroundColor: Colors.card,
      borderRadius: 20,
      padding: 18,
      gap: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDarkMode ? 0.3 : 0.07,
      shadowRadius: 12,
      elevation: 4,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    summaryLabel: {
      fontFamily: "Poppins_400Regular",
      fontSize: 15,
      color: Colors.textSecondary,
    },
    summaryValue: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 15,
      color: Colors.text,
    },
    totalLabel: {
      fontFamily: "Poppins_700Bold",
      fontSize: 17,
      color: Colors.text,
    },
    totalValue: {
      fontFamily: "Poppins_700Bold",
      fontSize: 18,
      color: Colors.primary,
    },
    freeDeliveryBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: Colors.primaryLight,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    freeDeliveryText: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 13,
      color: Colors.primary,
    },
    note: {
      fontFamily: "Poppins_400Regular",
      fontSize: 12,
      color: Colors.textMuted,
      textAlign: "center",
      lineHeight: 18,
    },
    footer: {
      paddingHorizontal: 16,
      paddingTop: 12,
      backgroundColor: Colors.background,
      borderTopWidth: 1,
      borderTopColor: Colors.divider,
    },
    checkoutBtn: {
      backgroundColor: Colors.primary,
      borderRadius: 18,
      paddingVertical: 16,
      paddingHorizontal: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 8,
    },
    checkoutText: {
      fontFamily: "Poppins_700Bold",
      fontSize: 16,
      color: "#fff",
    },
    checkoutBadge: {
      backgroundColor: "rgba(255,255,255,0.2)",
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 5,
    },
    checkoutBadgeText: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 14,
      color: "#fff",
    },
  });
};
