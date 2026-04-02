import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, Alert, FlatList } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import getColors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { apiRequest } from "@/lib/query-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

function formatPrice(amount: number) {
  return amount.toLocaleString("uz-UZ") + " so'm";
}

export default function AdminPromoCodesScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const styles = getStyles(isDarkMode);

  const { data: promos = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/promo-codes"],
    queryFn: () => apiRequest("GET", "/api/promo-codes").then(res => res.json()),
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/promo-codes", data);
      if (!res.ok) throw new Error("Xatolik");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promo-codes"] });
      setCode("");
      setDiscount("");
      setMinAmount("");
      Alert.alert("Muvaffaqiyat", "Promokod yaratildi");
    },
    onError: () => {
      Alert.alert("Xatolik", "Promokod yaratishda muammo yuz berdi");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/promo-codes/${id}`);
      if (!res.ok) throw new Error("Xatolik");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promo-codes"] });
    },
  });

  const handleCreate = () => {
    if (!code.trim()) return Alert.alert("Xatolik", "Promokod kiriting");
    if (!discount.trim()) return Alert.alert("Xatolik", "Chegirma foizini kiriting");
    const pct = Number(discount);
    if (isNaN(pct) || pct < 1 || pct > 100) return Alert.alert("Xatolik", "Chegirma 1–100% orasida bo'lishi kerak");
    const min = minAmount.trim() ? Number(minAmount.replace(/\s/g, "")) : 0;
    if (isNaN(min) || min < 0) return Alert.alert("Xatolik", "Minimal summani to'g'ri kiriting");
    createMutation.mutate({
      code: code.toUpperCase().replace(/\s/g, ""),
      discountPercent: pct,
      minAmount: min,
    });
  };

  const handleDelete = (id: string, codeStr: string) => {
    Alert.alert(
      "O'chirish",
      `"${codeStr}" promokodini o'chirasizmi?`,
      [
        { text: "Bekor qilish", style: "cancel" },
        { text: "O'chirish", style: "destructive", onPress: () => deleteMutation.mutate(id) },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Promokodlar</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.formTitle}>Yangi promokod</Text>

        <View style={styles.inputRow}>
          <Ionicons name="pricetag-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="KOD (masalan: YOZ123)"
            placeholderTextColor={Colors.textMuted}
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.inputRow}>
          <Ionicons name="wallet-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Minimal summa (so'm, masalan: 150000)"
            placeholderTextColor={Colors.textMuted}
            value={minAmount}
            onChangeText={setMinAmount}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputRow}>
          <Ionicons name="trending-down-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Chegirma % (masalan: 10)"
            placeholderTextColor={Colors.textMuted}
            value={discount}
            onChangeText={setDiscount}
            keyboardType="numeric"
          />
        </View>

        <Pressable style={styles.btn} onPress={handleCreate} disabled={createMutation.isPending}>
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <Text style={styles.btnText}>Yaratish</Text>
        </Pressable>
      </View>

      <FlatList
        data={promos}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.emptyState}>
              <Ionicons name="pricetag-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Promokodlar yo'q</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.promoCard}>
            <View style={styles.promoIconWrap}>
              <Ionicons name="pricetag" size={22} color="#16A34A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.promoCode}>{item.code}</Text>
              <View style={styles.promoMetaRow}>
                <View style={styles.promoChip}>
                  <Text style={styles.promoChipText}>{item.discountPercent}% chegirma</Text>
                </View>
                {item.minAmount > 0 && (
                  <View style={[styles.promoChip, styles.promoChipMin]}>
                    <Text style={styles.promoChipMinText}>
                      min: {formatPrice(item.minAmount)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <Pressable
              style={styles.deleteBtn}
              onPress={() => handleDelete(item.id, item.code)}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const getStyles = (isDarkMode: boolean) => {
  const Colors = getColors(isDarkMode);
  return StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      gap: 16,
    },
    title: {
      fontFamily: "Poppins_700Bold",
      fontSize: 20,
      color: Colors.text,
    },
    form: {
      padding: 16,
      gap: 10,
      backgroundColor: Colors.card,
      margin: 16,
      borderRadius: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    formTitle: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 15,
      color: Colors.text,
      marginBottom: 4,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: Colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: Colors.divider,
      paddingHorizontal: 12,
    },
    inputIcon: {
      marginRight: 8,
    },
    input: {
      flex: 1,
      paddingVertical: 13,
      fontFamily: "Poppins_400Regular",
      fontSize: 14,
      color: Colors.text,
    },
    btn: {
      backgroundColor: "#16A34A",
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
      marginTop: 4,
    },
    btnText: {
      color: "#fff",
      fontFamily: "Poppins_600SemiBold",
      fontSize: 15,
    },
    promoCard: {
      backgroundColor: Colors.card,
      padding: 14,
      borderRadius: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    promoIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: isDarkMode ? "rgba(22,163,74,0.15)" : "#DCFCE7",
      alignItems: "center",
      justifyContent: "center",
    },
    promoCode: {
      fontFamily: "Poppins_700Bold",
      fontSize: 15,
      color: Colors.text,
      marginBottom: 4,
    },
    promoMetaRow: {
      flexDirection: "row",
      gap: 6,
      flexWrap: "wrap",
    },
    promoChip: {
      backgroundColor: isDarkMode ? "rgba(22,163,74,0.18)" : "#DCFCE7",
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    promoChipText: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 12,
      color: "#16A34A",
    },
    promoChipMin: {
      backgroundColor: isDarkMode ? "rgba(59,130,246,0.15)" : "#DBEAFE",
    },
    promoChipMinText: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 12,
      color: "#2563EB",
    },
    deleteBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: isDarkMode ? "rgba(239,68,68,0.12)" : "#FEE2E2",
      alignItems: "center",
      justifyContent: "center",
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 40,
      gap: 10,
    },
    emptyText: {
      fontFamily: "Poppins_400Regular",
      fontSize: 14,
      color: Colors.textMuted,
    },
  });
};
