import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import getColors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/lib/I18nProvider";
import { useTheme } from "@/context/ThemeContext";

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { login, register, user, isLoading: authLoading } = useAuth();
  const { t, lang, setLang } = useTranslation();
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const styles = getStyles(isDarkMode);

  const [isLogin, setIsLogin] = useState(true);
  const [phoneSuffix, setPhoneSuffix] = useState("");
  const [password, setPassword] = useState("");
  const phoneNumber = "+998" + phoneSuffix;
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isStore, setIsStore] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      if (user.role === "admin") router.replace("/admin");
      else if (user.role === "courier") router.replace("/courier");
      else if (user.role === "store") router.replace("/(store)");
      else router.replace("/(tabs)");
    }
  }, [user, authLoading]);

  const handleLogin = async () => {
    if (!phoneSuffix || !password) {
      Alert.alert(t("error_title"), t("error_fill_phone_password"));
      return;
    }
    if (!/^\d{9}$/.test(phoneSuffix)) {
      Alert.alert(t("error_title"), t("error_phone_length"));
      return;
    }
    setLoading(true);
    try {
      await login(phoneNumber, password);
    } catch (e: any) {
      const rawMessage: string = e?.message || "";
      let errorMessage = t("error_login_failed");
      try {
        const match = rawMessage.match(/\{.*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          errorMessage = parsed.error || parsed.message || errorMessage;
        } else if (rawMessage) {
          errorMessage = rawMessage;
        }
      } catch {}
      Alert.alert(t("error_title"), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!phoneSuffix || phoneSuffix.length < 9) {
      Alert.alert(t("error_title"), t("error_full_phone"));
      return;
    }
    if (!name || name.trim().length < 2) {
      Alert.alert(t("error_title"), t("error_name_min"));
      return;
    }
    if (isStore && (!storeName || storeName.trim().length < 2)) {
      Alert.alert(t("error_title"), t("error_store_name"));
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      Alert.alert(t("error_title"), t("error_password_min6"));
      return;
    }
    if (regPassword !== regConfirmPassword) {
      Alert.alert(t("error_title"), t("error_password_mismatch"));
      return;
    }
    setLoading(true);
    try {
      await register(
        phoneNumber,
        regPassword,
        name,
        isStore ? "store" : "customer",
        isStore ? storeName : undefined,
        isStore ? storeAddress : undefined,
      );
    } catch (e: any) {
      const rawMessage: string = e?.message || "";
      let errorMessage = t("error_register_failed");
      try {
        const match = rawMessage.match(/\{.*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          errorMessage = parsed.error || parsed.message || errorMessage;
        } else if (rawMessage) {
          errorMessage = rawMessage;
        }
      } catch {}
      if (errorMessage.toLowerCase().includes("already exists") || errorMessage.includes("allaqachon")) {
        Alert.alert(t("phone_exists_title"), t("phone_exists_message"));
      } else {
        Alert.alert(t("error_title"), errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={["#16A34A", "#22C55E", "#4ADE80"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroSection, { paddingTop: insets.top + 40 }]}
        >
          <Image
            source={require("@/assets/logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.heroTitle}>City Market</Text>
          <Text style={styles.heroSubtitle}>{t("hero_subtitle")}</Text>

          <View style={styles.langRow}>
            <Pressable
              style={[styles.langBtn, lang === "uz" && styles.langBtnActive]}
              onPress={() => setLang("uz")}
            >
              <Text style={[styles.langText, lang === "uz" && styles.langTextActive]}>UZ</Text>
            </Pressable>
            <Pressable
              style={[styles.langBtn, lang === "ru" && styles.langBtnActive]}
              onPress={() => setLang("ru")}
            >
              <Text style={[styles.langText, lang === "ru" && styles.langTextActive]}>RU</Text>
            </Pressable>
          </View>
        </LinearGradient>

        <View style={styles.formCard}>
          <View style={styles.tabRow}>
            <Pressable
              style={[styles.tab, isLogin && styles.tabActive]}
              onPress={() => {
                setIsLogin(true);
                setPhoneSuffix(""); setPassword(""); setName("");
                setIsStore(false); setStoreName(""); setStoreAddress("");
                setRegPassword(""); setRegConfirmPassword("");
              }}
            >
              <Ionicons
                name="log-in-outline"
                size={15}
                color={isLogin ? "#16A34A" : "#9CA3AF"}
                style={{ marginBottom: 2 }}
              />
              <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>{t("login")}</Text>
            </Pressable>
            <Pressable
              style={[styles.tab, !isLogin && styles.tabActive]}
              onPress={() => {
                setIsLogin(false);
                setPhoneSuffix(""); setPassword(""); setName("");
                setRegPassword(""); setRegConfirmPassword("");
              }}
            >
              <Ionicons
                name="person-add-outline"
                size={15}
                color={!isLogin ? "#16A34A" : "#9CA3AF"}
                style={{ marginBottom: 2 }}
              />
              <Text style={[styles.tabText, !isLogin && styles.tabTextActive]} numberOfLines={1} adjustsFontSizeToFit>
                {t("register")}
              </Text>
            </Pressable>
          </View>

          {isLogin ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("phone")}</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="call-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                  <View style={styles.prefixBadge}>
                    <Text style={styles.prefixText}>+998</Text>
                  </View>
                  <View style={styles.prefixDivider} />
                  <TextInput
                    style={styles.input}
                    placeholder={t("phone_placeholder")}
                    placeholderTextColor={Colors.textMuted}
                    value={phoneSuffix}
                    onChangeText={(text) => {
                      const digits = text.replace(/\D/g, "").slice(0, 9);
                      setPhoneSuffix(digits);
                    }}
                    keyboardType="number-pad"
                    maxLength={9}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("password")}</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={Colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color={Colors.textMuted}
                    />
                  </Pressable>
                </View>
              </View>

              <Pressable
                style={[styles.authBtn, loading && { opacity: 0.7 }]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.authBtnText}>{t("login")}</Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.roleRow}>
                <Pressable
                  style={[styles.roleBtn, !isStore && styles.roleBtnActive]}
                  onPress={() => setIsStore(false)}
                >
                  <Ionicons name="person-outline" size={16} color={!isStore ? "#fff" : Colors.textMuted} />
                  <Text style={[styles.roleBtnText, !isStore && styles.roleBtnTextActive]}>{t("role_customer")}</Text>
                </Pressable>
                <Pressable
                  style={[styles.roleBtn, isStore && styles.roleBtnActive]}
                  onPress={() => setIsStore(true)}
                >
                  <Ionicons name="storefront-outline" size={16} color={isStore ? "#fff" : Colors.textMuted} />
                  <Text style={[styles.roleBtnText, isStore && styles.roleBtnTextActive]}>{t("role_store")}</Text>
                </Pressable>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{isStore ? t("your_name") : t("name")}</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="person-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t("name_placeholder")}
                    placeholderTextColor={Colors.textMuted}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {isStore && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>{t("store_name")}</Text>
                    <View style={styles.inputBox}>
                      <Ionicons name="storefront-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder={t("store_name_placeholder")}
                        placeholderTextColor={Colors.textMuted}
                        value={storeName}
                        onChangeText={setStoreName}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>{t("store_address")}</Text>
                    <View style={styles.inputBox}>
                      <Ionicons name="location-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder={t("store_address_placeholder")}
                        placeholderTextColor={Colors.textMuted}
                        value={storeAddress}
                        onChangeText={setStoreAddress}
                        autoCapitalize="sentences"
                      />
                    </View>
                  </View>
                </>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("phone")}</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="call-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                  <View style={styles.prefixBadge}>
                    <Text style={styles.prefixText}>+998</Text>
                  </View>
                  <View style={styles.prefixDivider} />
                  <TextInput
                    style={styles.input}
                    placeholder={t("phone_placeholder")}
                    placeholderTextColor={Colors.textMuted}
                    value={phoneSuffix}
                    onChangeText={(text) => {
                      const digits = text.replace(/\D/g, "").slice(0, 9);
                      setPhoneSuffix(digits);
                    }}
                    keyboardType="number-pad"
                    maxLength={9}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("password")}</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t("password_min_placeholder")}
                    placeholderTextColor={Colors.textMuted}
                    value={regPassword}
                    onChangeText={setRegPassword}
                    secureTextEntry={!showRegPassword}
                  />
                  <Pressable onPress={() => setShowRegPassword(!showRegPassword)}>
                    <Ionicons
                      name={showRegPassword ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color={Colors.textMuted}
                    />
                  </Pressable>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("confirm_password")}</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t("confirm_password_placeholder")}
                    placeholderTextColor={Colors.textMuted}
                    value={regConfirmPassword}
                    onChangeText={setRegConfirmPassword}
                    secureTextEntry={!showRegConfirmPassword}
                  />
                  <Pressable onPress={() => setShowRegConfirmPassword(!showRegConfirmPassword)}>
                    <Ionicons
                      name={showRegConfirmPassword ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color={Colors.textMuted}
                    />
                  </Pressable>
                </View>
              </View>

              <Pressable
                style={[styles.authBtn, loading && { opacity: 0.7 }]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.btnInner}>
                    <Ionicons name="person-add-outline" size={18} color="#fff" />
                    <Text style={styles.authBtnText}>{t("register")}</Text>
                  </View>
                )}
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (isDarkMode: boolean) => {
  const Colors = getColors(isDarkMode);
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? "#0C0C0E" : "#16A34A",
    },
    scrollContent: {
      flexGrow: 1,
      backgroundColor: isDarkMode ? "#0C0C0E" : "#16A34A",
    },
    heroSection: {
      paddingHorizontal: 24,
      paddingBottom: 48,
      alignItems: "center",
      gap: 8,
    },
    logoImage: {
      width: 160,
      height: 90,
      borderRadius: 18,
      marginBottom: 4,
    },
    heroTitle: {
      fontFamily: "Poppins_700Bold",
      fontSize: 30,
      color: "#fff",
      letterSpacing: -0.5,
    },
    heroSubtitle: {
      fontFamily: "Poppins_400Regular",
      fontSize: 15,
      color: "rgba(255,255,255,0.85)",
    },
    langRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 8,
    },
    langBtn: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.2)",
    },
    langBtnActive: {
      backgroundColor: "#fff",
    },
    langText: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 13,
      color: "rgba(255,255,255,0.8)",
    },
    langTextActive: {
      color: "#16A34A",
    },
    formCard: {
      flex: 1,
      backgroundColor: isDarkMode ? "#0C0C0E" : "#fff",
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      marginTop: -20,
      paddingHorizontal: 24,
      paddingTop: 28,
      paddingBottom: 32,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 12,
    },
    tabRow: {
      flexDirection: "row",
      backgroundColor: isDarkMode ? "#1C1C1E" : "#F5F6F5",
      borderRadius: 14,
      padding: 4,
      marginBottom: 24,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 11,
      flexDirection: "column",
      gap: 1,
    },
    tabActive: {
      backgroundColor: Colors.card,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    tabText: {
      fontFamily: "Poppins_500Medium",
      fontSize: 12,
      color: Colors.textMuted,
      textAlign: "center",
    },
    tabTextActive: {
      fontFamily: "Poppins_700Bold",
      color: Colors.text,
    },
    inputGroup: {
      marginBottom: 16,
    },
    inputLabel: {
      fontFamily: "Poppins_500Medium",
      fontSize: 13,
      color: Colors.textSecondary,
      marginBottom: 8,
    },
    inputBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDarkMode ? "#1C1C1E" : "#F5F6F5",
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 14,
      gap: 10,
    },
    inputIcon: {
      marginRight: 2,
    },
    input: {
      flex: 1,
      fontFamily: "Poppins_400Regular",
      fontSize: 15,
      color: Colors.text,
    },
    prefixBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: isDarkMode ? "#2A2A2E" : "#E8F5E9",
    },
    prefixText: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 15,
      color: Colors.primary,
    },
    prefixDivider: {
      width: 1,
      height: 20,
      backgroundColor: Colors.divider,
      marginHorizontal: 4,
    },
    authBtn: {
      backgroundColor: Colors.primary,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: "center",
      marginTop: 8,
      marginBottom: 16,
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 14,
      elevation: 8,
    },
    authBtnText: {
      fontFamily: "Poppins_700Bold",
      fontSize: 16,
      color: "#fff",
    },
    btnInner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    roleRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 20,
    },
    roleBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: isDarkMode ? "#1C1C1E" : "#F5F6F5",
      borderWidth: 1.5,
      borderColor: "transparent",
    },
    roleBtnActive: {
      backgroundColor: Colors.primary,
      borderColor: Colors.primary,
    },
    roleBtnText: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 13,
      color: Colors.textMuted,
    },
    roleBtnTextActive: {
      color: "#fff",
    },
    smsNote: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 12,
      marginTop: -4,
    },
    smsNoteText: {
      fontFamily: "Poppins_400Regular",
      fontSize: 12,
      color: Colors.textMuted,
      flex: 1,
    },
    backBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 20,
    },
    backBtnText: {
      fontFamily: "Poppins_500Medium",
      fontSize: 14,
      color: Colors.primary,
    },
    otpHeader: {
      alignItems: "center",
      marginBottom: 24,
      gap: 10,
    },
    otpIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: isDarkMode ? "#1C2E1C" : "#F0FDF4",
      alignItems: "center",
      justifyContent: "center",
    },
    otpTitle: {
      fontFamily: "Poppins_700Bold",
      fontSize: 20,
      color: Colors.text,
    },
    otpSubtitle: {
      fontFamily: "Poppins_400Regular",
      fontSize: 14,
      color: Colors.textMuted,
      textAlign: "center",
      lineHeight: 22,
    },
    devCodeBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "#FEF3C7",
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 16,
    },
    devCodeText: {
      fontFamily: "Poppins_400Regular",
      fontSize: 13,
      color: "#92400E",
    },
    otpInputRow: {
      marginBottom: 16,
    },
    otpInput: {
      backgroundColor: isDarkMode ? "#1C1C1E" : "#F5F6F5",
      borderRadius: 14,
      paddingHorizontal: 24,
      paddingVertical: 18,
      fontFamily: "Poppins_700Bold",
      fontSize: 28,
      color: Colors.primary,
      textAlign: "center",
      letterSpacing: 12,
    },
    resendBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
    },
    resendText: {
      fontFamily: "Poppins_500Medium",
      fontSize: 14,
      color: Colors.primary,
    },
  });
};
