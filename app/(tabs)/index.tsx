import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  Dimensions,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { CATEGORIES, BANNERS, formatPrice } from "@/constants/data";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/context/ProductsContext";

const { width } = Dimensions.get("window");

function Banner({ item }: { item: (typeof BANNERS)[0] }) {
  return (
    <LinearGradient
      colors={[item.color, item.lightColor]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.bannerGradient}
    >
      <View style={styles.bannerContent}>
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
          <Text style={styles.bannerTitle}>{item.title}</Text>
          <Pressable style={styles.bannerBtn}>
            <Text style={styles.bannerBtnText}>Shop Now</Text>
          </Pressable>
        </View>
        <Text style={styles.bannerEmoji}>{item.emoji}</Text>
      </View>
    </LinearGradient>
  );
}

function CategoryPill({ item, onPress }: { item: (typeof CATEGORIES)[0]; onPress: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        style={styles.categoryPill}
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.95); }}
        onPressOut={() => { scale.value = withSpring(1); }}
      >
        <View style={[styles.categoryIcon, { backgroundColor: item.bgColor }]}>
          <Ionicons name={item.icon as any} size={20} color={item.color} />
        </View>
        <Text style={styles.categoryName}>{item.name}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<FlatList>(null);
  const [activeBanner, setActiveBanner] = useState(0);

  const { products } = useProducts();
  const featuredProducts = products.filter((p) => p.badge === "hot" || p.badge === "new");
  const saleProducts = products.filter((p) => p.badge === "sale");

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBanner((prev) => {
        const next = (prev + 1) % BANNERS.length;
        scrollRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: topPadding + 12 }]}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning</Text>
          <Text style={styles.storeName}>FreshMart</Text>
        </View>
        <Pressable style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={22} color={Colors.text} />
        </Pressable>
      </View>

      <Pressable
        style={styles.searchBar}
        onPress={() => router.push("/(tabs)/catalog")}
      >
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
        <Text style={styles.searchPlaceholder}>Search products...</Text>
        <View style={styles.searchFilter}>
          <Ionicons name="options-outline" size={16} color={Colors.primary} />
        </View>
      </Pressable>

      <FlatList
        ref={scrollRef}
        data={BANNERS}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / (width - 32));
          setActiveBanner(index);
        }}
        renderItem={({ item }) => <Banner item={item} />}
        style={styles.bannerList}
      />
      <View style={styles.bannerDots}>
        {BANNERS.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === activeBanner && styles.dotActive]}
          />
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <Pressable onPress={() => router.push("/(tabs)/catalog")}>
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
        {CATEGORIES.map((cat) => (
          <CategoryPill
            key={cat.id}
            item={cat}
            onPress={() => router.push({ pathname: "/(tabs)/catalog", params: { category: cat.id } })}
          />
        ))}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productsScroll}>
        {featuredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onPress={() => router.push({ pathname: "/product/[id]", params: { id: product.id } })}
          />
        ))}
      </ScrollView>

      {saleProducts.length > 0 && (
        <>
          <View style={[styles.sectionHeader, { marginTop: 8 }]}>
            <Text style={styles.sectionTitle}>On Sale</Text>
            <View style={styles.saleBadge}>
              <Ionicons name="pricetag" size={12} color="#fff" />
              <Text style={styles.saleBadgeText}>Up to 30% off</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productsScroll}>
            {saleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={() => router.push({ pathname: "/product/[id]", params: { id: product.id } })}
              />
            ))}
          </ScrollView>
        </>
      )}

      <View style={{ height: Platform.OS === "web" ? 34 : 90 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  greeting: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  storeName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 26,
    color: Colors.text,
    lineHeight: 32,
  },
  notifBtn: {
    width: 42,
    height: 42,
    backgroundColor: Colors.card,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchBar: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 10,
  },
  searchPlaceholder: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.textMuted,
  },
  searchFilter: {
    width: 32,
    height: 32,
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerList: {
    marginHorizontal: -16,
  },
  bannerGradient: {
    width: width - 32,
    height: 160,
    borderRadius: 20,
    marginHorizontal: 16,
    overflow: "hidden",
  },
  bannerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerSubtitle: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    marginBottom: 4,
  },
  bannerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: "#fff",
    lineHeight: 26,
    marginBottom: 14,
  },
  bannerBtn: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  bannerBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#fff",
  },
  bannerEmoji: {
    fontSize: 64,
  },
  bannerDots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 24,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textMuted,
  },
  dotActive: {
    width: 18,
    backgroundColor: Colors.primary,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: Colors.text,
  },
  seeAll: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.primary,
  },
  categoriesScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  categoryPill: {
    alignItems: "center",
    marginRight: 16,
    width: 68,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  categoryName: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: Colors.text,
    textAlign: "center",
  },
  productsScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  saleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  saleBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: "#fff",
  },
});
