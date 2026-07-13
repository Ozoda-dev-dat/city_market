import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import getColors, { Colors as StaticColors } from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { apiRequest } from "@/lib/query-client";
import { formatPrice } from "@/constants/data";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending:    { label: "Yangi",           color: StaticColors.warning, bg: StaticColors.warningBg, icon: "time-outline" },
  confirmed:  { label: "Qabul qilindi",   color: StaticColors.info,    bg: StaticColors.infoBg,     icon: "checkmark-circle-outline" },
  preparing:  { label: "Tayyorlanmoqda",  color: StaticColors.purple,  bg: StaticColors.purpleBg,   icon: "bag-handle-outline" },
  ready:      { label: "Tayyor",          color: StaticColors.primary, bg: StaticColors.primaryLight, icon: "cube-outline" },
  delivering: { label: "Yo'lda",          color: StaticColors.cyan,    bg: StaticColors.cyanBg,     icon: "bicycle-outline" },
  delivered:  { label: "Yetkazildi",      color: StaticColors.primary, bg: StaticColors.primaryLight, icon: "home-outline" },
  cancelled:  { label: "Bekor qilingan",  color: StaticColors.error,   bg: StaticColors.errorBg,    icon: "close-circle-outline" },
};

const FILTER_TABS = [
  { key: "all",       label: "Barchasi" },
  { key: "active",    label: "Faol" },
  { key: "delivered", label: "Yetkazildi" },
  { key: "cancelled", label: "Bekor" },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = diffMs / (1000 * 60 * 60);
  if (diffH < 1) {
    const diffM = Math.round(diffMs / (1000 * 60));
    return diffM <= 1 ? "Hozirgina" : `${diffM} daqiqa oldin`;
  }
  if (diffH < 24) return `${Math.floor(diffH)} soat oldin`;
  return d.toLocaleDateString("uz-UZ", { day: "numeric", month: "short" });
}

function LivePulse() {
  const [scale] = useState(new Animated.Value(1));
  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.4, duration: 700, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [scale]);
  return (
    <Animated.View
      style={{
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: StaticColors.cyan,
        transform: [{ scale }],
      }}
    />
  );
}

export default function CustomerOrdersScreen() {
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const styles = getStyles(isDarkMode);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const { data = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/orders/my"],
    queryFn: () => apiRequest("GET", "/api/orders/my").then((r) => r.json()),
    refetchInterval: 30000,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await qc.invalidateQueries({ queryKey: ["/api/orders/my"] });
    setRefreshing(false);
  }, [qc]);

  const filtered = (data as any[]).filter((o: any) => {
    if (filter === "all") return true;
    if (filter === "active") return !["delivered", "cancelled"].includes(o.status);
    if (filter === "delivered") return o.status === "delivered";
    if (filter === "cancelled") return o.status === "cancelled";
    return true;
  });

  const sortedOrders = [...filtered].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Buyurtmalarim</Text>
        <Pressable
          style={styles.refreshBtn}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={20} color={Colors.primary} />
        </Pressable>
      </View>

      <FlatList
        horizontal
        data={FILTER_TABS}
        keyExtractor={(t) => t.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.filterTab, filter === item.key && styles.filterTabActive]}
            onPress={() => setFilter(item.key)}
          >
            <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        )}
      />

      {isLoading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 60 }} />
      ) : sortedOrders.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="receipt-outline" size={56} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Buyurtma yo'q</Text>
          <Text style={styles.emptySub}>Buyurtmalaringiz shu yerda ko'rinadi</Text>
          <Pressable
            style={styles.shopBtn}
            onPress={() => router.push("/(tabs)")}
          >
            <Ionicons name="basket-outline" size={18} color="#fff" />
            <Text style={styles.shopBtnText}>Xaridga o'tish</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={sortedOrders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          renderItem={({ item: order }) => {
            const st = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
            const items: any[] = Array.isArray(order.items) ? order.items : [];
            const isLive = order.status === "delivering";
            const isCancelled = order.status === "cancelled";

            return (
              <Pressable
                style={[styles.card, isCancelled && styles.cardCancelled]}
                onPress={() =>
                  router.push({ pathname: "/order/[id]", params: { id: order.id } })
                }
              >
                <View style={styles.cardTop}>
                  <View style={styles.orderNumRow}>
                    <View style={[styles.statusIcon, { backgroundColor: st.bg }]}>
                      <Ionicons name={st.icon as any} size={16} color={st.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.orderNum}>
                        Buyurtma #{order.id.slice(-6).toUpperCase()}
                      </Text>
                      <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                    </View>
                    {isLive ? (
                      <View style={styles.livePill}>
                        <LivePulse />
                        <Text style={styles.liveText}>JONLI</Text>
                      </View>
                    ) : (
                      <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                        <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.cardMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="cube-outline" size={13} color={Colors.textMuted} />
                    <Text style={styles.metaText}>{items.length} ta mahsulot</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="card-outline" size={13} color={Colors.textMuted} />
                    <Text style={styles.metaText}>{formatPrice(order.total)}</Text>
                  </View>
                </View>

                {isLive && (
                  <View style={styles.trackRow}>
                    <View style={styles.trackInfo}>
                      <Ionicons name="bicycle" size={14} color={StaticColors.cyan} />
                      <Text style={styles.trackInfoText}>Kuryer sizga kelmoqda</Text>
                    </View>
                    <View style={styles.trackBtn}>
                      <Text style={styles.trackBtnText}>Kuzatish</Text>
                      <Ionicons name="chevron-forward" size={14} color={StaticColors.cyan} />
                    </View>
                  </View>
                )}

                {!isLive && !isCancelled && order.status !== "delivered" && (
                  <View style={styles.progressRow}>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.round(
                              (["pending", "confirmed", "preparing", "ready", "delivering", "delivered"].indexOf(order.status) /
                                5) *
                                100
                            )}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressLabel}>{st.label}</Text>
                  </View>
                )}

                <View style={styles.cardBottom}>
                  <Text style={styles.viewDetail}>Batafsil ko'rish</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const getStyles = (isDarkMode: boolean) => {
  const Colors = getColors(isDarkMode);
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingBottom: 10,
    },
    title: {
      fontFamily: "Poppins_700Bold",
      fontSize: 28,
      color: Colors.text,
    },
    refreshBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: Colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
    },
    filterRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
    filterTab: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: Colors.card,
      borderWidth: 1,
      borderColor: Colors.divider,
    },
    filterTabActive: {
      backgroundColor: Colors.primary,
      borderColor: Colors.primary,
    },
    filterText: {
      fontFamily: "Poppins_500Medium",
      fontSize: 13,
      color: Colors.textSecondary,
    },
    filterTextActive: { color: "#fff" },
    list: { paddingHorizontal: 16, paddingBottom: 120, gap: 12 },
    card: {
      backgroundColor: Colors.card,
      borderRadius: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: Colors.divider,
    },
    cardCancelled: { opacity: 0.65 },
    cardTop: { padding: 14 },
    orderNumRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    statusIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    orderNum: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 14,
      color: Colors.text,
    },
    orderDate: {
      fontFamily: "Poppins_400Regular",
      fontSize: 12,
      color: Colors.textMuted,
      marginTop: 1,
    },
    livePill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: Colors.cyanBg,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 10,
    },
    liveText: {
      fontFamily: "Poppins_700Bold",
      fontSize: 10,
      color: Colors.cyan,
      letterSpacing: 0.5,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    statusText: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 11,
    },
    divider: {
      height: 1,
      backgroundColor: Colors.divider,
    },
    cardMeta: {
      flexDirection: "row",
      gap: 16,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
    metaText: {
      fontFamily: "Poppins_400Regular",
      fontSize: 12,
      color: Colors.textSecondary,
    },
    trackRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: Colors.cyanBg,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    trackInfo: { flexDirection: "row", alignItems: "center", gap: 6 },
    trackInfoText: {
      fontFamily: "Poppins_500Medium",
      fontSize: 13,
      color: Colors.cyan,
    },
    trackBtn: { flexDirection: "row", alignItems: "center", gap: 2 },
    trackBtnText: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 13,
      color: Colors.cyan,
    },
    progressRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 14,
      paddingBottom: 10,
    },
    progressTrack: {
      flex: 1,
      height: 4,
      backgroundColor: Colors.divider,
      borderRadius: 2,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: Colors.primary,
      borderRadius: 2,
    },
    progressLabel: {
      fontFamily: "Poppins_500Medium",
      fontSize: 11,
      color: Colors.textSecondary,
      minWidth: 90,
      textAlign: "right",
    },
    cardBottom: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 2,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: Colors.divider,
    },
    viewDetail: {
      fontFamily: "Poppins_500Medium",
      fontSize: 12,
      color: Colors.textMuted,
    },
    emptyBox: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      paddingBottom: 80,
    },
    emptyTitle: {
      fontFamily: "Poppins_700Bold",
      fontSize: 20,
      color: Colors.text,
      marginTop: 8,
    },
    emptySub: {
      fontFamily: "Poppins_400Regular",
      fontSize: 14,
      color: Colors.textSecondary,
    },
    shopBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: Colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 14,
      marginTop: 8,
    },
    shopBtnText: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 14,
      color: "#fff",
    },
  });
};
