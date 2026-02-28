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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { formatPrice } from "@/constants/data";
import { useCart } from "@/context/CartContext";
import { useProducts } from "@/context/ProductsContext";

const BADGE_CONFIG = {
  sale: { label: "Chegirma", color: "#EF4444" },
  new: { label: "Yangi", color: "#3B82F6" },
  hot: { label: "Ommabop", color: "#F97316" },
};

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { products } = useProducts();
  const product = products.find((p) => p.id === id);
  const { addToCart, items, updateQuantity, removeFromCart } = useCart();
  const [liked, setLiked] = useState(false);
  const likeScale = useSharedValue(1);
  const cartItemCount = items.find((i) => i.product.id === id)?.quantity ?? 0;
  const btnScale = useSharedValue(1);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const likeAnim = useAnimatedStyle(() => ({ transform: [{ scale: likeScale.value }] }));
  const btnAnim = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  if (!product) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.notFound}>Mahsulot topilmadi</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Orqaga</Text>
        </Pressable>
      </View>
    );
  }

  const badgeCfg = product.badge ? BADGE_CONFIG[product.badge] : null;
  const relatedProducts = products.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, 4);

  const handleAddToCart = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    btnScale.value = withSequence(withSpring(0.94), withSpring(1));
    addToCart(product);
  };

  const handleLike = () => {
    setLiked(!liked);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    likeScale.value = withSequence(withSpring(1.3), withSpring(1));
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View style={[styles.hero, { paddingTop: topPad + 60 }]}>
          <Text style={styles.heroEmoji}>{product.image}</Text>
          {badgeCfg && (
            <View style={[styles.heroBadge, { backgroundColor: badgeCfg.color }]}>
              <Text style={styles.heroBadgeText}>{badgeCfg.label}</Text>
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.namePriceBlock}>
              <Text style={styles.productName}>{product.name}</Text>
              {product.brand && <Text style={styles.productBrand}>{product.brand}</Text>}
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={styles.ratingText}>{product.rating}</Text>
                <Text style={styles.ratingCount}>(128 ta sharh)</Text>
              </View>
            </View>
            <Animated.View style={likeAnim}>
              <Pressable onPress={handleLike} style={styles.likeBtn}>
                <Ionicons
                  name={liked ? "heart" : "heart-outline"}
                  size={22}
                  color={liked ? "#EF4444" : Colors.textMuted}
                />
              </Pressable>
            </Animated.View>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            <Text style={styles.unit}>/ {product.unit}</Text>
            {product.originalPrice && (
              <Text style={styles.originalPrice}>{formatPrice(product.originalPrice)}</Text>
            )}
            {product.originalPrice && (
              <View style={styles.savingBadge}>
                <Text style={styles.savingText}>
                  -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                </Text>
              </View>
            )}
          </View>

          {product.weight && (
            <View style={styles.metaRow}>
              <Ionicons name="scale-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.metaText}>Og'irlik: {product.weight}</Text>
              <View style={styles.metaDivider} />
              <Ionicons
                name={product.inStock ? "checkmark-circle" : "close-circle"}
                size={14}
                color={product.inStock ? Colors.primary : Colors.error}
              />
              <Text style={[styles.metaText, { color: product.inStock ? Colors.primary : Colors.error }]}>
                {product.inStock ? "Mavjud" : "Mavjud emas"}
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          <Text style={styles.descTitle}>Tavsif</Text>
          <Text style={styles.description}>{product.description}</Text>

          {relatedProducts.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.descTitle}>Sizga ham yoqishi mumkin</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.relatedScroll}>
                {relatedProducts.map((rp) => (
                  <Pressable
                    key={rp.id}
                    style={styles.relatedCard}
                    onPress={() => router.push({ pathname: "/product/[id]", params: { id: rp.id } })}
                  >
                    <View style={styles.relatedImageContainer}>
                      <Text style={styles.relatedEmoji}>{rp.image}</Text>
                    </View>
                    <Text style={styles.relatedName} numberOfLines={1}>{rp.name}</Text>
                    <Text style={styles.relatedPrice}>{formatPrice(rp.price)}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      </ScrollView>

      <View style={[styles.header, { top: topPad + 8 }]}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={() => router.push("/(tabs)/cart")}>
          <Ionicons name="cart-outline" size={22} color={Colors.text} />
        </Pressable>
      </View>

      <View style={[styles.footer, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 8 }]}>
        {cartItemCount === 0 ? (
          <Animated.View style={[{ flex: 1 }, btnAnim]}>
            <Pressable
              style={[styles.addToCartBtn, !product.inStock && styles.addToCartDisabled]}
              onPress={handleAddToCart}
              disabled={!product.inStock}
            >
              <Ionicons name="cart-outline" size={20} color="#fff" />
              <Text style={styles.addToCartText}>
                {product.inStock ? "Savatga qo'shish" : "Mavjud emas"}
              </Text>
            </Pressable>
          </Animated.View>
        ) : (
          <View style={styles.cartControls}>
            <Text style={styles.totalText}>
              {formatPrice(product.price * cartItemCount)}
            </Text>
            <View style={styles.qtyRow}>
              <Pressable
                style={styles.qtyBtn}
                onPress={() => {
                  if (cartItemCount === 1) removeFromCart(product.id);
                  else updateQuantity(product.id, cartItemCount - 1);
                }}
              >
                <Ionicons name="remove" size={18} color="#fff" />
              </Pressable>
              <Text style={styles.qtyText}>{cartItemCount}</Text>
              <Pressable
                style={styles.qtyBtn}
                onPress={() => updateQuantity(product.id, cartItemCount + 1)}
              >
                <Ionicons name="add" size={18} color="#fff" />
              </Pressable>
            </View>
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
  hero: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 40,
    paddingHorizontal: 16,
    backgroundColor: Colors.card,
    position: "relative",
  },
  heroEmoji: {
    fontSize: 100,
  },
  heroBadge: {
    position: "absolute",
    right: 24,
    bottom: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  heroBadgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
    color: "#fff",
  },
  header: {
    position: "absolute",
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 42,
    height: 42,
    backgroundColor: Colors.card,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoCard: {
    backgroundColor: Colors.background,
    padding: 20,
    paddingTop: 24,
  },
  infoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  namePriceBlock: {
    flex: 1,
    paddingRight: 12,
    gap: 4,
  },
  productName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: Colors.text,
    lineHeight: 28,
  },
  productBrand: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.text,
  },
  ratingCount: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.textMuted,
  },
  likeBtn: {
    width: 44,
    height: 44,
    backgroundColor: Colors.card,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  price: {
    fontFamily: "Poppins_700Bold",
    fontSize: 26,
    color: Colors.text,
  },
  unit: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: Colors.textSecondary,
    marginLeft: -4,
  },
  originalPrice: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: Colors.textMuted,
    textDecorationLine: "line-through",
  },
  savingBadge: {
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  savingText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
    color: "#EF4444",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  metaText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  metaDivider: {
    width: 1,
    height: 14,
    backgroundColor: Colors.divider,
    marginHorizontal: 6,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 18,
  },
  descTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: Colors.text,
    marginBottom: 8,
  },
  description: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  relatedScroll: {
    marginHorizontal: -4,
  },
  relatedCard: {
    width: 110,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 10,
    marginHorizontal: 4,
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  relatedImageContainer: {
    width: 60,
    height: 60,
    backgroundColor: "#F8FBF8",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  relatedEmoji: {
    fontSize: 32,
  },
  relatedName: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: Colors.text,
    textAlign: "center",
  },
  relatedPrice: {
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
    color: Colors.primary,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  addToCartBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addToCartDisabled: {
    backgroundColor: Colors.textMuted,
  },
  addToCartText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#fff",
  },
  cartControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  totalText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: "#fff",
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: "#fff",
    minWidth: 28,
    textAlign: "center",
  },
  notFound: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: Colors.text,
    marginTop: 12,
  },
  backBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  backBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
});
