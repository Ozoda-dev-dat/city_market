import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  Platform,
  LayoutAnimation,
  UIManager,
  Image,
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
import { resolveImageUrl } from "@/lib/query-client";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CAT_IMAGES: Record<string, any> = {
  fruits:                require("@/public/cat-images/fruits.png"),
  vegetables:            require("@/public/cat-images/vegetables.png"),
  ichimliklar:           require("@/public/cat-images/ichimliklar.png"),
  dairy:                 require("@/public/cat-images/dairy.png"),
  bakery:                require("@/public/cat-images/bakery.png"),
  "konservalar-":        require("@/public/cat-images/konservalar.png"),
  meat:                  require("@/public/cat-images/meat.png"),
  shokoladlar:           require("@/public/cat-images/shokoladlar.png"),
  coffee:                require("@/public/cat-images/coffee.png"),
  choy:                  require("@/public/cat-images/choy.png"),
  sharbatlar:            require("@/public/cat-images/sharbatlar.png"),
  mayonezlar:            require("@/public/cat-images/mayonezlar.png"),
  "murabbo-va-djemlar":  require("@/public/cat-images/murabbo.png"),
  ketchuplar:            require("@/public/cat-images/ketchuplar.png"),
  shampunlar:            require("@/public/cat-images/shampunlar.png"),
  tagliklar:             require("@/public/cat-images/tagliklar.png"),
  "shokolatli-pastalar": require("@/public/cat-images/shokolatli-pastalar.png"),
  "makaron-un-yormalar": require("@/public/cat-images/makaron-un-yormalar.png"),
  "yog-va-souslar":      require("@/public/cat-images/yog-va-souslar.png"),
  "bolalar-ovqatlar":    require("@/public/cat-images/bolalar-ovqatlar.png"),
  oyinchoqlar:           require("@/public/cat-images/oyinchoqlar.png"),
  "yongok-va-sneklar":   require("@/public/cat-images/yongok-va-sneklar.png"),
};

const FALLBACK = require("@/public/cat-images/fruits.png");

function getCatImage(id: string) {
  return CAT_IMAGES[id] ?? FALLBACK;
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
  const separatorColor = isDarkMode ? "rgba(255,255,255,0.06)" : "#EEEEEE";
  const rowBg = isDarkMode ? "#1A1A1A" : "#fff";
  const subBg = isDarkMode ? "#141414" : "#fff";

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
      }
    }
    return rows;
  }, [categories, expandedIds, subcatMap]);

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Search header */}
      <View style={[styles.header, { paddingTop: topPad + 10, backgroundColor: bg }]}>
        <View style={[styles.searchRow, {
          backgroundColor: isDarkMode ? "#252525" : "#F4F4F4",
        }]}>
          <Ionicons name="search-outline" size={17} color={isDarkMode ? "#777" : "#AAA"} />
          <TextInput
            style={[styles.searchInput, { color: Colors.text }]}
            placeholder={t("search_products")}
            placeholderTextColor={isDarkMode ? "#666" : "#BABABA"}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={isDarkMode ? "#666" : "#C0C0C0"} />
            </Pressable>
          )}
        </View>
      </View>

      <View style={[styles.hairline, { backgroundColor: separatorColor }]} />

      {/* Search results */}
      {isSearching ? (
        filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={52} color={Colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: Colors.text }]}>{t("no_products_found")}</Text>
            <Text style={[styles.emptySubtitle, { color: Colors.textSecondary }]}>{t("try_different_search")}</Text>
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
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
        /* Accordion list */
        <FlatList
          data={listData}
          keyExtractor={(item, idx) =>
            item.type === "category"
              ? `cat-${item.cat.id}`
              : `sub-${item.sub.id}-${idx}`
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 100 : 120 }}
          renderItem={({ item }) => {
            /* ── Category row ── */
            if (item.type === "category") {
              const isExpanded = expandedIds.has(item.cat.id);
              return (
                <>
                  <Pressable
                    style={({ pressed }) => [
                      styles.catRow,
                      {
                        backgroundColor: pressed
                          ? isDarkMode ? "#232323" : "#F7F7F7"
                          : rowBg,
                      },
                    ]}
                    onPress={() => toggleCategory(item.cat.id)}
                  >
                    <Image
                      source={getCatImage(item.cat.id)}
                      style={styles.catThumb}
                      resizeMode="cover"
                    />
                    <Text
                      style={[styles.catName, { color: Colors.text }]}
                      numberOfLines={1}
                    >
                      {item.cat.name}
                    </Text>
                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={18}
                      color={isDarkMode ? "#555" : "#C0C0C0"}
                    />
                  </Pressable>
                  <View style={[styles.hairline, { backgroundColor: separatorColor }]} />
                </>
              );
            }

            /* ── Subcategory row ── */
            if (item.type === "subcategory") {
              return (
                <>
                  <Pressable
                    style={({ pressed }) => [
                      styles.subRow,
                      {
                        backgroundColor: pressed
                          ? isDarkMode ? "#1E1E1E" : "#F5F5F5"
                          : subBg,
                      },
                    ]}
                    onPress={() =>
                      router.push({
                        pathname: "/subcategory/[id]",
                        params: { id: item.sub.id },
                      })
                    }
                  >
                    <Text
                      style={[styles.subName, { color: isDarkMode ? "#AAA" : "#444" }]}
                      numberOfLines={1}
                    >
                      {item.sub.name}
                    </Text>
                  </Pressable>
                  <View
                    style={[
                      styles.subHairline,
                      { backgroundColor: separatorColor },
                    ]}
                  />
                </>
              );
            }

            return null;
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* Header */
  header: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    paddingVertical: 0,
  },

  /* Separators */
  hairline: { height: 1 },
  subHairline: { height: 1, marginLeft: 68 },

  /* Category row */
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 14,
    minHeight: 60,
  },
  catThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#F0F0F0",
  },
  catName: {
    flex: 1,
    fontFamily: "Poppins_500Medium",
    fontSize: 15.5,
    letterSpacing: 0.1,
  },

  /* Subcategory row */
  subRow: {
    paddingLeft: 72,
    paddingRight: 20,
    paddingVertical: 14,
    justifyContent: "center",
    minHeight: 48,
  },
  subName: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14.5,
  },

  /* Search results grid */
  productGrid: {
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  gridRow: {
    gap: 12,
    marginBottom: 12,
  },
  resultsLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    marginBottom: 12,
  },

  /* Empty state */
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
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
