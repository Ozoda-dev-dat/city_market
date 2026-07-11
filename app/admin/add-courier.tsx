import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert, Platform } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import getColors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { apiRequest } from "@/lib/query-client";

const VEHICLE_TYPES: { value: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: "on_foot", label: "Piyoda", icon: "walk-outline" },
  { value: "bike", label: "Velosiped", icon: "bicycle-outline" },
  { value: "scooter", label: "Moped", icon: "speedometer-outline" },
  { value: "car", label: "Avtomobil", icon: "car-outline" },
];

const COURIER_STATUSES: { value: string; label: string }[] = [
  { value: "active", label: "Faol" },
  { value: "on_leave", label: "Ta'tilda" },
  { value: "suspended", label: "To'xtatilgan" },
];

export default function AddCourierScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [vehicleType, setVehicleType] = useState("on_foot");
  const [courierStatus, setCourierStatus] = useState("active");
  const [loading, setLoading] = useState(false);
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const styles = getStyles(isDarkMode);

  const handleSave = async () => {
    if (!name || !phone || !password) return Alert.alert("Xatolik", "Barcha maydonlar majburiy");
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/courier", { name, phoneNumber: phone, password, vehicleType, courierStatus });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Kuryer qo'shishda xatolik yuz berdi");
      }
      Alert.alert("Muvaffaqiyat", "Kuryer muvaffaqiyatli qo'shildi");
      router.back();
    } catch (e: any) {
      Alert.alert("Xatolik", e?.message || "Kuryer qo'shishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={Colors.text} /></Pressable>
        <Text style={styles.title}>Yangi kuryer</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <TextInput style={styles.input} placeholder="Ism familiya" placeholderTextColor={Colors.textMuted} value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Telefon raqam" placeholderTextColor={Colors.textMuted} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder="Parol" placeholderTextColor={Colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry />

        <Text style={styles.sectionLabel}>Transport turi</Text>
        <View style={styles.optionRow}>
          {VEHICLE_TYPES.map((v) => (
            <Pressable
              key={v.value}
              style={[styles.optionChip, vehicleType === v.value && styles.optionChipActive]}
              onPress={() => setVehicleType(v.value)}
            >
              <Ionicons name={v.icon} size={18} color={vehicleType === v.value ? "#fff" : Colors.text} />
              <Text style={[styles.optionChipText, vehicleType === v.value && styles.optionChipTextActive]}>{v.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Status</Text>
        <View style={styles.optionRow}>
          {COURIER_STATUSES.map((s) => (
            <Pressable
              key={s.value}
              style={[styles.optionChip, courierStatus === s.value && styles.optionChipActive]}
              onPress={() => setCourierStatus(s.value)}
            >
              <Text style={[styles.optionChipText, courierStatus === s.value && styles.optionChipTextActive]}>{s.label}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.btn} onPress={handleSave} disabled={loading}>
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Saqlash</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const getStyles = (isDarkMode: boolean) => {
  const Colors = getColors(isDarkMode);
  return StyleSheet.create({
    header: { flexDirection: "row", alignItems: "center", padding: 16, gap: 16 },
    title: { fontFamily: "Poppins_700Bold", fontSize: 20, color: Colors.text },
    input: { backgroundColor: Colors.card, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.divider, color: Colors.text },
    sectionLabel: { fontFamily: "Poppins_500Medium", fontSize: 14, color: Colors.textSecondary, marginTop: -8 },
    optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    optionChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: Colors.divider,
      backgroundColor: Colors.card,
    },
    optionChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    optionChipText: { fontFamily: "Poppins_500Medium", fontSize: 13, color: Colors.text },
    optionChipTextActive: { color: "#fff" },
    btn: { backgroundColor: Colors.primary, padding: 18, borderRadius: 16, alignItems: "center" },
  });
};
