import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { PRODUCTS, formatPrice } from "@/constants/data";
import { useCart } from "@/context/CartContext";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

const RELATED_LIMIT = 4;

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { items, addToCart, updateQuantity } = useCart();
  const [liked, setLiked] = useState(false);

  const product = PRODUCTS.find((p) => p.id === id);
  const cartItem = items.find((i) => i.product.id === id);
  const qty = cartItem?.quantity ?? 0;

  const heartScale = useSharedValue(1);
  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const addScale = useSharedValue(1);
  const addStyle = useAnimatedStyle(() => ({
    transform: [{ scale: addScale.value }],
  }));

  if (!product) {
    return (
      <View style={styles.notFound}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.notFoundText}>Product not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const related = PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, RELATED_LIMIT);

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    addScale.value = withSpring(0.9, {}, () => {
      addScale.value = withSpring(1);
    });
    addToCart(product);
  };

  const handleLike = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    heartScale.value = withSpring(1.3, {}, () => {
      heartScale.value = withSpring(1);
    });
    setLiked((prev) => !prev);
  };

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 + bottomPad }}>
        <LinearGradient
          colors={["#E8F5EE", "#F5F8F3"]}
          style={styles.imageSection}
        >
          <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
            <Pressable style={styles.iconBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color={Colors.text} />
            </Pressable>
            <Animated.View style={heartStyle}>
              <Pressable style={styles.iconBtn} onPress={handleLike}>
                <Ionicons
                  name={liked ? "heart" : "heart-outline"}
                  size={20}
                  color={liked ? Colors.error : Colors.text}
                />
              </Pressable>
            </Animated.View>
          </View>

          <Text style={styles.productEmoji}>{product.image}</Text>

          {product.badge && (
            <View style={[styles.badge, styles[`badge_${product.badge}`]]}>
              <Text style={styles.badgeText}>
                {product.badge === "sale"
                  ? `-${discount}%`
                  : product.badge.toUpperCase()}
              </Text>
            </View>
          )}
        </LinearGradient>

        <View style={styles.details}>
          <View style={styles.nameRow}>
            <Text style={styles.productName}>{product.name}</Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.ratingText}>{product.rating}</Text>
            </View>
          </View>

          {product.brand && (
            <Text style={styles.brand}>{product.brand}</Text>
          )}

          <View style={styles.metaRow}>
            {product.weight && (
              <View style={styles.metaChip}>
                <Ionicons name="scale-outline" size={13} color={Colors.textSecondary} />
                <Text style={styles.metaText}>{product.weight}</Text>
              </View>
            )}
            <View style={styles.metaChip}>
              <Ionicons name="cube-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{product.unit}</Text>
            </View>
            <View style={[styles.metaChip, { backgroundColor: Colors.primaryLight }]}>
              <Ionicons name="checkmark-circle" size={13} color={Colors.primary} />
              <Text style={[styles.metaText, { color: Colors.primary }]}>In Stock</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>

          {related.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>You might also like</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.relatedScroll}>
                {related.map((item) => (
                  <Pressable
                    key={item.id}
                    style={styles.relatedCard}
                    onPress={() => router.replace({ pathname: "/product/[id]", params: { id: item.id } })}
                  >
                    <View style={styles.relatedImageBox}>
                      <Text style={styles.relatedEmoji}>{item.image}</Text>
                    </View>
                    <Text style={styles.relatedName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.relatedPrice}>{formatPrice(item.price)}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: bottomPad + 8 }]}>
        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          {product.originalPrice && (
            <Text style={styles.originalPrice}>{formatPrice(product.originalPrice)}</Text>
          )}
        </View>

        {qty === 0 ? (
          <Animated.View style={[styles.addBtnWrapper, addStyle]}>
            <Pressable style={styles.addBtn} onPress={handleAddToCart}>
              <Ionicons name="cart-outline" size={20} color="#fff" />
              <Text style={styles.addBtnText}>Add to Cart</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <View style={styles.qtyLarge}>
            <Pressable
              style={styles.qtyBtnLg}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                updateQuantity(product.id, qty - 1);
              }}
            >
              <Ionicons name="remove" size={22} color={Colors.primary} />
            </Pressable>
            <Text style={styles.qtyLargeText}>{qty}</Text>
            <Pressable
              style={styles.qtyBtnLg}
              onPress={handleAddToCart}
            >
              <Ionicons name="add" size={22} color={Colors.primary} />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  imageSection: {
    height: 320,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  iconBtn: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  productEmoji: {
    fontSize: 100,
  },
  badge: {
    position: "absolute",
    bottom: 20,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badge_sale: { backgroundColor: Colors.accent },
  badge_new: { backgroundColor: "#3B82F6" },
  badge_hot: { backgroundColor: "#EF4444" },
  badgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
    color: "#fff",
  },
  details: {
    padding: 20,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  productName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: Colors.text,
    flex: 1,
    lineHeight: 30,
    marginRight: 12,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  ratingText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    color: "#F59E0B",
  },
  brand: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 20,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  metaText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  sectionLabel: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: Colors.text,
    marginBottom: 10,
  },
  description: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  relatedScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  relatedCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 12,
    width: 110,
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    alignItems: "center",
  },
  relatedImageBox: {
    width: 60,
    height: 60,
    backgroundColor: "#F8FBF8",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  relatedEmoji: {
    fontSize: 32,
  },
  relatedName: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: Colors.text,
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 4,
  },
  relatedPrice: {
    fontFamily: "Poppins_700Bold",
    fontSize: 11,
    color: Colors.primary,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    paddingHorizontal: 20,
    paddingTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  priceBlock: {
    gap: 2,
  },
  priceLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  price: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: Colors.text,
  },
  originalPrice: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    textDecorationLine: "line-through",
  },
  addBtnWrapper: {
    flex: 1,
    marginLeft: 16,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addBtnText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#fff",
  },
  qtyLarge: {
    flex: 1,
    marginLeft: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 20,
  },
  qtyBtnLg: {
    width: 38,
    height: 38,
    backgroundColor: Colors.card,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyLargeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: Colors.primary,
    minWidth: 30,
    textAlign: "center",
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  notFoundText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: Colors.text,
  },
  backBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  backBtnText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: "#fff",
  },
});
