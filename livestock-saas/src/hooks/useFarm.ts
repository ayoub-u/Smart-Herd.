"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { getOrCreateFarm, dbFarmToDomain } from "@/lib/farm";
import type { Farm } from "@/types";

interface UseFarmResult {
  farmId:  string | null;
  farm:    Farm | null;       // full domain object (name, currency, etc.)
  loading: boolean;
  error:   string | null;
  created: boolean;           // true if farm was auto-created on this call
}

export function useFarm(): UseFarmResult {
  const [farmId,  setFarmId]  = useState<string | null>(null);
  const [farm,    setFarm]    = useState<Farm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [created, setCreated] = useState(false);

  const resolve = useCallback(async () => {
    let cancelled = false;

    try {
      setLoading(true);
      setError(null);

      // 1. Confirm the user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) throw new Error(sessionError.message);
      if (!session?.user) {
        // Not signed in — dashboard layout will redirect to /login
        if (!cancelled) { setFarmId(null); setFarm(null); }
        return;
      }

      // 2. Get or create the farm (never returns null — always creates one)
      const { farm: dbFarm, created: wasCreated } = await getOrCreateFarm(session.user.id);

      if (!cancelled) {
        setFarmId(dbFarm.id);
        setFarm(dbFarmToDomain(dbFarm));
        setCreated(wasCreated);
      }
    } catch (err) {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : "Failed to load farm");
        setFarmId(null);
        setFarm(null);
      }
    } finally {
      if (!cancelled) setLoading(false);
    }

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    resolve();

    // Re-resolve whenever auth state changes (sign-in from another tab, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        resolve();
      }
      if (event === "SIGNED_OUT") {
        setFarmId(null);
        setFarm(null);
        setLoading(false);
        setError(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [resolve]);

  return { farmId, farm, loading, error, created };
}