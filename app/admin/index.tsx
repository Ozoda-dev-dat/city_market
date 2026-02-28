import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useProducts } from "@/context/ProductsContext";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/constants/data";

const ADMIN_ORDERS = [
  { id: "ORD-2842", customer: "Alisher T.", total: 87500, items: 5, status: "delivered", date: "Feb 25" },
  { id: "ORD-2791", customer: "Malika K.", total: 42300, items: 3, status: "in_transit", date: "Feb 28" },
  { id: "ORD-2634", customer: "Bobur A.", total: 156000, items: 8, status: "preparing", date: "Feb 28" },
  { id: "ORD-2589", customer: "Nodira S.", total: 73200, items: 6, status: "pending", date: "Feb 28" },
];

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  delivered: { bg: "#E8F5EE", text: Colors.primary, label: "Delivered" },
  in_transit: { bg: "#EFF6FF", text: "#3B82F6", label: "In Transit" },
  preparing: { bg: "#FFFBEB", text: "#F59E0B", label: "Preparing" },
  pending: { bg: "#F5F5F5", text: "#6B7C6B", label: "Pending" },
};

interface QuickActionProps {
  icon: string;
  label: string;
  color: string;
  bgColor: string;
  onPress: () => void;
  badge?: number;
}

function QuickAction({ icon, label, color, bgColor, onPress, badge }: QuickActionProps) {
  return (
    <Pressable style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: bgColor }]}>
        <Ionicons name={icon as any} size={22} color={color} />
        {badge !== undefined && badge > 0 && (
          <View style={styles.quickActionBadge}>
            <Text style={styles.quickActionBadgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </Pressable>
  );
}

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const { products } = useProducts();
  const { totalItems, totalPrice } = useCart();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const totalProducts = products.length;
  const inStockProducts = products.filter((p) => p.inStock).length;
  const customProducts = products.filter((p) => p.id.startsWith("custom_")).length;
  const saleProducts = products.filter((p) => p.badge === "sale").length;

  const totalRevenue = ADMIN_ORDERS.reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = ADMIN_ORDERS.filter((o) => o.status === "pending" || o.status === "preparing").length;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={[styles.headerBg, { paddingTop: topPad }]}
      >
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Admin Panel</Text>
            <Text style={styles.headerSub}>FreshMart Dashboard</Text>
          </View>
          <View style={styles.adminBadgeContainer}>
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <Text style={styles.statNum}>{totalProducts}</Text>
            <Text style={styles.statLbl}>Products</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={styles.statNum}>{ADMIN_ORDERS.length}</Text>
            <Text style={styles.statLbl}>Orders</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={styles.statNum}>{formatPrice(totalRevenue).split(" ")[0]}</Text>
            <Text style={styles.statLbl}>Revenue</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={styles.statNum}>{pendingOrders}</Text>
            <Text style={styles.statLbl}>Pending</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === "web" ? 34 : 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <QuickAction
            icon="add-circle"
            label="Add Product"
            color={Colors.primary}
            bgColor={Colors.primaryLight}
            onPress={() => router.push("/admin/add-product")}
          />
          <QuickAction
            icon="cube"
            label="Products"
            color="#3B82F6"
            bgColor="#EFF6FF"
            onPress={() => router.push("/admin/products")}
            badge={customProducts}
          />
          <QuickAction
            icon="receipt"
            label="Orders"
            color="#F59E0B"
            bgColor="#FFFBEB"
            onPress={() => router.push("/admin/orders")}
            badge={pendingOrders}
          />
          <QuickAction
            icon="grid"
            label="Categories"
            color="#8B5CF6"
            bgColor="#F5F3FF"
            onPress={() => router.push("/admin/categories")}
          />
        </View>

        <View style={styles.infoCards}>
          <View style={styles.infoCard}>
            <View style={[styles.infoIcon, { backgroundColor: Colors.primaryLight }]}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
            </View>
            <View style={styles.infoCardBody}>
              <Text style={styles.infoValue}>{inStockProducts}</Text>
              <Text style={styles.infoLabel}>In Stock</Text>
            </View>
          </View>
          <View style={styles.infoCard}>
            <View style={[styles.infoIcon, { backgroundColor: "#FFF0EB" }]}>
              <Ionicons name="pricetag" size={18} color={Colors.accent} />
            </View>
            <View style={styles.infoCardBody}>
              <Text style={styles.infoValue}>{saleProducts}</Text>
              <Text style={styles.infoLabel}>On Sale</Text>
            </View>
          </View>
          <View style={styles.infoCard}>
            <View style={[styles.infoIcon, { backgroundColor: "#EFF6FF" }]}>
              <Ionicons name="star" size={18} color="#3B82F6" />
            </View>
            <View style={styles.infoCardBody}>
              <Text style={styles.infoValue}>{customProducts}</Text>
              <Text style={styles.infoLabel}>Custom</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <Pressable onPress={() => router.push("/admin/orders")}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>

        {ADMIN_ORDERS.map((order) => {
          const status = STATUS_COLORS[order.status] ?? STATUS_COLORS.pending;
          return (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderLeft}>
                <Text style={styles.orderCustomer}>{order.customer}</Text>
                <Text style={styles.orderId}>{order.id} · {order.date}</Text>
                <Text style={styles.orderMeta}>{order.items} items · {formatPrice(order.total)}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
              </View>
            </View>
          );
        })}

        <View style={[styles.tipCard]}>
          <Ionicons name="bulb-outline" size={20} color={Colors.accent} />
          <Text style={styles.tipText}>
            Tap <Text style={styles.tipBold}>Add Product</Text> to create new items, or{" "}
            <Text style={styles.tipBold}>Products</Text> to edit or delete existing ones.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerBg: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 20,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1 },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: "#fff",
  },
  headerSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
  },
  adminBadgeContainer: {},
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  adminBadgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 11,
    color: Colors.primary,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 16,
  },
  statBlock: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.25)" },
  statNum: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: "#fff",
  },
  statLbl: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
  },
  scroll: { flex: 1 },
  content: { padding: 16 },
  sectionTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    color: Colors.text,
    marginBottom: 14,
    marginTop: 8,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    marginTop: 8,
  },
  seeAll: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.primary,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  quickAction: {
    width: "47%",
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.accent,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionBadgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 10,
    color: "#fff",
  },
  quickActionLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: Colors.text,
    textAlign: "center",
  },
  infoCards: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  infoCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  infoCardBody: { flex: 1 },
  infoValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: Colors.text,
  },
  infoLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.textSecondary,
  },
  orderCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  orderLeft: { flex: 1, gap: 2 },
  orderCustomer: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.text,
  },
  orderId: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  orderMeta: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 10,
  },
  statusText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },
  tipCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#FFF8F5",
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#FFE0D0",
  },
  tipText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  tipBold: {
    fontFamily: "Poppins_600SemiBold",
    color: Colors.text,
  },
});
