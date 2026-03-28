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
  Image,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import getColors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/ProductsContext";
import { useTranslation } from "@/lib/I18nProvider";

function LabeledInput({ label, value, onChangeText, placeholder, keyboardType, required }: any) {
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const styles = getStyles(isDarkMode);
  
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}{required && <Text style={{ color: Colors.error }}> *</Text>}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        placeholderTextColor={Colors.textMuted}
      />
    </View>
  );
}

export default function AddProductScreen() {
  const insets = useSafeAreaInsets();
  const { addProduct, updateProduct, products, categories } = useApp();
  const { t, lang } = useTranslation();
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const styles = getStyles(isDarkMode);
  const params = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!params.id;
  const existing = products.find(p => p.id === params.id);

  const [name, setName] = useState(existing?.name ?? "");
  const [category, setCategory] = useState(existing?.category ?? (categories[0]?.id ?? ""));
  const [price, setPrice] = useState(existing?.price ? String(existing.price) : "");
  const [unit, setUnit] = useState(existing?.unit ?? "kg");
  const [image, setImage] = useState(existing?.image ?? "🍎");
  const [imagePreview, setImagePreview] = useState(existing?.image ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [originalPrice, setOriginalPrice] = useState(existing?.originalPrice ? String(existing.originalPrice) : "");
  const [stockQuantity, setStockQuantity] = useState(existing?.stockQuantity ? String(existing.stockQuantity) : "0");
  const [uploading, setUploading] = useState(false);
  const [badge, setBadge] = useState<string>(existing?.badge ?? "");

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission", lang === "uz" ? "Galereyaga kirish ruxsati kerak" : "Требуется доступ к галерее");
        return;
      }

      setUploading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          const base64Image = `data:image/jpeg;base64,${asset.base64}`;
          // Store base64 only for local preview, not for database
          setImagePreview(base64Image);
          // Keep image field as default emoji since we can't store base64 in DB
          if (!image || image.startsWith("data:image")) {
            setImage("📷");
          }
        }
      }
    } catch (error) {
      console.error("Image upload error:", error);
      const errorMessage = error instanceof Error ? error.message : 
        (lang === "uz" ? "Rasmni yuklashda xatolik" : "Ошибка загрузки изображения");
      Alert.alert(
        lang === "uz" ? "Xatolik" : "Ошибка", 
        errorMessage
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name || !price) return Alert.alert(t("error_fill"), t("product_name") + " va " + t("price") + " majburiy");
    
    const productData = {
      name: name.trim(),
      category,
      price: Math.round(Number(price)),
      originalPrice: originalPrice ? Math.round(Number(originalPrice)) : null,
      unit,
      image,
      badge: badge || null,
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
    } catch (e: any) {
      console.error("Save error:", e);
      const errorMsg = e?.message || (lang === "uz" ? "Saqlashda xatolik yuz berdi" : "Ошибка при сохранении");
      Alert.alert(lang === "uz" ? "Xatolik" : "Ошибка", errorMsg);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()}><Ionicons name="arrow-back" size={24} /><Text>{t("back")}</Text></Pressable>
        <Text style={styles.title}>{isEdit ? t("edit") : t("add")}</Text>
        <Pressable onPress={handleSave} style={styles.saveBtn}><Text style={{ color: "#fff" }}>{t("save")}</Text></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <LabeledInput label={t("product_name")} value={name} onChangeText={setName} required />
        <LabeledInput label={t("price")} value={price} onChangeText={setPrice} keyboardType="numeric" required />
        <LabeledInput label={t("original_price")} value={originalPrice} onChangeText={setOriginalPrice} keyboardType="numeric" />
        <LabeledInput label={t("stock_quantity")} value={stockQuantity} onChangeText={setStockQuantity} keyboardType="numeric" required />
        
        <Text style={styles.sectionTitle}>{t("unit")}</Text>
        <View style={styles.chipRow}>
          {["dona", "kg", "litr"].map(u => (
            <Pressable key={u} onPress={() => setUnit(u)} style={[styles.chip, unit === u && styles.chipActive]}>
              <Text style={{ color: unit === u ? "#fff" : Colors.text }}>{t(`unit_${u}`)}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.imageSectionContainer}>
          <Text style={styles.sectionTitle}>{t("image")}</Text>
          <View style={styles.imagePreviewRow}>
            {imagePreview && (imagePreview.startsWith("data:image") || imagePreview.startsWith("http")) ? (
              <Image source={{ uri: imagePreview }} style={styles.imagePreview} />
            ) : image && !image.startsWith("data:image") ? (
              <View style={styles.imagePreviewPlaceholder}>
                <Text style={styles.imagePlaceholderText}>{image}</Text>
              </View>
            ) : (
              <View style={styles.imagePreviewPlaceholder}>
                <Text style={styles.imagePlaceholderText}>📷</Text>
              </View>
            )}
            <Pressable
              style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
              onPress={pickImage}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="image-outline" size={20} color="#fff" />
                  <Text style={styles.uploadBtnText}>{lang === "uz" ? "Galereya" : "Галерея"}</Text>
                </>
              )}
            </Pressable>
          </View>
          <LabeledInput
            label={lang === "uz" ? "yoki emoji/URL" : "или эмодзи/URL"}
            value={image}
            onChangeText={setImage}
            placeholder="🍎 yoki https://..."
          />
        </View>

        <LabeledInput label={t("description")} value={description} onChangeText={setDescription} placeholder="Mahsulot haqida qisqacha ma'lumot" />

        <Text style={styles.sectionTitle}>{lang === "uz" ? "Nishon (badge)" : "Метка"}</Text>
        <View style={styles.chipRow}>
          {[
            { value: "", label: lang === "uz" ? "Yo'q" : "Нет" },
            { value: "new", label: lang === "uz" ? "Yangi" : "Новый" },
            { value: "hot", label: lang === "uz" ? "Ommabop" : "Популярный" },
            { value: "sale", label: lang === "uz" ? "Chegirma" : "Скидка" },
          ].map(opt => (
            <Pressable key={opt.value} onPress={() => setBadge(opt.value)} style={[styles.chip, badge === opt.value && styles.chipActive]}>
              <Text style={{ color: badge === opt.value ? "#fff" : Colors.text }}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t("category")}</Text>
        <View style={styles.chipRow}>
          {categories.map(c => (
            <Pressable key={c.id} onPress={() => setCategory(c.id)} style={[styles.chip, category === c.id && styles.chipActive]}>
              <Text style={{ color: category === c.id ? "#fff" : Colors.text }}>{c.name}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (isDarkMode: boolean) => {
  const Colors = getColors(isDarkMode);
  return StyleSheet.create({
    header: { flexDirection: "row", alignItems: "center", padding: 16, gap: 16 },
    title: { flex: 1, fontFamily: "Poppins_700Bold", fontSize: 20, color: Colors.text },
    saveBtn: { backgroundColor: Colors.primary, padding: 10, borderRadius: 12 },
    inputGroup: { marginBottom: 16 },
    inputLabel: { fontFamily: "Poppins_500Medium", marginBottom: 8, color: Colors.text },
    input: { backgroundColor: Colors.card, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.divider, color: Colors.text },
    sectionTitle: { fontFamily: "Poppins_700Bold", marginVertical: 12, color: Colors.text },
    chipRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    chip: { padding: 10, borderRadius: 20, backgroundColor: Colors.card },
    chipActive: { backgroundColor: Colors.primary },
    imageSectionContainer: { marginVertical: 8 },
    imagePreviewRow: { flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 12 },
    imagePreview: { width: 80, height: 80, borderRadius: 12, backgroundColor: Colors.card },
    imagePreviewPlaceholder: { width: 80, height: 80, borderRadius: 12, backgroundColor: Colors.card, justifyContent: "center", alignItems: "center" },
    imagePlaceholderText: { fontSize: 40 },
    uploadBtn: { flex: 1, backgroundColor: Colors.primary, padding: 16, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
    uploadBtnDisabled: { opacity: 0.6 },
    uploadBtnText: { color: "#fff", fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  });
};
