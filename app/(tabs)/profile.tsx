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
  Linking,
  Image,
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

/* ─── helpers ─── */
const APP_VERSION = "1.0.0";
const APP_BUILD = "2025.07";

/* ─── Payment Modal ─── */
function PaymentModal({ visible, onClose, isDarkMode }: { visible: boolean; onClose: () => void; isDarkMode: boolean }) {
  const Colors = getColors(isDarkMode);
  const [selected, setSelected] = useState("cash");

  const methods = [
    { id: "cash", icon: "cash-outline", label: "Naqd pul", sub: "Yetkazib berilganda to'lash", color: "#16A34A", available: true },
    { id: "payme", icon: "phone-portrait-outline", label: "Payme", sub: "Tez orada", color: "#00AAFF", available: false },
    { id: "click", icon: "flash-outline", label: "Click", sub: "Tez orada", color: "#F97316", available: false },
    { id: "uzcard", icon: "card-outline", label: "Uzcard / Humo", sub: "Tez orada", color: "#8B5CF6", available: false },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={mStyles.overlay} onPress={onClose}>
        <Pressable
          style={[mStyles.sheet, { backgroundColor: isDarkMode ? "#1C1C1E" : "#FFFFFF" }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={mStyles.handle} />
          <View style={mStyles.sheetHeader}>
            <View style={[mStyles.sheetIconWrap, { backgroundColor: "rgba(22,163,74,0.12)" }]}>
              <Ionicons name="card-outline" size={22} color="#16A34A" />
            </View>
            <View>
              <Text style={[mStyles.sheetTitle, { color: Colors.text }]}>To'lov usullari</Text>
              <Text style={[mStyles.sheetSub, { color: Colors.textSecondary }]}>To'lov turini tanlang</Text>
            </View>
          </View>

          <View style={{ gap: 10, marginTop: 4 }}>
            {methods.map((m) => (
              <Pressable
                key={m.id}
                style={[
                  mStyles.payRow,
                  {
                    backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                    borderColor: selected === m.id ? m.color : isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
                    borderWidth: selected === m.id ? 1.5 : 1,
                    opacity: m.available ? 1 : 0.5,
                  },
                ]}
                onPress={() => m.available && setSelected(m.id)}
              >
                <View style={[mStyles.payIconWrap, { backgroundColor: m.color + "18" }]}>
                  <Ionicons name={m.icon as any} size={20} color={m.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[mStyles.payLabel, { color: Colors.text }]}>{m.label}</Text>
                  <Text style={[mStyles.paySub, { color: Colors.textSecondary }]}>{m.sub}</Text>
                </View>
                {m.available ? (
                  <View style={[mStyles.radio, { borderColor: m.color }]}>
                    {selected === m.id && <View style={[mStyles.radioDot, { backgroundColor: m.color }]} />}
                  </View>
                ) : (
                  <View style={[mStyles.soonBadge, { backgroundColor: "rgba(0,0,0,0.06)" }]}>
                    <Text style={[mStyles.soonText, { color: Colors.textMuted }]}>Tez orada</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>

          <Pressable style={[mStyles.actionBtn, { backgroundColor: "#16A34A", marginTop: 20 }]} onPress={onClose}>
            <Text style={mStyles.actionBtnText}>Saqlash</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ─── Language Modal ─── */
function LanguageModal({ visible, onClose, lang, setLang, isDarkMode }: {
  visible: boolean; onClose: () => void;
  lang: string; setLang: (l: string) => void; isDarkMode: boolean;
}) {
  const Colors = getColors(isDarkMode);
  const langs = [
    { id: "uz", flag: "🇺🇿", label: "O'zbekcha", sub: "O'zbek tili" },
    { id: "ru", flag: "🇷🇺", label: "Русский", sub: "Rus tili" },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={mStyles.overlay} onPress={onClose}>
        <Pressable
          style={[mStyles.sheet, { backgroundColor: isDarkMode ? "#1C1C1E" : "#FFFFFF" }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={mStyles.handle} />
          <View style={mStyles.sheetHeader}>
            <View style={[mStyles.sheetIconWrap, { backgroundColor: "rgba(99,102,241,0.12)" }]}>
              <Ionicons name="language-outline" size={22} color="#6366F1" />
            </View>
            <View>
              <Text style={[mStyles.sheetTitle, { color: Colors.text }]}>Til tanlash</Text>
              <Text style={[mStyles.sheetSub, { color: Colors.textSecondary }]}>Ilova tilini o'zgartiring</Text>
            </View>
          </View>

          <View style={{ gap: 10, marginTop: 4 }}>
            {langs.map((l) => (
              <Pressable
                key={l.id}
                style={[
                  mStyles.payRow,
                  {
                    backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                    borderColor: lang === l.id ? "#6366F1" : isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
                    borderWidth: lang === l.id ? 1.5 : 1,
                  },
                ]}
                onPress={() => { setLang(l.id); onClose(); }}
              >
                <Text style={{ fontSize: 30 }}>{l.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[mStyles.payLabel, { color: Colors.text }]}>{l.label}</Text>
                  <Text style={[mStyles.paySub, { color: Colors.textSecondary }]}>{l.sub}</Text>
                </View>
                <View style={[mStyles.radio, { borderColor: "#6366F1" }]}>
                  {lang === l.id && <View style={[mStyles.radioDot, { backgroundColor: "#6366F1" }]} />}
                </View>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ─── Help Modal ─── */
function HelpModal({ visible, onClose, isDarkMode }: { visible: boolean; onClose: () => void; isDarkMode: boolean }) {
  const Colors = getColors(isDarkMode);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const contacts = [
    { icon: "call-outline", label: "Telefon", value: "+998 71 000 00 00", color: "#16A34A", action: () => Linking.openURL("tel:+998710000000").catch(() => {}) },
    { icon: "mail-outline", label: "Email", value: "support@citymarket.uz", color: "#3B82F6", action: () => Linking.openURL("mailto:support@citymarket.uz").catch(() => {}) },
    { icon: "logo-telegram", label: "Telegram", value: "@citymarket_uz", color: "#2AABEE", action: () => Linking.openURL("https://t.me/citymarket_uz").catch(() => {}) },
  ];

  const faqs = [
    { q: "Yetkazib berish qancha vaqt oladi?", a: "Odatda 30-60 daqiqa ichida yetkazib beramiz. Trafik va buyurtmalar soniga qarab bu vaqt o'zgarishi mumkin." },
    { q: "Minimal buyurtma summasi bormi?", a: "Minimal buyurtma summasi 30,000 so'm. Undan past bo'lsa buyurtma rasmiylashtirilmaydi." },
    { q: "Buyurtmani bekor qilish mumkinmi?", a: "Ha, buyurtma 'Tayyorlanmoqda' holatiga o'tmaguncha bekor qilish mumkin. Profildagi buyurtmalar bo'limidan bekor qiling." },
    { q: "To'lov qanday amalga oshiriladi?", a: "Hozircha faqat naqd pul to'lovi mavjud. Kuryer yetkazib bergandan so'ng to'laysiz. Online to'lov tez orada qo'shiladi." },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={mStyles.overlay} onPress={onClose}>
        <Pressable
          style={[mStyles.sheetTall, { backgroundColor: isDarkMode ? "#1C1C1E" : "#FFFFFF" }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={mStyles.handle} />
          <View style={mStyles.sheetHeader}>
            <View style={[mStyles.sheetIconWrap, { backgroundColor: "rgba(59,130,246,0.12)" }]}>
              <Ionicons name="help-buoy-outline" size={22} color="#3B82F6" />
            </View>
            <View>
              <Text style={[mStyles.sheetTitle, { color: Colors.text }]}>Yordam markazi</Text>
              <Text style={[mStyles.sheetSub, { color: Colors.textSecondary }]}>9:00 – 21:00, har kuni</Text>
            </View>
          </View>

          <Text style={[mStyles.sectionLabel, { color: Colors.textSecondary }]}>Bog'lanish</Text>
          <View style={{ gap: 8, marginBottom: 18 }}>
            {contacts.map((c) => (
              <Pressable
                key={c.label}
                style={[mStyles.contactRow, {
                  backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                  borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
                }]}
                onPress={c.action}
              >
                <View style={[mStyles.payIconWrap, { backgroundColor: c.color + "18" }]}>
                  <Ionicons name={c.icon as any} size={18} color={c.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[mStyles.paySub, { color: Colors.textSecondary }]}>{c.label}</Text>
                  <Text style={[mStyles.payLabel, { color: Colors.text }]}>{c.value}</Text>
                </View>
                <Ionicons name="open-outline" size={15} color={Colors.textMuted} />
              </Pressable>
            ))}
          </View>

          <Text style={[mStyles.sectionLabel, { color: Colors.textSecondary }]}>Ko'p so'raladigan savollar</Text>
          <View style={{ gap: 8 }}>
            {faqs.map((f, i) => {
              const isOpen = openFaq === i;
              return (
                <Pressable
                  key={i}
                  style={[mStyles.faqCard, {
                    backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                    borderColor: isOpen ? "#3B82F6" : (isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"),
                    borderWidth: isOpen ? 1.5 : 1,
                  }]}
                  onPress={() => setOpenFaq(isOpen ? null : i)}
                >
                  <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                    <View style={[mStyles.faqNum, { backgroundColor: isOpen ? "rgba(59,130,246,0.15)" : "rgba(59,130,246,0.08)" }]}>
                      <Text style={{ color: "#3B82F6", fontFamily: "Poppins_700Bold", fontSize: 11 }}>{i + 1}</Text>
                    </View>
                    <Text style={[mStyles.faqQ, { color: Colors.text, flex: 1 }]}>{f.q}</Text>
                    <Ionicons
                      name={isOpen ? "chevron-up" : "chevron-down"}
                      size={16}
                      color={isOpen ? "#3B82F6" : Colors.textMuted}
                    />
                  </View>
                  {isOpen && (
                    <Text style={[mStyles.faqA, { color: Colors.textSecondary, marginTop: 8, paddingLeft: 32 }]}>
                      {f.a}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ─── About Modal ─── */
function AboutModal({ visible, onClose, isDarkMode }: { visible: boolean; onClose: () => void; isDarkMode: boolean }) {
  const Colors = getColors(isDarkMode);

  const info = [
    { label: "Versiya", value: `v${APP_VERSION}` },
    { label: "Chiqarilgan", value: APP_BUILD },
    { label: "Tuzuvchi", value: "City Market Team" },
    { label: "Mintaqa", value: "O'zbekiston" },
  ];

  const links = [
    { icon: "document-text-outline", label: "Foydalanish shartlari", color: "#6366F1", url: "https://citymarket.uz/terms" },
    { icon: "shield-outline", label: "Maxfiylik siyosati", color: "#3B82F6", url: "https://citymarket.uz/privacy" },
    { icon: "star-outline", label: "Ilovani baholash", color: "#F59E0B", url: "https://play.google.com/store" },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={mStyles.overlay} onPress={onClose}>
        <Pressable
          style={[mStyles.sheetTall, { backgroundColor: isDarkMode ? "#1C1C1E" : "#FFFFFF" }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={mStyles.handle} />

          {/* App logo block */}
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <LinearGradient
              colors={["#16A34A", "#15803D"]}
              style={mStyles.aboutLogo}
            >
              <Ionicons name="storefront" size={36} color="#fff" />
            </LinearGradient>
            <Text style={[mStyles.aboutAppName, { color: Colors.text }]}>City Market</Text>
            <Text style={[mStyles.aboutTagline, { color: Colors.textSecondary }]}>Tez va qulay yetkazib berish</Text>
            <View style={mStyles.verBadge}>
              <Text style={mStyles.verBadgeText}>v{APP_VERSION}</Text>
            </View>
          </View>

          {/* Info grid */}
          <View style={[mStyles.infoGrid, {
            backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
            borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
          }]}>
            {info.map((item, i) => (
              <View key={item.label} style={[
                mStyles.infoRow,
                i < info.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDarkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }
              ]}>
                <Text style={[mStyles.infoLabel, { color: Colors.textSecondary }]}>{item.label}</Text>
                <Text style={[mStyles.infoValue, { color: Colors.text }]}>{item.value}</Text>
              </View>
            ))}
          </View>

          {/* Links */}
          <View style={{ gap: 8, marginTop: 14 }}>
            {links.map((l) => (
              <Pressable
                key={l.label}
                style={[mStyles.contactRow, {
                  backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                  borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
                }]}
                onPress={() => Linking.openURL(l.url).catch(() => {})}
              >
                <View style={[mStyles.payIconWrap, { backgroundColor: l.color + "18" }]}>
                  <Ionicons name={l.icon as any} size={18} color={l.color} />
                </View>
                <Text style={[mStyles.payLabel, { color: Colors.text, flex: 1 }]}>{l.label}</Text>
                <Ionicons name="open-outline" size={15} color={Colors.textMuted} />
              </Pressable>
            ))}
          </View>

          <Text style={[mStyles.copyright, { color: Colors.textMuted }]}>
            © {new Date().getFullYear()} City Market. Barcha huquqlar himoyalangan.
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ─── MenuItem ─── */
function MenuItem({
  icon, label, value, onPress, danger, toggle, toggleValue, onToggle, isDarkMode, iconBg, iconColor,
}: {
  icon: string; label: string; value?: string; onPress?: () => void;
  danger?: boolean; toggle?: boolean; toggleValue?: boolean;
  onToggle?: (v: boolean) => void; isDarkMode: boolean;
  iconBg?: string; iconColor?: string;
}) {
  const Colors = getColors(isDarkMode);
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const ic = danger ? "#EF4444" : iconColor ?? "#16A34A";
  const bg = danger ? "rgba(239,68,68,0.1)" : iconBg ?? "rgba(22,163,74,0.1)";

  return (
    <Animated.View style={anim}>
      <Pressable
        style={styles.menuItem}
        onPress={onPress}
        onPressIn={() => { if (!toggle) scale.value = withSpring(0.97, { damping: 12 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
      >
        <View style={[styles.menuIconWrap, { backgroundColor: bg }]}>
          <Ionicons name={icon as any} size={18} color={ic} />
        </View>
        <Text style={[styles.menuLabel, { color: danger ? "#EF4444" : Colors.text }]}>{label}</Text>
        {toggle ? (
          <Switch
            value={toggleValue}
            onValueChange={onToggle}
            trackColor={{ true: ic, false: isDarkMode ? "#3f3f46" : "#E5E7EB" }}
            thumbColor="#fff"
          />
        ) : (
          <View style={styles.menuRight}>
            {value && <Text style={[styles.menuValue, { color: Colors.textMuted }]}>{value}</Text>}
            {!danger && <Ionicons name="chevron-forward" size={15} color={Colors.textMuted} />}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

/* ─── Main Screen ─── */
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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const [editName, setEditName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (!user) { router.replace("/auth"); return null; }

  const userOrders = orders || [];
  const cartItemCount = (items || []).reduce((s: number, i: any) => s + (i?.quantity || 0), 0);

  const handleLogout = () => {
    Alert.alert("Chiqish", "Tizimdan chiqmoqchimisiz?", [
      { text: "Yo'q", style: "cancel" },
      { text: "Ha", style: "destructive", onPress: async () => { await logout(); router.replace("/auth"); } },
    ]);
  };

  const handleSaveName = async () => {
    if (!editName.trim()) { Alert.alert("Xatolik", "Ism bo'sh bo'lishi mumkin emas"); return; }
    setSavingName(true);
    try {
      await updateProfile(editName.trim());
      setShowEditModal(false);
      Alert.alert("Muvaffaqiyat", "Ismingiz yangilandi");
    } catch { Alert.alert("Xatolik", "Ismni yangilashda xatolik"); }
    finally { setSavingName(false); }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Xatolik", "Barcha maydonlarni to'ldiring"); return;
    }
    if (newPassword !== confirmPassword) { Alert.alert("Xatolik", "Yangi parollar mos kelmaydi"); return; }
    if (newPassword.length < 6) { Alert.alert("Xatolik", "Parol kamida 6 ta belgidan iborat bo'lishi kerak"); return; }
    setSavingPassword(true);
    try {
      await apiRequest("PATCH", "/api/password", { oldPassword, newPassword });
      setShowPasswordModal(false);
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
      Alert.alert("Muvaffaqiyat", "Parolingiz muvaffaqiyatli o'zgartirildi");
    } catch { Alert.alert("Xatolik", "Parolni o'zgartirishda xatolik"); }
    finally { setSavingPassword(false); }
  };

  const getStatusLabel = (s: string) => ({
    pending: "Kutilmoqda", confirmed: "Tasdiqlandi", preparing: "Tayyorlanmoqda",
    ready: "Tayyor", delivering: "Yo'lda", delivered: "Yetkazildi", cancelled: "Bekor qilindi",
  }[s] ?? s);

  const getStatusColor = (s: string) => s === "delivered" ? "#16A34A" : s === "cancelled" ? "#EF4444" : "#F59E0B";

  const bgGrad: [string, string, string] = isDarkMode
    ? ["#0a1f12", "#0f0f12", "#0C0C0E"]
    : ["#d4ede0", "#eaf4ee", "#F5F6F5"];

  const glass = {
    backgroundColor: isDarkMode ? "rgba(28,28,30,0.72)" : "rgba(255,255,255,0.82)",
    borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.92)",
  };

  const initials = (user.name || "U").charAt(0).toUpperCase();
  const locationLabel = location?.address
    ? (location.address.length > 22 ? location.address.slice(0, 22) + "…" : location.address)
    : "Tanlanmagan";

  return (
    <>
      <View style={{ flex: 1 }}>
        <LinearGradient colors={bgGrad} locations={[0, 0.3, 1]} style={StyleSheet.absoluteFill} />

        {/* Decorative blobs */}
        <View style={[styles.blobTR, { backgroundColor: isDarkMode ? "rgba(22,163,74,0.06)" : "rgba(22,163,74,0.10)" }]} />
        <View style={[styles.blobBL, { backgroundColor: isDarkMode ? "rgba(99,102,241,0.05)" : "rgba(99,102,241,0.07)" }]} />

        <ScrollView
          style={{ backgroundColor: "transparent" }}
          contentContainerStyle={[styles.content, { paddingTop: topPad + 8, paddingBottom: Platform.OS === "web" ? 40 : 110 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={styles.pageHeader}>
            <Text style={[styles.pageTitle, { color: Colors.text }]}>Profil</Text>
            <Pressable
              style={[styles.headerIconBtn, {
                backgroundColor: isDarkMode ? "rgba(28,28,30,0.75)" : "rgba(255,255,255,0.8)",
                borderColor: isDarkMode ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.9)",
              }]}
              onPress={() => { setEditName(user.name || ""); setShowEditModal(true); }}
            >
              <Ionicons name="create-outline" size={18} color="#16A34A" />
            </Pressable>
          </View>

          {/* ── Profile Hero ── */}
          <View style={[styles.heroCard, glass]}>
            <LinearGradient
              colors={isDarkMode ? ["#16A34A18", "transparent"] : ["#16A34A0D", "transparent"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 26 }]}
            />
            <View style={styles.heroTop}>
              {/* Avatar */}
              <View style={styles.avatarGroup}>
                <LinearGradient colors={["#22C55E", "#15803D"]} style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </LinearGradient>
                <View style={[styles.onlineDot, { borderColor: isDarkMode ? "#1C1C1E" : "#fff" }]} />
              </View>

              {/* Info */}
              <View style={{ flex: 1 }}>
                <Text style={[styles.heroName, { color: Colors.text }]}>{user.name}</Text>
                <View style={styles.heroPhoneRow}>
                  <Ionicons name="call-outline" size={13} color={Colors.textSecondary} />
                  <Text style={[styles.heroPhone, { color: Colors.textSecondary }]}>{user.phoneNumber}</Text>
                </View>
                <View style={styles.roleBadge}>
                  <Ionicons name="star" size={10} color="#F59E0B" />
                  <Text style={styles.roleBadgeText}>
                    {user.role === "admin" ? "Admin" : user.role === "courier" ? "Kuryer" : "Mijoz"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Stats bar */}
            <View style={[styles.statsBar, { borderTopColor: isDarkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }]}>
              {[
                { icon: "receipt-outline", label: "Buyurtma", value: userOrders.length, color: "#16A34A" },
                { icon: "bag-outline", label: "Savatda", value: cartItemCount, color: "#F97316" },
                { icon: "star-outline", label: "Ballar", value: 0, color: "#F59E0B" },
              ].map((s, i) => (
                <React.Fragment key={s.label}>
                  {i > 0 && <View style={[styles.statDiv, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }]} />}
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                    <Text style={[styles.statLabel, { color: Colors.textSecondary }]}>{s.label}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* ── Role Cards ── */}
          {user.role === "courier" && (
            <Pressable style={[styles.roleCard, { backgroundColor: "#3B82F6", shadowColor: "#3B82F6" }]} onPress={() => router.push("/courier")}>
              <View style={styles.roleCardLeft}>
                <View style={styles.roleCardIcon}><Ionicons name="bicycle" size={22} color="#fff" /></View>
                <View><Text style={styles.roleCardTitle}>Kuryer paneli</Text><Text style={styles.roleCardSub}>Buyurtmalarni yetkazib berish</Text></View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
            </Pressable>
          )}
          {user.role === "admin" && (
            <Pressable style={[styles.roleCard, { backgroundColor: "#16A34A", shadowColor: "#16A34A" }]} onPress={() => router.push("/admin")}>
              <View style={styles.roleCardLeft}>
                <View style={styles.roleCardIcon}><Ionicons name="shield-checkmark" size={22} color="#fff" /></View>
                <View><Text style={styles.roleCardTitle}>Admin Panel</Text><Text style={styles.roleCardSub}>Boshqaruv markazi</Text></View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
            </Pressable>
          )}

          {/* ── Recent Orders ── */}
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: Colors.text }]}>So'nggi buyurtmalar</Text>
            {userOrders.length > 0 && (
              <Pressable onPress={() => router.push("/orders")}>
                <Text style={styles.seeAll}>Barchasi</Text>
              </Pressable>
            )}
          </View>

          {userOrders.length === 0 ? (
            <View style={[styles.emptyCard, glass]}>
              <View style={[styles.emptyIconBox, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(22,163,74,0.08)" }]}>
                <Ionicons name="receipt-outline" size={26} color={Colors.textMuted} />
              </View>
              <View>
                <Text style={[styles.emptyTitle, { color: Colors.text }]}>Buyurtmalar yo'q</Text>
                <Text style={[styles.emptySub, { color: Colors.textSecondary }]}>Birinchi buyurtmangizni bering</Text>
              </View>
              <Pressable style={styles.shopBtn} onPress={() => router.push("/(tabs)/")}>
                <Ionicons name="bag-add-outline" size={16} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <>
              {userOrders.slice(0, 3).map((order) => (
                <Pressable key={order.id} style={[styles.orderCard, glass]} onPress={() => router.push(`/order/${order.id}`)}>
                  <View style={styles.orderTop}>
                    <View style={styles.orderIdRow}>
                      <View style={[styles.orderDot, { backgroundColor: getStatusColor(order.status) }]} />
                      <Text style={[styles.orderId, { color: Colors.text }]}>#{order.id.slice(-6).toUpperCase()}</Text>
                    </View>
                    <View style={[styles.orderBadge, { backgroundColor: getStatusColor(order.status) + "18" }]}>
                      <Text style={[styles.orderBadgeText, { color: getStatusColor(order.status) }]}>{getStatusLabel(order.status)}</Text>
                    </View>
                  </View>
                  <View style={styles.orderMeta}>
                    <Text style={[styles.orderMetaText, { color: Colors.textSecondary }]}>
                      {new Date(order.createdAt).toLocaleDateString("uz-UZ")}
                    </Text>
                    <Text style={[styles.orderMetaText, { color: Colors.textMuted }]}> · </Text>
                    <Text style={[styles.orderMetaText, { color: Colors.textSecondary }]}>
                      {((order.items as any[]) ?? []).length} ta mahsulot
                    </Text>
                  </View>
                  <View style={styles.orderBottom}>
                    <Text style={[styles.orderTotal, { color: Colors.text }]}>{formatPrice(order.total)}</Text>
                    <View style={styles.trackBtn}>
                      <Text style={styles.trackBtnText}>Kuzatish</Text>
                      <Ionicons name="arrow-forward" size={13} color="#16A34A" />
                    </View>
                  </View>
                </Pressable>
              ))}
            </>
          )}

          {/* ── Settings: Hisob ── */}
          <Text style={[styles.sectionTitle, { color: Colors.text, marginTop: 20 }]}>Hisob</Text>
          <View style={[styles.menuCard, glass]}>
            <MenuItem
              icon="location-outline" label="Manzil" value={locationLabel}
              onPress={() => setShowLocationPicker(true)}
              iconBg="rgba(239,68,68,0.1)" iconColor="#EF4444"
              isDarkMode={isDarkMode}
            />
            <Divider isDarkMode={isDarkMode} />
            <MenuItem
              icon="card-outline" label="To'lov usullari" value="Naqd pul"
              onPress={() => setShowPaymentModal(true)}
              iconBg="rgba(22,163,74,0.1)" iconColor="#16A34A"
              isDarkMode={isDarkMode}
            />
            <Divider isDarkMode={isDarkMode} />
            <MenuItem
              icon="lock-closed-outline" label="Parolni o'zgartirish"
              onPress={() => { setOldPassword(""); setNewPassword(""); setConfirmPassword(""); setShowPasswordModal(true); }}
              iconBg="rgba(99,102,241,0.1)" iconColor="#6366F1"
              isDarkMode={isDarkMode}
            />
          </View>

          {/* ── Settings: Ilova ── */}
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Ilova sozlamalari</Text>
          <View style={[styles.menuCard, glass]}>
            <MenuItem
              icon="notifications-outline" label="Bildirishnomalar"
              toggle toggleValue={notifications} onToggle={setNotifications}
              iconBg="rgba(249,115,22,0.1)" iconColor="#F97316"
              isDarkMode={isDarkMode}
            />
            <Divider isDarkMode={isDarkMode} />
            <MenuItem
              icon="moon-outline" label="Tungi rejim"
              toggle toggleValue={isDarkMode} onToggle={toggleDarkMode}
              iconBg="rgba(99,102,241,0.1)" iconColor="#6366F1"
              isDarkMode={isDarkMode}
            />
            <Divider isDarkMode={isDarkMode} />
            <MenuItem
              icon="language-outline" label="Til"
              value={lang === "uz" ? "🇺🇿  O'zbekcha" : "🇷🇺  Русский"}
              onPress={() => setShowLangModal(true)}
              iconBg="rgba(139,92,246,0.1)" iconColor="#8B5CF6"
              isDarkMode={isDarkMode}
            />
          </View>

          {/* ── Settings: Qo'llab ── */}
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Qo'llab-quvvatlash</Text>
          <View style={[styles.menuCard, glass]}>
            <MenuItem
              icon="help-buoy-outline" label="Yordam markazi"
              onPress={() => setShowHelpModal(true)}
              iconBg="rgba(59,130,246,0.1)" iconColor="#3B82F6"
              isDarkMode={isDarkMode}
            />
            <Divider isDarkMode={isDarkMode} />
            <MenuItem
              icon="information-circle-outline" label="Ilova haqida" value={`v${APP_VERSION}`}
              onPress={() => setShowAboutModal(true)}
              iconBg="rgba(16,185,129,0.1)" iconColor="#10B981"
              isDarkMode={isDarkMode}
            />
          </View>

          {/* ── Logout ── */}
          <View style={[styles.menuCard, glass]}>
            <MenuItem icon="log-out-outline" label="Chiqish" danger onPress={handleLogout} isDarkMode={isDarkMode} />
          </View>

          <Text style={[styles.versionTag, { color: Colors.textMuted }]}>City Market v{APP_VERSION} · {APP_BUILD}</Text>
        </ScrollView>
      </View>

      {/* ── Location Picker ── */}
      <LocationPicker visible={showLocationPicker} onClose={() => setShowLocationPicker(false)} />

      {/* ── Edit Name Modal ── */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <Pressable style={mStyles.overlay} onPress={() => setShowEditModal(false)}>
            <Pressable style={[mStyles.sheet, { backgroundColor: isDarkMode ? "#1C1C1E" : "#fff" }]} onPress={(e) => e.stopPropagation()}>
              <View style={mStyles.handle} />
              <View style={mStyles.sheetHeader}>
                <View style={[mStyles.sheetIconWrap, { backgroundColor: "rgba(22,163,74,0.12)" }]}>
                  <Ionicons name="person-outline" size={22} color="#16A34A" />
                </View>
                <View>
                  <Text style={[mStyles.sheetTitle, { color: isDarkMode ? "#F4F4F5" : "#111827" }]}>Ismni tahrirlash</Text>
                  <Text style={[mStyles.sheetSub, { color: isDarkMode ? "#A1A1AA" : "#6B7280" }]}>Ism va familiyangizni kiriting</Text>
                </View>
              </View>
              <TextInput
                style={[mStyles.input, {
                  color: isDarkMode ? "#F4F4F5" : "#111827",
                  backgroundColor: isDarkMode ? "#2C2C2E" : "#F5F5F5",
                  borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                }]}
                value={editName} onChangeText={setEditName}
                placeholder="Ismingizni kiriting"
                placeholderTextColor={isDarkMode ? "#71717A" : "#9CA3AF"}
                autoFocus maxLength={50}
              />
              <View style={mStyles.btnRow}>
                <Pressable style={[mStyles.cancelBtn, { borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }]} onPress={() => setShowEditModal(false)}>
                  <Text style={[mStyles.cancelText, { color: isDarkMode ? "#A1A1AA" : "#6B7280" }]}>Bekor</Text>
                </Pressable>
                <Pressable style={[mStyles.actionBtn, { flex: 1, backgroundColor: "#16A34A", opacity: savingName ? 0.6 : 1 }]} onPress={handleSaveName} disabled={savingName}>
                  <Text style={mStyles.actionBtnText}>{savingName ? "Saqlanmoqda…" : "Saqlash"}</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Password Modal ── */}
      <Modal visible={showPasswordModal} transparent animationType="slide" onRequestClose={() => setShowPasswordModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <Pressable style={mStyles.overlay} onPress={() => setShowPasswordModal(false)}>
            <Pressable style={[mStyles.sheet, { backgroundColor: isDarkMode ? "#1C1C1E" : "#fff" }]} onPress={(e) => e.stopPropagation()}>
              <View style={mStyles.handle} />
              <View style={mStyles.sheetHeader}>
                <View style={[mStyles.sheetIconWrap, { backgroundColor: "rgba(99,102,241,0.12)" }]}>
                  <Ionicons name="lock-closed-outline" size={22} color="#6366F1" />
                </View>
                <View>
                  <Text style={[mStyles.sheetTitle, { color: isDarkMode ? "#F4F4F5" : "#111827" }]}>Parolni o'zgartirish</Text>
                  <Text style={[mStyles.sheetSub, { color: isDarkMode ? "#A1A1AA" : "#6B7280" }]}>Kamida 6 ta belgi</Text>
                </View>
              </View>
              {[
                { val: oldPassword, set: setOldPassword, ph: "Eski parol", show: showOld, toggle: () => setShowOld((p) => !p) },
                { val: newPassword, set: setNewPassword, ph: "Yangi parol", show: showNew, toggle: () => setShowNew((p) => !p) },
                { val: confirmPassword, set: setConfirmPassword, ph: "Yangi parolni tasdiqlang", show: showConfirm, toggle: () => setShowConfirm((p) => !p) },
              ].map((field, i) => (
                <View key={i} style={[mStyles.pwdWrap, i > 0 && { marginTop: 10 }]}>
                  <TextInput
                    style={[mStyles.input, {
                      color: isDarkMode ? "#F4F4F5" : "#111827",
                      backgroundColor: isDarkMode ? "#2C2C2E" : "#F5F5F5",
                      borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                      paddingRight: 46,
                    }]}
                    value={field.val} onChangeText={field.set}
                    placeholder={field.ph}
                    placeholderTextColor={isDarkMode ? "#71717A" : "#9CA3AF"}
                    secureTextEntry={!field.show} autoFocus={i === 0}
                  />
                  <Pressable style={mStyles.eyeBtn} onPress={field.toggle}>
                    <Ionicons name={field.show ? "eye-off-outline" : "eye-outline"} size={18} color={isDarkMode ? "#71717A" : "#9CA3AF"} />
                  </Pressable>
                </View>
              ))}
              <View style={mStyles.btnRow}>
                <Pressable style={[mStyles.cancelBtn, { borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }]} onPress={() => setShowPasswordModal(false)}>
                  <Text style={[mStyles.cancelText, { color: isDarkMode ? "#A1A1AA" : "#6B7280" }]}>Bekor</Text>
                </Pressable>
                <Pressable style={[mStyles.actionBtn, { flex: 1, backgroundColor: "#6366F1", opacity: savingPassword ? 0.6 : 1 }]} onPress={handleChangePassword} disabled={savingPassword}>
                  <Text style={mStyles.actionBtnText}>{savingPassword ? "Saqlanmoqda…" : "O'zgartirish"}</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Feature Modals ── */}
      <PaymentModal visible={showPaymentModal} onClose={() => setShowPaymentModal(false)} isDarkMode={isDarkMode} />
      <LanguageModal visible={showLangModal} onClose={() => setShowLangModal(false)} lang={lang} setLang={setLang} isDarkMode={isDarkMode} />
      <HelpModal visible={showHelpModal} onClose={() => setShowHelpModal(false)} isDarkMode={isDarkMode} />
      <AboutModal visible={showAboutModal} onClose={() => setShowAboutModal(false)} isDarkMode={isDarkMode} />
    </>
  );
}

function Divider({ isDarkMode }: { isDarkMode: boolean }) {
  return <View style={[styles.divider, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }]} />;
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  blobTR: { position: "absolute", width: 280, height: 280, borderRadius: 140, top: -80, right: -70 },
  blobBL: { position: "absolute", width: 220, height: 220, borderRadius: 110, bottom: 200, left: -70 },
  content: { paddingHorizontal: 16 },

  pageHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  pageTitle: { fontFamily: "Poppins_700Bold", fontSize: 28 },
  headerIconBtn: {
    width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center",
    borderWidth: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },

  heroCard: {
    borderRadius: 26, borderWidth: 1, marginBottom: 18, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.09, shadowRadius: 18, elevation: 6,
  },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 14, padding: 18, paddingBottom: 14 },
  avatarGroup: { position: "relative" },
  avatar: {
    width: 66, height: 66, borderRadius: 22, alignItems: "center", justifyContent: "center",
    shadowColor: "#16A34A", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
  },
  avatarText: { fontFamily: "Poppins_700Bold", fontSize: 28, color: "#fff" },
  onlineDot: {
    position: "absolute", width: 14, height: 14, borderRadius: 7, backgroundColor: "#22C55E",
    bottom: 2, right: 2, borderWidth: 2,
  },
  heroName: { fontFamily: "Poppins_700Bold", fontSize: 17, marginBottom: 2 },
  heroPhoneRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 6 },
  heroPhone: { fontFamily: "Poppins_400Regular", fontSize: 13 },
  roleBadge: {
    flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start",
    backgroundColor: "#FFFBEB", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  roleBadgeText: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: "#F59E0B" },

  statsBar: {
    flexDirection: "row", borderTopWidth: 1,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  statItem: { flex: 1, alignItems: "center", gap: 2 },
  statDiv: { width: 1, marginVertical: 4 },
  statValue: { fontFamily: "Poppins_700Bold", fontSize: 20 },
  statLabel: { fontFamily: "Poppins_400Regular", fontSize: 11 },

  roleCard: {
    borderRadius: 20, padding: 16, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 12,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 7,
  },
  roleCardLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  roleCardIcon: { width: 44, height: 44, backgroundColor: "rgba(255,255,255,0.22)", borderRadius: 14, alignItems: "center", justifyContent: "center" },
  roleCardTitle: { fontFamily: "Poppins_700Bold", fontSize: 15, color: "#fff" },
  roleCardSub: { fontFamily: "Poppins_400Regular", fontSize: 12, color: "rgba(255,255,255,0.8)" },

  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: 16, marginBottom: 10 },
  seeAll: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "#16A34A" },

  emptyCard: {
    borderRadius: 20, borderWidth: 1, padding: 16, flexDirection: "row", alignItems: "center",
    gap: 14, marginBottom: 4,
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  emptyIconBox: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  emptySub: { fontFamily: "Poppins_400Regular", fontSize: 12 },
  shopBtn: {
    width: 36, height: 36, borderRadius: 11, backgroundColor: "#16A34A",
    alignItems: "center", justifyContent: "center", marginLeft: "auto" as any,
  },

  orderCard: {
    borderRadius: 20, borderWidth: 1, padding: 15, marginBottom: 10, gap: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  orderTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderIdRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  orderDot: { width: 7, height: 7, borderRadius: 3.5 },
  orderId: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  orderBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  orderBadgeText: { fontFamily: "Poppins_600SemiBold", fontSize: 11 },
  orderMeta: { flexDirection: "row", alignItems: "center" },
  orderMetaText: { fontFamily: "Poppins_400Regular", fontSize: 12 },
  orderBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderTotal: { fontFamily: "Poppins_700Bold", fontSize: 15 },
  trackBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(22,163,74,0.1)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
  },
  trackBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: "#16A34A" },

  menuCard: {
    borderRadius: 22, borderWidth: 1, overflow: "hidden", marginBottom: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 14, elevation: 4,
  },
  menuItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  menuIconWrap: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, fontFamily: "Poppins_500Medium", fontSize: 15 },
  menuRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  menuValue: { fontFamily: "Poppins_400Regular", fontSize: 13 },
  divider: { height: 1, marginHorizontal: 16 },
  versionTag: { fontFamily: "Poppins_400Regular", fontSize: 12, textAlign: "center", marginTop: 4, marginBottom: 8 },
});

const mStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 24, paddingBottom: Platform.OS === "ios" ? 44 : 28,
  },
  sheetTall: {
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 24, paddingBottom: Platform.OS === "ios" ? 44 : 28,
    maxHeight: "88%",
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#D1D5DB", alignSelf: "center", marginBottom: 22 },

  sheetHeader: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20 },
  sheetIconWrap: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  sheetTitle: { fontFamily: "Poppins_700Bold", fontSize: 18 },
  sheetSub: { fontFamily: "Poppins_400Regular", fontSize: 13, marginTop: 1 },

  sectionLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 },

  payRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, padding: 14 },
  payIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  payLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  paySub: { fontFamily: "Poppins_400Regular", fontSize: 12, marginTop: 1 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  soonBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  soonText: { fontFamily: "Poppins_500Medium", fontSize: 11 },

  contactRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, padding: 13, borderWidth: 1 },
  faqCard: { borderRadius: 14, padding: 14, gap: 8, borderWidth: 1 },
  faqNum: { width: 22, height: 22, borderRadius: 7, alignItems: "center", justifyContent: "center", marginTop: 1 },
  faqQ: { fontFamily: "Poppins_600SemiBold", fontSize: 13, lineHeight: 18 },
  faqA: { fontFamily: "Poppins_400Regular", fontSize: 12, lineHeight: 17 },

  aboutLogo: {
    width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center",
    marginBottom: 12, shadowColor: "#16A34A", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 7,
  },
  aboutAppName: { fontFamily: "Poppins_700Bold", fontSize: 22, marginBottom: 2 },
  aboutTagline: { fontFamily: "Poppins_400Regular", fontSize: 13, marginBottom: 10 },
  verBadge: { backgroundColor: "rgba(22,163,74,0.12)", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 20 },
  verBadgeText: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: "#16A34A" },
  infoGrid: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  infoLabel: { fontFamily: "Poppins_400Regular", fontSize: 13 },
  infoValue: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  copyright: { fontFamily: "Poppins_400Regular", fontSize: 11, textAlign: "center", marginTop: 20 },

  input: {
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontFamily: "Poppins_400Regular", fontSize: 15, borderWidth: 1, marginBottom: 0,
  },
  pwdWrap: { position: "relative" },
  eyeBtn: { position: "absolute", right: 14, top: 0, bottom: 0, justifyContent: "center" },

  btnRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  cancelBtn: { flex: 0.45, borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  cancelText: { fontFamily: "Poppins_600SemiBold", fontSize: 15 },
  actionBtn: { borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  actionBtnText: { fontFamily: "Poppins_700Bold", fontSize: 15, color: "#fff" },
});
