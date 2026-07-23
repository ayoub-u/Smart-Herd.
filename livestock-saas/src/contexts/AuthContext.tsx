"use client";
import React, {
  createContext, useContext, useState,
  useCallback, useEffect, useRef,
} from "react";
import { useRouter } from "next/navigation";
import { supabase }  from "@/lib/supabase";
import { getOrCreateFarm, dbFarmToDomain } from "@/lib/farm";
import type { User, Farm, LoginCredentials } from "@/types";
import { ROUTES } from "@/constants";

// ── Context shape (unchanged) ─────────────────────────────────────────────────
interface AuthContextValue {
  user:            User | null;
  farm:            Farm | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  authError:       string | null;
  login:  (credentials: LoginCredentials) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Helper: fetch profile row ─────────────────────────────────────────────────
async function fetchProfile(userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", userId)
    .single();
  return data ?? {};
}

// ── Helper: build User domain object ─────────────────────────────────────────
function buildUser(
  supabaseUser: { id: string; email?: string | null },
  profile: { full_name?: string | null; role?: string | null }
): User {
  const fullName = profile.full_name?.trim() || supabaseUser.email || "User";
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return {
    id:             supabaseUser.id,
    email:          supabaseUser.email ?? "",
    fullName,
    avatarInitials: initials,
    role:           (profile.role as User["role"]) ?? "owner",
    createdAt:      new Date().toISOString(),
  };
}

// ── Core session loader ───────────────────────────────────────────────────────
// Fetches profile + gets-or-creates farm for the authenticated user.
// Called from: login() and bootstrap().
// NOT called from onAuthStateChange — that's the fix.
async function loadUserSession(
  supabaseUser: { id: string; email?: string | null }
): Promise<{ user: User; farm: Farm }> {
  const [profile, { farm: dbFarm }] = await Promise.all([
    fetchProfile(supabaseUser.id),
    getOrCreateFarm(supabaseUser.id),
  ]);

  return {
    user: buildUser(supabaseUser, profile),
    farm: dbFarmToDomain(dbFarm),
  };
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [user,      setUser]      = useState<User | null>(null);
  const [farm,      setFarm]      = useState<Farm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    // ── Bootstrap: restore session on page load / refresh ─────────────────
    async function bootstrap() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw new Error(sessionError.message);

        if (session?.user) {
          // Returning user — load their data
          const result = await loadUserSession(session.user);
          setUser(result.user);
          setFarm(result.farm);
        }
        // No session → stay unauthenticated; layout redirects to /login
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to initialise session";
        console.error("[AuthContext] bootstrap error:", msg);
        setAuthError(msg);
      } finally {
        setIsLoading(false); // always unblocks the loading screen
      }
    }

    bootstrap();

    // ── External auth event listener ──────────────────────────────────────
    // Handles events that originate OUTSIDE of our login() call:
    //   INITIAL_SESSION — fires when subscription is first registered;
    //                     acts as a backup for bootstrap() on fast connections
    //   SIGNED_OUT      — user signed out in another tab
    //   TOKEN_REFRESHED — silent JWT refresh; no action needed
    //
    // We do NOT handle SIGNED_IN here anymore.
    // login() now calls loadUserSession() directly and awaits it before
    // navigating — so by the time the dashboard mounts, user+farm are set
    // and isLoading is false.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        try {
          if (event === "INITIAL_SESSION" && session?.user && !user) {
            // Only handle if bootstrap hasn't already set the user
            // (avoids duplicate loadUserSession calls on fast connections)
            const result = await loadUserSession(session.user);
            setUser(result.user);
            setFarm(result.farm);
          }

          if (event === "SIGNED_OUT") {
            setUser(null);
            setFarm(null);
            setAuthError(null);
          }

          // SIGNED_IN: intentionally not handled here.
          // login() handles it directly to avoid the race condition.

          // TOKEN_REFRESHED: no action needed.

        } catch (err) {
          const msg = err instanceof Error ? err.message : "Session error";
          console.error("[AuthContext] onAuthStateChange error:", msg);
          setAuthError(msg);
        } finally {
          setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  // FIX: login() now fully loads the session before navigating.
  // This guarantees isLoading=false and user/farm are set when the
  // dashboard layout mounts — no race condition possible.
  const login = useCallback(async (
    credentials: LoginCredentials
  ): Promise<{ error: string | null }> => {
    setIsLoading(true);
    setAuthError(null);

    try {
      // Step 1: authenticate
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email:    credentials.email.trim(),
        password: credentials.password,
      });

      if (signInError || !data.session) {
        return { error: signInError?.message ?? "Login failed" };
      }

      // Step 2: load profile + farm NOW, while we still have a clean async
      // context and the auth token is fully set on the Supabase client.
      // This is the key fix: we do NOT rely on onAuthStateChange to do this.
      const result = await loadUserSession(data.session.user);
      setUser(result.user);
      setFarm(result.farm);

      // Step 3: navigate — dashboard will mount with isLoading=false and
      // user/farm already set, so it renders immediately.
      router.push(ROUTES.DASHBOARD);
      return { error: null };

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setAuthError(msg);
      return { error: msg };
    } finally {
      // Always unblock loading whether we succeeded, failed, or threw
      setIsLoading(false);
    }
  }, [router]);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setFarm(null);
    setAuthError(null);
    router.push(ROUTES.LOGIN);
  }, [router]);

  return (
    <AuthContext.Provider value={{
      user,
      farm,
      isAuthenticated: !!user,
      isLoading,
      authError,
      login,
      logout,
    }}>
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
