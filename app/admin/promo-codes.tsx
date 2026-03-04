import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert, FlatList } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { apiRequest } from "@/lib/query-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function AdminPromoCodesScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("");

  const { data: promos = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/promo-codes"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/promo-codes", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promo-codes"] });
      setCode("");
      setDiscount("");
      Alert.alert("Muvaffaqiyat", "Promokod yaratildi");
    }
  });

  const handleCreate = () => {
    if (!code || !discount) return Alert.alert("Xatolik", "Barcha maydonlarni to'ldiring");
    createMutation.mutate({ code: code.toUpperCase(), discountPercent: Number(discount) });
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()}><Ionicons name="arrow-back" size={24} /></Pressable>
        <Text style={styles.title}>Promokodlar</Text>
      </View>
      
      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="KOD (masalan: SPRING20)" value={code} onChangeText={setCode} autoCapitalize="characters" />
        <TextInput style={styles.input} placeholder="Chegirma % (masalan: 20)" value={discount} onChangeText={setDiscount} keyboardType="numeric" />
        <Pressable style={styles.btn} onPress={handleCreate} disabled={createMutation.isPending}>
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Yaratish</Text>
        </Pressable>
      </View>

      <FlatList
        data={promos}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.promoCard}>
            <View>
              <Text style={styles.promoCode}>{item.code}</Text>
              <Text style={styles.promoDiscount}>{item.discountPercent}% chegirma</Text>
            </View>
            <Ionicons name="pricetag" size={24} color={Colors.primary} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", padding: 16, gap: 16 },
  title: { fontFamily: "Poppins_700Bold", fontSize: 20 },
  form: { padding: 16, gap: 12, backgroundColor: Colors.card, margin: 16, borderRadius: 20 },
  input: { backgroundColor: Colors.background, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.divider },
  btn: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: "center" },
  promoCard: { backgroundColor: Colors.card, padding: 16, borderRadius: 16, marginBottom: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  promoCode: { fontFamily: "Poppins_700Bold", fontSize: 16 },
  promoDiscount: { color: Colors.textSecondary, fontSize: 14 },
});
