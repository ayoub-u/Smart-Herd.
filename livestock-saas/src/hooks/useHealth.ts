"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { DbHealthRecord, DbVaccination, DbHealthRecordInsert, DbVaccinationInsert } from "@/types/supabase";
import type { HealthRecord, VaccinationSchedule } from "@/types";

function dbToHealthRecord(row: DbHealthRecord, animalName: string): HealthRecord {
  return {
    id: row.id, farmId: row.farm_id, animalId: row.animal_id,
    date: row.record_date, type: row.record_type, description: row.description,
    veterinarian: row.veterinarian ?? "", medication: row.medication ?? undefined,
    dosage: row.dosage ?? undefined, cost: row.cost ?? 0,
    nextFollowUp: row.next_follow_up ?? undefined, notes: row.notes ?? "",
  };
}

function dbToVaccination(row: DbVaccination, animalName: string): VaccinationSchedule {
  return {
    id: row.id, farmId: row.farm_id, animalId: row.animal_id,
    animalName, vaccine: row.vaccine_name, dueDate: row.due_date,
    status: row.status, priority: row.priority,
  };
}

export interface HealthInsertPayload {
  animal_id: string;
  record_date: string;
  record_type: DbHealthRecord["record_type"];
  description: string;
  veterinarian?: string;
  medication?: string;
  dosage?: string;
  cost?: number;
  next_follow_up?: string;
  notes?: string;
}

export interface VaccinationInsertPayload {
  animal_id: string;
  vaccine_name: string;
  due_date: string;
  status?: DbVaccination["status"];
  priority?: DbVaccination["priority"];
  notes?: string;
}

interface UseHealthResult {
  healthRecords:   HealthRecord[];
  vaccinations:    VaccinationSchedule[];
  loading:         boolean;
  error:           string | null;
  refresh:         () => Promise<void>;
  addHealthRecord: (p: HealthInsertPayload) => Promise<{ error: string | null }>;
  addVaccination:  (p: VaccinationInsertPayload) => Promise<{ error: string | null }>;
  markVaccinationDone: (id: string) => Promise<{ error: string | null }>;
  deleteHealthRecord: (id: string) => Promise<{ error: string | null }>;
}

export function useHealth(farmId: string | null): UseHealthResult {
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [vaccinations,  setVaccinations]  = useState<VaccinationSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!farmId) { setLoading(false); return; }
    try {
      setLoading(true); setError(null);

      const [hrRes, vaxRes, animalsRes] = await Promise.all([
        supabase.from("health_records").select("*").eq("farm_id", farmId).order("record_date", { ascending: false }),
        supabase.from("vaccinations").select("*").eq("farm_id", farmId).order("due_date", { ascending: true }),
        supabase.from("animals").select("id,animal_name").eq("farm_id", farmId),
      ]);

      const nameMap = new Map<string, string>(
        (animalsRes.data ?? []).map(a => [a.id, a.animal_name])
      );

      setHealthRecords((hrRes.data ?? []).map(r => dbToHealthRecord(r, nameMap.get(r.animal_id) ?? "")));
      setVaccinations((vaxRes.data ?? []).map(v => dbToVaccination(v, nameMap.get(v.animal_id) ?? "")));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load health data");
    } finally { setLoading(false); }
  }, [farmId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addHealthRecord = useCallback(async (payload: HealthInsertPayload) => {
    if (!farmId) return { error: "Farm not loaded." };
    const insert: DbHealthRecordInsert = {
      farm_id: farmId, animal_id: payload.animal_id,
      record_date: payload.record_date, record_type: payload.record_type,
      description: payload.description, veterinarian: payload.veterinarian ?? null,
      medication: payload.medication ?? null, dosage: payload.dosage ?? null,
      cost: payload.cost ?? null, next_follow_up: payload.next_follow_up ?? null,
      notes: payload.notes ?? null,
    };
    const { error: e } = await supabase.from("health_records").insert(insert);
    if (e) return { error: e.message };
    await fetch();
    return { error: null };
  }, [farmId, fetch]);

  const addVaccination = useCallback(async (payload: VaccinationInsertPayload) => {
    if (!farmId) return { error: "Farm not loaded." };
    const insert: DbVaccinationInsert = {
      farm_id: farmId, animal_id: payload.animal_id,
      vaccine_name: payload.vaccine_name, due_date: payload.due_date,
      administered_date: null, status: payload.status ?? "scheduled",
      priority: payload.priority ?? "medium", notes: payload.notes ?? null,
    };
    const { error: e } = await supabase.from("vaccinations").insert(insert);
    if (e) return { error: e.message };
    await fetch();
    return { error: null };
  }, [farmId, fetch]);

  const markVaccinationDone = useCallback(async (id: string) => {
    const { error: e } = await supabase.from("vaccinations")
      .update({ status: "completed", administered_date: new Date().toISOString().split("T")[0] })
      .eq("id", id);
    if (e) return { error: e.message };
    await fetch();
    return { error: null };
  }, [fetch]);

  const deleteHealthRecord = useCallback(async (id: string) => {
    const { error: e } = await supabase.from("health_records").delete().eq("id", id);
    if (e) return { error: e.message };
    await fetch();
    return { error: null };
  }, [fetch]);

  const deleteVaccination = useCallback(async (id: string) => {
    const { error: e } = await supabase.from("vaccinations").delete().eq("id", id);
    if (e) return { error: e.message };
    await fetch();
    return { error: null };
  }, [fetch]);

  return { healthRecords, vaccinations, loading, error, refresh: fetch,
    addHealthRecord, addVaccination, markVaccinationDone, deleteHealthRecord, deleteVaccination };
}
