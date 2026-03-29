import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { apiRequest } from "@/lib/query-client";
import { useQueryClient } from "@tanstack/react-query";
import getColors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";

interface ImportError {
  row: number;
  error: string;
}

interface ImportResult {
  inserted: number;
  total: number;
  errors: ImportError[];
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

type Stage = "instructions" | "loading" | "result";

const COLUMNS = [
  { col: "name", req: true, desc: "Mahsulot nomi" },
  { col: "category", req: true, desc: "Kategoriya ID (fruits, vegetables, ...)" },
  { col: "price", req: true, desc: "Narx (so'm, butun son)" },
  { col: "unit", req: true, desc: "Birlik (kg, dona, l, ...)" },
  { col: "image", req: true, desc: "Rasm URL manzili" },
  { col: "originalPrice", req: false, desc: "Asl narx (chegirma bo'lsa)" },
  { col: "badge", req: false, desc: "Yorliq (Yangi, Sale, ...)" },
  { col: "description", req: false, desc: "Tavsif" },
  { col: "brand", req: false, desc: "Brend" },
  { col: "weight", req: false, desc: "Og'irlik (500g, 1kg, ...)" },
  { col: "stockQuantity", req: false, desc: "Ombordagi miqdor (default: 0)" },
];

export default function ExcelImportModal({ visible, onClose }: Props) {
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const styles = getStyles(isDarkMode);
  const queryClient = useQueryClient();

  const [stage, setStage] = useState<Stage>("instructions");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [pickError, setPickError] = useState<string>("");

  const handleClose = () => {
    setStage("instructions");
    setResult(null);
    setFileName("");
    setPickError("");
    onClose();
  };

  const handlePickFile = async () => {
    setPickError("");
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
          "application/octet-stream",
          "*/*",
        ],
        copyToCacheDirectory: true,
      });

      if (picked.canceled) return;

      const asset = picked.assets[0];
      if (!asset) return;

      const ext = asset.name?.split(".").pop()?.toLowerCase();
      if (ext !== "xlsx" && ext !== "xls") {
        setPickError("Faqat .xlsx yoki .xls fayllarni yuklash mumkin");
        return;
      }

      setFileName(asset.name ?? "fayl");
      setStage("loading");

      let fileBase64: string;

      if (Platform.OS === "web") {
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        fileBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            resolve(dataUrl.split(",")[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        fileBase64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      const res = await apiRequest("POST", "/api/products/import", { fileBase64 });
      const data: ImportResult = await res.json();

      if (!res.ok) {
        setPickError((data as any).error ?? "Serverda xatolik yuz berdi");
        setStage("instructions");
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setResult(data);
      setStage("result");
    } catch (err: any) {
      setPickError(err?.message ?? "Fayl yuklashda xatolik yuz berdi");
      setStage("instructions");
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="document-text-outline" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.headerTitle}>Excel orqali import</Text>
            <Pressable style={styles.closeBtn} onPress={handleClose}>
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </Pressable>
          </View>

          {stage === "instructions" && (
            <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionTitle}>Fayl formati</Text>
              <Text style={styles.hint}>
                Excel faylining birinchi qatori ustun sarlavhalari bo'lishi kerak.
                Quyidagi ustunlardan foydalaning:
              </Text>

              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHead]}>
                  <Text style={[styles.tableCell, styles.tableHeadText, { flex: 1.4 }]}>Ustun</Text>
                  <Text style={[styles.tableCell, styles.tableHeadText, { width: 52 }]}>Majburiy</Text>
                  <Text style={[styles.tableCell, styles.tableHeadText, { flex: 2 }]}>Tavsif</Text>
                </View>
                {COLUMNS.map((c) => (
                  <View key={c.col} style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.colName, { flex: 1.4 }]}>{c.col}</Text>
                    <View style={{ width: 52, alignItems: "center" }}>
                      <Ionicons
                        name={c.req ? "checkmark-circle" : "remove-circle-outline"}
                        size={16}
                        color={c.req ? Colors.primary : Colors.textMuted}
                      />
                    </View>
                    <Text style={[styles.tableCell, styles.colDesc, { flex: 2 }]}>{c.desc}</Text>
                  </View>
                ))}
              </View>

              {pickError ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="warning-outline" size={16} color="#EF4444" />
                  <Text style={styles.errorBannerText}>{pickError}</Text>
                </View>
              ) : null}

              <Pressable style={styles.pickBtn} onPress={handlePickFile}>
                <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                <Text style={styles.pickBtnText}>Excel fayl tanlash</Text>
              </Pressable>
            </ScrollView>
          )}

          {stage === "loading" && (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>"{fileName}" yuklanmoqda...</Text>
              <Text style={styles.loadingSubText}>Mahsulotlar tekshirilmoqda va qo'shilmoqda</Text>
            </View>
          )}

          {stage === "result" && result && (
            <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
              <View style={styles.resultSummary}>
                <View style={[styles.resultBox, { backgroundColor: "#DCFCE7" }]}>
                  <Ionicons name="checkmark-circle" size={28} color="#16A34A" />
                  <Text style={[styles.resultCount, { color: "#16A34A" }]}>{result.inserted}</Text>
                  <Text style={styles.resultLabel}>Qo'shildi</Text>
                </View>
                <View style={[styles.resultBox, { backgroundColor: result.errors.length > 0 ? "#FEE2E2" : Colors.card }]}>
                  <Ionicons
                    name={result.errors.length > 0 ? "close-circle" : "checkmark-circle-outline"}
                    size={28}
                    color={result.errors.length > 0 ? "#EF4444" : Colors.textMuted}
                  />
                  <Text style={[styles.resultCount, { color: result.errors.length > 0 ? "#EF4444" : Colors.textMuted }]}>
                    {result.errors.length}
                  </Text>
                  <Text style={styles.resultLabel}>Xatolik</Text>
                </View>
              </View>

              {result.errors.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Xatolik chiqqan qatorlar</Text>
                  {result.errors.map((e) => (
                    <View key={e.row} style={styles.errorRow}>
                      <View style={styles.errorRowNum}>
                        <Text style={styles.errorRowNumText}>{e.row}</Text>
                      </View>
                      <Text style={styles.errorRowText} numberOfLines={3}>{e.error}</Text>
                    </View>
                  ))}
                </>
              )}

              <View style={styles.resultActions}>
                <Pressable
                  style={[styles.pickBtn, { backgroundColor: Colors.card }]}
                  onPress={() => { setStage("instructions"); setResult(null); setFileName(""); }}
                >
                  <Ionicons name="reload-outline" size={18} color={Colors.text} />
                  <Text style={[styles.pickBtnText, { color: Colors.text }]}>Yana import qilish</Text>
                </Pressable>
                <Pressable style={styles.pickBtn} onPress={handleClose}>
                  <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
                  <Text style={styles.pickBtnText}>Tayyor</Text>
                </Pressable>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (isDarkMode: boolean) => {
  const Colors = getColors(isDarkMode);
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: Colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: "90%",
      paddingBottom: Platform.OS === "web" ? 34 : 40,
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: Colors.divider,
      borderRadius: 2,
      alignSelf: "center",
      marginTop: 12,
      marginBottom: 4,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 14,
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: Colors.divider,
    },
    headerIcon: {
      width: 38,
      height: 38,
      borderRadius: 11,
      backgroundColor: isDarkMode ? "rgba(22,163,74,0.15)" : "#DCFCE7",
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      flex: 1,
      fontFamily: "Poppins_700Bold",
      fontSize: 17,
      color: Colors.text,
    },
    closeBtn: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: Colors.card,
      alignItems: "center",
      justifyContent: "center",
    },
    body: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 8,
      gap: 14,
    },
    sectionTitle: {
      fontFamily: "Poppins_700Bold",
      fontSize: 15,
      color: Colors.text,
    },
    hint: {
      fontFamily: "Poppins_400Regular",
      fontSize: 13,
      color: Colors.textSecondary,
      lineHeight: 20,
    },
    table: {
      borderRadius: 12,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: Colors.cardBorder,
    },
    tableRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderBottomWidth: 1,
      borderBottomColor: Colors.divider,
    },
    tableHead: {
      backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "#F9FAFB",
    },
    tableHeadText: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 11,
      color: Colors.textSecondary,
    },
    tableCell: {
      fontFamily: "Poppins_400Regular",
      fontSize: 12,
      color: Colors.text,
    },
    colName: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 12,
      color: Colors.primary,
    },
    colDesc: {
      color: Colors.textSecondary,
    },
    errorBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "#FEE2E2",
      borderRadius: 10,
      padding: 12,
    },
    errorBannerText: {
      fontFamily: "Poppins_400Regular",
      fontSize: 13,
      color: "#EF4444",
      flex: 1,
    },
    pickBtn: {
      backgroundColor: Colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    pickBtnText: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 15,
      color: "#fff",
    },
    centerState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
      paddingHorizontal: 32,
      gap: 14,
    },
    loadingText: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 15,
      color: Colors.text,
      textAlign: "center",
    },
    loadingSubText: {
      fontFamily: "Poppins_400Regular",
      fontSize: 13,
      color: Colors.textSecondary,
      textAlign: "center",
    },
    resultSummary: {
      flexDirection: "row",
      gap: 12,
    },
    resultBox: {
      flex: 1,
      borderRadius: 16,
      padding: 16,
      alignItems: "center",
      gap: 6,
    },
    resultCount: {
      fontFamily: "Poppins_700Bold",
      fontSize: 28,
    },
    resultLabel: {
      fontFamily: "Poppins_500Medium",
      fontSize: 13,
      color: Colors.textSecondary,
    },
    errorRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      backgroundColor: Colors.card,
      borderRadius: 10,
      padding: 12,
    },
    errorRowNum: {
      width: 26,
      height: 26,
      borderRadius: 8,
      backgroundColor: "#FEE2E2",
      alignItems: "center",
      justifyContent: "center",
    },
    errorRowNumText: {
      fontFamily: "Poppins_700Bold",
      fontSize: 12,
      color: "#EF4444",
    },
    errorRowText: {
      flex: 1,
      fontFamily: "Poppins_400Regular",
      fontSize: 12,
      color: Colors.textSecondary,
      lineHeight: 18,
    },
    resultActions: {
      flexDirection: "row",
      gap: 12,
      marginTop: 8,
    },
  });
};
