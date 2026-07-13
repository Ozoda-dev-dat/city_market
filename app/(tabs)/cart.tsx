import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { apiRequest, queryClient, resolveImageUrl } from "@/lib/query-client";
import { formatPrice } from "@/constants/data";
import * as Haptics from "expo-haptics";
import getColors, { Colors as StaticColors } from "@/constants/colors";
import { useLocation } from "@/context/LocationContext";

const STORE_ORIGIN = { latitude: 41.4741824, longitude: 60.7735868 };
const DELIVERY_RATE_PER_KM = 1500;
const MIN_DELIVERY_FEE = 3000;
const FREE_DELIVERY_THRESHOLD = 100000;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function CartItemRow({
  item,
  isDarkMode,
  Colors,
  onRemove,
  onUpdate,
}: {
  item: any;
  isDarkMode: boolean;
  Colors: any;
  onRemove: (id: string) => void;
  onUpdate: (id: string, qty: number) => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const isValidImage = (uri: string) => !!uri && (uri.startsWith("http") || uri.startsWith("data:image"));

  const handleQty = (delta: number) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSequence(withSpring(0.96, { damping: 12 }), withSpring(1, { damping: 12 }));
    const next = item.quantity + delta;
    if (next <= 0) onRemove(item.product.id);
    else onUpdate(item.product.id, next);
  };

  return (
    <Animated.View style={[
      itemStyles.wrap,
      {
        backgroundColor: isDarkMode ? "rgba(30,30,32,0.82)" : "rgba(255,255,255,0.82)",
        borderColor: isDarkMode ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.9)",
      },
      animStyle,
    ]}>
      <View style={itemStyles.imageBox}>
        {isValidImage(resolveImageUrl(item.product.image || "")) ? (
          <Image source={{ uri: resolveImageUrl(item.product.image || "") }} style={itemStyles.image} resizeMode="cover" />
        ) : (
          <View style={[itemStyles.image, itemStyles.imageFallback]}>
            <Text style={itemStyles.imageLetter}>{item.product.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
      </View>
      <View style={itemStyles.info}>
        <Text style={[itemStyles.name, { color: Colors.text }]} numberOfLines={2}>
          {item.product.name}
        </Text>
        <Text style={itemStyles.price}>{formatPrice(item.product.price)}</Text>
      </View>
      <View style={[
        itemStyles.controls,
        { backgroundColor: isDarkMode ? "rgba(22,163,74,0.15)" : "rgba(22,163,74,0.09)" }
      ]}>
        <Pressable style={itemStyles.qtyBtn} onPress={() => handleQty(-1)}>
          <Ionicons
            name={item.quantity === 1 ? "trash-outline" : "remove"}
            size={16}
            color={Colors.primary}
          />
        </Pressable>
        <Text style={itemStyles.qty}>{item.quantity}</Text>
        <Pressable style={itemStyles.qtyBtn} onPress={() => handleQty(1)}>
          <Ionicons name="add" size={16} color={Colors.primary} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const itemStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    gap: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  imageBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: StaticColors.successBgSoft,
  },
  image: { width: "100%", height: "100%" },
  imageFallback: { alignItems: "center", justifyContent: "center" },
  imageLetter: { fontFamily: "Poppins_700Bold", fontSize: 22, color: StaticColors.primary },
  info: { flex: 1, gap: 4 },
  name: { fontFamily: "Poppins_600SemiBold", fontSize: 13, lineHeight: 18 },
  price: { fontFamily: "Poppins_700Bold", fontSize: 14, color: StaticColors.primary },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 3,
    gap: 4,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  qty: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: StaticColors.primary,
    minWidth: 22,
    textAlign: "center",
  },
});

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const { items, totalPrice, totalItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const { location } = useLocation();
  const [promo, setPromo] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedPromoMin, setAppliedPromoMin] = useState(0);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery");

  const checkoutScale = useSharedValue(1);
  const checkoutAnim = useAnimatedStyle(() => ({ transform: [{ scale: checkoutScale.value }] }));

  useEffect(() => {
    if (discount > 0 && appliedPromoMin > 0 && totalPrice < appliedPromoMin) {
      setDiscount(0);
      setAppliedPromoMin(0);
      setPromo("");
      Alert.alert(
        "Promokod bekor qilindi",
        `Savat summasi minimal talabdan past tushib ketgani uchun chegirma olib tashlandi.`
      );
    }
  }, [totalPrice]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const TAB_BAR_HEIGHT = 62;
  const tabBarBottomInset = Platform.OS === "web" ? 20 : Math.max(insets.bottom, 8) + 8;
  const footerBottomOffset = Platform.OS === "web" ? 20 : tabBarBottomInset + TAB_BAR_HEIGHT + 8;

  const deliveryDistanceKm: number | null =
    location?.latitude && location?.longitude
      ? haversineKm(
          parseFloat(location.latitude),
          parseFloat(location.longitude),
          STORE_ORIGIN.latitude,
          STORE_ORIGIN.longitude
        )
      : null;

  const deliveryFeeBase =
    totalPrice >= FREE_DELIVERY_THRESHOLD
      ? 0
      : deliveryDistanceKm !== null
      ? Math.max(MIN_DELIVERY_FEE, Math.round(deliveryDistanceKm * DELIVERY_RATE_PER_KM))
      : 15000;

  const delivery = deliveryType === "pickup" ? 0 : deliveryFeeBase;
  const finalTotal = Math.max(0, totalPrice + delivery - (totalPrice * discount / 100));

  const applyPromo = async () => {
    try {
      const res = await apiRequest("GET", `/api/promo-codes/${promo}?cartTotal=${totalPrice}`);
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "MIN_AMOUNT_NOT_MET") {
          const minFmt = data.minAmount.toLocaleString("uz-UZ");
          Alert.alert(
            "Minimal summa yetarli emas",
            `Bu promokod faqat ${minFmt} so'm va undan yuqori buyurtmalar uchun amal qiladi.`
          );
        } else {
          Alert.alert("Xatolik", "Promokod noto'g'ri yoki faol emas");
        }
        return;
      }
      setDiscount(data.discountPercent);
      setAppliedPromoMin(data.minAmount ?? 0);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Muvaffaqiyat", `${data.discountPercent}% chegirma qo'llanildi`);
    } catch (e) {
      Alert.alert("Xatolik", "Promokod noto'g'ri yoki faol emas");
    }
  };

  const handleCheckout = async () => {
    if (isCheckingOut) return;
    setIsCheckingOut(true);
    checkoutScale.value = withSequence(
      withSpring(0.96, { damping: 10 }),
      withSpring(1, { damping: 12 })
    );

    try {
      let userLocation = null;
      try {
        const locationData = await AsyncStorage.getItem("@user_location");
        if (locationData) userLocation = JSON.parse(locationData);
      } catch (e) {}

      const data = {
        id: `order-${Date.now()}`,
        customerId: user?.id,
        customerName: user?.name || "Mehmon",
        phoneNumber: user?.phoneNumber || "",
        address: deliveryType === "pickup" ? "Do'kondan olib ketiladi" : (userLocation?.address || "Toshkent shahri"),
        latitude: deliveryType === "pickup" ? null : (userLocation?.latitude || null),
        longitude: deliveryType === "pickup" ? null : (userLocation?.longitude || null),
        total: finalTotal,
        discount,
        deliveryType,
        deliveryFee: delivery,
        promoCode: discount > 0 ? promo : undefined,
        items: items.map((i) => ({ productId: i.product.id, name: i.product.name, qty: i.quantity, price: i.product.price })),
      };

      const res = await apiRequest("POST", "/api/orders", data);
      const newOrder = await res.json();
      await queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/orders/my"] });
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      clearCart();
      router.push(`/order/${newOrder.id}`);
    } catch (e) {
      Alert.alert("Xatolik", "Buyurtma berishda xatolik yuz berdi");
      setIsCheckingOut(false);
    }
  };

  const bgColors: [string, string, string] = [
    Colors.screenGradientStart,
    Colors.screenGradientMid,
    Colors.background,
  ];

  if (items.length === 0) {
    return (
      <View style={{ flex: 1 }}>
        <LinearGradient colors={bgColors} locations={[0, 0.3, 1]} style={StyleSheet.absoluteFill} />
        <View style={[styles.emptyContainer, { paddingTop: topPad }]}>
          <View style={[
            styles.emptyIconWrap,
            {
              backgroundColor: isDarkMode ? "rgba(28,28,30,0.7)" : "rgba(255,255,255,0.8)",
              borderColor: isDarkMode ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.9)",
            }
          ]}>
            <Ionicons name="bag-outline" size={44} color={Colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: Colors.text }]}>Savat bo&apos;sh</Text>
          <Text style={[styles.emptySubtitle, { color: Colors.textSecondary }]}>
            Mahsulotlarni bosh sahifadan qo&apos;shing
          </Text>
          <Pressable
            style={styles.shopBtn}
            onPress={() => router.push("/(tabs)")}
          >
            <Text style={styles.shopBtnText}>Bosh sahifaga o&apos;tish</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={bgColors} locations={[0, 0.25, 1]} style={StyleSheet.absoluteFill} />
      <View style={[
        styles.blobTR,
        { backgroundColor: isDarkMode ? "rgba(22,163,74,0.07)" : "rgba(22,163,74,0.11)" }
      ]} />

      <View style={[styles.headerRow, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.title, { color: Colors.text }]}>Savat</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{totalItems}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: footerBottomOffset + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item) => (
          <CartItemRow
            key={item.product.id}
            item={item}
            isDarkMode={isDarkMode}
            Colors={Colors}
            onRemove={removeFromCart}
            onUpdate={updateQuantity}
          />
        ))}

        <View style={[
          styles.deliveryToggleCard,
          {
            backgroundColor: isDarkMode ? "rgba(28,28,30,0.7)" : "rgba(255,255,255,0.82)",
            borderColor: isDarkMode ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.9)",
          }
        ]}>
          <Text style={[styles.deliveryToggleTitle, { color: Colors.text }]}>
            Yetkazib berish usuli
          </Text>
          <View style={styles.deliveryToggleRow}>
            <Pressable
              style={[
                styles.deliveryToggleBtn,
                deliveryType === "delivery" && styles.deliveryToggleBtnActive,
                {
                  backgroundColor: deliveryType === "delivery"
                    ? Colors.primary
                    : isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                }
              ]}
              onPress={() => {
                setDeliveryType("delivery");
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Ionicons
                name="bicycle"
                size={18}
                color={deliveryType === "delivery" ? "#fff" : Colors.textSecondary}
              />
              <Text style={[
                styles.deliveryToggleBtnText,
                { color: deliveryType === "delivery" ? "#fff" : Colors.textSecondary }
              ]}>
                Yetkazib berish
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.deliveryToggleBtn,
                deliveryType === "pickup" && styles.deliveryToggleBtnActive,
                {
                  backgroundColor: deliveryType === "pickup"
                    ? Colors.primary
                    : isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                }
              ]}
              onPress={() => {
                setDeliveryType("pickup");
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Ionicons
                name="storefront-outline"
                size={18}
                color={deliveryType === "pickup" ? "#fff" : Colors.textSecondary}
              />
              <Text style={[
                styles.deliveryToggleBtnText,
                { color: deliveryType === "pickup" ? "#fff" : Colors.textSecondary }
              ]}>
                O'zim olib ketaman
              </Text>
            </Pressable>
          </View>

          {deliveryType === "pickup" && (
            <View style={[
              styles.pickupInfo,
              { backgroundColor: isDarkMode ? "rgba(22,163,74,0.12)" : "rgba(22,163,74,0.08)" }
            ]}>
              <Ionicons name="location" size={16} color={Colors.primary} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.pickupInfoTitle}>Do'kon manzili</Text>
                <Text style={styles.pickupInfoAddr}>Al-Xorazmiy 2-tor ko'chasi, 48/5, Xonqa, Xorazm viloyati</Text>
                <Text style={styles.pickupInfoNote}>Zakaz tayyor bo'lganda SMS xabar olasiz</Text>
              </View>
            </View>
          )}
        </View>

        <View style={[
          styles.promoRow,
          {
            backgroundColor: isDarkMode ? "rgba(28,28,30,0.7)" : "rgba(255,255,255,0.75)",
            borderColor: isDarkMode ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.9)",
          }
        ]}>
          <Ionicons name="pricetag-outline" size={18} color={Colors.textMuted} style={{ marginLeft: 4 }} />
          <TextInput
            style={[styles.promoInput, { color: Colors.text }]}
            placeholder="Promokod kiriting"
            placeholderTextColor={Colors.textMuted}
            value={promo}
            onChangeText={setPromo}
          />
          <Pressable
            style={[styles.promoBtn, { opacity: promo.length > 0 ? 1 : 0.5 }]}
            onPress={applyPromo}
            disabled={promo.length === 0}
          >
            <Text style={styles.promoBtnText}>Qo&apos;llash</Text>
          </Pressable>
        </View>

        <View style={[
          styles.summaryCard,
          {
            backgroundColor: isDarkMode ? "rgba(28,28,30,0.7)" : "rgba(255,255,255,0.82)",
            borderColor: isDarkMode ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.9)",
          }
        ]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: Colors.textSecondary }]}>Mahsulotlar</Text>
            <Text style={[styles.summaryValue, { color: Colors.text }]}>{formatPrice(totalPrice)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <View style={{ gap: 2 }}>
              <Text style={[styles.summaryLabel, { color: Colors.textSecondary }]}>
                {deliveryType === "pickup" ? "Yetkazib berish" : "Yetkazib berish"}
              </Text>
              {deliveryType === "delivery" && deliveryDistanceKm !== null && deliveryFeeBase > 0 && (
                <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 11, color: Colors.textMuted }}>
                  {deliveryDistanceKm.toFixed(1)} km × 1 500 so'm
                </Text>
              )}
              {deliveryType === "pickup" && (
                <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 11, color: Colors.primary }}>
                  O'zim olib ketaman
                </Text>
              )}
            </View>
            <Text style={[styles.summaryValue, delivery === 0 ? styles.freeText : { color: Colors.text }]}>
              {deliveryType === "pickup" ? "Bepul" : delivery === 0 ? "Bepul" : formatPrice(delivery)}
            </Text>
          </View>
          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: Colors.error }]}>Chegirma</Text>
              <Text style={[styles.summaryValue, { color: Colors.error }]}>-{discount}%</Text>
            </View>
          )}
          <View style={[styles.divider, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: Colors.text }]}>Jami</Text>
            <Text style={styles.totalValue}>{formatPrice(finalTotal)}</Text>
          </View>
        </View>

        {delivery === 0 && (
          <View style={[styles.freeBanner, { backgroundColor: isDarkMode ? "rgba(22,163,74,0.18)" : "rgba(22,163,74,0.1)" }]}>
            <Ionicons name="bicycle" size={18} color={Colors.primary} />
            <Text style={styles.freeBannerText}>Bepul yetkazib berish</Text>
          </View>
        )}

        <Text style={[styles.note, { color: Colors.textMuted }]}>
          Buyurtma kuryerga biriktirilguniga qadar bekor qilinishi mumkin.
        </Text>

        <View style={{ height: 16 }} />
      </ScrollView>

      <View style={[
        styles.footer,
        { bottom: footerBottomOffset },
      ]}>
        <Animated.View style={checkoutAnim}>
          <Pressable
            style={[styles.checkoutBtn, isCheckingOut && { opacity: 0.7 }]}
            onPress={handleCheckout}
            disabled={isCheckingOut}
            onPressIn={() => { if (!isCheckingOut) checkoutScale.value = withSpring(0.97, { damping: 12 }); }}
            onPressOut={() => { if (!isCheckingOut) checkoutScale.value = withSpring(1, { damping: 12 }); }}
          >
            <View style={styles.checkoutLeft}>
              {isCheckingOut
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name={deliveryType === "pickup" ? "storefront-outline" : "bag-check-outline"} size={20} color="#fff" />}
              <Text style={styles.checkoutText}>
                {isCheckingOut ? "Yuklanmoqda..." : deliveryType === "pickup" ? "Do'kondan olib ketaman" : "Buyurtma berish"}
              </Text>
            </View>
            {!isCheckingOut && (
              <View style={styles.checkoutBadge}>
                <Text style={styles.checkoutBadgeText}>{formatPrice(finalTotal)}</Text>
              </View>
            )}
          </Pressable>
        </Animated.View>
      </View>
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
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 8,
  },
  emptyTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
  },
  emptySubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    textAlign: "center",
  },
  shopBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: StaticColors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 18,
    marginTop: 8,
    shadowColor: StaticColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  shopBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
  },
  countBadge: {
    backgroundColor: StaticColors.primary,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
    shadowColor: StaticColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  countText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    color: "#fff",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 0,
  },
  promoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  promoInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    paddingVertical: 8,
  },
  promoBtn: {
    backgroundColor: StaticColors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  promoBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#fff",
  },
  summaryCard: {
    borderRadius: 22,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
  },
  summaryValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
  },
  freeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: StaticColors.primary,
  },
  divider: {
    height: 1,
  },
  totalLabel: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
  },
  totalValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 19,
    color: StaticColors.primary,
  },
  freeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginBottom: 12,
  },
  freeBannerText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: StaticColors.primary,
  },
  note: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  deliveryToggleCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  deliveryToggleTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
  deliveryToggleRow: {
    flexDirection: "row",
    gap: 10,
  },
  deliveryToggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 11,
    borderRadius: 14,
  },
  deliveryToggleBtnActive: {},
  deliveryToggleBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
  },
  pickupInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: 14,
  },
  pickupInfoTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: StaticColors.primary,
  },
  pickupInfoAddr: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: StaticColors.primary,
  },
  pickupInfoNote: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: StaticColors.mintGreen,
    marginTop: 2,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  checkoutBtn: {
    backgroundColor: StaticColors.primary,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: StaticColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10,
  },
  checkoutLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkoutText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#fff",
  },
  checkoutBadge: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  checkoutBadgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: "#fff",
  },
});
