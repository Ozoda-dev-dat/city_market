import React from "react";
import { View, Text, StyleSheet, Pressable, Platform, Image, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { SUBCATEGORY_IMAGES } from "@/components/subcategoryImages";

const { width: SCREEN_W } = Dimensions.get("window");
const GAP = 10;
const H_PAD = 16;
const TILE_W = (SCREEN_W - H_PAD * 2 - GAP) / 2;
const TILE_W_FULL = SCREEN_W - H_PAD * 2;
const TILE_H = TILE_W * 0.78;
const TILE_H_FULL = TILE_W_FULL * 0.38;

function SubTile({ sub, onPress, full = false }: { sub: any; onPress: () => void; full?: boolean }) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const bgColor = sub.bgColor || "#F0FDF4";
  const image = SUBCATEGORY_IMAGES[sub.id];

  return (
    <Animated.View style={[full ? styles.tileFull : styles.tile, anim]}>
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
          <Text style={[styles.name, full && styles.nameFull]} numberOfLines={2}>
            {sub.name}
          </Text>
          {image && (
            <Image
              source={image}
              style={full ? styles.imageFull : styles.image}
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
  onPressCategory,
}: {
  category: any;
  subcategories: any[];
  allProducts: any[];
  isDarkMode: boolean;
  textColor: string;
  onPressSubcategory: (sub: any) => void;
  onPressCategory?: () => void;
}) {
  if (subcategories.length === 0) return null;

  const rows: any[][] = [];
  for (let i = 0; i < subcategories.length; i += 2) {
    rows.push(subcategories.slice(i, i + 2));
  }

  const accentColor = category?.color ?? "#16A34A";

  return (
    <View style={styles.section}>
      {/* Category header row */}
      <View style={[styles.catHeader, { paddingHorizontal: H_PAD }]}>
        <View style={styles.catHeaderLeft}>
          <View style={[styles.catIconWrap, { backgroundColor: accentColor + "18" }]}>
            <Ionicons
              name={(category?.icon as any) ?? "grid-outline"}
              size={18}
              color={accentColor}
            />
          </View>
          <Text style={[styles.catHeaderName, { color: textColor }]} numberOfLines={1}>
            {category?.name ?? ""}
          </Text>
        </View>
        {onPressCategory && (
          <Pressable
            style={styles.seeAllBtn}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onPressCategory();
            }}
            hitSlop={8}
          >
            <Text style={[styles.seeAllText, { color: accentColor }]}>Barchasini ko'rish</Text>
            <Ionicons name="chevron-forward" size={13} color={accentColor} />
          </Pressable>
        )}
      </View>

      {rows.map((row, idx) => {
        const isSingle = row.length === 1;
        return (
          <View key={idx} style={styles.row}>
            {row.map((sub: any) => (
              <SubTile
                key={sub.id}
                sub={sub}
                full={isSingle}
                onPress={() => onPressSubcategory(sub)}
              />
            ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 6,
  },
  catHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    marginTop: 4,
  },
  catHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  catIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  catHeaderName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    lineHeight: 20,
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  seeAllText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
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
  tileFull: {
    width: TILE_W_FULL,
    height: TILE_H_FULL,
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
  nameFull: {
    fontSize: 16,
    lineHeight: 22,
    maxWidth: "50%",
  },
  image: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: "68%",
    height: "86%",
  },
  imageFull: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: "44%",
    height: "110%",
  },
});
