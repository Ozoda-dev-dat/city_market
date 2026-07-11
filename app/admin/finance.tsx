import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BarChart } from "react-native-chart-kit";
import getColors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { formatPrice } from "@/constants/data";
import { useApp } from "@/context/ProductsContext";
import { useAuth } from "@/context/AuthContext";

type ChartRange = 7 | 30;

export default function AdminFinanceScreen() {
  const insets = useSafeAreaInsets();
  const { orders } = useApp();
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const Colors = getColors(isDarkMode);
  const styles = getStyles(isDarkMode);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (user?.role !== "admin") {
    return (
      <View style={[styles.container, { paddingTop: topPad + 100, alignItems: "center" }]}>
        <Ionicons name="lock-closed" size={64} color={Colors.error} />
        <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 20, marginTop: 16 }}>Ruxsat yo&apos;q</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: Colors.primary }}>Ortga qaytish</Text>
        </Pressable>
      </View>
    );
  }

  const [chartRange, setChartRange] = useState<ChartRange>(7);

  const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0);
  const pendingRevenue = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0);
  const monthlyRevenue = orders
    .filter(o => o.status === 'delivered' && new Date(o.createdAt).getMonth() === new Date().getMonth())
    .reduce((sum, o) => sum + o.total, 0);
  const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
  const totalOrders = orders.length;

  const deliveredOrders = useMemo(
    () => orders.filter(o => o.status === 'delivered'),
    [orders]
  );

  const chartData = useMemo(() => {
    const days: { label: string; total: number }[] = [];
    const now = new Date();
    for (let i = chartRange - 1; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);

      const dayTotal = deliveredOrders
        .filter(o => {
          const created = new Date(o.createdAt);
          return created >= day && created < nextDay;
        })
        .reduce((sum, o) => sum + o.total, 0);

      const label = chartRange === 7
        ? day.toLocaleDateString("uz-UZ", { weekday: "short" })
        : `${day.getDate()}`;

      days.push({ label, total: dayTotal });
    }
    return days;
  }, [deliveredOrders, chartRange]);

  const chartWidth = Dimensions.get("window").width - 32;
  const labelInterval = chartRange === 30 ? 4 : 1;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 12, paddingBottom: Platform.OS === "web" ? 34 : 40 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Moliya</Text>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.statCardPrimary]}>
          <Ionicons name="cash-outline" size={22} color="#fff" />
          <Text style={styles.statValueWhite}>{formatPrice(totalRevenue)}</Text>
          <Text style={styles.statLabelWhite}>Umumiy daromad</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="time-outline" size={22} color="#F59E0B" />
          <Text style={styles.statValue}>{formatPrice(pendingRevenue)}</Text>
          <Text style={styles.statLabel}>Kutilayotgan</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="calendar-outline" size={22} color="#3B82F6" />
          <Text style={styles.statValue}>{formatPrice(monthlyRevenue)}</Text>
          <Text style={styles.statLabel}>Oylik</Text>
        </View>
        <View style={[styles.statCard, { borderColor: "#FEF3C7" }]}>
          <Ionicons name="close-circle-outline" size={22} color="#EF4444" />
          <Text style={[styles.statValue, { color: "#EF4444" }]}>{cancelledOrders}</Text>
          <Text style={styles.statLabel}>Bekor qilingan</Text>
        </View>
      </View>

      <View style={styles.chartHeader}>
        <Text style={styles.sectionTitle}>Daromad tahlili</Text>
        <View style={styles.rangeToggle}>
          {([7, 30] as ChartRange[]).map((range) => (
            <Pressable
              key={range}
              onPress={() => setChartRange(range)}
              style={[
                styles.rangeButton,
                chartRange === range && styles.rangeButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.rangeButtonText,
                  chartRange === range && styles.rangeButtonTextActive,
                ]}
              >
                {range} kun
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {chartData.some(d => d.total > 0) ? (
        <View style={styles.chartCard}>
          <BarChart
            data={{
              labels: chartData.map((d, i) => (i % labelInterval === 0 ? d.label : "")),
              datasets: [{ data: chartData.map(d => d.total) }],
            }}
            width={chartWidth}
            height={220}
            fromZero
            yAxisLabel=""
            yAxisSuffix=""
            withInnerLines={false}
            showValuesOnTopOfBars={false}
            chartConfig={{
              backgroundGradientFrom: Colors.card,
              backgroundGradientTo: Colors.card,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(22, 163, 74, ${opacity})`,
              labelColor: () => Colors.textSecondary,
              propsForBackgroundLines: { stroke: Colors.cardBorder },
              barPercentage: chartRange === 30 ? 0.5 : 0.6,
            }}
            style={{ borderRadius: 12 }}
          />
        </View>
      ) : (
        <View style={styles.chartPlaceholder}>
          <Ionicons name="bar-chart-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.chartText}>Tanlangan davrda daromad yo&apos;q</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Oxirgi tranzaksiyalar</Text>
      {orders.slice(0, 10).filter(o => o.status === 'delivered').map((order) => (
        <View key={order.id} style={styles.transactionCard}>
          <View style={styles.transactionLeft}>
            <View style={[styles.transactionIcon, { backgroundColor: Colors.primaryLight }]}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.transactionTitle}>Buyurtma #{order.id}</Text>
              <Text style={styles.transactionMeta}>
                {new Date(order.createdAt).toLocaleDateString("uz-UZ")}
              </Text>
            </View>
          </View>
          <Text style={styles.transactionAmount}>+{formatPrice(order.total)}</Text>
        </View>
      ))}

      {orders.filter(o => o.status === 'delivered').length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="cash-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Hozircha tranzaksiyalar yo&apos;q</Text>
        </View>
      )}
    </ScrollView>
  );
}

const getStyles = (isDarkMode: boolean) => {
  const Colors = getColors(isDarkMode);
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    content: {
      paddingHorizontal: 16,
    },
    title: {
      fontSize: 28,
      fontFamily: "Poppins_700Bold",
      color: Colors.text,
      marginBottom: 24,
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginBottom: 24,
    },
    statCard: {
      flex: 1,
      minWidth: "45%",
      backgroundColor: Colors.card,
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    statCardPrimary: {
      backgroundColor: Colors.primary,
      borderColor: Colors.primary,
    },
    statValueWhite: {
      fontSize: 18,
      fontFamily: "Poppins_700Bold",
      color: "#fff",
      marginTop: 8,
    },
    statLabelWhite: {
      fontSize: 12,
      fontFamily: "Poppins_500Medium",
      color: "rgba(255,255,255,0.8)",
      marginTop: 4,
    },
    statValue: {
      fontSize: 18,
      fontFamily: "Poppins_700Bold",
      color: Colors.text,
      marginTop: 8,
    },
    statLabel: {
      fontSize: 12,
      fontFamily: "Poppins_500Medium",
      color: Colors.textSecondary,
      marginTop: 4,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: "Poppins_600SemiBold",
      color: Colors.text,
      marginTop: 24,
      marginBottom: 12,
    },
    chartHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    rangeToggle: {
      flexDirection: "row",
      backgroundColor: Colors.card,
      borderRadius: 8,
      padding: 3,
      borderWidth: 1,
      borderColor: Colors.cardBorder,
    },
    rangeButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    rangeButtonActive: {
      backgroundColor: Colors.primary,
    },
    rangeButtonText: {
      fontSize: 12,
      fontFamily: "Poppins_500Medium",
      color: Colors.textSecondary,
    },
    rangeButtonTextActive: {
      color: "#fff",
    },
    chartCard: {
      backgroundColor: Colors.card,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
      marginBottom: 24,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    chartPlaceholder: {
      backgroundColor: Colors.card,
      borderRadius: 12,
      padding: 40,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    chartText: {
      fontSize: 16,
      color: Colors.textMuted,
      marginTop: 8,
    },
    transactionCard: {
      backgroundColor: Colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    transactionLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    transactionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    transactionTitle: {
      fontSize: 16,
      fontFamily: "Poppins_500Medium",
      color: Colors.text,
    },
    transactionMeta: {
      fontSize: 12,
      color: Colors.textSecondary,
      marginTop: 2,
    },
    transactionAmount: {
      fontSize: 16,
      fontFamily: "Poppins_600SemiBold",
      color: Colors.primary,
    },
    emptyState: {
      alignItems: "center",
      padding: 40,
    },
    emptyText: {
      fontSize: 16,
      color: Colors.textMuted,
      marginTop: 8,
    },
  });
};