import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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

function SubcategoryChip({
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
            <Ionicons name={icon as any} size={14} color={isActive ? "#fff" : chipColor} />
          </View>
        )}
        {!icon && (
          <View style={[chipStyles.iconWrap, { backgroundColor: isActive ? "rgba(255,255,255,0.22)" : isDarkMode ? "rgba(255,255,255,0.08)" : "#F0FDF4" }]}>
            <Ionicons name="grid" size={14} color={isActive ? "#fff" : "#16A34A"} />
          </View>
        )}
        <Text style={[chipStyles.chipText, { color: isActive ? "#fff" : isDarkMode ? "#E4E4E7" : "#374151" }]}>
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

export default function CategoryDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const { products: allProducts, categories, subcategories } = useApp();
  const { items } = useCart();
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "price_asc" | "price_desc">("default");

  const category = categories.find((c) => c.id === id);
  const catSubcategories = subcategories.filter((s) => s.categoryId === id);
  const accentColor = category?.color ?? "#16A34A";
  const accentBg = category?.bgColor ?? "#F0FDF4";

  const convertToProduct = (p: any): Product => ({
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
  });

  const filtered = useMemo(() => {
    let list = allProducts.filter((p) => p.category === id);
    if (activeSubcategory) {
      list = list.filter((p) => (p as any).subcategoryId === activeSubcategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (sortBy === "price_asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sortBy === "price_desc") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [allProducts, id, activeSubcategory, search, sortBy]);

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
        <View style={styles.headerTop}>
          <Pressable
            style={[styles.backBtn, {
              backgroundColor: isDarkMode ? "rgba(28,28,30,0.7)" : "rgba(255,255,255,0.75)",
              borderColor: isDarkMode ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.9)",
            }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </Pressable>

          <View style={styles.titleBlock}>
            <View style={[styles.catIconWrap, { backgroundColor: isDarkMode ? accentColor + "25" : accentBg }]}>
              <Ionicons name={(category?.icon as any) ?? "grid"} size={22} color={accentColor} />
            </View>
            <View>
              <Text style={[styles.catName, { color: Colors.text }]}>{category?.name ?? "Kategoriya"}</Text>
              <Text style={[styles.catCount, { color: Colors.textSecondary }]}>
                {allProducts.filter(p => p.category === id).length} ta mahsulot
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <Animated.View style={sortAnim}>
              <Pressable
                style={[styles.iconBtn, {
                  backgroundColor: sortBy !== "default" ? accentColor : isDarkMode ? "rgba(28,28,30,0.7)" : "rgba(255,255,255,0.75)",
                  borderColor: sortBy !== "default" ? accentColor : isDarkMode ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.9)",
                }]}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  sortScale.value = withSpring(0.85, { damping: 10 }, () => { sortScale.value = withSpring(1, { damping: 12 }); });
                  setSortBy(prev => prev === "default" ? "price_asc" : prev === "price_asc" ? "price_desc" : "default");
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
                  backgroundColor: isDarkMode ? "rgba(28,28,30,0.7)" : "rgba(255,255,255,0.75)",
                  borderColor: isDarkMode ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.9)",
                }]}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/(tabs)/cart");
                }}
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

        {/* Search */}
        <View style={[styles.searchBar, {
          backgroundColor: isDarkMode ? "rgba(28,28,30,0.7)" : "rgba(255,255,255,0.75)",
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

        {/* Subcategory chips — only if subcategories exist */}
        {catSubcategories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
            contentContainerStyle={styles.chipContent}
          >
            <SubcategoryChip
              label="Barchasi"
              isActive={!activeSubcategory}
              onPress={() => setActiveSubcategory(null)}
              isDarkMode={isDarkMode}
              color={accentColor}
              bgColor={accentBg}
              count={allProducts.filter(p => p.category === id).length}
            />
            {catSubcategories.map((sub) => {
              const subCount = allProducts.filter(p => (p as any).subcategoryId === sub.id).length;
              return (
                <SubcategoryChip
                  key={sub.id}
                  label={sub.name}
                  icon={sub.icon}
                  color={sub.color}
                  bgColor={sub.bgColor}
                  count={subCount}
                  isActive={activeSubcategory === sub.id}
                  onPress={() => setActiveSubcategory(activeSubcategory === sub.id ? null : sub.id)}
                  isDarkMode={isDarkMode}
                />
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Products grid */}
      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconBox, {
            backgroundColor: isDarkMode ? "rgba(28,28,30,0.65)" : "rgba(255,255,255,0.72)",
            borderColor: isDarkMode ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.85)",
          }]}>
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
              {filtered.length} ta mahsulot
              {activeSubcategory && catSubcategories.length > 0
                ? ` · ${catSubcategories.find(s => s.id === activeSubcategory)?.name ?? ""}`
                : ""}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
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
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  catName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    lineHeight: 20,
  },
  catCount: {
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
    borderWidth: 2,
    borderColor: "transparent",
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
    marginBottom: 10,
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
});
