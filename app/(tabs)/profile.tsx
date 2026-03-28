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
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const styles = getStyles(isDarkMode);

  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIcon}>
        <Ionicons name={icon as any} size={20} color={color || Colors.primary} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ true: Colors.primary, false: Colors.divider }}
          thumbColor={Colors.background}
        />
      ) : (
        value && <Text style={styles.menuValue}>{value}</Text>
      )}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, isLoading, logout, updateProfile } = useAuth();
  const { items } = useCart();
  const { orders } = useApp();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const styles = getStyles(isDarkMode);
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
  const totalItems = (items || []).reduce((sum: number, item: any) => sum + (item?.quantity || 0), 0);

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

  const openEditProfile = () => {
    setEditName(user.name || "");
    setShowEditModal(true);
  };

  const handleSaveName = async () => {
    if (!editName.trim()) {
      Alert.alert("Xatolik", "Ism bo'sh bo'lishi mumkin emas");
      return;
    }
    setSavingName(true);
    try {
      await updateProfile(editName.trim());
      setShowEditModal(false);
      Alert.alert("Muvaffaqiyat", "Ismingiz yangilandi");
    } catch (e) {
      Alert.alert("Xatolik", "Ismni yangilashda xatolik yuz berdi");
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Xatolik", "Barcha maydonlarni to'ldiring");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Xatolik", "Yangi parollar mos kelmaydi");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Xatolik", "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await apiRequest("PATCH", "/api/password", { oldPassword, newPassword });
      if (!res.ok) {
        const data = await res.json();
        Alert.alert("Xatolik", data.error || "Parolni o'zgartirishda xatolik");
        return;
      }
      setShowPasswordModal(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Muvaffaqiyat", "Parolingiz muvaffaqiyatli o'zgartirildi");
    } catch (e) {
      Alert.alert("Xatolik", "Parolni o'zgartirishda xatolik yuz berdi");
    } finally {
      setSavingPassword(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Kutilmoqda";
      case "confirmed": return "Tasdiqlandi";
      case "preparing": return "Tayyorlanmoqda";
      case "ready": return "Tayyor";
      case "delivering": return "Yo'lda";
      case "delivered": return "Yetkazildi";
      case "cancelled": return "Bekor qilindi";
      default: return status;
    }
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: topPad + 12, paddingBottom: Platform.OS === "web" ? 34 : 90 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Profil</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarInitial}>{(user.name || "U").charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profilePhone}>{user.phoneNumber}</Text>
            <View style={styles.profileBadge}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.profileBadgeText}>
                {user.role === "admin" ? "Admin" : user.role === "courier" ? "Kuryer" : "Mijoz"}
              </Text>
            </View>
          </View>
          <Pressable style={styles.editBtn} onPress={openEditProfile}>
            <Ionicons name="create-outline" size={18} color={Colors.primary} />
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{userOrders.length}</Text>
            <Text style={styles.statLabel}>Buyurtmalar</Text>
          </View>
          <View style={[styles.statCard, styles.statCardCenter]}>
            <Text style={[styles.statValue, styles.statValueLight]}>{totalItems}</Text>
            <Text style={[styles.statLabel, styles.statLabelLight]}>Savatda</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Ballar</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>So&apos;nggi buyurtmalar</Text>

        {userOrders.length === 0 ? (
          <View style={styles.emptyOrders}>
            <Text style={styles.emptyOrdersText}>Hozircha buyurtmalar yo&apos;q</Text>
          </View>
        ) : (
          <>
            {userOrders.slice(0, 3).map((order) => (
              <Pressable key={order.id} style={styles.orderCard} onPress={() => router.push(`/order/${order.id}`)}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>#{order.id.slice(-6)}</Text>
                  <View style={[styles.orderStatusBadge, order.status === "delivered" && { backgroundColor: Colors.primaryLight }]}>
                    <Ionicons
                      name={order.status === "delivered" ? "checkmark-circle" : "time-outline"}
                      size={12}
                      color={order.status === "delivered" ? Colors.primary : Colors.textMuted}
                    />
                    <Text style={[styles.orderStatus, order.status !== "delivered" && { color: Colors.textSecondary }]}>
                      {getStatusLabel(order.status)}
                    </Text>
                  </View>
                </View>
                <View style={styles.orderDetails}>
                  <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString("uz-UZ")}</Text>
                  <Text style={styles.orderDot}>·</Text>
                  <Text style={styles.orderItems}>{(order.items as any[]).length} ta mahsulot</Text>
                </View>
                <View style={styles.orderFooter}>
                  <Text style={styles.orderTotal}>{formatPrice(order.total)}</Text>
                  <Pressable style={styles.reorderBtn} onPress={() => router.push(`/order/${order.id}`)}>
                    <Text style={styles.reorderBtnText}>Kuzatish</Text>
                  </Pressable>
                </View>
              </Pressable>
            ))}
            {userOrders.length > 3 && (
              <Pressable style={styles.viewAllButton} onPress={() => router.push("/orders")}>
                <Text style={styles.viewAllButtonText}>Barcha buyurtmalarni ko&apos;rish ({userOrders.length})</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
              </Pressable>
            )}
          </>
        )}

        {user.role === "courier" && (
          <Pressable style={styles.courierCard} onPress={() => router.push("/courier")}>
            <View style={styles.adminCardLeft}>
              <View style={[styles.adminIconContainer, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
                <Ionicons name="bicycle" size={22} color="#fff" />
              </View>
              <View>
                <Text style={styles.adminCardTitle}>Kuryer paneli</Text>
                <Text style={styles.adminCardSub}>Buyurtmalarni yetkazib berish</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
          </Pressable>
        )}

        {user.role === "admin" && (
          <Pressable style={styles.adminCard} onPress={() => router.push("/admin")}>
            <View style={styles.adminCardLeft}>
              <View style={styles.adminIconContainer}>
                <Ionicons name="shield-checkmark" size={22} color="#fff" />
              </View>
              <View>
                <Text style={styles.adminCardTitle}>Admin Panel</Text>
                <Text style={styles.adminCardSub}>Boshqaruv markazi</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
          </Pressable>
        )}

        <Text style={styles.sectionTitle}>Sozlamalar</Text>

        <View style={styles.menuCard}>
          <MenuItem
            icon="location-outline"
            label="Yetkazib berish manzili"
            value={location?.address || "Manzil tanlanmagan"}
            onPress={() => setShowLocationPicker(true)}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="card-outline"
            label="To'lov usullari"
            value="Naqd pul"
            onPress={() => Alert.alert("To'lov usullari", "Hozircha faqat naqd pul to'lovi mavjud.\nYetkazib berilgandan so'ng kuryer qabul qiladi.")}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="notifications-outline"
            label="Bildirishnomalar"
            toggle
            toggleValue={notifications}
            onToggle={setNotifications}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="moon-outline"
            label="Tungi rejim"
            toggle
            toggleValue={isDarkMode}
            onToggle={toggleDarkMode}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="language-outline"
            label="Til"
            value={lang === "uz" ? "O'zbekcha" : "Русский"}
            onPress={() => {
              const newLang = lang === "uz" ? "ru" : "uz";
              setLang(newLang);
            }}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="shield-checkmark-outline"
            label="Parolni o'zgartirish"
            onPress={() => {
              setOldPassword("");
              setNewPassword("");
              setConfirmPassword("");
              setShowPasswordModal(true);
            }}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="help-circle-outline"
            label="Yordam"
            onPress={() =>
              Alert.alert(
                "Yordam markazi",
                "Muammo yoki savollar bo'lsa:\n\n📞 +998 71 000 00 00\n📧 support@citymarket.uz\n\nIsh vaqti: 9:00 - 21:00"
              )
            }
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="information-circle-outline"
            label="Ilova haqida"
            value="v1.0.0"
            onPress={() => Alert.alert("City Market", "Versiya 1.0.0\n\nTez va qulay oziq-ovqat yetkazib berish xizmati.")}
          />
        </View>

        <View style={styles.menuCard}>
          <MenuItem icon="log-out-outline" label="Chiqish" color={Colors.error} onPress={handleLogout} />
        </View>

        <Text style={styles.version}>City market v1.0.0</Text>
      </ScrollView>

      <LocationPicker visible={showLocationPicker} onClose={() => setShowLocationPicker(false)} />

      {/* Edit Name Modal */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowEditModal(false)}>
            <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Ismni tahrirlash</Text>
              <TextInput
                style={styles.modalInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Ismingizni kiriting"
                placeholderTextColor={Colors.textMuted}
                autoFocus
                maxLength={50}
              />
              <View style={styles.modalButtons}>
                <Pressable style={styles.modalCancelBtn} onPress={() => setShowEditModal(false)}>
                  <Text style={styles.modalCancelText}>Bekor qilish</Text>
                </Pressable>
                <Pressable style={[styles.modalSaveBtn, savingName && { opacity: 0.6 }]} onPress={handleSaveName} disabled={savingName}>
                  <Text style={styles.modalSaveText}>{savingName ? "Saqlanmoqda..." : "Saqlash"}</Text>
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
            <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Parolni o'zgartirish</Text>
              <TextInput
                style={styles.modalInput}
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="Eski parol"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
                autoFocus
              />
              <TextInput
                style={[styles.modalInput, { marginTop: 10 }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Yangi parol"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
              />
              <TextInput
                style={[styles.modalInput, { marginTop: 10 }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Yangi parolni tasdiqlang"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
              />
              <View style={styles.modalButtons}>
                <Pressable style={styles.modalCancelBtn} onPress={() => setShowPasswordModal(false)}>
                  <Text style={styles.modalCancelText}>Bekor qilish</Text>
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

const getStyles = (isDarkMode: boolean) => {
  const Colors = getColors(isDarkMode);
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { paddingHorizontal: 16 },
    title: { fontFamily: "Poppins_700Bold", fontSize: 26, color: Colors.text, marginBottom: 20 },
    profileCard: {
      backgroundColor: Colors.card, borderRadius: 20, padding: 16,
      flexDirection: "row", alignItems: "center", marginBottom: 16,
      shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, gap: 14,
    },
    avatarContainer: {
      width: 64, height: 64, backgroundColor: Colors.primary,
      borderRadius: 20, alignItems: "center", justifyContent: "center",
    },
    avatarInitial: {
      fontFamily: "Poppins_700Bold",
      fontSize: 26,
      color: "#fff",
    },
    profileInfo: { flex: 1, gap: 3 },
    profileName: { fontFamily: "Poppins_700Bold", fontSize: 17, color: Colors.text },
    profilePhone: { fontFamily: "Poppins_400Regular", fontSize: 13, color: Colors.textSecondary },
    profileBadge: {
      flexDirection: "row", alignItems: "center", gap: 4,
      backgroundColor: "#FFFBEB", paddingHorizontal: 8, paddingVertical: 3,
      borderRadius: 8, alignSelf: "flex-start",
    },
    profileBadgeText: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: "#F59E0B" },
    editBtn: {
      width: 36, height: 36, backgroundColor: Colors.primaryLight,
      borderRadius: 11, alignItems: "center", justifyContent: "center",
    },
    statsRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
    statCard: {
      flex: 1, backgroundColor: Colors.card, borderRadius: 16, padding: 14,
      alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    statCardCenter: { backgroundColor: Colors.primary },
    statValue: { fontFamily: "Poppins_700Bold", fontSize: 22, color: Colors.text },
    statValueLight: { color: "#fff" },
    statLabel: { fontFamily: "Poppins_400Regular", fontSize: 12, color: Colors.textSecondary },
    statLabelLight: { color: "rgba(255,255,255,0.8)" },
    sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: 17, color: Colors.text, marginBottom: 12, marginTop: 8 },
    orderCard: {
      backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 10,
      shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, gap: 8,
    },
    orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    orderId: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: Colors.text },
    orderStatusBadge: {
      flexDirection: "row", alignItems: "center", gap: 4,
      backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    },
    orderStatus: { fontFamily: "Poppins_500Medium", fontSize: 12, color: Colors.primary },
    orderDetails: { flexDirection: "row", alignItems: "center", gap: 6 },
    orderDate: { fontFamily: "Poppins_400Regular", fontSize: 13, color: Colors.textSecondary },
    orderDot: { color: Colors.textMuted },
    orderItems: { fontFamily: "Poppins_400Regular", fontSize: 13, color: Colors.textSecondary },
    orderFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    orderTotal: { fontFamily: "Poppins_700Bold", fontSize: 15, color: Colors.text },
    reorderBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.primary },
    reorderBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: Colors.primary },
    adminCard: {
      backgroundColor: Colors.primary, borderRadius: 20, padding: 16,
      flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10,
      shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
    },
    courierCard: {
      backgroundColor: "#3B82F6", borderRadius: 20, padding: 16,
      flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10,
      shadowColor: "#3B82F6", shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
    },
    adminCardLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
    adminIconContainer: {
      width: 44, height: 44, backgroundColor: "rgba(255,255,255,0.2)",
      borderRadius: 14, alignItems: "center", justifyContent: "center",
    },
    adminCardTitle: { fontFamily: "Poppins_700Bold", fontSize: 16, color: "#fff" },
    adminCardSub: { fontFamily: "Poppins_400Regular", fontSize: 12, color: "rgba(255,255,255,0.8)" },
    menuCard: {
      backgroundColor: Colors.card, borderRadius: 18, overflow: "hidden",
      marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    menuItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
    menuIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
    menuLabel: { flex: 1, fontFamily: "Poppins_500Medium", fontSize: 15, color: Colors.text },
    menuValue: { fontFamily: "Poppins_400Regular", fontSize: 14, color: Colors.textSecondary },
    menuDivider: { height: 1, backgroundColor: Colors.divider, marginLeft: 64 },
    version: { fontFamily: "Poppins_400Regular", fontSize: 12, color: Colors.textMuted, textAlign: "center", marginTop: 8, marginBottom: 8 },
    emptyOrders: { backgroundColor: Colors.card, borderRadius: 16, padding: 24, alignItems: "center", marginBottom: 16 },
    emptyOrdersText: { fontFamily: "Poppins_400Regular", fontSize: 14, color: Colors.textMuted },
    viewAllButton: {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      backgroundColor: Colors.primary + "10", padding: 16, borderRadius: 12,
      marginTop: 12, borderWidth: 1, borderColor: Colors.primary + "30",
    },
    viewAllButtonText: { fontFamily: "Poppins_600SemiBold", color: Colors.primary, fontSize: 14, marginRight: 8 },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    modalSheet: {
      backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 24, paddingBottom: 40,
    },
    modalHandle: { width: 40, height: 4, backgroundColor: Colors.divider, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
    modalTitle: { fontFamily: "Poppins_700Bold", fontSize: 18, color: Colors.text, marginBottom: 16 },
    modalInput: {
      backgroundColor: Colors.background, borderRadius: 12, paddingHorizontal: 16,
      paddingVertical: 14, fontFamily: "Poppins_400Regular", fontSize: 15, color: Colors.text,
      borderWidth: 1, borderColor: Colors.divider,
    },
    modalButtons: { flexDirection: "row", gap: 12, marginTop: 20 },
    modalCancelBtn: {
      flex: 1, paddingVertical: 14, borderRadius: 12,
      borderWidth: 1.5, borderColor: Colors.divider, alignItems: "center",
    },
    modalCancelText: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: Colors.textSecondary },
    modalSaveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.primary, alignItems: "center" },
    modalSaveText: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: "#fff" },
  });
};
