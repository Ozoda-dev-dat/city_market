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

const ALL_ORDERS = [
  {
    id: "ORD-2842",
    customer: "Alisher Tursunov",
    phone: "+998 90 123 4567",
    address: "Chilonzor, Tashkent",
    total: 87500,
    items: [
      { name: "Banana", qty: 2, price: 3500 },
      { name: "Apple", qty: 1, price: 8900 },
      { name: "Milk", qty: 3, price: 7500 },
    ],
    status: "delivered",
    date: "Feb 25, 2026",
    time: "14:30",
  },
  {
    id: "ORD-2791",
    customer: "Malika Karimova",
    phone: "+998 91 234 5678",
    address: "Yunusabad, Tashkent",
    total: 42300,
    items: [
      { name: "Tomato", qty: 2, price: 4500 },
      { name: "Chicken", qty: 1, price: 32000 },
    ],
    status: "in_transit",
    date: "Feb 28, 2026",
    time: "10:15",
  },
  {
    id: "ORD-2634",
    customer: "Bobur Aliyev",
    phone: "+998 97 345 6789",
    address: "Mirzo-Ulugbek, Tashkent",
    total: 156000,
    items: [
      { name: "Ground Beef", qty: 2, price: 45000 },
      { name: "Eggs", qty: 2, price: 18000 },
      { name: "Butter", qty: 2, price: 12500 },
    ],
    status: "preparing",
    date: "Feb 28, 2026",
    time: "09:00",
  },
  {
    id: "ORD-2589",
    customer: "Nodira Saidova",
    phone: "+998 94 456 7890",
    address: "Sergeli, Tashkent",
    total: 73200,
    items: [
      { name: "Orange Juice", qty: 2, price: 15000 },
      { name: "Watermelon", qty: 4, price: 4800 },
    ],
    status: "pending",
    date: "Feb 28, 2026",
    time: "08:45",
  },
];

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  delivered: { bg: "#E8F5EE", text: Colors.primary, label: "Delivered", icon: "checkmark-circle" },
  in_transit: { bg: "#EFF6FF", text: "#3B82F6", label: "In Transit", icon: "bicycle" },
  preparing: { bg: "#FFFBEB", text: "#F59E0B", label: "Preparing", icon: "restaurant" },
  pending: { bg: "#F5F5F5", text: "#6B7C6B", label: "Pending", icon: "time" },
};

const STATUS_TABS = ["all", "pending", "preparing", "in_transit", "delivered"];

export default function AdminOrdersScreen() {
  const insets = useSafeAreaInsets();
  const [activeStatus, setActiveStatus] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filtered = activeStatus === "all"
    ? ALL_ORDERS
    : ALL_ORDERS.filter((o) => o.status === activeStatus);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </Pressable>
          <Text style={styles.title}>Orders</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{ALL_ORDERS.length}</Text>
          </View>
        </View>

        <View style={styles.tabsRow}>
          {STATUS_TABS.map((tab) => {
            const cfg = tab !== "all" ? STATUS_CONFIG[tab] : null;
            const count = tab === "all" ? ALL_ORDERS.length : ALL_ORDERS.filter((o) => o.status === tab).length;
            return (
              <Pressable
                key={tab}
                style={[styles.tab, activeStatus === tab && styles.tabActive]}
                onPress={() => setActiveStatus(tab)}
              >
                <Text style={[styles.tabText, activeStatus === tab && styles.tabTextActive]}>
                  {tab === "all" ? "All" : (cfg?.label ?? tab)}
                </Text>
                <Text style={[styles.tabCount, activeStatus === tab && styles.tabCountActive]}>
                  {count}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === "web" ? 34 : 40 }]}
        scrollEnabled={!!filtered.length}
        renderItem={({ item }) => {
          const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
          const isExpanded = expandedId === item.id;
          return (
            <Pressable style={styles.orderCard} onPress={() => setExpandedId(isExpanded ? null : item.id)}>
              <View style={styles.orderTop}>
                <View style={styles.orderLeft}>
                  <Text style={styles.orderCustomer}>{item.customer}</Text>
                  <Text style={styles.orderId}>{item.id}</Text>
                  <Text style={styles.orderTime}>{item.date} at {item.time}</Text>
                </View>
                <View style={styles.orderRight}>
                  <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                    <Ionicons name={cfg.icon as any} size={11} color={cfg.text} />
                    <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
                  </View>
                  <Text style={styles.orderTotal}>{formatPrice(item.total)}</Text>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={Colors.textMuted}
                  />
                </View>
              </View>

              {isExpanded && (
                <View style={styles.orderDetails}>
                  <View style={styles.divider} />
                  <View style={styles.detailRow}>
                    <Ionicons name="call-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.detailText}>{item.phone}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.detailText}>{item.address}</Text>
                  </View>
                  <View style={styles.divider} />
                  <Text style={styles.itemsTitle}>Items</Text>
                  {item.items.map((orderItem, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <Text style={styles.itemName}>{orderItem.name}</Text>
                      <Text style={styles.itemQty}>x{orderItem.qty}</Text>
                      <Text style={styles.itemPrice}>{formatPrice(orderItem.price * orderItem.qty)}</Text>
                    </View>
                  ))}
                  <View style={styles.divider} />
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>{formatPrice(item.total)}</Text>
                  </View>
                  <View style={styles.statusActions}>
                    {item.status === "pending" && (
                      <View style={styles.actionBtn}>
                        <Ionicons name="restaurant-outline" size={14} color={Colors.primary} />
                        <Text style={styles.actionBtnText}>Start Preparing</Text>
                      </View>
                    )}
                    {item.status === "preparing" && (
                      <View style={styles.actionBtn}>
                        <Ionicons name="bicycle-outline" size={14} color="#3B82F6" />
                        <Text style={[styles.actionBtnText, { color: "#3B82F6" }]}>Send for Delivery</Text>
                      </View>
                    )}
                    {item.status === "in_transit" && (
                      <View style={[styles.actionBtn, { backgroundColor: Colors.primaryLight }]}>
                        <Ionicons name="checkmark-circle-outline" size={14} color={Colors.primary} />
                        <Text style={styles.actionBtnText}>Mark Delivered</Text>
                      </View>
                    )}
                  </View>
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
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    backgroundColor: Colors.card,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  title: {
    flex: 1,
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: Colors.text,
  },
  countBadge: {
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  countBadgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: "#fff",
  },
  tabsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
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
  tabTextActive: { color: "#fff" },
  tabCount: {
    fontFamily: "Poppins_700Bold",
    fontSize: 11,
    color: Colors.textMuted,
  },
  tabCountActive: { color: "rgba(255,255,255,0.85)" },
  list: { paddingHorizontal: 16 },
  orderCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  orderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderLeft: { flex: 1, gap: 2 },
  orderCustomer: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: Colors.text,
  },
  orderId: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  orderTime: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  orderRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
  },
  orderTotal: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: Colors.text,
  },
  orderDetails: { paddingTop: 4 },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 10,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  detailText: {
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
    color: Colors.text,
  },
  itemQty: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
    width: 32,
    textAlign: "center",
  },
  itemPrice: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: Colors.text,
    width: 90,
    textAlign: "right",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  totalValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: Colors.text,
  },
  statusActions: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
  },
  actionBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: Colors.primary,
  },
});
