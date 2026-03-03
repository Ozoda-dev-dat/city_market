import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "@/shared/schema";
import { apiRequest } from "@/lib/query-client";

interface AuthContextValue {
  user: User | null;
  login: (phoneNumber: string, password: string) => Promise<void>;
  register: (phoneNumber: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const AUTH_STORAGE_KEY = "@freshmart_auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch (e) {
      console.error("Auth load failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (phoneNumber: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/login", { phoneNumber, password });
    const userData = await res.json();
    setUser(userData);
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
  };

  const register = async (phoneNumber: string, password: string, name: string) => {
    const res = await apiRequest("POST", "/api/auth/register", { phoneNumber, password, name });
    const userData = await res.json();
    setUser(userData);
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const value = useMemo(() => ({ user, login, register, logout, isLoading }), [user, isLoading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
