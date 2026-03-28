import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocation } from "@/context/LocationContext";
import { useTheme } from "@/context/ThemeContext";

const PROMPT_KEY = "@city_market_location_prompted";

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export function LocationPermissionModal({ visible, onDismiss }: Props) {
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { getCurrentLocation, isLoading, location, permissionGranted } = useLocation();
  const [done, setDone] = useState(false);

  const iconScale = useSharedValue(0.6);
  const iconOpacity = useSharedValue(0);
  const cardY = useSharedValue(60);
  const cardOpacity = useSharedValue(0);
  const successScale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setDone(false);
      iconScale.value = withDelay(100, withSpring(1, { damping: 12 }));
      iconOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));
      cardY.value = withDelay(200, withSpring(0, { damping: 14 }));
      cardOpacity.value = withDelay(200, withTiming(1, { duration: 350 }));
    }
  }, [visible]);

  const iconAnim = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
    opacity: iconOpacity.value,
  }));
  const cardAnim = useAnimatedStyle(() => ({
    transform: [{ translateY: cardY.value }],
    opacity: cardOpacity.value,
  }));
  const successAnim = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
  }));

  const handleAllow = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await getCurrentLocation();
    successScale.value = withSequence(
      withSpring(1.2, { damping: 8 }),
      withSpring(1, { damping: 12 })
    );
    setDone(true);
    await AsyncStorage.setItem(PROMPT_KEY, "1");
    setTimeout(() => onDismiss(), 1400);
  };

  const handleSkip = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await AsyncStorage.setItem(PROMPT_KEY, "1");
    onDismiss();
  };

  const bgColors: [string, string, string] = isDarkMode
    ? ["#0a1f12", "#0f1a14", "#0C0C0E"]
    : ["#d4ede0", "#eaf4ee", "#F5F6F5"];

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={styles.root}>
        <LinearGradient colors={bgColors} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />

        <View style={[styles.blob1, { backgroundColor: "rgba(22,163,74,0.13)" }]} />
        <View style={[styles.blob2, { backgroundColor: "rgba(22,163,74,0.07)" }]} />

        <View style={[styles.inner, { paddingTop: topPadding + 24, paddingBottom: insets.bottom + 24 }]}>

          <Animated.View style={[styles.iconWrap, iconAnim]}>
            {done ? (
              <Animated.View style={[styles.successRing, successAnim]}>
                <LinearGradient
                  colors={["#22C55E", "#16A34A"]}
                  style={styles.successGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="checkmark" size={52} color="#fff" />
                </LinearGradient>
              </Animated.View>
            ) : (
              <View style={[
                styles.iconCircle,
                { backgroundColor: isDarkMode ? "rgba(22,163,74,0.16)" : "rgba(22,163,74,0.10)" }
              ]}>
                <LinearGradient
                  colors={["#22C55E", "#16A34A"]}
                  style={styles.iconGrad}
                  start={{ x: 0.2, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="location" size={52} color="#fff" />
                </LinearGradient>
                <View style={styles.pingRing1} />
                <View style={styles.pingRing2} />
              </View>
            )}
          </Animated.View>

          <Animated.View style={[styles.textBlock, cardAnim]}>
            {done ? (
              <>
                <Text style={[styles.title, { color: isDarkMode ? "#F4F4F5" : "#111827" }]}>
                  Joylashuv aniqlandi!
                </Text>
                <Text style={[styles.subtitle, { color: isDarkMode ? "#A1A1AA" : "#6B7280" }]}>
                  Endi siz uchun eng yaqin yetkazib berish vaqtini hisoblaymiz.
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.title, { color: isDarkMode ? "#F4F4F5" : "#111827" }]}>
                  Joylashuvingizni aniqlaylik
                </Text>
                <Text style={[styles.subtitle, { color: isDarkMode ? "#A1A1AA" : "#6B7280" }]}>
                  Mahsulotlarni tez va aniq yetkazib berish uchun joylashuvingizga ruxsat bering.
                </Text>

                <View style={styles.features}>
                  {[
                    { icon: "time-outline",       text: "Tezkor yetkazib berish" },
                    { icon: "navigate-outline",   text: "Aniq manzil aniqlash" },
                    { icon: "shield-checkmark-outline", text: "Ma'lumotlar xavfsiz" },
                  ].map(({ icon, text }) => (
                    <View key={text} style={styles.featureRow}>
                      <View style={[
                        styles.featureIcon,
                        { backgroundColor: isDarkMode ? "rgba(22,163,74,0.18)" : "#F0FDF4" }
                      ]}>
                        <Ionicons name={icon as any} size={18} color="#16A34A" />
                      </View>
                      <Text style={[styles.featureText, { color: isDarkMode ? "#D4D4D8" : "#374151" }]}>
                        {text}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </Animated.View>

          {!done && (
            <Animated.View style={[styles.actions, cardAnim]}>
              <Pressable
                style={({ pressed }) => [styles.allowBtn, { opacity: pressed ? 0.88 : 1 }]}
                onPress={handleAllow}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={["#22C55E", "#16A34A"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.allowGrad}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="locate" size={20} color="#fff" />
                      <Text style={styles.allowText}>Joylashuvni aniqlash</Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>

              <Pressable style={styles.skipBtn} onPress={handleSkip} disabled={isLoading}>
                <Text style={[styles.skipText, { color: isDarkMode ? "#52525B" : "#9CA3AF" }]}>
                  Keyinroq
                </Text>
              </Pressable>
            </Animated.View>
          )}
        </View>
      </View>
    </Modal>
  );
}

async function shouldShowLocationPrompt(hasLocation: boolean): Promise<boolean> {
  if (hasLocation) return false;
  const shown = await AsyncStorage.getItem(PROMPT_KEY);
  return !shown;
}

export { shouldShowLocationPrompt };

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  blob1: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    top: -80,
    right: -60,
  },
  blob2: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    bottom: 80,
    left: -80,
  },
  inner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 32,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  iconGrad: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 14,
  },
  pingRing1: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1.5,
    borderColor: "rgba(22,163,74,0.3)",
  },
  pingRing2: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: "rgba(22,163,74,0.15)",
  },
  successRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  successGrad: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 14,
  },
  textBlock: {
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 26,
    textAlign: "center",
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  features: {
    width: "100%",
    gap: 10,
    marginTop: 8,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
  },
  actions: {
    width: "100%",
    gap: 14,
    alignItems: "center",
  },
  allowBtn: {
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 16,
    elevation: 10,
  },
  allowGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 58,
    borderRadius: 18,
  },
  allowText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#fff",
  },
  skipBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  skipText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
  },
});
