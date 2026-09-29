"use client";
/**
 * src/hooks/useNutrition.ts
 *
 * Supabase data layer for the Nutrition module.
 *
 * KEY FIX: inventory items without a feed_type_id now still get nutritional
 * data by doing a name-based fallback lookup against feed_types.
 * This means feeds added before the nutrition system existed (or without
 * selecting a feed_type) still work in the ration calculator.
 *
 * Data flow:
 *   feed_inventory (farm stock)
 *     → feed_type_id (optional link to global catalog)
 *     → feed_default_nutrients (global INRA 2018 defaults)
 *     → farm_feed_analysis (farm-specific override, if any)
 *     → resolveFeedProfile() → ResolvedFeedProfile
 *     → optimizeRation() → RationResult
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type {
  DbFeedType,
  DbFeedDefaultNutrients,
  DbFarmFeedAnalysis,
  DbRation,
  RationResult,
  CowPhysioData,
  RationScope,
} from "@/types/nutrition";
import type { Animal } from "@/types";
import { resolveFeedProfile } from "@/lib/nutrition/feedResolver";
import { calculateCowRequirements } from "@/lib/nutrition/requirements";
import { optimizeRation } from "@/lib/nutrition/optimizer";
import { INRA_2018 } from "@/lib/nutrition/constants";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function animalToCowPhysio(animal: Animal): CowPhysioData {
  let ageYears: number | null = null;
  if (animal.dateOfBirth) {
    ageYears = (Date.now() - new Date(animal.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  }
  return {
    animalId:              animal.id,
    name:                  animal.name,
    tag:                   animal.tag,
    breed:                 animal.breed || null,
    bodyWeightKg:          animal.weight > 0 ? animal.weight : null,
    ageYears,
    milkProductionLPerDay: animal.milkYieldToday > 0 ? animal.milkYieldToday : null,
    milkFatPct:            null,
    milkProteinPct:        null,
    daysInMilk:            animal.daysInMilk > 0 ? animal.daysInMilk : null,
    lactationNumber:       animal.lactationNumber > 0 ? animal.lactationNumber : null,
    reproductiveStatus:    mapReprodStatus(animal.pregnancyStatus),
    gestationMonths:       null,
    targetMilkLPerDay:     null,
  };
}

function mapReprodStatus(s: Animal["pregnancyStatus"]): CowPhysioData["reproductiveStatus"] {
  if (s === "pregnant")  return "pregnant";
  if (s === "dry")       return "dry";
  if (s === "lactating") return "lactating";
  return "open";
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface EnrichedInventoryItem {
  id: string;
  feed_type_id: string | null;
  feed_name: string;
  category: string;
  current_stock_kg: number;  // as-fed kg
  cost_per_kg: number;
  daily_usage: number;
  unit: string;
  reorder_level_kg: number;
  supplier: string | null;
  notes: string | null;
  last_delivery_date: string | null;
  analysis_available: boolean;
  analysis_id: string | null;
  // Joined
  feedType:  DbFeedType | null;
  defaults:  DbFeedDefaultNutrients | null;
  analysis:  DbFarmFeedAnalysis | null;
  resolved:  ReturnType<typeof resolveFeedProfile>;
}

export interface FarmAnalysisValues {
  dry_matter_pct?: number;
  ufl_per_kg_dm?: number;
  pdin_g_per_kg_dm?: number;
  pdie_g_per_kg_dm?: number;
  ndf_pct_dm?: number;
  adf_pct_dm?: number;
  starch_pct_dm?: number;
  crude_protein_pct_dm?: number;
  calcium_g_per_kg_dm?: number;
  phosphorus_g_per_kg_dm?: number;
  laboratory_name?: string;
  analysis_date?: string;
  notes?: string;
}

export interface InventoryEditPayload {
  feed_name?: string;
  category?: string;
  current_stock?: number;
  unit?: string;
  daily_usage?: number;
  cost_per_unit?: number;
  reorder_level?: number;
  supplier?: string;
  last_delivery_date?: string;
  notes?: string;
  feed_type_id?: string | null;
}

export interface UseNutritionResult {
  feedTypes:        DbFeedType[];
  loadingFeedTypes: boolean;
  inventory:        EnrichedInventoryItem[];
  loadingInventory: boolean;
  rationResults:    RationResult[];
  calculating:      boolean;
  calcError:        string | null;
  activeRations:    DbRation[];
  loadingRations:   boolean;
  calculateRations:  (animals: Animal[]) => Promise<void>;
  confirmRation:     (result: RationResult, name: string) => Promise<{ error: string | null }>;
  deactivateRation:  (rationId: string) => Promise<{ error: string | null }>;
  refreshInventory:  () => Promise<void>;
  refreshRations:    () => Promise<void>;
  addFarmAnalysis:   (inventoryId: string, feedTypeId: string, values: FarmAnalysisValues) => Promise<{ error: string | null }>;
  updateInventoryItem: (id: string, payload: InventoryEditPayload) => Promise<{ error: string | null }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────────────────

export function useNutrition(farmId: string | null): UseNutritionResult {
  const [feedTypes,        setFeedTypes]        = useState<DbFeedType[]>([]);
  const [loadingFeedTypes, setLoadingFeedTypes] = useState(true);
  const [inventory,        setInventory]        = useState<EnrichedInventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [activeRations,    setActiveRations]    = useState<DbRation[]>([]);
  const [loadingRations,   setLoadingRations]   = useState(true);
  const [rationResults,    setRationResults]    = useState<RationResult[]>([]);
  const [calculating,      setCalculating]      = useState(false);
  const [calcError,        setCalcError]        = useState<string | null>(null);

  // ── Feed types (global catalog) ────────────────────────────────────────────
  useEffect(() => {
    supabase.from("feed_types").select("*").eq("active", true).order("name")
      .then(({ data }) => {
        setFeedTypes((data ?? []) as DbFeedType[]);
        setLoadingFeedTypes(false);
      });
  }, []);

  // ── Enriched inventory ─────────────────────────────────────────────────────
  const refreshInventory = useCallback(async () => {
    if (!farmId) { setInventory([]); setLoadingInventory(false); return; }
    setLoadingInventory(true);

    try {
      // 1. Get all farm inventory items
      const { data: inv, error: invErr } = await supabase
        .from("feed_inventory")
        .select("*")
        .eq("farm_id", farmId)
        .order("feed_name");

      if (invErr) throw new Error(invErr.message);
      if (!inv || inv.length === 0) { setInventory([]); return; }

      // 2. Collect feed_type_ids (from explicit linkage)
      const explicitTypeIds = [...new Set(
        inv.map((i: any) => i.feed_type_id).filter(Boolean) as string[]
      )];

      // 3. For items WITHOUT feed_type_id, try name-based matching
      //    against the global catalog (case-insensitive contains match)
      const itemsWithoutType = inv.filter((i: any) => !i.feed_type_id);

      // Fetch ALL feed types in one call (small table, fine to load all)
      const { data: allFeedTypes } = await supabase
        .from("feed_types").select("id, name, category").eq("active", true);

      const allFeedTypesArr = (allFeedTypes ?? []) as Array<{ id: string; name: string; category: string }>;

      // Build name → id map for fallback matching
      const nameToTypeId = new Map<string, string>();
      for (const ft of allFeedTypesArr) {
        nameToTypeId.set(ft.name.toLowerCase(), ft.id);
      }

      // Resolve feed_type_id for items without explicit linkage
      const resolvedTypeIds = new Map<string, string>(); // invId → typeId
      for (const item of itemsWithoutType) {
        const lower = (item.feed_name as string).toLowerCase();
        // Try exact match first
        let typeId = nameToTypeId.get(lower) ?? null;
        // Try partial match (e.g. "corn silage" matches "Corn Silage")
        if (!typeId) {
          for (const [n, id] of nameToTypeId.entries()) {
            if (n.includes(lower) || lower.includes(n)) { typeId = id; break; }
          }
        }
        if (typeId) resolvedTypeIds.set(item.id, typeId);
      }

      // Combine all unique type ids (explicit + resolved)
      const allTypeIds = [...new Set([
        ...explicitTypeIds,
        ...Array.from(resolvedTypeIds.values()),
      ])];

      // 4. Fetch defaults for all relevant type ids in one query
      const { data: allDefaults } = allTypeIds.length > 0
        ? await supabase.from("feed_default_nutrients").select("*").in("feed_type_id", allTypeIds)
        : { data: [] };

      // 5. Fetch farm-specific analyses for all inventory items
      const invIds = inv.map((i: any) => i.id as string);
      const { data: allAnalyses } = await supabase
        .from("farm_feed_analysis")
        .select("*")
        .eq("farm_id", farmId)
        .in("inventory_id", invIds);

      // Build lookup maps
      const defaultsByTypeId = new Map<string, DbFeedDefaultNutrients>(
        ((allDefaults ?? []) as DbFeedDefaultNutrients[]).map(d => [d.feed_type_id, d])
      );
      const analysisByInvId = new Map<string, DbFarmFeedAnalysis>(
        ((allAnalyses ?? []) as DbFarmFeedAnalysis[]).map(a => [a.inventory_id, a])
      );
      const feedTypeById = new Map<string, DbFeedType>(
        feedTypes.map(ft => [ft.id, ft])
      );

      // 6. Build enriched items
      const enriched: EnrichedInventoryItem[] = inv.map((item: any) => {
        // Determine the effective feed_type_id
        const ftId: string | null =
          item.feed_type_id ??
          resolvedTypeIds.get(item.id) ??
          null;

        const ft    = ftId ? (feedTypeById.get(ftId) ?? null) : null;
        const defs  = ftId ? (defaultsByTypeId.get(ftId) ?? null) : null;
        const anal  = analysisByInvId.get(item.id) ?? null;

        // Build the resolver input
        const invForResolver = {
          id:               item.id,
          feed_type_id:     ftId,
          feed_name:        item.feed_name as string,
          current_stock_kg: (item.current_stock as number) ?? 0,
          cost_per_kg:      (item.cost_per_unit as number) ?? 0,
        };

        const resolved = resolveFeedProfile(invForResolver, defs, anal);

        return {
          id:                 item.id,
          feed_type_id:       ftId,
          feed_name:          item.feed_name,
          category:           item.category ?? "forage",
          current_stock_kg:   item.current_stock ?? 0,
          cost_per_kg:        item.cost_per_unit ?? 0,
          daily_usage:        item.daily_usage ?? 0,
          unit:               item.unit ?? "kg",
          reorder_level_kg:   item.reorder_level ?? 0,
          supplier:           item.supplier ?? null,
          notes:              item.notes ?? null,
          last_delivery_date: item.last_delivery_date ?? null,
          analysis_available: !!anal,
          analysis_id:        anal?.id ?? null,
          feedType:           ft,
          defaults:           defs,
          analysis:           anal,
          resolved,
        };
      });

      setInventory(enriched);
    } catch (err) {
      console.error("[useNutrition] refreshInventory error:", err);
    } finally {
      setLoadingInventory(false);
    }
  }, [farmId, feedTypes]);

  useEffect(() => { refreshInventory(); }, [refreshInventory]);

  // ── Active rations ─────────────────────────────────────────────────────────
  const refreshRations = useCallback(async () => {
    if (!farmId) { setLoadingRations(false); return; }
    const { data } = await supabase
      .from("rations")
      .select("*")
      .eq("farm_id", farmId)
      .eq("status", "active")
      .order("created_at", { ascending: false });
    setActiveRations((data ?? []) as DbRation[]);
    setLoadingRations(false);
  }, [farmId]);

  useEffect(() => { refreshRations(); }, [refreshRations]);

  // ── Calculate rations ──────────────────────────────────────────────────────
  const calculateRations = useCallback(async (animals: Animal[]) => {
    setCalculating(true);
    setCalcError(null);
    try {
      // Filter to dairy cows (not dry, not bull)
      const dairyCows = animals.filter(a =>
        a.type === "cow" && a.pregnancyStatus !== "dry"
      );

      if (dairyCows.length === 0) {
        setCalcError("No dairy cows available. Add cows with species 'cow' and lactating/pregnant status.");
        return;
      }

      // Pass ALL resolved profiles from current farm inventory
      // The optimizer filters out feeds with no usable UFL value internally
      const resolvedProfiles = inventory.map(i => i.resolved);

      if (resolvedProfiles.length === 0) {
        setCalcError("No feeds in inventory. Add feeds in the Inventory tab first.");
        return;
      }

      const numCows = dairyCows.length;
      const results: RationResult[] = [];

      for (const animal of dairyCows) {
        const physio = animalToCowPhysio(animal);
        const { requirements, warnings, assumptions } = calculateCowRequirements(physio);
        const result = optimizeRation(
          animal.id, animal.name, animal.tag,
          requirements, resolvedProfiles, numCows,
          warnings, assumptions,
        );
        results.push(result);
      }

      setRationResults(results);
    } catch (err) {
      setCalcError(err instanceof Error ? err.message : "Calculation failed");
    } finally {
      setCalculating(false);
    }
  }, [inventory]);

  // ── Confirm ration ─────────────────────────────────────────────────────────
  const confirmRation = useCallback(async (result: RationResult, name: string): Promise<{ error: string | null }> => {
    if (!farmId) return { error: "Farm not loaded." };
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { error: "Not authenticated." };

    try {
      // Archive previous rations for this cow
      if (result.cowId) {
        await supabase.from("rations")
          .update({ status: "archived" })
          .eq("farm_id", farmId)
          .eq("cow_id", result.cowId)
          .eq("status", "active");
      }

      const { data: ration, error: rationErr } = await supabase
        .from("rations")
        .insert({
          farm_id:                   farmId,
          name,
          scope:                     "individual" as RationScope,
          cow_id:                    result.cowId || null,
          objective:                 "minimize_cost",
          status:                    "active",
          nutritional_model:         INRA_2018.MODEL_NAME,
          nutritional_model_version: INRA_2018.MODEL_VERSION,
          created_by:                session.user.id,
          confirmed_at:              new Date().toISOString(),
        })
        .select("id")
        .single();

      if (rationErr || !ration) return { error: rationErr?.message ?? "Failed to save ration." };

      const items = result.feedItems.map(fi => {
        const invItem = inventory.find(i => i.id === fi.inventoryId);
        const dmFrac  = fi.quantityAsFedKgPerCow > 0
          ? fi.quantityDmKgPerCow / fi.quantityAsFedKgPerCow
          : 0.87;
        return {
          ration_id:                   ration.id,
          feed_inventory_id:           fi.inventoryId,
          feed_type_id:                fi.feedTypeId ?? null,
          feed_name:                   fi.feedName,
          quantity_per_cow_per_day_kg: fi.quantityAsFedKgPerCow,
          dm_fraction:                 dmFrac,
          cost_per_kg_at_confirmation: invItem?.cost_per_kg ?? 0,
          nutrient_profile_snapshot:   JSON.stringify(invItem?.resolved ?? {}),
        };
      });

      if (items.length > 0) {
        const { error: itemsErr } = await supabase.from("ration_items").insert(items);
        if (itemsErr) return { error: itemsErr.message };
      }

      await refreshRations();
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to confirm ration." };
    }
  }, [farmId, inventory, refreshRations]);

  // ── Deactivate ration ──────────────────────────────────────────────────────
  const deactivateRation = useCallback(async (rationId: string): Promise<{ error: string | null }> => {
    const { error: e } = await supabase.from("rations")
      .update({ status: "archived" }).eq("id", rationId);
    if (e) return { error: e.message };
    await refreshRations();
    return { error: null };
  }, [refreshRations]);

  // ── Add/update farm lab analysis ───────────────────────────────────────────
  const addFarmAnalysis = useCallback(async (
    inventoryId: string,
    feedTypeId: string,
    values: FarmAnalysisValues,
  ): Promise<{ error: string | null }> => {
    if (!farmId) return { error: "Farm not loaded." };

    // Clean up undefined values
    const payload: Record<string, unknown> = {
      farm_id:      farmId,
      inventory_id: inventoryId,
      feed_type_id: feedTypeId,
    };
    for (const [k, v] of Object.entries(values)) {
      if (v !== undefined && v !== "") payload[k] = v;
    }

    const { error: e } = await supabase
      .from("farm_feed_analysis")
      .upsert(payload, { onConflict: "farm_id,inventory_id" });

    if (e) return { error: e.message };
    await refreshInventory();
    return { error: null };
  }, [farmId, refreshInventory]);

  // ── Edit inventory item ────────────────────────────────────────────────────
  const updateInventoryItem = useCallback(async (
    id: string,
    payload: InventoryEditPayload,
  ): Promise<{ error: string | null }> => {
    if (!farmId) return { error: "Farm not loaded." };

    const update: Record<string, unknown> = {};
    if (payload.feed_name          !== undefined) update.feed_name          = payload.feed_name;
    if (payload.category           !== undefined) update.category           = payload.category;
    if (payload.current_stock      !== undefined) update.current_stock      = payload.current_stock;
    if (payload.unit               !== undefined) update.unit               = payload.unit;
    if (payload.daily_usage        !== undefined) update.daily_usage        = payload.daily_usage;
    if (payload.cost_per_unit      !== undefined) update.cost_per_unit      = payload.cost_per_unit;
    if (payload.reorder_level      !== undefined) update.reorder_level      = payload.reorder_level;
    if (payload.supplier           !== undefined) update.supplier           = payload.supplier;
    if (payload.last_delivery_date !== undefined) update.last_delivery_date = payload.last_delivery_date;
    if (payload.notes              !== undefined) update.notes              = payload.notes;
    if (payload.feed_type_id       !== undefined) update.feed_type_id       = payload.feed_type_id;

    if (Object.keys(update).length === 0) return { error: null };

    const { error: e } = await supabase
      .from("feed_inventory")
      .update(update)
      .eq("id", id)
      .eq("farm_id", farmId);

    if (e) return { error: e.message };
    await refreshInventory();
    return { error: null };
  }, [farmId, refreshInventory]);

  return {
    feedTypes, loadingFeedTypes,
    inventory, loadingInventory,
    rationResults, calculating, calcError,
    activeRations, loadingRations,
    calculateRations, confirmRation, deactivateRation,
    refreshInventory, refreshRations, addFarmAnalysis,
    updateInventoryItem,
  };
}
