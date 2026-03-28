import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { apiRequest } from "@/lib/query-client";
import { useTheme } from "@/context/ThemeContext";
import getColors from "@/constants/colors";

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  order_update:      { icon: "bag-check-outline",       color: "#16A34A", bg: "#F0FDF4" },
  promo:             { icon: "pricetag-outline",         color: "#D97706", bg: "#FFFBEB" },
  product_available: { icon: "storefront-outline",       color: "#2563EB", bg: "#EFF6FF" },
  system:            { icon: "information-circle-outline", color: "#6B7280", bg: "#F9FAFB" },
};
const TYPE_CONFIG_DARK: Record<string, { icon: string; color: string; bg: string }> = {
  order_update:      { icon: "bag-check-outline",        color: "#4ADE80", bg: "rgba(22,163,74,0.18)" },
  promo:             { icon: "pricetag-outline",          color: "#FBBF24", bg: "rgba(217,119,6,0.18)" },
  product_available: { icon: "storefront-outline",        color: "#60A5FA", bg: "rgba(37,99,235,0.18)" },
  system:            { icon: "information-circle-outline", color: "#9CA3AF", bg: "rgba(107,114,128,0.18)" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Hozirgina";
  if (mins < 60) return `${mins} daqiqa oldin`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} soat oldin`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Kecha";
  return `${days} kun oldin`;
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

interface NotifItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationsModal({ visible, onClose }: Props) {
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<NotifItem[]>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/notifications");
      return res.json();
    },
    enabled: visible,
    refetchOnWindowFocus: false,
  });

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/notifications/unread-count");
      return res.json();
    },
    enabled: visible,
    refetchOnWindowFocus: false,
  });

  const markOneMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const unreadCount = unreadData?.count ?? notifications.filter((n) => !n.isRead).length;

  const handlePressItem = useCallback((item: NotifItem) => {
    if (!item.isRead) {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      markOneMutation.mutate(item.id);
    }
  }, []);

  const handleMarkAll = useCallback(() => {
    if (unreadCount === 0) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    markAllMutation.mutate();
  }, [unreadCount]);

  const typeMap = isDarkMode ? TYPE_CONFIG_DARK : TYPE_CONFIG;

  const renderItem = ({ item }: { item: NotifItem }) => {
    const cfg = typeMap[item.type] ?? typeMap.system;
    return (
      <Pressable
        style={[
          ns.item,
          {
            backgroundColor: isDarkMode
              ? item.isRead ? "rgba(28,28,30,0.55)" : "rgba(22,163,74,0.09)"
              : item.isRead ? "#fff" : "#F0FDF4",
            borderColor: isDarkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
          },
        ]}
        onPress={() => handlePressItem(item)}
      >
        <View style={[ns.iconWrap, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
        </View>
        <View style={ns.body}>
          <View style={ns.titleRow}>
            <Text
              style={[ns.title, { color: isDarkMode ? "#F4F4F5" : "#111827" }]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {!item.isRead && <View style={ns.unreadDot} />}
          </View>
          <Text
            style={[ns.message, { color: isDarkMode ? "#A1A1AA" : "#6B7280" }]}
            numberOfLines={2}
          >
            {item.message}
          </Text>
          <Text style={[ns.time, { color: isDarkMode ? "#52525B" : "#9CA3AF" }]}>
            {timeAgo(item.createdAt)}
          </Text>
        </View>
      </Pressable>
    );
  };

  const cardBg = isDarkMode ? "rgba(18,18,20,0.98)" : "rgba(248,250,248,0.99)";
  const handleBg = isDarkMode ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.14)";

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={ns.overlay} onPress={onClose} />
      <View style={[ns.sheet, { backgroundColor: cardBg, paddingBottom: insets.bottom + 8 }]}>
        <View style={[ns.handle, { backgroundColor: handleBg }]} />

        <View style={ns.header}>
          <View style={ns.headerLeft}>
            <Text style={[ns.headerTitle, { color: isDarkMode ? "#F4F4F5" : "#111827" }]}>
              Bildirishnomalar
            </Text>
            {unreadCount > 0 && (
              <View style={ns.countBadge}>
                <Text style={ns.countBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <Pressable
            style={[
              ns.markAllBtn,
              {
                opacity: unreadCount > 0 ? 1 : 0.4,
                backgroundColor: isDarkMode ? "rgba(22,163,74,0.15)" : "#F0FDF4",
              },
            ]}
            onPress={handleMarkAll}
            disabled={unreadCount === 0 || markAllMutation.isPending}
          >
            <Text style={[ns.markAllText, { color: "#16A34A" }]}>Barchasini o'qi</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <View style={ns.center}>
            <ActivityIndicator color="#16A34A" size="large" />
          </View>
        ) : notifications.length === 0 ? (
          <View style={ns.center}>
            <Ionicons
              name="notifications-off-outline"
              size={52}
              color={isDarkMode ? "#3F3F46" : "#D1D5DB"}
            />
            <Text style={[ns.emptyText, { color: isDarkMode ? "#52525B" : "#9CA3AF" }]}>
              Bildirishnomalar yo'q
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={ns.list}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          />
        )}
      </View>
    </Modal>
  );
}

const ns = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "80%",
    minHeight: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
  },
  countBadge: {
    backgroundColor: "#16A34A",
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  countBadgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 11,
    color: "#fff",
  },
  markAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  markAllText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  body: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#16A34A",
    flexShrink: 0,
  },
  message: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 17,
  },
  time: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    marginTop: 2,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 14,
  },
  emptyText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
  },
});
