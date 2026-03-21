import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import getColors from "@/constants/colors";
import { BANNERS, formatPrice } from "@/constants/data";
import { ProductCard } from "@/components/ProductCard";
import { useApp } from "@/context/ProductsContext";
import { useCart } from "@/context/CartContext";
import { useTheme } from "@/context/ThemeContext";
import { Product as SchemaProduct } from "@/shared/schema";
import { Product } from "@/constants/data";

const { width } = Dimensions.get("window");

// Convert SchemaProduct to Product for ProductCard compatibility
const convertToProduct = (schemaProduct: SchemaProduct): Product => ({
  id: schemaProduct.id,
  name: schemaProduct.name,
  category: schemaProduct.category,
  price: schemaProduct.price,
  originalPrice: schemaProduct.originalPrice || undefined,
  unit: schemaProduct.unit,
  image: schemaProduct.image,
  badge: schemaProduct.badge as "sale" | "new" | "hot" | undefined,
  rating: parseFloat(schemaProduct.rating || "5.0") as number,
  description: schemaProduct.description || "",
  brand: schemaProduct.brand || undefined,
  weight: schemaProduct.weight || undefined,
  inStock: schemaProduct.inStock,
  stockQuantity: schemaProduct.stockQuantity,
});

function Banner({ item }: { item: (typeof BANNERS)[0] }) {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  
  return (
    <LinearGradient
      colors={[item.color, item.lightColor]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.bannerGradient}
    >
      <View style={styles.bannerContent}>
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
          <Text style={styles.bannerTitle}>{item.title}</Text>
          <Pressable style={styles.bannerBtn}>
            <Text style={styles.bannerBtnText}>Xarid qilish</Text>
          </Pressable>
        </View>
        <Text style={styles.bannerEmoji}>{item.emoji}</Text>
      </View>
    </LinearGradient>
  );
}

function CategoryPill({ item, onPress }: { item: any; onPress: () => void }) {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        style={styles.categoryPill}
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.95); }}
        onPressOut={() => { scale.value = withSpring(1); }}
      >
        <View style={[styles.categoryIcon, { backgroundColor: item.bgColor }]}>
          <Ionicons name={item.icon as any} size={20} color={item.color} />
        </View>
        <Text style={styles.categoryName}>{item.name}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<FlatList>(null);
  const [activeBanner, setActiveBanner] = useState(0);
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const styles = getStyles(isDarkMode);

  const { products, categories } = useApp();
  const { addToCart } = useCart();
  
  const handleAddToCart = (product: any) => {
    if (!product.inStock) {
      Alert.alert("Xatolik", "Ushbu mahsulot vaqtincha tugagan");
      return;
    }
    
    // Convert to SchemaProduct for cart compatibility
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
      isActive: true,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    addToCart(productForCart);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };
  const featuredProducts = products.filter((p) => p.badge === "hot" || p.badge === "new");
  const saleProducts = products.filter((p) => p.badge === "sale");

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBanner((prev) => {
        const next = (prev + 1) % BANNERS.length;
        scrollRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: topPadding + 12 }]}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Xayrli kun</Text>
          <Text style={styles.storeName}>City market</Text>
        </View>
        <Pressable style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={22} color={Colors.text} />
        </Pressable>
      </View>

      <Pressable
        style={styles.searchBar}
        onPress={() => router.push("/(tabs)/catalog")}
      >
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
        <Text style={styles.searchPlaceholder}>Mahsulot qidirish...</Text>
        <View style={styles.searchFilter}>
          <Ionicons name="options-outline" size={16} color={Colors.primary} />
        </View>
      </Pressable>

      <FlatList
        ref={scrollRef}
        data={BANNERS}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / (width - 32));
          setActiveBanner(index);
        }}
        renderItem={({ item }) => <Banner item={item} />}
        style={styles.bannerList}
      />
      <View style={styles.bannerDots}>
        {BANNERS.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === activeBanner && styles.dotActive]}
          />
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Kategoriyalar</Text>
        <Pressable onPress={() => router.push("/(tabs)/catalog")}>
          <Text style={styles.seeAll}>Barchasini ko&apos;rish</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
        {categories.map((cat) => (
          <CategoryPill
            key={cat.id}
            item={cat}
            onPress={() => router.push({ pathname: "/(tabs)/catalog", params: { category: cat.id } })}
          />
        ))}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tavsiya etilgan</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productsScroll}>
        {featuredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={convertToProduct(product)}
            onPress={() => router.push({ pathname: "/product/[id]", params: { id: product.id } })}
          />
        ))}
      </ScrollView>

      {saleProducts.length > 0 && (
        <>
          <View style={[styles.sectionHeader, { marginTop: 8 }]}>
            <Text style={styles.sectionTitle}>Chegirmali</Text>
            <View style={styles.saleBadge}>
              <Ionicons name="pricetag" size={12} color="#fff" />
              <Text style={styles.saleBadgeText}>30% gacha chegirma</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productsScroll}>
            {saleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={convertToProduct(product)}
                onPress={() => router.push({ pathname: "/product/[id]", params: { id: product.id } })}
              />
            ))}
          </ScrollView>
        </>
      )}

      <View style={{ height: Platform.OS === "web" ? 34 : 90 }} />
    </ScrollView>
  );
}

const getStyles = (isDarkMode: boolean) => {
  const Colors = getColors(isDarkMode);
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    content: {
      paddingHorizontal: 16,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 16,
    },
    greeting: {
      fontFamily: "Poppins_400Regular",
      fontSize: 13,
      color: Colors.textSecondary,
    },
    storeName: {
      fontFamily: "Poppins_700Bold",
      fontSize: 26,
      color: Colors.text,
      lineHeight: 32,
    },
    notifBtn: {
      width: 42,
      height: 42,
      backgroundColor: Colors.glass,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 6,
        },
      }),
    },
    searchBar: {
      backgroundColor: Colors.glass,
      borderRadius: 16,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    searchPlaceholder: {
      flex: 1,
      fontFamily: "Poppins_400Regular",
      fontSize: 15,
      color: Colors.textMuted,
    },
    searchFilter: {
      width: 36,
      height: 36,
      backgroundColor: Colors.primaryLight,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    bannerList: {
      marginHorizontal: -16,
    },
    bannerGradient: {
      width: width - 32,
      height: 180,
      borderRadius: 24,
      marginHorizontal: 16,
      overflow: "hidden",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
        },
        android: {
          elevation: 12,
        },
      }),
    },
    bannerContent: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 24,
      paddingVertical: 20,
    },
    bannerTextContainer: {
      flex: 1,
      gap: 8,
    },
    bannerSubtitle: {
      fontFamily: "Poppins_500Medium",
      fontSize: 14,
      color: Colors.textInverse,
      opacity: 0.9,
    },
    bannerTitle: {
      fontFamily: "Poppins_700Bold",
      fontSize: 22,
      color: Colors.textInverse,
      lineHeight: 28,
    },
    bannerBtn: {
      backgroundColor: Colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12,
      alignSelf: "flex-start",
    },
    bannerBtnText: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 12,
      color: Colors.textInverse,
    },
    bannerEmoji: {
      fontSize: 48,
    },
    bannerDots: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 6,
      marginTop: 16,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: Colors.divider,
    },
    dotActive: {
      backgroundColor: Colors.primary,
      width: 20,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 24,
      marginBottom: 16,
    },
    sectionTitle: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 18,
      color: Colors.text,
    },
    seeAll: {
      fontFamily: "Poppins_500Medium",
      fontSize: 14,
      color: Colors.primary,
    },
    categoriesScroll: {
      marginBottom: 8,
    },
    categoryPill: {
      alignItems: "center",
      gap: 8,
      marginRight: 16,
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: Colors.glass,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    categoryIcon: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    categoryName: {
      fontFamily: "Poppins_500Medium",
      fontSize: 13,
      color: Colors.text,
      textAlign: "center",
    },
    productsScroll: {
      gap: 12,
    },
    saleBadge: {
      position: "absolute",
      top: 8,
      left: 8,
      backgroundColor: Colors.error,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    saleBadgeText: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 10,
      color: Colors.textInverse,
    },
  });
}
