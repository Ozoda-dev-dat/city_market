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
        style={[styles.menuItem, { backgroundColor: isDarkMode ? "rgba(28,28,30,0.9)" : "#fff" }]}
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
  const { t, lang, setLang } = useTranslation();

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
    Alert.alert(t("sign_out_title"), t("sign_out_confirm"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("yes"), style: "destructive", onPress: async () => { await logout(); router.replace("/auth"); } },
    ]);
  };

  const handleSaveName = async () => {
    if (!editName.trim()) { Alert.alert(t("error"), t("name_empty")); return; }
    setSavingName(true);
    try {
      await updateProfile(editName.trim());
      setShowEditModal(false);
      Alert.alert(t("success"), t("successfully_changed"));
    } catch {
      Alert.alert(t("error"), t("could_not_update"));
    } finally { setSavingName(false); }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) { Alert.alert(t("error"), t("error_fill")); return; }
    if (newPassword !== confirmPassword) { Alert.alert(t("error"), t("passwords_not_match")); return; }
    if (newPassword.length < 6) { Alert.alert(t("error"), t("password_min_6")); return; }
    setSavingPassword(true);
    try {
      const res = await apiRequest("PATCH", "/api/password", { oldPassword, newPassword });
      if (!res.ok) { const d = await res.json(); Alert.alert(t("error"), d.error || t("something_wrong")); return; }
      setShowPasswordModal(false);
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
      Alert.alert(t("success"), t("password_changed"));
    } catch { Alert.alert(t("error"), t("something_wrong")); }
    finally { setSavingPassword(false); }
  };

  const memberLabel = user.role === "admin"
    ? t("admin")
    : user.role === "courier"
    ? t("courier")
    : t("gold_member");

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
                <Text style={styles.heroName}>{user.name || t("profile")}</Text>
                <Text style={styles.heroPhone}>{user.phoneNumber}</Text>
                <View style={styles.memberBadge}>
                  <Ionicons name="star" size={11} color="#F59E0B" />
                  <Text style={styles.memberBadgeText}>{memberLabel}</Text>
                </View>
              </View>
            </View>

            <View style={[styles.statsRow, { backgroundColor: "rgba(0,0,0,0.18)" }]}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userOrders.length}</Text>
                <Text style={styles.statLabel}>{t("orders_stat")}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{cartItemCount}</Text>
                <Text style={styles.statLabel}>{t("in_cart_stat")}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>{t("reviews_stat")}</Text>
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
                <Text style={[styles.quickLabel, { color: Colors.text }]}>{t("my_orders")}</Text>
                <Text style={[styles.quickSub, { color: Colors.textMuted }]}>{userOrders.length} {t("orders_placed")}</Text>
              </Pressable>
              <Pressable
                style={[styles.quickCard, { backgroundColor: isDarkMode ? "rgba(28,28,30,0.9)" : "#fff" }]}
                onPress={() => setShowLocationPicker(true)}
              >
                <View style={[styles.quickIcon, { backgroundColor: "#EFF6FF" }]}>
                  <Ionicons name="location-outline" size={20} color="#3B82F6" />
                </View>
                <Text style={[styles.quickLabel, { color: Colors.text }]}>{t("addresses")}</Text>
                <Text style={[styles.quickSub, { color: Colors.textMuted }]} numberOfLines={1}>
                  {location?.address ? location.address.slice(0, 14) + "…" : t("no_address")}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.quickCard, { backgroundColor: isDarkMode ? "rgba(28,28,30,0.9)" : "#fff" }]}
                onPress={() => Alert.alert(t("wishlist"), t("coming_soon"))}
              >
                <View style={[styles.quickIcon, { backgroundColor: "#FEF2F2" }]}>
                  <Ionicons name="heart-outline" size={20} color="#EF4444" />
                </View>
                <Text style={[styles.quickLabel, { color: Colors.text }]}>{t("wishlist")}</Text>
                <Text style={[styles.quickSub, { color: Colors.textMuted }]}>{t("saved_items")}</Text>
              </Pressable>
            </View>

            {/* Courier/Admin shortcut */}
            {user.role === "courier" && (
              <Pressable style={[styles.roleCard, { backgroundColor: "#16A34A" }]} onPress={() => router.push("/courier")}>
                <View style={styles.roleLeft}>
                  <View style={styles.roleIconBox}><Ionicons name="bicycle" size={22} color="#fff" /></View>
                  <View>
                    <Text style={styles.roleTitle}>{t("courier_dashboard")}</Text>
                    <Text style={styles.roleSub}>{t("manage_deliveries")}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
              </Pressable>
            )}
            {user.role === "admin" && (
              <Pressable style={[styles.roleCard, { backgroundColor: "#16A34A" }]} onPress={() => router.push("/admin")}>
                <View style={styles.roleLeft}>
                  <View style={styles.roleIconBox}><Ionicons name="shield-checkmark" size={22} color="#fff" /></View>
                  <View>
                    <Text style={styles.roleTitle}>{t("admin_panel")}</Text>
                    <Text style={styles.roleSub}>{t("manage_everything")}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
              </Pressable>
            )}

            {/* Account menu */}
            <Text style={[styles.sectionTitle, { color: Colors.textSecondary }]}>{t("section_account")}</Text>
            <View style={styles.menuGroup}>
              <MenuItem icon="bag-handle-outline" label={t("my_orders")} sub={`${userOrders.length} ${t("orders_placed")}`} color="#F97316" bg="#FFF7ED" onPress={() => router.push("/orders")} isDarkMode={isDarkMode} />
              <View style={[styles.divider, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "#F3F4F6" }]} />
              <MenuItem icon="location-outline" label={t("addresses")} sub={location?.address ? location.address.slice(0, 25) + "…" : t("no_address")} color="#3B82F6" bg="#EFF6FF" onPress={() => setShowLocationPicker(true)} isDarkMode={isDarkMode} />
              <View style={[styles.divider, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "#F3F4F6" }]} />
              <MenuItem icon="heart-outline" label={t("wishlist")} sub={t("saved_items")} color="#EF4444" bg="#FEF2F2" onPress={() => Alert.alert(t("wishlist"), t("coming_soon"))} isDarkMode={isDarkMode} />
              <View style={[styles.divider, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "#F3F4F6" }]} />
              <MenuItem icon="pricetag-outline" label={t("promo_codes")} sub={t("active_coupons")} color="#8B5CF6" bg="#F5F3FF" onPress={() => Alert.alert(t("promo_codes"), t("coming_soon"))} isDarkMode={isDarkMode} />
              <View style={[styles.divider, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "#F3F4F6" }]} />
              <MenuItem icon="card-outline" label={t("payment")} sub={t("cash_on_delivery")} color="#06B6D4" bg="#ECFEFF" onPress={() => Alert.alert(t("payment"), t("cash_on_delivery"))} isDarkMode={isDarkMode} />
            </View>

            {/* Preferences menu */}
            <Text style={[styles.sectionTitle, { color: Colors.textSecondary }]}>{t("section_preferences")}</Text>
            <View style={styles.menuGroup}>
              <MenuItem icon="notifications-outline" label={t("notifications")} sub={t("push_notifications")} color="#F97316" bg="#FFF7ED" toggle toggleValue={notifications} onToggle={setNotifications} isDarkMode={isDarkMode} />
              <View style={[styles.divider, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "#F3F4F6" }]} />
              <MenuItem icon="moon-outline" label={t("dark_mode")} sub={t("toggle_theme")} color="#6366F1" bg="#EEF2FF" toggle toggleValue={isDarkMode} onToggle={toggleDarkMode} isDarkMode={isDarkMode} />
              <View style={[styles.divider, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "#F3F4F6" }]} />
              <MenuItem
                icon="language-outline" label={t("language")} sub={t("language_name")} color="#16A34A" bg="#F0FDF4"
                onPress={() => setLang(lang === "uz" ? "ru" : "uz")}
                isDarkMode={isDarkMode}
              />
              <View style={[styles.divider, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "#F3F4F6" }]} />
              <MenuItem icon="shield-checkmark-outline" label={t("change_password")} sub={t("update_password")} color="#EF4444" bg="#FEF2F2" onPress={() => { setOldPassword(""); setNewPassword(""); setConfirmPassword(""); setShowPasswordModal(true); }} isDarkMode={isDarkMode} />
              <View style={[styles.divider, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "#F3F4F6" }]} />
              <MenuItem icon="help-circle-outline" label={t("help_support")} sub={t("contact_us")} color="#6B7280" bg="#F9FAFB" onPress={() => Alert.alert(t("help_support"), "+998 71 000 00 00\nsupport@citymarket.uz")} isDarkMode={isDarkMode} />
            </View>

            <Pressable style={styles.signOutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color="#EF4444" />
              <Text style={styles.signOutText}>{t("sign_out")}</Text>
            </Pressable>

            <Text style={[styles.version, { color: Colors.textMuted }]}>{t("version")}</Text>
          </View>
        </ScrollView>
      </View>

      <LocationPicker visible={showLocationPicker} onClose={() => setShowLocationPicker(false)} />

      {/* Edit Name Modal */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowEditModal(false)}>
            <Pressable style={[styles.modalSheet, { backgroundColor: isDarkMode ? "#1C1C1E" : "#fff" }]} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />
              <Text style={[styles.modalTitle, { color: isDarkMode ? "#fff" : "#111827" }]}>{t("edit_name")}</Text>
              <TextInput
                style={[styles.modalInput, { color: isDarkMode ? "#fff" : "#111827", backgroundColor: isDarkMode ? "#2C2C2E" : "#F5F5F5" }]}
                value={editName} onChangeText={setEditName}
                placeholder={t("your_name")} placeholderTextColor="#9CA3AF"
                autoFocus maxLength={50}
              />
              <View style={styles.modalButtons}>
                <Pressable style={[styles.modalCancelBtn, { borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }]} onPress={() => setShowEditModal(false)}>
                  <Text style={[styles.modalCancelText, { color: isDarkMode ? "#9CA3AF" : "#6B7280" }]}>{t("cancel")}</Text>
                </Pressable>
                <Pressable style={[styles.modalSaveBtn, savingName && { opacity: 0.6 }]} onPress={handleSaveName} disabled={savingName}>
                  <Text style={styles.modalSaveText}>{savingName ? t("saving") : t("save")}</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} transparent animationType="slide" onRequestClose={() => setShowPasswordModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowPasswordModal(false)}>
            <Pressable style={[styles.modalSheet, { backgroundColor: isDarkMode ? "#1C1C1E" : "#fff" }]} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />
              <Text style={[styles.modalTitle, { color: isDarkMode ? "#fff" : "#111827" }]}>{t("change_password_title")}</Text>
              {[
                { val: oldPassword, set: setOldPassword, ph: t("current_password") },
                { val: newPassword, set: setNewPassword, ph: t("new_password") },
                { val: confirmPassword, set: setConfirmPassword, ph: t("confirm_new_password") },
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
                  <Text style={[styles.modalCancelText, { color: isDarkMode ? "#9CA3AF" : "#6B7280" }]}>{t("cancel")}</Text>
                </Pressable>
                <Pressable style={[styles.modalSaveBtn, savingPassword && { opacity: 0.6 }]} onPress={handleChangePassword} disabled={savingPassword}>
                  <Text style={styles.modalSaveText}>{savingPassword ? t("saving") : t("change_btn")}</Text>
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
  heroHeader: { paddingHorizontal: 20, paddingBottom: 20 },
  heroContent: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 20 },
  avatarCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 3, borderColor: "rgba(255,255,255,0.5)",
  },
  avatarInitial: { fontFamily: "Poppins_700Bold", fontSize: 28, color: "#fff" },
  editBadge: {
    position: "absolute", bottom: 0, right: 0,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "#15803D", alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#fff",
  },
  heroName: { fontFamily: "Poppins_700Bold", fontSize: 20, color: "#fff" },
  heroPhone: { fontFamily: "Poppins_400Regular", fontSize: 13, color: "rgba(255,255,255,0.8)" },
  memberBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: "flex-start",
  },
  memberBadgeText: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: "#fff" },
  statsRow: { flexDirection: "row", borderRadius: 16, paddingVertical: 14, paddingHorizontal: 10 },
  statItem: { flex: 1, alignItems: "center", gap: 2 },
  statNumber: { fontFamily: "Poppins_700Bold", fontSize: 20, color: "#fff" },
  statLabel: { fontFamily: "Poppins_400Regular", fontSize: 11, color: "rgba(255,255,255,0.75)" },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.25)", marginVertical: 4 },
  body: { paddingHorizontal: 16, paddingTop: 20 },
  quickRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  quickCard: {
    flex: 1, borderRadius: 16, padding: 14, alignItems: "center", gap: 6,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  quickIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  quickLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 12, textAlign: "center" },
  quickSub: { fontFamily: "Poppins_400Regular", fontSize: 10, textAlign: "center" },
  roleCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 16, padding: 16, marginBottom: 20 },
  roleLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  roleIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  roleTitle: { fontFamily: "Poppins_700Bold", fontSize: 15, color: "#fff" },
  roleSub: { fontFamily: "Poppins_400Regular", fontSize: 12, color: "rgba(255,255,255,0.75)" },
  sectionTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 11, letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  menuGroup: {
    borderRadius: 20, overflow: "hidden", marginBottom: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  menuIconCircle: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  menuSub: { fontFamily: "Poppins_400Regular", fontSize: 11 },
  divider: { height: 1, marginLeft: 70 },
  signOutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#FEF2F2", borderRadius: 16, paddingVertical: 16, marginBottom: 16 },
  signOutText: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: "#EF4444" },
  version: { fontFamily: "Poppins_400Regular", fontSize: 12, textAlign: "center", marginBottom: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(0,0,0,0.15)", alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontFamily: "Poppins_700Bold", fontSize: 20, marginBottom: 16 },
  modalInput: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontFamily: "Poppins_400Regular", fontSize: 15 },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 20 },
  modalCancelBtn: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1 },
  modalCancelText: { fontFamily: "Poppins_600SemiBold", fontSize: 15 },
  modalSaveBtn: { flex: 1, backgroundColor: "#16A34A", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  modalSaveText: { fontFamily: "Poppins_700Bold", fontSize: 15, color: "#fff" },
});
