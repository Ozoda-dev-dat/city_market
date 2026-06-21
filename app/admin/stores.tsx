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
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import getColors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { apiRequest } from "@/lib/query-client";
import { useAuth } from "@/context/AuthContext";

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()}`;
}

export default function AdminStoresScreen() {
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const Colors = getColors(isDarkMode);
  const styles = getStyles(isDarkMode);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const qc = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newOwnerName, setNewOwnerName] = useState("");
  const [newStoreName, setNewStoreName] = useState("");
  const [creating, setCreating] = useState(false);

  if (!user || user.role !== "admin") {
    return (
      <View style={[styles.container, { paddingTop: topPad + 60, alignItems: "center" }]}>
        <Ionicons name="lock-closed" size={64} color={Colors.error} />
        <Text style={[styles.title, { marginTop: 16 }]}>Ruxsat yo'q</Text>
      </View>
    );
  }

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/stores"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/stores");
      return res.json();
    },
  });

  const stores: any[] = Array.isArray(data) ? data : [];

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest("PATCH", `/api/admin/stores/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/stores"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/stores/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/stores"] }),
  });

  const handleToggle = (store: any) => {
    Alert.alert(
      store.isActive ? "Do'konni o'chirish" : "Do'konni yoqish",
      `"${store.name}" ni ${store.isActive ? "o'chirmoqchimisiz" : "faollashtirmoqchimisiz"}?`,
      [
        { text: "Bekor", style: "cancel" },
        {
          text: "Ha",
          onPress: () => toggleActiveMutation.mutate({ id: store.id, isActive: !store.isActive }),
        },
      ]
    );
  };

  const handleDelete = (store: any) => {
    Alert.alert(
      "O'chirish",
      `"${store.name}" do'konini butunlay o'chirmoqchimisiz?`,
      [
        { text: "Bekor", style: "cancel" },
        {
          text: "O'chirish",
          style: "destructive",
          onPress: () => deleteMutation.mutate(store.id),
        },
      ]
    );
  };

  const handleCreate = async () => {
    if (!newPhone || !newPassword || !newStoreName) {
      Alert.alert("Xatolik", "Barcha maydonlarni to'ldiring");
      return;
    }
    const phone = newPhone.startsWith("+998") ? newPhone : "+998" + newPhone;
    setCreating(true);
    try {
      const res = await apiRequest("POST", "/api/admin/stores", {
        phoneNumber: phone,
        password: newPassword,
        name: newOwnerName || "Do'kon egasi",
        storeName: newStoreName,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        Alert.alert("Xatolik", body.error || "Yaratishda xatolik");
        return;
      }
      Alert.alert("Muvaffaqiyatli", "Do'kon yaratildi");
      setShowCreate(false);
      setNewPhone(""); setNewPassword(""); setNewOwnerName(""); setNewStoreName("");
      qc.invalidateQueries({ queryKey: ["/api/admin/stores"] });
    } catch {
      Alert.alert("Xatolik", "Server bilan bog'lanishda muammo");
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Do'konlar</Text>
        <Pressable style={styles.addBtn} onPress={() => setShowCreate(!showCreate)}>
          <Ionicons name={showCreate ? "close" : "add"} size={22} color="#fff" />
        </Pressable>
      </View>

      {showCreate && (
        <ScrollView style={styles.createBox} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionTitle}>Yangi do'kon yaratish</Text>
          {[
            { label: "Do'kon egasi ismi", value: newOwnerName, onChange: setNewOwnerName, placeholder: "Ism" },
            { label: "Telefon (+998...)", value: newPhone, onChange: setNewPhone, placeholder: "+998901234567", keyboardType: "phone-pad" },
            { label: "Parol", value: newPassword, onChange: setNewPassword, placeholder: "Kamida 8 ta belgi", secure: true },
            { label: "Do'kon nomi", value: newStoreName, onChange: setNewStoreName, placeholder: "Masalan: Sabzavot Bozori" },
          ].map((f) => (
            <View key={f.label} style={{ marginBottom: 12 }}>
              <Text style={styles.fieldLabel}>{f.label}</Text>
              <TextInput
                style={styles.textInput}
                value={f.value}
                onChangeText={f.onChange}
                placeholder={f.placeholder}
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={f.secure}
                keyboardType={(f as any).keyboardType}
              />
            </View>
          ))}
          <Pressable
            style={[styles.createBtn, creating && { opacity: 0.7 }]}
            onPress={handleCreate}
            disabled={creating}
          >
            {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.createBtnText}>Yaratish</Text>}
          </Pressable>
        </ScrollView>
      )}

      {isLoading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : stores.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="storefront-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Do'konlar yo'q</Text>
        </View>
      ) : (
        <FlatList
          data={stores}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: store }) => (
            <View style={styles.storeCard}>
              <View style={styles.storeLeft}>
                <View style={[styles.storeIconBox, { backgroundColor: store.isActive ? Colors.primaryLight : "#F3F4F6" }]}>
                  <Ionicons
                    name="storefront"
                    size={22}
                    color={store.isActive ? Colors.primary : Colors.textMuted}
                  />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.storeName} numberOfLines={1}>{store.name}</Text>
                  <Text style={styles.storeMeta} numberOfLines={1}>
                    {store.phone || "Telefon yo'q"} · {formatDate(store.createdAt)}
                  </Text>
                  {store.address ? (
                    <Text style={styles.storeAddress} numberOfLines={1}>{store.address}</Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.storeActions}>
                <View style={[styles.statusBadge, { backgroundColor: store.isActive ? "#DCFCE7" : "#FEF2F2" }]}>
                  <Text style={[styles.statusText, { color: store.isActive ? "#16A34A" : "#EF4444" }]}>
                    {store.isActive ? "Faol" : "Nofaol"}
                  </Text>
                </View>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: store.isActive ? "#FEF2F2" : "#DCFCE7" }]}
                  onPress={() => handleToggle(store)}
                  disabled={toggleActiveMutation.isPending}
                >
                  <Ionicons
                    name={store.isActive ? "pause-circle-outline" : "play-circle-outline"}
                    size={20}
                    color={store.isActive ? "#EF4444" : "#16A34A"}
                  />
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: "#FEF2F2" }]}
                  onPress={() => handleDelete(store)}
                  disabled={deleteMutation.isPending}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const getStyles = (isDarkMode: boolean) => {
  const Colors = getColors(isDarkMode);
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingBottom: 12,
      gap: 12,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: Colors.card,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      flex: 1,
      fontFamily: "Poppins_700Bold",
      fontSize: 22,
      color: Colors.text,
    },
    addBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: Colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    createBox: {
      marginHorizontal: 16,
      marginBottom: 12,
      backgroundColor: Colors.card,
      borderRadius: 18,
      padding: 16,
      maxHeight: 360,
    },
    sectionTitle: {
      fontFamily: "Poppins_700Bold",
      fontSize: 15,
      color: Colors.text,
      marginBottom: 14,
    },
    fieldLabel: {
      fontFamily: "Poppins_500Medium",
      fontSize: 13,
      color: Colors.textSecondary,
      marginBottom: 6,
    },
    textInput: {
      backgroundColor: isDarkMode ? "#1C1C1E" : "#F5F6F5",
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontFamily: "Poppins_400Regular",
      fontSize: 14,
      color: Colors.text,
    },
    createBtn: {
      backgroundColor: Colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 4,
    },
    createBtnText: {
      fontFamily: "Poppins_700Bold",
      fontSize: 15,
      color: "#fff",
    },
    list: { paddingHorizontal: 16, paddingBottom: 40 },
    storeCard: {
      backgroundColor: Colors.card,
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    storeLeft: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minWidth: 0,
    },
    storeIconBox: {
      width: 44,
      height: 44,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
    },
    storeName: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 14,
      color: Colors.text,
    },
    storeMeta: {
      fontFamily: "Poppins_400Regular",
      fontSize: 12,
      color: Colors.textSecondary,
      marginTop: 2,
    },
    storeAddress: {
      fontFamily: "Poppins_400Regular",
      fontSize: 11,
      color: Colors.textMuted,
      marginTop: 1,
    },
    storeActions: {
      alignItems: "flex-end",
      gap: 6,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    statusText: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 11,
    },
    actionBtn: {
      width: 34,
      height: 34,
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
  });
};
