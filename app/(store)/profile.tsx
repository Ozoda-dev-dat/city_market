import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import getColors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/query-client";
import { router } from "expo-router";

export default function StoreProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const styles = getStyles(isDarkMode);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [logo, setLogo] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: store, isLoading } = useQuery({
    queryKey: ["/api/store/profile"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/store/profile");
      return res.json();
    },
  });

  useEffect(() => {
    if (store) {
      setName(store.name ?? "");
      setDescription(store.description ?? "");
      setAddress(store.address ?? "");
      setPhone(store.phone ?? "");
      setLogo(store.logo ?? "");
      setLogoPreview(store.logo ?? "");
    }
  }, [store]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", "/api/store/profile", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/store/profile"] });
      Alert.alert("Muvaffaqiyatli", "Do'kon ma'lumotlari saqlandi");
    },
    onError: () => Alert.alert("Xatolik", "Saqlashda xatolik yuz berdi"),
  });

  const pickLogo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Ruxsat kerak", "Galereyaga kirish ruxsati kerak");
        return;
      }
      setUploading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
        allowsEditing: true,
      });
      if (!result.canceled && result.assets?.[0]?.base64) {
        const uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setLogoPreview(uri);
        setLogo(uri);
      }
    } catch {
      Alert.alert("Xatolik", "Rasm tanlashda xatolik");
    } finally {
      setUploading(false);
    }
  };

  const takePicture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Ruxsat kerak", "Kamera ruxsati kerak");
        return;
      }
      setUploading(true);
      const result = await ImagePicker.launchCameraAsync({
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
        allowsEditing: true,
      });
      if (!result.canceled && result.assets?.[0]?.base64) {
        const uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setLogoPreview(uri);
        setLogo(uri);
      }
    } catch {
      Alert.alert("Xatolik", "Kamera yoqishda xatolik");
    } finally {
      setUploading(false);
    }
  };

  const handleLogoPress = () => {
    Alert.alert("Logotip tanlash", "Rasmni qanday qo'shmoqchisiz?", [
      { text: "Kamera", onPress: takePicture },
      { text: "Galereya", onPress: pickLogo },
      { text: "Bekor", style: "cancel" },
    ]);
  };

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert("Xatolik", "Do'kon nomi kiritilishi kerak");
    setSaving(true);
    try {
      await updateMutation.mutateAsync({ name: name.trim(), description, address, phone, logo });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Chiqish", "Hisobdan chiqmoqchimisiz?", [
      { text: "Bekor", style: "cancel" },
      {
        text: "Ha, chiqish",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/auth");
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: topPad, alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 8, paddingBottom: 60 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Do'kon profili</Text>

      <Pressable style={styles.logoContainer} onPress={handleLogoPress} disabled={uploading}>
        {uploading ? (
          <ActivityIndicator color={Colors.primary} size="large" />
        ) : logoPreview ? (
          <Image source={{ uri: logoPreview }} style={styles.logoImage} />
        ) : (
          <View style={[styles.logoPlaceholder, { backgroundColor: Colors.primaryLight }]}>
            <Ionicons name="storefront-outline" size={40} color={Colors.primary} />
          </View>
        )}
        <View style={[styles.logoBadge, { backgroundColor: Colors.primary }]}>
          <Ionicons name="camera" size={14} color="#fff" />
        </View>
      </Pressable>

      <View style={styles.userInfoBox}>
        <Ionicons name="person-outline" size={16} color={Colors.textMuted} />
        <Text style={styles.userInfoText}>{user?.name} · {user?.phoneNumber}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Do'kon ma'lumotlari</Text>

        <InputField
          label="Do'kon nomi"
          value={name}
          onChangeText={setName}
          placeholder="Masalan: Sabzavot Bozori"
          isDarkMode={isDarkMode}
          required
        />
        <InputField
          label="Tavsif"
          value={description}
          onChangeText={setDescription}
          placeholder="Do'kon haqida qisqacha ma'lumot"
          isDarkMode={isDarkMode}
          multiline
        />
        <InputField
          label="Manzil"
          value={address}
          onChangeText={setAddress}
          placeholder="Do'kon manzili"
          isDarkMode={isDarkMode}
        />
        <InputField
          label="Telefon"
          value={phone}
          onChangeText={setPhone}
          placeholder="+998 XX XXX XX XX"
          isDarkMode={isDarkMode}
          keyboardType="phone-pad"
        />
      </View>

      <Pressable
        style={[styles.saveBtn, saving && { opacity: 0.7 }]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={styles.saveBtnText}>Saqlash</Text>
          </>
        )}
      </Pressable>

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={Colors.error} />
        <Text style={styles.logoutText}>Chiqish</Text>
      </Pressable>
    </ScrollView>
  );
}

function InputField({ label, value, onChangeText, placeholder, isDarkMode, required, multiline, keyboardType }: any) {
  const Colors = getColors(isDarkMode);
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontFamily: "Poppins_500Medium", fontSize: 13, color: Colors.textSecondary, marginBottom: 8 }}>
        {label}{required && <Text style={{ color: Colors.error }}> *</Text>}
      </Text>
      <TextInput
        style={{
          backgroundColor: isDarkMode ? "#1C1C1E" : "#F5F6F5",
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: multiline ? 12 : 14,
          fontFamily: "Poppins_400Regular",
          fontSize: 15,
          color: Colors.text,
          minHeight: multiline ? 80 : undefined,
          textAlignVertical: multiline ? "top" : "center",
        }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        multiline={multiline}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const getStyles = (isDarkMode: boolean) => {
  const Colors = getColors(isDarkMode);
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { paddingHorizontal: 16 },
    title: {
      fontFamily: "Poppins_700Bold",
      fontSize: 26,
      color: Colors.text,
      marginBottom: 24,
    },
    logoContainer: {
      alignSelf: "center",
      marginBottom: 12,
      position: "relative",
    },
    logoImage: {
      width: 100,
      height: 100,
      borderRadius: 24,
      backgroundColor: Colors.card,
    },
    logoPlaceholder: {
      width: 100,
      height: 100,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    logoBadge: {
      position: "absolute",
      bottom: 0,
      right: 0,
      width: 30,
      height: 30,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: Colors.background,
    },
    userInfoBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      justifyContent: "center",
      marginBottom: 28,
    },
    userInfoText: {
      fontFamily: "Poppins_400Regular",
      fontSize: 13,
      color: Colors.textMuted,
    },
    section: {
      backgroundColor: Colors.card,
      borderRadius: 20,
      padding: 16,
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    sectionTitle: {
      fontFamily: "Poppins_700Bold",
      fontSize: 16,
      color: Colors.text,
      marginBottom: 16,
    },
    saveBtn: {
      backgroundColor: Colors.primary,
      borderRadius: 16,
      paddingVertical: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginBottom: 16,
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 14,
      elevation: 8,
    },
    saveBtnText: {
      fontFamily: "Poppins_700Bold",
      fontSize: 16,
      color: "#fff",
    },
    logoutBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: 16,
      backgroundColor: isDarkMode ? "#2A1A1A" : "#FEF2F2",
    },
    logoutText: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 15,
      color: Colors.error,
    },
  });
};
