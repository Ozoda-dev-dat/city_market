import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Platform, Alert, ScrollView, TextInput } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/ProductsContext";
import { formatPrice } from "@/constants/data";

export default function AdminCategoriesScreen() {
  const insets = useSafeAreaInsets();
  const { categories, createCategory, deleteCategory } = useApp();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("nutrition");

  const handleCreate = async () => {
    if (!name) return Alert.alert("Xatolik", "Nom kiriting");
    try {
      await createCategory({ 
        id: name.toLowerCase().replace(/\s+/g, '-'), 
        name, 
        icon, 
        color: Colors.primary, 
        bgColor: Colors.primaryLight 
      });
      setName("");
      Alert.alert("Muvaffaqiyat", "Katalog yaratildi");
    } catch (e) {
      Alert.alert("Xatolik", "Yaratishda xatolik yuz berdi");
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Tasdiqlash", "Katalogga tegishli barcha mahsulotlar qoladi, lekin kategoriya o'chadi. Davom etasizmi?", [
      { text: "Yo'q" },
      { text: "Ha", style: 'destructive', onPress: () => deleteCategory(id) }
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()}><Ionicons name="arrow-back" size={24} /></Pressable>
        <Text style={styles.title}>Kataloglar</Text>
      </View>
      
      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Katalog nomi" value={name} onChangeText={setName} />
        <Pressable style={styles.btn} onPress={handleCreate}>
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Yaratish</Text>
        </Pressable>
      </View>

      <FlatList
        data={categories}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: item.bgColor }]}>
              <Ionicons name={item.icon as any} size={24} color={item.color} />
            </View>
            <Text style={styles.name}>{item.name}</Text>
            <Pressable onPress={() => handleDelete(item.id)} style={{ padding: 8 }}>
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", padding: 16, gap: 16 },
  title: { fontFamily: "Poppins_700Bold", fontSize: 20 },
  form: { padding: 16, gap: 12, backgroundColor: Colors.card, margin: 16, borderRadius: 20 },
  input: { backgroundColor: Colors.background, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.divider },
  btn: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: "center" },
  card: { backgroundColor: Colors.card, padding: 16, borderRadius: 16, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 16 },
  iconBox: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  name: { fontFamily: "Poppins_600SemiBold", fontSize: 16 },
});
