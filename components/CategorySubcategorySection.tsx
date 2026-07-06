import React from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

type Width = "half" | "third";

function chunkSubcategories<T>(items: T[]): { items: T[]; width: Width }[] {
  const rows: { items: T[]; width: Width }[] = [];
  if (items.length === 0) return rows;
  if (items.length <= 2) {
    rows.push({ items, width: "half" });
    return rows;
  }
  if (items.length === 3) {
    rows.push({ items, width: "third" });
    return rows;
  }
  if (items.length === 4) {
    rows.push({ items: items.slice(0, 2), width: "half" });
    rows.push({ items: items.slice(2, 4), width: "half" });
    return rows;
  }
  rows.push({ items: items.slice(0, 2), width: "half" });
  const rest = items.slice(2);
  for (let i = 0; i < rest.length; i += 3) {
    rows.push({ items: rest.slice(i, i + 3), width: "third" });
  }
  return rows;
}

function SubTile({
  sub,
  productCount,
  isDarkMode,
  width,
  onPress,
}: {
  sub: any;
  productCount: number;
  isDarkMode: boolean;
  width: Width;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const color = sub.color || "#16A34A";

  const gradStart = color + (isDarkMode ? "40" : "22");
  const gradEnd = color + (isDarkMode ? "08" : "05");
  const isHalf = width === "half";

  return (
    <Animated.View
      style={[
        tileStyles.card,
        isHalf ? tileStyles.cardHalf : tileStyles.cardThird,
        anim,
      ]}
    >
      <Pressable
        style={{ flex: 1 }}
        onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={() => { scale.value = withSpring(0.93, { damping: 11 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
      >
        <View
          style={[
            tileStyles.inner,
            isHalf ? tileStyles.innerHalf : tileStyles.innerThird,
            {
              backgroundColor: isDarkMode ? "rgba(28,28,30,0.9)" : "#fff",
              borderColor: isDarkMode ? color + "30" : color + "28",
            },
          ]}
        >
          <LinearGradient
            colors={[gradStart, gradEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            borderRadius={18}
          />
          <View
            style={[
              tileStyles.iconWrap,
              isHalf ? tileStyles.iconWrapHalf : tileStyles.iconWrapThird,
              { backgroundColor: color + (isDarkMode ? "28" : "18") },
            ]}
          >
            <Ionicons
              name={(sub.icon as any) ?? "grid-outline"}
              size={isHalf ? 26 : 22}
              color={color}
            />
          </View>
          <Text
            style={[
              tileStyles.name,
              isHalf ? tileStyles.nameHalf : tileStyles.nameThird,
              { color: isDarkMode ? "#F4F4F5" : "#111827" },
            ]}
            numberOfLines={2}
          >
            {sub.name}
          </Text>
          {isHalf && (
            <View
              style={[
                tileStyles.countBadge,
                { backgroundColor: color + (isDarkMode ? "28" : "15") },
              ]}
            >
              <Ionicons name="cube-outline" size={10} color={color} />
              <Text style={[tileStyles.countText, { color }]}>{productCount} ta</Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function CategorySubcategorySection({
  category,
  subcategories,
  allProducts,
  isDarkMode,
  textColor,
  onPressSubcategory,
}: {
  category: any;
  subcategories: any[];
  allProducts: any[];
  isDarkMode: boolean;
  textColor: string;
  onPressSubcategory: (sub: any) => void;
}) {
  if (subcategories.length === 0) return null;
  const rows = chunkSubcategories(subcategories);

  return (
    <View style={secStyles.section}>
      <Text style={[secStyles.heading, { color: textColor }]}>{category.name}</Text>
      {rows.map((row, idx) => (
        <View key={idx} style={secStyles.row}>
          {row.items.map((sub: any) => {
            const count = allProducts.filter((p) => p.subcategoryId === sub.id).length;
            return (
              <SubTile
                key={sub.id}
                sub={sub}
                productCount={count}
                isDarkMode={isDarkMode}
                width={row.width}
                onPress={() => onPressSubcategory(sub)}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const secStyles = StyleSheet.create({
  section: {
    marginBottom: 8,
  },
  heading: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
});

const tileStyles = StyleSheet.create({
  card: {
    flex: 1,
  },
  cardHalf: {},
  cardThird: {},
  inner: {
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  innerHalf: {
    padding: 14,
    gap: 8,
    minHeight: 130,
  },
  innerThird: {
    padding: 10,
    gap: 6,
    minHeight: 110,
    alignItems: "center",
  },
  iconWrap: {
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapHalf: {
    width: 46,
    height: 46,
  },
  iconWrapThird: {
    width: 42,
    height: 42,
  },
  name: {
    fontFamily: "Poppins_700Bold",
  },
  nameHalf: {
    fontSize: 13,
    lineHeight: 18,
  },
  nameThird: {
    fontSize: 11,
    lineHeight: 15,
    textAlign: "center",
  },
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: "auto",
  },
  countText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
  },
});
