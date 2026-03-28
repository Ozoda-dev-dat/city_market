import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Alert,
  Image,
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
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const styles = getStyles(isDarkMode);
  
  // Convert Product to SchemaProduct for cart operations
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

  const isValidImageUri = (uri: string) =>
    uri && (uri.startsWith("http") || uri.startsWith("data:image"));

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
            {isValidImageUri(product.image) ? (
              <Image 
                source={{ uri: product.image }} 
                style={styles.horizontalProductImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.horizontalProductImage, styles.imageFallback]}>
                <Text style={styles.fallbackText}>{product.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
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
          {isValidImageUri(product.image) ? (
            <Image 
              source={{ uri: product.image }} 
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.productImage, styles.imageFallback]}>
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
                  <Ionicons name={product.inStock ? "add" : "close"} size={20} color="#fff" />
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
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  imageContainer: {
    height: 110,
    backgroundColor: Colors.glass,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  imageFallback: {
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackText: {
    fontSize: 36,
    fontFamily: "Poppins_700Bold",
    color: "#1A9B5C",
    textTransform: "uppercase",
  },
  productImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  horizontalProductImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
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
    backgroundColor: Colors.glass,
    borderRadius: 12,
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
    backgroundColor: Colors.glass,
    borderRadius: 8,
    padding: 3,
    gap: 6,
  },
  qtyBtnSmall: {
    width: 22,
    height: 22,
    backgroundColor: Colors.glass,
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
};
