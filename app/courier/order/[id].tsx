import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  Linking,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import getColors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/ProductsContext";
import { formatPrice } from "@/constants/data";

function openMap(latitude: string | null, longitude: string | null, address: string) {
  const lat = parseFloat(latitude ?? "");
  const lng = parseFloat(longitude ?? "");
  const hasCoords = !isNaN(lat) && !isNaN(lng);

  let url: string;
  if (hasCoords) {
    if (Platform.OS === "ios") {
      url = `maps://app?daddr=${lat},${lng}`;
    } else {
      url = `geo:${lat},${lng}?q=${lat},${lng}`;
    }
  } else {
    const encoded = encodeURIComponent(address);
    url = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
  }

  Linking.canOpenURL(url).then((can) => {
    if (can) {
      Linking.openURL(url);
    } else {
      const fallback = hasCoords
        ? `https://www.google.com/maps?q=${lat},${lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
      Linking.openURL(fallback);
    }
  });
}

function callPhone(phone: string) {
  const url = `tel:${phone.replace(/\s/g, "")}`;
  Linking.openURL(url).catch(() =>
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
  const order = orders.find((o) => o.id === id);

  if (!order) return null;

  const handleAction = async () => {
    const statusMap: any = { ready: "delivering", delivering: "delivered" };
    const next = statusMap[order.status];
    if (!next) return;
    try {
      await updateOrderStatus(order.id, next);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
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
  const hasCoords = order.latitude && order.longitude &&
    !isNaN(parseFloat(order.latitude)) && !isNaN(parseFloat(order.longitude));

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Buyurtma ma&apos;lumoti</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 120 }}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Yetkazish manzili</Text>

          <View style={styles.infoRow}>
            <View style={styles.iconWrap}>
              <Ionicons name="location" size={18} color="#16A34A" />
            </View>
            <Text style={[styles.infoValue, { flex: 1 }]}>{order.address}</Text>
          </View>

          <Pressable
            style={[styles.mapBtn, { backgroundColor: hasCoords ? "#16A34A" : Colors.card, borderWidth: hasCoords ? 0 : 1, borderColor: Colors.divider }]}
            onPress={() => openMap(order.latitude ?? null, order.longitude ?? null, order.address)}
          >
            <Ionicons name="navigate" size={18} color={hasCoords ? "#fff" : Colors.primary} />
            <Text style={[styles.mapBtnText, { color: hasCoords ? "#fff" : Colors.primary }]}>
              {hasCoords ? "Navigatsiyani boshlash" : "Xaritada ko'rish"}
            </Text>
          </Pressable>

          {hasCoords && (
            <View style={styles.coordsRow}>
              <Ionicons name="pin-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.coordsText}>
                {parseFloat(order.latitude!).toFixed(5)}, {parseFloat(order.longitude!).toFixed(5)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Mijoz ma&apos;lumotlari</Text>

          <View style={styles.infoRow}>
            <View style={styles.iconWrap}>
              <Ionicons name="person" size={16} color="#16A34A" />
            </View>
            <Text style={styles.infoValue}>{order.customerName}</Text>
          </View>

          <Pressable
            style={styles.callBtn}
            onPress={() => callPhone(order.phoneNumber)}
          >
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
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Pressable
          style={[styles.mainBtn, { backgroundColor: config.color, opacity: config.disabled ? 0.6 : 1 }]}
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
      padding: 16,
      gap: 16,
    },
    title: {
      fontFamily: "Poppins_700Bold",
      fontSize: 18,
      color: Colors.text,
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
    mapBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: 14,
      paddingVertical: 13,
      marginTop: 4,
    },
    mapBtnText: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 14,
    },
    coordsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      justifyContent: "center",
    },
    coordsText: {
      fontFamily: "Poppins_400Regular",
      fontSize: 11,
      color: Colors.textMuted,
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
  });
};
