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
import { useApp } from "@/context/ProductsContext";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/constants/data";

export default function CourierDashboard() {
  const insets = useSafeAreaInsets();
  const { orders } = useApp();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"available" | "my-orders">("available");
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (user?.role !== "courier" && user?.role !== "admin") {
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

  // For prototype, we'll filter based on status
  const availableOrders = orders.filter(o => o.status === "preparing");
  const myOrders = orders.filter(o => o.status === "transit");

  const displayOrders = activeTab === "available" ? availableOrders : myOrders;

  return (
    <View style={[styles.container, { paddingTop: topPad + 12 }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Xayrli kun! 👋</Text>
          <Text style={styles.title}>Kuryer paneli</Text>
        </View>
        <Pressable style={styles.profileBtn} onPress={() => router.replace("/")}>
          <Ionicons name="log-out-outline" size={22} color={Colors.error} />
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Bugun</Text>
          <Text style={styles.statValue}>12 ta</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Daromad</Text>
          <Text style={[styles.statValue, { color: Colors.primary }]}>
            {formatPrice(85000)}
          </Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === "available" && styles.tabActive]}
          onPress={() => setActiveTab("available")}
        >
          <Text style={[styles.tabText, activeTab === "available" && styles.tabTextActive]}>
            Mavjud ({availableOrders.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "my-orders" && styles.tabActive]}
          onPress={() => setActiveTab("my-orders")}
        >
          <Text style={[styles.tabText, activeTab === "my-orders" && styles.tabTextActive]}>
            Faol ({myOrders.length})
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={displayOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="bicycle-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Hozircha buyurtmalar yo'q</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.orderCard}
            onPress={() => router.push(`/courier/order/${item.id}`)}
          >
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>{item.id}</Text>
              <Text style={styles.orderPrice}>{formatPrice(item.total)}</Text>
            </View>
            <View style={styles.orderInfo}>
              <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.address} numberOfLines={1}>{item.address}</Text>
            </View>
            <View style={styles.orderFooter}>
              <Text style={styles.customer}>{item.customerName}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {activeTab === "available" ? "Olish" : "Yo'lda"}
                </Text>
                <Ionicons name="chevron-forward" size={12} color={Colors.primary} />
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  greeting: { fontFamily: "Poppins_400Regular", fontSize: 14, color: Colors.textSecondary },
  title: { fontFamily: "Poppins_700Bold", fontSize: 24, color: Colors.text },
  profileBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.card, alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: Colors.card, borderRadius: 16, padding: 16, gap: 4 },
  statLabel: { fontFamily: "Poppins_400Regular", fontSize: 12, color: Colors.textSecondary },
  statValue: { fontFamily: "Poppins_700Bold", fontSize: 18, color: Colors.text },
  tabs: { flexDirection: "row", backgroundColor: Colors.card, borderRadius: 12, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10 },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: Colors.textSecondary },
  tabTextActive: { color: "#fff" },
  list: { paddingBottom: 40, gap: 12 },
  orderCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, gap: 8 },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderId: { fontFamily: "Poppins_700Bold", fontSize: 15, color: Colors.text },
  orderPrice: { fontFamily: "Poppins_700Bold", fontSize: 15, color: Colors.primary },
  orderInfo: { flexDirection: "row", alignItems: "center", gap: 6 },
  address: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 13, color: Colors.textSecondary },
  orderFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  customer: { fontFamily: "Poppins_500Medium", fontSize: 13, color: Colors.text },
  badge: { flexDirection: "row", alignItems: "center", gap: 4 },
  badgeText: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: Colors.primary },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontFamily: "Poppins_500Medium", fontSize: 16, color: Colors.textMuted },
});
