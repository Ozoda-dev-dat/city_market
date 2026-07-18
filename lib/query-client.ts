import { QueryClient, QueryFunction } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

/**
 * Resolves a product image URL — absolute URLs are returned as-is,
 * server-relative paths (starting with "/") are prefixed with the API base URL.
 */
export function resolveImageUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  const base = getApiUrl().replace(/\/$/, "");
  return `${base}${url.startsWith("/") ? url : "/" + url}`;
}

export function getApiUrl(): string {
  // 1. Runtime env var (works in dev/Expo Go)
  let host = process.env.EXPO_PUBLIC_DOMAIN;

  // 2. Baked-in at build time via app.json extra (works in production APK/AAB)
  if (!host) {
    host = Constants.expoConfig?.extra?.apiDomain as string | undefined;
  }

  // 3. Last resort — only for local dev, never reaches production builds
  if (!host) {
    host = "localhost:5000";
  }

  host = host.trim();

  const isLocal =
    host.includes("localhost") ||
    host.includes("127.0.0.1") ||
    host.includes("192.168");
  const protocol = isLocal ? "http" : "https";
  const url = new URL(`${protocol}://${host}`);

  return url.href;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);

  // Get JWT token from AsyncStorage
  let token: string | null = null;
  try {
    const authData = await AsyncStorage.getItem("@freshmart_auth");
    if (authData) {
      const parsed = JSON.parse(authData);
      token = parsed.token;
    }
  } catch (error) {
    console.warn("Failed to get auth token:", error);
  }

  // Create timeout using setTimeout for React Native compatibility
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased to 30 seconds

  try {
    const headers: HeadersInit = {};
    
    // Add content-type for requests with data
    if (data) {
      headers["Content-Type"] = "application/json";
    }
    
    // Add authorization header if token exists
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url.toString(), {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getApiUrl();
    const url = new URL(queryKey.join("/") as string, baseUrl);

    const res = await fetch(url.toString(), {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
