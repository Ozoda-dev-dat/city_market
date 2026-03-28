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
  withTiming,
  interpolate,
  Extrapolation,
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

function BannerDot({ isActive, isDarkMode }: { isActive: boolean; isDarkMode: boolean }) {
  const w = useSharedValue(isActive ? 22 : 7);
  const op = useSharedValue(isActive ? 1 : 0.35);

  useEffect(() => {
    w.value = withSpring(isActive ? 22 : 7, { damping: 14, stiffness: 140 });
    op.value = withTiming(isActive ? 1 : 0.35, { duration: 220 });
  }, [isActive]);

  const style = useAnimatedStyle(() => ({ width: w.value, opacity: op.value }));
  return <Animated.View style={[styles.dot, { backgroundColor: "#16A34A" }, style]} />;
}

function Banner({ item }: { item: (typeof BANNERS)[0] }) {
  const { isDarkMode } = useTheme();
  return (
    <LinearGradient
      colors={[item.color, item.lightColor]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={bannerStyles.gradient}
    >
      <View style={bannerStyles.noise} />
      <View style={bannerStyles.content}>
        <View style={bannerStyles.textSide}>
          <Text style={bannerStyles.subtitle}>{item.subtitle}</Text>
          <Text style={bannerStyles.title}>{item.title}</Text>
          <View style={bannerStyles.pill}>
            <Text style={bannerStyles.pillText}>Xarid qilish</Text>
            <Ionicons name="arrow-forward" size={12} color="#fff" />
          </View>
        </View>
        <View style={bannerStyles.iconWrap}>
          <View style={bannerStyles.iconInner}>
            <Ionicons name={(item as any).icon as any} size={46} color="rgba(255,255,255,0.95)" />
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const bannerStyles = StyleSheet.create({
  gradient: {
    width: width - 40,
    height: 176,
    borderRadius: 28,
    marginHorizontal: 20,
    overflow: "hidden",
  },
  noise: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 22,
  },
  textSide: { flex: 1, gap: 6 },
  subtitle: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: "#fff",
    lineHeight: 26,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    marginTop: 4,
  },
  pillText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#fff",
  },
  iconWrap: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  iconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
});

function CategoryPill({ item, onPress, isDarkMode }: { item: any; onPress: () => void; isDarkMode: boolean }) {
  const Colors = getColors(isDarkMode);
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={anim}>
      <Pressable
        onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={() => { scale.value = withSpring(0.92, { damping: 12 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
      >
        <View style={[
          catStyles.card,
          {
            backgroundColor: isDarkMode ? "rgba(28,28,30,0.65)" : "rgba(255,255,255,0.72)",
            borderColor: isDarkMode ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.85)",
          }
        ]}>
          <View style={[catStyles.iconCircle, { backgroundColor: item.bgColor }]}>
            <Ionicons name={item.icon as any} size={20} color={item.color} />
          </View>
          <Text style={[catStyles.label, { color: Colors.textSecondary }]} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const catStyles = StyleSheet.create({
  card: {
    alignItems: "center",
    gap: 7,
    marginRight: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 74,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    textAlign: "center",
    maxWidth: 66,
  },
});

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<FlatList>(null);
  const [activeBanner, setActiveBanner] = useState(0);
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);

  const { products, categories } = useApp();
  const { addToCart } = useCart();

  const notifScale = useSharedValue(1);
  const notifAnim = useAnimatedStyle(() => ({ transform: [{ scale: notifScale.value }] }));

  const handleAddToCart = (product: any) => {
    if (!product.inStock) {
      Alert.alert("Xatolik", "Ushbu mahsulot vaqtincha tugagan");
      return;
    }
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
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
  const bgColors: [string, string, string] = isDarkMode
    ? ["#0a1f12", "#0f0f12", "#0C0C0E"]
    : ["#d4ede0", "#eaf4ee", "#F5F6F5"];

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={bgColors}
        locations={[0, 0.3, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[
        styles.blobTR,
        { backgroundColor: isDarkMode ? "rgba(22,163,74,0.09)" : "rgba(22,163,74,0.14)" }
      ]} />
      <View style={[
        styles.blobBL,
        { backgroundColor: isDarkMode ? "rgba(22,163,74,0.04)" : "rgba(22,163,74,0.07)" }
      ]} />

      <ScrollView
        style={{ backgroundColor: "transparent" }}
        contentContainerStyle={[styles.content, { paddingTop: topPadding + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: Colors.textSecondary }]}>Xayrli kun</Text>
            <Text style={[styles.storeName, { color: Colors.text }]}>City market</Text>
          </View>
          <Animated.View style={notifAnim}>
            <Pressable
              style={[
                styles.notifBtn,
                {
                  backgroundColor: isDarkMode ? "rgba(28,28,30,0.7)" : "rgba(255,255,255,0.75)",
                  borderColor: isDarkMode ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.9)",
                }
              ]}
              onPressIn={() => { notifScale.value = withSpring(0.88); }}
              onPressOut={() => { notifScale.value = withSpring(1); }}
            >
              <Ionicons name="notifications-outline" size={21} color={Colors.text} />
            </Pressable>
          </Animated.View>
        </View>

        <Pressable
          style={[
            styles.searchBar,
            {
              backgroundColor: isDarkMode ? "rgba(28,28,30,0.7)" : "rgba(255,255,255,0.75)",
              borderColor: isDarkMode ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.9)",
            }
          ]}
          onPress={() => router.push("/(tabs)/catalog")}
        >
          <View style={[styles.searchIconWrap, { backgroundColor: isDarkMode ? "rgba(22,163,74,0.2)" : "rgba(22,163,74,0.1)" }]}>
            <Ionicons name="search" size={16} color="#16A34A" />
          </View>
          <Text style={[styles.searchPlaceholder, { color: Colors.textMuted }]}>
            Mahsulot qidirish...
          </Text>
          <View style={[styles.filterBtn, { backgroundColor: isDarkMode ? "rgba(22,163,74,0.18)" : "rgba(22,163,74,0.1)" }]}>
            <Ionicons name="options" size={14} color="#16A34A" />
          </View>
        </Pressable>

        <FlatList
          ref={scrollRef}
          data={BANNERS}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / (width - 40));
            setActiveBanner(index);
          }}
          renderItem={({ item }) => <Banner item={item} />}
          style={styles.bannerList}
          snapToInterval={width - 40}
          decelerationRate="fast"
        />
        <View style={styles.dotsRow}>
          {BANNERS.map((_, i) => (
            <BannerDot key={i} isActive={i === activeBanner} isDarkMode={isDarkMode} />
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Kategoriyalar</Text>
          <Pressable onPress={() => router.push("/(tabs)/catalog")}>
            <Text style={styles.seeAll}>Barchasini ko&apos;rish</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
          {categories.map((cat) => (
            <CategoryPill
              key={cat.id}
              item={cat}
              isDarkMode={isDarkMode}
              onPress={() => router.push({ pathname: "/(tabs)/catalog", params: { category: cat.id } })}
            />
          ))}
        </ScrollView>

        {featuredProducts.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: Colors.text }]}>Tavsiya etilgan</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={convertToProduct(product)}
                  onPress={() => router.push({ pathname: "/product/[id]", params: { id: product.id } })}
                />
              ))}
            </ScrollView>
          </>
        )}

        {saleProducts.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 8 }]}>
              <Text style={[styles.sectionTitle, { color: Colors.text }]}>Chegirmali</Text>
              <View style={styles.saleBadge}>
                <Ionicons name="pricetag" size={11} color="#fff" />
                <Text style={styles.saleBadgeText}>30% gacha</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
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

        {featuredProducts.length === 0 && saleProducts.length === 0 && products.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: Colors.text }]}>Barcha mahsulotlar</Text>
              <Pressable onPress={() => router.push("/(tabs)/catalog")}>
                <Text style={styles.seeAll}>Barchasini ko&apos;rish</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
              {products.slice(0, 8).map((product) => (
                <ProductCard
                  key={product.id}
                  product={convertToProduct(product)}
                  onPress={() => router.push({ pathname: "/product/[id]", params: { id: product.id } })}
                />
              ))}
            </ScrollView>
          </>
        )}

        <View style={{ height: Platform.OS === "web" ? 34 : 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  blobTR: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    top: -90,
    right: -70,
  },
  blobBL: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    bottom: 120,
    left: -80,
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
  },
  storeName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    lineHeight: 34,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    marginBottom: 22,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 6,
  },
  searchIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  searchPlaceholder: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
  },
  filterBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerList: {
    marginHorizontal: -16,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    marginTop: 14,
  },
  dot: {
    height: 7,
    borderRadius: 3.5,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 26,
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
  },
  seeAll: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#16A34A",
  },
  hScroll: {
    overflow: "visible",
  },
  saleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EF4444",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  saleBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: "#fff",
  },
});
