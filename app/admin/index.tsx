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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { formatPrice } from "@/constants/data";
import { useApp } from "@/context/ProductsContext";
import { useAuth } from "@/context/AuthContext";

const STATUS_CONFIG = {
  pending: { label: "Kutilmoqda", color: "#F59E0B", bg: "#FFFBEB", icon: "time" as const },
  preparing: { label: "Tayyorlanmoqda", color: "#3B82F6", bg: "#EFF6FF", icon: "restaurant" as const },
  transit: { label: "Yo'lda", color: "#8B5CF6", bg: "#F5F3FF", icon: "bicycle" as const },
  delivered: { label: "Yetkazildi", color: Colors.primary, bg: Colors.primaryLight, icon: "checkmark-circle" as const },
};

const QuickActionCard = ({
  icon,
  label,
  color,
  bgColor,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  bgColor: string;
  onPress: () => void;
}) => (
  <Pressable style={styles.quickCard} onPress={onPress}>
    <View style={[styles.quickIcon, { backgroundColor: bgColor }]}>
      <Ionicons name={icon as any} size={22} color={color} />
    </View>
    <Text style={styles.quickLabel}>{label}</Text>
  </Pressable>
);

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const { products, orders } = useApp();
  const { user } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (user?.role !== "admin") {
    return (
      <View style={[styles.container, { paddingTop: topPad + 100, alignItems: "center" }]}>
        <Ionicons name="lock-closed" size={64} color={Colors.error} />
        <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 20, marginTop: 16 }}>Ruxsat yo'q</Text>
        <Pressable onPress={() => router.replace("/(tabs)")} style={{ marginTop: 20 }}>
          <Text style={{ color: Colors.primary }}>Ortga qaytish</Text>
        </Pressable>
      </View>
    );
  }

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const pendingCount = orders.filter((o) => o.status === "pending").length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 12, paddingBottom: Platform.OS === "web" ? 34 : 40 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.subtitle}>Boshqaruv paneli</Text>
          <Text style={styles.title}>Admin Panel</Text>
        </View>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={20} color={Colors.text} />
        </Pressable>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.statCardPrimary]}>
          <Ionicons name="cube-outline" size={22} color="#fff" />
          <Text style={styles.statValueWhite}>{products.length}</Text>
          <Text style={styles.statLabelWhite}>Mahsulotlar</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="receipt-outline" size={22} color={Colors.primary} />
          <Text style={styles.statValue}>{orders.length}</Text>
          <Text style={styles.statLabel}>Buyurtmalar</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="cash-outline" size={22} color="#F59E0B" />
          <Text style={[styles.statValue, { fontSize: 14 }]}>{formatPrice(totalRevenue)}</Text>
          <Text style={styles.statLabel}>Daromad</Text>
        </View>
        <View style={[styles.statCard, { borderColor: "#FEF3C7" }]}>
          <Ionicons name="time-outline" size={22} color="#F59E0B" />
          <Text style={[styles.statValue, { color: "#F59E0B" }]}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Kutilmoqda</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Tezkor amallar</Text>
      <View style={styles.quickGrid}>
        <QuickActionCard
          icon="add-circle-outline"
          label="Mahsulot qo'shish"
          color={Colors.primary}
          bgColor={Colors.primaryLight}
          onPress={() => router.push("/admin/add-product")}
        />
        <QuickActionCard
          icon="cube-outline"
          label="Mahsulotlar"
          color="#3B82F6"
          bgColor="#EFF6FF"
          onPress={() => router.push("/admin/products")}
        />
        <QuickActionCard
          icon="receipt-outline"
          label="Buyurtmalar"
          color="#F59E0B"
          bgColor="#FFFBEB"
          onPress={() => router.push("/admin/orders")}
        />
        <QuickActionCard
          icon="grid-outline"
          label="Kategoriyalar"
          color="#8B5CF6"
          bgColor="#F5F3FF"
          onPress={() => router.push("/admin/categories")}
        />
        <QuickActionCard
          icon="bicycle-outline"
          label="Kuryer qo'shish"
          color="#10B981"
          bgColor="#ECFDF5"
          onPress={() => router.push("/admin/add-courier")}
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>So'nggi buyurtmalar</Text>
        <Pressable onPress={() => router.push("/admin/orders")}>
          <Text style={styles.seeAll}>Barchasini ko'rish</Text>
        </Pressable>
      </View>

      {orders.slice(0, 5).map((order) => {
        const status = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
        return (
          <Pressable key={order.id} style={styles.orderCard}>
            <View style={styles.orderLeft}>
              <View style={[styles.orderStatusIcon, { backgroundColor: status.bg }]}>
                <Ionicons name={status.icon} size={18} color={status.color} />
              </View>
              <View>
                <Text style={styles.orderCustomer}>{order.customerName}</Text>
                <Text style={styles.orderMeta}>
                  {order.id} · {(order.items as any[]).length} ta mahsulot
                </Text>
              </View>
            </View>
            <View style={styles.orderRight}>
              <Text style={styles.orderTotal}>{formatPrice(order.total)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                <Text style={[styles.statusBadgeText, { color: status.color }]}>
                  {status.label}
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: Colors.text,
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 28,
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
    fontSize: 13,
    color: Colors.textSecondary,
  },
  statLabelWhite: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
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
    marginBottom: 14,
  },
  seeAll: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.primary,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 28,
  },
  quickCard: {
    width: "47%",
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 10,
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
    fontSize: 13,
    color: Colors.text,
    textAlign: "center",
  },
  orderCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
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
    gap: 12,
    flex: 1,
  },
  orderStatusIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
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
  orderRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  orderTotal: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
  },
});
