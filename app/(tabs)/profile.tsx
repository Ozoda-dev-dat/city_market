import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Platform,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import getColors from "@/constants/colors";
import { useCart } from "@/context/CartContext";
import { useApp } from "@/context/ProductsContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useLocation } from "@/context/LocationContext";
import { LocationPicker } from "@/components/LocationPicker";
import { useTranslation } from "@/lib/I18nProvider";
import { apiRequest } from "@/lib/query-client";

const MENU_ITEMS = [
  { icon: "bag-handle-outline",        label: "My Orders",     sub: "24 orders placed",   color: "#F97316", bg: "#FFF7ED", route: "/orders" },
  { icon: "location-outline",          label: "Addresses",     sub: "2 saved locations",  color: "#3B82F6", bg: "#EFF6FF", route: null },
  { icon: "heart-outline",             label: "Wishlist",      sub: "12 saved items",     color: "#EF4444", bg: "#FEF2F2", route: null },
  { icon: "pricetag-outline",          label: "Promo Codes",   sub: "3 active coupons",   color: "#8B5CF6", bg: "#F5F3FF", route: null },
  { icon: "gift-outline",              label: "Refer & Earn",  sub: "Earn 5,000 so'm",    color: "#EAB308", bg: "#FEFCE8", route: null },
  { icon: "card-outline",              label: "Payment",       sub: "Visa •••• 4242",     color: "#06B6D4", bg: "#ECFEFF", route: null },
  { icon: "settings-outline",          label: "Settings",      sub: "App preferences",    color: "#6B7280", bg: "#F9FAFB", route: null },
];

function MenuItem({ icon, label, sub, color, bg, onPress, toggle, toggleValue, onToggle, isDarkMode }: {
  icon: string; label: string; sub?: string; color: string; bg: string;
  onPress?: () => void; toggle?: boolean; toggleValue?: boolean;
  onToggle?: (val: boolean) => void; isDarkMode: boolean;
}) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const Colors = getColors(isDarkMode);

  return (
    <Animated.View style={anim}>
      <Pressable
        style={[styles.menuItem, {
          backgroundColor: isDarkMode ? "rgba(28,28,30,0.9)" : "#fff",
        }]}
        onPress={onPress}
        onPressIn={() => { if (!toggle) scale.value = withSpring(0.97, { damping: 12 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
      >
        <View style={[styles.menuIconCircle, { backgroundColor: isDarkMode ? color + "22" : bg }]}>
          <Ionicons name={icon as any} size={19} color={color} />
        </View>
        <View style={{ flex: 1, gap: 1 }}>
          <Text style={[styles.menuLabel, { color: Colors.text }]}>{label}</Text>
          {sub && <Text style={[styles.menuSub, { color: Colors.textMuted }]}>{sub}</Text>}
        </View>
        {toggle ? (
          <Switch
            value={toggleValue}
            onValueChange={onToggle}
            trackColor={{ true: "#16A34A", false: isDarkMode ? "#3f3f46" : "#E5E7EB" }}
            thumbColor="#fff"
          />
        ) : (
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, updateProfile } = useAuth();
  const { items } = useCart();
  const { orders } = useApp();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const { location } = useLocation();
  const { lang, setLang } = useTranslation();

  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (!user) {
    router.replace("/auth");
    return null;
  }

  const userOrders = orders || [];
  const cartItemCount = (items || []).reduce((sum: number, item: any) => sum + (item?.quantity || 0), 0);
  const initial = (user.name || "U").charAt(0).toUpperCase();

  const handleLogout = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: async () => { await logout(); router.replace("/auth"); } },
    ]);
  };

  const handleSaveName = async () => {
    if (!editName.trim()) { Alert.alert("Error", "Name cannot be empty"); return; }
    setSavingName(true);
    try {
      await updateProfile(editName.trim());
      setShowEditModal(false);
    } catch { Alert.alert("Error", "Could not update name"); }
    finally { setSavingName(false); }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) { Alert.alert("Error", "Fill in all fields"); return; }
    if (newPassword !== confirmPassword) { Alert.alert("Error", "New passwords do not match"); return; }
    if (newPassword.length < 6) { Alert.alert("Error", "Password must be at least 6 characters"); return; }
    setSavingPassword(true);
    try {
      const res = await apiRequest("PATCH", "/api/password", { oldPassword, newPassword });
      if (!res.ok) { const d = await res.json(); Alert.alert("Error", d.error || "Failed"); return; }
      setShowPasswordModal(false);
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
      Alert.alert("Success", "Password changed successfully");
    } catch { Alert.alert("Error", "Something went wrong"); }
    finally { setSavingPassword(false); }
  };

  return (
    <>
      <View style={[styles.container, { backgroundColor: isDarkMode ? "#0C0C0E" : "#F5F6F5" }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 40 : 110 }}
        >
          {/* Green gradient hero header */}
          <LinearGradient
            colors={["#1a7a3c", "#16A34A", "#22c55e"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroHeader, { paddingTop: topPad + 20 }]}
          >
            <View style={styles.heroContent}>
              <Pressable
                style={styles.avatarCircle}
                onPress={() => { setEditName(user.name || ""); setShowEditModal(true); }}
              >
                <Text style={styles.avatarInitial}>{initial}</Text>
                <View style={styles.editBadge}>
                  <Ionicons name="pencil" size={10} color="#fff" />
                </View>
              </Pressable>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.heroName}>{user.name || "User"}</Text>
                <Text style={styles.heroPhone}>{user.phoneNumber}</Text>
                <View style={styles.memberBadge}>
                  <Ionicons name="star" size={11} color="#F59E0B" />
                  <Text style={styles.memberBadgeText}>
                    {user.role === "admin" ? "Administrator" : user.role === "courier" ? "Courier" : "Gold Member"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Stats inside header */}
            <View style={[styles.statsRow, { backgroundColor: isDarkMode ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.18)" }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: "#fff" }]}>{userOrders.length}</Text>
                <Text style={styles.statLabel}>Orders</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: "#fff" }]}>{cartItemCount}</Text>
                <Text style={styles.statLabel}>In Cart</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: "#fff" }]}>0</Text>
                <Text style={styles.statLabel}>Reviews</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.body}>
            {/* Quick action cards */}
            <View style={styles.quickRow}>
              <Pressable
                style={[styles.quickCard, { backgroundColor: isDarkMode ? "rgba(28,28,30,0.9)" : "#fff" }]}
                onPress={() => router.push("/orders")}
              >
                <View style={[styles.quickIcon, { backgroundColor: "#FFF7ED" }]}>
                  <Ionicons name="bag-handle-outline" size={20} color="#F97316" />
                </View>
                <Text style={[styles.quickLabel, { color: Colors.text }]}>My Orders</Text>
                <Text style={[styles.quickSub, { color: Colors.textMuted }]}>{userOrders.length} placed</Text>
              </Pressable>
              <Pressable
                style={[styles.quickCard, { backgroundColor: isDarkMode ? "rgba(28,28,30,0.9)" : "#fff" }]}
                onPress={() => setShowLocationPicker(true)}
              >
                <View style={[styles.quickIcon, { backgroundColor: "#EFF6FF" }]}>
                  <Ionicons name="location-outline" size={20} color="#3B82F6" />
                </View>
                <Text style={[styles.quickLabel, { color: Colors.text }]}>Address</Text>
                <Text style={[styles.quickSub, { color: Colors.textMuted }]} numberOfLines={1}>
                  {location?.address ? location.address.slice(0, 14) + "…" : "Set location"}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.quickCard, { backgroundColor: isDarkMode ? "rgba(28,28,30,0.9)" : "#fff" }]}
                onPress={() => Alert.alert("Wishlist", "Coming soon!")}
              >
                <View style={[styles.quickIcon, { backgroundColor: "#FEF2F2" }]}>
                  <Ionicons name="heart-outline" size={20} color="#EF4444" />
                </View>
                <Text style={[styles.quickLabel, { color: Colors.text }]}>Wishlist</Text>
                <Text style={[styles.quickSub, { color: Colors.textMuted }]}>Saved items</Text>
              </Pressable>
            </View>

            {/* Admin/Courier shortcut */}
            {user.role === "courier" && (
              <Pressable
                style={[styles.roleCard, { backgroundColor: "#16A34A" }]}
                onPress={() => router.push("/courier")}
              >
                <View style={styles.roleLeft}>
                  <View style={styles.roleIconBox}>
                    <Ionicons name="bicycle" size={22} color="#fff" />
                  </View>
                  <View>
                    <Text style={styles.roleTitle}>Courier Dashboard</Text>
                    <Text style={styles.roleSub}>Manage deliveries</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
              </Pressable>
            )}
            {user.role === "admin" && (
              <Pressable
                style={[styles.roleCard, { backgroundColor: "#16A34A" }]}
                onPress={() => router.push("/admin")}
              >
                <View style={styles.roleLeft}>
                  <View style={styles.roleIconBox}>
                    <Ionicons name="shield-checkmark" size={22} color="#fff" />
                  </View>
                  <View>
                    <Text style={styles.roleTitle}>Admin Panel</Text>
                    <Text style={styles.roleSub}>Manage everything</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
              </Pressable>
            )}

            {/* Main menu */}
            <Text style={[styles.sectionTitle, { color: Colors.textSecondary }]}>ACCOUNT</Text>
            <View style={styles.menuGroup}>
              <MenuItem icon="bag-handle-outline" label="My Orders" sub={`${userOrders.length} orders placed`} color="#F97316" bg="#FFF7ED" onPress={() => router.push("/orders")} isDarkMode={isDarkMode} />
              <View style={[styles.divider, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "#F3F4F6" }]} />
              <MenuItem icon="location-outline" label="Addresses" sub={location?.address ? location.address.slice(0, 25) + "…" : "No address saved"} color="#3B82F6" bg="#EFF6FF" onPress={() => setShowLocationPicker(true)} isDarkMode={isDarkMode} />
              <View style={[styles.divider, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "#F3F4F6" }]} />
              <MenuItem icon="heart-outline" label="Wishlist" sub="Saved items" color="#EF4444" bg="#FEF2F2" onPress={() => Alert.alert("Wishlist", "Coming soon!")} isDarkMode={isDarkMode} />
              <View style={[styles.divider, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "#F3F4F6" }]} />
              <MenuItem icon="pricetag-outline" label="Promo Codes" sub="Active coupons" color="#8B5CF6" bg="#F5F3FF" onPress={() => Alert.alert("Promo Codes", "Coming soon!")} isDarkMode={isDarkMode} />
              <View style={[styles.divider, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "#F3F4F6" }]} />
              <MenuItem icon="card-outline" label="Payment" sub="Cash on delivery" color="#06B6D4" bg="#ECFEFF" onPress={() => Alert.alert("Payment", "Cash on delivery is currently the only payment method.")} isDarkMode={isDarkMode} />
            </View>

            <Text style={[styles.sectionTitle, { color: Colors.textSecondary }]}>PREFERENCES</Text>
            <View style={styles.menuGroup}>
              <MenuItem icon="notifications-outline" label="Notifications" sub="Push notifications" color="#F97316" bg="#FFF7ED" toggle toggleValue={notifications} onToggle={setNotifications} isDarkMode={isDarkMode} />
              <View style={[styles.divider, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "#F3F4F6" }]} />
              <MenuItem icon="moon-outline" label="Dark Mode" sub="Toggle theme" color="#6366F1" bg="#EEF2FF" toggle toggleValue={isDarkMode} onToggle={toggleDarkMode} isDarkMode={isDarkMode} />
              <View style={[styles.divider, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "#F3F4F6" }]} />
              <MenuItem icon="language-outline" label="Language" sub={lang === "uz" ? "O'zbek" : "Русский"} color="#16A34A" bg="#F0FDF4" onPress={() => setLang(lang === "uz" ? "ru" : "uz")} isDarkMode={isDarkMode} />
              <View style={[styles.divider, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "#F3F4F6" }]} />
              <MenuItem icon="shield-checkmark-outline" label="Change Password" sub="Update your password" color="#EF4444" bg="#FEF2F2" onPress={() => { setOldPassword(""); setNewPassword(""); setConfirmPassword(""); setShowPasswordModal(true); }} isDarkMode={isDarkMode} />
              <View style={[styles.divider, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "#F3F4F6" }]} />
              <MenuItem icon="help-circle-outline" label="Help & Support" sub="Contact us" color="#6B7280" bg="#F9FAFB" onPress={() => Alert.alert("Support", "+998 71 000 00 00\nsupport@citymarket.uz")} isDarkMode={isDarkMode} />
            </View>

            <Pressable style={styles.signOutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color="#EF4444" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </Pressable>

            <Text style={[styles.version, { color: Colors.textMuted }]}>City Market v1.0.0</Text>
          </View>
        </ScrollView>
      </View>

      <LocationPicker visible={showLocationPicker} onClose={() => setShowLocationPicker(false)} />

      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowEditModal(false)}>
            <Pressable style={[styles.modalSheet, { backgroundColor: isDarkMode ? "#1C1C1E" : "#fff" }]} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />
              <Text style={[styles.modalTitle, { color: isDarkMode ? "#fff" : "#111827" }]}>Edit Name</Text>
              <TextInput
                style={[styles.modalInput, { color: isDarkMode ? "#fff" : "#111827", backgroundColor: isDarkMode ? "#2C2C2E" : "#F5F5F5" }]}
                value={editName} onChangeText={setEditName}
                placeholder="Your name" placeholderTextColor="#9CA3AF"
                autoFocus maxLength={50}
              />
              <View style={styles.modalButtons}>
                <Pressable style={[styles.modalCancelBtn, { borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }]} onPress={() => setShowEditModal(false)}>
                  <Text style={[styles.modalCancelText, { color: isDarkMode ? "#9CA3AF" : "#6B7280" }]}>Cancel</Text>
                </Pressable>
                <Pressable style={[styles.modalSaveBtn, savingName && { opacity: 0.6 }]} onPress={handleSaveName} disabled={savingName}>
                  <Text style={styles.modalSaveText}>{savingName ? "Saving..." : "Save"}</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showPasswordModal} transparent animationType="slide" onRequestClose={() => setShowPasswordModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowPasswordModal(false)}>
            <Pressable style={[styles.modalSheet, { backgroundColor: isDarkMode ? "#1C1C1E" : "#fff" }]} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />
              <Text style={[styles.modalTitle, { color: isDarkMode ? "#fff" : "#111827" }]}>Change Password</Text>
              {[
                { val: oldPassword, set: setOldPassword, ph: "Current password" },
                { val: newPassword, set: setNewPassword, ph: "New password" },
                { val: confirmPassword, set: setConfirmPassword, ph: "Confirm new password" },
              ].map((field, i) => (
                <TextInput key={i}
                  style={[styles.modalInput, { color: isDarkMode ? "#fff" : "#111827", backgroundColor: isDarkMode ? "#2C2C2E" : "#F5F5F5", marginTop: i > 0 ? 10 : 0 }]}
                  value={field.val} onChangeText={field.set}
                  placeholder={field.ph} placeholderTextColor="#9CA3AF"
                  secureTextEntry autoFocus={i === 0}
                />
              ))}
              <View style={styles.modalButtons}>
                <Pressable style={[styles.modalCancelBtn, { borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }]} onPress={() => setShowPasswordModal(false)}>
                  <Text style={[styles.modalCancelText, { color: isDarkMode ? "#9CA3AF" : "#6B7280" }]}>Cancel</Text>
                </Pressable>
                <Pressable style={[styles.modalSaveBtn, savingPassword && { opacity: 0.6 }]} onPress={handleChangePassword} disabled={savingPassword}>
                  <Text style={styles.modalSaveText}>{savingPassword ? "Saving..." : "Change"}</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroHeader: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.5)",
  },
  avatarInitial: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: "#fff",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#15803D",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  heroName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: "#fff",
  },
  heroPhone: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
  },
  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  memberBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: "#fff",
  },
  statsRow: {
    flexDirection: "row",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statNumber: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
  },
  statLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.75)",
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginVertical: 4,
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 0,
  },
  quickRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  quickCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    textAlign: "center",
  },
  quickSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    textAlign: "center",
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  roleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  roleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  roleTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: "#fff",
  },
  roleSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 4,
  },
  menuGroup: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
  menuSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
  },
  divider: {
    height: 1,
    marginLeft: 70,
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  signOutText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#EF4444",
  },
  version: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.15)",
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    marginBottom: 16,
  },
  modalInput: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  modalCancelText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
  },
  modalSaveBtn: {
    flex: 1,
    backgroundColor: "#16A34A",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalSaveText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: "#fff",
  },
});
