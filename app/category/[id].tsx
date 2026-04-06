import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import getColors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { ProductCard } from "@/components/ProductCard";
import { useApp } from "@/context/ProductsContext";
import { useCart } from "@/context/CartContext";
import { Product } from "@/constants/data";

function SubcategoryCard({
  sub,
  productCount,
  isDarkMode,
  onPress,
}: {
  sub: any;
  productCount: number;
  isDarkMode: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const color = sub.color || "#16A34A";
  const bgColor = sub.bgColor || "#F0FDF4";
  const gradStart = color + (isDarkMode ? "40" : "22");
  const gradEnd = color + (isDarkMode ? "08" : "05");

  return (
    <Animated.View style={[scStyles.card, anim]}>
      <Pressable
        style={{ flex: 1 }}
        onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={() => { scale.value = withSpring(0.93, { damping: 11 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
      >
        <View style={[
          scStyles.inner,
          {
            backgroundColor: isDarkMode ? "rgba(28,28,30,0.9)" : "#fff",
            borderColor: isDarkMode ? color + "30" : color + "28",
          }
        ]}>
          <LinearGradient
            colors={[gradStart, gradEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            borderRadius={20}
          />
          <View style={[scStyles.iconWrap, { backgroundColor: color + (isDarkMode ? "28" : "18") }]}>
            <Ionicons name={(sub.icon as any) ?? "grid-outline"} size={30} color={color} />
          </View>
          <View style={{ flex: 1, gap: 5 }}>
            <Text style={[scStyles.name, { color: isDarkMode ? "#F4F4F5" : "#111827" }]} numberOfLines={2}>
              {sub.name}
            </Text>
            <View style={[scStyles.countBadge, { backgroundColor: color + (isDarkMode ? "28" : "15") }]}>
              <Ionicons name="cube-outline" size={11} color={color} />
              <Text style={[scStyles.countText, { color }]}>{productCount} ta mahsulot</Text>
            </View>
          </View>
          <View style={[scStyles.arrowBtn, { backgroundColor: color + (isDarkMode ? "22" : "12") }]}>
            <Ionicons name="arrow-forward" size={15} color={color} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const scStyles = StyleSheet.create({
  card: {
    width: "48.5%" as any,
    marginBottom: 12,
  },
  inner: {
    borderRadius: 20,
    padding: 16,
    gap: 10,
    borderWidth: 1.5,
    minHeight: 138,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 4,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    lineHeight: 20,
  },
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  countText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
  },
  arrowBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
  },
});

function convertToProduct(p: any): Product {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    brand: p.brand,
    price: p.price,
    originalPrice: p.originalPrice || undefined,
    unit: p.unit,
    image: p.image,
    badge: p.badge,
    rating: parseFloat(p.rating || "5.0"),
    description: p.description || "",
    weight: p.weight,
    inStock: p.inStock,
    stockQuantity: p.stockQuantity,
  };
}

export default function CategoryDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const { products: allProducts, categories, subcategories } = useApp();
  const { items } = useCart();
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const category = categories.find((c) => c.id === id);
  const catSubcategories = subcategories.filter((s) => s.categoryId === id);
  const hasSubcategories = catSubcategories.length > 0;
  const accentColor = category?.color ?? "#16A34A";
  const accentBg = category?.bgColor ?? "#F0FDF4";

  const directProducts = useMemo(
    () => allProducts.filter((p) => p.category === id),
    [allProducts, id]
  );

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bgColors: [string, string, string] = isDarkMode
    ? ["#0a1f12", "#0f0f12", "#0C0C0E"]
    : ["#d4ede0", "#eaf4ee", "#F5F6F5"];

  const cartScale = useSharedValue(1);
  const cartAnim = useAnimatedStyle(() => ({ transform: [{ scale: cartScale.value }] }));

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={bgColors} locations={[0, 0.25, 1]} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerRow}>
          <Pressable
            style={[styles.backBtn, {
              backgroundColor: isDarkMode ? "rgba(28,28,30,0.75)" : "rgba(255,255,255,0.8)",
              borderColor: isDarkMode ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.9)",
            }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </Pressable>

          <View style={styles.titleBlock}>
            <View style={[styles.catIconWrap, { backgroundColor: isDarkMode ? accentColor + "28" : accentBg }]}>
              <Ionicons name={(category?.icon as any) ?? "grid"} size={22} color={accentColor} />
            </View>
            <View>
              <Text style={[styles.catName, { color: Colors.text }]}>{category?.name ?? "Kategoriya"}</Text>
              <Text style={[styles.catSub, { color: Colors.textSecondary }]}>
                {hasSubcategories
                  ? `${catSubcategories.length} ta bo'lim`
                  : `${directProducts.length} ta mahsulot`}
              </Text>
            </View>
          </View>

          <Animated.View style={cartAnim}>
            <Pressable
              style={[styles.iconBtn, {
                backgroundColor: isDarkMode ? "rgba(28,28,30,0.75)" : "rgba(255,255,255,0.8)",
                borderColor: isDarkMode ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.9)",
              }]}
              onPress={() => router.push("/(tabs)/cart")}
              onPressIn={() => { cartScale.value = withSpring(0.88, { damping: 12 }); }}
              onPressOut={() => { cartScale.value = withSpring(1, { damping: 12 }); }}
            >
              <Ionicons name="bag-outline" size={20} color={Colors.text} />
              {cartCount > 0 && (
                <View style={[styles.cartBadge, { backgroundColor: accentColor }]}>
                  <Text style={styles.cartBadgeText}>{cartCount > 9 ? "9+" : cartCount}</Text>
                </View>
              )}
            </Pressable>
          </Animated.View>
        </View>
      </View>

      {/* CASE 1: Has subcategories → show subcategory cards */}
      {hasSubcategories ? (
        <ScrollView
          contentContainerStyle={[styles.grid, { paddingBottom: Platform.OS === "web" ? 100 : 120 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Subcategory header banner */}
          <View style={[styles.sectionBanner, {
            backgroundColor: isDarkMode ? "rgba(28,28,30,0.6)" : "rgba(255,255,255,0.6)",
            borderColor: isDarkMode ? "rgba(255,255,255,0.07)" : accentColor + "20",
          }]}>
            <LinearGradient
              colors={isDarkMode
                ? [accentColor + "25", "transparent"]
                : [accentColor + "12", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
              borderRadius={16}
            />
            <View style={[styles.sectionBannerIcon, { backgroundColor: accentColor + "22" }]}>
              <Ionicons name="apps" size={20} color={accentColor} />
            </View>
            <View>
              <Text style={[styles.sectionBannerTitle, { color: Colors.text }]}>Bo'limlar</Text>
              <Text style={[styles.sectionBannerSub, { color: Colors.textSecondary }]}>
                Kerakli bo'limni tanlang
              </Text>
            </View>
          </View>

          <View style={styles.cardGrid}>
            {catSubcategories.map((sub) => {
              const count = allProducts.filter((p) => (p as any).subcategoryId === sub.id).length;
              return (
                <SubcategoryCard
                  key={sub.id}
                  sub={sub}
                  productCount={count}
                  isDarkMode={isDarkMode}
                  onPress={() =>
                    router.push({ pathname: "/subcategory/[id]", params: { id: sub.id } })
                  }
                />
              );
            })}
          </View>

          {/* Also show all products of this category below */}
          {directProducts.length > 0 && (
            <>
              <View style={[styles.allProductsBanner, {
                backgroundColor: isDarkMode ? "rgba(28,28,30,0.6)" : "rgba(255,255,255,0.6)",
                borderColor: isDarkMode ? "rgba(255,255,255,0.07)" : accentColor + "20",
              }]}>
                <LinearGradient
                  colors={isDarkMode
                    ? [accentColor + "25", "transparent"]
                    : [accentColor + "12", "transparent"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                  borderRadius={16}
                />
                <View style={[styles.sectionBannerIcon, { backgroundColor: accentColor + "22" }]}>
                  <Ionicons name="grid" size={20} color={accentColor} />
                </View>
                <View>
                  <Text style={[styles.sectionBannerTitle, { color: Colors.text }]}>Barcha mahsulotlar</Text>
                  <Text style={[styles.sectionBannerSub, { color: Colors.textSecondary }]}>
                    {directProducts.length} ta mahsulot
                  </Text>
                </View>
              </View>
              <View style={styles.productRow}>
                {directProducts.map((p) => (
                  <View key={p.id} style={styles.productCol}>
                    <ProductCard
                      product={convertToProduct(p)}
                      onPress={() => router.push({ pathname: "/product/[id]", params: { id: p.id } })}
                    />
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      ) : (
        /* CASE 2: No subcategories → show products directly */
        directProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconBox, {
              backgroundColor: isDarkMode ? "rgba(28,28,30,0.65)" : "rgba(255,255,255,0.72)",
              borderColor: isDarkMode ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.85)",
            }]}>
              <Ionicons name="cube-outline" size={32} color={Colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: Colors.text }]}>Mahsulot yo'q</Text>
            <Text style={[styles.emptySubtitle, { color: Colors.textSecondary }]}>
              Bu kategoriyada hali mahsulot qo'shilmagan
            </Text>
          </View>
        ) : (
          <FlatList
            data={directProducts}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={[styles.grid, { paddingBottom: Platform.OS === "web" ? 100 : 120 }]}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <ProductCard
                product={convertToProduct(item)}
                onPress={() => router.push({ pathname: "/product/[id]", params: { id: item.id } })}
              />
            )}
            ListHeaderComponent={
              <Text style={[styles.resultsCount, { color: Colors.textSecondary }]}>
                {directProducts.length} ta mahsulot
              </Text>
            }
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  titleBlock: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  catIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  catName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    lineHeight: 20,
  },
  catSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 10,
    color: "#fff",
  },
  grid: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  sectionBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  allProductsBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    marginTop: 8,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionBannerIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionBannerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    lineHeight: 20,
  },
  sectionBannerSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
  },
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  productRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 0,
  },
  productCol: {
    width: "48.5%" as any,
    marginBottom: 12,
  },
  row: {
    gap: 12,
    marginBottom: 12,
  },
  resultsCount: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    marginBottom: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingBottom: 100,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
  },
  emptySubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    textAlign: "center",
  },
});
