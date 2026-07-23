"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { DbReproductionEvent, DbReproductionInsert } from "@/types/supabase";
import type { ReproductionRecord } from "@/types";

function dbToReproRecord(row: DbReproductionEvent, animalName: string): ReproductionRecord {
  return {
    id: row.id, farmId: row.farm_id, animalId: row.animal_id, animalName,
    type: row.event_type, date: row.event_date, result: row.result ?? undefined,
    notes: row.notes ?? "", technician: row.technician ?? undefined,
    bull: row.bull_name ?? undefined, straws: row.straw_id ?? undefined,
    expectedDueDate: row.expected_due_date ?? undefined,
  };
}

export interface ReproductionInsertPayload {
  animal_id: string;
  event_type: DbReproductionEvent["event_type"];
  event_date: string;
  result?: string;
  notes?: string;
  technician?: string;
  bull_name?: string;
  straw_id?: string;
  expected_due_date?: string;
}

interface UseReproductionResult {
  records:  ReproductionRecord[];
  loading:  boolean;
  error:    string | null;
  refresh:  () => Promise<void>;
  addEvent: (p: ReproductionInsertPayload) => Promise<{ error: string | null }>;
  deleteEvent: (id: string) => Promise<{ error: string | null }>;
}

export function useReproduction(farmId: string | null): UseReproductionResult {
  const [records, setRecords] = useState<ReproductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!farmId) { setLoading(false); return; }
    try {
      setLoading(true); setError(null);
      const [eventsRes, animalsRes] = await Promise.all([
        supabase.from("reproduction_events").select("*").eq("farm_id", farmId).order("event_date", { ascending: false }),
        supabase.from("animals").select("id,animal_name").eq("farm_id", farmId),
      ]);
      const nameMap = new Map<string, string>(((animalsRes.data ?? []) as Array<{ id: string; animal_name: string }>).map((a: { id: string; animal_name: string }) => [a.id, a.animal_name]));
      setRecords(((eventsRes.data ?? []) as Array<DbReproductionEvent>).map((r: DbReproductionEvent) => dbToReproRecord(r, nameMap.get(r.animal_id) ?? "")));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reproduction data");
    } finally { setLoading(false); }
  }, [farmId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addEvent = useCallback(async (payload: ReproductionInsertPayload) => {
    if (!farmId) return { error: "Farm not loaded." };
    const insert: DbReproductionInsert = {
      farm_id: farmId, animal_id: payload.animal_id,
      event_type: payload.event_type, event_date: payload.event_date,
      result: payload.result ?? null, notes: payload.notes ?? null,
      technician: payload.technician ?? null, bull_name: payload.bull_name ?? null,
      straw_id: payload.straw_id ?? null, expected_due_date: payload.expected_due_date ?? null,
    };
    const { error: e } = await supabase.from("reproduction_events").insert(insert);
    if (e) return { error: e.message };
    await fetch();
    return { error: null };
  }, [farmId, fetch]);

  const deleteEvent = useCallback(async (id: string) => {
    const { error: e } = await supabase.from("reproduction_events").delete().eq("id", id);
    if (e) return { error: e.message };
    await fetch();
    return { error: null };
  }, [fetch]);

  return { records, loading, error, refresh: fetch, addEvent, deleteEvent };
}
