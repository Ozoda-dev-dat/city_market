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
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useProducts } from "@/context/ProductsContext";
import { Product, CATEGORIES } from "@/constants/data";

const BADGE_OPTIONS = [
  { value: "", label: "None" },
  { value: "new", label: "New" },
  { value: "hot", label: "Hot" },
  { value: "sale", label: "Sale" },
];

const UNIT_OPTIONS = ["kg", "pcs", "L", "g", "dozen", "pack"];

const EMOJI_OPTIONS = [
  "🍎", "🍊", "🍋", "🍇", "🍓", "🍌", "🍉", "🥭",
  "🍅", "🥕", "🥔", "🧅", "🥦", "🥬", "🫑", "🥒",
  "🥛", "🧈", "🥚", "🫙", "🧀", "🍗", "🥩", "🐟",
  "🍞", "🥐", "🥨", "🧁", "🍰", "🍫", "🍬", "🍭",
  "🥤", "☕", "🍵", "🧃", "🍊", "💧", "🍺", "🍷",
  "🧂", "🫒", "🌾", "🍯", "🧆", "🥗", "🌮", "🍕",
];

function LabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  required,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "decimal-pad";
  required?: boolean;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        keyboardType={keyboardType ?? "default"}
      />
    </View>
  );
}

export default function AddProductScreen() {
  const insets = useSafeAreaInsets();
  const { addProduct, updateProduct, products } = useProducts();
  const params = useLocalSearchParams<{ editId?: string }>();

  const isEdit = !!params.editId;
  const existingProduct = isEdit ? products.find((p) => p.id === params.editId) : undefined;

  const [name, setName] = useState(existingProduct?.name ?? "");
  const [category, setCategory] = useState(existingProduct?.category ?? "fruits");
  const [price, setPrice] = useState(existingProduct ? String(existingProduct.price) : "");
  const [originalPrice, setOriginalPrice] = useState(
    existingProduct?.originalPrice ? String(existingProduct.originalPrice) : ""
  );
  const [unit, setUnit] = useState(existingProduct?.unit ?? "kg");
  const [image, setImage] = useState(existingProduct?.image ?? "🍎");
  const [badge, setBadge] = useState<string>(existingProduct?.badge ?? "");
  const [description, setDescription] = useState(existingProduct?.description ?? "");
  const [brand, setBrand] = useState(existingProduct?.brand ?? "");
  const [weight, setWeight] = useState(existingProduct?.weight ?? "");
  const [inStock, setInStock] = useState(existingProduct?.inStock ?? true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const validate = () => {
    if (!name.trim()) {
      return "Product name is required";
    }
    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
      return "Valid price is required";
    }
    if (originalPrice.trim() && (isNaN(Number(originalPrice)) || Number(originalPrice) <= 0)) {
      return "Original price must be a valid number";
    }
    if (!description.trim()) {
      return "Description is required";
    }
    return null;
  };

  const handleSave = () => {
    const error = validate();
    if (error) {
      if (Platform.OS === "web") {
        alert(error);
      } else {
        Alert.alert("Validation Error", error);
      }
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const productData: Omit<Product, "id"> = {
      name: name.trim(),
      category,
      price: Math.round(Number(price)),
      originalPrice: originalPrice.trim() ? Math.round(Number(originalPrice)) : undefined,
      unit,
      image,
      badge: badge as Product["badge"] | undefined,
      rating: existingProduct?.rating ?? 4.5,
      description: description.trim(),
      brand: brand.trim() || undefined,
      weight: weight.trim() || undefined,
      inStock,
    };

    if (isEdit && existingProduct) {
      updateProduct({ ...productData, id: existingProduct.id });
    } else {
      addProduct(productData);
    }

    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>{isEdit ? "Edit Product" : "Add Product"}</Text>
        <Pressable style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === "web" ? 34 : 60 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.previewCard}>
          <Pressable style={styles.emojiPreview} onPress={() => setShowEmojiPicker(!showEmojiPicker)}>
            <Text style={styles.previewEmoji}>{image}</Text>
            <View style={styles.emojiEditBadge}>
              <Ionicons name="pencil" size={10} color="#fff" />
            </View>
          </Pressable>
          <Text style={styles.previewHint}>Tap emoji to change</Text>
        </View>

        {showEmojiPicker && (
          <View style={styles.emojiPickerCard}>
            <Text style={styles.emojiPickerTitle}>Choose an Emoji</Text>
            <View style={styles.emojiGrid}>
              {EMOJI_OPTIONS.map((emoji) => (
                <Pressable
                  key={emoji}
                  style={[styles.emojiOption, image === emoji && styles.emojiOptionSelected]}
                  onPress={() => {
                    setImage(emoji);
                    setShowEmojiPicker(false);
                  }}
                >
                  <Text style={styles.emojiOptionText}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <LabeledInput
            label="Product Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Fresh Tomatoes"
            required
          />
          <LabeledInput
            label="Brand"
            value={brand}
            onChangeText={setBrand}
            placeholder="e.g. FreshFarm"
          />
          <LabeledInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the product..."
            required
          />
          <LabeledInput
            label="Weight / Size"
            value={weight}
            onChangeText={setWeight}
            placeholder="e.g. 1 kg"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                style={[styles.chip, category === cat.id && styles.chipActive]}
                onPress={() => setCategory(cat.id)}
              >
                <Text style={[styles.chipText, category === cat.id && styles.chipTextActive]}>
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing (UZS)</Text>
          <LabeledInput
            label="Price"
            value={price}
            onChangeText={setPrice}
            placeholder="e.g. 12000"
            keyboardType="numeric"
            required
          />
          <LabeledInput
            label="Original Price (before discount)"
            value={originalPrice}
            onChangeText={setOriginalPrice}
            placeholder="Leave empty if no discount"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Unit</Text>
          <View style={styles.chipRow}>
            {UNIT_OPTIONS.map((u) => (
              <Pressable
                key={u}
                style={[styles.chip, unit === u && styles.chipActive]}
                onPress={() => setUnit(u)}
              >
                <Text style={[styles.chipText, unit === u && styles.chipTextActive]}>{u}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badge</Text>
          <View style={styles.chipRow}>
            {BADGE_OPTIONS.map((b) => (
              <Pressable
                key={b.value}
                style={[styles.chip, badge === b.value && styles.chipActive]}
                onPress={() => setBadge(b.value)}
              >
                <Text style={[styles.chipText, badge === b.value && styles.chipTextActive]}>
                  {b.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>In Stock</Text>
              <Text style={styles.toggleSub}>Product is available for purchase</Text>
            </View>
            <Pressable
              style={[styles.toggle, inStock && styles.toggleOn]}
              onPress={() => setInStock(!inStock)}
            >
              <View style={[styles.toggleThumb, inStock && styles.toggleThumbOn]} />
            </Pressable>
          </View>
        </View>

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Ionicons name={isEdit ? "checkmark" : "add-circle-outline"} size={20} color="#fff" />
          <Text style={styles.saveButtonText}>{isEdit ? "Save Changes" : "Add Product"}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
    backgroundColor: Colors.background,
  },
  backBtn: {
    width: 38,
    height: 38,
    backgroundColor: Colors.card,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  title: {
    flex: 1,
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: Colors.text,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
  },
  saveBtnText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: "#fff",
  },
  content: { paddingHorizontal: 16, paddingTop: 8 },
  previewCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    alignItems: "center",
    padding: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  emojiPreview: {
    width: 90,
    height: 90,
    backgroundColor: "#F8FBF8",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  previewEmoji: { fontSize: 48 },
  emojiEditBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    backgroundColor: Colors.primary,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  previewHint: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  emojiPickerCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  emojiPickerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.text,
    marginBottom: 12,
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  emojiOption: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#F8FBF8",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiOptionSelected: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  emojiOptionText: { fontSize: 24 },
  section: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: Colors.text,
    marginBottom: 14,
  },
  inputGroup: { marginBottom: 12 },
  inputLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  required: { color: Colors.error },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  chipTextActive: { color: "#fff" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: Colors.text,
  },
  toggleSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  toggle: {
    width: 50,
    height: 28,
    backgroundColor: Colors.cardBorder,
    borderRadius: 14,
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  toggleOn: { backgroundColor: Colors.primary },
  toggleThumb: {
    width: 22,
    height: 22,
    backgroundColor: "#fff",
    borderRadius: 11,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleThumbOn: { alignSelf: "flex-end" },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  saveButtonText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#fff",
  },
});
