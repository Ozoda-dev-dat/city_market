import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Alert,
  Image,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import getColors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { Product, formatPrice } from "@/constants/data";
import { Product as SchemaProduct } from "@/shared/schema";
import { useCart } from "@/context/CartContext";
import { resolveImageUrl } from "@/lib/query-client";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 44) / 2;

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  horizontal?: boolean;
  storeName?: string;
}

const BADGE_LABELS: Record<string, string> = {
  sale: "Chegirma",
  new: "Yangi",
  hot: "Trend",
};

const BADGE_COLORS: Record<string, string> = {
  sale: "#EF4444",
  new: "#3B82F6",
  hot: "#F97316",
};

export function ProductCard({ product, onPress, horizontal, storeName }: ProductCardProps) {
  const { addToCart, items, updateQuantity, removeFromCart } = useCart();
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);

  const productForCart: SchemaProduct = {
    id: product.id,
    name: product.name,
    category: product.category,
    price: product.price,
    originalPrice: product.originalPrice || null,
    unit: product.unit,
    image: product.image,
    badge: product.badge || null,
    rating: product.rating.toString(),
    description: product.description || null,
    brand: product.brand || null,
    weight: product.weight || null,
    inStock: product.inStock,
    stockQuantity: product.stockQuantity || 0,
  };

  const cartItem = items.find((i) => i.product.id === product.id);
  const inCart = !!cartItem;

  const scale = useSharedValue(1);
  const btnScale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const btnAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const resolvedImage = resolveImageUrl(product.image || "");
  const isValidImageUri = (uri: string) =>
    !!uri && (uri.startsWith("http") || uri.startsWith("data:image"));

  const handleAdd = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    btnScale.value = withSequence(withSpring(0.75, { damping: 10 }), withSpring(1, { damping: 12 }));
    if (!product.inStock) {
      Alert.alert("Mahsulot yo'q", "Bu mahsulot hozircha mavjud emas");
      return;
    }
    addToCart(productForCart);
  };

  const cardBg = isDarkMode ? "#1C1C1E" : "#FFFFFF";
  const imageBg = isDarkMode ? "#2A2A2C" : "#F5F5F5";
  const borderCol = isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

  /* ── HORIZONTAL card (Popular section) ── */
  if (horizontal) {
    return (
      <Animated.View style={[styles.hCard, { backgroundColor: cardBg, borderColor: borderCol }, animStyle]}>
        <Pressable
          style={{ flexDirection: "row", flex: 1 }}
          onPress={onPress}
          onPressIn={() => { scale.value = withSpring(0.97, { damping: 14 }); }}
          onPressOut={() => { scale.value = withSpring(1, { damping: 14 }); }}
        >
          <View style={[styles.hImageBox, { backgroundColor: imageBg }]}>
            {isValidImageUri(resolvedImage) ? (
              <Image source={{ uri: resolvedImage }} style={styles.hImage} resizeMode="contain" />
            ) : (
              <View style={[styles.hImage, { alignItems: "center", justifyContent: "center" }]}>
                <Text style={{ fontSize: 32, fontFamily: "Poppins_700Bold", color: "#16A34A" }}>
                  {product.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {product.badge && (
              <View style={[styles.badge, { backgroundColor: BADGE_COLORS[product.badge] }]}>
                <Text style={styles.badgeText}>{BADGE_LABELS[product.badge]}</Text>
              </View>
            )}
          </View>

          <View style={styles.hInfo}>
            <Text style={[styles.hName, { color: Colors.text }]} numberOfLines={2}>{product.name}</Text>
            <Text style={[styles.hUnit, { color: Colors.textMuted }]}>{product.brand ?? product.unit}</Text>
            <View style={styles.hBottom}>
              <View>
                <Text style={[styles.hPrice, { color: Colors.text }]}>{formatPrice(product.price)}</Text>
                {product.originalPrice && (
                  <Text style={[styles.hOriginal, { color: Colors.textMuted }]}>{formatPrice(product.originalPrice)}</Text>
                )}
              </View>
              {inCart ? (
                <View style={styles.qtyPill}>
                  <Pressable
                    style={styles.qtyPillBtn}
                    onPress={() => {
                      if (cartItem.quantity === 1) removeFromCart(product.id);
                      else updateQuantity(product.id, cartItem.quantity - 1);
                    }}
                  >
                    <Ionicons name="remove" size={14} color="#16A34A" />
                  </Pressable>
                  <Text style={styles.qtyPillText}>{cartItem.quantity}</Text>
                  <Pressable
                    style={styles.qtyPillBtn}
                    onPress={() => updateQuantity(product.id, cartItem.quantity + 1)}
                  >
                    <Ionicons name="add" size={14} color="#16A34A" />
                  </Pressable>
                </View>
              ) : (
                <Animated.View style={btnAnimStyle}>
                  <Pressable style={styles.addCircleSm} onPress={handleAdd}>
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

  /* ── VERTICAL grid card (Korzinka Go style) ── */
  return (
    <Animated.View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }, animStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 14 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 14 }); }}
        style={{ flex: 1 }}
      >
        {/* Image area */}
        <View style={[styles.imageBox, { backgroundColor: imageBg }]}>
          {isValidImageUri(resolvedImage) ? (
            <Image source={{ uri: resolvedImage }} style={styles.image} resizeMode="contain" />
          ) : (
            <View style={[styles.image, { alignItems: "center", justifyContent: "center" }]}>
              <Text style={{ fontSize: 44, fontFamily: "Poppins_700Bold", color: "#16A34A" }}>
                {product.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          {/* Badge top-left */}
          {product.badge && (
            <View style={[styles.badge, { backgroundColor: BADGE_COLORS[product.badge] }]}>
              <Text style={styles.badgeText}>{BADGE_LABELS[product.badge]}</Text>
            </View>
          )}

          {/* Out of stock overlay */}
          {!product.inStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Tugagan</Text>
            </View>
          )}

          {/* Cart button — bottom-right of image (Korzinka Go style) */}
          {inCart ? (
            <View style={styles.qtyOverlay}>
              <Pressable
                style={styles.qtyOverlayBtn}
                onPress={() => {
                  if (cartItem.quantity === 1) removeFromCart(product.id);
                  else updateQuantity(product.id, cartItem.quantity - 1);
                }}
              >
                <Ionicons name="remove" size={13} color="#16A34A" />
              </Pressable>
              <Text style={styles.qtyOverlayText}>{cartItem.quantity}</Text>
              <Pressable
                style={styles.qtyOverlayBtn}
                onPress={() => {
                  if (product.stockQuantity && cartItem.quantity >= product.stockQuantity) {
                    Alert.alert("Xatolik", "Omborda yetarli mahsulot yo'q");
                    return;
                  }
                  updateQuantity(product.id, cartItem.quantity + 1);
                }}
              >
                <Ionicons name="add" size={13} color="#16A34A" />
              </Pressable>
            </View>
          ) : (
            <Animated.View style={[styles.addCircleWrap, btnAnimStyle]}>
              <Pressable
                style={[styles.addCircle, !product.inStock && styles.addCircleDisabled]}
                onPress={handleAdd}
                disabled={!product.inStock}
              >
                <Ionicons name="add" size={22} color="#fff" />
              </Pressable>
            </Animated.View>
          )}
        </View>

        {/* Info section */}
        <View style={styles.info}>
          <Text style={[styles.name, { color: Colors.text }]} numberOfLines={2}>{product.name}</Text>
          <Text style={[styles.unit, { color: Colors.textMuted }]}>{product.unit}</Text>
          {storeName ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 2 }}>
              <Ionicons name="storefront" size={9} color="#16A34A" />
              <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 10, color: "#16A34A", flexShrink: 1 }} numberOfLines={1}>
                {storeName}
              </Text>
            </View>
          ) : null}
          <Text style={[styles.price, { color: Colors.text }]}>{formatPrice(product.price)}</Text>
          {product.originalPrice && (
            <Text style={[styles.originalPrice, { color: Colors.textMuted }]}>{formatPrice(product.originalPrice)}</Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  /* ── Vertical card ── */
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  imageBox: {
    height: 148,
    position: "relative",
    padding: 8,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 9,
    color: "#fff",
    textTransform: "uppercase",
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.38)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 0,
  },
  outOfStockText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#fff",
  },
  /* Korzinka Go style: round "+" button bottom-right of image */
  addCircleWrap: {
    position: "absolute",
    bottom: 8,
    right: 8,
  },
  addCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  addCircleDisabled: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0,
  },
  /* Qty counter overlay on image */
  qtyOverlay: {
    position: "absolute",
    bottom: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: "#16A34A",
  },
  qtyOverlayBtn: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
  },
  qtyOverlayText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    color: "#16A34A",
    minWidth: 18,
    textAlign: "center",
  },
  info: {
    padding: 10,
    paddingTop: 8,
    gap: 1,
  },
  name: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    lineHeight: 18,
  },
  unit: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    marginBottom: 4,
  },
  price: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
  },
  originalPrice: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    textDecorationLine: "line-through",
  },

  /* ── Horizontal card ── */
  hCard: {
    borderRadius: 16,
    marginBottom: 10,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    width: 220,
  },
  hImageBox: {
    width: 90,
    height: 90,
    padding: 6,
    position: "relative",
  },
  hImage: {
    width: "100%",
    height: "100%",
  },
  hInfo: {
    flex: 1,
    padding: 12,
    gap: 2,
  },
  hName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    lineHeight: 18,
  },
  hUnit: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
  },
  hBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  hPrice: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
  },
  hOriginal: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    textDecorationLine: "line-through",
  },
  addCircleSm: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  qtyPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(22,163,74,0.1)",
    borderRadius: 16,
    padding: 2,
    gap: 2,
    borderWidth: 1,
    borderColor: "rgba(22,163,74,0.2)",
  },
  qtyPillBtn: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
  },
  qtyPillText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    color: "#16A34A",
    minWidth: 18,
    textAlign: "center",
  },
});
