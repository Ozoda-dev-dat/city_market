import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert, Platform } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { apiRequest } from "@/lib/query-client";

export default function AddCourierScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name || !phone || !password) return Alert.alert("Xatolik", "Barcha maydonlar majburiy");
    setLoading(true);
    try {
      await apiRequest("POST", "/api/auth/courier", { name, phoneNumber: phone, password });
      Alert.alert("Muvaffaqiyat", "Kuryer muvaffaqiyatli qo'shildi");
      router.back();
    } catch (e) {
      Alert.alert("Xatolik", "Kuryer qo'shishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()}><Ionicons name="arrow-back" size={24} /></Pressable>
        <Text style={styles.title}>Yangi kuryer</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <TextInput style={styles.input} placeholder="Ism familiya" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Telefon raqam" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder="Parol" value={password} onChangeText={setPassword} secureTextEntry />
        <Pressable style={styles.btn} onPress={handleSave} disabled={loading}>
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Saqlash</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", padding: 16, gap: 16 },
  title: { fontFamily: "Poppins_700Bold", fontSize: 20 },
  input: { backgroundColor: Colors.card, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.divider },
  btn: { backgroundColor: Colors.primary, padding: 18, borderRadius: 16, alignItems: "center" },
});
