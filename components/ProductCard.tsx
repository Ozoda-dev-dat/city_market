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
import { LinearGradient } from "expo-linear-gradient";
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

  const glassCard = {
    backgroundColor: isDarkMode ? "rgba(30,30,32,0.82)" : "rgba(255,255,255,0.82)",
    borderColor: isDarkMode ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.9)",
  };

  if (horizontal) {
    return (
      <Animated.View style={[styles.hCard, glassCard, animStyle]}>
        <Pressable
          style={styles.hCardInner}
          onPress={onPress}
          onPressIn={() => { scale.value = withSpring(0.97, { damping: 14 }); }}
          onPressOut={() => { scale.value = withSpring(1, { damping: 14 }); }}
        >
          <View style={styles.hImageBox}>
            {isValidImageUri(resolvedImage) ? (
              <Image source={{ uri: resolvedImage }} style={styles.hImage} resizeMode="cover" />
            ) : (
              <View style={[styles.hImage, styles.imageFallback]}>
                <Text style={styles.fallbackTextSm}>{product.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            {product.badge && (
              <View style={[styles.hBadge, { backgroundColor: BADGE_COLORS[product.badge] }]}>
                <Text style={styles.badgeText}>{BADGE_LABELS[product.badge]}</Text>
              </View>
            )}
          </View>
          <View style={styles.hInfo}>
            <Text style={[styles.hName, { color: Colors.text }]} numberOfLines={2}>{product.name}</Text>
            {storeName ? (
              <View style={styles.storeBadge}>
                <Ionicons name="storefront" size={9} color="#16A34A" />
                <Text style={styles.storeBadgeText} numberOfLines={1}>{storeName}</Text>
              </View>
            ) : (
              <Text style={[styles.hUnit, { color: Colors.textMuted }]}>{product.brand ?? product.unit}</Text>
            )}
            <Text style={styles.hPrice}>{formatPrice(product.price)}</Text>
          </View>
          <View style={[
            styles.qtyRow,
            { backgroundColor: isDarkMode ? "rgba(22,163,74,0.15)" : "rgba(22,163,74,0.09)" }
          ]}>
            {inCart ? (
              <>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() => {
                    if (cartItem.quantity === 1) removeFromCart(product.id);
                    else updateQuantity(product.id, cartItem.quantity - 1);
                  }}
                >
                  <Ionicons
                    name={cartItem.quantity === 1 ? "trash-outline" : "remove"}
                    size={16}
                    color="#16A34A"
                  />
                </Pressable>
                <Text style={styles.qtyText}>{cartItem.quantity}</Text>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() => {
                    if (product.stockQuantity && cartItem.quantity >= product.stockQuantity) {
                      Alert.alert("Xatolik", "Omborda yetarli mahsulot yo'q");
                      return;
                    }
                    updateQuantity(product.id, cartItem.quantity + 1);
                  }}
                >
                  <Ionicons name="add" size={16} color="#16A34A" />
                </Pressable>
              </>
            ) : (
              <Animated.View style={btnAnimStyle}>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={handleAdd}
                  disabled={!product.inStock}
                >
                  <Ionicons name="add" size={16} color={product.inStock ? "#16A34A" : Colors.textMuted} />
                </Pressable>
              </Animated.View>
            )}
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.card, glassCard, animStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.96, { damping: 14 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 14 }); }}
        style={{ flex: 1 }}
      >
        <View style={styles.imageBox}>
          {isValidImageUri(resolvedImage) ? (
            <Image source={{ uri: resolvedImage }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, styles.imageFallback]}>
              <Text style={styles.fallbackText}>{product.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.18)"]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          {product.badge && (
            <View style={[styles.badge, { backgroundColor: BADGE_COLORS[product.badge] }]}>
              <Text style={styles.badgeText}>{BADGE_LABELS[product.badge]}</Text>
            </View>
          )}
          {!product.inStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Tugagan</Text>
            </View>
          )}
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: Colors.text }]} numberOfLines={2}>{product.name}</Text>
          <Text style={[styles.unit, { color: Colors.textMuted }]}>{product.unit}</Text>
          {storeName ? (
            <View style={styles.storeBadge}>
              <Ionicons name="storefront" size={9} color="#16A34A" />
              <Text style={styles.storeBadgeText} numberOfLines={1}>{storeName}</Text>
            </View>
          ) : null}
          <View style={styles.bottomRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.price, { color: Colors.text }]}>{formatPrice(product.price)}</Text>
              {product.originalPrice && (
                <Text style={[styles.originalPrice, { color: Colors.textMuted }]}>{formatPrice(product.originalPrice)}</Text>
              )}
            </View>
            {inCart ? (
              <View style={[styles.qtyRow, { backgroundColor: isDarkMode ? "rgba(22,163,74,0.15)" : "rgba(22,163,74,0.08)" }]}>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() => {
                    if (cartItem.quantity === 1) removeFromCart(product.id);
                    else updateQuantity(product.id, cartItem.quantity - 1);
                  }}
                >
                  <Ionicons name="remove" size={12} color="#16A34A" />
                </Pressable>
                <Text style={styles.qtyText}>{cartItem.quantity}</Text>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() => {
                    if (product.stockQuantity && cartItem.quantity >= product.stockQuantity) {
                      Alert.alert("Xatolik", "Omborda yetarli mahsulot yo'q");
                      return;
                    }
                    updateQuantity(product.id, cartItem.quantity + 1);
                  }}
                >
                  <Ionicons name="add" size={12} color="#16A34A" />
                </Pressable>
              </View>
            ) : (
              <Animated.View style={btnAnimStyle}>
                <Pressable
                  style={[styles.addBtn, !product.inStock && styles.addBtnDisabled]}
                  onPress={handleAdd}
                  disabled={!product.inStock}
                >
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

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 5,
  },
  imageBox: {
    height: 138,
    backgroundColor: "#F0F7F2",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F5E9",
  },
  fallbackText: {
    fontSize: 40,
    fontFamily: "Poppins_700Bold",
    color: "#16A34A",
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  outOfStockText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#fff",
  },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 9,
    color: "#fff",
    textTransform: "uppercase",
  },
  info: {
    padding: 12,
    gap: 3,
  },
  name: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    lineHeight: 18,
  },
  unit: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    marginBottom: 6,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  storeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 4,
  },
  storeBadgeText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: "#16A34A",
    flexShrink: 1,
  },
  addBtn: {
    width: 32,
    height: 32,
    backgroundColor: "#16A34A",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnDisabled: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    padding: 2,
    gap: 4,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  qtyText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    color: "#16A34A",
    minWidth: 18,
    textAlign: "center",
  },
  hCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  hCardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  hImageBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#E8F5E9",
    position: "relative",
  },
  hImage: {
    width: "100%",
    height: "100%",
  },
  hBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  fallbackTextSm: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: "#16A34A",
  },
  hInfo: {
    flex: 1,
    gap: 4,
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
  hPrice: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: "#16A34A",
  },
});
