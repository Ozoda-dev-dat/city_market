import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { Product, formatPrice } from "@/constants/data";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  horizontal?: boolean;
}

const BADGE_LABELS: Record<string, string> = {
  sale: "Chegirma",
  new: "Yangi",
  hot: "Ommabop",
};

const BADGE_COLORS: Record<string, string> = {
  sale: "#EF4444",
  new: "#3B82F6",
  hot: "#F97316",
};

export function ProductCard({ product, onPress, horizontal }: ProductCardProps) {
  const { addToCart, items, updateQuantity, removeFromCart } = useCart();
  const cartItem = items.find((i) => i.product.id === product.id);
  const inCart = !!cartItem;
  const scale = useSharedValue(1);
  const btnScale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const btnAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const handleAdd = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    btnScale.value = withSequence(withSpring(0.8), withSpring(1));
    addToCart(product);
  };

  if (horizontal) {
    return (
      <Animated.View style={animStyle}>
        <Pressable
          style={styles.horizontalCard}
          onPress={onPress}
          onPressIn={() => { scale.value = withSpring(0.97); }}
          onPressOut={() => { scale.value = withSpring(1); }}
        >
          <View style={styles.horizontalImageContainer}>
            <Text style={styles.horizontalEmoji}>{product.image}</Text>
            {product.badge && (
              <View style={[styles.badge, { backgroundColor: BADGE_COLORS[product.badge] }]}>
                <Text style={styles.badgeText}>{BADGE_LABELS[product.badge]}</Text>
              </View>
            )}
          </View>
          <View style={styles.horizontalInfo}>
            <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
            <Text style={styles.brandText}>{product.brand ?? product.unit}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={11} color="#F59E0B" />
              <Text style={styles.ratingText}>{product.rating}</Text>
            </View>
            <View style={styles.horizontalBottom}>
              <View>
                <Text style={styles.price}>{formatPrice(product.price)}</Text>
                {product.originalPrice && (
                  <Text style={styles.originalPrice}>{formatPrice(product.originalPrice)}</Text>
                )}
              </View>
              {inCart ? (
                <View style={styles.qtyControlSmall}>
                  <Pressable
                    style={styles.qtyBtnSmall}
                    onPress={() => {
                      if (cartItem.quantity === 1) removeFromCart(product.id);
                      else updateQuantity(product.id, cartItem.quantity - 1);
                    }}
                  >
                    <Ionicons name="remove" size={12} color={Colors.primary} />
                  </Pressable>
                  <Text style={styles.qtyTextSmall}>{cartItem.quantity}</Text>
                  <Pressable
                    style={styles.qtyBtnSmall}
                    onPress={() => updateQuantity(product.id, cartItem.quantity + 1)}
                  >
                    <Ionicons name="add" size={12} color={Colors.primary} />
                  </Pressable>
                </View>
              ) : (
                <Animated.View style={btnAnimStyle}>
                  <Pressable style={styles.addBtnSmall} onPress={handleAdd}>
                    <Ionicons name="add" size={18} color="#fff" />
                  </Pressable>
                </Animated.View>
              )}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.card, animStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.96); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        style={{ flex: 1 }}
      >
        <View style={styles.imageContainer}>
          <Text style={styles.emoji}>{product.image}</Text>
          {product.badge && (
            <View style={[styles.badge, { backgroundColor: BADGE_COLORS[product.badge] }]}>
              <Text style={styles.badgeText}>{BADGE_LABELS[product.badge]}</Text>
            </View>
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
          <Text style={styles.unitText}>{product.unit}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={11} color="#F59E0B" />
            <Text style={styles.ratingText}>{product.rating}</Text>
          </View>
          <View style={styles.bottomRow}>
            <View>
              <Text style={styles.price}>{formatPrice(product.price)}</Text>
              {product.originalPrice && (
                <Text style={styles.originalPrice}>{formatPrice(product.originalPrice)}</Text>
              )}
            </View>
            {inCart ? (
              <View style={styles.qtyControlSmall}>
                <Pressable
                  style={styles.qtyBtnSmall}
                  onPress={() => {
                    if (cartItem.quantity === 1) removeFromCart(product.id);
                    else updateQuantity(product.id, cartItem.quantity - 1);
                  }}
                >
                  <Ionicons name="remove" size={12} color={Colors.primary} />
                </Pressable>
                <Text style={styles.qtyTextSmall}>{cartItem.quantity}</Text>
                <Pressable
                  style={styles.qtyBtnSmall}
                  onPress={() => updateQuantity(product.id, cartItem.quantity + 1)}
                >
                  <Ionicons name="add" size={12} color={Colors.primary} />
                </Pressable>
              </View>
            ) : (
              <Animated.View style={btnAnimStyle}>
                <Pressable style={styles.addBtn} onPress={handleAdd}>
                  <Ionicons name="add" size={20} color="#fff" />
                </Pressable>
              </Animated.View>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 156,
    backgroundColor: Colors.card,
    borderRadius: 18,
    marginRight: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  imageContainer: {
    height: 110,
    backgroundColor: "#F8FBF8",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  emoji: {
    fontSize: 52,
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 9,
    color: "#fff",
  },
  info: {
    padding: 12,
    gap: 3,
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
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: Colors.textSecondary,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  price: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    color: Colors.text,
  },
  originalPrice: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
    textDecorationLine: "line-through",
  },
  addBtn: {
    width: 30,
    height: 30,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  horizontalCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    flexDirection: "row",
    marginBottom: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  horizontalImageContainer: {
    width: 90,
    height: 90,
    backgroundColor: "#F8FBF8",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  horizontalEmoji: {
    fontSize: 42,
  },
  horizontalInfo: {
    flex: 1,
    padding: 12,
    gap: 2,
  },
  brandText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
  },
  horizontalBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  addBtnSmall: {
    width: 28,
    height: 28,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyControlSmall: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    padding: 3,
    gap: 6,
  },
  qtyBtnSmall: {
    width: 22,
    height: 22,
    backgroundColor: Colors.card,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyTextSmall: {
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
    color: Colors.primary,
    minWidth: 16,
    textAlign: "center",
  },
});
