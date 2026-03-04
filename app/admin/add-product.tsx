import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/ProductsContext";
import { CATEGORIES } from "@/constants/data";

function LabeledInput({ label, value, onChangeText, placeholder, keyboardType, required }: any) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}{required && <Text style={{ color: Colors.error }}> *</Text>}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType ?? "default"}
      />
    </View>
  );
}

export default function AddProductScreen() {
  const insets = useSafeAreaInsets();
  const { addProduct, updateProduct, products } = useApp();
  const params = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!params.id;
  const existing = products.find(p => p.id === params.id);

  const [name, setName] = useState(existing?.name ?? "");
  const [category, setCategory] = useState(existing?.category ?? "fruits");
  const [price, setPrice] = useState(existing?.price ? String(existing.price) : "");
  const [unit, setUnit] = useState(existing?.unit ?? "kg");
  const [image, setImage] = useState(existing?.image ?? "🍎");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [originalPrice, setOriginalPrice] = useState(existing?.originalPrice ? String(existing.originalPrice) : "");
  const [stockQuantity, setStockQuantity] = useState(existing?.stockQuantity ? String(existing.stockQuantity) : "0");

  const handleSave = async () => {
    if (!name || !price) return Alert.alert("Xatolik", "Nom va narx majburiy");
    
    const productData = {
      name: name.trim(),
      category,
      price: Math.round(Number(price)),
      originalPrice: originalPrice ? Math.round(Number(originalPrice)) : null,
      unit,
      image,
      description: description.trim(),
      stockQuantity: Math.round(Number(stockQuantity)),
      inStock: Math.round(Number(stockQuantity)) > 0,
    };

    try {
      if (isEdit && existing) {
        await updateProduct({ ...productData, id: existing.id } as any);
      } else {
        await addProduct({ ...productData, id: Date.now().toString() } as any);
      }
      router.back();
    } catch (e) {
      Alert.alert("Xatolik", "Saqlashda xatolik yuz berdi");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()}><Ionicons name="arrow-back" size={24} /></Pressable>
        <Text style={styles.title}>{isEdit ? "Tahrirlash" : "Qo'shish"}</Text>
        <Pressable onPress={handleSave} style={styles.saveBtn}><Text style={{ color: "#fff" }}>Saqlash</Text></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <LabeledInput label="Nom" value={name} onChangeText={setName} required />
        <LabeledInput label="Narx" value={price} onChangeText={setPrice} keyboardType="numeric" required />
        <LabeledInput label="Asl narx (chegirma uchun)" value={originalPrice} onChangeText={setOriginalPrice} keyboardType="numeric" />
        <LabeledInput label="Ombordagi soni" value={stockQuantity} onChangeText={setStockQuantity} keyboardType="numeric" required />
        <Text style={styles.sectionTitle}>Kategoriya</Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map(c => (
            <Pressable key={c.id} onPress={() => setCategory(c.id)} style={[styles.chip, category === c.id && styles.chipActive]}>
              <Text style={{ color: category === c.id ? "#fff" : Colors.text }}>{c.name}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", padding: 16, gap: 16 },
  title: { flex: 1, fontFamily: "Poppins_700Bold", fontSize: 20 },
  saveBtn: { backgroundColor: Colors.primary, padding: 10, borderRadius: 12 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontFamily: "Poppins_500Medium", marginBottom: 8 },
  input: { backgroundColor: Colors.card, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.divider },
  sectionTitle: { fontFamily: "Poppins_700Bold", marginVertical: 12 },
  chipRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: { padding: 10, borderRadius: 20, backgroundColor: Colors.card },
  chipActive: { backgroundColor: Colors.primary },
});
