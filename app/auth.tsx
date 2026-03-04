import React, { useState } from "react";
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
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!phoneNumber || !password || (!isLogin && !name)) {
      Alert.alert("Xatolik", "Barcha maydonlarni to'ldiring");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(phoneNumber, password);
      } else {
        await register(phoneNumber, password, name);
      }
      router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert("Xatolik", "Ma'lumotlar noto'g'ri kiritildi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={[styles.content, { paddingTop: insets.top + 60 }]}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="basket" size={40} color="#fff" />
          </View>
          <Text style={styles.title}>FreshMart</Text>
          <Text style={styles.subtitle}>
            {isLogin ? "Hisobga kirish" : "Ro'yxatdan o'tish"}
          </Text>
        </View>

        <View style={styles.form}>
          {!isLogin && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ismingiz</Text>
              <TextInput
                style={styles.input}
                placeholder="Ismingizni kiriting"
                value={name}
                onChangeText={setName}
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telefon raqam</Text>
            <TextInput
              style={styles.input}
              placeholder="+998 90 123 45 67"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Parol</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
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
                {isLogin ? "Kirish" : "Ro'yxatdan o'tish"}
              </Text>
            )}
          </Pressable>

          <Pressable
            style={styles.switchBtn}
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={styles.switchText}>
              {isLogin
                ? "Hisobingiz yo'qmi? Ro'yxatdan o'ting"
                : "Hisobingiz bormi? Kirish"}
            </Text>
          </Pressable>
        </View>
        <View style={{ marginTop: 20, alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: Colors.textSecondary, opacity: 0.5 }}>
            Admin: +998901234567 / admin
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, paddingHorizontal: 24 },
  header: { alignItems: "center", marginBottom: 40 },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: Colors.primary,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: { fontFamily: "Poppins_700Bold", fontSize: 28, color: Colors.text },
  subtitle: { fontFamily: "Poppins_400Regular", fontSize: 16, color: Colors.textSecondary },
  form: { gap: 16 },
  inputGroup: { gap: 8 },
  label: { fontFamily: "Poppins_500Medium", fontSize: 14, color: Colors.text },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: "#fff" },
  switchBtn: { alignItems: "center", marginTop: 8 },
  switchText: { fontFamily: "Poppins_500Medium", fontSize: 14, color: Colors.primary },
});
