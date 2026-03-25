import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { View, Text } from "react-native";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#CC0000", alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#fff", fontSize: 28, fontWeight: "bold" }}>REACT WORKS</Text>
      <Text style={{ color: "#fff", fontSize: 16, marginTop: 12 }}>City Market yuklandi</Text>
    </View>
  );
}
