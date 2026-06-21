import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import getColors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { apiRequest } from "@/lib/query-client";

function formatPrice(amount: number) {
  return new Intl.NumberFormat("uz-UZ").format(amount) + " so'm";
}

const UNITS = ["kg", "g", "l", "ml", "ta", "dona", "litr", "qop", "quti"];

interface ProductForm {
  name: string;
  price: string;
  originalPrice: string;
  unit: string;
  stockQuantity: string;
  description: string;
  image: string;
  imagePreview: string;
  category: string;
  badge: string;
}

const emptyForm = (): ProductForm => ({
  name: "",
  price: "",
  originalPrice: "",
  unit: "kg",
  stockQuantity: "0",
  description: "",
  image: "",
  imagePreview: "",
  category: "",
  badge: "",
});

export default function StoreProductsScreen() {
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const styles = getStyles(isDarkMode);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm());
  const [uploading, setUploading] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/store/products"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/store/products");
      return res.json();
    },
  });

  const { data: catData } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/categories");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/store/products", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/store/products"] });
      qc.invalidateQueries({ queryKey: ["/api/store/stats"] });
      setModalVisible(false);
      setForm(emptyForm());
      setEditingId(null);
    },
    onError: () => Alert.alert("Xatolik", "Mahsulot qo'shishda xatolik"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest("PATCH", `/api/store/products/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/store/products"] });
      setModalVisible(false);
      setForm(emptyForm());
      setEditingId(null);
    },
    onError: () => Alert.alert("Xatolik", "Mahsulotni yangilashda xatolik"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/store/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/store/products"] });
      qc.invalidateQueries({ queryKey: ["/api/store/stats"] });
    },
    onError: () => Alert.alert("Xatolik", "O'chirishda xatolik"),
  });

  const products: any[] = Array.isArray(data) ? data : [];
  const categories: any[] = Array.isArray(catData) ? catData : [];
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm(), category: categories[0]?.id ?? "" });
    setModalVisible(true);
  };

  const openEdit = (product: any) => {
    setEditingId(product.id);
    setForm({
      name: product.name ?? "",
      price: String(product.price ?? ""),
      originalPrice: product.originalPrice ? String(product.originalPrice) : "",
      unit: product.unit ?? "kg",
      stockQuantity: String(product.stockQuantity ?? 0),
      description: product.description ?? "",
      image: product.image ?? "",
      imagePreview: product.image ?? "",
      category: product.category ?? categories[0]?.id ?? "",
      badge: product.badge ?? "",
    });
    setModalVisible(true);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert("O'chirish", `"${name}" ni o'chirmoqchimisiz?`, [
      { text: "Bekor", style: "cancel" },
      {
        text: "O'chirish",
        style: "destructive",
        onPress: () => deleteMutation.mutate(id),
      },
    ]);
  };

  const pickImage = async (source: "gallery" | "camera") => {
    try {
      let result;
      if (source === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Ruxsat kerak", "Kamera ruxsati kerak");
          return;
        }
        setUploading(true);
        result = await ImagePicker.launchCameraAsync({
          aspect: [1, 1],
          quality: 0.8,
          base64: true,
          allowsEditing: true,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Ruxsat kerak", "Galereyaga kirish ruxsati kerak");
          return;
        }
        setUploading(true);
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          aspect: [1, 1],
          quality: 0.8,
          base64: true,
          allowsEditing: true,
        });
      }

      if (!result.canceled && result.assets?.[0]?.base64) {
        const uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setForm((f) => ({ ...f, image: uri, imagePreview: uri }));
      }
    } catch {
      Alert.alert("Xatolik", "Rasm yuklashda xatolik");
    } finally {
      setUploading(false);
    }
  };

  const handleImagePress = () => {
    Alert.alert("Rasm tanlash", "Rasmni qanday qo'shmoqchisiz?", [
      { text: "Kamera", onPress: () => pickImage("camera") },
      { text: "Galereya", onPress: () => pickImage("gallery") },
      { text: "Bekor", style: "cancel" },
    ]);
  };

  const handleSave = () => {
    if (!form.name.trim()) return Alert.alert("Xatolik", "Mahsulot nomi kiritilishi kerak");
    const price = Number(form.price);
    if (!form.price || isNaN(price) || price <= 0) return Alert.alert("Xatolik", "Narx to'g'ri kiritilsin");

    const productData = {
      name: form.name.trim(),
      price: Math.round(price),
      originalPrice: form.originalPrice ? Math.round(Number(form.originalPrice)) : null,
      unit: form.unit,
      stockQuantity: Math.max(0, Math.round(Number(form.stockQuantity) || 0)),
      inStock: Math.round(Number(form.stockQuantity) || 0) > 0,
      description: form.description.trim(),
      image: form.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80",
      category: form.category || categories[0]?.id || "other",
      badge: form.badge || null,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: productData });
    } else {
      createMutation.mutate(productData);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Mahsulotlar</Text>
        <Pressable style={styles.addBtn} onPress={openAdd}>
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Mahsulot qidirish..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="cube-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>
            {search ? "Topilmadi" : "Hali mahsulot yo'q"}
          </Text>
          {!search && (
            <Pressable style={styles.emptyAddBtn} onPress={openAdd}>
              <Text style={styles.emptyAddText}>Birinchi mahsulot qo'shish</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: product }) => (
            <View style={styles.productCard}>
              {product.image ? (
                <Image source={{ uri: product.image }} style={styles.productImage} />
              ) : (
                <View style={[styles.productImage, { backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center" }]}>
                  <Ionicons name="cube-outline" size={28} color={Colors.primary} />
                </View>
              )}
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
                <View style={styles.stockRow}>
                  <Ionicons
                    name={product.inStock ? "checkmark-circle" : "close-circle"}
                    size={14}
                    color={product.inStock ? Colors.primary : Colors.error}
                  />
                  <Text style={[styles.stockText, { color: product.inStock ? Colors.primary : Colors.error }]}>
                    {product.inStock ? `Ombor: ${product.stockQuantity} ${product.unit}` : "Omborda yo'q"}
                  </Text>
                </View>
              </View>
              <View style={styles.productActions}>
                <Pressable style={[styles.actionBtn, { backgroundColor: Colors.primaryLight }]} onPress={() => openEdit(product)}>
                  <Ionicons name="pencil" size={16} color={Colors.primary} />
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: "#FEF2F2" }]}
                  onPress={() => handleDelete(product.id, product.name)}
                  disabled={deleteMutation.isPending}
                >
                  <Ionicons name="trash" size={16} color={Colors.error} />
                </Pressable>
              </View>
            </View>
          )}
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, backgroundColor: Colors.background }}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingId ? "Mahsulotni tahrirlash" : "Yangi mahsulot"}</Text>
            <Pressable onPress={() => { setModalVisible(false); setEditingId(null); setForm(emptyForm()); }}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Pressable style={styles.imagePicker} onPress={handleImagePress} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator color={Colors.primary} />
              ) : form.imagePreview ? (
                <Image source={{ uri: form.imagePreview }} style={styles.imagePickerImg} />
              ) : (
                <>
                  <Ionicons name="image-outline" size={32} color={Colors.textMuted} />
                  <Text style={styles.imagePickerText}>Rasm tanlash</Text>
                </>
              )}
            </Pressable>

            <FormInput label="Mahsulot nomi *" value={form.name} onChangeText={(v: string) => setForm((f) => ({ ...f, name: v }))} placeholder="Masalan: Pomidor" isDarkMode={isDarkMode} />
            <FormInput label="Narx (so'm) *" value={form.price} onChangeText={(v: string) => setForm((f) => ({ ...f, price: v }))} placeholder="15000" isDarkMode={isDarkMode} keyboardType="numeric" />
            <FormInput label="Eski narx (ixtiyoriy)" value={form.originalPrice} onChangeText={(v: string) => setForm((f) => ({ ...f, originalPrice: v }))} placeholder="20000" isDarkMode={isDarkMode} keyboardType="numeric" />

            <Text style={styles.fieldLabel}>O'lchov birligi</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {UNITS.map((u) => (
                  <Pressable
                    key={u}
                    style={[styles.unitChip, form.unit === u && styles.unitChipActive]}
                    onPress={() => setForm((f) => ({ ...f, unit: u }))}
                  >
                    <Text style={[styles.unitChipText, form.unit === u && styles.unitChipTextActive]}>{u}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <FormInput label="Ombor miqdori" value={form.stockQuantity} onChangeText={(v: string) => setForm((f) => ({ ...f, stockQuantity: v }))} placeholder="0" isDarkMode={isDarkMode} keyboardType="numeric" />

            <Text style={styles.fieldLabel}>Kategoriya</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {categories.map((c: any) => (
                  <Pressable
                    key={c.id}
                    style={[styles.unitChip, form.category === c.id && styles.unitChipActive]}
                    onPress={() => setForm((f) => ({ ...f, category: c.id }))}
                  >
                    <Text style={[styles.unitChipText, form.category === c.id && styles.unitChipTextActive]}>
                      {c.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <FormInput label="Tavsif (ixtiyoriy)" value={form.description} onChangeText={(v: string) => setForm((f) => ({ ...f, description: v }))} placeholder="Mahsulot haqida..." isDarkMode={isDarkMode} multiline />

            <Pressable
              style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>{editingId ? "Saqlash" : "Qo'shish"}</Text>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function FormInput({ label, value, onChangeText, placeholder, isDarkMode, keyboardType, multiline }: any) {
  const Colors = getColors(isDarkMode);
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontFamily: "Poppins_500Medium", fontSize: 13, color: Colors.textSecondary, marginBottom: 8 }}>{label}</Text>
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
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );
}

const getStyles = (isDarkMode: boolean) => {
  const Colors = getColors(isDarkMode);
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    title: { fontFamily: "Poppins_700Bold", fontSize: 26, color: Colors.text },
    addBtn: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: Colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: Colors.card,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginHorizontal: 16,
      marginBottom: 12,
      gap: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    },
    searchInput: {
      flex: 1,
      fontFamily: "Poppins_400Regular",
      fontSize: 14,
      color: Colors.text,
    },
    list: { paddingHorizontal: 16, paddingBottom: 40 },
    productCard: {
      backgroundColor: Colors.card,
      borderRadius: 16,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
      gap: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    productImage: {
      width: 64,
      height: 64,
      borderRadius: 12,
      backgroundColor: Colors.background,
    },
    productInfo: { flex: 1, minWidth: 0, gap: 3 },
    productName: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 14,
      color: Colors.text,
    },
    productPrice: {
      fontFamily: "Poppins_700Bold",
      fontSize: 14,
      color: Colors.primary,
    },
    stockRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    stockText: {
      fontFamily: "Poppins_400Regular",
      fontSize: 12,
    },
    productActions: { gap: 8 },
    actionBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyBox: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      paddingBottom: 80,
    },
    emptyText: {
      fontFamily: "Poppins_400Regular",
      fontSize: 15,
      color: Colors.textMuted,
    },
    emptyAddBtn: {
      backgroundColor: Colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 14,
      marginTop: 8,
    },
    emptyAddText: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 14,
      color: "#fff",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "#27272A" : "#F3F4F6",
    },
    modalTitle: {
      fontFamily: "Poppins_700Bold",
      fontSize: 18,
      color: Colors.text,
    },
    modalContent: {
      padding: 16,
      paddingBottom: 60,
    },
    imagePicker: {
      height: 140,
      borderRadius: 16,
      backgroundColor: isDarkMode ? "#1C1C1E" : "#F5F6F5",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
      borderWidth: 2,
      borderStyle: "dashed",
      borderColor: Colors.divider,
      overflow: "hidden",
    },
    imagePickerImg: {
      width: "100%",
      height: "100%",
      borderRadius: 14,
    },
    imagePickerText: {
      fontFamily: "Poppins_400Regular",
      fontSize: 14,
      color: Colors.textMuted,
      marginTop: 8,
    },
    fieldLabel: {
      fontFamily: "Poppins_500Medium",
      fontSize: 13,
      color: Colors.textSecondary,
      marginBottom: 8,
    },
    unitChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: Colors.card,
      borderWidth: 1,
      borderColor: Colors.divider,
    },
    unitChipActive: {
      backgroundColor: Colors.primary,
      borderColor: Colors.primary,
    },
    unitChipText: {
      fontFamily: "Poppins_500Medium",
      fontSize: 13,
      color: Colors.textSecondary,
    },
    unitChipTextActive: { color: "#fff" },
    saveBtn: {
      backgroundColor: Colors.primary,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: "center",
      marginTop: 8,
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
    saveBtnText: {
      fontFamily: "Poppins_700Bold",
      fontSize: 16,
      color: "#fff",
    },
  });
};
