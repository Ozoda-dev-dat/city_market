import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/constants/data";

const ORDER_HISTORY = [
  {
    id: "ORD-2842",
    date: "Feb 25, 2026",
    items: 5,
    total: 87500,
    status: "delivered",
  },
  {
    id: "ORD-2791",
    date: "Feb 20, 2026",
    items: 3,
    total: 42300,
    status: "delivered",
  },
  {
    id: "ORD-2634",
    date: "Feb 14, 2026",
    items: 8,
    total: 156000,
    status: "delivered",
  },
];

function MenuItem({
  icon,
  label,
  value,
  onPress,
  color,
  toggle,
  toggleValue,
  onToggle,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  color?: string;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (val: boolean) => void;
}) {
  return (
    <Pressable
      style={styles.menuItem}
      onPress={onPress}
      disabled={toggle}
    >
      <View style={[styles.menuIcon, { backgroundColor: color ? color + "20" : Colors.primaryLight }]}>
        <Ionicons name={icon as any} size={18} color={color ?? Colors.primary} />
      </View>
      <Text style={[styles.menuLabel, color ? { color } : {}]}>{label}</Text>
      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: Colors.divider, true: Colors.primary }}
          thumbColor="#fff"
        />
      ) : (
        <View style={styles.menuRight}>
          {value && <Text style={styles.menuValue}>{value}</Text>}
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </View>
      )}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { totalItems } = useCart();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 12, paddingBottom: Platform.OS === "web" ? 34 : 90 }]}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={styles.title}>Profile</Text>

      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarEmoji}>👤</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>Guest User</Text>
          <Text style={styles.profilePhone}>+998 90 000 00 00</Text>
          <View style={styles.profileBadge}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.profileBadgeText}>Gold Member</Text>
          </View>
        </View>
        <Pressable style={styles.editBtn}>
          <Ionicons name="pencil" size={16} color={Colors.primary} />
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{ORDER_HISTORY.length}</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={[styles.statCard, styles.statCardCenter]}>
          <Text style={[styles.statValue, styles.statValueLight]}>{totalItems}</Text>
          <Text style={[styles.statLabel, styles.statLabelLight]}>In Cart</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>2.4k</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Orders</Text>

      {ORDER_HISTORY.map((order) => (
        <View key={order.id} style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderId}>{order.id}</Text>
            <View style={styles.orderStatusBadge}>
              <Ionicons name="checkmark-circle" size={12} color={Colors.primary} />
              <Text style={styles.orderStatus}>Delivered</Text>
            </View>
          </View>
          <View style={styles.orderDetails}>
            <Text style={styles.orderDate}>{order.date}</Text>
            <Text style={styles.orderDot}>·</Text>
            <Text style={styles.orderItems}>{order.items} items</Text>
          </View>
          <View style={styles.orderFooter}>
            <Text style={styles.orderTotal}>{formatPrice(order.total)}</Text>
            <Pressable style={styles.reorderBtn}>
              <Text style={styles.reorderBtnText}>Reorder</Text>
            </Pressable>
          </View>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Settings</Text>

      <View style={styles.menuCard}>
        <MenuItem
          icon="location-outline"
          label="Delivery Address"
          value="Tashkent"
          onPress={() => {}}
        />
        <View style={styles.menuDivider} />
        <MenuItem
          icon="card-outline"
          label="Payment Methods"
          value="Uzcard"
          onPress={() => {}}
        />
        <View style={styles.menuDivider} />
        <MenuItem
          icon="notifications-outline"
          label="Notifications"
          toggle
          toggleValue={notifications}
          onToggle={setNotifications}
        />
        <View style={styles.menuDivider} />
        <MenuItem
          icon="moon-outline"
          label="Dark Mode"
          toggle
          toggleValue={darkMode}
          onToggle={setDarkMode}
        />
        <View style={styles.menuDivider} />
        <MenuItem
          icon="language-outline"
          label="Language"
          value="English"
          onPress={() => {}}
        />
      </View>

      <Text style={styles.sectionTitle}>Support</Text>
      <View style={styles.menuCard}>
        <MenuItem icon="help-circle-outline" label="Help Center" onPress={() => {}} />
        <View style={styles.menuDivider} />
        <MenuItem icon="chatbubble-outline" label="Contact Us" onPress={() => {}} />
        <View style={styles.menuDivider} />
        <MenuItem icon="document-text-outline" label="Privacy Policy" onPress={() => {}} />
      </View>

      <View style={styles.menuCard}>
        <MenuItem icon="log-out-outline" label="Sign Out" color={Colors.error} onPress={() => {}} />
      </View>

      <Text style={styles.version}>FreshMart v1.0.0</Text>
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
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 26,
    color: Colors.text,
    marginBottom: 20,
  },
  profileCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    gap: 14,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    backgroundColor: Colors.primaryLight,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 30,
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  profileName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    color: Colors.text,
  },
  profilePhone: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  profileBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  profileBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: "#F59E0B",
  },
  editBtn: {
    width: 36,
    height: 36,
    backgroundColor: Colors.primaryLight,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardCenter: {
    backgroundColor: Colors.primary,
  },
  statValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: Colors.text,
  },
  statValueLight: {
    color: "#fff",
  },
  statLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statLabelLight: {
    color: "rgba(255,255,255,0.8)",
  },
  sectionTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    color: Colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  orderCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 8,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderId: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: Colors.text,
  },
  orderStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  orderStatus: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: Colors.primary,
  },
  orderDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  orderDate: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  orderDot: {
    color: Colors.textMuted,
  },
  orderItems: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderTotal: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: Colors.text,
  },
  reorderBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  reorderBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: Colors.primary,
  },
  menuCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    flex: 1,
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
    color: Colors.text,
  },
  menuRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  menuValue: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: 64,
  },
  version: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 8,
  },
});
