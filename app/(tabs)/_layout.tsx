import { Tabs, Redirect, router } from "expo-router";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View, Pressable, Text } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import getColors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

const TAB_ROUTES = [
  { name: "index",   iconOn: "home",    iconOff: "home-outline"    },
  { name: "cart",    iconOn: "bag",     iconOff: "bag-outline"     },
  { name: "orders",  iconOn: "receipt", iconOff: "receipt-outline" },
  { name: "profile", iconOn: "person",  iconOff: "person-outline"  },
] as const;

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { isDarkMode } = useTheme();
  const { totalItems } = useCart();
  const Colors = getColors(isDarkMode);
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  const bottom = isWeb ? 20 : Math.max(insets.bottom, 8) + 8;
  const bg = isDarkMode ? "#1C1C1E" : "#FFFFFF";

  return (
    <View style={[styles.wrapper, { bottom }]} pointerEvents="box-none">
      <View style={[styles.bar, { backgroundColor: bg }]}>
        {isIOS && (
          <BlurView
            intensity={90}
            tint={isDarkMode ? "dark" : "light"}
            style={[StyleSheet.absoluteFill, { borderRadius: 31, overflow: "hidden" }]}
          />
        )}
        {TAB_ROUTES.map((tab, idx) => {
          const focused = state.index === idx;
          const color = focused ? Colors.primary : Colors.textMuted;
          const isCart = tab.name === "cart";
          const badge = isCart && totalItems > 0 ? totalItems : null;

          return (
            <Pressable
              key={tab.name}
              style={styles.item}
              onPress={() => navigation.navigate(tab.name)}
            >
              <View style={styles.iconWrap}>
                <Ionicons
                  name={focused ? tab.iconOn : tab.iconOff}
                  size={24}
                  color={color}
                />
                {badge !== null && (
                  <View style={[styles.badge, { backgroundColor: Colors.primary }]}>
                    <Text style={styles.badgeText}>{badge > 9 ? "9+" : badge}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 40,
    right: 40,
  },
  bar: {
    height: 62,
    borderRadius: 31,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  item: {
    flex: 1,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 10,
    color: "#fff",
  },
});

function ClassicTabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="cart" />
      <Tabs.Screen name="orders" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

export default function TabLayout() {
  const { user } = useAuth();
  if (!user) return <Redirect href="/auth" />;
  if (user.role === "admin") return <Redirect href="/admin" />;
  if (user.role === "courier") return <Redirect href="/courier" />;
  if (user.role === "store") return <Redirect href="/(store)" />;
  return <ClassicTabLayout />;
}
