import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  Linking,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import getColors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/ProductsContext";
import { formatPrice } from "@/constants/data";

let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
if (Platform.OS !== "web") {
  const Maps = require("react-native-maps");
  MapView = Maps.default;
  Marker = Maps.Marker;
  Polyline = Maps.Polyline;
}

interface Coord {
  latitude: number;
  longitude: number;
}

async function fetchRoute(from: Coord, to: Coord): Promise<Coord[]> {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${from.longitude},${from.latitude};${to.longitude},${to.latitude}` +
      `?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.length) return [from, to];
    return (data.routes[0].geometry.coordinates as [number, number][]).map(
      ([lng, lat]) => ({ latitude: lat, longitude: lng })
    );
  } catch {
    return [from, to];
  }
}

function openExternalMap(lat: number, lng: number) {
  const url =
    Platform.OS === "ios"
      ? `maps://app?daddr=${lat},${lng}`
      : `geo:${lat},${lng}?q=${lat},${lng}`;
  Linking.canOpenURL(url).then((can) => {
    Linking.openURL(
      can ? url : `https://www.google.com/maps?q=${lat},${lng}`
    );
  });
}

function callPhone(phone: string) {
  Linking.openURL(`tel:${phone.replace(/\s/g, "")}`).catch(() =>
    Alert.alert("Xatolik", "Qo'ng'iroq qilishda muammo yuz berdi")
  );
}

export default function CourierOrderDetail() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { orders, updateOrderStatus } = useApp();
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const styles = getStyles(isDarkMode);
  const mapRef = useRef<any>(null);

  const [courierLocation, setCourierLocation] = useState<Coord | null>(null);
  const [routeCoords, setRouteCoords] = useState<Coord[]>([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const order = orders.find((o) => o.id === id);

  const customerCoord: Coord | null =
    order?.latitude && order?.longitude
      ? {
          latitude: parseFloat(order.latitude),
          longitude: parseFloat(order.longitude),
        }
      : null;

  useEffect(() => {
    if (Platform.OS === "web" || !customerCoord) return;

    let watcher: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError("Joylashuv ruxsati berilmagan");
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const from: Coord = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };
      setCourierLocation(from);

      setRouteLoading(true);
      const route = await fetchRoute(from, customerCoord!);
      setRouteCoords(route);
      setRouteLoading(false);

      setTimeout(() => {
        if (mapRef.current && route.length > 1) {
          mapRef.current.fitToCoordinates(route, {
            edgePadding: { top: 60, right: 40, bottom: 60, left: 40 },
            animated: true,
          });
        }
      }, 600);

      watcher = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 30 },
        async (pos) => {
          const updated: Coord = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setCourierLocation(updated);
          const newRoute = await fetchRoute(updated, customerCoord!);
          setRouteCoords(newRoute);
        }
      );
    })();

    return () => {
      watcher?.remove();
    };
  }, [order?.id]);

  if (!order) return null;

  const handleAction = async () => {
    const statusMap: any = { ready: "delivering", delivering: "delivered" };
    const next = statusMap[order.status];
    if (!next) return;
    try {
      await updateOrderStatus(order.id, next);
      if (Platform.OS !== "web")
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Xatolik", "Statusni yangilashda xatolik yuz berdi");
    }
  };

  const buttonConfig: any = {
    ready: { label: "Olishni tasdiqlash", icon: "bicycle", color: Colors.primary },
    delivering: { label: "Yetkazilganligini tasdiqlash", icon: "checkmark-circle", color: "#10B981" },
    delivered: { label: "Yetkazilgan", icon: "checkmark", color: Colors.textMuted, disabled: true },
    pending: { label: "Tayyorlanmoqda...", icon: "time", color: Colors.textMuted, disabled: true },
  };
  const config = buttonConfig[order.status] || buttonConfig.pending;

  const mapInitialRegion = customerCoord
    ? {
        latitude: customerCoord.latitude,
        longitude: customerCoord.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      }
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Buyurtma #{order.id.slice(-6).toUpperCase()}</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {customerCoord && Platform.OS !== "web" && MapView ? (
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFill}
              initialRegion={mapInitialRegion!}
              showsUserLocation={false}
              showsCompass={false}
              showsScale={false}
              toolbarEnabled={false}
            >
              {courierLocation && (
                <Marker coordinate={courierLocation} anchor={{ x: 0.5, y: 0.5 }}>
                  <View style={styles.courierMarker}>
                    <Ionicons name="bicycle" size={16} color="#fff" />
                  </View>
                </Marker>
              )}

              <Marker coordinate={customerCoord}>
                <View style={styles.customerMarker}>
                  <Ionicons name="location" size={20} color="#fff" />
                </View>
              </Marker>

              {routeCoords.length > 1 && (
                <Polyline
                  coordinates={routeCoords}
                  strokeColor="#EF4444"
                  strokeWidth={4}
                  lineDashPattern={undefined}
                />
              )}
            </MapView>

            {routeLoading && (
              <View style={styles.mapOverlay}>
                <ActivityIndicator size="small" color="#16A34A" />
                <Text style={styles.mapOverlayText}>Marshrut hisoblanmoqda...</Text>
              </View>
            )}

            {locationError && (
              <View style={styles.mapOverlay}>
                <Ionicons name="warning-outline" size={18} color="#EF4444" />
                <Text style={[styles.mapOverlayText, { color: "#EF4444" }]}>
                  {locationError}
                </Text>
              </View>
            )}

            {customerCoord && (
              <Pressable
                style={styles.externalNavBtn}
                onPress={() =>
                  openExternalMap(customerCoord.latitude, customerCoord.longitude)
                }
              >
                <Ionicons name="navigate" size={16} color="#fff" />
                <Text style={styles.externalNavText}>Navigatsiya</Text>
              </Pressable>
            )}
          </View>
        ) : (
          customerCoord && (
            <Pressable
              style={[styles.webMapBtn, { margin: 16 }]}
              onPress={() =>
                openExternalMap(customerCoord.latitude, customerCoord.longitude)
              }
            >
              <Ionicons name="navigate" size={18} color="#fff" />
              <Text style={styles.webMapBtnText}>Xaritada ko'rish</Text>
            </Pressable>
          )
        )}

        <View style={{ padding: 16, gap: 14 }}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Yetkazish manzili</Text>
            <View style={styles.infoRow}>
              <View style={styles.iconWrap}>
                <Ionicons name="location" size={16} color="#16A34A" />
              </View>
              <Text style={[styles.infoValue, { flex: 1 }]}>{order.address}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Mijoz ma&apos;lumotlari</Text>
            <View style={styles.infoRow}>
              <View style={styles.iconWrap}>
                <Ionicons name="person" size={16} color="#16A34A" />
              </View>
              <Text style={styles.infoValue}>{order.customerName}</Text>
            </View>
            <Pressable style={styles.callBtn} onPress={() => callPhone(order.phoneNumber)}>
              <View style={styles.iconWrap}>
                <Ionicons name="call" size={16} color="#16A34A" />
              </View>
              <Text style={[styles.infoValue, { color: "#16A34A", fontFamily: "Poppins_600SemiBold" }]}>
                {order.phoneNumber}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#16A34A" style={{ marginLeft: "auto" }} />
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Mahsulotlar</Text>
            {(order.items as any[]).map((item, i) => (
              <View key={i} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQty}>x{item.qty}</Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Jami to'lov</Text>
              <Text style={styles.totalValue}>{formatPrice(order.total)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Pressable
          style={[
            styles.mainBtn,
            { backgroundColor: config.color, opacity: config.disabled ? 0.6 : 1 },
          ]}
          onPress={handleAction}
          disabled={config.disabled}
        >
          <Ionicons name={config.icon} size={20} color="#fff" />
          <Text style={styles.mainBtnText}>{config.label}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const getStyles = (isDarkMode: boolean) => {
  const Colors = getColors(isDarkMode);
  return StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingBottom: 12,
      gap: 16,
    },
    title: {
      fontFamily: "Poppins_700Bold",
      fontSize: 18,
      color: Colors.text,
    },
    mapContainer: {
      height: 280,
      backgroundColor: isDarkMode ? "#1C1C1E" : "#E8F5E9",
      overflow: "hidden",
    },
    mapOverlay: {
      position: "absolute",
      bottom: 12,
      left: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: isDarkMode ? "rgba(28,28,30,0.88)" : "rgba(255,255,255,0.9)",
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    mapOverlayText: {
      fontFamily: "Poppins_400Regular",
      fontSize: 12,
      color: Colors.textSecondary,
    },
    externalNavBtn: {
      position: "absolute",
      top: 12,
      right: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "#16A34A",
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 5,
    },
    externalNavText: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 13,
      color: "#fff",
    },
    webMapBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: "#16A34A",
      borderRadius: 14,
      paddingVertical: 14,
    },
    webMapBtnText: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 14,
      color: "#fff",
    },
    card: {
      backgroundColor: Colors.card,
      borderRadius: 20,
      padding: 16,
      gap: 10,
    },
    sectionTitle: {
      fontFamily: "Poppins_700Bold",
      fontSize: 15,
      color: Colors.text,
      marginBottom: 2,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: 9,
      backgroundColor: isDarkMode ? "rgba(22,163,74,0.15)" : "#DCFCE7",
      alignItems: "center",
      justifyContent: "center",
    },
    infoValue: {
      fontFamily: "Poppins_400Regular",
      fontSize: 14,
      color: Colors.textSecondary,
    },
    callBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: isDarkMode ? "rgba(22,163,74,0.08)" : "#F0FDF4",
      borderRadius: 12,
      padding: 10,
    },
    itemRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    itemName: {
      fontFamily: "Poppins_400Regular",
      fontSize: 14,
      color: Colors.textSecondary,
      flex: 1,
    },
    itemQty: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 14,
      color: Colors.text,
    },
    divider: {
      height: 1,
      backgroundColor: Colors.divider,
      marginVertical: 4,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    totalLabel: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 15,
      color: Colors.text,
    },
    totalValue: {
      fontFamily: "Poppins_700Bold",
      fontSize: 16,
      color: "#16A34A",
    },
    footer: {
      padding: 16,
    },
    mainBtn: {
      height: 56,
      borderRadius: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    mainBtnText: {
      fontFamily: "Poppins_700Bold",
      fontSize: 15,
      color: "#fff",
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
    customerMarker: {
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
  });
};
