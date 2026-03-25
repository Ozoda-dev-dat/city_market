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

SplashScreen.preventAutoHideAsync();

// Hides the splash only after BOTH fonts AND auth are ready — prevents white screen flash
function SplashController({ fontsReady }: { fontsReady: boolean }) {
  const { isLoading } = useAuth();

  useEffect(() => {
    if (fontsReady && !isLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsReady, isLoading]);

  return null;
}

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      if (!pathname.startsWith("/auth")) {
        router.replace("/auth");
      }
    } else if (user.role === "admin") {
      if (!pathname.startsWith("/admin")) {
        router.replace("/admin");
      }
    } else if (user.role === "courier") {
      if (!pathname.startsWith("/courier")) {
        router.replace("/courier");
      }
    }
  }, [user, isLoading, pathname]);

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
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const fontsReady = fontsLoaded || !!fontError;

  // While fonts are not ready, return null — splash screen stays visible
  if (!fontsReady) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <BiometricProvider>
            <LocationProvider>
              <NetworkProvider>
                <AuthProvider>
                  {/* SplashController lives inside AuthProvider so it can read auth state */}
                  <SplashController fontsReady={fontsReady} />
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
