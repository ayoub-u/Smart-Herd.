/**
 * src/lib/nutrition/constants.ts
 *
 * Scientific constants and coefficients for the INRA 2018 dairy cow nutrition system.
 *
 * Reference:
 *   INRA (2018). Alimentation des bovins, ovins et caprins.
 *   Besoins des animaux — Valeurs des aliments.
 *   Editions Quae, Versailles.
 *
 * IMPORTANT: Every constant must have a documented source.
 * Constants marked [TODO: VALIDATE] require confirmation from the INRA 2018 tables
 * by a qualified animal nutritionist before clinical use.
 *
 * Unit system: INRA 2018
 *   Energy: UFL (Unité Fourragère Lait)  — 1 UFL = 1,700 kcal NE_L = 7.113 MJ NE_L
 *   Protein: PDI system (g/day)
 *   Dry matter: kg/day
 */

export const INRA_2018 = {
  // ── Maintenance energy requirements ───────────────────────────────────────
  /**
   * UFL/kg metabolic body weight (BW^0.75) per day for maintenance.
   * Source: INRA 2018, Chapter 2, Table 2.1 — dairy cows: 0.053 UFL/kg BW^0.75/day
   * [TODO: VALIDATE exact coefficient from INRA 2018 Table 2.1]
   */
  UFL_MAINTENANCE_PER_KG_METABOLIC_BW: 0.053,

  /**
   * Correction factor for activity/climate (conservative standing/walking allowance).
   * This adds ~10% to maintenance for loose housing.
   * Source: INRA 2018, Chapter 2 — housing/activity corrections.
   * [TODO: VALIDATE — use a configurable parameter for this]
   */
  UFL_ACTIVITY_MULTIPLIER: 1.10,

  // ── Milk production energy requirements ───────────────────────────────────
  /**
   * UFL per litre of milk at standard composition (3.5% fat, 3.2% protein).
   * Source: INRA 2018, Table 2.2 — 0.44 UFL/L standard milk
   * [TODO: VALIDATE exact value from INRA 2018 Table 2.2]
   */
  UFL_PER_LITRE_STANDARD_MILK: 0.44,

  /**
   * Correction for actual milk fat content vs 3.5% standard.
   * UFL correction per 0.1% deviation from 3.5% fat.
   * Source: INRA 2018 energy correction equation for milk composition.
   * [TODO: VALIDATE correction equation from INRA 2018]
   */
  UFL_FAT_CORRECTION_PER_0_1_PCT: 0.0085,

  // ── Pregnancy energy requirements ─────────────────────────────────────────
  /**
   * Additional UFL per month of gestation (from month 5 onwards).
   * Source: INRA 2018, Table 2.3 — gestation requirements.
   * These values are approximate and month-specific in the full table.
   * [TODO: VALIDATE from INRA 2018 Table 2.3 — use month-specific values]
   */
  UFL_PREGNANCY_BY_MONTH: {
    5: 0.4,   // [TODO: VALIDATE]
    6: 0.6,   // [TODO: VALIDATE]
    7: 0.9,   // [TODO: VALIDATE]
    8: 1.4,   // [TODO: VALIDATE]
    9: 2.0,   // [TODO: VALIDATE]
  } as Record<number, number>,

  // ── Body condition / energy reserves ─────────────────────────────────────
  /**
   * UFL per kg of body weight change (mobilisation or deposition).
   * Source: INRA 2018, Chapter 2 — body reserves.
   * 1 kg BW loss provides ~4.5 UFL of mobilisable energy in early lactation.
   * [TODO: VALIDATE from INRA 2018]
   */
  UFL_PER_KG_BW_CHANGE: 4.5,

  // ── PDI maintenance requirements ──────────────────────────────────────────
  /**
   * g PDI per kg metabolic body weight per day for maintenance.
   * Source: INRA 2018, Table 2.5
   * [TODO: VALIDATE — approximate value; exact from Table 2.5]
   */
  PDI_MAINTENANCE_G_PER_KG_METABOLIC_BW: 2.2,

  /**
   * g PDIN per kg metabolic BW for maintenance.
   * [TODO: VALIDATE from INRA 2018 Table 2.5]
   */
  PDIN_MAINTENANCE_G_PER_KG_METABOLIC_BW: 2.2,

  /**
   * g PDIE per kg metabolic BW for maintenance.
   * [TODO: VALIDATE from INRA 2018 Table 2.5]
   */
  PDIE_MAINTENANCE_G_PER_KG_METABOLIC_BW: 2.2,

  // ── PDI milk production requirements ─────────────────────────────────────
  /**
   * g PDIN per litre of standard milk (3.2% protein).
   * Source: INRA 2018, Table 2.5
   * [TODO: VALIDATE exact coefficient]
   */
  PDIN_PER_LITRE_MILK: 46,

  /**
   * g PDIE per litre of standard milk (3.2% protein).
   * Source: INRA 2018, Table 2.5
   * [TODO: VALIDATE exact coefficient]
   */
  PDIE_PER_LITRE_MILK: 44,

  // ── Pregnancy PDI requirements ────────────────────────────────────────────
  /**
   * Additional g PDI per day from month 5 of gestation.
   * [TODO: VALIDATE month-specific values from INRA 2018]
   */
  PDI_PREGNANCY_BY_MONTH: {
    5: 40,  // [TODO: VALIDATE]
    6: 60,  // [TODO: VALIDATE]
    7: 90,  // [TODO: VALIDATE]
    8: 130, // [TODO: VALIDATE]
    9: 180, // [TODO: VALIDATE]
  } as Record<number, number>,

  // ── Dry matter intake prediction ──────────────────────────────────────────
  /**
   * Predicted voluntary DMI as a fraction of bodyweight (baseline).
   * Source: INRA 2018, Chapter 4 — DMI prediction.
   * Typical: 2.0–2.5% of BW for mid-lactation Holstein.
   * This is a simplified linear approximation; the full INRA model uses
   * a more complex equation with breed, DIM, and production level.
   * [TODO: VALIDATE — implement full INRA DMI prediction equation]
   */
  DMI_FRACTION_OF_BW_BASELINE: 0.022, // 2.2% of BW

  /**
   * Additional DMI per litre of milk (simplified production allowance).
   * [TODO: VALIDATE from INRA 2018 DMI prediction]
   */
  DMI_ADDITIONAL_PER_LITRE_MILK: 0.30, // kg DM / L milk

  // ── Fibre / rumen health constraints ─────────────────────────────────────
  /**
   * Minimum NDF % of DM in total ration for rumen health.
   * Standard recommendation: ≥ 28–30% NDF DM.
   * Source: INRA 2018 / standard practice.
   */
  MIN_NDF_PCT_DM_RATION: 28,

  /**
   * Minimum forage NDF as % of ration DM.
   * Ensures adequate physical fibre for rumen function.
   * Standard: ≥ 20% forage NDF of ration DM.
   * [TODO: VALIDATE from INRA 2018]
   */
  MIN_FORAGE_NDF_PCT_DM: 20,

  /**
   * Minimum forage proportion of ration DM (50%).
   * Prevents rumen acidosis / ensures fibre adequacy.
   * Standard practice; farm-specific adjustments may apply.
   */
  MIN_FORAGE_FRACTION_OF_DM: 0.50,

  /**
   * Maximum concentrate fraction of ration DM.
   * Above 50% concentrate, rumen acidosis risk increases significantly.
   */
  MAX_CONCENTRATE_FRACTION_OF_DM: 0.50,

  // ── Default assumptions for missing data ─────────────────────────────────
  /**
   * Default bodyweight (kg) when missing.
   * Typical Holstein dairy cow: 600 kg.
   * [TODO: VALIDATE — breed-specific defaults would be more accurate]
   */
  DEFAULT_BODY_WEIGHT_KG: 600,

  /**
   * Default milk fat percentage when not provided.
   */
  DEFAULT_MILK_FAT_PCT: 3.5,

  /**
   * Default milk protein percentage when not provided.
   */
  DEFAULT_MILK_PROTEIN_PCT: 3.2,

  /**
   * Default lactation number for unknown animals.
   */
  DEFAULT_LACTATION_NUMBER: 2,

  // ── Mineral requirements (simplified) ────────────────────────────────────
  /**
   * g Ca/day for maintenance.
   * Source: INRA 2018, Table 2.8.
   * [TODO: VALIDATE]
   */
  CA_MAINTENANCE_G_PER_DAY: 15,

  /** g Ca per litre of milk. Source: INRA 2018. [TODO: VALIDATE] */
  CA_PER_LITRE_MILK_G: 1.25,

  /** g P/day for maintenance. [TODO: VALIDATE from INRA 2018] */
  P_MAINTENANCE_G_PER_DAY: 10,

  /** g P per litre of milk. [TODO: VALIDATE from INRA 2018] */
  P_PER_LITRE_MILK_G: 0.90,

  // ── Model identification ──────────────────────────────────────────────────
  MODEL_NAME: "INRA_2018",
  MODEL_VERSION: "1.0.0-beta",
  MODEL_DESCRIPTION: "INRA 2018 dairy cattle nutrition system (UFL/PDI)",
};

/** Feed categories for constraint logic */
export const FORAGE_CATEGORIES = new Set([
  "forage",
  "grass_silage",
  "corn_silage",
  "hay",
  "straw",
]);

export const CONCENTRATE_CATEGORIES = new Set([
  "cereal",
  "protein_feed",
  "by_product",
  "concentrate",
  "mineral",
]);

/**
 * Per-feed maximum inclusion limits (kg DM/cow/day).
 * Source: standard practice / INRA 2018 recommendations.
 * [TODO: VALIDATE each limit from INRA 2018 or agronomic references]
 */
export const FEED_MAX_INCLUSIONS_KG_DM: Record<string, number> = {
  "soybean_meal":       3.0,  // max 3 kg DM/day (palatability + cost)
  "rapeseed_meal":      2.5,  // [TODO: VALIDATE]
  "sunflower_meal":     2.5,  // [TODO: VALIDATE]
  "molasses":           1.0,  // [TODO: VALIDATE]
  "wheat":              3.0,  // starch loading limit
  "corn_grain":         4.0,  // [TODO: VALIDATE]
  "barley":             4.0,  // [TODO: VALIDATE]
  "urea":               0.15, // toxic above ~150g/day
};
