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
    actualCount: products.filter((p) => p.category === cat.id).length,
  }));

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </Pressable>
          <Text style={styles.title}>Categories</Text>
        </View>
        <Text style={styles.subtitle}>
          {CATEGORIES.length} categories · {products.length} total products
        </Text>
      </View>

      <FlatList
        data={categoriesWithCount}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === "web" ? 34 : 40 }]}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <Pressable
            style={styles.catCard}
            onPress={() => router.push({ pathname: "/(tabs)/catalog", params: { category: item.id } })}
          >
            <View style={[styles.catIcon, { backgroundColor: item.bgColor }]}>
              <Ionicons name={item.icon as any} size={26} color={item.color} />
            </View>
            <Text style={styles.catName}>{item.name}</Text>
            <View style={styles.catCountRow}>
              <Text style={styles.catCount}>{item.actualCount}</Text>
              <Text style={styles.catCountLabel}> products</Text>
            </View>
            <View style={styles.catProgressBar}>
              <View
                style={[
                  styles.catProgress,
                  {
                    backgroundColor: item.color,
                    width: `${Math.min(100, (item.actualCount / products.length) * 100 * 4)}%`,
                  },
                ]}
              />
            </View>
            <Pressable
              style={styles.addToCatBtn}
              onPress={() =>
                router.push({ pathname: "/admin/add-product", params: { category: item.id } })
              }
            >
              <Ionicons name="add" size={14} color={item.color} />
              <Text style={[styles.addToCatText, { color: item.color }]}>Add</Text>
            </Pressable>
          </Pressable>
        )}
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
    marginBottom: 4,
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
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: Colors.text,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  list: { paddingHorizontal: 16, paddingTop: 4 },
  row: { justifyContent: "space-between", marginBottom: 12 },
  catCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    width: "48%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    gap: 8,
  },
  catIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  catName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: Colors.text,
  },
  catCountRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  catCount: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: Colors.text,
  },
  catCountLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  catProgressBar: {
    height: 4,
    backgroundColor: Colors.divider,
    borderRadius: 2,
    overflow: "hidden",
  },
  catProgress: {
    height: 4,
    borderRadius: 2,
    minWidth: 8,
  },
  addToCatBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.background,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  addToCatText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },
});
