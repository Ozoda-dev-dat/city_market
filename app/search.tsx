import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Platform,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import getColors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { ProductCard } from "@/components/ProductCard";
import { useApp } from "@/context/ProductsContext";
import { useCart } from "@/context/CartContext";
import { Product } from "@/constants/data";
import { Product as SchemaProduct } from "@/shared/schema";
import { resolveImageUrl } from "@/lib/query-client";

function convertToProduct(p: SchemaProduct): Product {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    originalPrice: p.originalPrice || undefined,
    unit: p.unit,
    image: p.image,
    badge: p.badge as "sale" | "new" | "hot" | undefined,
    rating: parseFloat(p.rating || "5.0"),
    description: p.description || "",
    brand: p.brand || undefined,
    weight: p.weight || undefined,
    inStock: p.inStock,
    stockQuantity: p.stockQuantity,
  };
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const { products: allProducts } = useApp();
  const { items } = useCart();
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const [search, setSearch] = useState("");
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        (p.brand || "").toLowerCase().includes(q)
    );
  }, [allProducts, search]);

  const bgColors: [string, string, string] = isDarkMode
    ? ["#0a1f12", "#0f0f12", "#0C0C0E"]
    : ["#d4ede0", "#eaf4ee", "#F5F6F5"];

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={bgColors} style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <View style={styles.headerRow}>
          <Pressable
            style={[
              styles.backBtn,
              {
                backgroundColor: isDarkMode ? "rgba(28,28,30,0.75)" : "rgba(255,255,255,0.8)",
                borderColor: isDarkMode ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.9)",
              },
            ]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </Pressable>

          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: isDarkMode ? "rgba(28,28,30,0.7)" : "rgba(255,255,255,0.85)",
                borderColor: isDarkMode ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.9)",
              },
            ]}
          >
            <Ionicons name="search" size={16} color={Colors.primary} style={{ marginLeft: 4 }} />
            <TextInput
              ref={inputRef}
              autoFocus
              style={[styles.searchInput, { color: Colors.text }]}
              placeholder="Mahsulot yoki kategoriya..."
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              autoCorrect={false}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
              </Pressable>
            )}
          </View>

          <Pressable
            style={[
              styles.cartBtn,
              {
                backgroundColor: isDarkMode ? "rgba(28,28,30,0.75)" : "rgba(255,255,255,0.8)",
                borderColor: isDarkMode ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.9)",
              },
            ]}
            onPress={() => router.push("/(tabs)/cart")}
          >
            <Ionicons name="bag-outline" size={20} color={Colors.text} />
            {cartCount > 0 && (
              <View style={[styles.cartBadge, { backgroundColor: Colors.primary }]}>
                <Text style={styles.cartBadgeText}>{cartCount > 9 ? "9+" : cartCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Body */}
      {search.trim() === "" ? (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={52} color={Colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: Colors.text }]}>Qidiruvni boshlang</Text>
          <Text style={[styles.emptySubtitle, { color: Colors.textSecondary }]}>
            Mahsulot nomi yoki kategoriyani kiriting
          </Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cube-outline" size={52} color={Colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: Colors.text }]}>Mahsulot topilmadi</Text>
          <Text style={[styles.emptySubtitle, { color: Colors.textSecondary }]}>
            "{search}" bo'yicha natija yo'q
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
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <Text style={[styles.resultsCount, { color: Colors.textSecondary }]}>
              {filtered.length} ta mahsulot topildi
            </Text>
          }
          renderItem={({ item }) => (
            <ProductCard
              product={convertToProduct(item)}
              onPress={() =>
                router.push({ pathname: "/product/[id]", params: { id: item.id } })
              }
            />
          )}
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
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  cartBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
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
    flex: 1,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 8,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    paddingVertical: 0,
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
    paddingHorizontal: 32,
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
