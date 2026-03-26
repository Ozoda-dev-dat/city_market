import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { Component, PropsWithChildren, useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet, Text, ScrollView } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemedBackground } from "@/components/ThemedBackground";
import { queryClient } from "@/lib/query-client";
import { CartProvider } from "@/context/CartContext";
import { AppProvider } from "@/context/ProductsContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { BiometricProvider } from "@/context/BiometricContext";
import { LocationProvider } from "@/context/LocationContext";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { I18nProvider } from "@/lib/I18nProvider";
import LangToggle from "@/components/LangToggle";
import { NetworkProvider } from "@/components/OfflineComponents";

SplashScreen.preventAutoHideAsync().catch(() => {});

class DiagnosticErrorBoundary extends Component<PropsWithChildren, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error;
      return (
        <View style={{ flex: 1, backgroundColor: "#FF3B30", padding: 20, justifyContent: "center" }}>
          <Text style={{ color: "#fff", fontSize: 22, fontWeight: "bold", marginBottom: 12 }}>
            App Error - City Market
          </Text>
          <Text style={{ color: "#fff", fontSize: 15, marginBottom: 8 }}>
            {err.message || "Unknown error"}
          </Text>
          <ScrollView style={{ maxHeight: 300 }}>
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>
              {err.stack || "No stack trace"}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

function LoadingScreen() {
  return (
    <View style={[styles.loading, { backgroundColor: "#1A9B5C" }]}>
      <ActivityIndicator size="large" color="#ffffff" />
      <Text style={{ color: "#ffffff", marginTop: 12, fontSize: 16 }}>Yuklanmoqda...</Text>
    </View>
  );
}

function RootLayoutNav() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
      <Stack.Screen name="courier" options={{ headerShown: false }} />
      <Stack.Screen name="orders" options={{ headerShown: false }} />
      <Stack.Screen
        name="product/[id]"
        options={{
          headerShown: true,
          headerTitle: "",
          headerTransparent: true,
          headerTintColor: "#fff",
        }}
      />
      <Stack.Screen name="order" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [fontTimedOut, setFontTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFontTimedOut(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const fontsReady = fontsLoaded || !!fontError || fontTimedOut;

  useEffect(() => {
    if (fontsReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsReady]);

  if (!fontsReady) {
    return (
      <DiagnosticErrorBoundary>
        <SafeAreaProvider>
          <View style={{ flex: 1, backgroundColor: "#1A9B5C", alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        </SafeAreaProvider>
      </DiagnosticErrorBoundary>
    );
  }

  return (
    <DiagnosticErrorBoundary>
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <BiometricProvider>
                <LocationProvider>
                  <NetworkProvider>
                    <AuthProvider>
                      <AppProvider>
                        <CartProvider>
                          <GestureHandlerRootView style={{ flex: 1 }}>
                            <I18nProvider>
                              <ThemedBackground>
                                <LangToggle />
                                <RootLayoutNav />
                              </ThemedBackground>
                            </I18nProvider>
                          </GestureHandlerRootView>
                        </CartProvider>
                      </AppProvider>
                    </AuthProvider>
                  </NetworkProvider>
                </LocationProvider>
              </BiometricProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </DiagnosticErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
