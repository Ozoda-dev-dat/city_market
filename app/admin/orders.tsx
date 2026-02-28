import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { formatPrice } from "@/constants/data";

type OrderStatus = "pending" | "preparing" | "transit" | "delivered";

const ORDERS_DATA = [
  {
    id: "BUY-3001",
    customer: "Alisher Karimov",
    phone: "+998 90 123 45 67",
    address: "Yunusobod tumani, 7-mavze",
    items: [
      { name: "Banan", qty: 2, price: 3500 },
      { name: "Qizil olma", qty: 1, price: 8900 },
      { name: "Yangi sut", qty: 3, price: 7500 },
    ],
    total: 87500,
    status: "pending" as OrderStatus,
    time: "10 daqiqa oldin",
    date: "28 Fevral, 2026",
  },
  {
    id: "BUY-3002",
    customer: "Malika Yusupova",
    phone: "+998 91 234 56 78",
    address: "Chilonzor tumani, 9-mavze",
    items: [
      { name: "Pomidor", qty: 3, price: 4500 },
      { name: "Kartoshka", qty: 2, price: 3200 },
    ],
    total: 32000,
    status: "preparing" as OrderStatus,
    time: "25 daqiqa oldin",
    date: "28 Fevral, 2026",
  },
  {
    id: "BUY-3003",
    customer: "Jasur Rakhimov",
    phone: "+998 93 345 67 89",
    address: "Mirzo Ulug'bek tumani, 3-mavze",
    items: [
      { name: "Tovuq ko'kragi", qty: 2, price: 32000 },
      { name: "Sabzi", qty: 1, price: 3800 },
      { name: "Bodring", qty: 2, price: 3500 },
    ],
    total: 145000,
    status: "transit" as OrderStatus,
    time: "1 soat oldin",
    date: "28 Fevral, 2026",
  },
  {
    id: "BUY-3004",
    customer: "Zulfiya Nazarova",
    phone: "+998 94 456 78 90",
    address: "Shayxontohur tumani, 5-mavze",
    items: [
      { name: "Yogurt", qty: 2, price: 5500 },
      { name: "Sariyog'", qty: 1, price: 12500 },
    ],
    total: 56000,
    status: "delivered" as OrderStatus,
    time: "2 soat oldin",
    date: "28 Fevral, 2026",
  },
  {
    id: "BUY-3005",
    customer: "Bobur Toshmatov",
    phone: "+998 95 567 89 01",
    address: "Uchtepa tumani, 2-mavze",
    items: [
      { name: "Tarvuz", qty: 5, price: 4800 },
      { name: "Mango", qty: 2, price: 12000 },
    ],
    total: 48000,
    status: "pending" as OrderStatus,
    time: "5 daqiqa oldin",
    date: "28 Fevral, 2026",
  },
];

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
  const [orders, setOrders] = useState(ORDERS_DATA);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filtered = activeTab === "all" ? orders : orders.filter((o) => o.status === activeTab);

  const advanceStatus = (id: string, next: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: next } : o)));
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
        scrollEnabled={!!filtered.length}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Buyurtma topilmadi</Text>
          </View>
        }
        renderItem={({ item }) => {
          const status = STATUS_CONFIG[item.status];
          const isExpanded = expandedId === item.id;

          return (
            <Pressable
              style={styles.orderCard}
              onPress={() => setExpandedId(isExpanded ? null : item.id)}
            >
              <View style={styles.orderTop}>
                <View style={[styles.statusIcon, { backgroundColor: status.bg }]}>
                  <Ionicons name={status.icon} size={18} color={status.color} />
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
                  <Text style={styles.customer}>{item.customer}</Text>
                  <View style={styles.orderMeta}>
                    <Text style={styles.metaText}>{item.time}</Text>
                    <Text style={styles.metaDot}>·</Text>
                    <Text style={styles.metaText}>{formatPrice(item.total)}</Text>
                  </View>
                </View>
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={Colors.textMuted}
                />
              </View>

              {isExpanded && (
                <View style={styles.expanded}>
                  <View style={styles.divider} />

                  <View style={styles.customerInfo}>
                    <View style={styles.infoRow}>
                      <Ionicons name="call-outline" size={14} color={Colors.textMuted} />
                      <Text style={styles.infoText}>{item.phone}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
                      <Text style={styles.infoText}>{item.address}</Text>
                    </View>
                  </View>

                  <Text style={styles.itemsTitle}>Mahsulotlar:</Text>
                  {item.items.map((prod, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <Text style={styles.itemName}>{prod.name}</Text>
                      <Text style={styles.itemQty}>x{prod.qty}</Text>
                      <Text style={styles.itemPrice}>{formatPrice(prod.price * prod.qty)}</Text>
                    </View>
                  ))}

                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Jami:</Text>
                    <Text style={styles.totalValue}>{formatPrice(item.total)}</Text>
                  </View>

                  {status.next && (
                    <Pressable
                      style={styles.advanceBtn}
                      onPress={() => advanceStatus(item.id, status.next!)}
                    >
                      <Ionicons name="arrow-forward-circle-outline" size={18} color="#fff" />
                      <Text style={styles.advanceBtnText}>{status.nextLabel}</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 42,
    height: 42,
    backgroundColor: Colors.card,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    flex: 1,
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: Colors.text,
  },
  countBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  countBadgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: "#fff",
  },
  tabsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: "#fff",
  },
  list: {
    gap: 10,
  },
  orderCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  orderMain: {
    flex: 1,
    gap: 3,
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  orderId: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
  },
  customer: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: Colors.text,
  },
  orderMeta: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  metaText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  metaDot: {
    color: Colors.textMuted,
  },
  expanded: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginBottom: 14,
  },
  customerInfo: {
    gap: 6,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  itemsTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: Colors.text,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  itemName: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  itemQty: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
    marginRight: 12,
  },
  itemPrice: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: Colors.text,
    minWidth: 90,
    textAlign: "right",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    marginBottom: 14,
  },
  totalLabel: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: Colors.text,
  },
  totalValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: Colors.text,
  },
  advanceBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 13,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  advanceBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: Colors.text,
  },
});
