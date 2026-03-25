import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, router, usePathname } from "expo-router";
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

console.log("[Layout] Module loaded");

SplashScreen.preventAutoHideAsync();
console.log("[Layout] SplashScreen.preventAutoHideAsync called");

function RootLayoutNav() {
  console.log("[Nav] RootLayoutNav rendering");
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  console.log("[Nav] Auth state - isLoading:", isLoading, "user:", !!user, "role:", user?.role);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      if (!pathname.startsWith("/auth")) {
        console.log("[Nav] Redirecting to /auth");
        router.replace("/auth");
      }
    } else if (user.role === "admin") {
      if (!pathname.startsWith("/admin")) {
        console.log("[Nav] Admin redirecting to /admin");
        router.replace("/admin");
      }
    } else if (user.role === "courier") {
      if (!pathname.startsWith("/courier")) {
        console.log("[Nav] Courier redirecting to /courier");
        router.replace("/courier");
      }
    }
  }, [user, isLoading, pathname]);

  if (isLoading) {
    console.log("[Nav] Auth isLoading - returning null");
    return null;
  }

  if (!user) {
    console.log("[Nav] No user - showing auth stack");
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" options={{ headerShown: false }} />
      </Stack>
    );
  }

  console.log("[Nav] User role:", user.role);

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
  console.log("[Layout] RootLayout function called");
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  console.log("[Layout] useFonts result - loaded:", fontsLoaded, "error:", fontError ? String(fontError) : null);

  useEffect(() => {
    console.log("[Layout] Font useEffect - loaded:", fontsLoaded, "error:", !!fontError);
    if (fontsLoaded || fontError) {
      console.log("[Layout] Hiding splash screen");
      SplashScreen.hideAsync().then(() => {
        console.log("[Layout] Splash screen hidden");
      }).catch((e) => {
        console.log("[Layout] hideAsync error:", e);
      });
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    console.log("[Layout] Waiting for fonts - returning null (white screen expected)");
    return null;
  }

  console.log("[Layout] Fonts ready - rendering full tree");

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
