import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { Product, formatPrice } from "@/constants/data";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  horizontal?: boolean;
}

export function ProductCard({ product, onPress, horizontal }: ProductCardProps) {
  const { items, addToCart, updateQuantity } = useCart();
  const cartItem = items.find((i) => i.product.id === product.id);
  const qty = cartItem?.quantity ?? 0;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleAddToCart = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    scale.value = withSpring(0.92, {}, () => {
      scale.value = withSpring(1);
    });
    addToCart(product);
  };

  const handleDecrement = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    updateQuantity(product.id, qty - 1);
  };

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  if (horizontal) {
    return (
      <Animated.View style={[animatedStyle]}>
        <Pressable style={styles.horizontalCard} onPress={onPress}>
          <View style={styles.horizontalImageContainer}>
            <Text style={styles.horizontalEmoji}>{product.image}</Text>
            {product.badge && (
              <View style={[styles.badge, styles[`badge_${product.badge}`]]}>
                <Text style={styles.badgeText}>
                  {product.badge === "sale" ? `-${discount}%` : product.badge.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.horizontalInfo}>
            <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
            <Text style={styles.unitText}>{product.unit}</Text>
            <View style={styles.priceRow}>
              <View>
                <Text style={styles.price}>{formatPrice(product.price)}</Text>
                {product.originalPrice && (
                  <Text style={styles.originalPrice}>{formatPrice(product.originalPrice)}</Text>
                )}
              </View>
              {qty === 0 ? (
                <Pressable style={styles.addBtn} onPress={handleAddToCart}>
                  <Ionicons name="add" size={18} color="#fff" />
                </Pressable>
              ) : (
                <View style={styles.qtyRow}>
                  <Pressable style={styles.qtyBtn} onPress={handleDecrement}>
                    <Ionicons name="remove" size={14} color={Colors.primary} />
                  </Pressable>
                  <Text style={styles.qtyText}>{qty}</Text>
                  <Pressable style={styles.qtyBtn} onPress={handleAddToCart}>
                    <Ionicons name="add" size={14} color={Colors.primary} />
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={animatedStyle}>
      <Pressable style={styles.card} onPress={onPress}>
        <View style={styles.imageContainer}>
          <Text style={styles.emoji}>{product.image}</Text>
          {product.badge && (
            <View style={[styles.badge, styles[`badge_${product.badge}`]]}>
              <Text style={styles.badgeText}>
                {product.badge === "sale" ? `-${discount}%` : product.badge.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
          <Text style={styles.unitText}>{product.unit}</Text>
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.price}>{formatPrice(product.price)}</Text>
              {product.originalPrice && (
                <Text style={styles.originalPrice}>{formatPrice(product.originalPrice)}</Text>
              )}
            </View>
            {qty === 0 ? (
              <Pressable style={styles.addBtn} onPress={handleAddToCart}>
                <Ionicons name="add" size={18} color="#fff" />
              </Pressable>
            ) : (
              <View style={styles.qtyColumn}>
                <Pressable style={styles.qtyBtnSm} onPress={handleAddToCart}>
                  <Ionicons name="add" size={12} color={Colors.primary} />
                </Pressable>
                <Text style={styles.qtyText}>{qty}</Text>
                <Pressable style={styles.qtyBtnSm} onPress={handleDecrement}>
                  <Ionicons name="remove" size={12} color={Colors.primary} />
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: "hidden",
    width: 160,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    backgroundColor: "#F8FBF8",
    alignItems: "center",
    justifyContent: "center",
    height: 110,
  },
  emoji: {
    fontSize: 52,
  },
  info: {
    padding: 12,
  },
  productName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  unitText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 8,
  },
  price: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    color: Colors.text,
  },
  originalPrice: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: Colors.textMuted,
    textDecorationLine: "line-through",
  },
  addBtn: {
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    padding: 4,
    gap: 6,
  },
  qtyColumn: {
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 6,
    gap: 2,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnSm: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: Colors.primary,
  },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badge_sale: { backgroundColor: Colors.accent },
  badge_new: { backgroundColor: "#3B82F6" },
  badge_hot: { backgroundColor: "#EF4444" },
  badgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 9,
    color: "#fff",
    textTransform: "uppercase",
  },

  horizontalCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    flexDirection: "row",
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  horizontalImageContainer: {
    backgroundColor: "#F8FBF8",
    width: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  horizontalEmoji: {
    fontSize: 42,
  },
  horizontalInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
});
