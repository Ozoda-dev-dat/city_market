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
import { formatPrice } from "@/constants/data";
import { useTranslation } from "@/lib/I18nProvider";
import { apiRequest } from "@/lib/query-client";

function MenuItem({
  icon,
  label,
  value,
  onPress,
  color,
  toggle,
  toggleValue,
  onToggle,
  isDarkMode,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  color?: string;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (val: boolean) => void;
  isDarkMode: boolean;
}) {
  const Colors = getColors(isDarkMode);
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const iconColor = color || "#16A34A";

  return (
    <Animated.View style={anim}>
      <Pressable
        style={styles.menuItem}
        onPress={onPress}
        onPressIn={() => { if (!toggle) scale.value = withSpring(0.97, { damping: 12 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
      >
        <View style={[styles.menuIconWrap, { backgroundColor: color ? "rgba(239,68,68,0.1)" : "rgba(22,163,74,0.1)" }]}>
          <Ionicons name={icon as any} size={18} color={iconColor} />
        </View>
        <Text style={[styles.menuLabel, { color: color || Colors.text }]}>{label}</Text>
        {toggle ? (
          <Switch
            value={toggleValue}
            onValueChange={onToggle}
            trackColor={{ true: "#16A34A", false: isDarkMode ? "#3f3f46" : "#E5E7EB" }}
            thumbColor={toggleValue ? "#fff" : "#fff"}
          />
        ) : (
          <View style={styles.menuRight}>
            {value && <Text style={[styles.menuValue, { color: Colors.textMuted }]}>{value}</Text>}
            {!color && <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

function StatCard({ label, value, accent, isDarkMode }: { label: string; value: string | number; accent?: boolean; isDarkMode: boolean }) {
  const Colors = getColors(isDarkMode);
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (accent) {
    return (
      <Animated.View style={[styles.statCard, anim]}>
        <LinearGradient
          colors={["#16A34A", "#15803D"]}
          style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
        />
        <Text style={[styles.statValue, { color: "#fff" }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: "rgba(255,255,255,0.8)" }]}>{label}</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[
      styles.statCard,
      {
        backgroundColor: isDarkMode ? "rgba(28,28,30,0.7)" : "rgba(255,255,255,0.75)",
        borderColor: isDarkMode ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.9)",
      },
      anim,
    ]}>
      <Text style={[styles.statValue, { color: Colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: Colors.textSecondary }]}>{label}</Text>
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

  const handleLogout = () => {
    Alert.alert("Chiqish", "Tizimdan chiqmoqchimisiz?", [
      { text: "Yo'q", style: "cancel" },
      {
        text: "Ha",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/auth");
        },
      },
    ]);
  };

  const handleSaveName = async () => {
    if (!editName.trim()) { Alert.alert("Xatolik", "Ism bo'sh bo'lishi mumkin emas"); return; }
    setSavingName(true);
    try {
      await updateProfile(editName.trim());
      setShowEditModal(false);
      Alert.alert("Muvaffaqiyat", "Ismingiz yangilandi");
    } catch (e) {
      Alert.alert("Xatolik", "Ismni yangilashda xatolik");
    } finally { setSavingName(false); }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Xatolik", "Barcha maydonlarni to'ldiring"); return;
    }
    if (newPassword !== confirmPassword) { Alert.alert("Xatolik", "Yangi parollar mos kelmaydi"); return; }
    if (newPassword.length < 6) { Alert.alert("Xatolik", "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak"); return; }
    setSavingPassword(true);
    try {
      const res = await apiRequest("PATCH", "/api/password", { oldPassword, newPassword });
      if (!res.ok) {
        const data = await res.json();
        Alert.alert("Xatolik", data.error || "Parolni o'zgartirishda xatolik"); return;
      }
      setShowPasswordModal(false);
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
      Alert.alert("Muvaffaqiyat", "Parolingiz muvaffaqiyatli o'zgartirildi");
    } catch (e) {
      Alert.alert("Xatolik", "Parolni o'zgartirishda xatolik");
    } finally { setSavingPassword(false); }
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: "Kutilmoqda", confirmed: "Tasdiqlandi", preparing: "Tayyorlanmoqda",
      ready: "Tayyor", delivering: "Yo'lda", delivered: "Yetkazildi", cancelled: "Bekor qilindi",
    };
    return map[status] || status;
  };

  const bgColors: [string, string, string] = isDarkMode
    ? ["#0a1f12", "#0f0f12", "#0C0C0E"]
    : ["#d4ede0", "#eaf4ee", "#F5F6F5"];

  const glassCard = {
    backgroundColor: isDarkMode ? "rgba(28,28,30,0.72)" : "rgba(255,255,255,0.78)",
    borderColor: isDarkMode ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.9)",
  };

  return (
    <>
      <View style={{ flex: 1 }}>
        <LinearGradient colors={bgColors} locations={[0, 0.28, 1]} style={StyleSheet.absoluteFill} />
        <View style={[styles.blobTR, { backgroundColor: isDarkMode ? "rgba(22,163,74,0.07)" : "rgba(22,163,74,0.11)" }]} />

        <ScrollView
          style={{ backgroundColor: "transparent" }}
          contentContainerStyle={[styles.content, { paddingTop: topPad + 12, paddingBottom: Platform.OS === "web" ? 34 : 100 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.pageTitle, { color: Colors.text }]}>Profil</Text>

          {/* Profile Hero Card */}
          <View style={[styles.profileCard, glassCard]}>
            <View style={styles.profileCardInner}>
              <View style={styles.avatarWrap}>
                <LinearGradient
                  colors={["#16A34A", "#15803D"]}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarInitial}>{(user.name || "U").charAt(0).toUpperCase()}</Text>
                </LinearGradient>
                <View style={styles.onlineDot} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: Colors.text }]}>{user.name}</Text>
                <Text style={[styles.profilePhone, { color: Colors.textSecondary }]}>{user.phoneNumber}</Text>
                <View style={styles.roleBadge}>
                  <Ionicons name="star" size={11} color="#F59E0B" />
                  <Text style={styles.roleBadgeText}>
                    {user.role === "admin" ? "Admin" : user.role === "courier" ? "Kuryer" : "Mijoz"}
                  </Text>
                </View>
              </View>
            </View>
            <Pressable
              style={[styles.editAvatarBtn, { backgroundColor: isDarkMode ? "rgba(22,163,74,0.2)" : "rgba(22,163,74,0.12)" }]}
              onPress={() => { setEditName(user.name || ""); setShowEditModal(true); }}
            >
              <Ionicons name="create-outline" size={18} color="#16A34A" />
            </Pressable>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <StatCard label="Buyurtmalar" value={userOrders.length} isDarkMode={isDarkMode} />
            <StatCard label="Savatda" value={cartItemCount} accent isDarkMode={isDarkMode} />
            <StatCard label="Ballar" value={0} isDarkMode={isDarkMode} />
          </View>

          {/* Recent Orders */}
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>So&apos;nggi buyurtmalar</Text>

          {userOrders.length === 0 ? (
            <View style={[styles.emptyOrders, glassCard]}>
              <Ionicons name="receipt-outline" size={28} color={Colors.textMuted} />
              <Text style={[styles.emptyOrdersText, { color: Colors.textSecondary }]}>
                Hozircha buyurtmalar yo&apos;q
              </Text>
            </View>
          ) : (
            <>
              {userOrders.slice(0, 3).map((order) => (
                <Pressable
                  key={order.id}
                  style={[styles.orderCard, glassCard]}
                  onPress={() => router.push(`/order/${order.id}`)}
                >
                  <View style={styles.orderHeader}>
                    <Text style={[styles.orderId, { color: Colors.text }]}>#{order.id.slice(-6)}</Text>
                    <View style={[
                      styles.orderStatusBadge,
                      { backgroundColor: order.status === "delivered" ? "rgba(22,163,74,0.12)" : isDarkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)" }
                    ]}>
                      <Ionicons
                        name={order.status === "delivered" ? "checkmark-circle" : "time-outline"}
                        size={12}
                        color={order.status === "delivered" ? "#16A34A" : Colors.textMuted}
                      />
                      <Text style={[styles.orderStatus, { color: order.status === "delivered" ? "#16A34A" : Colors.textSecondary }]}>
                        {getStatusLabel(order.status)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.orderDetails}>
                    <Text style={[styles.orderDate, { color: Colors.textSecondary }]}>
                      {new Date(order.createdAt).toLocaleDateString("uz-UZ")}
                    </Text>
                    <Text style={{ color: Colors.textMuted }}> · </Text>
                    <Text style={[styles.orderDate, { color: Colors.textSecondary }]}>
                      {((order.items as any[]) ?? []).length} ta mahsulot
                    </Text>
                  </View>
                  <View style={styles.orderFooter}>
                    <Text style={[styles.orderTotal, { color: Colors.text }]}>{formatPrice(order.total)}</Text>
                    <View style={styles.trackBtn}>
                      <Text style={styles.trackBtnText}>Kuzatish</Text>
                      <Ionicons name="chevron-forward" size={14} color="#16A34A" />
                    </View>
                  </View>
                </Pressable>
              ))}
              {userOrders.length > 3 && (
                <Pressable style={styles.viewAllBtn} onPress={() => router.push("/orders")}>
                  <Text style={styles.viewAllText}>
                    Barcha buyurtmalar ({userOrders.length})
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#16A34A" />
                </Pressable>
              )}
            </>
          )}

          {/* Special Role Cards */}
          {user.role === "courier" && (
            <Pressable style={styles.courierCard} onPress={() => router.push("/courier")}>
              <View style={styles.specialCardLeft}>
                <View style={styles.specialCardIcon}>
                  <Ionicons name="bicycle" size={22} color="#fff" />
                </View>
                <View>
                  <Text style={styles.specialCardTitle}>Kuryer paneli</Text>
                  <Text style={styles.specialCardSub}>Buyurtmalarni yetkazib berish</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
            </Pressable>
          )}

          {user.role === "admin" && (
            <Pressable style={styles.adminCard} onPress={() => router.push("/admin")}>
              <View style={styles.specialCardLeft}>
                <View style={styles.specialCardIcon}>
                  <Ionicons name="shield-checkmark" size={22} color="#fff" />
                </View>
                <View>
                  <Text style={styles.specialCardTitle}>Admin Panel</Text>
                  <Text style={styles.specialCardSub}>Boshqaruv markazi</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
            </Pressable>
          )}

          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Sozlamalar</Text>

          <View style={[styles.menuCard, glassCard]}>
            <MenuItem
              icon="location-outline" label="Yetkazib berish manzili"
              value={location?.address ? location.address.slice(0, 20) + (location.address.length > 20 ? "…" : "") : "Tanlanmagan"}
              onPress={() => setShowLocationPicker(true)}
              isDarkMode={isDarkMode}
            />
            <View style={[styles.menuDivider, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }]} />
            <MenuItem
              icon="card-outline" label="To'lov usullari" value="Naqd pul"
              onPress={() => Alert.alert("To'lov usullari", "Hozircha faqat naqd pul to'lovi mavjud.\nYetkazib berilgandan so'ng kuryer qabul qiladi.")}
              isDarkMode={isDarkMode}
            />
            <View style={[styles.menuDivider, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }]} />
            <MenuItem
              icon="notifications-outline" label="Bildirishnomalar"
              toggle toggleValue={notifications} onToggle={setNotifications}
              isDarkMode={isDarkMode}
            />
            <View style={[styles.menuDivider, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }]} />
            <MenuItem
              icon="moon-outline" label="Tungi rejim"
              toggle toggleValue={isDarkMode} onToggle={toggleDarkMode}
              isDarkMode={isDarkMode}
            />
            <View style={[styles.menuDivider, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }]} />
            <MenuItem
              icon="language-outline" label="Til"
              value={lang === "uz" ? "O'zbekcha" : "Русский"}
              onPress={() => setLang(lang === "uz" ? "ru" : "uz")}
              isDarkMode={isDarkMode}
            />
            <View style={[styles.menuDivider, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }]} />
            <MenuItem
              icon="shield-checkmark-outline" label="Parolni o'zgartirish"
              onPress={() => { setOldPassword(""); setNewPassword(""); setConfirmPassword(""); setShowPasswordModal(true); }}
              isDarkMode={isDarkMode}
            />
            <View style={[styles.menuDivider, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }]} />
            <MenuItem
              icon="help-circle-outline" label="Yordam"
              onPress={() => Alert.alert("Yordam markazi", "Muammo yoki savollar bo'lsa:\n+998 71 000 00 00\nsupport@citymarket.uz\n\nIsh vaqti: 9:00 - 21:00")}
              isDarkMode={isDarkMode}
            />
            <View style={[styles.menuDivider, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }]} />
            <MenuItem
              icon="information-circle-outline" label="Ilova haqida" value="v1.0.0"
              onPress={() => Alert.alert("City Market", "Versiya 1.0.0\n\nTez va qulay oziq-ovqat yetkazib berish xizmati.")}
              isDarkMode={isDarkMode}
            />
          </View>

          <View style={[styles.menuCard, glassCard]}>
            <MenuItem
              icon="log-out-outline" label="Chiqish"
              color="#EF4444" onPress={handleLogout}
              isDarkMode={isDarkMode}
            />
          </View>

          <Text style={[styles.version, { color: Colors.textMuted }]}>City market v1.0.0</Text>
        </ScrollView>
      </View>

      <LocationPicker visible={showLocationPicker} onClose={() => setShowLocationPicker(false)} />

      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowEditModal(false)}>
            <Pressable style={[styles.modalSheet, { backgroundColor: isDarkMode ? "#1C1C1E" : "#FFFFFF" }]} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />
              <Text style={[styles.modalTitle, { color: Colors.text }]}>Ismni tahrirlash</Text>
              <TextInput
                style={[styles.modalInput, { color: Colors.text, backgroundColor: isDarkMode ? "#2C2C2E" : "#F5F5F5" }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Ismingizni kiriting"
                placeholderTextColor={Colors.textMuted}
                autoFocus
                maxLength={50}
              />
              <View style={styles.modalButtons}>
                <Pressable style={[styles.modalCancelBtn, { borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }]} onPress={() => setShowEditModal(false)}>
                  <Text style={[styles.modalCancelText, { color: Colors.textSecondary }]}>Bekor qilish</Text>
                </Pressable>
                <Pressable style={[styles.modalSaveBtn, savingName && { opacity: 0.6 }]} onPress={handleSaveName} disabled={savingName}>
                  <Text style={styles.modalSaveText}>{savingName ? "Saqlanmoqda..." : "Saqlash"}</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showPasswordModal} transparent animationType="slide" onRequestClose={() => setShowPasswordModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowPasswordModal(false)}>
            <Pressable style={[styles.modalSheet, { backgroundColor: isDarkMode ? "#1C1C1E" : "#FFFFFF" }]} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />
              <Text style={[styles.modalTitle, { color: Colors.text }]}>Parolni o&apos;zgartirish</Text>
              {[
                { val: oldPassword, set: setOldPassword, ph: "Eski parol" },
                { val: newPassword, set: setNewPassword, ph: "Yangi parol" },
                { val: confirmPassword, set: setConfirmPassword, ph: "Yangi parolni tasdiqlang" },
              ].map((field, i) => (
                <TextInput
                  key={i}
                  style={[styles.modalInput, { color: Colors.text, backgroundColor: isDarkMode ? "#2C2C2E" : "#F5F5F5", marginTop: i > 0 ? 10 : 0 }]}
                  value={field.val}
                  onChangeText={field.set}
                  placeholder={field.ph}
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry
                  autoFocus={i === 0}
                />
              ))}
              <View style={styles.modalButtons}>
                <Pressable style={[styles.modalCancelBtn, { borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }]} onPress={() => setShowPasswordModal(false)}>
                  <Text style={[styles.modalCancelText, { color: Colors.textSecondary }]}>Bekor qilish</Text>
                </Pressable>
                <Pressable style={[styles.modalSaveBtn, savingPassword && { opacity: 0.6 }]} onPress={handleChangePassword} disabled={savingPassword}>
                  <Text style={styles.modalSaveText}>{savingPassword ? "Saqlanmoqda..." : "O'zgartirish"}</Text>
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
  blobTR: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -70,
    right: -60,
  },
  content: { paddingHorizontal: 16 },
  pageTitle: { fontFamily: "Poppins_700Bold", fontSize: 28, marginBottom: 18 },
  profileCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 5,
  },
  profileCardInner: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  avatarInitial: { fontFamily: "Poppins_700Bold", fontSize: 26, color: "#fff" },
  onlineDot: {
    position: "absolute",
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: "#22C55E",
    bottom: 1,
    right: 1,
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileInfo: { flex: 1, gap: 3 },
  profileName: { fontFamily: "Poppins_700Bold", fontSize: 16 },
  profilePhone: { fontFamily: "Poppins_400Regular", fontSize: 13 },
  roleBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#FFFBEB", paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, alignSelf: "flex-start",
  },
  roleBadgeText: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: "#F59E0B" },
  editAvatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 4,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  statValue: { fontFamily: "Poppins_700Bold", fontSize: 22 },
  statLabel: { fontFamily: "Poppins_400Regular", fontSize: 11, textAlign: "center" },
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: 17, marginBottom: 12, marginTop: 4 },
  emptyOrders: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 12,
  },
  emptyOrdersText: { fontFamily: "Poppins_400Regular", fontSize: 14 },
  orderCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderId: { fontFamily: "Poppins_600SemiBold", fontSize: 15 },
  orderStatusBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  orderStatus: { fontFamily: "Poppins_500Medium", fontSize: 12 },
  orderDetails: { flexDirection: "row", alignItems: "center" },
  orderDate: { fontFamily: "Poppins_400Regular", fontSize: 13 },
  orderFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderTotal: { fontFamily: "Poppins_700Bold", fontSize: 15 },
  trackBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderWidth: 1.5, borderColor: "#16A34A",
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10,
  },
  trackBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "#16A34A" },
  viewAllBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 12, marginBottom: 8,
  },
  viewAllText: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: "#16A34A" },
  adminCard: {
    backgroundColor: "#16A34A", borderRadius: 20, padding: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 10, shadowColor: "#16A34A", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 14, elevation: 7,
  },
  courierCard: {
    backgroundColor: "#3B82F6", borderRadius: 20, padding: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 10, shadowColor: "#3B82F6", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 14, elevation: 7,
  },
  specialCardLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  specialCardIcon: {
    width: 44, height: 44, backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 14, alignItems: "center", justifyContent: "center",
  },
  specialCardTitle: { fontFamily: "Poppins_700Bold", fontSize: 15, color: "#fff" },
  specialCardSub: { fontFamily: "Poppins_400Regular", fontSize: 12, color: "rgba(255,255,255,0.8)" },
  menuCard: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  menuItem: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  menuIconWrap: {
    width: 36, height: 36, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
  },
  menuLabel: { flex: 1, fontFamily: "Poppins_500Medium", fontSize: 15 },
  menuRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  menuValue: { fontFamily: "Poppins_400Regular", fontSize: 13 },
  menuDivider: { height: 1, marginHorizontal: 16 },
  version: { fontFamily: "Poppins_400Regular", fontSize: 12, textAlign: "center", marginTop: 4, marginBottom: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: Platform.OS === "ios" ? 40 : 24, gap: 0,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: "#E5E7EB",
    alignSelf: "center", marginBottom: 20,
  },
  modalTitle: { fontFamily: "Poppins_700Bold", fontSize: 18, marginBottom: 16 },
  modalInput: {
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13,
    fontFamily: "Poppins_400Regular", fontSize: 15,
  },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 20 },
  modalCancelBtn: {
    flex: 1, borderWidth: 1.5, borderRadius: 14,
    paddingVertical: 13, alignItems: "center",
  },
  modalCancelText: { fontFamily: "Poppins_600SemiBold", fontSize: 15 },
  modalSaveBtn: {
    flex: 1, backgroundColor: "#16A34A", borderRadius: 14,
    paddingVertical: 13, alignItems: "center",
  },
  modalSaveText: { fontFamily: "Poppins_700Bold", fontSize: 15, color: "#fff" },
});
