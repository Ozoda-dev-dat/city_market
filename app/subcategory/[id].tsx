import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Platform,
  TextInput,
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

export default function SubcategoryProductsScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const { products: allProducts, categories, subcategories } = useApp();
  const { items } = useCart();
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "price_asc" | "price_desc">("default");

  const subcategory = subcategories.find((s) => s.id === id);
  const parentCategory = categories.find((c) => c.id === subcategory?.categoryId);

  const accentColor = subcategory?.color || parentCategory?.color || "#16A34A";
  const accentBg = subcategory?.bgColor || parentCategory?.bgColor || "#F0FDF4";

  const filtered = useMemo(() => {
    let list = allProducts.filter((p) => (p as any).subcategoryId === id);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (sortBy === "price_asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sortBy === "price_desc") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [allProducts, id, search, sortBy]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bgColors: [string, string, string] = isDarkMode
    ? ["#0a1f12", "#0f0f12", "#0C0C0E"]
    : ["#d4ede0", "#eaf4ee", "#F5F6F5"];

  const sortScale = useSharedValue(1);
  const sortAnim = useAnimatedStyle(() => ({ transform: [{ scale: sortScale.value }] }));
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
            {/* Breadcrumb */}
            {parentCategory && (
              <Pressable style={styles.breadcrumb} onPress={() => router.back()}>
                <Ionicons name={(parentCategory.icon as any) ?? "grid"} size={13} color={Colors.textMuted} />
                <Text style={[styles.breadcrumbText, { color: Colors.textMuted }]}>{parentCategory.name}</Text>
                <Ionicons name="chevron-forward" size={13} color={Colors.textMuted} />
              </Pressable>
            )}
            <View style={styles.titleRow}>
              <View style={[styles.subIconWrap, { backgroundColor: isDarkMode ? accentColor + "28" : accentBg }]}>
                <Ionicons name={(subcategory?.icon as any) ?? "grid"} size={18} color={accentColor} />
              </View>
              <Text style={[styles.subName, { color: Colors.text }]} numberOfLines={1}>
                {subcategory?.name ?? "Bo'lim"}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <Animated.View style={sortAnim}>
              <Pressable
                style={[styles.iconBtn, {
                  backgroundColor: sortBy !== "default" ? accentColor : isDarkMode ? "rgba(28,28,30,0.75)" : "rgba(255,255,255,0.8)",
                  borderColor: sortBy !== "default" ? accentColor : isDarkMode ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.9)",
                }]}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  sortScale.value = withSpring(0.85, { damping: 10 }, () => {
                    sortScale.value = withSpring(1, { damping: 12 });
                  });
                  setSortBy(prev =>
                    prev === "default" ? "price_asc" :
                    prev === "price_asc" ? "price_desc" : "default"
                  );
                }}
              >
                <Ionicons
                  name={sortBy === "price_asc" ? "arrow-up" : sortBy === "price_desc" ? "arrow-down" : "swap-vertical"}
                  size={18}
                  color={sortBy !== "default" ? "#fff" : Colors.text}
                />
              </Pressable>
            </Animated.View>

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

        {/* Search bar */}
        <View style={[styles.searchBar, {
          backgroundColor: isDarkMode ? "rgba(28,28,30,0.7)" : "rgba(255,255,255,0.8)",
          borderColor: isDarkMode ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.9)",
        }]}>
          <View style={[styles.searchIconWrap, { backgroundColor: isDarkMode ? accentColor + "30" : accentBg }]}>
            <Ionicons name="search" size={16} color={accentColor} />
          </View>
          <TextInput
            style={[styles.searchInput, { color: Colors.text }]}
            placeholder="Mahsulot qidirish..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Products */}
      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconBox, {
            backgroundColor: isDarkMode ? "rgba(28,28,30,0.65)" : "rgba(255,255,255,0.72)",
            borderColor: isDarkMode ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.85)",
          }]}>
            <Ionicons name="cube-outline" size={32} color={Colors.textMuted} />
          </View>
          <Text style={[styles.emptyTitle, { color: Colors.text }]}>Mahsulot topilmadi</Text>
          <Text style={[styles.emptySubtitle, { color: Colors.textSecondary }]}>
            {search ? "Qidiruv natijasi bo'sh" : "Bu bo'limda hali mahsulot yo'q"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
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
            <View style={styles.resultsRow}>
              <Text style={[styles.resultsCount, { color: Colors.textSecondary }]}>
                {filtered.length} ta mahsulot
              </Text>
              {sortBy !== "default" && (
                <View style={[styles.sortBadge, { backgroundColor: accentColor + "18" }]}>
                  <Ionicons
                    name={sortBy === "price_asc" ? "arrow-up" : "arrow-down"}
                    size={12}
                    color={accentColor}
                  />
                  <Text style={[styles.sortBadgeText, { color: accentColor }]}>
                    {sortBy === "price_asc" ? "Arzon avval" : "Qimmat avval"}
                  </Text>
                </View>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
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
    gap: 3,
  },
  breadcrumb: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  breadcrumbText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  subIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  subName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    flex: 1,
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
  searchBar: {
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 10,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  searchIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  searchInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
  },
  grid: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  row: {
    gap: 12,
    marginBottom: 12,
  },
  resultsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  resultsCount: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    flex: 1,
  },
  sortBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  sortBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
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
