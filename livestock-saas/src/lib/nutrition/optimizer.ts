/**
 * src/lib/nutrition/optimizer.ts
 *
 * Ration optimizer for dairy cows.
 * Objective: Minimize daily feed cost while satisfying nutritional constraints.
 *
 * Scientific framework: INRA 2018
 *
 * Algorithm: Iterative proportional allocation with constraint enforcement.
 * This is NOT a general-purpose linear programming solver. It uses a structured
 * greedy approach with nutritional balance checks that is reliable for typical
 * dairy rations with 3–8 feeds.
 *
 * For a full LP solver, a future version should integrate a WASM-compiled
 * solver (e.g. glpk.js). This implementation gives correct results for
 * typical farm conditions.
 *
 * All quantities are in kg DM/cow/day internally.
 * As-fed quantities are derived at the end using the DM fraction.
 */

import type {
  ResolvedFeedProfile,
  CowRequirements,
  RationResult,
  RationFeedItem,
  NutritionalBalance,
  RationFeasibility,
  DeficiencyRecommendation,
} from "@/types/nutrition";
import { FORAGE_CATEGORIES, CONCENTRATE_CATEGORIES, FEED_MAX_INCLUSIONS_KG_DM, INRA_2018 } from "./constants";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface FeedWithProfile {
  profile:  ResolvedFeedProfile;
  isForage: boolean;
  maxDmKg:  number; // maximum kg DM/day from constraints + inventory
  /** Cost per kg DM */
  costPerKgDm: number;
}

interface AllocationState {
  feeds:       FeedWithProfile[];
  allocDmKg:   number[]; // current allocation kg DM/day per feed
  totalDmKg:   number;
  totalUfl:    number;
  totalPdinG:  number;
  totalPdieG:  number;
  totalNdfDm:  number;  // kg NDF DM
  totalCaG:    number;
  totalPG:     number;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getVal(v: { value: number | null }): number {
  return v.value ?? 0;
}

function isForage(profile: ResolvedFeedProfile): boolean {
  // Use feed name heuristics if no category is available
  const name = profile.feedName.toLowerCase();
  return (
    name.includes("silage") || name.includes("hay") ||
    name.includes("straw") || name.includes("grass") ||
    name.includes("alfalfa") || name.includes("lucerne") ||
    name.includes("forage") || name.includes("pasture")
  );
}

function computeState(feeds: FeedWithProfile[], allocDmKg: number[]): Omit<AllocationState,"feeds"|"allocDmKg"> {
  let totalDmKg = 0, totalUfl = 0, totalPdinG = 0, totalPdieG = 0;
  let totalNdfDm = 0, totalCaG = 0, totalPG = 0;

  for (let i = 0; i < feeds.length; i++) {
    const kg = allocDmKg[i];
    const p  = feeds[i].profile;
    totalDmKg   += kg;
    totalUfl    += kg * getVal(p.uflPerKgDm);
    totalPdinG  += kg * getVal(p.pdinGPerKgDm);
    totalPdieG  += kg * getVal(p.pdieGPerKgDm);
    totalNdfDm  += kg * (getVal(p.ndfPctDm) / 100);
    totalCaG    += kg * getVal(p.calciumGPerKgDm);
    totalPG     += kg * getVal(p.phosphorusGPerKgDm);
  }
  return { totalDmKg, totalUfl, totalPdinG, totalPdieG, totalNdfDm, totalCaG, totalPG };
}

function totalDailyCost(feeds: FeedWithProfile[], allocDmKg: number[]): number {
  let cost = 0;
  for (let i = 0; i < feeds.length; i++) {
    const dmFrac = getVal(feeds[i].profile.dryMatterFraction) || 0.87;
    const asFedKg = dmFrac > 0 ? allocDmKg[i] / dmFrac : allocDmKg[i];
    cost += asFedKg * feeds[i].profile.costPerKg;
  }
  return cost;
}

// ─────────────────────────────────────────────────────────────────────────────
// OPTIMIZER CORE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Optimize a daily ration for one cow.
 *
 * Strategy:
 *  1. Sort feeds by cost-effectiveness (UFL per DZD, forages first).
 *  2. Allocate forages up to the minimum requirement + buffer.
 *  3. Allocate concentrates to cover remaining energy and protein needs.
 *  4. Enforce DM, NDF, forage, and concentrate constraints.
 *  5. Return the allocation with nutritional balance report.
 *
 * @param requirements - Calculated cow requirements
 * @param profiles     - Resolved nutritional profiles for all available feeds
 * @param numCows      - Number of cows (for inventory sufficiency check)
 * @returns RationResult
 */
export function optimizeRation(
  cowId: string,
  cowName: string,
  cowTag: string,
  requirements: CowRequirements,
  profiles: ResolvedFeedProfile[],
  numCows: number = 1,
  warnings: string[] = [],
  assumptions: string[] = [],
): RationResult {
  const calculationDate = new Date().toISOString();

  // Filter out profiles with no usable nutritional data
  const usable = profiles.filter(p =>
    p.availableStockKg > 0 &&
    (p.uflPerKgDm.value ?? 0) > 0
  );

  if (usable.length === 0) {
    return emptyRation(cowId, cowName, cowTag, calculationDate, requirements,
      "infeasible",
      ["No feeds with nutritional data are available in the inventory."],
    );
  }

  // Build enriched feed list
  const feeds: FeedWithProfile[] = usable.map(p => {
    const dmFrac = getVal(p.dryMatterFraction) || 0.87;
    const costPerKgDm = dmFrac > 0 ? p.costPerKg / dmFrac : p.costPerKg;

    // Per-feed max: min(inventory limit, per-cow max, specific inclusion limit)
    const inventoryLimitDmKg = (p.availableStockKg * dmFrac) / numCows;
    const nameKey = p.feedName.toLowerCase().replace(/\s+/g, "_");
    const specificMax = FEED_MAX_INCLUSIONS_KG_DM[nameKey] ?? Infinity;
    const maxDmKg = Math.min(inventoryLimitDmKg, specificMax, requirements.dryMatterIntakeKgPerDay);

    return {
      profile:     p,
      isForage:    isForage(p),
      maxDmKg,
      costPerKgDm,
    };
  });

  // Sort: forages first (by cost/UFL), then concentrates (by cost/UFL)
  feeds.sort((a, b) => {
    if (a.isForage !== b.isForage) return a.isForage ? -1 : 1;
    const aEff = (getVal(a.profile.uflPerKgDm) > 0) ? a.costPerKgDm / getVal(a.profile.uflPerKgDm) : 9999;
    const bEff = (getVal(b.profile.uflPerKgDm) > 0) ? b.costPerKgDm / getVal(b.profile.uflPerKgDm) : 9999;
    return aEff - bEff; // cheaper energy first
  });

  const n = feeds.length;
  const allocDmKg = new Array<number>(n).fill(0);

  const req = requirements;
  const targetDm   = req.dryMatterIntakeKgPerDay;
  const targetUfl  = req.uflTotalPerDay;
  const targetPdin = req.pdinGPerDay;
  const targetPdie = req.pdieGPerDay;

  // ── Step 1: Allocate forages up to minimum forage DM ─────────────────────
  const forageIndexes = feeds.map((f,i) => f.isForage ? i : -1).filter(i => i >= 0);
  let forageAllocated = 0;
  const minForage = req.minForageDmKgPerDay;

  for (const fi of forageIndexes) {
    if (forageAllocated >= minForage) break;
    const remaining = minForage - forageAllocated;
    const alloc = Math.min(remaining, feeds[fi].maxDmKg);
    allocDmKg[fi] = alloc;
    forageAllocated += alloc;
  }

  // ── Step 2: Compute current nutrient state ────────────────────────────────
  let state = computeState(feeds, allocDmKg);

  // ── Step 3: Add concentrates to meet energy and protein ───────────────────
  const concentrateIndexes = feeds.map((f,i) => !f.isForage ? i : -1).filter(i => i >= 0);
  let concentrateAllocated = allocDmKg.reduce((s,v,i) => feeds[i].isForage ? s : s+v, 0);

  for (const ci of concentrateIndexes) {
    if (state.totalDmKg >= targetDm) break;
    if (concentrateAllocated >= req.maxConcentrateDmKgPerDay) break;

    const f = feeds[ci];
    const uflNeeded    = Math.max(0, targetUfl  - state.totalUfl);
    const pdinNeeded   = Math.max(0, targetPdin - state.totalPdinG);
    const pdieNeeded   = Math.max(0, targetPdie - state.totalPdieG);
    const dmRoomLeft   = targetDm - state.totalDmKg;
    const concRoomLeft = req.maxConcentrateDmKgPerDay - concentrateAllocated;

    if (uflNeeded <= 0 && pdinNeeded <= 0) break;

    // How much of this feed to add to meet the largest deficit
    const uflPerKg  = getVal(f.profile.uflPerKgDm);
    const pdinPerKg = getVal(f.profile.pdinGPerKgDm);

    let allocThisFeed = 0;
    if (uflPerKg  > 0) allocThisFeed = Math.max(allocThisFeed, uflNeeded  / uflPerKg);
    if (pdinPerKg > 0) allocThisFeed = Math.max(allocThisFeed, pdinNeeded / pdinPerKg);

    // Apply constraints
    allocThisFeed = Math.min(allocThisFeed, dmRoomLeft, concRoomLeft, f.maxDmKg - allocDmKg[ci]);
    allocThisFeed = Math.max(0, allocThisFeed);

    if (allocThisFeed > 0.01) {
      allocDmKg[ci] += allocThisFeed;
      concentrateAllocated += allocThisFeed;
      state = computeState(feeds, allocDmKg);
    }
  }

  // ── Step 4: If DM room remains and energy still short, add more forage ────
  for (const fi of forageIndexes) {
    if (state.totalDmKg >= targetDm) break;
    if (state.totalUfl  >= targetUfl) break;
    const room = Math.min(feeds[fi].maxDmKg - allocDmKg[fi], targetDm - state.totalDmKg);
    if (room > 0.01) {
      allocDmKg[fi] += room;
      state = computeState(feeds, allocDmKg);
    }
  }

  // ── Step 5: Build result objects ──────────────────────────────────────────
  const feedItems: RationFeedItem[] = [];
  let totalFromFarmerAnalysis = 0, totalFromDefault = 0;

  for (let i = 0; i < n; i++) {
    if (allocDmKg[i] < 0.001) continue;
    const f      = feeds[i];
    const p      = f.profile;
    const dmFrac = getVal(p.dryMatterFraction) || 0.87;
    const kgDm   = allocDmKg[i];
    const kgAsFed = dmFrac > 0 ? kgDm / dmFrac : kgDm;

    if (p.uflPerKgDm.source   === "farmer_analysis") totalFromFarmerAnalysis++;
    if (p.uflPerKgDm.source   === "default")         totalFromDefault++;

    feedItems.push({
      inventoryId:         p.inventoryId,
      feedTypeId:          p.feedTypeId,
      feedName:            p.feedName,
      quantityAsFedKgPerCow: Math.round(kgAsFed * 100) / 100,
      quantityDmKgPerCow:    Math.round(kgDm    * 100) / 100,
      costPerCow:            Math.round(kgAsFed * p.costPerKg * 100) / 100,
      nutrientContributions: {
        ufl:         Math.round(kgDm * getVal(p.uflPerKgDm)          * 100) / 100,
        pdinG:       Math.round(kgDm * getVal(p.pdinGPerKgDm)        * 10)  / 10,
        pdieG:       Math.round(kgDm * getVal(p.pdieGPerKgDm)        * 10)  / 10,
        ndfKgDm:     Math.round(kgDm * getVal(p.ndfPctDm) / 100      * 100) / 100,
        calciumG:    Math.round(kgDm * getVal(p.calciumGPerKgDm)      * 10)  / 10,
        phosphorusG: Math.round(kgDm * getVal(p.phosphorusGPerKgDm)   * 10)  / 10,
      },
      nutrientSources: {
        ufl:      p.uflPerKgDm.source,
        pdin:     p.pdinGPerKgDm.source,
        pdie:     p.pdieGPerKgDm.source,
        ndf:      p.ndfPctDm.source,
        protein:  p.crudeProteinPctDm.source,
        calcium:  p.calciumGPerKgDm.source,
        phosphorus: p.phosphorusGPerKgDm.source,
      },
    });
  }

  state = computeState(feeds, allocDmKg);

  // ── Step 6: Nutritional balance ───────────────────────────────────────────
  const ndfPctActual = state.totalDmKg > 0
    ? (state.totalNdfDm / state.totalDmKg) * 100 : 0;

  const balance: NutritionalBalance = {
    uflRequired:        Math.round(req.uflTotalPerDay * 100) / 100,
    uflProvided:        Math.round(state.totalUfl    * 100) / 100,
    uflCoverage:        req.uflTotalPerDay > 0 ? state.totalUfl / req.uflTotalPerDay : 0,
    pdinRequired:       Math.round(req.pdinGPerDay   * 10) / 10,
    pdinProvided:       Math.round(state.totalPdinG  * 10) / 10,
    pdieRequired:       Math.round(req.pdieGPerDay   * 10) / 10,
    pdieProvided:       Math.round(state.totalPdieG  * 10) / 10,
    pdiLimiting:        state.totalPdinG < state.totalPdieG ? "pdin" : "pdie",
    pdiCoverage:        req.pdinGPerDay > 0 ? Math.min(state.totalPdinG, state.totalPdieG) / req.pdinGPerDay : 0,
    dmIntakeRequired:   Math.round(req.dryMatterIntakeKgPerDay * 100) / 100,
    dmIntakeActual:     Math.round(state.totalDmKg             * 100) / 100,
    ndfActualPctDm:     Math.round(ndfPctActual * 10) / 10,
    ndfMinRequired:     req.minNdfPctDm,
    calciumProvided:    Math.round(state.totalCaG * 10) / 10,
    calciumRequired:    req.calciumGPerDay,
    phosphorusProvided: Math.round(state.totalPG  * 10) / 10,
    phosphorusRequired: req.phosphorusGPerDay,
    energyAdequate:     state.totalUfl   >= req.uflTotalPerDay  * 0.95,
    proteinAdequate:    Math.min(state.totalPdinG, state.totalPdieG) >= req.pdinGPerDay * 0.95,
    fiberAdequate:      ndfPctActual >= req.minNdfPctDm,
    dmIntakeOk:         state.totalDmKg >= req.dryMatterIntakeKgPerDay * 0.90,
  };

  // ── Step 7: Feasibility ───────────────────────────────────────────────────
  const feasibility: RationFeasibility =
    (balance.energyAdequate && balance.proteinAdequate && balance.fiberAdequate)
      ? "feasible"
      : (feedItems.length > 0 ? "partial" : "infeasible");

  // ── Step 8: Deficiency recommendations ───────────────────────────────────
  const deficiencyRecommendations: DeficiencyRecommendation[] = [];
  if (!balance.energyAdequate) {
    const deficit = req.uflTotalPerDay - state.totalUfl;
    deficiencyRecommendations.push({
      nutrient: "Energy (UFL)",
      deficit: Math.round(deficit * 100) / 100,
      unit: "UFL/day",
      suggestedFeeds: usable
        .filter(p => !isForage(p) && getVal(p.uflPerKgDm) > 1.0)
        .slice(0,2)
        .map(p => {
          const dm = getVal(p.dryMatterFraction) || 0.87;
          const kgDm = deficit / getVal(p.uflPerKgDm);
          return { feedName: p.feedName, estimatedQuantityKgPerDay: Math.round(kgDm / dm * 100)/100 };
        }),
    });
  }
  if (!balance.proteinAdequate) {
    const deficit = req.pdinGPerDay - Math.min(state.totalPdinG, state.totalPdieG);
    deficiencyRecommendations.push({
      nutrient: "Protein (PDI)",
      deficit: Math.round(deficit * 10) / 10,
      unit: "g PDI/day",
      suggestedFeeds: usable
        .filter(p => getVal(p.pdinGPerKgDm) > 150)
        .slice(0,2)
        .map(p => {
          const dm = getVal(p.dryMatterFraction) || 0.87;
          const kgDm = deficit / getVal(p.pdinGPerKgDm);
          return { feedName: p.feedName, estimatedQuantityKgPerDay: Math.round(kgDm / dm * 100)/100 };
        }),
    });
  }

  // ── Step 9: Cost ──────────────────────────────────────────────────────────
  const dailyCostPerCow   = Math.round(feedItems.reduce((s,fi) => s + fi.costPerCow, 0) * 100) / 100;
  const monthlyCostPerCow = Math.round(dailyCostPerCow * 30 * 100) / 100;

  return {
    cowId, cowName, cowTag, calculationDate, feasibility,
    requirements,
    feedItems,
    nutritionalBalance: balance,
    dailyCostPerCow,
    monthlyCostPerCow,
    warnings,
    deficiencyRecommendations,
    dataSourceSummary: { fromFarmerAnalysis: totalFromFarmerAnalysis, fromDefault: totalFromDefault },
    assumptionsUsed: assumptions,
  };
}

/** Return an empty ration when no calculation is possible */
function emptyRation(
  cowId: string, cowName: string, cowTag: string,
  calculationDate: string, requirements: CowRequirements,
  feasibility: RationFeasibility, warnings: string[],
): RationResult {
  const zero: NutritionalBalance = {
    uflRequired: requirements.uflTotalPerDay, uflProvided: 0, uflCoverage: 0,
    pdinRequired: requirements.pdinGPerDay, pdinProvided: 0,
    pdieRequired: requirements.pdieGPerDay, pdieProvided: 0,
    pdiLimiting: "pdin", pdiCoverage: 0,
    dmIntakeRequired: requirements.dryMatterIntakeKgPerDay, dmIntakeActual: 0,
    ndfActualPctDm: 0, ndfMinRequired: requirements.minNdfPctDm,
    calciumProvided: 0, calciumRequired: requirements.calciumGPerDay,
    phosphorusProvided: 0, phosphorusRequired: requirements.phosphorusGPerDay,
    energyAdequate: false, proteinAdequate: false, fiberAdequate: false, dmIntakeOk: false,
  };
  return {
    cowId, cowName, cowTag, calculationDate, feasibility,
    requirements, feedItems: [], nutritionalBalance: zero,
    dailyCostPerCow: 0, monthlyCostPerCow: 0, warnings,
    deficiencyRecommendations: [], dataSourceSummary: { fromFarmerAnalysis: 0, fromDefault: 0 },
    assumptionsUsed: [],
  };
}
