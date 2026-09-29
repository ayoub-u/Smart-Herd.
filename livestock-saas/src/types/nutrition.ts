/**
 * src/types/nutrition.ts
 *
 * TypeScript domain types for the SmartHerd Nutrition & Ration System.
 * All types are independent of React and can be used in services, hooks, and tests.
 *
 * Scientific framework: INRA 2018 dairy cattle nutrition system
 * Reference: Alimentation des bovins, ovins et caprins, INRA 2018, Quae editions
 */

// ─────────────────────────────────────────────────────────────────────────────
// FEED TYPES & NUTRITIONAL COMPOSITION
// ─────────────────────────────────────────────────────────────────────────────

/** Global feed type catalog entry (read-only reference data) */
export interface FeedType {
  id: string;
  name: string;
  /** e.g. "forage", "cereal", "protein_feed", "by_product", "mineral" */
  category: string;
  description: string | null;
  /** "kg", "bale", "tonne" */
  default_unit: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Default nutritional composition for a feed type.
 * All values on a DRY MATTER (DM) basis unless noted.
 * Source: INRA 2018 Table of Feed Values.
 *
 * Units:
 *   dry_matter_pct     : % of fresh matter
 *   ufl_per_kg_dm      : UFL / kg DM  (Unité Fourragère Lait — milk energy unit)
 *   pdin_g_per_kg_dm   : g PDIN / kg DM (protein truly digestible, N-limited)
 *   pdie_g_per_kg_dm   : g PDIE / kg DM (protein truly digestible, energy-limited)
 *   ndf_pct_dm         : % NDF of DM (Neutral Detergent Fiber)
 *   adf_pct_dm         : % ADF of DM (Acid Detergent Fiber)
 *   starch_pct_dm      : % starch of DM
 *   crude_protein_pct_dm : % MAT (Matière Azotée Totale) of DM
 *   calcium_g_per_kg_dm : g Ca / kg DM
 *   phosphorus_g_per_kg_dm : g P / kg DM
 */
export interface FeedDefaultNutrients {
  id: string;
  feed_type_id: string;
  dry_matter_pct: number | null;           // % fresh matter
  ufl_per_kg_dm: number | null;            // UFL/kg DM
  pdin_g_per_kg_dm: number | null;         // g/kg DM
  pdie_g_per_kg_dm: number | null;         // g/kg DM
  ndf_pct_dm: number | null;               // % DM
  adf_pct_dm: number | null;               // % DM
  starch_pct_dm: number | null;            // % DM
  crude_protein_pct_dm: number | null;     // % DM
  calcium_g_per_kg_dm: number | null;      // g/kg DM
  phosphorus_g_per_kg_dm: number | null;   // g/kg DM
  /** e.g. "INRA 2018 Table 8.1" */
  source_reference: string | null;
  methodology: string | null;              // e.g. "INRA 2018"
  version: string | null;
  created_at: string;
  updated_at: string;
}

/** Farm-specific nutritional analysis (laboratory results) for an inventory batch */
export interface FarmFeedAnalysis {
  id: string;
  farm_id: string;
  /** Links to the specific inventory item batch */
  inventory_id: string;
  feed_type_id: string;
  // Same nutrient fields as defaults — populated only for measured values
  dry_matter_pct: number | null;
  ufl_per_kg_dm: number | null;
  pdin_g_per_kg_dm: number | null;
  pdie_g_per_kg_dm: number | null;
  ndf_pct_dm: number | null;
  adf_pct_dm: number | null;
  starch_pct_dm: number | null;
  crude_protein_pct_dm: number | null;
  calcium_g_per_kg_dm: number | null;
  phosphorus_g_per_kg_dm: number | null;
  laboratory_name: string | null;
  analysis_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Extended farm feed inventory item linking to global feed type catalog */
export interface FarmFeedInventory {
  id: string;
  farm_id: string;
  /** FK → feed_types.id — null for legacy items without type */
  feed_type_id: string | null;
  /** Human-readable name (from feed_types or entered by farmer) */
  feed_name: string;
  category: string;
  current_stock_kg: number;
  cost_per_kg: number;
  purchase_date: string | null;
  batch_name: string | null;
  /** Whether farm has provided laboratory analysis */
  analysis_available: boolean;
  analysis_id: string | null;
  supplier: string | null;
  reorder_level_kg: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// RESOLVED NUTRIENT PROFILE
// Used by the calculation engine — already merged default + farm analysis
// ─────────────────────────────────────────────────────────────────────────────

export type NutrientSource = "farmer_analysis" | "default" | "unavailable";

export interface ResolvedNutrientValue {
  value: number | null;
  source: NutrientSource;
  /** e.g. "INRA 2018 Table 8.1" or "Lab: Algerian Agri-Lab 2024-01-15" */
  reference: string | null;
}

export interface ResolvedFeedProfile {
  inventoryId: string;
  feedTypeId: string | null;
  feedName: string;
  /** kg available for use */
  availableStockKg: number;
  costPerKg: number;
  /** Fraction 0–1 (e.g. 0.85 for 85% DM) */
  dryMatterFraction:    ResolvedNutrientValue;
  uflPerKgDm:           ResolvedNutrientValue;
  pdinGPerKgDm:         ResolvedNutrientValue;
  pdieGPerKgDm:         ResolvedNutrientValue;
  ndfPctDm:             ResolvedNutrientValue;
  adfPctDm:             ResolvedNutrientValue;
  starchPctDm:          ResolvedNutrientValue;
  crudeProteinPctDm:    ResolvedNutrientValue;
  calciumGPerKgDm:      ResolvedNutrientValue;
  phosphorusGPerKgDm:   ResolvedNutrientValue;
}

// ─────────────────────────────────────────────────────────────────────────────
// COW PHYSIOLOGICAL DATA FOR RATION CALCULATION
// ─────────────────────────────────────────────────────────────────────────────

export interface CowPhysioData {
  animalId: string;
  name: string;
  tag: string;
  breed: string | null;
  bodyWeightKg: number | null;
  ageYears: number | null;
  /** Current actual milk production in L/day */
  milkProductionLPerDay: number | null;
  /** Milk fat % */
  milkFatPct: number | null;
  /** Milk protein % */
  milkProteinPct: number | null;
  daysInMilk: number | null;
  lactationNumber: number | null;
  reproductiveStatus: "lactating" | "pregnant" | "dry" | "open";
  /** Months of gestation (0 if not pregnant) */
  gestationMonths: number | null;
  /** Optional target production (if farmer sets a higher target) */
  targetMilkLPerDay: number | null;
}

export type DataOrigin = "actual" | "estimated" | "missing";

export interface CowPhysioDataWithOrigins {
  data: CowPhysioData;
  origins: Record<keyof CowPhysioData, DataOrigin>;
  warnings: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// NUTRITIONAL REQUIREMENTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Daily nutritional requirements for a dairy cow.
 * INRA 2018 system.
 *
 * UFL: Unité Fourragère Lait (energy for milk production)
 * PDI: Protéines Digestibles dans l'Intestin (digestible protein)
 *
 * Reference:
 *   INRA 2018, Chapter 2 (requirements for maintenance, production, pregnancy, body reserves)
 */
export interface CowRequirements {
  /** kg DM/day — predicted voluntary DM intake */
  dryMatterIntakeKgPerDay: number;
  /** UFL/day — total energy requirement */
  uflTotalPerDay: number;
  /** g PDI/day — minimum of PDIN and PDIE determines the limiting factor */
  pdiGPerDay: number;
  /** g PDIN/day */
  pdinGPerDay: number;
  /** g PDIE/day */
  pdieGPerDay: number;
  /** g Ca/day */
  calciumGPerDay: number;
  /** g P/day */
  phosphorusGPerDay: number;
  /** % DM — minimum NDF for rumen health */
  minNdfPctDm: number;
  /** % DM — minimum forage NDF */
  minForageNdfPctDm: number;
  /** kg DM/day — minimum forage DM */
  minForageDmKgPerDay: number;
  /** kg DM/day — maximum concentrate DM (rumen safety) */
  maxConcentrateDmKgPerDay: number;
  /** Breakdown of requirements for transparency */
  breakdown: RequirementsBreakdown;
}

export interface RequirementsBreakdown {
  // UFL components (INRA 2018)
  uflMaintenance: number;
  uflMilkProduction: number;
  uflPregnancy: number;
  uflBodyReserves: number;
  // PDI components
  pdinMaintenance: number;
  pdinMilkProduction: number;
  pdinPregnancy: number;
  pdieMaintenanceAndMilk: number;
  // Assumptions used
  assumptions: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// RATION OPTIMIZATION
// ─────────────────────────────────────────────────────────────────────────────

export interface RationConstraints {
  maxTotalDmKgPerDay: number;
  minTotalDmKgPerDay: number;
  minForageDmKgPerDay: number;
  maxConcentrateDmKgPerDay: number;
  minNdfPctDm: number;
  /** Per-feed maximum inclusion in kg DM/day (safety/palatability limits) */
  feedMaxInclusions: Record<string, number>;
}

/** A single feed's allocation in a ration */
export interface RationFeedItem {
  inventoryId: string;
  feedTypeId: string | null;
  feedName: string;
  /** kg as-fed per cow per day */
  quantityAsFedKgPerCow: number;
  /** kg DM per cow per day */
  quantityDmKgPerCow: number;
  costPerCow: number;
  nutrientContributions: {
    ufl: number;
    pdinG: number;
    pdieG: number;
    ndfKgDm: number;
    calciumG: number;
    phosphorusG: number;
  };
  /** Source traceability for each nutrient value used */
  nutrientSources: Record<string, NutrientSource>;
}

/** Full balance of a ration vs requirements */
export interface NutritionalBalance {
  uflRequired:      number;
  uflProvided:      number;
  uflCoverage:      number;  // 0–1+ (1 = exact match, >1 = excess)
  pdinRequired:     number;
  pdinProvided:     number;
  pdieRequired:     number;
  pdieProvided:     number;
  /** The limiting PDI factor */
  pdiLimiting:      "pdin" | "pdie" | "both";
  pdiCoverage:      number;
  dmIntakeRequired: number;
  dmIntakeActual:   number;
  ndfActualPctDm:   number;
  ndfMinRequired:   number;
  calciumProvided:  number;
  calciumRequired:  number;
  phosphorusProvided: number;
  phosphorusRequired: number;
  /** Overall adequacy flags */
  energyAdequate:   boolean;
  proteinAdequate:  boolean;
  fiberAdequate:    boolean;
  dmIntakeOk:       boolean;
}

export type RationFeasibility =
  | "feasible"          // Requirements fully met
  | "partial"           // Some requirements not met — best possible ration shown
  | "infeasible";       // Cannot even partially formulate (e.g. empty inventory)

export interface RationResult {
  cowId: string;
  cowName: string;
  cowTag: string;
  calculationDate: string;
  feasibility: RationFeasibility;
  requirements: CowRequirements;
  feedItems: RationFeedItem[];
  nutritionalBalance: NutritionalBalance;
  /** DZD per cow per day */
  dailyCostPerCow: number;
  /** DZD per month (30 days) */
  monthlyCostPerCow: number;
  /** Data quality warnings */
  warnings: string[];
  /** What additional feeds would improve the ration */
  deficiencyRecommendations: DeficiencyRecommendation[];
  /** Which nutrient values came from defaults vs lab analysis */
  dataSourceSummary: { fromFarmerAnalysis: number; fromDefault: number };
  /** Assumptions made for missing cow data */
  assumptionsUsed: string[];
}

export interface DeficiencyRecommendation {
  nutrient: string;
  deficit: number;
  unit: string;
  suggestedFeeds: Array<{
    feedName: string;
    estimatedQuantityKgPerDay: number;
  }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVE RATION & HISTORY
// ─────────────────────────────────────────────────────────────────────────────

export type RationStatus = "draft" | "active" | "archived";
export type RationScope  = "individual" | "group" | "herd";

export interface RationRecord {
  id: string;
  farm_id: string;
  name: string;
  scope: RationScope;
  cow_id: string | null;
  objective: string;
  status: RationStatus;
  nutritional_model: string;     // e.g. "INRA_2018"
  nutritional_model_version: string;
  created_at: string;
  confirmed_at: string | null;
  created_by: string;
}

export interface RationItemRecord {
  id: string;
  ration_id: string;
  feed_inventory_id: string;
  feed_type_id: string | null;
  feed_name: string;
  quantity_per_cow_per_day_kg: number;
  dm_fraction: number;
  cost_per_kg_at_confirmation: number;
  /** JSON snapshot of all nutritional values used — immutable after confirmation */
  nutrient_profile_snapshot: string;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// DB ROW TYPES (for Supabase)
// ─────────────────────────────────────────────────────────────────────────────

export interface DbFeedType {
  id: string;
  name: string;
  category: string;
  description: string | null;
  default_unit: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbFeedDefaultNutrients {
  id: string;
  feed_type_id: string;
  dry_matter_pct: number | null;
  ufl_per_kg_dm: number | null;
  pdin_g_per_kg_dm: number | null;
  pdie_g_per_kg_dm: number | null;
  ndf_pct_dm: number | null;
  adf_pct_dm: number | null;
  starch_pct_dm: number | null;
  crude_protein_pct_dm: number | null;
  calcium_g_per_kg_dm: number | null;
  phosphorus_g_per_kg_dm: number | null;
  source_reference: string | null;
  methodology: string | null;
  version: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbFarmFeedAnalysis {
  id: string;
  farm_id: string;
  inventory_id: string;
  feed_type_id: string;
  dry_matter_pct: number | null;
  ufl_per_kg_dm: number | null;
  pdin_g_per_kg_dm: number | null;
  pdie_g_per_kg_dm: number | null;
  ndf_pct_dm: number | null;
  adf_pct_dm: number | null;
  starch_pct_dm: number | null;
  crude_protein_pct_dm: number | null;
  calcium_g_per_kg_dm: number | null;
  phosphorus_g_per_kg_dm: number | null;
  laboratory_name: string | null;
  analysis_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbRation {
  id: string;
  farm_id: string;
  name: string;
  scope: RationScope;
  cow_id: string | null;
  objective: string;
  status: RationStatus;
  nutritional_model: string;
  nutritional_model_version: string;
  created_at: string;
  confirmed_at: string | null;
  created_by: string;
}

export interface DbRationItem {
  id: string;
  ration_id: string;
  feed_inventory_id: string;
  feed_type_id: string | null;
  feed_name: string;
  quantity_per_cow_per_day_kg: number;
  dm_fraction: number;
  cost_per_kg_at_confirmation: number;
  nutrient_profile_snapshot: string;
  created_at: string;
}

export interface DbInventoryTransaction {
  id: string;
  farm_id: string;
  inventory_item_id: string;
  transaction_type: "purchase" | "consumption" | "adjustment" | "waste" | "correction";
  quantity_kg: number;
  transaction_date: string;
  source: string;
  reference_id: string | null;
  notes: string | null;
  created_at: string;
}
