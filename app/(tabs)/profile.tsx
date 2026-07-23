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
import getColors, { Colors as StaticColors } from "@/constants/colors";
import { useCart } from "@/context/CartContext";
import { useApp } from "@/context/ProductsContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useLocation } from "@/context/LocationContext";
import { LocationPicker } from "@/components/LocationPicker";
import { formatPrice } from "@/constants/data";
import { useTranslation } from "@/lib/I18nProvider";
import { apiRequest } from "@/lib/query-client";
import { requestPushToken, getNotificationPermissionStatus } from "@/lib/push-notifications";

const APP_VERSION = "1.0.0";
const APP_BUILD = "2025.07";

/* ════════════════════════════════════════════
   PAYMENT MODAL
   ════════════════════════════════════════════ */
function PaymentModal({
  visible, onClose, isDarkMode, value, onSave, saving,
}: { visible: boolean; onClose: () => void; isDarkMode: boolean; value: string; onSave: (v: string) => void; saving: boolean }) {
  const C = getColors(isDarkMode);
  const { t } = useTranslation();
  const [selected, setSelected] = useState(value);
  React.useEffect(() => { if (visible) setSelected(value); }, [visible, value]);
  const bg = C.sheetBg;
  const cardBg = C.cardSoftBg;
  const cardBorder = C.inputBorder;

  const methods = [
    {
      id: "cash", icon: "cash-outline", label: t("cash"),
      sub: t("cash_sub"), color: C.primary, available: true,
    },
    {
      id: "payme", icon: "phone-portrait-outline", label: "Payme",
      sub: t("coming_soon"), color: C.payme, available: false,
    },
    {
      id: "click", icon: "flash-outline", label: "Click",
      sub: t("coming_soon"), color: C.accent, available: false,
    },
    {
      id: "uzcard", icon: "card-outline", label: "Uzcard / Humo",
      sub: t("coming_soon"), color: C.purple, available: false,
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={ms.overlay} onPress={onClose}>
        <Pressable style={[ms.sheet, { backgroundColor: bg }]} onPress={e => e.stopPropagation()}>
          <View style={ms.pill} />

          {/* Header */}
          <View style={ms.hdr}>
            <LinearGradient colors={[C.primary, C.primaryGradientEnd]} style={ms.hdrIcon}>
              <Ionicons name="card-outline" size={20} color={C.textInverse} />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={[ms.hdrTitle, { color: C.text }]}>{t("payment_methods_title")}</Text>
              <Text style={[ms.hdrSub, { color: C.textSecondary }]}>{t("payment_methods_sub")}</Text>
            </View>
          </View>

          <View style={{ gap: 10 }}>
            {methods.map(m => {
              const isActive = selected === m.id && m.available;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => m.available && setSelected(m.id)}
                  style={[
                    ms.payCard,
                    {
                      backgroundColor: isActive ? m.color + "12" : cardBg,
                      borderColor: isActive ? m.color : cardBorder,
                      borderWidth: isActive ? 1.5 : 1,
                      opacity: m.available ? 1 : 0.55,
                    },
                  ]}
                >
                  <View style={[ms.payIcon, { backgroundColor: m.color + "1A" }]}>
                    <Ionicons name={m.icon as any} size={20} color={m.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[ms.payTitle, { color: C.text }]}>{m.label}</Text>
                    <Text style={[ms.paySub, { color: C.textSecondary }]}>{m.sub}</Text>
                  </View>
                  {m.available ? (
                    <View style={[ms.radio, { borderColor: isActive ? m.color : cardBorder }]}>
                      {isActive && <View style={[ms.radioDot, { backgroundColor: m.color }]} />}
                    </View>
                  ) : (
                    <View style={[ms.badge, { backgroundColor: C.chipBg }]}>
                      <Text style={[ms.badgeText, { color: C.textMuted }]}>{t("coming_soon_badge")}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={[ms.btn, { backgroundColor: C.primary, marginTop: 20, opacity: saving ? 0.6 : 1 }]}
            onPress={() => onSave(selected)}
            disabled={saving}
          >
            <Ionicons name="checkmark" size={18} color={C.textInverse} />
            <Text style={ms.btnText}>{saving ? t("saving") : t("save")}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ════════════════════════════════════════════
   LANGUAGE MODAL
   ════════════════════════════════════════════ */
function LanguageModal({
  visible, onClose, lang, setLang, isDarkMode,
}: { visible: boolean; onClose: () => void; lang: string; setLang: (l: string) => void; isDarkMode: boolean }) {
  const C = getColors(isDarkMode);
  const { t } = useTranslation();
  const bg = C.sheetBg;
  const cardBg = C.cardSoftBg;
  const cardBorder = C.inputBorder;

  const langs = [
    { id: "uz", flag: "🇺🇿", label: t("lang_uz_full"), desc: t("lang_uz_desc") },
    { id: "ru", flag: "🇷🇺", label: t("lang_ru_full"), desc: t("lang_ru_desc") },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={ms.overlay} onPress={onClose}>
        <Pressable style={[ms.sheet, { backgroundColor: bg }]} onPress={e => e.stopPropagation()}>
          <View style={ms.pill} />

          <View style={ms.hdr}>
            <LinearGradient colors={[C.indigo, C.indigoDark]} style={ms.hdrIcon}>
              <Ionicons name="language-outline" size={20} color={C.textInverse} />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={[ms.hdrTitle, { color: C.text }]}>{t("lang_select_title")}</Text>
              <Text style={[ms.hdrSub, { color: C.textSecondary }]}>{t("lang_select_sub")}</Text>
            </View>
          </View>

          <View style={{ gap: 10 }}>
            {langs.map(l => {
              const active = lang === l.id;
              return (
                <Pressable
                  key={l.id}
                  onPress={() => { setLang(l.id); onClose(); }}
                  style={[
                    ms.langCard,
                    {
                      backgroundColor: active ? "rgba(99,102,241,0.1)" : cardBg,
                      borderColor: active ? C.indigo : cardBorder,
                      borderWidth: active ? 1.5 : 1,
                    },
                  ]}
                >
                  <Text style={ms.langFlag}>{l.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[ms.langName, { color: C.text }]}>{l.label}</Text>
                    <Text style={[ms.langDesc, { color: C.textSecondary }]}>{l.desc}</Text>
                  </View>
                  {active && (
                    <View style={[ms.checkWrap, { backgroundColor: C.indigo }]}>
                      <Ionicons name="checkmark" size={14} color={C.textInverse} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          <View style={[ms.langNote, {
            backgroundColor: isDarkMode ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.07)",
            borderColor: isDarkMode ? "rgba(99,102,241,0.25)" : "rgba(99,102,241,0.2)",
          }]}>
            <Ionicons name="information-circle-outline" size={16} color={C.indigo} />
            <Text style={[ms.langNoteText, { color: C.textSecondary }]}>
              {t("lang_note")}
            </Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ════════════════════════════════════════════
   HELP MODAL
   ════════════════════════════════════════════ */
function HelpModal({
  visible, onClose, isDarkMode,
}: { visible: boolean; onClose: () => void; isDarkMode: boolean }) {
  const C = getColors(isDarkMode);
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const bg = C.sheetBg;
  const cardBg = C.cardSoftBg;
  const cardBorder = C.inputBorder;

  const contacts = [
    { icon: "call", label: t("phone"), value: "+998 97 548 20 20", color: C.primary, url: "tel:+998975482020" },
    { icon: "mail", label: "Email", value: "support@citymarket.uz", color: C.info, url: "mailto:support@citymarket.uz" },
    { icon: "logo-telegram", label: "Telegram", value: "@citymarket_uz", color: C.telegram, url: "https://t.me/citymarket_uz" },
  ];

  const faqs = [
    { q: t("faq_q1"), a: t("faq_a1") },
    { q: t("faq_q2"), a: t("faq_a2") },
    { q: t("faq_q3"), a: t("faq_a3") },
    { q: t("faq_q4"), a: t("faq_a4") },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={ms.overlay} onPress={onClose}>
        <Pressable style={[ms.tallSheet, { backgroundColor: bg }]} onPress={e => e.stopPropagation()}>
          <View style={ms.pill} />

          <View style={ms.hdr}>
            <LinearGradient colors={[C.info, C.infoDark]} style={ms.hdrIcon}>
              <Ionicons name="help-buoy-outline" size={20} color={C.textInverse} />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={[ms.hdrTitle, { color: C.text }]}>{t("help_center_title")}</Text>
              <Text style={[ms.hdrSub, { color: C.textSecondary }]}>{t("help_center_hours")}</Text>
            </View>
          </View>

          {/* Contact cards */}
          <Text style={[ms.secLabel, { color: C.textSecondary }]}>{t("contact_us")}</Text>
          <View style={{ gap: 8, marginBottom: 20 }}>
            {contacts.map(c => (
              <Pressable
                key={c.label}
                style={[ms.contactCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
                onPress={() => Linking.openURL(c.url).catch(() => {})}
              >
                <View style={[ms.contactIcon, { backgroundColor: c.color + "1A" }]}>
                  <Ionicons name={c.icon as any} size={18} color={c.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[ms.contactLabel, { color: C.textSecondary }]}>{c.label}</Text>
                  <Text style={[ms.contactValue, { color: C.text }]}>{c.value}</Text>
                </View>
                <View style={[ms.arrowChip, { backgroundColor: c.color + "15" }]}>
                  <Ionicons name="arrow-forward" size={13} color={c.color} />
                </View>
              </Pressable>
            ))}
          </View>

          {/* FAQ accordion */}
          <Text style={[ms.secLabel, { color: C.textSecondary }]}>{t("faq_title")}</Text>
          <View style={{ gap: 8 }}>
            {faqs.map((f, i) => {
              const open = openFaq === i;
              return (
                <Pressable
                  key={i}
                  style={[
                    ms.faqItem,
                    {
                      backgroundColor: open ? (isDarkMode ? "rgba(59,130,246,0.1)" : "rgba(59,130,246,0.06)") : cardBg,
                      borderColor: open ? C.info : cardBorder,
                      borderWidth: open ? 1.5 : 1,
                    },
                  ]}
                  onPress={() => setOpenFaq(open ? null : i)}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View style={[ms.faqNum, { backgroundColor: open ? "rgba(59,130,246,0.2)" : "rgba(59,130,246,0.1)" }]}>
                      <Text style={{ color: C.info, fontFamily: "Poppins_700Bold", fontSize: 11 }}>{i + 1}</Text>
                    </View>
                    <Text style={[ms.faqQ, { color: C.text, flex: 1 }]}>{f.q}</Text>
                    <View style={[
                      ms.faqChevron,
                      { backgroundColor: open ? "rgba(59,130,246,0.15)" : (C.chipBg) },
                    ]}>
                      <Ionicons name={open ? "chevron-up" : "chevron-down"} size={14} color={open ? C.info : C.textMuted} />
                    </View>
                  </View>
                  {open && (
                    <Text style={[ms.faqA, { color: C.textSecondary, marginTop: 10, paddingLeft: 36 }]}>
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

/* ════════════════════════════════════════════
   ABOUT MODAL
   ════════════════════════════════════════════ */
function AboutModal({
  visible, onClose, isDarkMode,
}: { visible: boolean; onClose: () => void; isDarkMode: boolean }) {
  const C = getColors(isDarkMode);
  const { t } = useTranslation();
  const bg = C.sheetBg;
  const cardBg = C.cardSoftBg;
  const cardBorder = C.inputBorder;

  const infos = [
    { label: t("app_version_label"), value: `v${APP_VERSION}` },
    { label: t("app_release_label"), value: APP_BUILD },
    { label: t("app_developer_label"), value: t("app_developer_value") },
    { label: t("app_region_label"), value: t("app_region_value") },
  ];

  const links = [
    { icon: "document-text-outline", label: t("terms_of_use"), color: C.indigo, url: "https://citymarket.uz/terms" },
    { icon: "shield-checkmark-outline", label: t("privacy_policy"), color: C.info, url: "https://citymarket.uz/privacy" },
    { icon: "star-outline", label: t("rate_app"), color: C.warning, url: "https://play.google.com/store" },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={ms.overlay} onPress={onClose}>
        <Pressable style={[ms.tallSheet, { backgroundColor: bg }]} onPress={e => e.stopPropagation()}>
          <View style={ms.pill} />

          {/* App branding */}
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <LinearGradient
              colors={[C.secondaryGreen, C.primaryGradientEnd]}
              style={ms.aboutLogo}
            >
              <Ionicons name="storefront" size={38} color={C.textInverse} />
            </LinearGradient>
            <Text style={[ms.aboutName, { color: C.text }]}>City Market</Text>
            <Text style={[ms.aboutSlogan, { color: C.textSecondary }]}>{t("hero_subtitle")}</Text>
            <View style={[ms.verChip, { backgroundColor: isDarkMode ? "rgba(22,163,74,0.15)" : "rgba(22,163,74,0.1)" }]}>
              <Ionicons name="code-slash-outline" size={12} color={C.primary} />
              <Text style={ms.verChipText}>v{APP_VERSION} · {APP_BUILD}</Text>
            </View>
          </View>

          {/* Info table */}
          <View style={[ms.infoTable, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {infos.map((item, i) => (
              <View
                key={item.label}
                style={[
                  ms.infoRow,
                  i < infos.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDarkMode ? "rgba(255,255,255,0.07)" : C.indigoBg },
                ]}
              >
                <Text style={[ms.infoKey, { color: C.textSecondary }]}>{item.label}</Text>
                <Text style={[ms.infoVal, { color: C.text }]}>{item.value}</Text>
              </View>
            ))}
          </View>

          {/* Links */}
          <View style={{ gap: 8, marginTop: 14 }}>
            {links.map(l => (
              <Pressable
                key={l.label}
                style={[ms.contactCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
                onPress={() => Linking.openURL(l.url).catch(() => {})}
              >
                <View style={[ms.contactIcon, { backgroundColor: l.color + "1A" }]}>
                  <Ionicons name={l.icon as any} size={18} color={l.color} />
                </View>
                <Text style={[ms.contactValue, { color: C.text, flex: 1 }]}>{l.label}</Text>
                <Ionicons name="open-outline" size={15} color={C.textMuted} />
              </Pressable>
            ))}
          </View>

          <Text style={[ms.copyright, { color: C.textMuted }]}>
            {t("copyright")}
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ════════════════════════════════════════════
   MENU ITEM
   ════════════════════════════════════════════ */
function MenuItem({
  icon, label, value, onPress, danger, toggle, toggleValue, onToggle,
  isDarkMode, iconBg, iconColor,
}: {
  icon: string; label: string; value?: string; onPress?: () => void;
  danger?: boolean; toggle?: boolean; toggleValue?: boolean;
  onToggle?: (v: boolean) => void; isDarkMode: boolean;
  iconBg?: string; iconColor?: string;
}) {
  const C = getColors(isDarkMode);
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const ic = danger ? C.error : iconColor ?? C.primary;
  const bg = danger ? "rgba(239,68,68,0.1)" : iconBg ?? "rgba(22,163,74,0.1)";

  return (
    <Animated.View style={anim}>
      <Pressable
        style={s.menuRow}
        onPress={onPress}
        onPressIn={() => { if (!toggle) scale.value = withSpring(0.975, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
      >
        <View style={[s.menuIcon, { backgroundColor: bg }]}>
          <Ionicons name={icon as any} size={18} color={ic} />
        </View>
        <Text style={[s.menuLabel, { color: danger ? C.error : C.text }]}>{label}</Text>
        {toggle ? (
          <Switch
            value={toggleValue}
            onValueChange={onToggle}
            trackColor={{ true: ic, false: C.switchOffTrack }}
            thumbColor={C.textInverse}
          />
        ) : (
          <View style={s.menuRight}>
            {value && (
              <Text style={[s.menuValue, { color: C.textMuted }]} numberOfLines={1}>{value}</Text>
            )}
            {!danger && (
              <View style={[s.chevronWrap, { backgroundColor: C.chipBg }]}>
                <Ionicons name="chevron-forward" size={13} color={C.textMuted} />
              </View>
            )}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

function Sep({ isDarkMode }: { isDarkMode: boolean }) {
  const C = getColors(isDarkMode);
  return (
    <View style={[s.sep, { backgroundColor: C.chipBg }]} />
  );
}

/* ════════════════════════════════════════════
   MAIN SCREEN
   ════════════════════════════════════════════ */
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, updateProfile, updatePaymentMethod, setNotificationsEnabled, registerPushToken } = useAuth();
  const { items } = useCart();
  const { orders } = useApp();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const C = getColors(isDarkMode);
  const { location } = useLocation();
  const { lang, setLang, t } = useTranslation();

  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
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

  React.useEffect(() => {
    if (!user) return;
    const enabled = (user as any).notificationsEnabled !== false;
    const hasToken = !!(user as any).pushToken;
    if (!enabled || hasToken) return;
    (async () => {
      const status = await getNotificationPermissionStatus();
      if (status !== "granted") return;
      const token = await requestPushToken();
      if (token) { try { await registerPushToken(token); } catch { /* non-fatal */ } }
    })();
  }, [user?.id]);

  if (!user) { router.replace("/auth"); return null; }

  const userOrders = orders || [];
  const cartCount = (items || []).reduce((s: number, i: any) => s + (i?.quantity || 0), 0);
  const initials = (user.name || "U").charAt(0).toUpperCase();
  const paymentLabels: Record<string, string> = {
    cash: t("cash"), payme: "Payme", click: "Click", uzcard: "Uzcard / Humo",
  };
  const paymentMethod = (user as any).preferredPaymentMethod || "cash";
  const paymentLabel = paymentLabels[paymentMethod] ?? t("cash");
  const notificationsEnabled = (user as any).notificationsEnabled !== false;
  const locationLabel = location?.address
    ? (location.address.length > 24 ? location.address.slice(0, 24) + "…" : location.address)
    : t("address_not_selected");

  const handleLogout = () => {
    Alert.alert(t("logout_title"), t("logout_confirm"), [
      { text: t("no"), style: "cancel" },
      { text: t("yes_logout"), style: "destructive", onPress: async () => { await logout(); router.replace("/auth"); } },
    ]);
  };

  const handleSaveName = async () => {
    if (!editName.trim()) { Alert.alert(t("error_title"), t("error_name_empty")); return; }
    setSavingName(true);
    try {
      await updateProfile(editName.trim());
      setShowEditModal(false);
    } catch { Alert.alert(t("error_title"), t("error_name_update")); }
    finally { setSavingName(false); }
  };

  const handleToggleNotifications = async (value: boolean) => {
    setSavingNotifications(true);
    try {
      if (value) {
        const token = await requestPushToken();
        if (!token) {
          Alert.alert(
            t("notif_permission_title"),
            t("notif_permission_msg")
          );
          return;
        }
        await registerPushToken(token);
      }
      await setNotificationsEnabled(value);
    } catch {
      Alert.alert(t("error_title"), t("error_notif_save"));
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert(t("error_title"), t("error_fill_all")); return;
    }
    if (newPassword !== confirmPassword) { Alert.alert(t("error_title"), t("error_new_password_mismatch")); return; }
    if (newPassword.length < 8) { Alert.alert(t("error_title"), t("error_password_min8")); return; }
    setSavingPassword(true);
    try {
      const res = await apiRequest("PATCH", "/api/password", { oldPassword, newPassword });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || t("error_password_change"));
      }
      setShowPasswordModal(false);
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
      Alert.alert(t("success_title"), t("password_changed"));
    } catch (error: any) {
      Alert.alert(t("error_title"), error?.message || t("error_password_change"));
    } finally { setSavingPassword(false); }
  };

  const getStatusLabel = (s: string) =>
    ({ pending: t("status_pending"), confirmed: t("status_confirmed"), preparing: t("status_preparing"),
       ready: t("status_ready"), delivering: t("status_delivering"), delivered: t("status_delivered"), cancelled: t("status_cancelled") }[s] ?? s);

  const getStatusColor = (s: string) =>
    s === "delivered" ? C.primary : s === "cancelled" ? C.error : C.warning;

  /* ── gradient pair ── */
  const bgTop: [string, string] = [C.bannerGradientTop, C.bannerGradientBottom];
  const sheetBg = C.sheetBg;
  const cardSurface = { backgroundColor: isDarkMode ? "rgba(28,28,30,0.75)" : "rgba(255,255,255,0.9)", borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.95)" };

  return (
    <>
      <View style={{ flex: 1, backgroundColor: C.surfaceMuted }}>

        {/* ── Top banner ── */}
        <LinearGradient
          colors={bgTop}
          style={[s.banner, { paddingTop: topPad + 6 }]}
        >
          {/* header row */}
          <View style={s.bannerRow}>
            <Text style={[s.pageTitle, { color: isDarkMode ? C.bannerGradientBottom : C.primaryDeep }]}>{t("profile_title")}</Text>
            <Pressable
              style={[s.editBtn, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(20,83,45,0.1)" }]}
              onPress={() => { setEditName(user.name || ""); setShowEditModal(true); }}
            >
              <Ionicons name="create-outline" size={17} color={isDarkMode ? C.mintGreenLight : C.primaryGradientEnd} />
              <Text style={[s.editBtnText, { color: isDarkMode ? C.mintGreenLight : C.primaryGradientEnd }]}>{t("edit")}</Text>
            </Pressable>
          </View>

          {/* Avatar + info */}
          <View style={s.heroRow}>
            <View style={s.avatarWrap}>
              <LinearGradient colors={[C.secondaryGreen, C.primaryGradientEnd]} style={s.avatar}>
                <Text style={s.avatarLetter}>{initials}</Text>
              </LinearGradient>
              <View style={[s.onlineDot, { borderColor: C.bannerGradientBottom }]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.heroName, { color: isDarkMode ? C.bannerGradientBottom : C.primaryDeep }]}>{user.name}</Text>
              <View style={s.heroPhoneRow}>
                <Ionicons name="call-outline" size={13} color={isDarkMode ? C.mintGreenLight : C.primary} />
                <Text style={[s.heroPhone, { color: isDarkMode ? C.mintGreenLighter : C.primaryDark }]}>{user.phoneNumber}</Text>
              </View>
              <View style={[s.rolePill, {
                backgroundColor: user.role === "admin" ? "rgba(245,158,11,0.15)" : "rgba(22,163,74,0.15)",
              }]}>
                <Ionicons
                  name={user.role === "admin" ? "shield-checkmark" : user.role === "courier" ? "bicycle" : "person"}
                  size={11}
                  color={user.role === "admin" ? C.warning : C.primary}
                />
                <Text style={[s.rolePillText, { color: user.role === "admin" ? C.warning : C.primary }]}>
                  {user.role === "admin" ? t("admin") : user.role === "courier" ? t("courier") : t("role_customer")}
                </Text>
              </View>
            </View>
          </View>

          {/* Stats row */}
          <View style={[s.statsCard, cardSurface, { borderWidth: 1 }]}>
            {[
              { icon: "receipt-outline", label: t("orders_stat"), val: userOrders.length, color: C.primary },
              { icon: "bag-handle-outline", label: t("cart_stat"), val: cartCount, color: C.accent },
            ].map((st, i) => (
              <React.Fragment key={st.label}>
                {i > 0 && <View style={[s.statDiv, { backgroundColor: C.inputBorder }]} />}
                <View style={s.statItem}>
                  <View style={[s.statIcon, { backgroundColor: st.color + "15" }]}>
                    <Ionicons name={st.icon as any} size={15} color={st.color} />
                  </View>
                  <Text style={[s.statVal, { color: C.text }]}>{st.val}</Text>
                  <Text style={[s.statLabel, { color: C.textSecondary }]}>{st.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </LinearGradient>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[s.scroll, { paddingBottom: Platform.OS === "web" ? 40 : 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Role shortcut ── */}
          {user.role === "courier" && (
            <Pressable
              style={[s.roleCard, { backgroundColor: C.info }]}
              onPress={() => router.push("/courier")}
            >
              <View style={s.roleLeft}>
                <View style={s.roleIconBox}><Ionicons name="bicycle" size={20} color={C.textInverse} /></View>
                <View>
                  <Text style={s.roleTitle}>{t("courier_panel")}</Text>
                  <Text style={s.roleSub}>{t("courier_panel_sub")}</Text>
                </View>
              </View>
              <View style={s.roleArrow}><Ionicons name="arrow-forward" size={16} color={C.textInverse} /></View>
            </Pressable>
          )}
          {user.role === "admin" && (
            <Pressable
              style={[s.roleCard, { backgroundColor: C.primary }]}
              onPress={() => router.push("/admin")}
            >
              <View style={s.roleLeft}>
                <View style={s.roleIconBox}><Ionicons name="shield-checkmark" size={20} color={C.textInverse} /></View>
                <View>
                  <Text style={s.roleTitle}>{t("admin_panel")}</Text>
                  <Text style={s.roleSub}>{t("admin_panel_sub")}</Text>
                </View>
              </View>
              <View style={s.roleArrow}><Ionicons name="arrow-forward" size={16} color={C.textInverse} /></View>
            </Pressable>
          )}

          {/* ── Recent orders ── */}
          <View style={s.sectionHead}>
            <Text style={[s.sectionTitle, { color: C.text }]}>{t("recent_orders")}</Text>
            {userOrders.length > 0 && (
              <Pressable onPress={() => router.push("/orders")} style={s.seeAllBtn}>
                <Text style={s.seeAllText}>{t("see_all")}</Text>
                <Ionicons name="arrow-forward" size={13} color={C.primary} />
              </Pressable>
            )}
          </View>

          {userOrders.length === 0 ? (
            <View style={[s.emptyBox, cardSurface, { borderWidth: 1 }]}>
              <LinearGradient colors={["rgba(22,163,74,0.12)", "rgba(22,163,74,0.04)"]} style={s.emptyIconGrad}>
                <Ionicons name="receipt-outline" size={28} color={C.primary} />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[s.emptyTitle, { color: C.text }]}>{t("no_orders")}</Text>
                <Text style={[s.emptySub, { color: C.textSecondary }]}>{t("no_orders_sub")}</Text>
              </View>
              <Pressable style={s.shopBtn} onPress={() => router.push("/(tabs)/")}>
                <Ionicons name="storefront-outline" size={16} color={C.textInverse} />
              </Pressable>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {userOrders.slice(0, 3).map(order => (
                <Pressable
                  key={order.id}
                  style={[s.orderCard, cardSurface, { borderWidth: 1 }]}
                  onPress={() => router.push(`/order/${order.id}`)}
                >
                  <View style={s.orderTop}>
                    <View style={s.orderIdRow}>
                      <View style={[s.orderDot, { backgroundColor: getStatusColor(order.status) }]} />
                      <Text style={[s.orderId, { color: C.text }]}>#{order.id.slice(-6).toUpperCase()}</Text>
                    </View>
                    <View style={[s.statusChip, { backgroundColor: getStatusColor(order.status) + "18" }]}>
                      <Text style={[s.statusText, { color: getStatusColor(order.status) }]}>
                        {getStatusLabel(order.status)}
                      </Text>
                    </View>
                  </View>
                  <View style={s.orderMeta}>
                    <Ionicons name="calendar-outline" size={12} color={C.textMuted} />
                    <Text style={[s.orderMetaTxt, { color: C.textSecondary }]}>
                      {new Date(order.createdAt).toLocaleDateString("uz-UZ")}
                    </Text>
                    <Text style={[s.orderMetaDot, { color: C.textMuted }]}>·</Text>
                    <Text style={[s.orderMetaTxt, { color: C.textSecondary }]}>
                      {((order.items as any[]) ?? []).length} {t("product_count_suffix")}
                    </Text>
                  </View>
                  <View style={s.orderBottom}>
                    <Text style={[s.orderPrice, { color: C.text }]}>{formatPrice(order.total)}</Text>
                    <View style={s.trackBtn}>
                      <Text style={s.trackTxt}>{t("track")}</Text>
                      <Ionicons name="arrow-forward" size={12} color={C.primary} />
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {/* ── Settings: Hisob ── */}
          <SectionHeader title={t("section_account")} icon="person-circle-outline" isDarkMode={isDarkMode} />
          <View style={[s.menuCard, cardSurface, { borderWidth: 1 }]}>
            <MenuItem
              icon="location-outline" label={t("address")} value={locationLabel}
              onPress={() => setShowLocationPicker(true)}
              iconBg="rgba(239,68,68,0.1)" iconColor={C.error}
              isDarkMode={isDarkMode}
            />
            <Sep isDarkMode={isDarkMode} />
            <MenuItem
              icon="card-outline" label={t("payment_methods")} value={paymentLabel}
              onPress={() => setShowPaymentModal(true)}
              iconBg="rgba(22,163,74,0.1)" iconColor={C.primary}
              isDarkMode={isDarkMode}
            />
            <Sep isDarkMode={isDarkMode} />
            <MenuItem
              icon="lock-closed-outline" label={t("change_password")}
              onPress={() => { setOldPassword(""); setNewPassword(""); setConfirmPassword(""); setShowPasswordModal(true); }}
              iconBg="rgba(99,102,241,0.1)" iconColor={C.indigo}
              isDarkMode={isDarkMode}
            />
          </View>

          {/* ── Settings: Ilova ── */}
          <SectionHeader title={t("section_app_settings")} icon="settings-outline" isDarkMode={isDarkMode} />
          <View style={[s.menuCard, cardSurface, { borderWidth: 1 }]}>
            <MenuItem
              icon="notifications-outline" label={t("notifications")}
              toggle toggleValue={notificationsEnabled} onToggle={handleToggleNotifications}
              iconBg="rgba(249,115,22,0.1)" iconColor={C.accent}
              isDarkMode={isDarkMode}
            />
            <Sep isDarkMode={isDarkMode} />
            <MenuItem
              icon="moon-outline" label={t("dark_mode")}
              toggle toggleValue={isDarkMode} onToggle={toggleDarkMode}
              iconBg="rgba(99,102,241,0.1)" iconColor={C.indigo}
              isDarkMode={isDarkMode}
            />
            <Sep isDarkMode={isDarkMode} />
            <MenuItem
              icon="language-outline" label={t("language")}
              value={lang === "uz" ? "🇺🇿 O'zbekcha" : "🇷🇺 Русский"}
              onPress={() => setShowLangModal(true)}
              iconBg="rgba(139,92,246,0.1)" iconColor={C.purple}
              isDarkMode={isDarkMode}
            />
          </View>

          {/* ── Settings: Support ── */}
          <SectionHeader title={t("section_support")} icon="heart-outline" isDarkMode={isDarkMode} />
          <View style={[s.menuCard, cardSurface, { borderWidth: 1 }]}>
            <MenuItem
              icon="headset-outline" label={t("help_center")}
              onPress={() => setShowHelpModal(true)}
              iconBg="rgba(59,130,246,0.1)" iconColor={C.info}
              isDarkMode={isDarkMode}
            />
            <Sep isDarkMode={isDarkMode} />
            <MenuItem
              icon="information-circle-outline" label={t("about_app")} value={`v${APP_VERSION}`}
              onPress={() => setShowAboutModal(true)}
              iconBg="rgba(16,185,129,0.1)" iconColor={C.emerald}
              isDarkMode={isDarkMode}
            />
          </View>

          {/* ── Logout ── */}
          <View style={[s.menuCard, cardSurface, { borderWidth: 1 }]}>
            <MenuItem
              icon="log-out-outline" label={t("logout")}
              danger onPress={handleLogout} isDarkMode={isDarkMode}
            />
          </View>

          <Text style={[s.versionFooter, { color: C.textMuted }]}>
            City Market · v{APP_VERSION} · {APP_BUILD}
          </Text>
        </ScrollView>
      </View>

      {/* ── Location picker ── */}
      <LocationPicker visible={showLocationPicker} onClose={() => setShowLocationPicker(false)} />

      {/* ── Edit name modal ── */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <Pressable style={ms.overlay} onPress={() => setShowEditModal(false)}>
            <Pressable style={[ms.sheet, { backgroundColor: sheetBg }]} onPress={e => e.stopPropagation()}>
              <View style={ms.pill} />
              <View style={ms.hdr}>
                <LinearGradient colors={[C.primary, C.primaryGradientEnd]} style={ms.hdrIcon}>
                  <Ionicons name="person-outline" size={20} color={C.textInverse} />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[ms.hdrTitle, { color: C.text }]}>{t("edit_name_title")}</Text>
                  <Text style={[ms.hdrSub, { color: C.textSecondary }]}>{t("edit_name_sub")}</Text>
                </View>
              </View>
              <TextInput
                style={[ms.input, { color: C.text, backgroundColor: C.inputBg, borderColor: C.inputBorder }]}
                value={editName} onChangeText={setEditName}
                placeholder={t("name_placeholder")}
                placeholderTextColor={C.textMuted}
                autoFocus maxLength={50}
              />
              <View style={ms.btnRow}>
                <Pressable style={[ms.cancelBtn, { borderColor: C.inputBorder }]} onPress={() => setShowEditModal(false)}>
                  <Text style={[ms.cancelTxt, { color: C.textSecondary }]}>{t("cancel")}</Text>
                </Pressable>
                <Pressable style={[ms.btn, { flex: 1, backgroundColor: C.primary, opacity: savingName ? 0.6 : 1 }]} onPress={handleSaveName} disabled={savingName}>
                  <Text style={ms.btnText}>{savingName ? t("saving") : t("save")}</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Password modal ── */}
      <Modal visible={showPasswordModal} transparent animationType="slide" onRequestClose={() => setShowPasswordModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <Pressable style={ms.overlay} onPress={() => setShowPasswordModal(false)}>
            <Pressable style={[ms.sheet, { backgroundColor: sheetBg }]} onPress={e => e.stopPropagation()}>
              <View style={ms.pill} />
              <View style={ms.hdr}>
                <LinearGradient colors={[C.indigo, C.indigoDark]} style={ms.hdrIcon}>
                  <Ionicons name="lock-closed-outline" size={20} color={C.textInverse} />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[ms.hdrTitle, { color: C.text }]}>{t("change_password_title")}</Text>
                  <Text style={[ms.hdrSub, { color: C.textSecondary }]}>{t("change_password_sub")}</Text>
                </View>
              </View>
              {[
                { val: oldPassword, set: setOldPassword, ph: t("old_password_placeholder"), show: showOld, toggle: () => setShowOld(p => !p) },
                { val: newPassword, set: setNewPassword, ph: t("new_password_placeholder"), show: showNew, toggle: () => setShowNew(p => !p) },
                { val: confirmPassword, set: setConfirmPassword, ph: t("confirm_new_password_placeholder"), show: showConfirm, toggle: () => setShowConfirm(p => !p) },
              ].map((f, i) => (
                <View key={i} style={[ms.pwdWrap, i > 0 && { marginTop: 10 }]}>
                  <TextInput
                    style={[ms.input, {
                      color: C.text, backgroundColor: C.inputBg,
                      borderColor: C.inputBorder, paddingRight: 48,
                    }]}
                    value={f.val} onChangeText={f.set}
                    placeholder={f.ph}
                    placeholderTextColor={C.textMuted}
                    secureTextEntry={!f.show} autoFocus={i === 0}
                  />
                  <Pressable style={ms.eyeBtn} onPress={f.toggle}>
                    <Ionicons name={f.show ? "eye-off-outline" : "eye-outline"} size={18} color={C.textMuted} />
                  </Pressable>
                </View>
              ))}
              <Text style={{ fontSize: 12, color: C.textSecondary, marginTop: 8 }}>
                {t("password_rules")}
              </Text>
              <View style={ms.btnRow}>
                <Pressable style={[ms.cancelBtn, { borderColor: C.inputBorder }]} onPress={() => setShowPasswordModal(false)}>
                  <Text style={[ms.cancelTxt, { color: C.textSecondary }]}>{t("cancel")}</Text>
                </Pressable>
                <Pressable style={[ms.btn, { flex: 1, backgroundColor: C.indigo, opacity: savingPassword ? 0.6 : 1 }]} onPress={handleChangePassword} disabled={savingPassword}>
                  <Text style={ms.btnText}>{savingPassword ? t("saving") : t("change")}</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Feature modals ── */}
      <PaymentModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        isDarkMode={isDarkMode}
        value={paymentMethod}
        saving={savingPayment}
        onSave={async (v) => {
          setSavingPayment(true);
          try {
            await updatePaymentMethod(v);
            setShowPaymentModal(false);
          } catch { Alert.alert(t("error_title"), t("error_saving")); }
          finally { setSavingPayment(false); }
        }}
      />
      <LanguageModal visible={showLangModal} onClose={() => setShowLangModal(false)} lang={lang} setLang={setLang} isDarkMode={isDarkMode} />
      <HelpModal visible={showHelpModal} onClose={() => setShowHelpModal(false)} isDarkMode={isDarkMode} />
      <AboutModal visible={showAboutModal} onClose={() => setShowAboutModal(false)} isDarkMode={isDarkMode} />
    </>
  );
}

/* ════════════════════════════════════════════
   SECTION HEADER COMPONENT
   ════════════════════════════════════════════ */
function SectionHeader({ title, icon, isDarkMode }: { title: string; icon: string; isDarkMode: boolean }) {
  const C = getColors(isDarkMode);
  return (
    <View style={s.sectionHead}>
      <View style={[s.sectionIconWrap, { backgroundColor: isDarkMode ? "rgba(22,163,74,0.12)" : "rgba(22,163,74,0.08)" }]}>
        <Ionicons name={icon as any} size={14} color={C.primary} />
      </View>
      <Text style={[s.sectionTitle, { color: C.text }]}>{title}</Text>
    </View>
  );
}

/* ════════════════════════════════════════════
   STYLES
   ════════════════════════════════════════════ */
const s = StyleSheet.create({
  /* banner */
  banner: { paddingHorizontal: 18, paddingBottom: 20 },
  bannerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  pageTitle: { fontFamily: "Poppins_700Bold", fontSize: 26 },
  editBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  editBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },

  /* hero */
  heroRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 20 },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 72, height: 72, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
    shadowColor: StaticColors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  avatarLetter: { fontFamily: "Poppins_700Bold", fontSize: 30, color: StaticColors.textInverse },
  onlineDot: { position: "absolute", bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: StaticColors.secondaryGreen, borderWidth: 2 },
  heroName: { fontFamily: "Poppins_700Bold", fontSize: 19, marginBottom: 3 },
  heroPhoneRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 8 },
  heroPhone: { fontFamily: "Poppins_400Regular", fontSize: 13 },
  rolePill: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  rolePillText: { fontFamily: "Poppins_600SemiBold", fontSize: 11 },

  /* stats */
  statsCard: {
    flexDirection: "row", borderRadius: 20, borderWidth: 1, paddingVertical: 14,
  },
  statItem: { flex: 1, alignItems: "center", gap: 3 },
  statDiv: { width: 1, marginVertical: 6 },
  statIcon: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  statVal: { fontFamily: "Poppins_700Bold", fontSize: 18 },
  statLabel: { fontFamily: "Poppins_400Regular", fontSize: 11 },

  /* scroll body */
  scroll: { paddingHorizontal: 16, paddingTop: 16 },

  /* role card */
  roleCard: {
    borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6,
  },
  roleLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  roleIconBox: { width: 42, height: 42, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 13, alignItems: "center", justifyContent: "center" },
  roleTitle: { fontFamily: "Poppins_700Bold", fontSize: 14, color: StaticColors.textInverse },
  roleSub: { fontFamily: "Poppins_400Regular", fontSize: 12, color: "rgba(255,255,255,0.8)" },
  roleArrow: { width: 32, height: 32, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 10, alignItems: "center", justifyContent: "center" },

  /* section head */
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8, marginTop: 18 },
  sectionIconWrap: { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: 15 },
  seeAllBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginLeft: "auto" as any },
  seeAllText: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: StaticColors.primary },

  /* empty state */
  emptyBox: {
    borderRadius: 18, borderWidth: 1, padding: 18, flexDirection: "row", alignItems: "center", gap: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  emptyIconGrad: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 14, marginBottom: 2 },
  emptySub: { fontFamily: "Poppins_400Regular", fontSize: 12 },
  shopBtn: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: StaticColors.primary,
    alignItems: "center", justifyContent: "center", marginLeft: "auto" as any,
  },

  /* order card */
  orderCard: {
    borderRadius: 18, borderWidth: 1, padding: 15, gap: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  orderTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderIdRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  orderDot: { width: 8, height: 8, borderRadius: 4 },
  orderId: { fontFamily: "Poppins_700Bold", fontSize: 14 },
  statusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontFamily: "Poppins_600SemiBold", fontSize: 11 },
  orderMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  orderMetaTxt: { fontFamily: "Poppins_400Regular", fontSize: 12 },
  orderMetaDot: { fontFamily: "Poppins_400Regular", fontSize: 12 },
  orderBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderPrice: { fontFamily: "Poppins_700Bold", fontSize: 15 },
  trackBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(22,163,74,0.1)", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
  },
  trackTxt: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: StaticColors.primary },

  /* menu card */
  menuCard: {
    borderRadius: 20, borderWidth: 1, overflow: "hidden",
  },
  menuRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 13 },
  menuIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, fontFamily: "Poppins_500Medium", fontSize: 14.5 },
  menuRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  menuValue: { fontFamily: "Poppins_400Regular", fontSize: 12, maxWidth: 110 },
  chevronWrap: { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  sep: { height: 1, marginHorizontal: 16 },

  versionFooter: { fontFamily: "Poppins_400Regular", fontSize: 12, textAlign: "center", marginTop: 16, marginBottom: 4 },
});

const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 22, paddingBottom: Platform.OS === "ios" ? 42 : 26,
  },
  tallSheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 22, paddingBottom: Platform.OS === "ios" ? 42 : 26,
    maxHeight: "90%",
  },
  pill: { width: 38, height: 4, borderRadius: 2, backgroundColor: StaticColors.neutralPill, alignSelf: "center", marginBottom: 20 },

  /* header */
  hdr: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 22 },
  hdrIcon: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  hdrTitle: { fontFamily: "Poppins_700Bold", fontSize: 18, marginBottom: 1 },
  hdrSub: { fontFamily: "Poppins_400Regular", fontSize: 13 },

  /* section label */
  secLabel: {
    fontFamily: "Poppins_600SemiBold", fontSize: 11,
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10,
  },

  /* payment */
  payCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, padding: 14, borderWidth: 1 },
  payIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  payTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  paySub: { fontFamily: "Poppins_400Regular", fontSize: 12, marginTop: 1 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontFamily: "Poppins_500Medium", fontSize: 11 },

  /* language */
  langCard: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 16, padding: 16, borderWidth: 1 },
  langFlag: { fontSize: 34 },
  langName: { fontFamily: "Poppins_700Bold", fontSize: 15, marginBottom: 2 },
  langDesc: { fontFamily: "Poppins_400Regular", fontSize: 12 },
  checkWrap: { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  langNote: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, padding: 12, marginTop: 14 },
  langNoteText: { fontFamily: "Poppins_400Regular", fontSize: 12, flex: 1 },

  /* contact / help */
  contactCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, padding: 14, borderWidth: 1 },
  contactIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  contactLabel: { fontFamily: "Poppins_400Regular", fontSize: 11, marginBottom: 2 },
  contactValue: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  arrowChip: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },

  /* faq */
  faqItem: { borderRadius: 14, padding: 14, borderWidth: 1 },
  faqNum: { width: 24, height: 24, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  faqQ: { fontFamily: "Poppins_600SemiBold", fontSize: 13, lineHeight: 18 },
  faqChevron: { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  faqA: { fontFamily: "Poppins_400Regular", fontSize: 12, lineHeight: 18 },

  /* about */
  aboutLogo: {
    width: 88, height: 88, borderRadius: 26, alignItems: "center", justifyContent: "center",
    marginBottom: 14,
    shadowColor: StaticColors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 9,
  },
  aboutName: { fontFamily: "Poppins_700Bold", fontSize: 22, marginBottom: 4 },
  aboutSlogan: { fontFamily: "Poppins_400Regular", fontSize: 13, marginBottom: 12 },
  verChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginBottom: 20,
  },
  verChipText: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: StaticColors.primary },
  infoTable: { borderRadius: 16, borderWidth: 1, overflow: "hidden", marginBottom: 2 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13 },
  infoKey: { fontFamily: "Poppins_400Regular", fontSize: 13 },
  infoVal: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  copyright: { fontFamily: "Poppins_400Regular", fontSize: 11, textAlign: "center", marginTop: 18 },

  /* inputs */
  input: {
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontFamily: "Poppins_400Regular", fontSize: 15, borderWidth: 1,
  },
  pwdWrap: { position: "relative" },
  eyeBtn: { position: "absolute", right: 14, top: 0, bottom: 0, justifyContent: "center" },

  /* buttons */
  btnRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  cancelBtn: { flex: 0.4, borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  cancelTxt: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  btn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 7, borderRadius: 14, paddingVertical: 14,
  },
  btnText: { fontFamily: "Poppins_700Bold", fontSize: 15, color: StaticColors.textInverse },
});
