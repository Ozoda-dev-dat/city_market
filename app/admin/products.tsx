import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { formatPrice } from "@/constants/data";
import { useProducts } from "@/context/ProductsContext";

export default function AdminProductsScreen() {
  const insets = useSafeAreaInsets();
  const { products, deleteProduct } = useProducts();
  const [search, setSearch] = useState("");
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      "Mahsulotni o'chirish",
      `"${name}" ni o'chirmoqchimisiz?`,
      [
        { text: "Bekor qilish", style: "cancel" },
        {
          text: "O'chirish",
          style: "destructive",
          onPress: () => deleteProduct(id),
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: topPad + 12 }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Mahsulotlar</Text>
        <Pressable
          style={styles.addBtn}
          onPress={() => router.push("/admin/add-product")}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Mahsulot qidirish..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>

      <Text style={styles.count}>{filtered.length} ta mahsulot</Text>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === "web" ? 34 : 40 }]}
        scrollEnabled={!!filtered.length}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Mahsulot topilmadi</Text>
            <Pressable
              style={styles.addFirstBtn}
              onPress={() => router.push("/admin/add-product")}
            >
              <Text style={styles.addFirstBtnText}>Birinchi mahsulot qo'shish</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.productRow}>
            <View style={styles.productImageContainer}>
              <Text style={styles.productEmoji}>{item.image}</Text>
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.productCategory}>{item.category}</Text>
              <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
            </View>
            <View style={styles.productActions}>
              <Pressable
                style={styles.editBtn}
                onPress={() =>
                  router.push({ pathname: "/admin/add-product", params: { id: item.id } })
                }
              >
                <Ionicons name="pencil" size={16} color={Colors.primary} />
              </Pressable>
              <Pressable
                style={styles.deleteBtn}
                onPress={() => handleDelete(item.id, item.name)}
              >
                <Ionicons name="trash-outline" size={16} color={Colors.error} />
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 42,
    height: 42,
    backgroundColor: Colors.card,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    flex: 1,
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: Colors.text,
  },
  addBtn: {
    width: 42,
    height: 42,
    backgroundColor: Colors.primary,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: Colors.text,
  },
  count: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  list: {
    gap: 10,
  },
  productRow: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  productImageContainer: {
    width: 60,
    height: 60,
    backgroundColor: "#F8FBF8",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  productEmoji: {
    fontSize: 30,
  },
  productInfo: {
    flex: 1,
    gap: 2,
  },
  productName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: Colors.text,
  },
  productCategory: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: "capitalize",
  },
  productPrice: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: Colors.primary,
  },
  productActions: {
    flexDirection: "row",
    gap: 8,
  },
  editBtn: {
    width: 38,
    height: 38,
    backgroundColor: Colors.primaryLight,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    width: 38,
    height: 38,
    backgroundColor: "#FEF2F2",
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: Colors.text,
  },
  addFirstBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 8,
  },
  addFirstBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
});
