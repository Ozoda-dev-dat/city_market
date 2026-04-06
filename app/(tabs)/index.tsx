import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  Dimensions,
  Platform,
  Alert,
  Image,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import getColors from "@/constants/colors";
import { BANNERS, formatPrice } from "@/constants/data";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Product as SchemaProduct } from "@/shared/schema";
import { Product } from "@/constants/data";

const { width } = Dimensions.get("window");

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

function BannerDot({ isActive, isDarkMode }: { isActive: boolean; isDarkMode: boolean }) {
  const w = useSharedValue(isActive ? 22 : 7);
  const op = useSharedValue(isActive ? 1 : 0.35);

  useEffect(() => {
    w.value = withSpring(isActive ? 22 : 7, { damping: 14, stiffness: 140 });
    op.value = withTiming(isActive ? 1 : 0.35, { duration: 220 });
  }, [isActive]);

  const style = useAnimatedStyle(() => ({ width: w.value, opacity: op.value }));
  return <Animated.View style={[styles.dot, { backgroundColor: "#16A34A" }, style]} />;
}

function Banner({ item, onPress }: { item: (typeof BANNERS)[0]; onPress: () => void }) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[bannerStyles.card, anim]}>
      <Pressable
        style={{ flex: 1 }}
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.975, { damping: 14 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
      >
        <Image
          source={{ uri: (item as any).image }}
          style={bannerStyles.image}
          resizeMode="cover"
        />
        <LinearGradient
          colors={[(item as any).overlayStart, (item as any).overlayEnd]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.4, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={bannerStyles.shimmer} />

        <View style={bannerStyles.topRow}>
          <View style={[bannerStyles.tagBadge, { backgroundColor: (item as any).tagColor }]}>
            <Ionicons name="pricetag" size={10} color="#fff" />
            <Text style={bannerStyles.tagText}>{(item as any).tag}</Text>
          </View>
          <View style={bannerStyles.deliveryPill}>
            <Ionicons name="bicycle" size={12} color="rgba(255,255,255,0.9)" />
            <Text style={bannerStyles.deliveryText}>30 daqiqa</Text>
          </View>
        </View>

        <View style={bannerStyles.bottomContent}>
          <Text style={bannerStyles.bannerSubtitle}>{item.subtitle}</Text>
          <Text style={bannerStyles.bannerTitle}>{item.title}</Text>
          <View style={bannerStyles.ctaRow}>
            <View style={bannerStyles.ctaBtn}>
              <Text style={bannerStyles.ctaText}>{(item as any).cta}</Text>
              <Ionicons name="arrow-forward" size={13} color="#fff" />
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const BANNER_W = width - 32;
const BANNER_H = 210;

const bannerStyles = StyleSheet.create({
  card: {
    width: BANNER_W,
    height: BANNER_H,
    borderRadius: 26,
    marginHorizontal: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 12,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  tagBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 20,
  },
  tagText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: "#fff",
  },
  deliveryPill: {
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
  deliveryText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: "rgba(255,255,255,0.92)",
  },
  bottomContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 14,
    gap: 3,
  },
  bannerSubtitle: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: "rgba(255,255,255,0.78)",
  },
  bannerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 21,
    color: "#fff",
    lineHeight: 27,
  },
  ctaRow: {
    marginTop: 10,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  ctaText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#fff",
  },
});

function CategoryCard({ item, onPress, isDarkMode, productCount }: {
  item: any;
  onPress: () => void;
  isDarkMode: boolean;
  productCount: number;
}) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const accentColor: string = item.color ?? "#16A34A";

  const gradStart = accentColor + (isDarkMode ? "40" : "22");
  const gradEnd = accentColor + (isDarkMode ? "10" : "06");

  return (
    <Animated.View style={[catStyles.card, anim]}>
      <Pressable
        style={{ flex: 1 }}
        onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={() => { scale.value = withSpring(0.93, { damping: 11 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
      >
        <View style={[
          catStyles.inner,
          {
            backgroundColor: isDarkMode ? "rgba(28,28,30,0.88)" : "#fff",
            borderColor: isDarkMode ? accentColor + "30" : accentColor + "25",
          }
        ]}>
          <LinearGradient
            colors={[gradStart, gradEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            borderRadius={22}
          />
          <View style={[catStyles.iconCircle, { backgroundColor: accentColor + (isDarkMode ? "30" : "18") }]}>
            <Ionicons name={item.icon as any} size={32} color={accentColor} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[catStyles.label, { color: isDarkMode ? "#F4F4F5" : "#111827" }]} numberOfLines={2}>
              {item.name}
            </Text>
            <View style={[catStyles.countPill, { backgroundColor: accentColor + (isDarkMode ? "30" : "18") }]}>
              <Ionicons name="cube-outline" size={11} color={accentColor} />
              <Text style={[catStyles.countText, { color: accentColor }]}>{productCount} ta mahsulot</Text>
            </View>
          </View>
          <View style={[catStyles.arrow, { backgroundColor: accentColor + (isDarkMode ? "25" : "15") }]}>
            <Ionicons name="chevron-forward" size={14} color={accentColor} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const catStyles = StyleSheet.create({
  card: {
    width: "48.5%" as any,
    marginBottom: 12,
  },
  inner: {
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
    gap: 10,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 5,
    minHeight: 140,
    overflow: "hidden",
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    lineHeight: 20,
  },
  countPill: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: "flex-start" as const,
  },
  countText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
  },
  arrow: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    alignSelf: "flex-end" as const,
  },
});

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<FlatList>(null);
  const [activeBanner, setActiveBanner] = useState(0);
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);

  const { products, categories } = useApp();
  const { addToCart } = useCart();

  const { user } = useAuth();
  const { location, isLoading: locationLoading } = useLocation();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

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

  const notifScale = useSharedValue(1);
  const notifAnim = useAnimatedStyle(() => ({ transform: [{ scale: notifScale.value }] }));

  const handleAddToCart = (product: any) => {
    if (!product.inStock) {
      Alert.alert("Xatolik", "Ushbu mahsulot vaqtincha tugagan");
      return;
    }
    const productForCart: SchemaProduct = {
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      originalPrice: product.originalPrice || null,
      unit: product.unit,
      image: product.image,
      badge: product.badge || null,
      rating: product.rating.toString(),
      description: product.description || null,
      brand: product.brand || null,
      weight: product.weight || null,
      inStock: product.inStock,
      stockQuantity: product.stockQuantity || 0,
      isActive: true,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    addToCart(productForCart);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

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
  const bgColors: [string, string, string] = isDarkMode
    ? ["#0a1f12", "#0f0f12", "#0C0C0E"]
    : ["#d4ede0", "#eaf4ee", "#F5F6F5"];

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={bgColors}
        locations={[0, 0.3, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[
        styles.blobTR,
        { backgroundColor: isDarkMode ? "rgba(22,163,74,0.09)" : "rgba(22,163,74,0.14)" }
      ]} />
      <View style={[
        styles.blobBL,
        { backgroundColor: isDarkMode ? "rgba(22,163,74,0.04)" : "rgba(22,163,74,0.07)" }
      ]} />

      <ScrollView
        style={{ backgroundColor: "transparent" }}
        contentContainerStyle={[styles.content, { paddingTop: topPadding + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoBanner}>
          <Image
            source={require("@/assets/logo.png")}
            style={styles.logoBannerImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greeting, { color: Colors.textSecondary }]}>Xayrli kun</Text>
            <Pressable
              style={styles.locationRow}
              onPress={() => setShowLocationModal(true)}
            >
              <Ionicons name="location" size={14} color="#16A34A" />
              <Text style={[styles.locationText, { color: Colors.textSecondary }]} numberOfLines={1}>
                {location?.address
                  ? location.address.length > 32
                    ? location.address.slice(0, 32) + "…"
                    : location.address
                  : "Joylashuvni aniqlash"}
              </Text>
              <Ionicons
                name={locationLoading ? "reload-outline" : "chevron-down"}
                size={13}
                color={Colors.textMuted}
              />
            </Pressable>
          </View>
          <Animated.View style={notifAnim}>
            <Pressable
              style={[
                styles.notifBtn,
                {
                  backgroundColor: isDarkMode ? "rgba(28,28,30,0.7)" : "rgba(255,255,255,0.75)",
                  borderColor: isDarkMode ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.9)",
                }
              ]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowNotifications(true);
              }}
              onPressIn={() => { notifScale.value = withSpring(0.88); }}
              onPressOut={() => { notifScale.value = withSpring(1); }}
            >
              <Ionicons name="notifications-outline" size={21} color={Colors.text} />
              {unreadCount > 0 && (
                <View style={styles.notifDot}>
                  {unreadCount <= 9 && (
                    <Text style={styles.notifDotText}>{unreadCount}</Text>
                  )}
                </View>
              )}
            </Pressable>
          </Animated.View>
        </View>

        <Pressable
          style={[
            styles.searchBar,
            {
              backgroundColor: isDarkMode ? "rgba(28,28,30,0.7)" : "rgba(255,255,255,0.82)",
              borderColor: isDarkMode ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.9)",
            }
          ]}
          onPress={() => router.push("/(tabs)/catalog")}
        >
          <View style={[styles.searchIconWrap, { backgroundColor: isDarkMode ? "rgba(22,163,74,0.2)" : "rgba(22,163,74,0.12)" }]}>
            <Ionicons name="search" size={16} color="#16A34A" />
          </View>
          <Text style={[styles.searchPlaceholder, { color: Colors.textMuted }]}>
            Mahsulot yoki kategoriya...
          </Text>
          <View style={[styles.filterBtn, { backgroundColor: isDarkMode ? "rgba(22,163,74,0.18)" : "rgba(22,163,74,0.1)" }]}>
            <Ionicons name="options-outline" size={16} color="#16A34A" />
          </View>
        </Pressable>

        <View style={[styles.deliveryStrip, {
          backgroundColor: isDarkMode ? "rgba(22,163,74,0.12)" : "rgba(22,163,74,0.08)",
          borderColor: isDarkMode ? "rgba(22,163,74,0.2)" : "rgba(22,163,74,0.18)",
        }]}>
          <View style={styles.deliveryItem}>
            <Ionicons name="bicycle-outline" size={16} color="#16A34A" />
            <Text style={[styles.deliveryItemText, { color: Colors.text }]}>30 daqiqada yetkazish</Text>
          </View>
          <View style={styles.deliverySep} />
          <View style={styles.deliveryItem}>
            <Ionicons name="shield-checkmark-outline" size={16} color="#16A34A" />
            <Text style={[styles.deliveryItemText, { color: Colors.text }]}>Sifat kafolati</Text>
          </View>
          <View style={styles.deliverySep} />
          <View style={styles.deliveryItem}>
            <Ionicons name="storefront-outline" size={16} color="#16A34A" />
            <Text style={[styles.deliveryItemText, { color: Colors.text }]}>Yangi mahsulotlar</Text>
          </View>
        </View>

        <FlatList
          ref={scrollRef}
          data={BANNERS}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setActiveBanner(index);
          }}
          renderItem={({ item }) => (
            <Banner
              item={item}
              onPress={() => router.push("/(tabs)/catalog")}
            />
          )}
          style={styles.bannerList}
          snapToInterval={width}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: 0 }}
        />
        <View style={styles.dotsRow}>
          {BANNERS.map((_, i) => (
            <BannerDot key={i} isActive={i === activeBanner} isDarkMode={isDarkMode} />
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Kategoriyalar</Text>
          <Pressable onPress={() => router.push("/(tabs)/catalog")}>
            <Text style={styles.seeAll}>Barchasini ko&apos;rish</Text>
          </Pressable>
        </View>

        <View style={styles.catGrid}>
          {categories.map((cat) => {
            const count = products.filter((p) => p.category === cat.id).length;
            return (
              <CategoryCard
                key={cat.id}
                item={cat}
                isDarkMode={isDarkMode}
                productCount={count}
                onPress={() => router.push({ pathname: "/category/[id]", params: { id: cat.id } })}
              />
            );
          })}
        </View>

        {featuredProducts.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: Colors.text }]}>Tavsiya etilgan</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={convertToProduct(product)}
                  onPress={() => router.push({ pathname: "/product/[id]", params: { id: product.id } })}
                />
              ))}
            </ScrollView>
          </>
        )}

        {saleProducts.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 8 }]}>
              <Text style={[styles.sectionTitle, { color: Colors.text }]}>Chegirmali</Text>
              <View style={styles.saleBadge}>
                <Ionicons name="pricetag" size={11} color="#fff" />
                <Text style={styles.saleBadgeText}>30% gacha</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
              {saleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={convertToProduct(product)}
                  onPress={() => router.push({ pathname: "/product/[id]", params: { id: product.id } })}
                />
              ))}
            </ScrollView>
          </>
        )}

        {featuredProducts.length === 0 && saleProducts.length === 0 && products.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: Colors.text }]}>Barcha mahsulotlar</Text>
              <Pressable onPress={() => router.push("/(tabs)/catalog")}>
                <Text style={styles.seeAll}>Barchasini ko&apos;rish</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
              {products.slice(0, 8).map((product) => (
                <ProductCard
                  key={product.id}
                  product={convertToProduct(product)}
                  onPress={() => router.push({ pathname: "/product/[id]", params: { id: product.id } })}
                />
              ))}
            </ScrollView>
          </>
        )}

        <View style={{ height: Platform.OS === "web" ? 34 : 100 }} />
      </ScrollView>

      <NotificationsModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      <LocationPermissionModal
        visible={showLocationModal}
        onDismiss={() => setShowLocationModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  blobTR: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    top: -90,
    right: -70,
  },
  blobBL: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    bottom: 120,
    left: -80,
  },
  content: {
    paddingHorizontal: 16,
  },
  logoBanner: {
    alignItems: "center",
    marginBottom: 10,
    marginTop: 4,
  },
  logoBannerImage: {
    width: 180,
    height: 72,
    borderRadius: 16,
    overflow: "hidden",
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
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  locationText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    flex: 1,
  },
  notifBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  notifDot: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  notifDotText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 9,
    color: "#fff",
    lineHeight: 12,
  },
  deliveryStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  deliveryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flex: 1,
    justifyContent: "center",
  },
  deliveryItemText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 10.5,
  },
  deliverySep: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(22,163,74,0.2)",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    marginBottom: 22,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 6,
  },
  searchIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  searchPlaceholder: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
  },
  filterBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerList: {
    marginHorizontal: -16,
    overflow: "visible",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    marginTop: 14,
  },
  dot: {
    height: 7,
    borderRadius: 3.5,
  },
  catGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 26,
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
  },
  seeAll: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#16A34A",
  },
  hScroll: {
    overflow: "visible",
  },
  saleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EF4444",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  saleBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: "#fff",
  },
});
