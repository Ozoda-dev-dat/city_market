import React, { useState, useEffect } from "react";
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
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  useEffect(() => {
    if (user && !authLoading) {
      if (user.role === "admin") router.replace("/admin");
      else if (user.role === "courier") router.replace("/courier");
      else router.replace("/(tabs)");
    }
  }, [user, authLoading]);

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    if (pwd.length < 8) errors.push("Kamida 8 ta belgi");
    if (!/[A-Z]/.test(pwd)) errors.push("Kamida 1 ta katta harf");
    if (!/[a-z]/.test(pwd)) errors.push("Kamida 1 ta kichik harf");
    if (!/\d/.test(pwd)) errors.push("Kamida 1 ta raqam");
    if (/\s/.test(pwd)) errors.push("Bo'sh joy bo'lmasligi kerak");
    return errors;
  };

  useEffect(() => {
    if (!isLogin && password) {
      setPasswordErrors(validatePassword(password));
    } else {
      setPasswordErrors([]);
    }
  }, [password, isLogin]);

  const handleAuth = async () => {
    if (!phoneNumber || !password || (!isLogin && !name)) {
      Alert.alert("Xatolik", "Barcha maydonlarni to'ldiring");
      return;
    }
    if (!isLogin && passwordErrors.length > 0) {
      Alert.alert("Xatolik", "Parol talablariga javob bermaydi:\n" + passwordErrors.join("\n"));
      return;
    }
    setLoading(true);
    try {
      if (isLogin) await login(phoneNumber, password);
      else await register(phoneNumber, password, name);
    } catch (e: any) {
      const rawMessage: string = e?.message || "";
      let errorMessage = t("error_invalid");
      try {
        const match = rawMessage.match(/\{.*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          errorMessage = parsed.error || parsed.message || errorMessage;
        } else if (rawMessage) {
          errorMessage = rawMessage;
        }
      } catch {}
      Alert.alert("Xatolik", errorMessage);
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
          <Text style={styles.heroSubtitle}>Tez va qulay yetkazib berish</Text>

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
              onPress={() => { setIsLogin(true); setPhoneSuffix(""); setPassword(""); setName(""); }}
            >
              <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Kirish</Text>
            </Pressable>
            <Pressable
              style={[styles.tab, !isLogin && styles.tabActive]}
              onPress={() => { setIsLogin(false); setPhoneSuffix(""); setPassword(""); setName(""); }}
            >
              <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Ro'yxat</Text>
            </Pressable>
          </View>

          {!isLogin && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ism</Text>
              <View style={styles.inputBox}>
                <Ionicons name="person-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ismingizni kiriting"
                  placeholderTextColor={Colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Telefon raqam</Text>
            <View style={styles.inputBox}>
              <Ionicons name="call-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <View style={styles.prefixBadge}>
                <Text style={styles.prefixText}>+998</Text>
              </View>
              <View style={styles.prefixDivider} />
              <TextInput
                style={styles.input}
                placeholder="90 123 45 67"
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
            <Text style={styles.inputLabel}>Parol</Text>
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
            {!isLogin && passwordErrors.length > 0 && (
              <View style={styles.errorList}>
                {passwordErrors.map((err, i) => (
                  <View key={i} style={styles.errorItem}>
                    <Ionicons name="close-circle" size={12} color={Colors.error} />
                    <Text style={styles.errorText}>{err}</Text>
                  </View>
                ))}
              </View>
            )}
            {!isLogin && password.length > 0 && passwordErrors.length === 0 && (
              <View style={styles.successMsg}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
                <Text style={styles.successText}>Parol talablarga javob beradi</Text>
              </View>
            )}
          </View>

          <Pressable
            style={[styles.authBtn, loading && { opacity: 0.7 }]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.authBtnText}>
                {isLogin ? "Kirish" : "Ro'yxatdan o'tish"}
              </Text>
            )}
          </Pressable>

          <View style={styles.creditsBox}>
            <Text style={styles.creditsLabel}>Admin:</Text>
            <Text style={styles.creditsText}>+998901234567 / Admin@123</Text>
          </View>
          <View style={styles.creditsBox}>
            <Text style={styles.creditsLabel}>Mijoz:</Text>
            <Text style={styles.creditsText}>+998901234568 / Test@1234</Text>
          </View>
          <View style={styles.creditsBox}>
            <Text style={styles.creditsLabel}>Kuryer:</Text>
            <Text style={styles.creditsText}>+998975482020 / Dilshod@123</Text>
          </View>
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
      paddingVertical: 10,
      alignItems: "center",
      borderRadius: 11,
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
      fontSize: 14,
      color: Colors.textMuted,
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
    errorList: {
      marginTop: 8,
      gap: 4,
    },
    errorItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    errorText: {
      fontFamily: "Poppins_400Regular",
      fontSize: 12,
      color: Colors.error,
    },
    successMsg: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginTop: 8,
    },
    successText: {
      fontFamily: "Poppins_400Regular",
      fontSize: 12,
      color: Colors.primary,
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
    creditsBox: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      marginTop: 4,
    },
    creditsLabel: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 12,
      color: Colors.textMuted,
    },
    creditsText: {
      fontFamily: "Poppins_400Regular",
      fontSize: 12,
      color: Colors.textMuted,
    },
  });
};
