import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import getColors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { apiRequest } from "@/lib/query-client";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: "Yangi",           color: "#F59E0B", bg: "#FFFBEB" },
  confirmed:  { label: "Tasdiqlangan",    color: "#3B82F6", bg: "#EFF6FF" },
  preparing:  { label: "Tayyorlanmoqda",  color: "#8B5CF6", bg: "#F5F3FF" },
  ready:      { label: "Tayyor",          color: "#16A34A", bg: "#DCFCE7" },
  delivering: { label: "Yo'lda",          color: "#0891B2", bg: "#E0F2FE" },
  delivered:  { label: "Yetkazildi",      color: "#16A34A", bg: "#DCFCE7" },
  cancelled:  { label: "Bekor qilingan",  color: "#EF4444", bg: "#FEF2F2" },
};

const FILTER_TABS = [
  { key: "all",       label: "Barchasi" },
  { key: "pending",   label: "Yangi" },
  { key: "preparing", label: "Tayyorlanmoqda" },
  { key: "ready",     label: "Tayyor" },
  { key: "delivered", label: "Yetkazildi" },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export default function StoreOrdersScreen() {
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const styles = getStyles(isDarkMode);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const qc = useQueryClient();

  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/store/orders"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/store/orders");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/notifications/read-all", {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/store/orders/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/store/orders"] });
      qc.invalidateQueries({ queryKey: ["/api/store/stats"] });
    },
  });

  const orders: any[] = Array.isArray(data) ? data : [];
  const filtered = filter === "all" ? orders : orders.filter((o: any) => o.status === filter);

  const handleStatusChange = (orderId: string, newStatus: string) => {
    Alert.alert(
      "Holatni o'zgartirish",
      `Buyurtma holatini "${STATUS_CONFIG[newStatus]?.label}" ga o'zgartirasizmi?`,
      [
        { text: "Bekor", style: "cancel" },
        {
          text: "Ha",
          onPress: () => updateStatusMutation.mutate({ id: orderId, status: newStatus }),
        },
      ]
    );
  };

  const getNextStatuses = (current: string): string[] => {
    const flow: Record<string, string[]> = {
      pending:    ["preparing", "cancelled"],
      confirmed:  ["preparing", "cancelled"],
      preparing:  ["ready"],
      ready:      [],
      delivering: [],
      delivered:  [],
      cancelled:  [],
    };
    return flow[current] ?? [];
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Buyurtmalar</Text>
        <Pressable
          style={styles.refreshBtn}
          onPress={() => {
            refetch();
            markAllReadMutation.mutate();
          }}
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
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="receipt-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Buyurtmalar yo'q</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: order }) => {
            const st = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
            const items: any[] = Array.isArray(order.items) ? order.items : [];
            const isExpanded = expanded === order.id;
            const nextStatuses = getNextStatuses(order.status);

            return (
              <Pressable
                style={styles.orderCard}
                onPress={() => setExpanded(isExpanded ? null : order.id)}
              >
                <View style={styles.orderTop}>
                  <View style={[styles.orderStatusDot, { backgroundColor: st.bg }]}>
                    <Ionicons name="receipt-outline" size={16} color={st.color} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.orderCustomer} numberOfLines={1}>{order.customerName}</Text>
                    <Text style={styles.orderMeta}>
                      {formatDate(order.createdAt)} · {items.length} ta mahsulot
                    </Text>
                  </View>
                  <View style={styles.orderRight}>
                    <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                      <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                    </View>
                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={18}
                      color={Colors.textMuted}
                    />
                  </View>
                </View>

                {isExpanded && (
                  <View style={styles.orderDetail}>
                    <Text style={styles.detailSectionTitle}>Mahsulotlar:</Text>
                    {items.map((item: any, idx: number) => (
                      <View key={idx} style={styles.itemRow}>
                        <Ionicons name="ellipse" size={6} color={Colors.textMuted} />
                        <Text style={styles.itemText} numberOfLines={2}>
                          {item.name ?? item.productId} — {item.quantity ?? 1} {item.unit ?? "ta"}
                        </Text>
                      </View>
                    ))}

                    {order.address ? (
                      <View style={styles.addressRow}>
                        <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                        <Text style={styles.addressText} numberOfLines={2}>{order.address}</Text>
                      </View>
                    ) : null}

                    {nextStatuses.length > 0 && (
                      <View style={styles.actionRow}>
                        {nextStatuses.map((ns) => {
                          const nst = STATUS_CONFIG[ns];
                          return (
                            <Pressable
                              key={ns}
                              style={[styles.actionBtn, { backgroundColor: nst.bg, borderColor: nst.color + "40" }]}
                              onPress={() => handleStatusChange(order.id, ns)}
                              disabled={updateStatusMutation.isPending}
                            >
                              {updateStatusMutation.isPending ? (
                                <ActivityIndicator size="small" color={nst.color} />
                              ) : (
                                <Text style={[styles.actionBtnText, { color: nst.color }]}>
                                  {nst.label}
                                </Text>
                              )}
                            </Pressable>
                          );
                        })}
                      </View>
                    )}
                  </View>
                )}
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
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    title: { fontFamily: "Poppins_700Bold", fontSize: 26, color: Colors.text },
    refreshBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: Colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
    },
    filterRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
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
    list: { paddingHorizontal: 16, paddingBottom: 40 },
    orderCard: {
      backgroundColor: Colors.card,
      borderRadius: 16,
      padding: 14,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    orderTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    orderStatusDot: {
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
    orderRight: { alignItems: "flex-end", gap: 4 },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    statusText: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 11,
    },
    orderDetail: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: Colors.divider,
      gap: 6,
    },
    detailSectionTitle: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 13,
      color: Colors.text,
      marginBottom: 4,
    },
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    itemText: {
      fontFamily: "Poppins_400Regular",
      fontSize: 13,
      color: Colors.textSecondary,
      flex: 1,
    },
    addressRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 6,
      marginTop: 6,
    },
    addressText: {
      fontFamily: "Poppins_400Regular",
      fontSize: 13,
      color: Colors.textSecondary,
      flex: 1,
    },
    actionRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 10,
    },
    actionBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 12,
      alignItems: "center",
      borderWidth: 1,
    },
    actionBtnText: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 13,
    },
    emptyBox: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      paddingBottom: 80,
    },
    emptyText: {
      fontFamily: "Poppins_400Regular",
      fontSize: 15,
      color: Colors.textMuted,
    },
  });
};
