import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  useWindowDimensions,
  Platform,
  Alert,
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
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import getColors from "@/constants/colors";
import { BANNERS } from "@/constants/data";
import { ProductCard } from "@/components/ProductCard";
import { useApp } from "@/context/ProductsContext";
import { useCart } from "@/context/CartContext";
import { useTheme } from "@/context/ThemeContext";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import { NotificationsModal } from "@/components/NotificationsModal";
import { LocationPermissionModal, shouldShowLocationPrompt } from "@/components/LocationPermissionModal";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "@/context/LocationContext";
import { Product as SchemaProduct } from "@/shared/schema";
import { Product } from "@/constants/data";
import { useTranslation } from "@/lib/I18nProvider";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = (SCREEN_W - 48) / 2;
const CARD_H = CARD_W * 0.72;

// ── Yandex Go style: solid bg color + right-side floating image ───────────
const CAT_STYLES: { keys: string[]; bg: string; dark: string; img: string }[] = [
  {
    keys: ["fruit", "meva"],
    bg: "#FF6B35", dark: "#E85A25",
    img: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&q=80",
  },
  {
    keys: ["vegetab", "sabzavot"],
    bg: "#27AE60", dark: "#1E9450",
    img: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80",
  },
  {
    keys: ["dairy", "sut", "milk", "moloch"],
    bg: "#29B6D2", dark: "#1FA0B8",
    img: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80",
  },
  {
    keys: ["baker", "bread", "non", "novvoy", "xoʻrak"],
    bg: "#D4A827", dark: "#B88E1C",
    img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80",
  },
  {
    keys: ["meat", "gosht", "myaso", "chicken", "tovuq"],
    bg: "#E53935", dark: "#C62828",
    img: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&q=80",
  },
  {
    keys: ["seafood", "fish", "baliq", "dengiz"],
    bg: "#1565C0", dark: "#0D47A1",
    img: "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=400&q=80",
  },
  {
    keys: ["beverage", "drink", "ichimlik", "napitok"],
    bg: "#7B61FF", dark: "#6246E5",
    img: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80",
  },
  {
    keys: ["snack", "chip", "cracker", "gazak", "shirinlik", "sweet", "candy"],
    bg: "#F59E0B", dark: "#D97706",
    img: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&q=80",
  },
  {
    keys: ["frozen", "muzlatilgan", "ice", "muzqaymoq", "moroj"],
    bg: "#42A5F5", dark: "#1E88E5",
    img: "https://images.unsplash.com/photo-1574482620826-40685ca5ebd2?w=400&q=80",
  },
  {
    keys: ["organic", "organik", "eco", "bio"],
    bg: "#43A047", dark: "#2E7D32",
    img: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80",
  },
  {
    keys: ["coffee", "qahva", "kofe", "kafe"],
    bg: "#795548", dark: "#5D4037",
    img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80",
  },
  {
    keys: ["chocolate", "shokolad", "shokolad", "choco"],
    bg: "#6D4C41", dark: "#4E342E",
    img: "https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=400&q=80",
  },
  {
    keys: ["pasta", "makaroni", "noodle"],
    bg: "#EF6C00", dark: "#E65100",
    img: "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=400&q=80",
  },
  {
    keys: ["sauce", "kondiment", "spice", "ziravorlar"],
    bg: "#C0392B", dark: "#96281B",
    img: "https://images.unsplash.com/photo-1589187151053-5ec8818e661b?w=400&q=80",
  },
  {
    keys: ["cereal", "granola", "muesli"],
    bg: "#FFA000", dark: "#FF8F00",
    img: "https://images.unsplash.com/photo-1517093157656-b9eccef91cb1?w=400&q=80",
  },
  {
    keys: ["oil", "yog", "butter"],
    bg: "#F9A825", dark: "#F57F17",
    img: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80",
  },
  {
    keys: ["canned", "konserva", "tushenka"],
    bg: "#546E7A", dark: "#37474F",
    img: "https://images.unsplash.com/photo-1584714268709-c3dd9c92b378?w=400&q=80",
  },
  {
    keys: ["hygiene", "gigiyena", "cleaning", "tozalik"],
    bg: "#00ACC1", dark: "#00838F",
    img: "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&q=80",
  },
  {
    keys: ["baby", "bola", "child", "kids"],
    bg: "#EC407A", dark: "#D81B60",
    img: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&q=80",
  },
  {
    keys: ["pet", "hayvon", "dog", "cat"],
    bg: "#8D6E63", dark: "#6D4C41",
    img: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&q=80",
  },
];

const DEFAULT_CAT_STYLE = {
  bg: "#16A34A", dark: "#15803D",
  img: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80",
};

function getCatStyle(name: string, id: string) {
  const str = ((name || "") + " " + (id || "")).toLowerCase();
  for (const style of CAT_STYLES) {
    if (style.keys.some((k) => str.includes(k))) return style;
  }
  // Hash-based fallback so each category gets a unique color
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return CAT_STYLES[Math.abs(hash) % CAT_STYLES.length] || DEFAULT_CAT_STYLE;
}

function getGreetingKey(): "greeting_morning" | "greeting_afternoon" | "greeting_evening" {
  const h = new Date().getHours();
  if (h < 12) return "greeting_morning";
  if (h < 17) return "greeting_afternoon";
  return "greeting_evening";
}

const convertToProduct = (schemaProduct: SchemaProduct): Product => ({
  id: schemaProduct.id,
  name: schemaProduct.name,
  category: schemaProduct.category,
  price: schemaProduct.price,
  originalPrice: schemaProduct.originalPrice || undefined,
  unit: schemaProduct.unit,
  image: schemaProduct.image,
  badge: schemaProduct.badge as "sale" | "new" | "hot" | undefined,
  rating: parseFloat(schemaProduct.rating || "5.0") as number,
  description: schemaProduct.description || "",
  brand: schemaProduct.brand || undefined,
  weight: schemaProduct.weight || undefined,
  inStock: schemaProduct.inStock,
  stockQuantity: schemaProduct.stockQuantity,
});

function BannerDot({ isActive }: { isActive: boolean }) {
  const w = useSharedValue(isActive ? 20 : 6);
  const op = useSharedValue(isActive ? 1 : 0.4);
  useEffect(() => {
    w.value = withSpring(isActive ? 20 : 6, { damping: 14, stiffness: 140 });
    op.value = withTiming(isActive ? 1 : 0.4, { duration: 200 });
  }, [isActive]);
  const style = useAnimatedStyle(() => ({ width: w.value, opacity: op.value }));
  return <Animated.View style={[{ height: 6, borderRadius: 3, backgroundColor: "#16A34A" }, style]} />;
}

function CategoryCircle({ item, onPress }: { item: any; onPress: () => void }) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const img = getCategoryImage(item.name, item.id);

  return (
    <Animated.View style={[circleStyles.wrapper, anim]}>
      <Pressable
        onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={() => { scale.value = withSpring(0.9, { damping: 12 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
        style={{ alignItems: "center", gap: 6 }}
      >
        <View style={circleStyles.circle}>
          <Image source={{ uri: img }} style={circleStyles.circleImg} resizeMode="cover" />
          <View style={circleStyles.circleOverlay} />
        </View>
        <Text style={circleStyles.label} numberOfLines={1}>{item.name}</Text>
      </Pressable>
    </Animated.View>
  );
}

const circleStyles = StyleSheet.create({
  wrapper: { width: 78, alignItems: "center" },
  circle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    overflow: "hidden",
    borderWidth: 2.5,
    borderColor: "rgba(22,163,74,0.25)",
  },
  circleImg: { width: "100%", height: "100%" },
  circleOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  label: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
    color: "#374151",
    textAlign: "center",
    maxWidth: 72,
  },
});

function CategoryPhotoCard({ category, productCount, itemsLabel, isDarkMode, onPress }: {
  category: any; productCount: number; itemsLabel: string; isDarkMode: boolean; onPress: () => void;
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
          colors={["transparent", "rgba(0,0,0,0.72)"]}
          start={{ x: 0, y: 0.25 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject as any}
        />
        <View style={catCardStyles.content}>
          <Text style={catCardStyles.name} numberOfLines={2}>{category.name}</Text>
          <Text style={catCardStyles.count}>{productCount} {itemsLabel}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const catCardStyles = StyleSheet.create({
  content: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 12 },
  name: { fontFamily: "Poppins_700Bold", fontSize: 15, color: "#fff", lineHeight: 20 },
  count: { fontFamily: "Poppins_500Medium", fontSize: 11, color: "rgba(255,255,255,0.78)", marginTop: 2 },
});

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const BANNER_W = width - 32;
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<FlatList>(null);
  const [activeBanner, setActiveBanner] = useState(0);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const { products, categories } = useApp();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { location, isLoading: locationLoading } = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    if (user?.role !== "customer") return;
    let cancelled = false;
    (async () => {
      const show = await shouldShowLocationPrompt(!!location);
      if (!cancelled) setShowLocationModal(show);
    })();
    return () => { cancelled = true; };
  }, [user?.id, !!location]);

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/notifications/unread-count");
      return res.json();
    },
    refetchInterval: 30000,
  });
  const unreadCount = unreadData?.count ?? 0;

  const handleAddToCart = (product: any) => {
    if (!product.inStock) {
      Alert.alert(t("error"), t("out_of_stock"));
      return;
    }
    const p: SchemaProduct = {
      id: product.id, name: product.name, category: product.category,
      price: product.price, originalPrice: product.originalPrice || null,
      unit: product.unit, image: product.image, badge: product.badge || null,
      rating: product.rating != null ? product.rating.toString() : null,
      description: product.description || null, brand: product.brand || null,
      weight: product.weight || null, inStock: product.inStock,
      stockQuantity: product.stockQuantity || 0, isActive: true,
      deletedAt: null, createdAt: new Date(), updatedAt: new Date(),
    };
    addToCart(p);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const popularProducts = activeFilter
    ? products.filter((p) => p.category === activeFilter).slice(0, 12)
    : products.filter((p) => p.badge === "sale" || p.badge === "hot" || p.badge === "new").slice(0, 12);
  const allPopular = popularProducts.length === 0 ? products.slice(0, 12) : popularProducts;

  const bannerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startBannerAutoScroll = useCallback(() => {
    if (bannerIntervalRef.current) clearInterval(bannerIntervalRef.current);
    bannerIntervalRef.current = setInterval(() => {
      setActiveBanner((prev) => {
        const next = (prev + 1) % BANNERS.length;
        scrollRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3800);
  }, []);

  useEffect(() => {
    startBannerAutoScroll();
    return () => { if (bannerIntervalRef.current) clearInterval(bannerIntervalRef.current); };
  }, [startBannerAutoScroll]);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const greetingKey = getGreetingKey();
  const firstName = user?.name ? user.name.split(" ")[0] : "";

  // Build category rows (2 per row) for the grid
  const catRows: any[][] = [];
  for (let i = 0; i < categories.length; i += 2) {
    catRows.push(categories.slice(i, i + 2));
  }

  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? "#0C0C0E" : "#F5F6F5" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 40 : 110 }}
      >
        {/* ── Header ── */}
        <View style={[styles.header, { paddingTop: topPadding + 14 }]}>
          <View style={{ flex: 1 }}>
            <Pressable style={styles.locationRow} onPress={() => setShowLocationModal(true)}>
              <Ionicons name="location" size={13} color="#16A34A" />
              <Text style={[styles.locationText, { color: Colors.textSecondary }]} numberOfLines={1}>
                {location?.address
                  ? location.address.length > 28 ? location.address.slice(0, 28) + "…" : location.address
                  : t("set_location")}
              </Text>
              <Ionicons name={locationLoading ? "reload-outline" : "chevron-down"} size={12} color={Colors.textMuted} />
            </Pressable>
            <Text style={[styles.greeting, { color: Colors.text }]}>
              {t(greetingKey)}{firstName ? ", " + firstName : ""}
            </Text>
          </View>

          <Pressable
            style={[styles.notifBtn, { backgroundColor: isDarkMode ? "rgba(28,28,30,0.9)" : "#fff" }]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowNotifications(true);
            }}
          >
            <Ionicons name="notifications-outline" size={20} color={Colors.text} />
            {unreadCount > 0 && (
              <View style={styles.notifDot}>
                <Text style={styles.notifDotText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* ── Search bar ── */}
        <Pressable
          style={[styles.searchBar, { backgroundColor: isDarkMode ? "rgba(28,28,30,0.9)" : "#fff" }]}
          onPress={() => router.push("/(tabs)/catalog")}
        >
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <Text style={[styles.searchPlaceholder, { color: Colors.textMuted }]}>
            {t("search_placeholder")}
          </Text>
          <View style={styles.filterIcon}>
            <Ionicons name="options-outline" size={17} color="#16A34A" />
          </View>
        </Pressable>

        {/* ── Feature pills ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
          style={{ marginBottom: 16 }}
        >
          {[
            { icon: "bicycle-outline", title: t("free_delivery"), sub: t("free_delivery_sub"), color: "#16A34A", bg: "#F0FDF4" },
            { icon: "time-outline",    title: t("express"),       sub: t("express_sub"),        color: "#F97316", bg: "#FFF7ED" },
            { icon: "shield-checkmark-outline", title: t("guarantee"), sub: t("guarantee_sub"), color: "#3B82F6", bg: "#EFF6FF" },
          ].map((pill) => (
            <View key={pill.title} style={[styles.pill, { backgroundColor: isDarkMode ? "rgba(28,28,30,0.9)" : pill.bg }]}>
              <Ionicons name={pill.icon as any} size={18} color={pill.color} />
              <View style={{ gap: 1 }}>
                <Text style={[styles.pillTitle, { color: Colors.text }]}>{pill.title}</Text>
                <Text style={[styles.pillSub, { color: Colors.textSecondary }]}>{pill.sub}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* ── Hero Banner ── */}
        <FlatList
          ref={scrollRef}
          data={BANNERS}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / BANNER_W);
            setActiveBanner(index);
            startBannerAutoScroll();
          }}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.bannerCard, { width: BANNER_W }]}
              onPress={() => router.push("/(tabs)/catalog")}
            >
              <Image
                source={{ uri: (item as any).image }}
                style={StyleSheet.absoluteFillObject as any}
                resizeMode="cover"
              />
              <LinearGradient
                colors={[(item as any).overlayStart || "rgba(0,60,20,0.7)", (item as any).overlayEnd || "rgba(0,30,10,0.3)"]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.7, y: 1 }}
                style={StyleSheet.absoluteFillObject as any}
              />
              <View style={styles.bannerTop}>
                <View style={[styles.bannerTag, { backgroundColor: (item as any).tagColor || "#16A34A" }]}>
                  <Text style={styles.bannerTagText}>{(item as any).tag || "SALE"}</Text>
                </View>
                <View style={styles.bannerDelivery}>
                  <Ionicons name="bicycle" size={12} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.bannerDeliveryText}>{t("express")}</Text>
                </View>
              </View>
              <View style={styles.bannerBottom}>
                <Text style={styles.bannerSub}>{item.subtitle}</Text>
                <Text style={styles.bannerTitle}>{item.title}</Text>
                <View style={styles.bannerCta}>
                  <Text style={styles.bannerCtaText}>{t("shop_now")}</Text>
                  <Ionicons name="arrow-forward" size={13} color="#fff" />
                </View>
              </View>
            </Pressable>
          )}
          style={{ marginHorizontal: 16, borderRadius: 24, overflow: "hidden" }}
          snapToInterval={BANNER_W}
          decelerationRate="fast"
          contentContainerStyle={{ gap: 0 }}
        />
        <View style={styles.dotsRow}>
          {BANNERS.map((_, i) => <BannerDot key={i} isActive={i === activeBanner} />)}
        </View>

        {/* ── Category circles ── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>{t("categories")}</Text>
        </View>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
          renderItem={({ item }) => (
            <CategoryCircle
              item={item}
              onPress={() => router.push({ pathname: "/category/[id]", params: { id: item.id } })}
            />
          )}
        />

        {/* ── Filter chips ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          style={{ marginBottom: 20 }}
        >
          <Pressable
            style={[styles.chip, {
              backgroundColor: !activeFilter ? "#16A34A" : isDarkMode ? "rgba(28,28,30,0.9)" : "#fff",
              borderColor: !activeFilter ? "#16A34A" : isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
            }]}
            onPress={() => setActiveFilter(null)}
          >
            <Text style={[styles.chipText, { color: !activeFilter ? "#fff" : Colors.text }]}>
              {t("filter_all")}
            </Text>
          </Pressable>
          {categories.slice(0, 6).map((cat: any) => (
            <Pressable
              key={cat.id}
              style={[styles.chip, {
                backgroundColor: activeFilter === cat.id ? "#16A34A" : isDarkMode ? "rgba(28,28,30,0.9)" : "#fff",
                borderColor: activeFilter === cat.id ? "#16A34A" : isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
              }]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveFilter(activeFilter === cat.id ? null : cat.id);
              }}
            >
              <Text style={[styles.chipText, { color: activeFilter === cat.id ? "#fff" : Colors.text }]}>
                {cat.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ── Popular Today ── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>{t("popular_today")}</Text>
          <View style={[styles.countBadge, { backgroundColor: isDarkMode ? "rgba(22,163,74,0.2)" : "#F0FDF4" }]}>
            <Text style={styles.countBadgeText}>{allPopular.length} {t("items_unit")}</Text>
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12, marginBottom: 0 }}
        >
          {allPopular.map((product) => (
            <ProductCard
              key={product.id}
              product={convertToProduct(product)}
              onPress={() => router.push({ pathname: "/product/[id]", params: { id: product.id } })}
            />
          ))}
        </ScrollView>

        {/* ── All Categories Grid ── */}
        <View style={[styles.sectionHeader, { marginTop: 28 }]}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>{t("all_categories")}</Text>
          <View style={[styles.countBadge, { backgroundColor: isDarkMode ? "rgba(22,163,74,0.2)" : "#F0FDF4" }]}>
            <Text style={styles.countBadgeText}>{categories.length} ta</Text>
          </View>
        </View>
        <View style={styles.catGrid}>
          {catRows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.catRow}>
              {row.map((cat: any) => {
                const count = products.filter((p) => p.category === cat.id).length;
                return (
                  <CategoryPhotoCard
                    key={cat.id}
                    category={cat}
                    productCount={count}
                    itemsLabel={t("items_unit")}
                    isDarkMode={isDarkMode}
                    onPress={() => router.push({ pathname: "/category/[id]", params: { id: cat.id } })}
                  />
                );
              })}
              {row.length === 1 && <View style={{ width: CARD_W }} />}
            </View>
          ))}
        </View>
      </ScrollView>

      <NotificationsModal visible={showNotifications} onClose={() => setShowNotifications(false)} />
      <LocationPermissionModal visible={showLocationModal} onClose={() => setShowLocationModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    marginBottom: 14,
    gap: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  locationText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
  },
  greeting: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    lineHeight: 30,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 16,
  },
  notifDot: {
    position: "absolute",
    top: 7,
    right: 7,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  notifDotText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 8,
    color: "#fff",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchPlaceholder: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
  },
  filterIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(22,163,74,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  pillsRow: {
    paddingHorizontal: 16,
    gap: 10,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  pillTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },
  pillSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
  },
  bannerCard: {
    height: 200,
    borderRadius: 24,
    overflow: "hidden",
  },
  bannerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  bannerTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  bannerTagText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 11,
    color: "#fff",
  },
  bannerDelivery: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  bannerDeliveryText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: "rgba(255,255,255,0.92)",
  },
  bannerBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 18,
    gap: 2,
  },
  bannerSub: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: "rgba(255,255,255,0.75)",
  },
  bannerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: "#fff",
    lineHeight: 26,
  },
  bannerCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    marginTop: 8,
  },
  bannerCtaText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#fff",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    marginTop: 10,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
  },
  seeAll: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#16A34A",
  },
  categoriesRow: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 4,
    marginBottom: 16,
  },
  chipsRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#16A34A",
  },
  catGrid: {
    paddingHorizontal: 16,
    gap: 0,
  },
  catRow: {
    flexDirection: "row",
    gap: 12,
  },
});
