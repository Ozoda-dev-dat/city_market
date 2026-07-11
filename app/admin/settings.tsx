import React, { useState, useEffect } from "react";
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
  ActivityIndicator,
  Share,
} from "react-native";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import getColors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/lib/I18nProvider";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/ProductsContext";
import { useCart } from "@/context/CartContext";
import { useBiometric } from "@/context/BiometricContext";
import { apiRequest } from "@/lib/query-client";

const getMenuItemStyles = (isDarkMode: boolean) => {
  const Colors = getColors(isDarkMode);
  return StyleSheet.create({
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
    },
    menuIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    menuLabel: {
      flex: 1,
      fontSize: 16,
      fontFamily: "Poppins_500Medium",
      color: Colors.text,
    },
    menuRight: {
      flexDirection: "row",
      alignItems: "center",
    },
    menuValue: {
      fontSize: 14,
      color: Colors.textSecondary,
      marginRight: 8,
    },
  });
};

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
  isDarkMode?: boolean;
}) {
  const Colors = getColors(isDarkMode ?? false);
  const styles = getMenuItemStyles(isDarkMode ?? false);
  
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
          trackColor={{ false: "#767577", true: Colors.primary }}
          thumbColor={toggleValue ? "#fff" : "#f4f3f4"}
        />
      ) : (
        <View style={styles.menuRight}>
          {value && <Text style={styles.menuValue}>{value}</Text>}
          <Ionicons name="chevron-forward" size={18} color="#ccc" />
        </View>
      )}
    </Pressable>
  );
}

export default function AdminSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useTranslation();
  const { products, orders } = useApp();
  const { items, clearCart } = useCart();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { isSupported, biometricEnabled: contextBiometricEnabled, enableBiometric, disableBiometric } = useBiometric();
  
  const Colors = getColors(isDarkMode);
  const styles = getStyles(isDarkMode);
  const [notifications, setNotifications] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingPassword, setLoadingPassword] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  // Load saved settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const notif = await AsyncStorage.getItem("notificationsEnabled");
        const backup = await AsyncStorage.getItem("autoBackupEnabled");
        
        if (notif !== null) setNotifications(JSON.parse(notif));
        if (backup !== null) setAutoBackup(JSON.parse(backup));
      } catch (error) {
        console.error("Error loading settings:", error);
        Alert.alert(
          lang === "uz" ? "Xatolik" : "Ошибка",
          lang === "uz" ? "Sozlamalarni yuklashda xatolik" : "Ошибка загрузки настроек"
        );
      }
    };
    loadSettings();
  }, []);

  if (user?.role !== "admin") {
    return (
      <View style={[styles.container, { paddingTop: topPad + 100, alignItems: "center" }]}>
        <Ionicons name="lock-closed" size={64} color={Colors.error} />
        <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 20, marginTop: 16 }}>Ruxsat yo&apos;q</Text>
      </View>
    );
  }

  const handleChangeLanguage = () => {
    const newLang = lang === "uz" ? "ru" : "uz";
    setLang(newLang);
    AsyncStorage.setItem("language", newLang);
  };  const handleNotifications = (value: boolean) => {
    setNotifications(value);
    AsyncStorage.setItem("notificationsEnabled", JSON.stringify(value));
    Alert.alert(
      t("successfully_changed"),
      value ? t("notifications_enabled") : t("notifications_disabled")
    );
  };

  const handleDarkMode = () => {
    toggleDarkMode();
  };

  const handleAutoBackup = (value: boolean) => {
    setAutoBackup(value);
    AsyncStorage.setItem("autoBackupEnabled", JSON.stringify(value));
  };

  const handleExportData = async () => {
    try {
      const exportData = {
        user,
        products,
        orders,
        cart: items,
        exportedAt: new Date().toISOString(),
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      
      if (Platform.OS !== "web") {
        try {
          await AsyncStorage.setItem("exported_data", jsonString);
          
          Alert.alert(
            lang === "uz" ? "Muvaffaqiyat" : "Успешно",
            lang === "uz" 
              ? "Ma'lumotlar saqlandi (AsyncStorage'da)" 
              : "Данные сохранены (в AsyncStorage)"
          );
        } catch (shareError) {
          Alert.alert(
            lang === "uz" ? "Xatolik" : "Ошибка",
            lang === "uz" 
              ? "Ma'lumotlarni eksport qilishda xatolik yuz berdi"
              : "Ошибка при экспорте данных"
          );
        }
      } else {
        await AsyncStorage.setItem("exported_data", jsonString);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `citymarket_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        Alert.alert(
          lang === "uz" ? "Muvaffaqiyat" : "Успешно",
          lang === "uz" ? "Ma'lumotlar yuklab olindi" : "Данные загружены"
        );
      }
    } catch (error) {
      Alert.alert(
        lang === "uz" ? "Xatolik" : "Ошибка",
        lang === "uz" 
          ? "Ma'lumotlarni eksport qilishda xatolik yuz berdi"
          : "Ошибка при экспорте данных"
      );
    }
  };

  const handleClearData = () => {
    Alert.alert(
      "Ma'lumotlarni tozalash",
      "Siz rostdan ham barcha ma'lumotlarni o'chirmoqchisiz?",
      [
        { text: "Bekor qilish", onPress: () => {} },
        {
          text: "O'chirish",
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              clearCart();
              await logout();
            } catch (error) {
              console.error("Clear data error:", error);
              Alert.alert("Xatolik", "Ma'lumotlarni tozalashda xatolik yuz berdi");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      lang === "uz" ? "Tizimdan chiqish" : "Выйти из системы",
      lang === "uz" ? "Tizimdan chiqmoqchimisiz?" : "Выйти из системы?",
      [
        { text: lang === "uz" ? "Bekor qilish" : "Отмена", style: "cancel" },
        {
          text: lang === "uz" ? "Chiqish" : "Выйти",
          style: "destructive",
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Xatolik", "Barcha maydonlarni to'ldiring");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Xatolik", "Yangi parollar mos kelmadi");
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert("Xatolik", "Parol kamida 8 belgidan iborat bo'lishi kerak");
      return;
    }

    setLoadingPassword(true);
    try {
      const res = await apiRequest("PATCH", "/api/password", { oldPassword, newPassword });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Parolni o'zgartirishda xatolik yuz berdi");
      }
      Alert.alert("Muvaffaqiyat", "Parol o'zgartirildi");
      setPasswordModalVisible(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      Alert.alert("Xatolik", error?.message || "Parolni o'zgartirishda xatolik yuz berdi");
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleBiometric = async (value: boolean) => {
    try {
      if (value) {
        const success = await enableBiometric();
        if (success) {
          Alert.alert(
            lang === "uz" ? "Muvaffaqiyat" : "Успешно",
            lang === "uz" 
              ? "Biometrik autentifikatsiya yoqildi"
              : "Биометрическая аутентификация включена"
          );
        } else {
          Alert.alert(
            lang === "uz" ? "Xatolik" : "Ошибка",
            lang === "uz"
              ? "Biometrik autentifikatsiyani yoqish imkonsiz"
              : "Не удалось включить биометрическую аутентификацию"
          );
        }
      } else {
        await disableBiometric();
        Alert.alert(
          lang === "uz" ? "Muvaffaqiyat" : "Успешно",
          lang === "uz" 
            ? "Biometrik autentifikatsiya o'chirildi"
            : "Биометрическая аутентификация отключена"
        );
      }
    } catch (error) {
      Alert.alert(
        lang === "uz" ? "Xatolik" : "Ошибка",
        lang === "uz"
          ? "Biometrik autentifikatsiyani sozlashda xatolik"
          : "Ошибка при настройке биометрии"
      );
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 12, paddingBottom: Platform.OS === "web" ? 34 : 40 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Sozlamalar</Text>

      <Text style={styles.sectionTitle}>Ilova sozlamalari</Text>
      <View style={styles.menuCard}>
        <MenuItem
          icon="language-outline"
          label={lang === "uz" ? "Til" : "Язык"}
          value={lang === "uz" ? "O'zbekcha" : "Русский"}
          onPress={handleChangeLanguage}
          isDarkMode={isDarkMode}
        />
        <View style={styles.menuDivider} />
        <MenuItem
          icon="notifications-outline"
          label={lang === "uz" ? "Bildirishnomalar" : "Уведомления"}
          toggle
          toggleValue={notifications}
          onToggle={handleNotifications}
          isDarkMode={isDarkMode}
        />
        <View style={styles.menuDivider} />
        <MenuItem
          icon="moon-outline"
          label={lang === "uz" ? "Tungi rejim" : "Тёмный режим"}
          toggle
          toggleValue={isDarkMode}
          onToggle={() => handleDarkMode()}
          isDarkMode={isDarkMode}
        />
      </View>

      <Text style={styles.sectionTitle}>{lang === "uz" ? "Ma'lumotlar" : "Данные"}</Text>
      <View style={styles.menuCard}>
        <MenuItem
          icon="cloud-upload-outline"
          label={lang === "uz" ? "Avtomatik zaxira" : "Автоматическая резервная копия"}
          toggle
          toggleValue={autoBackup}
          onToggle={handleAutoBackup}
          isDarkMode={isDarkMode}
        />
        <View style={styles.menuDivider} />
        <MenuItem
          icon="download-outline"
          label={lang === "uz" ? "Ma'lumotlarni eksport qilish" : "Экспортировать данные"}
          onPress={handleExportData}
          isDarkMode={isDarkMode}
        />
        <View style={styles.menuDivider} />
        <MenuItem
          icon="trash-outline"
          label={lang === "uz" ? "Ma'lumotlarni tozalash" : "Очистить данные"}
          color={Colors.error}
          onPress={handleClearData}
          isDarkMode={isDarkMode}
        />
      </View>

      <Text style={styles.sectionTitle}>{lang === "uz" ? "Xavfsizlik" : "Безопасность"}</Text>
      <View style={styles.menuCard}>
        <MenuItem
          icon="key-outline"
          label={lang === "uz" ? "Parolni o'zgartirish" : "Изменить пароль"}
          onPress={() => setPasswordModalVisible(true)}
          isDarkMode={isDarkMode}
        />
        <View style={styles.menuDivider} />
        <MenuItem
          icon="finger-print-outline"
          label={lang === "uz" ? "Biometrik autentifikatsiya" : "Биометрическая аутентификация"}
          toggle
          toggleValue={contextBiometricEnabled}
          onToggle={handleBiometric}
          isDarkMode={isDarkMode}
        />
        <View style={styles.menuDivider} />
        <MenuItem
          icon="log-out-outline"
          label={lang === "uz" ? "Tizimdan chiqish" : "Выйти из системы"}
          color={Colors.error}
          onPress={handleLogout}
          isDarkMode={isDarkMode}
        />
      </View>

      {/* Password Change Modal */}
      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {lang === "uz" ? "Parolni o'zgartirish" : "Изменить пароль"}
              </Text>
              <Pressable onPress={() => setPasswordModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>
                {lang === "uz" ? "Eski parol" : "Старый пароль"}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={lang === "uz" ? "Eski parolni kiriting" : "Введите старый пароль"}
                secureTextEntry
                value={oldPassword}
                onChangeText={setOldPassword}
              />

              <Text style={styles.inputLabel}>
                {lang === "uz" ? "Yangi parol" : "Новый пароль"}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={lang === "uz" ? "Yangi parolni kiriting" : "Введите новый пароль"}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: -6, marginBottom: 8 }}>
                {lang === "uz"
                  ? "Kamida 8 belgi: katta/kichik harf, raqam va maxsus belgi"
                  : "Минимум 8 символов: заглавная/строчная буква, цифра и спецсимвол"}
              </Text>

              <Text style={styles.inputLabel}>
                {lang === "uz" ? "Parolni tasdiqlang" : "Подтвердите пароль"}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={lang === "uz" ? "Parolni tasdiqlang" : "Подтвердите пароль"}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setPasswordModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>
                  {lang === "uz" ? "Bekor qilish" : "Отмена"}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleChangePassword}
                disabled={loadingPassword}
              >
                {loadingPassword ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {lang === "uz" ? "O'zgartirish" : "Изменить"}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const getStyles = (isDarkMode: boolean) => {
  const Colors = getColors(isDarkMode);
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    content: {
      paddingHorizontal: 16,
    },
    title: {
      fontSize: 28,
      fontFamily: "Poppins_700Bold",
      color: Colors.text,
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: "Poppins_600SemiBold",
      color: Colors.text,
      marginTop: 24,
      marginBottom: 12,
    },
    menuCard: {
      backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    color: Colors.text,
  },
  menuRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuValue: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 8,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 4,
  },
  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.text,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.text,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: Colors.cardBorder,
  },
  cancelButtonText: {
    fontFamily: "Poppins_600SemiBold",
    color: Colors.text,
  },
  submitButton: {
    backgroundColor: Colors.primary,
  },
  submitButtonText: {
    fontFamily: "Poppins_600SemiBold",
    color: "#fff",
  },
});
}