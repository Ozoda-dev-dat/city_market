import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  RefreshControl,
  Animated,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import getColors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/ProductsContext";
import { formatPrice } from "@/constants/data";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import { wsManager } from "@/lib/websocket";
import { Order } from "@/shared/schema";

let MapView: any = null;
let Marker: any = null;
if (Platform.OS !== "web") {
  const Maps = require("react-native-maps");
  MapView = Maps.default;
  Marker = Maps.Marker;
}

interface Coord {
  latitude: number;
  longitude: number;
}

function haversineKm(a: Coord, b: Coord): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.latitude * Math.PI) / 180) *
      Math.cos((b.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function formatEta(km: number): string {
  const minutes = Math.round((km / 25) * 60);
  if (minutes < 1) return "1 daqiqadan kam";
  if (minutes < 60) return `~${minutes} daqiqa`;
  return `~${Math.round(minutes / 60)} soat`;
}

export default function CustomerOrderTracking() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { orders: adminOrders, isLoading: isLoadingOrders } = useApp();
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const styles = getStyles(isDarkMode);
  const queryClient = useQueryClient();
  const mapRef = useRef<any>(null);

  const [refreshing, setRefreshing] = useState(false);
  const [progressAnim] = useState(new Animated.Value(0));
  const [courierCoord, setCourierCoord] = useState<Coord | null>(null);
  const [etaText, setEtaText] = useState<string | null>(null);

  const { data: myOrders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders/my"],
    queryFn: () => apiRequest("GET", "/api/orders/my").then((res) => res.json()),
    enabled: !adminOrders.find((o) => o.id === id),
  });

  const order = adminOrders.find((o) => o.id === id) ?? myOrders.find((o) => o.id === id);

  const customerCoord: Coord | null =
    order?.latitude && order?.longitude
      ? {
          latitude: parseFloat(order.latitude),
          longitude: parseFloat(order.longitude),
        }
      : null;

  const handleCourierLocation = useCallback(
    (data: unknown) => {
      const loc = data as { orderId: string; latitude: number; longitude: number };
      if (loc.orderId !== id) return;
      const coord: Coord = { latitude: loc.latitude, longitude: loc.longitude };
      setCourierCoord(coord);
      if (customerCoord) {
        const km = haversineKm(coord, customerCoord);
        setEtaText(formatEta(km));
      }
      if (mapRef.current && customerCoord) {
        mapRef.current.fitToCoordinates([coord, customerCoord], {
          edgePadding: { top: 60, right: 40, bottom: 60, left: 40 },
          animated: true,
        });
      }
    },
    [id, customerCoord]
  );

  const handleStatusUpdate = useCallback(
    (data: unknown) => {
      const update = data as { orderId: string; status: string };
      if (update.orderId !== id) return;
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/my"] });
    },
    [id, queryClient]
  );

  useEffect(() => {
    const off1 = wsManager.on("courier-location", handleCourierLocation);
    const off2 = wsManager.on("order-status-updated", handleStatusUpdate);
    return () => {
      off1();
      off2();
    };
  }, [handleCourierLocation, handleStatusUpdate]);

  const currentStep = (() => {
    if (!order) return 0;
    switch (order.status) {
      case "pending":
      case "confirmed":
        return 0;
      case "preparing":
        return 1;
      case "ready":
        return 2;
      case "delivering":
        return 3;
      case "delivered":
        return 4;
      default:
        return 0;
    }
  })();

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentStep / 4,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    await queryClient.invalidateQueries({ queryKey: ["/api/orders/my"] });
    setRefreshing(false);
  };

  if (!order && isLoadingOrders) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: "center", justifyContent: "center", gap: 16 }}>
        <Ionicons name="receipt-outline" size={64} color={Colors.textMuted} />
        <Text style={{ fontFamily: "Poppins_500Medium", fontSize: 16, color: Colors.textSecondary }}>
          Buyurtma topilmadi
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={{ paddingHorizontal: 24, paddingVertical: 12, backgroundColor: Colors.primary, borderRadius: 12 }}
        >
          <Text style={{ color: "#fff", fontFamily: "Poppins_600SemiBold" }}>Ortga qaytish</Text>
        </Pressable>
      </View>
    );
  }

  const isCancelled = order.status === "cancelled";

  const steps = [
    {
      key: "confirmed",
      label: "Qabul qilindi",
      description: "Buyurtmangiz qabul qilindi",
      icon: "checkmark-circle-outline" as const,
    },
    {
      key: "preparing",
      label: "Do'konga ketmoqda",
      description: "Kuryer do'konga yo'l oldi",
      icon: "bicycle-outline" as const,
    },
    {
      key: "ready",
      label: "Mahsulot olinmoqda",
      description: "Kuryer mahsulotlarni yig'moqda",
      icon: "bag-handle-outline" as const,
    },
    {
      key: "delivering",
      label: "Sizga kelmoqda",
      description: "Kuryer yo'lda",
      icon: "navigate-outline" as const,
    },
    {
      key: "delivered",
      label: "Yetkazildi",
      description: "Buyurtma muvaffaqiyatli yetkazildi",
      icon: "home-outline" as const,
    },
  ];

  const showMap =
    Platform.OS !== "web" &&
    MapView &&
    order.status === "delivering" &&
    customerCoord;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Buyurtma holati</Text>
        {order.status === "delivering" && (
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>JONLI</Text>
          </View>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Live Map - shown when courier is on the way */}
        {showMap && (
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFill}
              initialRegion={{
                latitude: customerCoord!.latitude,
                longitude: customerCoord!.longitude,
                latitudeDelta: 0.04,
                longitudeDelta: 0.04,
              }}
              showsCompass={false}
              showsScale={false}
              toolbarEnabled={false}
            >
              {courierCoord && (
                <Marker coordinate={courierCoord} anchor={{ x: 0.5, y: 0.5 }}>
                  <View style={styles.courierMarker}>
                    <Ionicons name="bicycle" size={16} color="#fff" />
                  </View>
                </Marker>
              )}
              <Marker coordinate={customerCoord!}>
                <View style={styles.destinationMarker}>
                  <Ionicons name="home" size={16} color="#fff" />
                </View>
              </Marker>
            </MapView>

            {etaText && (
              <View style={styles.etaBadge}>
                <Ionicons name="time-outline" size={14} color="#16A34A" />
                <Text style={styles.etaText}>{etaText}</Text>
              </View>
            )}

            {!courierCoord && (
              <View style={styles.mapWaiting}>
                <ActivityIndicator size="small" color="#16A34A" />
                <Text style={styles.mapWaitingText}>Kuryer joylashuvi kutilmoqda...</Text>
              </View>
            )}
          </View>
        )}

        <View style={{ padding: 16, gap: 14 }}>
          {/* Order header card */}
          <View style={styles.card}>
            <View style={styles.orderRow}>
              <View>
                <Text style={styles.orderNum}>Buyurtma #{order.id.slice(-6).toUpperCase()}</Text>
                <Text style={styles.orderDate}>
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString("uz-UZ", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : ""}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status, Colors) + "22" }]}>
                <Text style={[styles.statusBadgeText, { color: getStatusColor(order.status, Colors) }]}>
                  {getStatusLabel(order.status)}
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Jami summa</Text>
              <Text style={styles.totalAmount}>{formatPrice(order.total)}</Text>
            </View>
          </View>

          {/* Progress bar */}
          {!isCancelled && (
            <View style={styles.card}>
              <View style={styles.progressHeader}>
                <Text style={styles.cardTitle}>Buyurtma jarayoni</Text>
                <Text style={styles.progressPercent}>{Math.round((currentStep / 4) * 100)}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0%", "100%"],
                      }),
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Status stepper */}
          {isCancelled ? (
            <View style={[styles.card, { alignItems: "center", paddingVertical: 32, gap: 12 }]}>
              <Ionicons name="close-circle" size={56} color={Colors.error} />
              <Text style={[styles.cardTitle, { color: Colors.error }]}>Buyurtma bekor qilingan</Text>
              <Text style={{ fontFamily: "Poppins_400Regular", color: Colors.textSecondary, textAlign: "center" }}>
                Bu buyurtma bekor qilingan. Iltimos, qayta buyurtma bering.
              </Text>
              <Pressable
                style={{ backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
                onPress={() => router.push("/(tabs)" as any)}
              >
                <Text style={{ color: "#fff", fontFamily: "Poppins_600SemiBold" }}>Qayta buyurtma berish</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Batafsil holat</Text>
              {steps.map((step, idx) => {
                const isDone = idx < currentStep;
                const isCurrent = idx === currentStep;
                return (
                  <View key={step.key} style={styles.stepRow}>
                    <View style={styles.stepLeft}>
                      <View
                        style={[
                          styles.stepDot,
                          isDone && styles.stepDotDone,
                          isCurrent && styles.stepDotCurrent,
                        ]}
                      >
                        <Ionicons
                          name={isDone ? "checkmark" : step.icon}
                          size={isCurrent ? 20 : 16}
                          color={isDone ? "#fff" : isCurrent ? Colors.primary : Colors.textMuted}
                        />
                      </View>
                      {idx < steps.length - 1 && (
                        <View style={[styles.stepConnector, isDone && styles.stepConnectorDone]} />
                      )}
                    </View>
                    <View style={[styles.stepRight, idx < steps.length - 1 && { paddingBottom: 20 }]}>
                      <Text
                        style={[
                          styles.stepLabel,
                          isDone && styles.stepLabelDone,
                          isCurrent && styles.stepLabelCurrent,
                        ]}
                      >
                        {step.label}
                      </Text>
                      <Text style={styles.stepDesc}>{step.description}</Text>
                      {isCurrent && (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentBadgeText}>Hozirgi holat</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* ETA card when delivering */}
          {order.status === "delivering" && etaText && (
            <View style={[styles.card, styles.etaCard]}>
              <Ionicons name="time-outline" size={24} color="#16A34A" />
              <View style={{ flex: 1 }}>
                <Text style={styles.etaCardLabel}>Taxminiy yetkazish vaqti</Text>
                <Text style={styles.etaCardValue}>{etaText}</Text>
              </View>
            </View>
          )}

          {/* Delivery info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Yetkazish ma'lumotlari</Text>
            <View style={styles.infoRow}>
              <View style={styles.iconWrap}>
                <Ionicons name="location" size={16} color="#16A34A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Manzil</Text>
                <Text style={styles.infoValue}>{order.address}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.iconWrap}>
                <Ionicons name="person" size={16} color="#16A34A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Qabul qiluvchi</Text>
                <Text style={styles.infoValue}>{order.customerName}</Text>
                <Text style={styles.infoPhone}>{order.phoneNumber}</Text>
              </View>
            </View>
          </View>

          {/* Order items */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Buyurtma mahsulotlari</Text>
            {(order.items as any[])?.map((item: any, i: number) => (
              <View key={i} style={[styles.itemRow, i < (order.items as any[]).length - 1 && styles.itemRowBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemQty}>
                    {item.qty} x {formatPrice(item.price)}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>{formatPrice(item.price * item.qty)}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function getStatusColor(status: string, Colors: any): string {
  switch (status) {
    case "pending":
    case "confirmed":
      return Colors.warning ?? "#F59E0B";
    case "preparing":
    case "ready":
      return Colors.primary;
    case "delivering":
      return Colors.primary;
    case "delivered":
      return "#10B981";
    case "cancelled":
      return Colors.error;
    default:
      return Colors.textMuted;
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "Kutilmoqda";
    case "confirmed":
      return "Tasdiqlandi";
    case "preparing":
      return "Tayyorlanmoqda";
    case "ready":
      return "Tayyor";
    case "delivering":
      return "Yo'lda";
    case "delivered":
      return "Yetkazildi";
    case "cancelled":
      return "Bekor qilingan";
    default:
      return status;
  }
}

const getStyles = (isDarkMode: boolean) => {
  const Colors = getColors(isDarkMode);
  return StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingBottom: 12,
      backgroundColor: Colors.card,
      borderBottomWidth: 1,
      borderBottomColor: Colors.divider,
      gap: 12,
    },
    backBtn: { padding: 4 },
    title: {
      flex: 1,
      fontFamily: "Poppins_700Bold",
      fontSize: 18,
      color: Colors.text,
    },
    livePill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: isDarkMode ? "rgba(22,163,74,0.15)" : "#DCFCE7",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    liveDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: "#16A34A",
    },
    liveText: {
      fontFamily: "Poppins_700Bold",
      fontSize: 10,
      color: "#16A34A",
      letterSpacing: 0.5,
    },

    mapContainer: {
      height: 260,
      backgroundColor: isDarkMode ? "#1C1C1E" : "#E8F5E9",
      overflow: "hidden",
    },
    courierMarker: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "#16A34A",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2.5,
      borderColor: "#fff",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    destinationMarker: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "#EF4444",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2.5,
      borderColor: "#fff",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    etaBadge: {
      position: "absolute",
      top: 12,
      left: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: isDarkMode ? "rgba(28,28,30,0.9)" : "rgba(255,255,255,0.95)",
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 4,
    },
    etaText: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 12,
      color: "#16A34A",
    },
    mapWaiting: {
      position: "absolute",
      bottom: 12,
      left: 12,
      right: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: isDarkMode ? "rgba(28,28,30,0.88)" : "rgba(255,255,255,0.9)",
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    mapWaitingText: {
      fontFamily: "Poppins_400Regular",
      fontSize: 12,
      color: Colors.textSecondary,
    },

    card: {
      backgroundColor: Colors.card,
      borderRadius: 20,
      padding: 16,
      gap: 10,
    },
    cardTitle: {
      fontFamily: "Poppins_700Bold",
      fontSize: 16,
      color: Colors.text,
    },

    orderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    orderNum: {
      fontFamily: "Poppins_700Bold",
      fontSize: 17,
      color: Colors.text,
    },
    orderDate: {
      fontFamily: "Poppins_400Regular",
      fontSize: 13,
      color: Colors.textMuted,
      marginTop: 2,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 20,
    },
    statusBadgeText: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 12,
    },
    divider: {
      height: 1,
      backgroundColor: Colors.divider,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    totalLabel: {
      fontFamily: "Poppins_500Medium",
      fontSize: 14,
      color: Colors.textMuted,
    },
    totalAmount: {
      fontFamily: "Poppins_700Bold",
      fontSize: 18,
      color: Colors.primary,
    },

    progressHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    progressPercent: {
      fontFamily: "Poppins_700Bold",
      fontSize: 16,
      color: Colors.primary,
    },
    progressTrack: {
      height: 8,
      backgroundColor: Colors.divider,
      borderRadius: 4,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: Colors.primary,
      borderRadius: 4,
    },

    stepRow: {
      flexDirection: "row",
      gap: 14,
    },
    stepLeft: {
      alignItems: "center",
      width: 40,
    },
    stepDot: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: Colors.divider,
      alignItems: "center",
      justifyContent: "center",
    },
    stepDotDone: {
      backgroundColor: Colors.primary,
    },
    stepDotCurrent: {
      backgroundColor: Colors.primary + "20",
      borderWidth: 2,
      borderColor: Colors.primary,
    },
    stepConnector: {
      width: 2,
      flex: 1,
      backgroundColor: Colors.divider,
      marginVertical: 2,
    },
    stepConnectorDone: {
      backgroundColor: Colors.primary,
    },
    stepRight: {
      flex: 1,
      paddingTop: 8,
    },
    stepLabel: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 15,
      color: Colors.textMuted,
    },
    stepLabelDone: {
      color: Colors.text,
    },
    stepLabelCurrent: {
      color: Colors.primary,
    },
    stepDesc: {
      fontFamily: "Poppins_400Regular",
      fontSize: 13,
      color: Colors.textSecondary,
      marginTop: 2,
    },
    currentBadge: {
      marginTop: 6,
      alignSelf: "flex-start",
      backgroundColor: Colors.primary + "20",
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 10,
    },
    currentBadgeText: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 11,
      color: Colors.primary,
    },

    etaCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: isDarkMode ? "rgba(22,163,74,0.12)" : "#F0FDF4",
      borderWidth: 1,
      borderColor: isDarkMode ? "rgba(22,163,74,0.25)" : "#BBF7D0",
    },
    etaCardLabel: {
      fontFamily: "Poppins_400Regular",
      fontSize: 12,
      color: Colors.textSecondary,
    },
    etaCardValue: {
      fontFamily: "Poppins_700Bold",
      fontSize: 16,
      color: "#16A34A",
    },

    infoRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: 9,
      backgroundColor: isDarkMode ? "rgba(22,163,74,0.15)" : "#DCFCE7",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
    },
    infoLabel: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 13,
      color: Colors.text,
      marginBottom: 2,
    },
    infoValue: {
      fontFamily: "Poppins_400Regular",
      fontSize: 14,
      color: Colors.textSecondary,
    },
    infoPhone: {
      fontFamily: "Poppins_400Regular",
      fontSize: 13,
      color: Colors.textMuted,
      marginTop: 1,
    },

    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
    },
    itemRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: Colors.divider,
    },
    itemName: {
      fontFamily: "Poppins_500Medium",
      fontSize: 14,
      color: Colors.text,
    },
    itemQty: {
      fontFamily: "Poppins_400Regular",
      fontSize: 13,
      color: Colors.textMuted,
      marginTop: 2,
    },
    itemTotal: {
      fontFamily: "Poppins_700Bold",
      fontSize: 14,
      color: Colors.primary,
    },
  });
};
