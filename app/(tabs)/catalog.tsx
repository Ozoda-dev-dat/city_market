import React, { useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  SectionList,
  Platform,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import getColors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/context/ProductsContext";
import { useApp } from "@/context/ProductsContext";
import { Product } from "@/constants/data";
import { useTranslation } from "@/lib/I18nProvider";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CATEGORY_ICONS: Record<string, string> = {
  fruits: "nutrition-outline",
  vegetables: "leaf-outline",
  ichimliklar: "water-outline",
  dairy: "cafe-outline",
  bakery: "pizza-outline",
  "konservalar-": "cube-outline",
  meat: "restaurant-outline",
  shokoladlar: "gift-outline",
  coffee: "cafe-outline",
  choy: "cafe-outline",
  sharbatlar: "wine-outline",
  mayonezlar: "flask-outline",
  "murabbo-va-djemlar": "color-fill-outline",
  ketchuplar: "color-fill-outline",
  shampunlar: "sparkles-outline",
  tagliklar: "layers-outline",
  "shokolatli-pastalar": "ice-cream-outline",
  "makaron-un-yormalar": "grid-outline",
  "yog-va-souslar": "water-outline",
  "bolalar-ovqatlar": "happy-outline",
  oyinchoqlar: "game-controller-outline",
  "yongok-va-sneklar": "leaf-outline",
};

function getCatIcon(id: string): string {
  return CATEGORY_ICONS[id] ?? "grid-outline";
}

export default function BrowseScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const { products: allProducts } = useProducts();
  const { categories, subcategories } = useApp();
  const { t } = useTranslation();

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return allProducts.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 40);
  }, [search, allProducts]);

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

  const isSearching = search.trim().length > 0;

  const bg = isDarkMode ? "#111" : "#fff";
  const separatorColor = isDarkMode ? "rgba(255,255,255,0.07)" : "#EBEBEB";
  const rowBg = isDarkMode ? "#1A1A1A" : "#fff";
  const subBg = isDarkMode ? "#141414" : "#FAFAFA";

  function toggleCategory(id: string) {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const subcatMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const s of subcategories) {
      if (!map[s.categoryId]) map[s.categoryId] = [];
      map[s.categoryId].push(s);
    }
    return map;
  }, [subcategories]);

  const listData = useMemo(() => {
    const rows: any[] = [];
    for (const cat of categories) {
      rows.push({ type: "category", cat });
      if (expandedIds.has(cat.id)) {
        const subs = subcatMap[cat.id] ?? [];
        for (const sub of subs) {
          rows.push({ type: "subcategory", sub, catId: cat.id });
        }
        if (subs.length === 0) {
          rows.push({ type: "empty", catId: cat.id });
        }
      }
    }
    return rows;
  }, [categories, expandedIds, subcatMap]);

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: bg }]}>
        <View style={[styles.searchRow, {
          backgroundColor: isDarkMode ? "#222" : "#F2F2F2",
          borderColor: isDarkMode ? "rgba(255,255,255,0.06)" : "transparent",
        }]}>
          <Ionicons name="search-outline" size={18} color={isDarkMode ? "#888" : "#999"} />
          <TextInput
            style={[styles.searchInput, { color: Colors.text }]}
            placeholder={t("search_products")}
            placeholderTextColor={isDarkMode ? "#666" : "#ADADAD"}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={isDarkMode ? "#666" : "#ADADAD"} />
            </Pressable>
          )}
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: separatorColor }]} />

      {/* Search results */}
      {isSearching ? (
        filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={Colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: Colors.text }]}>{t("no_products_found")}</Text>
            <Text style={[styles.emptySubtitle, { color: Colors.textSecondary }]}>{t("try_different_search")}</Text>
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={[styles.productGrid, { paddingBottom: Platform.OS === "web" ? 100 : 120 }]}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <Text style={[styles.resultsLabel, { color: Colors.textSecondary }]}>
                {filteredProducts.length} {t("items_unit")}
              </Text>
            }
            renderItem={({ item }) => (
              <ProductCard
                product={convertToProduct(item)}
                onPress={() => router.push({ pathname: "/product/[id]", params: { id: item.id } })}
              />
            )}
          />
        )
      ) : (
        /* Accordion category list */
        <FlatList
          data={listData}
          keyExtractor={(item, idx) =>
            item.type === "category" ? `cat-${item.cat.id}` :
            item.type === "subcategory" ? `sub-${item.sub.id}` :
            `empty-${item.catId}-${idx}`
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 100 : 120 }}
          renderItem={({ item, index }) => {
            if (item.type === "category") {
              const isExpanded = expandedIds.has(item.cat.id);
              const iconName = getCatIcon(item.cat.id) as any;
              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.catRow,
                    { backgroundColor: pressed ? (isDarkMode ? "#252525" : "#F5F5F5") : rowBg },
                  ]}
                  onPress={() => toggleCategory(item.cat.id)}
                >
                  <View style={[styles.iconWrap, { backgroundColor: isDarkMode ? "#2A2A2A" : "#F0F0F0" }]}>
                    <Ionicons name={iconName} size={20} color={isDarkMode ? "#aaa" : "#555"} />
                  </View>
                  <Text style={[styles.catName, { color: Colors.text }]} numberOfLines={1}>
                    {item.cat.name}
                  </Text>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={isDarkMode ? "#666" : "#ADADAD"}
                  />
                </Pressable>
              );
            }

            if (item.type === "subcategory") {
              return (
                <>
                  <Pressable
                    style={({ pressed }) => [
                      styles.subRow,
                      { backgroundColor: pressed ? (isDarkMode ? "#202020" : "#EFEFEF") : subBg },
                    ]}
                    onPress={() => router.push({ pathname: "/subcategory/[id]", params: { id: item.sub.id } })}
                  >
                    <View style={styles.subDot} />
                    <Text style={[styles.subName, { color: Colors.textSecondary }]} numberOfLines={1}>
                      {item.sub.name}
                    </Text>
                  </Pressable>
                  <View style={[styles.subDivider, { backgroundColor: separatorColor }]} />
                </>
              );
            }

            return null;
          }}
          ItemSeparatorComponent={({ leadingItem }) =>
            leadingItem?.type === "category" ? (
              <View style={[styles.divider, { backgroundColor: separatorColor }]} />
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    paddingVertical: 0,
  },
  divider: {
    height: 1,
  },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  catName: {
    flex: 1,
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingLeft: 70,
    paddingRight: 20,
    gap: 10,
  },
  subDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#ADADAD",
  },
  subName: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
  },
  subDivider: {
    height: 1,
    marginLeft: 70,
  },
  productGrid: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  row: {
    gap: 12,
    marginBottom: 12,
  },
  resultsLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    marginBottom: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
  },
  emptySubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
  },
});
