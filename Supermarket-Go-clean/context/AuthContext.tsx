import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "@/shared/schema";
import { apiRequest } from "@/lib/query-client";
import { useErrorHandler } from "@/hooks/useErrorHandler";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (phoneNumber: string, password: string) => Promise<void>;
  register: (phoneNumber: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const AUTH_STORAGE_KEY = "@freshmart_auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { handleError, handleAsyncError } = useErrorHandler({ component: 'AuthProvider' });

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
      }
    } catch (e) {
      handleError(e instanceof Error ? e : new Error('Failed to load user data'), 'load_user');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (phoneNumber: string, password: string) => {
    return handleAsyncError(async () => {
      const res = await apiRequest("POST", "/api/auth/login", { phoneNumber, password });
      const authData = await res.json();
      setUser(authData.user);
      setToken(authData.token);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    }, 'login');
  };

  const register = async (phoneNumber: string, password: string, name: string) => {
    return handleAsyncError(async () => {
      const res = await apiRequest("POST", "/api/auth/register", { phoneNumber, password, name });
      const authData = await res.json();
      setUser(authData.user);
      setToken(authData.token);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    }, 'register');
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const value = useMemo(() => ({
    user,
    token,
    login,
    register,
    logout,
    isLoading,
  }), [user, token, login, register, logout, isLoading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
