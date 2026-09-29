/**
 * src/lib/nutrition/feedResolver.ts
 *
 * Resolves the nutritional profile for a farm's feed inventory item.
 *
 * Priority logic:
 *   1. Use farmer laboratory analysis values where available.
 *   2. Fall back to global defaults for any missing parameters.
 *   3. Record the source of each value (farmer_analysis | default | unavailable).
 *
 * This module is PURE (no React). It accepts data already fetched from Supabase.
 */

import type {
  DbFeedDefaultNutrients,
  DbFarmFeedAnalysis,
  ResolvedFeedProfile,
  ResolvedNutrientValue,
  NutrientSource,
} from "@/types/nutrition";
import type { FeedInventory } from "@/types";

type NutrientKey =
  | "dry_matter_pct"
  | "ufl_per_kg_dm"
  | "pdin_g_per_kg_dm"
  | "pdie_g_per_kg_dm"
  | "ndf_pct_dm"
  | "adf_pct_dm"
  | "starch_pct_dm"
  | "crude_protein_pct_dm"
  | "calcium_g_per_kg_dm"
  | "phosphorus_g_per_kg_dm";

/**
 * Resolve a single nutrient value from farmer analysis (priority) or default.
 */
function resolveNutrient(
  key: NutrientKey,
  farmerAnalysis: DbFarmFeedAnalysis | null,
  defaults: DbFeedDefaultNutrients | null,
  defaultRef: string | null,
): ResolvedNutrientValue {
  // Prefer farmer analysis
  if (farmerAnalysis && farmerAnalysis[key] != null) {
    return {
      value: farmerAnalysis[key] as number,
      source: "farmer_analysis",
      reference: `Lab: ${farmerAnalysis.laboratory_name ?? "Farm analysis"} (${farmerAnalysis.analysis_date ?? "date unknown"})`,
    };
  }

  // Fall back to global default
  if (defaults && defaults[key] != null) {
    return {
      value: defaults[key] as number,
      source: "default",
      reference: defaultRef ?? defaults.source_reference ?? "SmartHerd default",
    };
  }

  // Unavailable
  return { value: null, source: "unavailable", reference: null };
}

/**
 * Resolve the complete nutritional profile for a farm inventory item.
 *
 * @param inventoryItem - The farm's feed inventory item
 * @param defaults      - Global default nutrients for this feed type (may be null)
 * @param farmerAnalysis - Farm-specific lab analysis (may be null)
 */
export function resolveFeedProfile(
  inventoryItem: { id: string; feed_type_id: string | null; feed_name: string; current_stock_kg: number; cost_per_kg: number },
  defaults: DbFeedDefaultNutrients | null,
  farmerAnalysis: DbFarmFeedAnalysis | null,
): ResolvedFeedProfile {
  const defaultRef = defaults?.source_reference ?? null;

  const dryMatterPct = resolveNutrient("dry_matter_pct",        farmerAnalysis, defaults, defaultRef);
  const ufl          = resolveNutrient("ufl_per_kg_dm",         farmerAnalysis, defaults, defaultRef);
  const pdin         = resolveNutrient("pdin_g_per_kg_dm",      farmerAnalysis, defaults, defaultRef);
  const pdie         = resolveNutrient("pdie_g_per_kg_dm",      farmerAnalysis, defaults, defaultRef);
  const ndf          = resolveNutrient("ndf_pct_dm",            farmerAnalysis, defaults, defaultRef);
  const adf          = resolveNutrient("adf_pct_dm",            farmerAnalysis, defaults, defaultRef);
  const starch       = resolveNutrient("starch_pct_dm",         farmerAnalysis, defaults, defaultRef);
  const cp           = resolveNutrient("crude_protein_pct_dm",  farmerAnalysis, defaults, defaultRef);
  const ca           = resolveNutrient("calcium_g_per_kg_dm",   farmerAnalysis, defaults, defaultRef);
  const p            = resolveNutrient("phosphorus_g_per_kg_dm",farmerAnalysis, defaults, defaultRef);

  // Convert DM % to fraction (e.g. 85% → 0.85) for calculations
  const dmFraction: ResolvedNutrientValue = {
    value:    dryMatterPct.value != null ? dryMatterPct.value / 100 : null,
    source:   dryMatterPct.source,
    reference: dryMatterPct.reference,
  };

  return {
    inventoryId:          inventoryItem.id,
    feedTypeId:           inventoryItem.feed_type_id,
    feedName:             inventoryItem.feed_name,
    availableStockKg:     inventoryItem.current_stock_kg,
    costPerKg:            inventoryItem.cost_per_kg,
    dryMatterFraction:    dmFraction,
    uflPerKgDm:           ufl,
    pdinGPerKgDm:         pdin,
    pdieGPerKgDm:         pdie,
    ndfPctDm:             ndf,
    adfPctDm:             adf,
    starchPctDm:          starch,
    crudeProteinPctDm:    cp,
    calciumGPerKgDm:      ca,
    phosphorusGPerKgDm:   p,
  };
}

/**
 * Count how many nutrients came from farmer analysis vs defaults.
 */
export function countNutrientSources(profile: ResolvedFeedProfile): {
  fromFarmerAnalysis: number;
  fromDefault: number;
  unavailable: number;
} {
  const fields: (keyof ResolvedFeedProfile)[] = [
    "dryMatterFraction","uflPerKgDm","pdinGPerKgDm","pdieGPerKgDm",
    "ndfPctDm","adfPctDm","starchPctDm","crudeProteinPctDm",
    "calciumGPerKgDm","phosphorusGPerKgDm",
  ];

  let fromFarmerAnalysis = 0, fromDefault = 0, unavailable = 0;
  for (const field of fields) {
    const v = profile[field] as ResolvedNutrientValue;
    if (v.source === "farmer_analysis") fromFarmerAnalysis++;
    else if (v.source === "default")    fromDefault++;
    else                                unavailable++;
  }
  return { fromFarmerAnalysis, fromDefault, unavailable };
}
