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
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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

  useEffect(() => {
    if (user && !authLoading) {
      console.log("User detected, role:", user.role);
      // Navigate based on user role
      if (user.role === "admin") {
        router.replace("/admin");
      } else if (user.role === "courier") {
        router.replace("/courier");
      } else {
        router.replace("/(tabs)");
      }
    }
  }, [user, authLoading]);
  const [isLogin, setIsLogin] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  // Password validation function
  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];

    // Minimum length requirement
    if (password.length < 8) {
      errors.push('Parol kamida 8 ta belgidan iborat bo\'lishi kerak');
    }

    // Maximum length requirement
    if (password.length > 128) {
      errors.push('Parol 128 ta belgidan kam bo\'lishi kerak');
    }

    // Uppercase letter requirement
    if (!/[A-Z]/.test(password)) {
      errors.push('Parolda kamida bitta katta harf bo\'lishi kerak');
    }

    // Lowercase letter requirement
    if (!/[a-z]/.test(password)) {
      errors.push('Parolda kamida bitta kichik harf bo\'lishi kerak');
    }

    // Number requirement
    if (!/\d/.test(password)) {
      errors.push('Parolda kamida bitta raqam bo\'lishi kerak');
    }

    // Special character requirement
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Parolda kamida bitta maxsus belgi bo\'lishi kerak (!@#$%^&*())');
    }

    // No common patterns
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /admin/i,
      /letmein/i,
      /welcome/i,
    ];

    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        errors.push('Parolda umumiy naqunlar bo\'lmasligi kerak');
        break;
      }
    }

    // No whitespace
    if (/\s/.test(password)) {
      errors.push('Parolda bo\'sh joy bo\'lmasligi kerak');
    }

    return errors;
  };

  // Update password errors when password changes
  useEffect(() => {
    if (!isLogin && password) {
      const errors = validatePassword(password);
      setPasswordErrors(errors);
    } else {
      setPasswordErrors([]);
    }
  }, [password, isLogin]);

  const handleAuth = async () => {
    if (!phoneNumber || !password || (!isLogin && !name)) {
      Alert.alert("Xatolik", "Barcha maydonlarni to'ldiring");
      return;
    }

    // Check password validation for registration
    if (!isLogin && passwordErrors.length > 0) {
      Alert.alert("Xatolik", "Parol talablariga javob bermaydi. Iltimos, quyidagi talablarni qo'llang:\n" + passwordErrors.join('\n'));
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(phoneNumber, password);
      } else {
        await register(phoneNumber, password, name);
      }
      // The useEffect will handle redirection
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
      Alert.alert(t("error_invalid"), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.languageSwitch}>
          <Pressable onPress={() => setLang("uz")}>
            <Text style={{ opacity: lang === "uz" ? 1 : 0.5 }}>UZ</Text>
          </Pressable>
          <Pressable onPress={() => setLang("ru")}>
            <Text style={{ opacity: lang === "ru" ? 1 : 0.5 }}>RU</Text>
          </Pressable>
        </View>
        <View style={[styles.content, { paddingTop: insets.top + 60 }]}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="basket" size={40} color="#fff" />
            </View>
            <Text style={styles.title}>{t("welcome")}</Text>
            <Text style={styles.subtitle}>
              {isLogin ? t("login") : t("register")}
            </Text>
          </View>

          <View style={styles.form}>
            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t("name")}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t("name")}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t("phone")}</Text>
              <TextInput
                style={styles.input}
                placeholder="+998 90 123 45 67"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t("password")}</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              {!isLogin && passwordErrors.length > 0 && (
                <View style={styles.passwordRequirements}>
                  <Text style={styles.requirementsTitle}>Parol talablari:</Text>
                  {passwordErrors.map((error, index) => (
                    <Text key={index} style={styles.requirementError}>• {error}</Text>
                  ))}
                </View>
              )}
              {!isLogin && passwordErrors.length === 0 && password.length > 0 && (
                <View style={styles.passwordRequirements}>
                  <Text style={styles.requirementSuccess}>✓ Parol barcha talablarga javob beradi</Text>
                </View>
              )}
            </View>

            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {isLogin ? t("login") : t("register")}
                </Text>
              )}
            </Pressable>

            <Pressable
              style={styles.switchBtn}
              onPress={() => setIsLogin(!isLogin)}
            >
              <Text style={styles.switchText}>
                {isLogin
                  ? t("register") + ": " + t("error_fill")
                  : t("login") + "?"}
              </Text>
            </Pressable>
          </View>
          <View style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: Colors.textSecondary, opacity: 0.5 }}>
              Admin: +998901234567 / admin
            </Text>
            <Text style={{ fontSize: 12, color: Colors.textSecondary, opacity: 0.5, marginTop: 4 }}>
              Test: +998901234568 / Test@1234
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (isDarkMode: boolean) => {
  const Colors = getColors(isDarkMode);
  const screenHeight = Dimensions.get('window').height;
  
  return StyleSheet.create({
    container: { flex: 1 },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      minHeight: screenHeight,
    },
    languageSwitch: { flexDirection: "row", justifyContent: "flex-end", padding: 8, gap: 12 },
    content: { flex: 1, paddingHorizontal: 24 },
    header: { alignItems: "center", marginBottom: 40 },
    logoContainer: {
      width: 80,
      height: 80,
      backgroundColor: Colors.primary,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    logo: {
      fontSize: 32,
      color: Colors.textInverse,
    },
    title: {
      fontSize: 28,
      fontFamily: "Poppins_700Bold",
      color: Colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: Colors.textSecondary,
      textAlign: "center",
      marginBottom: 32,
    },
    inputContainer: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      color: Colors.text,
      marginBottom: 8,
      fontFamily: "Poppins_500Medium",
    },
    input: {
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      fontFamily: "Poppins_400Regular",
      color: Colors.text,
      backgroundColor: Colors.card,
    },
    button: {
      backgroundColor: Colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: "center",
      marginBottom: 16,
    },
    buttonText: {
      color: Colors.textInverse,
      fontSize: 16,
      fontFamily: "Poppins_600SemiBold",
    },
    toggleText: {
      color: Colors.primary,
      fontSize: 14,
      fontFamily: "Poppins_500Medium",
    },
    switchBtn: { alignItems: "center", marginTop: 8 },
    switchText: { fontFamily: "Poppins_500Medium", fontSize: 14, color: Colors.primary },
    form: { marginBottom: 24 },
    inputGroup: { marginBottom: 16 },
    label: {
      fontSize: 14,
      color: Colors.text,
      marginBottom: 8,
      fontFamily: "Poppins_500Medium",
    },
    buttonDisabled: { opacity: 0.6 },
    passwordRequirements: {
      marginTop: 8,
      padding: 12,
      backgroundColor: Colors.card,
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: Colors.primary,
    },
    requirementsTitle: {
      fontSize: 12,
      fontFamily: "Poppins_600SemiBold",
      color: Colors.text,
      marginBottom: 4,
    },
    requirementError: {
      fontSize: 11,
      fontFamily: "Poppins_400Regular",
      color: Colors.error,
      marginBottom: 2,
    },
    requirementSuccess: {
      fontSize: 11,
      fontFamily: "Poppins_400Regular",
      color: "#22c55e",
    },
  });
};
