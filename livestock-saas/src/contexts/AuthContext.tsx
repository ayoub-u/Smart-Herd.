"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { User, Farm, LoginCredentials } from "@/types";
import { login as apiLogin, logout as apiLogout } from "@/services/api";
import { ROUTES } from "@/constants";

// ── Shape ─────────────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: User | null;
  farm: Farm | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser]  = useState<User | null>(null);
  const [farm, setFarm]  = useState<Farm | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Rehydrate session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("smartherd_session");
      if (stored) {
        const session = JSON.parse(stored);
        setUser(session.user);
        setFarm(session.farm);
      }
    } catch {
      // ignore corrupt storage
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    const res = await apiLogin(credentials);
    setIsLoading(false);

    if (res.error || !res.data) {
      return { error: res.error ?? "Login failed" };
    }

    const { user, farm } = res.data;
    setUser(user);
    setFarm(farm);

    // Persist session (replace with secure httpOnly cookie when backend is ready)
    localStorage.setItem("smartherd_session", JSON.stringify({ user, farm }));

    router.push(ROUTES.DASHBOARD);
    return { error: null };
  }, [router]);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setFarm(null);
    localStorage.removeItem("smartherd_session");
    router.push(ROUTES.LOGIN);
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        farm,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
