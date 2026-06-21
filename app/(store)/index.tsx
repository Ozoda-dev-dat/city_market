import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import getColors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/query-client";

function formatPrice(amount: number) {
  return new Intl.NumberFormat("uz-UZ").format(amount) + " so'm";
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: "Yangi",           color: "#F59E0B", bg: "#FFFBEB" },
  confirmed:  { label: "Tasdiqlangan",    color: "#3B82F6", bg: "#EFF6FF" },
  preparing:  { label: "Tayyorlanmoqda",  color: "#8B5CF6", bg: "#F5F3FF" },
  ready:      { label: "Tayyor",          color: "#16A34A", bg: "#DCFCE7" },
  delivering: { label: "Yo'lda",          color: "#0891B2", bg: "#E0F2FE" },
  delivered:  { label: "Yetkazildi",      color: "#16A34A", bg: "#DCFCE7" },
  cancelled:  { label: "Bekor qilingan",  color: "#EF4444", bg: "#FEF2F2" },
};

export default function StoreDashboard() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const styles = getStyles(isDarkMode);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/store/stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/store/stats");
      return res.json();
    },
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/store/orders"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/store/orders");
      return res.json();
    },
  });

  const orders: any[] = Array.isArray(ordersData) ? ordersData : [];
  const recentOrders = orders.slice(0, 5);

  // Calculate top-selling products from order items
  const topProducts = React.useMemo(() => {
    const countMap = new Map<string, { name: string; qty: number; unit: string }>();
    for (const order of orders) {
      if (order.status === "cancelled") continue;
      const items: any[] = Array.isArray(order.items) ? order.items : [];
      for (const item of items) {
        const key = item.productId ?? item.name ?? String(item.id);
        const existing = countMap.get(key);
        const qty = Number(item.quantity) || 1;
        if (existing) {
          existing.qty += qty;
        } else {
          countMap.set(key, { name: item.name ?? key, qty, unit: item.unit ?? "ta" });
        }
      }
    }
    return Array.from(countMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [orders]);

  const todayOrders = orders.filter((o: any) => {
    const d = new Date(o.createdAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const todayRevenue = todayOrders
    .filter((o: any) => o.status !== "cancelled")
    .reduce((sum: number, o: any) => {
      const items: any[] = Array.isArray(o.items) ? o.items : [];
      return sum + items.reduce((s: number, i: any) => s + (i.price || 0) * (i.quantity || 1), 0);
    }, 0);

  const newOrdersCount = orders.filter((o: any) => o.status === "pending").length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 12, paddingBottom: 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>Xush kelibsiz,</Text>
          <Text style={styles.title}>{user?.name ?? "Do'kon egasi"}</Text>
        </View>
        <Ionicons name="storefront" size={32} color={Colors.primary} />
      </View>

      {statsLoading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginVertical: 24 }} />
      ) : (
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <Ionicons name="receipt-outline" size={22} color="#fff" />
            <Text style={styles.statValueWhite}>{todayOrders.length}</Text>
            <Text style={styles.statLabelWhite}>Bugungi buyurtma</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cash-outline" size={22} color="#F59E0B" />
            <Text style={[styles.statValue, { fontSize: 13 }]}>{formatPrice(todayRevenue)}</Text>
            <Text style={styles.statLabel}>Bugungi tushum</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cube-outline" size={22} color="#3B82F6" />
            <Text style={[styles.statValue, { color: "#3B82F6" }]}>{stats?.totalProducts ?? "—"}</Text>
            <Text style={styles.statLabel}>Mahsulotlar</Text>
          </View>
          <View style={[styles.statCard, { borderColor: newOrdersCount > 0 ? "#FEF3C7" : Colors.cardBorder }]}>
            <Ionicons name="time-outline" size={22} color="#F59E0B" />
            <Text style={[styles.statValue, { color: "#F59E0B" }]}>{newOrdersCount}</Text>
            <Text style={styles.statLabel}>Yangi buyurtma</Text>
          </View>
        </View>
      )}

      <View style={styles.quickGrid}>
        <Pressable style={styles.quickCard} onPress={() => router.push("/(store)/products")}>
          <View style={[styles.quickIcon, { backgroundColor: Colors.primaryLight }]}>
            <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.quickLabel}>Mahsulot qo'shish</Text>
        </Pressable>
        <Pressable style={styles.quickCard} onPress={() => router.push("/(store)/orders")}>
          <View style={[styles.quickIcon, { backgroundColor: "#FFFBEB" }]}>
            <Ionicons name="receipt-outline" size={24} color="#F59E0B" />
          </View>
          <Text style={styles.quickLabel}>Buyurtmalar</Text>
        </Pressable>
        <Pressable style={styles.quickCard} onPress={() => router.push("/(store)/profile")}>
          <View style={[styles.quickIcon, { backgroundColor: "#EFF6FF" }]}>
            <Ionicons name="settings-outline" size={24} color="#3B82F6" />
          </View>
          <Text style={styles.quickLabel}>Do'kon sozlash</Text>
        </Pressable>
      </View>

      {topProducts.length > 0 && (
        <View style={{ marginBottom: 28 }}>
          <Text style={styles.sectionTitle}>Eng ko'p sotilgan mahsulotlar</Text>
          {topProducts.map((p, idx) => (
            <View key={idx} style={styles.topProductRow}>
              <View style={[styles.topProductRank, { backgroundColor: idx === 0 ? Colors.primary : Colors.primaryLight }]}>
                <Text style={[styles.topProductRankText, { color: idx === 0 ? "#fff" : Colors.primary }]}>
                  {idx + 1}
                </Text>
              </View>
              <Text style={styles.topProductName} numberOfLines={1}>{p.name}</Text>
              <Text style={styles.topProductQty}>{p.qty} {p.unit}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>So'nggi buyurtmalar</Text>
        <Pressable onPress={() => router.push("/(store)/orders")}>
          <Text style={styles.seeAll}>Barchasini ko'rish</Text>
        </Pressable>
      </View>

      {ordersLoading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} />
      ) : recentOrders.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="receipt-outline" size={40} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Buyurtmalar yo'q</Text>
        </View>
      ) : (
        recentOrders.map((order: any) => {
          const st = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
          const items: any[] = Array.isArray(order.items) ? order.items : [];
          return (
            <Pressable key={order.id} style={styles.orderCard} onPress={() => router.push("/(store)/orders")}>
              <View style={styles.orderLeft}>
                <View style={[styles.orderIcon, { backgroundColor: st.bg }]}>
                  <Ionicons name="receipt-outline" size={18} color={st.color} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.orderCustomer} numberOfLines={1}>{order.customerName}</Text>
                  <Text style={styles.orderMeta}>{items.length} ta mahsulot</Text>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
              </View>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

const getStyles = (isDarkMode: boolean) => {
  const Colors = getColors(isDarkMode);
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { paddingHorizontal: 16 },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 24,
    },
    greeting: {
      fontFamily: "Poppins_400Regular",
      fontSize: 14,
      color: Colors.textSecondary,
    },
    title: {
      fontFamily: "Poppins_700Bold",
      fontSize: 24,
      color: Colors.text,
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginBottom: 24,
    },
    statCard: {
      width: "47%",
      backgroundColor: Colors.card,
      borderRadius: 18,
      padding: 16,
      gap: 6,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
    },
    statCardPrimary: {
      backgroundColor: Colors.primary,
      borderColor: Colors.primary,
    },
    statValue: {
      fontFamily: "Poppins_700Bold",
      fontSize: 22,
      color: Colors.text,
    },
    statValueWhite: {
      fontFamily: "Poppins_700Bold",
      fontSize: 22,
      color: "#fff",
    },
    statLabel: {
      fontFamily: "Poppins_400Regular",
      fontSize: 12,
      color: Colors.textSecondary,
    },
    statLabelWhite: {
      fontFamily: "Poppins_400Regular",
      fontSize: 12,
      color: "rgba(255,255,255,0.85)",
    },
    quickGrid: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 28,
    },
    quickCard: {
      flex: 1,
      backgroundColor: Colors.card,
      borderRadius: 16,
      padding: 14,
      alignItems: "center",
      gap: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    quickIcon: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    quickLabel: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 11,
      color: Colors.text,
      textAlign: "center",
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
    orderCard: {
      backgroundColor: Colors.card,
      borderRadius: 14,
      padding: 14,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
      gap: 12,
    },
    orderLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
      minWidth: 0,
    },
    orderIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    orderCustomer: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 14,
      color: Colors.text,
    },
    orderMeta: {
      fontFamily: "Poppins_400Regular",
      fontSize: 12,
      color: Colors.textSecondary,
      marginTop: 2,
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
    topProductRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: Colors.card,
      borderRadius: 14,
      padding: 12,
      marginBottom: 8,
      gap: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    },
    topProductRank: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    topProductRankText: {
      fontFamily: "Poppins_700Bold",
      fontSize: 14,
    },
    topProductName: {
      fontFamily: "Poppins_500Medium",
      fontSize: 14,
      color: Colors.text,
      flex: 1,
    },
    topProductQty: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 13,
      color: Colors.primary,
    },
    emptyBox: {
      alignItems: "center",
      paddingVertical: 40,
      gap: 12,
    },
    emptyText: {
      fontFamily: "Poppins_400Regular",
      fontSize: 14,
      color: Colors.textMuted,
    },
  });
};
