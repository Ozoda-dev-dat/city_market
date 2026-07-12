import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "@/shared/schema";
import { apiRequest } from "@/lib/query-client";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { wsManager } from "@/lib/websocket";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (phoneNumber: string, password: string) => Promise<void>;
  register: (phoneNumber: string, password: string, name: string, role?: string, storeName?: string, storeAddress?: string) => Promise<void>;
  sendOtp: (phoneNumber: string, purpose?: string) => Promise<{ devCode?: string }>;
  verifyOtpRegister: (phoneNumber: string, code: string, name: string, role?: string, storeName?: string, storeAddress?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
  updatePaymentMethod: (preferredPaymentMethod: string) => Promise<void>;
  setNotificationsEnabled: (notificationsEnabled: boolean) => Promise<void>;
  registerPushToken: (pushToken: string) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const AUTH_STORAGE_KEY = "@freshmart_auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { handleError } = useErrorHandler({ component: 'AuthProvider' });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const authData = JSON.parse(stored);
        setUser(authData.user);
        setToken(authData.token);
        if (authData.token) wsManager.authenticate(authData.token);
      }
    } catch (e) {
      handleError(e instanceof Error ? e : new Error('Failed to load user data'), 'load_user');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (phoneNumber: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/login", { phoneNumber, password });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(JSON.stringify(body));
    }
    const authData = await res.json();
    setUser(authData.user);
    setToken(authData.token);
    if (authData.token) wsManager.authenticate(authData.token);
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
  };

  const register = async (phoneNumber: string, password: string, name: string, role?: string, storeName?: string, storeAddress?: string) => {
    const body: any = { phoneNumber, password, name };
    if (role) body.role = role;
    if (storeName) body.storeName = storeName;
    if (storeAddress) body.storeAddress = storeAddress;
    const res = await apiRequest("POST", "/api/auth/register", body);
    if (!res.ok) {
      const body2 = await res.json().catch(() => ({}));
      throw new Error(JSON.stringify(body2));
    }
    const authData = await res.json();
    setUser(authData.user);
    setToken(authData.token);
    if (authData.token) wsManager.authenticate(authData.token);
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
  };

  const sendOtp = async (phoneNumber: string, purpose = "register"): Promise<{ devCode?: string }> => {
    const res = await apiRequest("POST", "/api/auth/send-otp", { phoneNumber, purpose });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Kod yuborishda xatolik");
    }
    const data = await res.json();
    return { devCode: data.devCode };
  };

  const verifyOtpRegister = async (phoneNumber: string, code: string, name: string, role?: string, storeName?: string, storeAddress?: string) => {
    const body: any = { phoneNumber, code, name };
    if (role) body.role = role;
    if (storeName) body.storeName = storeName;
    if (storeAddress) body.storeAddress = storeAddress;
    const res = await apiRequest("POST", "/api/auth/verify-otp-register", body);
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || "Tasdiqlashda xatolik");
    }
    const authData = await res.json();
    setUser(authData.user);
    setToken(authData.token);
    if (authData.token) wsManager.authenticate(authData.token);
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    wsManager.clearAuth();
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const updateProfile = async (name: string) => {
    await patchProfile({ name });
  };

  const updatePaymentMethod = async (preferredPaymentMethod: string) => {
    await patchProfile({ preferredPaymentMethod });
  };

  const setNotificationsEnabled = async (notificationsEnabled: boolean) => {
    await patchProfile({ notificationsEnabled });
  };

  const registerPushToken = async (pushToken: string) => {
    await persistUser("POST", "/api/push-token", { pushToken });
  };

  const patchProfile = async (fields: Record<string, string | boolean>) => {
    await persistUser("PATCH", "/api/profile", fields);
  };

  const persistUser = async (method: string, endpoint: string, fields: Record<string, unknown>) => {
    const res = await apiRequest(method, endpoint, fields);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(JSON.stringify(body));
    }
    const data = await res.json();
    const updatedUser = data.user;
    setUser(updatedUser);
    const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      const authData = JSON.parse(stored);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ ...authData, user: updatedUser }));
    }
  };

  const value = useMemo(() => ({
    user,
    token,
    login,
    register,
    sendOtp,
    verifyOtpRegister,
    logout,
    updateProfile,
    updatePaymentMethod,
    setNotificationsEnabled,
    registerPushToken,
    isLoading,
  }), [user, token, login, register, sendOtp, verifyOtpRegister, logout, updateProfile, updatePaymentMethod, setNotificationsEnabled, registerPushToken, isLoading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
