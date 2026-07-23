"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { DbMilkRecord, DbMilkRecordInsert } from "@/types/supabase";
import type { MilkRecord } from "@/types";

function dbToMilkRecord(row: DbMilkRecord): MilkRecord {
  return {
    id: row.id, farmId: row.farm_id, date: row.record_date,
    morning: row.morning_liters ?? 0, afternoon: row.afternoon_liters ?? 0,
    evening: row.evening_liters ?? 0, total: row.total_liters ?? 0,
    quality: row.quality_grade ?? "A",
    fatContent: row.fat_percentage ?? 0, proteinContent: row.protein_percentage ?? 0,
  };
}

export interface MilkInsertPayload {
  record_date: string;
  morning_liters?: number;
  afternoon_liters?: number;
  evening_liters?: number;
  quality_grade?: "A" | "B" | "C";
  fat_percentage?: number;
  protein_percentage?: number;
  notes?: string;
}

interface UseMilkResult {
  milkRecords:  MilkRecord[];
  loading:      boolean;
  error:        string | null;
  refresh:      () => Promise<void>;
  addMilkRecord: (p: MilkInsertPayload) => Promise<{ error: string | null }>;
  deleteMilkRecord: (id: string) => Promise<{ error: string | null }>;
  monthlyTotals: { month: string; liters: number; revenue: number }[];
}

export function useMilk(farmId: string | null): UseMilkResult {
  const [milkRecords, setMilkRecords] = useState<MilkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!farmId) { setLoading(false); return; }
    try {
      setLoading(true); setError(null);
      const { data, error: e } = await supabase
        .from("milk_records").select("*").eq("farm_id", farmId)
        .order("record_date", { ascending: false }).limit(180);
      if (e) throw new Error(e.message);
      setMilkRecords((data ?? []).map(dbToMilkRecord));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load milk records");
    } finally { setLoading(false); }
  }, [farmId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addMilkRecord = useCallback(async (payload: MilkInsertPayload) => {
    if (!farmId) return { error: "Farm not loaded." };
    const morning   = payload.morning_liters   ?? 0;
    const afternoon = payload.afternoon_liters ?? 0;
    const evening   = payload.evening_liters   ?? 0;
    const insert: DbMilkRecordInsert = {
      farm_id: farmId, record_date: payload.record_date,
      morning_liters: morning, afternoon_liters: afternoon, evening_liters: evening,
      total_liters: morning + afternoon + evening,
      quality_grade: payload.quality_grade ?? null,
      fat_percentage: payload.fat_percentage ?? null,
      protein_percentage: payload.protein_percentage ?? null,
      notes: payload.notes ?? null,
    };
    const { error: e } = await supabase.from("milk_records").insert(insert);
    if (e) return { error: e.message };
    await fetch();
    return { error: null };
  }, [farmId, fetch]);

  const deleteMilkRecord = useCallback(async (id: string) => {
    const { error: e } = await supabase.from("milk_records").delete().eq("id", id);
    if (e) return { error: e.message };
    await fetch();
    return { error: null };
  }, [fetch]);

  const monthlyTotals = (() => {
    const map = new Map<string, number>();
    milkRecords.forEach(r => {
      const m = r.date.slice(0, 7);
      map.set(m, (map.get(m) ?? 0) + r.total);
    });
    return Array.from(map.entries()).sort(([a],[b]) => a.localeCompare(b)).slice(-12)
      .map(([month, liters]) => ({
        month: new Date(month + "-01").toLocaleString("default", { month: "short" }),
        liters, revenue: liters * 50,
      }));
  })();

  return { milkRecords, loading, error, refresh: fetch, addMilkRecord, deleteMilkRecord, monthlyTotals };
}
