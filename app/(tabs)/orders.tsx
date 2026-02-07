import { StyleSheet, Text, View, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import Colors from "@/constants/colors";
import { useI18n } from "@/core/i18n/i18n-context";

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={styles.container}>
      <View style={[styles.headerWrap, { paddingTop: topInset + 12 }]}>
        <Text style={styles.headerTitle}>{t.orders.title}</Text>
      </View>
      <View style={styles.emptyState}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="document-text-outline" size={56} color={Colors.textSecondary} />
        </View>
        <Text style={styles.emptyTitle}>{t.orders.empty}</Text>
        <Text style={styles.emptyHint}>{t.orders.emptyHint}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerWrap: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 100,
    gap: 12,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
  },
  emptyHint: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
