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

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 44) / 2;

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  horizontal?: boolean;
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

export function ProductCard({ product, onPress, horizontal }: ProductCardProps) {
  const { addToCart, items, updateQuantity, removeFromCart } = useCart();
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const styles = getStyles(isDarkMode);

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

  const isValidImageUri = (uri: string) =>
    uri && (uri.startsWith("http") || uri.startsWith("data:image"));

  const handleAdd = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    btnScale.value = withSequence(withSpring(0.8), withSpring(1));
    if (!product.inStock) {
      Alert.alert("Mahsulot yo'q", "Bu mahsulot hozircha mavjud emas");
      return;
    }
    addToCart(productForCart);
  };

  if (horizontal) {
    return (
      <Animated.View style={animStyle}>
        <Pressable
          style={styles.hCard}
          onPress={onPress}
          onPressIn={() => { scale.value = withSpring(0.97); }}
          onPressOut={() => { scale.value = withSpring(1); }}
        >
          <View style={styles.hImageBox}>
            {isValidImageUri(product.image) ? (
              <Image source={{ uri: product.image }} style={styles.hImage} resizeMode="cover" />
            ) : (
              <View style={[styles.hImage, styles.imageFallback]}>
                <Text style={styles.fallbackText}>{product.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            {product.badge && (
              <View style={[styles.badge, { backgroundColor: BADGE_COLORS[product.badge] }]}>
                <Text style={styles.badgeText}>{BADGE_LABELS[product.badge]}</Text>
              </View>
            )}
          </View>
          <View style={styles.hInfo}>
            <Text style={styles.hName} numberOfLines={2}>{product.name}</Text>
            <Text style={styles.hUnit}>{product.brand ?? product.unit}</Text>
            <View style={styles.hBottom}>
              <View>
                <Text style={styles.hPrice}>{formatPrice(product.price)}</Text>
                {product.originalPrice && (
                  <Text style={styles.hOriginal}>{formatPrice(product.originalPrice)}</Text>
                )}
              </View>
              {inCart ? (
                <View style={styles.qtyRow}>
                  <Pressable
                    style={styles.qtyBtn}
                    onPress={() => {
                      if (cartItem.quantity === 1) removeFromCart(product.id);
                      else updateQuantity(product.id, cartItem.quantity - 1);
                    }}
                  >
                    <Ionicons name="remove" size={14} color={Colors.primary} />
                  </Pressable>
                  <Text style={styles.qtyText}>{cartItem.quantity}</Text>
                  <Pressable
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(product.id, cartItem.quantity + 1)}
                  >
                    <Ionicons name="add" size={14} color={Colors.primary} />
                  </Pressable>
                </View>
              ) : (
                <Animated.View style={btnAnimStyle}>
                  <Pressable style={styles.addBtnSm} onPress={handleAdd}>
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
        <View style={styles.imageBox}>
          {isValidImageUri(product.image) ? (
            <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, styles.imageFallback]}>
              <Text style={styles.fallbackText}>{product.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          {product.badge && (
            <View style={[styles.badge, { backgroundColor: BADGE_COLORS[product.badge] }]}>
              <Text style={styles.badgeText}>{BADGE_LABELS[product.badge]}</Text>
            </View>
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
          <Text style={styles.unit}>{product.unit}</Text>
          <View style={styles.bottomRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.price}>{formatPrice(product.price)}</Text>
              {product.originalPrice && (
                <Text style={styles.originalPrice}>{formatPrice(product.originalPrice)}</Text>
              )}
            </View>
            {inCart ? (
              <View style={styles.qtyRow}>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() => {
                    if (cartItem.quantity === 1) removeFromCart(product.id);
                    else updateQuantity(product.id, cartItem.quantity - 1);
                  }}
                >
                  <Ionicons name="remove" size={12} color={Colors.primary} />
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
                  <Ionicons name="add" size={12} color={Colors.primary} />
                </Pressable>
              </View>
            ) : (
              <Animated.View style={btnAnimStyle}>
                <Pressable
                  style={[styles.addBtn, !product.inStock && { backgroundColor: Colors.textMuted }]}
                  onPress={handleAdd}
                  disabled={!product.inStock}
                >
                  <Ionicons name={product.inStock ? "add" : "close"} size={18} color="#fff" />
                </Pressable>
              </Animated.View>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const getStyles = (isDarkMode: boolean) => {
  const Colors = getColors(isDarkMode);
  return StyleSheet.create({
    card: {
      width: CARD_WIDTH,
      backgroundColor: Colors.card,
      borderRadius: 20,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDarkMode ? 0.3 : 0.07,
      shadowRadius: 12,
      elevation: 4,
    },
    imageBox: {
      height: 130,
      backgroundColor: isDarkMode ? "#242424" : "#F8F9F8",
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
      color: Colors.text,
      lineHeight: 18,
    },
    unit: {
      fontFamily: "Poppins_400Regular",
      fontSize: 11,
      color: Colors.textMuted,
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
      color: Colors.text,
    },
    originalPrice: {
      fontFamily: "Poppins_400Regular",
      fontSize: 11,
      color: Colors.textMuted,
      textDecorationLine: "line-through",
    },
    addBtn: {
      width: 32,
      height: 32,
      backgroundColor: Colors.primary,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    qtyRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDarkMode ? "#2C2C2E" : "#F4F6F4",
      borderRadius: 10,
      padding: 2,
      gap: 4,
    },
    qtyBtn: {
      width: 24,
      height: 24,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
      backgroundColor: Colors.card,
    },
    qtyText: {
      fontFamily: "Poppins_700Bold",
      fontSize: 13,
      color: Colors.primary,
      minWidth: 18,
      textAlign: "center",
    },
    hCard: {
      backgroundColor: Colors.card,
      borderRadius: 20,
      flexDirection: "row",
      marginBottom: 12,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDarkMode ? 0.3 : 0.06,
      shadowRadius: 10,
      elevation: 3,
    },
    hImageBox: {
      width: 100,
      height: 100,
      backgroundColor: isDarkMode ? "#242424" : "#F8F9F8",
      position: "relative",
    },
    hImage: {
      width: "100%",
      height: "100%",
    },
    hInfo: {
      flex: 1,
      padding: 14,
      gap: 3,
    },
    hName: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 14,
      color: Colors.text,
      lineHeight: 20,
    },
    hUnit: {
      fontFamily: "Poppins_400Regular",
      fontSize: 12,
      color: Colors.textMuted,
    },
    hBottom: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 6,
    },
    hPrice: {
      fontFamily: "Poppins_700Bold",
      fontSize: 15,
      color: Colors.text,
    },
    hOriginal: {
      fontFamily: "Poppins_400Regular",
      fontSize: 11,
      color: Colors.textMuted,
      textDecorationLine: "line-through",
    },
    addBtnSm: {
      width: 32,
      height: 32,
      backgroundColor: Colors.primary,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
  });
};
