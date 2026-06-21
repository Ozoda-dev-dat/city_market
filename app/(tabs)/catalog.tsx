import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  FlatList,
  Platform,
  Image,
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
import { Product } from "@/constants/data";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/context/ProductsContext";
import { useApp } from "@/context/ProductsContext";
import { useCart } from "@/context/CartContext";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";

function CategoryChip({
  label,
  icon,
  color,
  bgColor,
  count,
  isActive,
  onPress,
  isDarkMode,
}: {
  label: string;
  icon?: string;
  color?: string;
  bgColor?: string;
  count?: number;
  isActive: boolean;
  onPress: () => void;
  isDarkMode: boolean;
}) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const chipColor = color || "#16A34A";
  const chipBg = bgColor || "#F0FDF4";

  return (
    <Animated.View style={anim}>
      <Pressable
        onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={() => { scale.value = withSpring(0.91, { damping: 11 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
        style={[
          chipStyles.chip,
          isActive
            ? [chipStyles.chipActive, { backgroundColor: chipColor, borderColor: chipColor, shadowColor: chipColor }]
            : {
                backgroundColor: isDarkMode ? "rgba(28,28,30,0.7)" : "rgba(255,255,255,0.85)",
                borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
              },
        ]}
      >
        {icon && (
          <View style={[
            chipStyles.iconWrap,
            { backgroundColor: isActive ? "rgba(255,255,255,0.22)" : isDarkMode ? "rgba(255,255,255,0.08)" : chipBg }
          ]}>
            <Ionicons
              name={icon as any}
              size={14}
              color={isActive ? "#fff" : chipColor}
            />
          </View>
        )}
        {!icon && (
          <View style={[chipStyles.iconWrap, { backgroundColor: isActive ? "rgba(255,255,255,0.22)" : isDarkMode ? "rgba(255,255,255,0.08)" : "#F0FDF4" }]}>
            <Ionicons name="grid" size={14} color={isActive ? "#fff" : "#16A34A"} />
          </View>
        )}
        <Text style={[
          chipStyles.chipText,
          { color: isActive ? "#fff" : isDarkMode ? "#E4E4E7" : "#374151" }
        ]}>
          {label}
        </Text>
        {count !== undefined && !isActive && (
          <View style={[chipStyles.countBadge, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.1)" : chipColor + "18" }]}>
            <Text style={[chipStyles.countText, { color: isDarkMode ? "rgba(255,255,255,0.5)" : chipColor }]}>
              {count}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  chipActive: {
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
  },
});

export default function CatalogScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ category?: string; storeId?: string }>();
  const [activeCategory, setActiveCategory] = useState<string | null>(params.category ?? null);
  const [activeStore, setActiveStore] = useState<string | null>(params.storeId ?? null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "price_asc" | "price_desc">("default");
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const { products: allProducts } = useProducts();
  const { categories } = useApp();
  const { items } = useCart();
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const { data: storesData } = useQuery({
    queryKey: ["/api/stores"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/stores");
      return res.json();
    },
    staleTime: 60000,
  });
  const stores: any[] = Array.isArray(storesData) ? storesData.filter((s: any) => s.isActive) : [];
  const cartScale = useSharedValue(1);
  const cartAnim = useAnimatedStyle(() => ({ transform: [{ scale: cartScale.value }] }));

  const sortScale = useSharedValue(1);
  const sortAnim = useAnimatedStyle(() => ({ transform: [{ scale: sortScale.value }] }));

  const convertToProduct = (schemaProduct: any): Product => ({
    id: schemaProduct.id,
    name: schemaProduct.name,
    category: schemaProduct.category,
    brand: schemaProduct.brand,
    price: schemaProduct.price,
    originalPrice: schemaProduct.originalPrice || undefined,
    unit: schemaProduct.unit,
    image: schemaProduct.image,
    badge: schemaProduct.badge,
    rating: parseFloat(schemaProduct.rating || "5.0"),
    description: schemaProduct.description || "",
    weight: schemaProduct.weight,
    inStock: schemaProduct.inStock,
    stockQuantity: schemaProduct.stockQuantity,
  });

  const filtered = useMemo(() => {
    let products = allProducts;
    if (activeStore) {
      products = products.filter((p: any) => p.storeId === activeStore);
    }
    if (activeCategory) {
      products = products.filter((p) => p.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      products = products.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (sortBy === "price_asc") {
      products = [...products].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_desc") {
      products = [...products].sort((a, b) => b.price - a.price);
    }
    return products;
  }, [activeStore, activeCategory, search, sortBy, allProducts]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bgColors: [string, string, string] = isDarkMode
    ? ["#0a1f12", "#0f0f12", "#0C0C0E"]
    : ["#d4ede0", "#eaf4ee", "#F5F6F5"];

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={bgColors} locations={[0, 0.25, 1]} style={StyleSheet.absoluteFill} />
      <View style={[
        styles.blobTR,
        { backgroundColor: isDarkMode ? "rgba(22,163,74,0.07)" : "rgba(22,163,74,0.11)" }
      ]} />

      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: Colors.text }]}>Katalog</Text>
          <Animated.View style={cartAnim}>
            <Pressable
              style={[
                styles.cartBtn,
                {
                  backgroundColor: isDarkMode ? "rgba(28,28,30,0.7)" : "rgba(255,255,255,0.75)",
                  borderColor: isDarkMode ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.9)",
                },
              ]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(tabs)/cart");
              }}
              onPressIn={() => { cartScale.value = withSpring(0.88, { damping: 12 }); }}
              onPressOut={() => { cartScale.value = withSpring(1, { damping: 12 }); }}
            >
              <Ionicons name="bag-outline" size={22} color={Colors.text} />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>
                    {cartCount > 99 ? "99+" : cartCount}
                  </Text>
                </View>
              )}
            </Pressable>
          </Animated.View>
        </View>

        <View style={styles.searchRow}>
          <View style={[
            styles.searchBar,
            {
              backgroundColor: isDarkMode ? "rgba(28,28,30,0.7)" : "rgba(255,255,255,0.75)",
              borderColor: isDarkMode ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.9)",
            }
          ]}>
            <View style={[styles.searchIconWrap, { backgroundColor: isDarkMode ? "rgba(22,163,74,0.2)" : "rgba(22,163,74,0.1)" }]}>
              <Ionicons name="search" size={16} color="#16A34A" />
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
          <Animated.View style={sortAnim}>
            <Pressable
              style={[
                styles.sortBtn,
                {
                  backgroundColor: sortBy !== "default"
                    ? "#16A34A"
                    : isDarkMode ? "rgba(28,28,30,0.7)" : "rgba(255,255,255,0.75)",
                  borderColor: sortBy !== "default"
                    ? "#16A34A"
                    : isDarkMode ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.9)",
                }
              ]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                sortScale.value = withSpring(0.85, { damping: 10 }, () => {
                  sortScale.value = withSpring(1, { damping: 12 });
                });
                setSortBy((prev) => {
                  if (prev === "default") return "price_asc";
                  if (prev === "price_asc") return "price_desc";
                  return "default";
                });
              }}
            >
              <Ionicons
                name={
                  sortBy === "price_asc"
                    ? "arrow-up"
                    : sortBy === "price_desc"
                    ? "arrow-down"
                    : "swap-vertical"
                }
                size={18}
                color={sortBy !== "default" ? "#fff" : Colors.text}
              />
            </Pressable>
          </Animated.View>
        </View>

        {stores.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.storeScroll}
            contentContainerStyle={styles.storeContent}
          >
            <Pressable
              style={[styles.storeChip, !activeStore && styles.storeChipActive]}
              onPress={() => setActiveStore(null)}
            >
              <View style={[styles.storeLogoBox, !activeStore && { backgroundColor: "rgba(255,255,255,0.25)" }]}>
                <Ionicons name="grid" size={14} color={!activeStore ? "#fff" : Colors.textMuted} />
              </View>
              <Text style={[styles.storeChipText, !activeStore && styles.storeChipTextActive]}>Barchasi</Text>
            </Pressable>
            {stores.map((store: any) => (
              <Pressable
                key={store.id}
                style={[styles.storeChip, activeStore === store.id && styles.storeChipActive]}
                onPress={() => setActiveStore(activeStore === store.id ? null : store.id)}
              >
                <View style={[styles.storeLogoBox, activeStore === store.id && { backgroundColor: "rgba(255,255,255,0.25)" }]}>
                  {store.logo ? (
                    <Image source={{ uri: store.logo }} style={{ width: 20, height: 20, borderRadius: 6 }} />
                  ) : (
                    <Ionicons name="storefront" size={14} color={activeStore === store.id ? "#fff" : Colors.primary} />
                  )}
                </View>
                <Text style={[styles.storeChipText, activeStore === store.id && styles.storeChipTextActive]} numberOfLines={1}>
                  {store.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chipContent}
        >
          <CategoryChip
            label="Barchasi"
            isActive={!activeCategory}
            onPress={() => setActiveCategory(null)}
            isDarkMode={isDarkMode}
            count={allProducts.length}
          />
          {categories.map((cat: any) => (
            <CategoryChip
              key={cat.id}
              label={cat.name}
              icon={cat.icon}
              color={cat.color}
              bgColor={cat.bgColor}
              count={cat.count}
              isActive={activeCategory === cat.id}
              onPress={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              isDarkMode={isDarkMode}
            />
          ))}
        </ScrollView>
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[
            styles.emptyIconBox,
            {
              backgroundColor: isDarkMode ? "rgba(28,28,30,0.65)" : "rgba(255,255,255,0.72)",
              borderColor: isDarkMode ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.85)",
            }
          ]}>
            <Ionicons name="search-outline" size={32} color={Colors.textMuted} />
          </View>
          <Text style={[styles.emptyTitle, { color: Colors.text }]}>Mahsulot topilmadi</Text>
          <Text style={[styles.emptySubtitle, { color: Colors.textSecondary }]}>
            Qidiruv yoki filtrni o&apos;zgartirib ko&apos;ring
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[
            styles.grid,
            { paddingBottom: Platform.OS === "web" ? 100 : 120 },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!filtered.length}
          renderItem={({ item }) => (
            <ProductCard
              product={convertToProduct(item)}
              onPress={() =>
                router.push({ pathname: "/product/[id]", params: { id: item.id } })
              }
            />
          )}
          ListHeaderComponent={
            <Text style={[styles.resultsCount, { color: Colors.textSecondary }]}>
              {filtered.length} ta mahsulot
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  blobTR: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -70,
    right: -60,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
  },
  cartBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
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
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "transparent",
  },
  cartBadgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 10,
    color: "#fff",
  },
  searchRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 10,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
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
  sortBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  chipScroll: {
    marginHorizontal: -16,
  },
  chipContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 10,
  },
  grid: {
    paddingHorizontal: 16,
    paddingTop: 8,
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
  storeScroll: {
    marginHorizontal: -16,
    marginBottom: 4,
  },
  storeContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 6,
  },
  storeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.75)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.07)",
  },
  storeChipActive: {
    backgroundColor: "#16A34A",
    borderColor: "#16A34A",
  },
  storeLogoBox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: "rgba(22,163,74,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  storeChipText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#374151",
    maxWidth: 100,
  },
  storeChipTextActive: {
    color: "#fff",
  },
});
