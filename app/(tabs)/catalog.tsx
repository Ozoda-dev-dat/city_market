import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  Platform,
  Image,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
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
import { useProducts } from "@/context/ProductsContext";
import { useApp } from "@/context/ProductsContext";
import { Product } from "@/constants/data";
import { useTranslation } from "@/lib/I18nProvider";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = (SCREEN_W - 48) / 2;
const CARD_H = CARD_W * 0.75;

const CAT_IMAGES: Record<string, string> = {
  "choy":                "/cat-images/choy.png",
  "coffee":              "/cat-images/coffee.png",
  "meat":                "/cat-images/meat.png",
  "ichimliklar":         "/cat-images/ichimliklar.png",
  "ketchuplar":          "/cat-images/ketchuplar.png",
  "konservalar-":        "/cat-images/konservalar.png",
  "mayonezlar":          "/cat-images/mayonezlar.png",
  "fruits":              "/cat-images/fruits.png",
  "murabbo-va-djemlar":  "/cat-images/murabbo.png",
  "bakery":              "/cat-images/bakery.png",
  "vegetables":          "/cat-images/vegetables.png",
  "shampunlar":          "/cat-images/shampunlar.png",
  "sharbatlar":          "/cat-images/sharbatlar.png",
  "shokoladlar":         "/cat-images/shokoladlar.png",
  "shokolatli-pastalar": "/cat-images/shokolatli-pastalar.png",
  "dairy":               "/cat-images/dairy.png",
  "tagliklar":           "/cat-images/tagliklar.png",
  "makaron-un-yormalar": "/cat-images/makaron-un-yormalar.png",
  "yog-va-souslar":      "/cat-images/yog-va-souslar.png",
  "bolalar-ovqatlar":    "/cat-images/bolalar-ovqatlar.png",
  "oyinchoqlar":         "/cat-images/oyinchoqlar.png",
  "yongok-va-sneklar":   "/cat-images/yongok-va-sneklar.png",
};

function getCategoryImage(_name: string, id: string): string {
  return CAT_IMAGES[id] ?? "/cat-images/fruits.png";
}

function CategoryPhotoCard({ category, productCount, itemsLabel, onPress }: {
  category: any;
  productCount: number;
  itemsLabel: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const img = getCategoryImage(category.name, category.id);

  return (
    <Animated.View style={[{ width: CARD_W, height: CARD_H, marginBottom: 12 }, anim]}>
      <Pressable
        style={{ flex: 1, borderRadius: 20, overflow: "hidden" }}
        onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={() => { scale.value = withSpring(0.95, { damping: 12 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
      >
        <Image
          source={{ uri: img }}
          style={StyleSheet.absoluteFillObject as any}
          resizeMode="cover"
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.68)"]}
          start={{ x: 0, y: 0.3 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject as any}
        />
        <View style={photoCardStyles.content}>
          <Text style={photoCardStyles.name} numberOfLines={2}>{category.name}</Text>
          <Text style={photoCardStyles.count}>{productCount} {itemsLabel}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const photoCardStyles = StyleSheet.create({
  content: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  name: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: "#fff",
    lineHeight: 20,
  },
  count: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: "rgba(255,255,255,0.78)",
    marginTop: 2,
  },
});

export default function BrowseScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const { products: allProducts } = useProducts();
  const { categories } = useApp();
  const { t } = useTranslation();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const totalProductCount = allProducts.length;

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

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? "#0C0C0E" : "#F5F6F5" }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.title, { color: Colors.text }]}>{t("all_categories")}</Text>
        <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>
          {categories.length} {t("tab_browse").toLowerCase()} · {totalProductCount}+ {t("items_unit")}
        </Text>

        <View style={[styles.searchBar, {
          backgroundColor: isDarkMode ? "rgba(28,28,30,0.9)" : "#fff",
          borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        }]}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: Colors.text }]}
            placeholder={t("search_products")}
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
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[styles.catGrid, { paddingBottom: Platform.OS === "web" ? 100 : 120 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const count = allProducts.filter((p) => p.category === item.id).length;
            return (
              <CategoryPhotoCard
                category={item}
                productCount={count}
                itemsLabel={t("items_unit")}
                onPress={() => router.push({ pathname: "/category/[id]", params: { id: item.id } })}
              />
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 26,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
  },
  catGrid: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  productGrid: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  row: {
    gap: 12,
    marginBottom: 0,
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
