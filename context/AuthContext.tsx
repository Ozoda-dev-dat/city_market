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
  register: (phoneNumber: string, password: string, name: string, role?: string, storeName?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
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

  const register = async (phoneNumber: string, password: string, name: string, role?: string, storeName?: string) => {
    const body: any = { phoneNumber, password, name };
    if (role) body.role = role;
    if (storeName) body.storeName = storeName;
    const res = await apiRequest("POST", "/api/auth/register", body);
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

  const logout = async () => {
    setUser(null);
    setToken(null);
    wsManager.clearAuth();
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const updateProfile = async (name: string) => {
    const res = await apiRequest("PATCH", "/api/profile", { name });
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
    logout,
    updateProfile,
    isLoading,
  }), [user, token, login, register, logout, updateProfile, isLoading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
