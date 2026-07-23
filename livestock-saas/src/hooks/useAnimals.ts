"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { DbAnimal, DbAnimalInsert } from "@/types/supabase";
import type { Animal } from "@/types";

// ── DB → Domain mapper ────────────────────────────────────────────────────────
export function dbToAnimal(row: DbAnimal): Animal {
  return {
    id:               row.id,
    farmId:           row.farm_id,
    name:             row.animal_name,
    tag:              row.ear_tag   ?? "",
    rfid:             row.rfid      ?? "",
    type:             row.species,
    breed:            row.breed     ?? "",
    dateOfBirth:      row.birth_date ?? "",
    weight:           row.weight    ?? 0,
    healthStatus:     row.health_status,
    pregnancyStatus:  row.reproductive_status,
    // columns not in DB — safe defaults so the UI never breaks
    milkYieldToday:   0,
    milkYieldAvg:     0,
    lactationNumber:  0,
    daysInMilk:       0,
    lastVaccination:  "",
    nextVaccination:  "",
    sire:             row.sire      ?? "",
    dam:              row.dam       ?? "",
    location:         row.location  ?? "",
    notes:            row.notes     ?? "",
    inseminationDate:  undefined,
    expectedBirthDate: undefined,
    acquisitionDate:   row.acquisition_date  ?? "",
    acquisitionCost:   row.acquisition_cost  ?? 0,
  };
}

// ── Insert payload ────────────────────────────────────────────────────────────
export interface AnimalInsertPayload {
  animal_name: string;
  ear_tag?: string;
  rfid?: string;
  species: "cow" | "sheep" | "bull";
  breed?: string;
  birth_date?: string;
  weight?: number;
  health_status?: DbAnimal["health_status"];
  reproductive_status?: DbAnimal["reproductive_status"];
  location?: string;
  sire?: string;
  dam?: string;
  notes?: string;
  acquisition_date?: string;
  acquisition_cost?: number;
}

export type AnimalUpdatePayload = Partial<AnimalInsertPayload>;

interface UseAnimalsResult {
  animals:      Animal[];
  loading:      boolean;
  error:        string | null;
  refresh:      () => Promise<void>;
  addAnimal:    (p: AnimalInsertPayload) => Promise<{ error: string | null }>;
  updateAnimal: (id: string, p: AnimalUpdatePayload) => Promise<{ error: string | null }>;
  deleteAnimal: (id: string) => Promise<{ error: string | null }>;
}

export function useAnimals(farmId: string | null): UseAnimalsResult {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetchAnimals = useCallback(async () => {
    if (!farmId) { setAnimals([]); setLoading(false); return; }
    try {
      setLoading(true); setError(null);
      const { data, error: e } = await supabase
        .from("animals")
        .select("*")
        .eq("farm_id", farmId)
        .order("created_at", { ascending: false });
      if (e) throw new Error(e.message);
      setAnimals((data ?? []).map(dbToAnimal));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load animals");
    } finally { setLoading(false); }
  }, [farmId]);

  useEffect(() => { fetchAnimals(); }, [fetchAnimals]);

  const addAnimal = useCallback(async (payload: AnimalInsertPayload) => {
    if (!farmId) return { error: "Farm not loaded." };

    // Only include columns that actually exist in the DB schema.
    // No days_in_milk, lactation_number, milk_yield_*, vaccination dates, etc.
    const insert: DbAnimalInsert = {
      farm_id:             farmId,
      animal_name:         payload.animal_name,
      ear_tag:             payload.ear_tag             ?? null,
      rfid:                payload.rfid                ?? null,
      species:             payload.species,
      breed:               payload.breed               ?? null,
      birth_date:          payload.birth_date          ?? null,
      weight:              payload.weight              ?? null,
      health_status:       payload.health_status       ?? "healthy",
      reproductive_status: payload.reproductive_status ?? "open",
      location:            payload.location            ?? null,
      sire:                payload.sire                ?? null,
      dam:                 payload.dam                 ?? null,
      notes:               payload.notes               ?? null,
      acquisition_date:    payload.acquisition_date    ?? null,
      acquisition_cost:    payload.acquisition_cost    ?? null,
    };

    const { error: e } = await supabase.from("animals").insert(insert);
    if (e) return { error: e.message };
    await fetchAnimals();
    return { error: null };
  }, [farmId, fetchAnimals]);

  const updateAnimal = useCallback(async (id: string, payload: AnimalUpdatePayload) => {
    if (!farmId) return { error: "Farm not loaded." };
    const u: Record<string, unknown> = {};
    if (payload.animal_name         !== undefined) u.animal_name         = payload.animal_name;
    if (payload.ear_tag             !== undefined) u.ear_tag             = payload.ear_tag;
    if (payload.rfid                !== undefined) u.rfid                = payload.rfid;
    if (payload.species             !== undefined) u.species             = payload.species;
    if (payload.breed               !== undefined) u.breed               = payload.breed;
    if (payload.birth_date          !== undefined) u.birth_date          = payload.birth_date;
    if (payload.weight              !== undefined) u.weight              = payload.weight;
    if (payload.health_status       !== undefined) u.health_status       = payload.health_status;
    if (payload.reproductive_status !== undefined) u.reproductive_status = payload.reproductive_status;
    if (payload.location            !== undefined) u.location            = payload.location;
    if (payload.sire                !== undefined) u.sire                = payload.sire;
    if (payload.dam                 !== undefined) u.dam                 = payload.dam;
    if (payload.notes               !== undefined) u.notes               = payload.notes;
    if (payload.acquisition_date    !== undefined) u.acquisition_date    = payload.acquisition_date;
    if (payload.acquisition_cost    !== undefined) u.acquisition_cost    = payload.acquisition_cost;
    if (!Object.keys(u).length) return { error: null };
    const { error: e } = await supabase.from("animals").update(u).eq("id", id).eq("farm_id", farmId);
    if (e) return { error: e.message };
    await fetchAnimals();
    return { error: null };
  }, [farmId, fetchAnimals]);

  const deleteAnimal = useCallback(async (id: string) => {
    if (!farmId) return { error: "Farm not loaded." };
    setAnimals(prev => prev.filter(a => a.id !== id));
    const { error: e } = await supabase.from("animals").delete().eq("id", id).eq("farm_id", farmId);
    if (e) { await fetchAnimals(); return { error: e.message }; }
    return { error: null };
  }, [farmId, fetchAnimals]);

  return { animals, loading, error, refresh: fetchAnimals, addAnimal, updateAnimal, deleteAnimal };
}
