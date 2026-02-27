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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { PRODUCTS, CATEGORIES, formatPrice } from "@/constants/data";
import { ProductCard } from "@/components/ProductCard";

export default function CatalogScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ category?: string }>();
  const [activeCategory, setActiveCategory] = useState<string | null>(params.category ?? null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "price_asc" | "price_desc">("default");

  const filtered = useMemo(() => {
    let products = PRODUCTS;
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
  }, [activeCategory, search, sortBy]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.title}>Catalog</Text>

        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
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
          <Pressable
            style={[styles.sortBtn, sortBy !== "default" && styles.sortBtnActive]}
            onPress={() => {
              setSortBy((prev) => {
                if (prev === "default") return "price_asc";
                if (prev === "price_asc") return "price_desc";
                return "default";
              });
            }}
          >
            <Ionicons
              name="swap-vertical"
              size={18}
              color={sortBy !== "default" ? "#fff" : Colors.text}
            />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.catScroll}
          contentContainerStyle={styles.catContent}
        >
          <Pressable
            style={[styles.catChip, !activeCategory && styles.catChipActive]}
            onPress={() => setActiveCategory(null)}
          >
            <Text style={[styles.catChipText, !activeCategory && styles.catChipTextActive]}>
              All
            </Text>
          </Pressable>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              style={[styles.catChip, activeCategory === cat.id && styles.catChipActive]}
              onPress={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
            >
              <Ionicons
                name={cat.icon as any}
                size={14}
                color={activeCategory === cat.id ? "#fff" : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.catChipText,
                  activeCategory === cat.id && styles.catChipTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No products found</Text>
          <Text style={styles.emptySubtitle}>Try adjusting your search or filters</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.grid,
            { paddingBottom: Platform.OS === "web" ? 34 : 90 },
          ]}
          scrollEnabled={!!filtered.length}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              horizontal
              onPress={() =>
                router.push({ pathname: "/product/[id]", params: { id: item.id } })
              }
            />
          )}
          ListHeaderComponent={
            <Text style={styles.resultsCount}>
              {filtered.length} product{filtered.length !== 1 ? "s" : ""}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 26,
    color: Colors.text,
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.text,
  },
  sortBtn: {
    width: 46,
    height: 46,
    backgroundColor: Colors.card,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sortBtnActive: {
    backgroundColor: Colors.primary,
  },
  catScroll: {
    marginHorizontal: -16,
  },
  catContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 8,
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  catChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catChipText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  catChipTextActive: {
    color: "#fff",
  },
  grid: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  resultsCount: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 60,
  },
  emptyTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: Colors.text,
  },
  emptySubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
