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

function CategoryChip({
  label,
  icon,
  isActive,
  onPress,
  isDarkMode,
}: {
  label: string;
  icon?: string;
  isActive: boolean;
  onPress: () => void;
  isDarkMode: boolean;
}) {
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
        style={[
          chipStyles.chip,
          isActive
            ? chipStyles.chipActive
            : {
                backgroundColor: isDarkMode ? "rgba(28,28,30,0.65)" : "rgba(255,255,255,0.72)",
                borderColor: isDarkMode ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.85)",
              },
        ]}
      >
        {icon && (
          <Ionicons
            name={icon as any}
            size={13}
            color={isActive ? "#fff" : isDarkMode ? "#A1A1AA" : "#6B7280"}
          />
        )}
        <Text style={[chipStyles.chipText, isActive && chipStyles.chipTextActive]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  chipActive: {
    backgroundColor: "#16A34A",
    borderColor: "#16A34A",
    shadowColor: "#16A34A",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  chipText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "#6B7280",
  },
  chipTextActive: {
    color: "#fff",
  },
});

export default function CatalogScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ category?: string }>();
  const [activeCategory, setActiveCategory] = useState<string | null>(params.category ?? null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "price_asc" | "price_desc">("default");
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const { products: allProducts } = useProducts();
  const { categories } = useApp();

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
  }, [activeCategory, search, sortBy, allProducts]);

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
        <Text style={[styles.title, { color: Colors.text }]}>Katalog</Text>

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
          />
          {categories.map((cat: any) => (
            <CategoryChip
              key={cat.id}
              label={cat.name}
              icon={cat.icon}
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
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    marginBottom: 14,
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
});
