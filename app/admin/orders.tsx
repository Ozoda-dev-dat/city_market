import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { formatPrice } from "@/constants/data";
import { useApp } from "@/context/ProductsContext";
import { useQuery } from "@tanstack/react-query";

type OrderStatus = "pending" | "preparing" | "transit" | "delivered";

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; icon: any; next?: OrderStatus; nextLabel?: string }> = {
  pending: {
    label: "Kutilmoqda",
    color: "#F59E0B",
    bg: "#FFFBEB",
    icon: "time",
    next: "preparing",
    nextLabel: "Tayyorlashni boshlash",
  },
  preparing: {
    label: "Tayyorlanmoqda",
    color: "#3B82F6",
    bg: "#EFF6FF",
    icon: "restaurant",
    next: "transit",
    nextLabel: "Yetkazib berishga yuborish",
  },
  transit: {
    label: "Yo'lda",
    color: "#8B5CF6",
    bg: "#F5F3FF",
    icon: "bicycle",
    next: "delivered",
    nextLabel: "Yetkazildi deb belgilash",
  },
  delivered: {
    label: "Yetkazildi",
    color: Colors.primary,
    bg: Colors.primaryLight,
    icon: "checkmark-circle",
  },
};

const STATUS_TABS: { id: string; label: string }[] = [
  { id: "all", label: "Barchasi" },
  { id: "pending", label: "Kutilmoqda" },
  { id: "preparing", label: "Tayyorlanmoqda" },
  { id: "transit", label: "Yo'lda" },
  { id: "delivered", label: "Yetkazildi" },
];

export default function AdminOrdersScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCourierList, setShowCourierList] = useState<string | null>(null);
  const { orders, updateOrderStatus } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data: couriers = [] } = useQuery<any[]>({
    queryKey: ["/api/couriers"],
  });

  const filtered = activeTab === "all" ? orders : orders.filter((o) => o.status === activeTab);

  const handleAssign = async (orderId: string, courierId: string) => {
    try {
      await updateOrderStatus(orderId, "preparing", courierId);
      Alert.alert("Muvaffaqiyat", "Buyurtma kuryerga biriktirildi");
      setShowCourierList(null);
    } catch (e) {
      Alert.alert("Xatolik", "Kuryerga biriktirishda xatolik yuz berdi");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topPad + 12 }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Buyurtmalar</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{orders.length}</Text>
        </View>
      </View>

      <View style={styles.tabsRow}>
        {STATUS_TABS.map((tab) => (
          <Pressable
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === "web" ? 34 : 40 }]}
        renderItem={({ item }) => {
          const status = STATUS_CONFIG[item.status as OrderStatus] || STATUS_CONFIG.pending;
          const isExpanded = expandedId === item.id;

          return (
            <View style={styles.orderCard}>
              <Pressable
                style={styles.orderTop}
                onPress={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <View style={[styles.statusIcon, { backgroundColor: status.bg }]}>
                  <Ionicons name={status.icon as any} size={18} color={status.color} />
                </View>
                <View style={styles.orderMain}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderId}>{item.id}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                      <Text style={[styles.statusText, { color: status.color }]}>
                        {status.label}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.customer}>{item.customerName}</Text>
                  <View style={styles.orderMeta}>
                    <Text style={styles.metaText}>{formatPrice(item.total)}</Text>
                  </View>
                </View>
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={Colors.textMuted}
                />
              </Pressable>

              {isExpanded && (
                <View style={styles.expanded}>
                  <View style={styles.divider} />
                  <View style={styles.customerInfo}>
                    <Text style={styles.infoText}>📍 {item.address}</Text>
                    <Text style={styles.infoText}>📞 {item.phoneNumber}</Text>
                  </View>

                  <Text style={styles.itemsTitle}>Mahsulotlar:</Text>
                  {(item.items as any[]).map((prod, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <Text style={styles.itemName}>{prod.name}</Text>
                      <Text style={styles.itemQty}>x{prod.qty}</Text>
                      <Text style={styles.itemPrice}>{formatPrice(prod.price * prod.qty)}</Text>
                    </View>
                  ))}

                  {item.status === "pending" && (
                    <Pressable
                      style={styles.advanceBtn}
                      onPress={() => setShowCourierList(showCourierList === item.id ? null : item.id)}
                    >
                      <Ionicons name="person-add-outline" size={18} color="#fff" />
                      <Text style={styles.advanceBtnText}>Kuryer biriktirish</Text>
                    </Pressable>
                  )}

                  {showCourierList === item.id && (
                    <View style={styles.courierList}>
                      <Text style={styles.courierListTitle}>Kuryer tanlang:</Text>
                      {couriers.length === 0 ? (
                        <Text style={styles.emptyText}>Mavjud kuryerlar yo'q</Text>
                      ) : (
                        couriers.map((c) => (
                          <Pressable
                            key={c.id}
                            style={styles.courierItem}
                            onPress={() => handleAssign(item.id, c.id)}
                          >
                            <Ionicons name="bicycle" size={16} color={Colors.primary} />
                            <Text style={styles.courierName}>{c.name}</Text>
                          </Pressable>
                        ))
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 16 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 12 },
  backBtn: { width: 42, height: 42, backgroundColor: Colors.card, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontFamily: "Poppins_700Bold", fontSize: 22, color: Colors.text },
  countBadge: { backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  countBadgeText: { fontFamily: "Poppins_700Bold", fontSize: 14, color: "#fff" },
  tabsRow: { flexDirection: "row", gap: 8, marginBottom: 14, flexWrap: "wrap" },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontFamily: "Poppins_500Medium", fontSize: 12, color: Colors.textSecondary },
  tabTextActive: { color: "#fff" },
  list: { gap: 10 },
  orderCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 14, marginBottom: 10 },
  orderTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  statusIcon: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  orderMain: { flex: 1, gap: 3 },
  orderHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  orderId: { fontFamily: "Poppins_700Bold", fontSize: 14, color: Colors.text },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontFamily: "Poppins_600SemiBold", fontSize: 11 },
  customer: { fontFamily: "Poppins_500Medium", fontSize: 14, color: Colors.text },
  orderMeta: { flexDirection: "row", gap: 6, alignItems: "center" },
  metaText: { fontFamily: "Poppins_400Regular", fontSize: 12, color: Colors.textSecondary },
  expanded: { marginTop: 12 },
  divider: { height: 1, backgroundColor: Colors.divider, marginBottom: 14 },
  customerInfo: { gap: 6, marginBottom: 14 },
  infoText: { fontFamily: "Poppins_400Regular", fontSize: 13, color: Colors.textSecondary },
  itemsTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: Colors.text, marginBottom: 8 },
  itemRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  itemName: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 13, color: Colors.textSecondary },
  itemQty: { fontFamily: "Poppins_500Medium", fontSize: 13, color: Colors.textSecondary, marginRight: 12 },
  itemPrice: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: Colors.text, minWidth: 90, textAlign: "right" },
  advanceBtn: { backgroundColor: Colors.primary, borderRadius: 13, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10 },
  advanceBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: "#fff" },
  courierList: { marginTop: 12, backgroundColor: Colors.background, borderRadius: 12, padding: 12 },
  courierListTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 13, marginBottom: 8 },
  courierItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  courierName: { fontFamily: "Poppins_500Medium", fontSize: 13 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 18, color: Colors.text },
  emptyText: { fontFamily: "Poppins_400Regular", fontSize: 12, color: Colors.textMuted, textAlign: "center" },
});
