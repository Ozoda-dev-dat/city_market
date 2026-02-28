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
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useProducts } from "@/context/ProductsContext";
import { Product, formatPrice } from "@/constants/data";

export default function AdminProductsScreen() {
  const insets = useSafeAreaInsets();
  const { products, deleteProduct } = useProducts();
  const [search, setSearch] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (product: Product) => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm(`Delete "${product.name}"? This cannot be undone.`);
      if (confirmed) {
        deleteProduct(product.id);
      }
      return;
    }
    Alert.alert(
      "Delete Product",
      `Are you sure you want to delete "${product.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteProduct(product.id);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </Pressable>
          <Text style={styles.title}>Manage Products</Text>
          <Pressable
            style={styles.addBtn}
            onPress={() => router.push("/admin/add-product")}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
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
        <Text style={styles.count}>{filtered.length} products</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Platform.OS === "web" ? 34 : 40 },
        ]}
        scrollEnabled={!!filtered.length}
        renderItem={({ item }) => (
          <View style={styles.productRow}>
            <View style={styles.productImage}>
              <Text style={styles.productEmoji}>{item.image}</Text>
              {item.id.startsWith("custom_") && (
                <View style={styles.customBadge}>
                  <Text style={styles.customBadgeText}>new</Text>
                </View>
              )}
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.productCategory}>{item.category} · {item.unit}</Text>
              <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
              {item.originalPrice && (
                <Text style={styles.productOldPrice}>{formatPrice(item.originalPrice)}</Text>
              )}
            </View>
            <View style={styles.productActions}>
              <Pressable
                style={styles.editBtn}
                onPress={() =>
                  router.push({
                    pathname: "/admin/add-product",
                    params: { editId: item.id },
                  })
                }
              >
                <Ionicons name="pencil" size={16} color={Colors.primary} />
              </Pressable>
              <Pressable
                style={styles.deleteBtn}
                onPress={() => handleDelete(item)}
              >
                <Ionicons name="trash-outline" size={16} color={Colors.error} />
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cube-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Pressable
              style={styles.addFirstBtn}
              onPress={() => router.push("/admin/add-product")}
            >
              <Text style={styles.addFirstBtnText}>Add First Product</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
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
  addBtn: {
    width: 38,
    height: 38,
    backgroundColor: Colors.primary,
    borderRadius: 12,
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
    gap: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
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
    marginBottom: 4,
  },
  list: { paddingHorizontal: 16 },
  productRow: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    flexDirection: "row",
    padding: 12,
    marginBottom: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  productImage: {
    width: 64,
    height: 64,
    backgroundColor: "#F8FBF8",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  productEmoji: { fontSize: 32 },
  customBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#3B82F6",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  customBadgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 8,
    color: "#fff",
    textTransform: "uppercase",
  },
  productInfo: { flex: 1 },
  productName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: Colors.text,
  },
  productCategory: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    textTransform: "capitalize",
  },
  productPrice: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: Colors.text,
    marginTop: 4,
  },
  productOldPrice: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
    textDecorationLine: "line-through",
  },
  productActions: {
    gap: 8,
    alignItems: "center",
  },
  editBtn: {
    width: 36,
    height: 36,
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    width: 36,
    height: 36,
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: Colors.text,
  },
  addFirstBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  addFirstBtnText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: "#fff",
  },
});
