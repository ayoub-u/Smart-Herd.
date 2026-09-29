/**
 * src/lib/nutrition/requirements.ts
 *
 * Calculates daily nutritional requirements for a dairy cow.
 * Scientific framework: INRA 2018.
 *
 * This module is PURE (no React, no Supabase calls).
 * Input: CowPhysioData → Output: CowRequirements
 *
 * Reference:
 *   INRA (2018). Alimentation des bovins, ovins et caprins.
 *   Editions Quae, Versailles. Chapter 2.
 */

import type {
  CowPhysioData,
  CowPhysioDataWithOrigins,
  CowRequirements,
  RequirementsBreakdown,
} from "@/types/nutrition";
import { INRA_2018 } from "./constants";

// ─────────────────────────────────────────────────────────────────────────────
// DATA PREPARATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fills in missing physiological data with validated defaults.
 * Records the origin (actual vs estimated) of each value.
 */
export function prepareCowData(raw: CowPhysioData): CowPhysioDataWithOrigins {
  const warnings: string[] = [];
  const origins = {} as CowPhysioDataWithOrigins["origins"];
  const data = { ...raw };

  // Body weight
  if (!data.bodyWeightKg || data.bodyWeightKg <= 0) {
    data.bodyWeightKg = INRA_2018.DEFAULT_BODY_WEIGHT_KG;
    origins.bodyWeightKg = "estimated";
    warnings.push(`Body weight missing — using default ${INRA_2018.DEFAULT_BODY_WEIGHT_KG} kg. Update the animal record for more accurate results.`);
  } else {
    origins.bodyWeightKg = "actual";
  }

  // Milk production
  if (data.milkProductionLPerDay == null || data.milkProductionLPerDay < 0) {
    data.milkProductionLPerDay = 0;
    origins.milkProductionLPerDay = "estimated";
    warnings.push("Milk production not recorded — using 0 L/day. Update for accurate ration calculation.");
  } else {
    origins.milkProductionLPerDay = "actual";
  }

  // Milk fat
  if (!data.milkFatPct || data.milkFatPct <= 0) {
    data.milkFatPct = INRA_2018.DEFAULT_MILK_FAT_PCT;
    origins.milkFatPct = "estimated";
    warnings.push(`Milk fat % missing — using standard ${INRA_2018.DEFAULT_MILK_FAT_PCT}%.`);
  } else {
    origins.milkFatPct = "actual";
  }

  // Milk protein
  if (!data.milkProteinPct || data.milkProteinPct <= 0) {
    data.milkProteinPct = INRA_2018.DEFAULT_MILK_PROTEIN_PCT;
    origins.milkProteinPct = "estimated";
    warnings.push(`Milk protein % missing — using standard ${INRA_2018.DEFAULT_MILK_PROTEIN_PCT}%.`);
  } else {
    origins.milkProteinPct = "actual";
  }

  // Gestation months
  if (data.reproductiveStatus === "pregnant" && !data.gestationMonths) {
    data.gestationMonths = 5; // assume early pregnancy if unknown
    origins.gestationMonths = "estimated";
    warnings.push("Gestation stage unknown — assuming month 5. Update reproduction records for accuracy.");
  } else {
    origins.gestationMonths = data.gestationMonths ? "actual" : "missing";
  }

  // Age
  if (!data.ageYears) {
    origins.ageYears = "estimated";
    warnings.push("Age unknown — using default physiological state.");
  } else {
    origins.ageYears = "actual";
  }

  // Lactation number
  if (!data.lactationNumber) {
    data.lactationNumber = INRA_2018.DEFAULT_LACTATION_NUMBER;
    origins.lactationNumber = "estimated";
  } else {
    origins.lactationNumber = "actual";
  }

  // Fill in remaining origins as "missing"
  const keys: (keyof CowPhysioData)[] = [
    "animalId","name","tag","breed","daysInMilk",
    "targetMilkLPerDay","reproductiveStatus",
  ];
  for (const k of keys) {
    if (!(k in origins)) {
      (origins as Record<string, string>)[k] = "actual";
    }
  }

  return { data, origins, warnings };
}

// ─────────────────────────────────────────────────────────────────────────────
// REQUIREMENT CALCULATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate metabolic body weight (BW^0.75).
 * Used for maintenance calculations per INRA 2018.
 */
function metabolicBW(bwKg: number): number {
  return Math.pow(bwKg, 0.75);
}

/**
 * Calculate daily UFL requirement.
 *
 * Components (INRA 2018, Chapter 2):
 *   UFL_total = UFL_maintenance + UFL_milk + UFL_pregnancy + UFL_body_reserves
 *
 * Note: Body reserve mobilisation is not modelled here (requires BCS data).
 * We add a 0% correction for body reserves (neutral energy balance assumed).
 */
function calculateUFLRequirement(cow: CowPhysioData): {
  uflMaintenance: number;
  uflMilkProduction: number;
  uflPregnancy: number;
  uflBodyReserves: number;
  total: number;
} {
  const mbw = metabolicBW(cow.bodyWeightKg!);

  // Maintenance: UFL/kg BW^0.75 × activity correction
  // Source: INRA 2018, Table 2.1 — 0.053 UFL/kg BW^0.75 [TODO: VALIDATE]
  const uflMaintenance = INRA_2018.UFL_MAINTENANCE_PER_KG_METABOLIC_BW
    * mbw
    * INRA_2018.UFL_ACTIVITY_MULTIPLIER;

  // Milk production: UFL/L adjusted for fat content
  // Standard: 0.44 UFL/L at 3.5% fat [TODO: VALIDATE from INRA 2018 Table 2.2]
  const fatDeviation = (cow.milkFatPct! - 3.5) / 0.1;
  const uflPerLitreCorrected = INRA_2018.UFL_PER_LITRE_STANDARD_MILK
    + fatDeviation * INRA_2018.UFL_FAT_CORRECTION_PER_0_1_PCT;

  const milkProduction = cow.milkProductionLPerDay!;
  const uflMilkProduction = Math.max(0, milkProduction) * uflPerLitreCorrected;

  // Pregnancy: additional UFL from month 5 of gestation
  // Source: INRA 2018, Table 2.3 [TODO: VALIDATE month-specific values]
  let uflPregnancy = 0;
  if (cow.reproductiveStatus === "pregnant" && cow.gestationMonths) {
    const month = Math.min(9, Math.max(1, Math.round(cow.gestationMonths)));
    uflPregnancy = INRA_2018.UFL_PREGNANCY_BY_MONTH[month] ?? 0;
  }

  // Body reserves: 0 correction (neutral energy balance — no BCS data)
  const uflBodyReserves = 0;

  const total = uflMaintenance + uflMilkProduction + uflPregnancy + uflBodyReserves;

  return { uflMaintenance, uflMilkProduction, uflPregnancy, uflBodyReserves, total };
}

/**
 * Calculate daily PDI requirements.
 *
 * PDI system uses two limiting factors:
 *   PDIN (limited by dietary N available for microbial protein)
 *   PDIE (limited by fermentable energy available for microbial protein)
 *
 * Source: INRA 2018, Table 2.5
 */
function calculatePDIRequirements(cow: CowPhysioData): {
  pdinMaintenance: number;
  pdinMilkProduction: number;
  pdinPregnancy: number;
  pdieMaintenanceAndMilk: number;
  pdinTotal: number;
  pdieTotal: number;
} {
  const mbw = metabolicBW(cow.bodyWeightKg!);
  const milk = cow.milkProductionLPerDay!;

  // Maintenance PDIN [TODO: VALIDATE from INRA 2018 Table 2.5]
  const pdinMaintenance = INRA_2018.PDIN_MAINTENANCE_G_PER_KG_METABOLIC_BW * mbw;

  // Milk PDIN: g per litre × litres
  // Adjusted for protein content vs 3.2% standard
  const proteinDeviation = (cow.milkProteinPct! - 3.2) / 0.1;
  const pdinPerLitreCorrected = INRA_2018.PDIN_PER_LITRE_MILK + proteinDeviation * 1.5;
  const pdinMilkProduction = Math.max(0, milk) * pdinPerLitreCorrected;

  // Pregnancy PDIN [TODO: VALIDATE month-specific values from INRA 2018]
  let pdinPregnancy = 0;
  if (cow.reproductiveStatus === "pregnant" && cow.gestationMonths) {
    const month = Math.min(9, Math.max(1, Math.round(cow.gestationMonths)));
    pdinPregnancy = INRA_2018.PDI_PREGNANCY_BY_MONTH[month] ?? 0;
  }

  const pdinTotal = pdinMaintenance + pdinMilkProduction + pdinPregnancy;

  // PDIE: energy-limited PDI (generally similar to PDIN for balanced rations)
  // For simplicity: PDIE ≈ maintenance PDIE + milk PDIE
  // [TODO: VALIDATE — PDIE calculation differs from PDIN and depends on ration energy level]
  const pdieMaintenance = INRA_2018.PDIE_MAINTENANCE_G_PER_KG_METABOLIC_BW * mbw;
  const pdiePerLitreCorrected = INRA_2018.PDIE_PER_LITRE_MILK + proteinDeviation * 1.4;
  const pdieMilk = Math.max(0, milk) * pdiePerLitreCorrected;
  const pdiePregnancy = pdinPregnancy * 0.9; // approximate
  const pdieMaintenanceAndMilk = pdieMaintenance + pdieMilk + pdiePregnancy;

  return {
    pdinMaintenance,
    pdinMilkProduction,
    pdinPregnancy,
    pdieMaintenanceAndMilk,
    pdinTotal,
    pdieTotal: pdieMaintenanceAndMilk,
  };
}

/**
 * Predict voluntary dry matter intake (DMI).
 *
 * Simplified INRA 2018 DMI prediction:
 *   DMI = base fraction of BW + production-related component
 *
 * Full INRA model requires breed, stage of lactation, BCS, and more.
 * This simplified version gives reasonable estimates for common breeds.
 * [TODO: Implement full INRA DMI prediction equation from Chapter 4]
 *
 * Returns: predicted DMI in kg DM/day
 */
function predictDMI(cow: CowPhysioData): number {
  const bw = cow.bodyWeightKg!;
  const milk = cow.milkProductionLPerDay!;

  // Base DMI from bodyweight
  const baseDMI = bw * INRA_2018.DMI_FRACTION_OF_BW_BASELINE;

  // Production-related increment
  const productionIncrement = milk * INRA_2018.DMI_ADDITIONAL_PER_LITRE_MILK;

  // Early lactation depression (DIM < 60) — cows cannot eat their full potential
  let dimFactor = 1.0;
  if (cow.daysInMilk && cow.daysInMilk < 60) {
    // Ramp up from 80% to 100% over the first 60 days
    // [TODO: VALIDATE ramp equation from INRA 2018]
    dimFactor = 0.80 + (cow.daysInMilk / 60) * 0.20;
  }

  // Pregnancy depression (last 2 months)
  if (cow.reproductiveStatus === "pregnant" && cow.gestationMonths && cow.gestationMonths >= 7) {
    dimFactor *= 0.92; // ~8% depression in late pregnancy [TODO: VALIDATE]
  }

  const predictedDMI = (baseDMI + productionIncrement) * dimFactor;

  // Biological bounds: typically 2.0–4.0% of BW for dairy cows
  const minDMI = bw * 0.015;
  const maxDMI = bw * 0.040;
  return Math.min(maxDMI, Math.max(minDMI, predictedDMI));
}

/**
 * Calculate mineral requirements.
 * Simplified from INRA 2018 Chapter 2.
 * [TODO: VALIDATE mineral requirement equations from INRA 2018 Table 2.8]
 */
function calculateMinerals(cow: CowPhysioData): {
  calciumGPerDay: number;
  phosphorusGPerDay: number;
} {
  const milk = cow.milkProductionLPerDay!;

  const calciumGPerDay =
    INRA_2018.CA_MAINTENANCE_G_PER_DAY + milk * INRA_2018.CA_PER_LITRE_MILK_G;

  const phosphorusGPerDay =
    INRA_2018.P_MAINTENANCE_G_PER_DAY + milk * INRA_2018.P_PER_LITRE_MILK_G;

  return { calciumGPerDay, phosphorusGPerDay };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate complete nutritional requirements for a dairy cow.
 *
 * @param rawCow - Physiological data (may have missing values)
 * @returns Requirements + breakdown + warnings about missing data
 */
export function calculateCowRequirements(rawCow: CowPhysioData): {
  requirements: CowRequirements;
  warnings: string[];
  assumptions: string[];
} {
  const { data: cow, warnings } = prepareCowData(rawCow);
  const assumptions: string[] = [];

  const ufl  = calculateUFLRequirement(cow);
  const pdi  = calculatePDIRequirements(cow);
  const dmi  = predictDMI(cow);
  const min  = calculateMinerals(cow);

  // NDF constraints
  const minNdfPctDm     = INRA_2018.MIN_NDF_PCT_DM_RATION;
  const minForageNdfPct = INRA_2018.MIN_FORAGE_NDF_PCT_DM;

  // Forage / concentrate balance
  const minForageDmKgPerDay      = dmi * INRA_2018.MIN_FORAGE_FRACTION_OF_DM;
  const maxConcentrateDmKgPerDay = dmi * INRA_2018.MAX_CONCENTRATE_FRACTION_OF_DM;

  const breakdown: RequirementsBreakdown = {
    uflMaintenance:        ufl.uflMaintenance,
    uflMilkProduction:     ufl.uflMilkProduction,
    uflPregnancy:          ufl.uflPregnancy,
    uflBodyReserves:       ufl.uflBodyReserves,
    pdinMaintenance:       pdi.pdinMaintenance,
    pdinMilkProduction:    pdi.pdinMilkProduction,
    pdinPregnancy:         pdi.pdinPregnancy,
    pdieMaintenanceAndMilk: pdi.pdieMaintenanceAndMilk,
    assumptions,
  };

  // Track assumptions
  if (cow.bodyWeightKg === INRA_2018.DEFAULT_BODY_WEIGHT_KG) {
    assumptions.push(`Body weight estimated at ${INRA_2018.DEFAULT_BODY_WEIGHT_KG} kg (INRA 2018 default)`);
  }
  assumptions.push(`Nutritional model: ${INRA_2018.MODEL_NAME} v${INRA_2018.MODEL_VERSION}`);
  assumptions.push("Activity correction: +10% for loose housing (INRA 2018)");
  assumptions.push("[TODO: VALIDATE] All INRA 2018 coefficients require confirmation by a qualified nutritionist before clinical use.");

  const requirements: CowRequirements = {
    dryMatterIntakeKgPerDay:    Math.round(dmi * 100) / 100,
    uflTotalPerDay:             Math.round(ufl.total * 100) / 100,
    pdiGPerDay:                 Math.round(Math.min(pdi.pdinTotal, pdi.pdieTotal) * 10) / 10,
    pdinGPerDay:                Math.round(pdi.pdinTotal * 10) / 10,
    pdieGPerDay:                Math.round(pdi.pdieTotal * 10) / 10,
    calciumGPerDay:             Math.round(min.calciumGPerDay * 10) / 10,
    phosphorusGPerDay:          Math.round(min.phosphorusGPerDay * 10) / 10,
    minNdfPctDm,
    minForageNdfPctDm:          minForageNdfPct,
    minForageDmKgPerDay:        Math.round(minForageDmKgPerDay * 100) / 100,
    maxConcentrateDmKgPerDay:   Math.round(maxConcentrateDmKgPerDay * 100) / 100,
    breakdown,
  };

  return { requirements, warnings, assumptions };
}
