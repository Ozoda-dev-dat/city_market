import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
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

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/auth");
    }
  }, [user, isLoading]);

  if (isLoading) {
    return null;
  }

  if (!user) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" options={{ headerShown: false }} />
      </Stack>
    );
  }

  // Show different layouts based on user role
  if (user.role === "admin") {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen
          name="product/[id]"
          options={{
            headerShown: true,
            headerTitle: "",
            headerTransparent: true,
            headerTintColor: "#fff",
          }}
        />
      </Stack>
    );
  }

  if (user.role === "courier") {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="courier" options={{ headerShown: false }} />
      </Stack>
    );
  }

  // Default customer layout
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
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
      <Stack.Screen name="order/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
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
                        <KeyboardProvider>
                          <I18nProvider>
                            <ThemedBackground>
                              <LangToggle />
                              <RootLayoutNav />
                            </ThemedBackground>
                          </I18nProvider>
                        </KeyboardProvider>
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
  );
}
