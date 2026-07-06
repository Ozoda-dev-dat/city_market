import React from "react";
import { View, Text, StyleSheet, Pressable, Platform, Image } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { SUBCATEGORY_IMAGES } from "@/components/subcategoryImages";

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
  width,
  onPress,
}: {
  sub: any;
  width: Width;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const bgColor = sub.bgColor || "#F0FDF4";
  const isHalf = width === "half";
  const image = SUBCATEGORY_IMAGES[sub.id];

  return (
    <Animated.View style={[tileStyles.card, anim]}>
      <Pressable
        style={{ flex: 1 }}
        onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={() => { scale.value = withSpring(0.95, { damping: 11 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
      >
        <View
          style={[
            tileStyles.inner,
            isHalf ? tileStyles.innerHalf : tileStyles.innerThird,
            { backgroundColor: bgColor },
          ]}
        >
          <Text
            style={[
              tileStyles.name,
              isHalf ? tileStyles.nameHalf : tileStyles.nameThird,
            ]}
            numberOfLines={2}
          >
            {sub.name}
          </Text>
          {image && (
            <Image
              source={image}
              style={isHalf ? tileStyles.imageHalf : tileStyles.imageThird}
              resizeMode="contain"
            />
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
          {row.items.map((sub: any) => (
            <SubTile
              key={sub.id}
              sub={sub}
              width={row.width}
              onPress={() => onPressSubcategory(sub)}
            />
          ))}
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
    fontSize: 19,
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
  inner: {
    borderRadius: 20,
    overflow: "hidden",
  },
  innerHalf: {
    padding: 14,
    minHeight: 140,
  },
  innerThird: {
    padding: 10,
    minHeight: 116,
  },
  name: {
    fontFamily: "Poppins_700Bold",
    color: "#111827",
  },
  nameHalf: {
    fontSize: 15,
    lineHeight: 20,
    maxWidth: "62%",
  },
  nameThird: {
    fontSize: 12,
    lineHeight: 16,
    maxWidth: "68%",
  },
  imageHalf: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: "58%",
    height: "62%",
  },
  imageThird: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: "56%",
    height: "56%",
  },
});
