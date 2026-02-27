import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/constants/data";
import { router } from "expo-router";

function CartItemRow({ item, onRemove, onQtyChange }: {
  item: ReturnType<typeof useCart>["items"][0];
  onRemove: () => void;
  onQtyChange: (qty: number) => void;
}) {
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  const handleRemove = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    opacity.value = withTiming(0, { duration: 200 });
    translateX.value = withTiming(-60, { duration: 200 }, () => {
      runOnJS(onRemove)();
    });
  };

  return (
    <Animated.View style={[styles.cartItem, animStyle]}>
      <View style={styles.itemImageContainer}>
        <Text style={styles.itemEmoji}>{item.product.image}</Text>
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
        <Text style={styles.itemUnit}>{item.product.unit}</Text>
        <Text style={styles.itemPrice}>{formatPrice(item.product.price)}</Text>
      </View>
      <View style={styles.itemActions}>
        <Pressable style={styles.removeBtn} onPress={handleRemove}>
          <Ionicons name="trash-outline" size={16} color={Colors.error} />
        </Pressable>
        <View style={styles.qtyControl}>
          <Pressable
            style={styles.qtyBtn}
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              onQtyChange(item.quantity - 1);
            }}
          >
            <Ionicons name="remove" size={16} color={Colors.primary} />
          </Pressable>
          <Text style={styles.qtyText}>{item.quantity}</Text>
          <Pressable
            style={styles.qtyBtn}
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              onQtyChange(item.quantity + 1);
            }}
          >
            <Ionicons name="add" size={16} color={Colors.primary} />
          </Pressable>
        </View>
        <Text style={styles.subtotal}>{formatPrice(item.product.price * item.quantity)}</Text>
      </View>
    </Animated.View>
  );
}

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const { items, removeFromCart, updateQuantity, clearCart, totalPrice, totalItems } = useCart();
  const [ordered, setOrdered] = useState(false);

  const delivery = totalPrice > 100000 ? 0 : 15000;
  const finalTotal = totalPrice + delivery;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleCheckout = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setOrdered(true);
    clearCart();
  };

  if (ordered) {
    return (
      <View style={[styles.container, styles.successContainer, { paddingTop: topPad }]}>
        <View style={styles.successContent}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={40} color="#fff" />
          </View>
          <Text style={styles.successTitle}>Order Placed!</Text>
          <Text style={styles.successSubtitle}>
            Your order has been placed successfully. We'll deliver it soon!
          </Text>
          <Pressable
            style={styles.successBtn}
            onPress={() => {
              setOrdered(false);
              router.push("/(tabs)/index");
            }}
          >
            <Text style={styles.successBtnText}>Continue Shopping</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <Text style={[styles.title, { paddingHorizontal: 16, marginBottom: 0, paddingTop: 12 }]}>My Cart</Text>
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="cart-outline" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add products from the catalog to get started</Text>
          <Pressable style={styles.shopBtn} onPress={() => router.push("/(tabs)/catalog")}>
            <Text style={styles.shopBtnText}>Browse Products</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Cart</Text>
        <Pressable onPress={() => {
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          clearCart();
        }}>
          <Text style={styles.clearText}>Clear all</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 180 + bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item) => (
          <CartItemRow
            key={item.product.id}
            item={item}
            onRemove={() => removeFromCart(item.product.id)}
            onQtyChange={(qty) => updateQuantity(item.product.id, qty)}
          />
        ))}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal ({totalItems} items)</Text>
            <Text style={styles.summaryValue}>{formatPrice(totalPrice)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.deliveryLabel}>
              <Text style={styles.summaryLabel}>Delivery</Text>
              {delivery === 0 && (
                <View style={styles.freeBadge}>
                  <Text style={styles.freeBadgeText}>FREE</Text>
                </View>
              )}
            </View>
            <Text style={[styles.summaryValue, delivery === 0 && styles.freeValue]}>
              {delivery === 0 ? "Free" : formatPrice(delivery)}
            </Text>
          </View>
          {delivery > 0 && (
            <View style={styles.deliveryHint}>
              <Ionicons name="information-circle-outline" size={14} color={Colors.primary} />
              <Text style={styles.deliveryHintText}>
                Add {formatPrice(100000 - totalPrice)} more for free delivery
              </Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(finalTotal)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.checkoutContainer, { paddingBottom: bottomPad + 8 }]}>
        <View style={styles.totalRow}>
          <Text style={styles.checkoutLabel}>Total</Text>
          <Text style={styles.checkoutTotal}>{formatPrice(finalTotal)}</Text>
        </View>
        <Pressable style={styles.checkoutBtn} onPress={handleCheckout}>
          <Ionicons name="bag-check-outline" size={20} color="#fff" />
          <Text style={styles.checkoutBtnText}>Place Order</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 26,
    color: Colors.text,
  },
  clearText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: Colors.error,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  cartItem: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    flexDirection: "row",
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  itemImageContainer: {
    width: 70,
    height: 70,
    backgroundColor: "#F8FBF8",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  itemEmoji: {
    fontSize: 36,
  },
  itemInfo: {
    flex: 1,
    justifyContent: "center",
    gap: 2,
  },
  itemName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  itemUnit: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  itemPrice: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  itemActions: {
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  removeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    padding: 4,
    gap: 8,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    backgroundColor: Colors.card,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: Colors.primary,
    minWidth: 20,
    textAlign: "center",
  },
  subtotal: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: Colors.text,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    marginTop: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: Colors.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  summaryLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.text,
  },
  deliveryLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  freeBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  freeBadgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 10,
    color: Colors.primary,
  },
  freeValue: {
    color: Colors.primary,
  },
  deliveryHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  deliveryHintText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.primary,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 12,
  },
  totalLabel: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: Colors.text,
  },
  totalValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: Colors.text,
  },
  checkoutContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
    gap: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  checkoutLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  checkoutTotal: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: Colors.text,
  },
  checkoutBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  checkoutBtnText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#fff",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingBottom: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    backgroundColor: Colors.primaryLight,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: Colors.text,
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  shopBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  shopBtnText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: "#fff",
  },
  successContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  successContent: {
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  successIcon: {
    width: 80,
    height: 80,
    backgroundColor: Colors.primary,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  successTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 26,
    color: Colors.text,
  },
  successSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  successBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 16,
  },
  successBtnText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#fff",
  },
});
