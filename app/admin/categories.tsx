import React, { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, Pressable,
  Alert, ScrollView, TextInput
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import getColors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/ProductsContext";

export default function AdminCategoriesScreen() {
  const insets = useSafeAreaInsets();
  const { categories, createCategory, deleteCategory, subcategories, createSubcategory, deleteSubcategory } = useApp();
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const styles = getStyles(isDarkMode);

  const [catName, setCatName] = useState("");
  const [catIcon, setCatIcon] = useState("grid");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [subName, setSubName] = useState<Record<string, string>>({});

  const handleCreateCategory = async () => {
    if (!catName.trim()) return Alert.alert("Xatolik", "Nom kiriting");
    try {
      await createCategory({
        id: catName.trim().toLowerCase().replace(/\s+/g, "-"),
        name: catName.trim(),
        icon: catIcon,
        color: Colors.primary,
        bgColor: Colors.primaryLight,
      });
      setCatName("");
      Alert.alert("Muvaffaqiyat", "Katalog yaratildi");
    } catch {
      Alert.alert("Xatolik", "Yaratishda xatolik yuz berdi");
    }
  };

  const handleDeleteCategory = (id: string) => {
    Alert.alert(
      "Tasdiqlash",
      "Katalog o'chiriladi. Unga tegishli bo'limlar ham o'chadi. Davom etasizmi?",
      [
        { text: "Yo'q" },
        { text: "Ha", style: "destructive", onPress: () => deleteCategory(id) },
      ]
    );
  };

  const handleCreateSubcategory = async (categoryId: string) => {
    const name = (subName[categoryId] || "").trim();
    if (!name) return Alert.alert("Xatolik", "Bo'lim nomini kiriting");
    try {
      await createSubcategory({
        id: `${categoryId}-${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
        name,
        icon: "list",
        color: Colors.primary,
        bgColor: Colors.primaryLight,
        categoryId,
      });
      setSubName(prev => ({ ...prev, [categoryId]: "" }));
    } catch {
      Alert.alert("Xatolik", "Bo'lim yaratishda xatolik yuz berdi");
    }
  };

  const handleDeleteSubcategory = (id: string, name: string) => {
    Alert.alert(
      "Tasdiqlash",
      `"${name}" bo'limi o'chiriladi. Davom etasizmi?`,
      [
        { text: "Yo'q" },
        { text: "Ha", style: "destructive", onPress: () => deleteSubcategory(id) },
      ]
    );
  };

  const getSubs = (categoryId: string) =>
    subcategories.filter((s: any) => s.categoryId === categoryId);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Kataloglar</Text>
      </View>

      <FlatList
        data={categories}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          <View style={styles.form}>
            <Text style={styles.sectionLabel}>Yangi katalog</Text>
            <TextInput
              style={styles.input}
              placeholder="Katalog nomi"
              placeholderTextColor={Colors.textMuted}
              value={catName}
              onChangeText={setCatName}
            />
            <TextInput
              style={styles.input}
              placeholder="Icon: cafe, leaf, water, wine, restaurant, fast-food, nutrition, flash, archive, ice-cream, egg"
              placeholderTextColor={Colors.textMuted}
              value={catIcon}
              onChangeText={setCatIcon}
            />
            <Pressable style={styles.btn} onPress={handleCreateCategory}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Yaratish</Text>
            </Pressable>
          </View>
        }
        contentContainerStyle={{ padding: 16, gap: 10 }}
        renderItem={({ item }) => {
          const isExpanded = expandedId === item.id;
          const subs = getSubs(item.id);
          return (
            <View style={styles.card}>
              <Pressable
                style={styles.cardHeader}
                onPress={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <View style={[styles.iconBox, { backgroundColor: item.bgColor }]}>
                  <Ionicons name={item.icon as any} size={22} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.catName}>{item.name}</Text>
                  <Text style={styles.subCount}>{subs.length} bo'lim</Text>
                </View>
                <Pressable onPress={() => handleDeleteCategory(item.id)} style={{ padding: 8 }}>
                  <Ionicons name="trash-outline" size={20} color={Colors.error} />
                </Pressable>
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={Colors.textMuted}
                />
              </Pressable>

              {isExpanded && (
                <View style={styles.subSection}>
                  {subs.length === 0 && (
                    <Text style={styles.emptyText}>Bo'limlar yo'q</Text>
                  )}
                  {subs.map((sub: any) => (
                    <View key={sub.id} style={styles.subRow}>
                      <Ionicons name="list-outline" size={16} color={Colors.textMuted} />
                      <Text style={styles.subName}>{sub.name}</Text>
                      <Pressable onPress={() => handleDeleteSubcategory(sub.id, sub.name)} style={{ padding: 4 }}>
                        <Ionicons name="trash-outline" size={16} color={Colors.error} />
                      </Pressable>
                    </View>
                  ))}

                  <View style={styles.addSubRow}>
                    <TextInput
                      style={[styles.input, { flex: 1, marginBottom: 0 }]}
                      placeholder="Yangi bo'lim nomi"
                      placeholderTextColor={Colors.textMuted}
                      value={subName[item.id] || ""}
                      onChangeText={val => setSubName(prev => ({ ...prev, [item.id]: val }))}
                    />
                    <Pressable style={styles.addSubBtn} onPress={() => handleCreateSubcategory(item.id)}>
                      <Ionicons name="add" size={20} color="#fff" />
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const getStyles = (isDarkMode: boolean) => {
  const Colors = getColors(isDarkMode);
  return StyleSheet.create({
    header: {
      flexDirection: "row", alignItems: "center",
      padding: 16, gap: 16,
      borderBottomWidth: 1, borderBottomColor: Colors.divider,
    },
    title: { fontFamily: "Poppins_700Bold", fontSize: 20, color: Colors.text },
    sectionLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: Colors.textSecondary, marginBottom: 4 },
    form: {
      backgroundColor: Colors.card, borderRadius: 20,
      padding: 16, gap: 10, marginBottom: 6,
    },
    input: {
      backgroundColor: Colors.background, padding: 13,
      borderRadius: 12, borderWidth: 1, borderColor: Colors.divider,
      color: Colors.text, fontSize: 14,
    },
    btn: {
      backgroundColor: Colors.primary, padding: 15,
      borderRadius: 12, alignItems: "center",
    },
    card: {
      backgroundColor: Colors.card, borderRadius: 16,
      overflow: "hidden",
    },
    cardHeader: {
      flexDirection: "row", alignItems: "center",
      padding: 14, gap: 12,
    },
    iconBox: {
      width: 44, height: 44, borderRadius: 12,
      alignItems: "center", justifyContent: "center",
    },
    catName: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: Colors.text },
    subCount: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
    subSection: {
      borderTopWidth: 1, borderTopColor: Colors.divider,
      padding: 12, gap: 6,
    },
    emptyText: { fontSize: 13, color: Colors.textMuted, textAlign: "center", paddingVertical: 4 },
    subRow: {
      flexDirection: "row", alignItems: "center", gap: 10,
      backgroundColor: Colors.background, borderRadius: 10,
      paddingVertical: 10, paddingHorizontal: 12,
    },
    subName: { flex: 1, fontSize: 14, color: Colors.text },
    addSubRow: { flexDirection: "row", gap: 8, alignItems: "center", marginTop: 4 },
    addSubBtn: {
      backgroundColor: Colors.primary, width: 46, height: 46,
      borderRadius: 12, alignItems: "center", justifyContent: "center",
    },
  });
};
