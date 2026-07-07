import React from "react";
import { View, Text, StyleSheet, Pressable, Platform, Image, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { SUBCATEGORY_IMAGES } from "@/components/subcategoryImages";

const { width: SCREEN_W } = Dimensions.get("window");
const GAP = 10;
const H_PAD = 16;
const TILE_W = (SCREEN_W - H_PAD * 2 - GAP) / 2;
const TILE_H = TILE_W * 0.78;

function SubTile({ sub, onPress }: { sub: any; onPress: () => void }) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const bgColor = sub.bgColor || "#F0FDF4";
  const image = SUBCATEGORY_IMAGES[sub.id];

  return (
    <Animated.View style={[styles.tile, anim]}>
      <Pressable
        style={styles.pressable}
        onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={() => { scale.value = withSpring(0.95, { damping: 11 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
      >
        <View style={[styles.inner, { backgroundColor: bgColor }]}>
          <Text style={styles.name} numberOfLines={2}>
            {sub.name}
          </Text>
          {image && (
            <Image
              source={image}
              style={styles.image}
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

  const rows: any[][] = [];
  for (let i = 0; i < subcategories.length; i += 2) {
    rows.push(subcategories.slice(i, i + 2));
  }

  return (
    <View style={styles.section}>
      {rows.map((row, idx) => (
        <View key={idx} style={styles.row}>
          {row.map((sub: any) => (
            <SubTile
              key={sub.id}
              sub={sub}
              onPress={() => onPressSubcategory(sub)}
            />
          ))}
          {row.length === 1 && <View style={styles.tile} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    gap: GAP,
    marginBottom: GAP,
    paddingHorizontal: H_PAD,
  },
  tile: {
    width: TILE_W,
    height: TILE_H,
    borderRadius: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  pressable: {
    flex: 1,
    borderRadius: 22,
    overflow: "hidden",
  },
  inner: {
    flex: 1,
    borderRadius: 22,
    padding: 14,
    overflow: "hidden",
  },
  name: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    lineHeight: 19,
    color: "#111827",
    maxWidth: "58%",
    zIndex: 1,
  },
  image: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: "68%",
    height: "86%",
  },
});
