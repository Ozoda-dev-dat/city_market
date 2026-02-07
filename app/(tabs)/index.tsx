import { StyleSheet, Text, View, Platform, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import Colors from "@/constants/colors";
import { useI18n } from "@/core/i18n/i18n-context";

function CategoryCard({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.categoryCard, { opacity: pressed ? 0.8 : 1 }]}
    >
      <View style={[styles.categoryIconWrap, { backgroundColor: color + "20" }]}>
        <MaterialCommunityIcons name={icon as any} size={28} color={color} />
      </View>
      <Text style={styles.categoryLabel}>{label}</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { t, locale } = useI18n();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: topInset + 16, paddingBottom: Platform.OS === "web" ? 118 : 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{t.home.title}</Text>
            <Text style={styles.subtitle}>{t.home.subtitle}</Text>
          </View>
          <Pressable style={styles.profileBtn}>
            <Ionicons name="person-circle-outline" size={36} color={Colors.textSecondary} />
          </Pressable>
        </View>

        <Pressable style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
          <Text style={styles.searchPlaceholder}>{t.home.searchPlaceholder}</Text>
        </Pressable>

        <LinearGradient
          colors={[Colors.primary, "#E6A800"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.promoBanner}
        >
          <View style={styles.promoContent}>
            <MaterialCommunityIcons name="lightning-bolt" size={32} color={Colors.background} />
            <View style={styles.promoTextWrap}>
              <Text style={styles.promoTitle}>{t.home.express}</Text>
              <Text style={styles.promoSubtitle}>
                {locale === "uz" ? "30 daqiqada yetkazish" : "Доставка за 30 минут"}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color={Colors.background} />
        </LinearGradient>

        <Text style={styles.sectionTitle}>{t.home.categories}</Text>
        <View style={styles.categoriesGrid}>
          <CategoryCard icon="truck-fast-outline" label={t.home.delivery} color="#4CAF50" />
          <CategoryCard icon="lightning-bolt-outline" label={t.home.express} color={Colors.primary} />
          <CategoryCard icon="food-outline" label={t.home.food} color="#FF5722" />
          <CategoryCard icon="package-variant-closed" label={t.home.packages} color="#2196F3" />
        </View>

        <Text style={styles.sectionTitle}>{t.home.popular}</Text>
        <View style={styles.popularGrid}>
          {[1, 2, 3].map((i) => (
            <Pressable key={i} style={({ pressed }) => [styles.popularCard, { opacity: pressed ? 0.8 : 1 }]}>
              <View style={styles.popularImagePlaceholder}>
                <Ionicons name="cube-outline" size={32} color={Colors.textSecondary} />
              </View>
              <View style={styles.popularInfo}>
                <Text style={styles.popularTitle}>
                  {locale === "uz" ? `Xizmat ${i}` : `Услуга ${i}`}
                </Text>
                <Text style={styles.popularSubtitle}>
                  {locale === "uz" ? "Tez yetkazish" : "Быстрая доставка"}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginTop: 4,
  },
  profileBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
    gap: 10,
  },
  searchPlaceholder: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  promoBanner: {
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  promoContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  promoTextWrap: {
    gap: 2,
  },
  promoTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.background,
  },
  promoSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.background,
    opacity: 0.8,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 28,
  },
  categoryCard: {
    width: "47%",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  categoryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
  },
  popularGrid: {
    gap: 12,
  },
  popularCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    flexDirection: "row",
    overflow: "hidden",
  },
  popularImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: Colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  popularInfo: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
    gap: 4,
  },
  popularTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
  },
  popularSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
});
