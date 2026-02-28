import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { CATEGORIES } from "@/constants/data";
import { useProducts } from "@/context/ProductsContext";

export default function AdminCategoriesScreen() {
  const insets = useSafeAreaInsets();
  const { products } = useProducts();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const categoriesWithCount = CATEGORIES.map((cat) => ({
    ...cat,
    productCount: products.filter((p) => p.category === cat.id).length,
  }));

  const maxCount = Math.max(...categoriesWithCount.map((c) => c.productCount), 1);

  return (
    <View style={[styles.container, { paddingTop: topPad + 12 }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Kategoriyalar</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{CATEGORIES.length}</Text>
        </View>
      </View>

      <FlatList
        data={categoriesWithCount}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === "web" ? 34 : 40 }]}
        scrollEnabled={true}
        renderItem={({ item }) => (
          <Pressable
            style={styles.catCard}
            onPress={() =>
              router.push({
                pathname: "/admin/add-product",
                params: { category: item.id },
              })
            }
          >
            <View style={[styles.catIconContainer, { backgroundColor: item.bgColor }]}>
              <Ionicons name={item.icon as any} size={28} color={item.color} />
            </View>
            <Text style={styles.catName}>{item.name}</Text>
            <Text style={styles.catCount}>{item.productCount} ta mahsulot</Text>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${(item.productCount / maxCount) * 100}%` as any,
                    backgroundColor: item.color,
                  },
                ]}
              />
            </View>

            <View style={styles.addRow}>
              <Ionicons name="add-circle-outline" size={14} color={item.color} />
              <Text style={[styles.addText, { color: item.color }]}>Mahsulot qo'shish</Text>
            </View>
          </Pressable>
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
    marginBottom: 20,
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
  countBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  countBadgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: Colors.primary,
  },
  list: {
    gap: 12,
  },
  row: {
    gap: 12,
  },
  catCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  catIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  catName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: Colors.text,
  },
  catCount: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.divider,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  addText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
  },
});
