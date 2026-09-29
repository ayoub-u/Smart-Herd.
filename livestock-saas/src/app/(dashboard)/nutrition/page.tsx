"use client";
/**
 * Nutrition & Feed — fully wired to Supabase.
 * Fixes:
 *   1. Inventory items now have Edit button → opens prefilled modal
 *   2. Feed Library shows farm-specific analysis status + [Add/Edit Analysis] button
 *   3. Ration Calculator shows available feeds from real inventory before calculating
 *   4. Default vs farm-analysis values clearly labelled in Feed Library
 *   5. Analysis modal stores farm-specific data without touching global defaults
 */

import { useState, useMemo } from "react";
import {
  Plus, Loader2, AlertCircle, ChevronDown, ChevronRight,
  FlaskConical, CheckCircle2, Info, BarChart3, Calculator,
  Edit3, Pencil,
} from "lucide-react";
import { Modal }         from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState }    from "@/components/ui/EmptyState";
import { FormField, inputClass, selectClass, textareaClass } from "@/components/ui/FormField";
import { cn, formatDate } from "@/lib/utils";
import { useAuth }          from "@/contexts/AuthContext";
import { useAnimals }       from "@/hooks/useAnimals";
import { useFeedInventory } from "@/hooks/useFeedInventory";
import type { FeedInsertPayload } from "@/hooks/useFeedInventory";
import { useNutrition }     from "@/hooks/useNutrition";
import type {
  FarmAnalysisValues, EnrichedInventoryItem, InventoryEditPayload,
} from "@/hooks/useNutrition";
import type { RationResult } from "@/types/nutrition";

type Tab = "overview" | "inventory" | "library" | "calculator" | "rations";

const CATEGORY_COLOR: Record<string, string> = {
  forage:"bg-green-50 text-green-700", concentrate:"bg-blue-50 text-blue-700",
  supplement:"bg-violet-50 text-violet-700", mineral:"bg-amber-50 text-amber-700",
  cereal:"bg-orange-50 text-orange-700", protein_feed:"bg-red-50 text-red-700",
  by_product:"bg-stone-50 text-stone-700",
};

// ── Nutrient source badge ─────────────────────────────────────────────────────
function SourceBadge({ source }: { source: string }) {
  if (source === "farmer_analysis") return (
    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold">Lab</span>
  );
  if (source === "default") return (
    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-semibold">Default</span>
  );
  return <span className="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full font-semibold">N/A</span>;
}

// ── Coverage bar ──────────────────────────────────────────────────────────────
function CoverageBar({ pct, label, adequate }: { pct: number; label: string; adequate: boolean }) {
  const filled = Math.min(100, Math.round(pct * 100));
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className={cn("font-semibold", adequate ? "text-emerald-600" : "text-red-600")}>{filled}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", adequate ? "bg-emerald-500" : "bg-red-400")}
          style={{ width: `${filled}%` }} />
      </div>
    </div>
  );
}

// ── Ration result card ────────────────────────────────────────────────────────
function RationCard({ result, onConfirm }: { result: RationResult; onConfirm: (r: RationResult) => void }) {
  const [expanded, setExpanded] = useState(false);
  const bal = result.nutritionalBalance;
  return (
    <div className={cn("border rounded-2xl overflow-hidden",
      result.feasibility === "feasible" ? "border-emerald-200 bg-emerald-50/30" :
      result.feasibility === "partial"  ? "border-amber-200 bg-amber-50/30" :
      "border-red-200 bg-red-50/30")}>
      <div className="p-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🐄</span>
          <div>
            <p className="font-semibold text-gray-900">{result.cowName}</p>
            <p className="text-xs text-gray-400">{result.cowTag}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900">{result.dailyCostPerCow.toFixed(0)} DZD/day</p>
            <p className="text-xs text-gray-400">{result.monthlyCostPerCow.toFixed(0)} DZD/month</p>
          </div>
          <span className={cn("text-xs px-2.5 py-1 rounded-full font-semibold",
            result.feasibility === "feasible" ? "bg-emerald-100 text-emerald-700" :
            result.feasibility === "partial"  ? "bg-amber-100 text-amber-700" :
            "bg-red-100 text-red-700")}>
            {result.feasibility === "feasible" ? "✓ Adequate" :
             result.feasibility === "partial"  ? "⚠ Partial" : "✗ Infeasible"}
          </span>
          <button onClick={() => setExpanded(e => !e)} className="text-gray-400 hover:text-gray-700">
            {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>
      </div>
      <div className="px-4 pb-4 grid grid-cols-3 gap-3">
        <CoverageBar pct={bal.uflCoverage} label="Energy" adequate={bal.energyAdequate} />
        <CoverageBar pct={bal.pdiCoverage} label="Protein" adequate={bal.proteinAdequate} />
        <CoverageBar
          pct={bal.fiberAdequate ? 1 : (bal.ndfMinRequired > 0 ? bal.ndfActualPctDm / bal.ndfMinRequired : 0)}
          label="Fibre" adequate={bal.fiberAdequate} />
      </div>
      {expanded && (
        <div className="border-t border-gray-100 bg-white">
          <div className="p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Daily Ration</p>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                <th className="text-left pb-2 text-xs font-semibold text-gray-500">Feed</th>
                <th className="text-right pb-2 text-xs font-semibold text-gray-500">kg as-fed</th>
                <th className="text-right pb-2 text-xs font-semibold text-gray-500">kg DM</th>
                <th className="text-right pb-2 text-xs font-semibold text-gray-500">Cost (DZD)</th>
                <th className="text-right pb-2 text-xs font-semibold text-gray-500">Data</th>
              </tr></thead>
              <tbody>
                {result.feedItems.length === 0 ? (
                  <tr><td colSpan={5} className="py-4 text-center text-xs text-gray-400">No feeds allocated</td></tr>
                ) : result.feedItems.map((fi, i) => (
                  <tr key={fi.inventoryId + i} className="border-b border-gray-50">
                    <td className="py-1.5 font-medium text-gray-800">{fi.feedName}</td>
                    <td className="py-1.5 text-right text-gray-700">{fi.quantityAsFedKgPerCow.toFixed(2)}</td>
                    <td className="py-1.5 text-right text-gray-700">{fi.quantityDmKgPerCow.toFixed(2)}</td>
                    <td className="py-1.5 text-right text-gray-700">{fi.costPerCow.toFixed(0)}</td>
                    <td className="py-1.5 text-right">
                      <SourceBadge source={fi.nutrientSources.ufl ?? "default"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Nutritional balance */}
          <div className="px-4 pb-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label:"Energy",    req:`${bal.uflRequired.toFixed(1)} UFL`,    prov:`${bal.uflProvided.toFixed(1)} UFL`,   ok:bal.energyAdequate },
              { label:"PDIN",      req:`${bal.pdinRequired.toFixed(0)} g`,      prov:`${bal.pdinProvided.toFixed(0)} g`,    ok:bal.pdinProvided >= bal.pdinRequired * 0.95 },
              { label:"PDIE",      req:`${bal.pdieRequired.toFixed(0)} g`,      prov:`${bal.pdieProvided.toFixed(0)} g`,    ok:bal.pdieProvided >= bal.pdieRequired * 0.95 },
              { label:"DM Intake", req:`${bal.dmIntakeRequired.toFixed(1)} kg`, prov:`${bal.dmIntakeActual.toFixed(1)} kg`, ok:bal.dmIntakeOk },
              { label:"NDF",       req:`≥${bal.ndfMinRequired}%`,               prov:`${bal.ndfActualPctDm.toFixed(1)}%`,  ok:bal.fiberAdequate },
              { label:"Calcium",   req:`${bal.calciumRequired.toFixed(0)} g`,   prov:`${bal.calciumProvided.toFixed(0)} g`,ok:bal.calciumProvided >= bal.calciumRequired * 0.90 },
            ].map(n => (
              <div key={n.label} className={cn("rounded-xl p-3 text-xs", n.ok ? "bg-emerald-50" : "bg-red-50")}>
                <p className={cn("font-semibold", n.ok ? "text-emerald-800" : "text-red-800")}>{n.label}</p>
                <p className={cn("mt-0.5", n.ok ? "text-emerald-600" : "text-red-600")}>Required: {n.req}</p>
                <p className={cn("font-bold", n.ok ? "text-emerald-700" : "text-red-700")}>Provided: {n.prov}</p>
              </div>
            ))}
          </div>
          {/* Deficiency recommendations */}
          {result.deficiencyRecommendations.length > 0 && (
            <div className="px-4 pb-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs font-bold text-amber-800 mb-2">💡 To improve this ration:</p>
                {result.deficiencyRecommendations.map((d, i) => (
                  <div key={i} className="text-xs text-amber-700 mb-1">
                    <strong>{d.nutrient}</strong> deficit: {d.deficit} {d.unit}
                    {d.suggestedFeeds.length > 0 && (
                      <span className="ml-1">— try adding {d.suggestedFeeds.map(f => `${f.feedName}: ~${f.estimatedQuantityKgPerDay} kg/day`).join(" or ")}</span>
                    )}
                  </div>
                ))}
                <p className="text-[10px] text-amber-500 mt-2 italic">
                  Actual milk production depends on genetics, health, environment and management.
                </p>
              </div>
            </div>
          )}
          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="px-4 pb-4 space-y-1">
              {result.warnings.map((w, i) => (
                <p key={i} className="text-xs text-blue-600 flex items-start gap-1.5">
                  <Info size={12} className="shrink-0 mt-0.5" />{w}
                </p>
              ))}
            </div>
          )}
          {/* Data source + confirm */}
          <div className="px-4 pb-4 flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-gray-400">
              {result.dataSourceSummary.fromFarmerAnalysis} lab values · {result.dataSourceSummary.fromDefault} defaults · Model: INRA 2018
            </p>
            {result.feasibility !== "infeasible" && (
              <button onClick={() => onConfirm(result)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl">
                <CheckCircle2 size={16} />Confirm Ration
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function NutritionPage() {
  const { farm } = useAuth();
  const farmId   = farm?.id ?? null;

  const { feedItems, loading: invLoading, addFeedItem, deleteFeedItem } = useFeedInventory(farmId);
  const { animals } = useAnimals(farmId);
  const {
    feedTypes, loadingFeedTypes,
    inventory, loadingInventory,
    rationResults, calculating, calcError,
    activeRations, loadingRations,
    calculateRations, confirmRation, deactivateRation,
    addFarmAnalysis, updateInventoryItem,
  } = useNutrition(farmId);

  const [tab, setTab] = useState<Tab>("overview");

  // ── Add feed modal ─────────────────────────────────────────────────────────
  const [showAdd,     setShowAdd]     = useState(false);
  const [addName,     setAddName]     = useState("");
  const [addCategory, setAddCategory] = useState<"forage"|"concentrate"|"supplement"|"mineral">("forage");
  const [addStock,    setAddStock]    = useState("");
  const [addUnit,     setAddUnit]     = useState("kg");
  const [addUsage,    setAddUsage]    = useState("");
  const [addCost,     setAddCost]     = useState("");
  const [addReorder,  setAddReorder]  = useState("");
  const [addSupplier, setAddSupplier] = useState("");
  const [addDelivery, setAddDelivery] = useState("");
  const [addNotes,    setAddNotes]    = useState("");
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError,    setAddError]    = useState<string|null>(null);

  // ── Edit feed modal ────────────────────────────────────────────────────────
  const [editItem,      setEditItem]      = useState<EnrichedInventoryItem|null>(null);
  const [editName,      setEditName]      = useState("");
  const [editCategory,  setEditCategory]  = useState("");
  const [editStock,     setEditStock]     = useState("");
  const [editUnit,      setEditUnit]      = useState("");
  const [editUsage,     setEditUsage]     = useState("");
  const [editCost,      setEditCost]      = useState("");
  const [editReorder,   setEditReorder]   = useState("");
  const [editSupplier,  setEditSupplier]  = useState("");
  const [editDelivery,  setEditDelivery]  = useState("");
  const [editNotes,     setEditNotes]     = useState("");
  const [editSubmitting,setEditSubmitting]= useState(false);
  const [editError,     setEditError]     = useState<string|null>(null);

  // ── Analysis modal ─────────────────────────────────────────────────────────
  const [analysisItem,   setAnalysisItem]   = useState<EnrichedInventoryItem|null>(null);
  const [aDM,   setADM]   = useState("");
  const [aUFL,  setAUFL]  = useState("");
  const [aPDIN, setAPDIN] = useState("");
  const [aPDIE, setAPDIE] = useState("");
  const [aNDF,  setANDF]  = useState("");
  const [aADF,  setAADF]  = useState("");
  const [aCP,   setACP]   = useState("");
  const [aCa,   setACa]   = useState("");
  const [aP,    setAP]    = useState("");
  const [aLab,  setALab]  = useState("");
  const [aDate, setADate] = useState("");
  const [aNotes,setANotes]= useState("");
  const [aSubmitting, setASubmitting] = useState(false);
  const [aError,      setAError]      = useState<string|null>(null);

  // ── Confirm ration modal ───────────────────────────────────────────────────
  const [toConfirm,  setToConfirm]  = useState<RationResult|null>(null);
  const [rationName, setRationName] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmErr, setConfirmErr] = useState<string|null>(null);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const [toDelete, setToDelete] = useState<string|null>(null);

  const dairyCows  = animals.filter(a => a.type === "cow" && a.pregnancyStatus !== "dry");
  const totalValue = feedItems.reduce((s,f) => s + f.totalValue, 0);
  const lowCount   = feedItems.filter(f => f.currentStock <= f.reorderLevel).length;

  // ── Handlers ──────────────────────────────────────────────────────────────

  function openEdit(item: EnrichedInventoryItem) {
    setEditItem(item);
    setEditName(item.feed_name);
    setEditCategory(item.category);
    setEditStock(String(item.current_stock_kg));
    setEditUnit(item.unit);
    setEditUsage(String(item.daily_usage));
    setEditCost(String(item.cost_per_kg));
    setEditReorder(String(item.reorder_level_kg));
    setEditSupplier(item.supplier ?? "");
    setEditDelivery(item.last_delivery_date ?? "");
    setEditNotes(item.notes ?? "");
    setEditError(null);
  }

  function openAnalysis(item: EnrichedInventoryItem) {
    setAnalysisItem(item);
    const a = item.analysis;
    setADM(a?.dry_matter_pct != null ? String(a.dry_matter_pct) : "");
    setAUFL(a?.ufl_per_kg_dm != null ? String(a.ufl_per_kg_dm) : "");
    setAPDIN(a?.pdin_g_per_kg_dm != null ? String(a.pdin_g_per_kg_dm) : "");
    setAPDIE(a?.pdie_g_per_kg_dm != null ? String(a.pdie_g_per_kg_dm) : "");
    setANDF(a?.ndf_pct_dm != null ? String(a.ndf_pct_dm) : "");
    setAADF(a?.adf_pct_dm != null ? String(a.adf_pct_dm) : "");
    setACP(a?.crude_protein_pct_dm != null ? String(a.crude_protein_pct_dm) : "");
    setACa(a?.calcium_g_per_kg_dm != null ? String(a.calcium_g_per_kg_dm) : "");
    setAP(a?.phosphorus_g_per_kg_dm != null ? String(a.phosphorus_g_per_kg_dm) : "");
    setALab(a?.laboratory_name ?? "");
    setADate(a?.analysis_date ?? "");
    setANotes(a?.notes ?? "");
    setAError(null);
  }

  async function handleAdd() {
    if (!addName || !addStock) { setAddError("Name and stock quantity are required."); return; }
    setAddSubmitting(true); setAddError(null);
    const { error } = await addFeedItem({
      feed_name: addName, category: addCategory,
      current_stock: parseFloat(addStock) || 0, unit: addUnit,
      daily_usage: parseFloat(addUsage) || 0,
      cost_per_unit: parseFloat(addCost) || 0,
      reorder_level: parseFloat(addReorder) || 0,
      supplier: addSupplier || undefined,
      last_delivery_date: addDelivery || undefined,
      notes: addNotes || undefined,
    } as FeedInsertPayload);
    setAddSubmitting(false);
    if (error) { setAddError(error); return; }
    setShowAdd(false);
    setAddName(""); setAddCategory("forage"); setAddStock(""); setAddUnit("kg");
    setAddUsage(""); setAddCost(""); setAddReorder(""); setAddSupplier(""); setAddDelivery(""); setAddNotes("");
  }

  async function handleEdit() {
    if (!editItem) return;
    setEditSubmitting(true); setEditError(null);
    const payload: InventoryEditPayload = {
      feed_name:          editName     || undefined,
      category:           editCategory || undefined,
      current_stock:      editStock    ? parseFloat(editStock)  : undefined,
      unit:               editUnit     || undefined,
      daily_usage:        editUsage    ? parseFloat(editUsage)  : undefined,
      cost_per_unit:      editCost     ? parseFloat(editCost)   : undefined,
      reorder_level:      editReorder  ? parseFloat(editReorder): undefined,
      supplier:           editSupplier || undefined,
      last_delivery_date: editDelivery || undefined,
      notes:              editNotes    || undefined,
    };
    const { error } = await updateInventoryItem(editItem.id, payload);
    setEditSubmitting(false);
    if (error) { setEditError(error); return; }
    setEditItem(null);
  }

  async function handleAnalysis() {
    if (!analysisItem) return;
    setASubmitting(true); setAError(null);
    const ftId = analysisItem.feed_type_id ?? analysisItem.feedType?.id ?? "";
    if (!ftId) {
      setAError("This feed is not linked to the global Feed Library. Please link it first by editing the feed.");
      setASubmitting(false); return;
    }
    const values: FarmAnalysisValues = {
      dry_matter_pct:       aDM   ? parseFloat(aDM)   : undefined,
      ufl_per_kg_dm:        aUFL  ? parseFloat(aUFL)  : undefined,
      pdin_g_per_kg_dm:     aPDIN ? parseFloat(aPDIN) : undefined,
      pdie_g_per_kg_dm:     aPDIE ? parseFloat(aPDIE) : undefined,
      ndf_pct_dm:           aNDF  ? parseFloat(aNDF)  : undefined,
      adf_pct_dm:           aADF  ? parseFloat(aADF)  : undefined,
      crude_protein_pct_dm: aCP   ? parseFloat(aCP)   : undefined,
      calcium_g_per_kg_dm:  aCa   ? parseFloat(aCa)   : undefined,
      phosphorus_g_per_kg_dm: aP  ? parseFloat(aP)    : undefined,
      laboratory_name:      aLab  || undefined,
      analysis_date:        aDate || undefined,
      notes:                aNotes || undefined,
    };
    const { error } = await addFarmAnalysis(analysisItem.id, ftId, values);
    setASubmitting(false);
    if (error) { setAError(error); return; }
    setAnalysisItem(null);
  }

  async function handleConfirmRation() {
    if (!toConfirm || !rationName.trim()) return;
    setConfirming(true); setConfirmErr(null);
    const { error } = await confirmRation(toConfirm, rationName.trim());
    setConfirming(false);
    if (error) { setConfirmErr(error); return; }
    setToConfirm(null); setRationName("");
  }

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id:"overview",   label:"Overview",       icon: BarChart3    },
    { id:"inventory",  label:"Inventory",      icon: Plus         },
    { id:"library",    label:"Feed Library",   icon: FlaskConical },
    { id:"calculator", label:"Ration Calc",    icon: Calculator   },
    { id:"rations",    label:"Active Rations", icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Tab bar */}
      <div className="flex gap-1 bg-white rounded-2xl border border-gray-100 shadow-card p-1.5 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn("flex items-center gap-1.5 flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
              tab === t.id ? "bg-emerald-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50")}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ──────────────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <div className="space-y-4">
          {lowCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
              <AlertCircle size={18} className="text-amber-600 shrink-0" />
              <p className="text-sm text-amber-700"><strong>{lowCount} feed item{lowCount > 1 ? "s" : ""}</strong> at or below reorder level. Restock soon.</p>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Feed Items",     value: feedItems.length,    color: "bg-emerald-50 text-emerald-700" },
              { label: "Low Stock",      value: lowCount,            color: "bg-red-50 text-red-700"         },
              { label: "Dairy Cows",     value: dairyCows.length,    color: "bg-blue-50 text-blue-700"       },
              { label: "Active Rations", value: activeRations.length,color: "bg-violet-50 text-violet-700"  },
            ].map(s => (
              <div key={s.label} className={cn("rounded-2xl p-4 text-center", s.color)}>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs font-semibold mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          {feedItems.length === 0 && !invLoading && (
            <EmptyState icon="🌾" title="No feed inventory" message="Add your feed stock to get started with ration planning."
              action={<button onClick={() => setTab("inventory")} className="text-sm text-emerald-600 font-semibold hover:underline">Go to Inventory →</button>} />
          )}
          {feedItems.filter(f => f.currentStock <= f.reorderLevel).map(f => (
            <div key={f.id} className="bg-white rounded-2xl border border-red-100 shadow-card overflow-hidden">
              <div className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{f.name}</p>
                  <p className="text-xs text-gray-400">{f.currentStock} {f.unit} remaining</p>
                </div>
                <span className="text-xs bg-red-50 text-red-700 px-2.5 py-1 rounded-full font-semibold">{f.daysRemaining}d left</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── INVENTORY ─────────────────────────────────────────────────────────── */}
      {tab === "inventory" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Items",       value: feedItems.length,               color: "bg-emerald-50 text-emerald-700" },
                { label: "Low Stock",   value: lowCount,                       color: "bg-red-50 text-red-700"         },
                { label: "Total Value", value: `${Math.round(totalValue)} DZD`, color: "bg-violet-50 text-violet-700"  },
              ].map(s => (
                <div key={s.label} className={cn("rounded-2xl p-3 text-center", s.color)}>
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-xs font-semibold mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            <button onClick={() => { setAddError(null); setShowAdd(true); }}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
              <Plus size={16} />Add Feed
            </button>
          </div>

          {invLoading || loadingInventory ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}
            </div>
          ) : inventory.length === 0 ? (
            <EmptyState icon="🌾" title="No feed items" message="Add your feed inventory to enable ration calculation." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventory.map(item => {
                const urgent = item.current_stock_kg <= item.reorder_level_kg;
                const daysLeft = item.daily_usage > 0 ? Math.floor(item.current_stock_kg / item.daily_usage) : 999;
                const pct = item.daily_usage > 0 ? Math.min(100, Math.round((item.current_stock_kg / (item.daily_usage * 60)) * 100)) : 100;

                return (
                  <div key={item.id} className={cn("border rounded-2xl p-4 space-y-3 bg-white",
                    urgent ? "border-red-200" : "border-gray-100")}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{item.feed_name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", CATEGORY_COLOR[item.category] ?? "")}>{item.category}</span>
                          {item.analysis_available
                            ? <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold">Lab analysis</span>
                            : <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-semibold">Default nutrition</span>
                          }
                        </div>
                      </div>
                    </div>

                    {/* Stock bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{item.current_stock_kg} {item.unit}</span>
                        <span className={cn("font-semibold text-xs", urgent ? "text-red-600" : "text-gray-500")}>{daysLeft === 999 ? "∞" : daysLeft}d</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", urgent ? "bg-red-400" : "bg-emerald-500")} style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-gray-100">
                      <div><p className="text-gray-400">Price</p><p className="font-medium text-gray-700">{item.cost_per_kg} DZD/kg</p></div>
                      <div><p className="text-gray-400">Daily Use</p><p className="font-medium text-gray-700">{item.daily_usage > 0 ? `${item.daily_usage} ${item.unit}` : "—"}</p></div>
                    </div>
                    {item.supplier && <p className="text-xs text-gray-400">Supplier: {item.supplier}</p>}

                    {/* Actions */}
                    <div className="flex gap-2 pt-1 border-t border-gray-100">
                      <button onClick={() => openEdit(item)}
                        className="flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline">
                        <Edit3 size={12} />Edit
                      </button>
                      <button onClick={() => openAnalysis(item)}
                        className="flex items-center gap-1 text-xs text-emerald-600 font-semibold hover:underline">
                        <FlaskConical size={12} />{item.analysis_available ? "Edit Analysis" : "Add Analysis"}
                      </button>
                      <button onClick={() => setToDelete(item.id)}
                        className="ml-auto text-xs text-red-500 font-semibold hover:underline">Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── FEED LIBRARY ──────────────────────────────────────────────────────── */}
      {tab === "library" && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
            <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-semibold">SmartHerd Feed Library — INRA 2018 defaults</p>
              <p className="mt-0.5">These are standard reference values. Your farm-specific laboratory analysis (if entered) overrides the defaults only for your calculations. Global defaults are never modified.</p>
            </div>
          </div>

          {loadingFeedTypes ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}</div>
          ) : feedTypes.length === 0 ? (
            <EmptyState icon="📚" title="Feed library not loaded" message="Run NUTRITION_MIGRATION.sql in Supabase to load the global feed library." />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100 bg-gray-50/50">
                    {["Feed", "Category", "DM %", "UFL/kg", "PDIN g/kg", "PDIE g/kg", "NDF %", "CP %", "Your Farm"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {feedTypes.map(ft => {
                      const invItem = inventory.find(i => i.feed_type_id === ft.id);
                      const defs    = invItem?.defaults;
                      const anal    = invItem?.analysis;
                      const hasFarm = !!anal;

                      return (
                        <tr key={ft.id} className="hover:bg-gray-50/70">
                          <td className="px-4 py-3 font-medium text-gray-800">{ft.name}</td>
                          <td className="px-4 py-3">
                            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", CATEGORY_COLOR[ft.category] ?? "")}>{ft.category}</span>
                          </td>
                          {/* Default values */}
                          {[
                            defs?.dry_matter_pct,
                            defs?.ufl_per_kg_dm,
                            defs?.pdin_g_per_kg_dm,
                            defs?.pdie_g_per_kg_dm,
                            defs?.ndf_pct_dm,
                            defs?.crude_protein_pct_dm,
                          ].map((v, i) => (
                            <td key={i} className="px-4 py-3 text-gray-600 text-xs">
                              {v != null ? (
                                <div>
                                  <span>{v}</span>
                                  {hasFarm && (() => {
                                    const farmVals = [anal?.dry_matter_pct, anal?.ufl_per_kg_dm, anal?.pdin_g_per_kg_dm, anal?.pdie_g_per_kg_dm, anal?.ndf_pct_dm, anal?.crude_protein_pct_dm];
                                    const farmV = farmVals[i];
                                    return farmV != null ? (
                                      <div className="text-emerald-600 font-semibold">{farmV} <span className="text-[9px]">Farm</span></div>
                                    ) : null;
                                  })()}
                                </div>
                              ) : "—"}
                            </td>
                          ))}
                          <td className="px-4 py-3">
                            {invItem ? (
                              <button onClick={() => openAnalysis(invItem)}
                                className="flex items-center gap-1 text-xs text-emerald-600 font-semibold hover:underline">
                                <Pencil size={11} />{hasFarm ? "Edit" : "Add"}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">Not in inventory</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-gray-50 text-xs text-gray-400">
                Source: INRA 2018 — Alimentation des bovins, ovins et caprins. [TODO: VALIDATE] coefficients require confirmation by a certified nutritionist.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── RATION CALCULATOR ─────────────────────────────────────────────────── */}
      {tab === "calculator" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
            <h3 className="font-semibold text-gray-900 mb-1">Ration Calculator</h3>
            <p className="text-sm text-gray-400 mb-4">
              Optimizes daily rations using the INRA 2018 nutritional framework. Minimizes feed cost while satisfying energy, protein, and fibre constraints.
            </p>

            {/* Available feeds — shows exactly what the optimizer will use */}
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Feeds available from your inventory ({inventory.length})
              </p>
              {loadingInventory ? (
                <p className="text-xs text-gray-400">Loading inventory…</p>
              ) : inventory.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-sm text-amber-700">No feeds in inventory. <button onClick={() => setTab("inventory")} className="underline font-semibold">Add feeds →</button></p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {inventory.map(item => {
                    const hasUfl = (item.resolved.uflPerKgDm.value ?? 0) > 0;
                    return (
                      <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-1.5 h-1.5 rounded-full", hasUfl ? "bg-emerald-500" : "bg-red-400")} />
                          <span className="text-sm font-medium text-gray-800">{item.feed_name}</span>
                          <span className="text-xs text-gray-400">{item.current_stock_kg} {item.unit} · {item.cost_per_kg} DZD/kg</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <SourceBadge source={item.resolved.uflPerKgDm.source} />
                          {!hasUfl && <span className="text-xs text-red-500">No UFL data</span>}
                        </div>
                      </div>
                    );
                  })}
                  {inventory.some(i => (i.resolved.uflPerKgDm.value ?? 0) === 0) && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠ Feeds without UFL data will be excluded. <button onClick={() => setTab("library")} className="underline">Add analysis →</button>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Cow summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-blue-700">{dairyCows.length}</p>
                <p className="text-xs font-semibold text-blue-600 mt-0.5">Dairy Cows</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-emerald-700">{inventory.filter(i => (i.resolved.uflPerKgDm.value ?? 0) > 0).length}</p>
                <p className="text-xs font-semibold text-emerald-600 mt-0.5">Usable Feeds</p>
              </div>
              <div className="bg-violet-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-violet-700">INRA 2018</p>
                <p className="text-xs font-semibold text-violet-600 mt-0.5">Nutritional Model</p>
              </div>
            </div>

            {/* Warnings */}
            {dairyCows.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-amber-700">No dairy cows. Add cows with species "cow" and reproductive status "lactating" or "pregnant".</p>
              </div>
            )}
            {calcError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-start gap-2">
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{calcError}</p>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
              <p className="text-xs text-amber-700 font-semibold">⚠ Scientific disclaimer</p>
              <p className="text-xs text-amber-600 mt-1">
                INRA 2018 coefficients are marked [TODO: VALIDATE] and should be reviewed by a qualified nutritionist before clinical use. SmartHerd does not guarantee milk production outcomes.
              </p>
            </div>

            <button
              onClick={() => calculateRations(animals)}
              disabled={calculating || dairyCows.length === 0 || inventory.length === 0}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-colors w-full justify-center">
              {calculating
                ? <><Loader2 size={18} className="animate-spin" />Calculating…</>
                : <><Calculator size={18} />Calculate Optimized Rations</>}
            </button>
          </div>

          {/* Results */}
          {rationResults.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-semibold text-gray-900">Results — {rationResults.length} cow{rationResults.length > 1 ? "s" : ""}</h3>
                <div className="flex gap-3 text-xs">
                  <span className="text-emerald-600 font-semibold">✓ {rationResults.filter(r => r.feasibility === "feasible").length} adequate</span>
                  <span className="text-amber-600 font-semibold">⚠ {rationResults.filter(r => r.feasibility === "partial").length} partial</span>
                  <span className="text-red-600 font-semibold">✗ {rationResults.filter(r => r.feasibility === "infeasible").length} infeasible</span>
                </div>
              </div>
              {rationResults.map(r => (
                <RationCard key={r.cowId} result={r} onConfirm={setToConfirm} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ACTIVE RATIONS ────────────────────────────────────────────────────── */}
      {tab === "rations" && (
        <div className="space-y-4">
          {loadingRations ? (
            <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-20 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}</div>
          ) : activeRations.length === 0 ? (
            <EmptyState icon="📋" title="No active rations" message="Calculate and confirm rations in the Ration Calculator tab."
              action={<button onClick={() => setTab("calculator")} className="text-sm text-emerald-600 font-semibold hover:underline">Go to Calculator →</button>} />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
              <div className="p-5 border-b border-gray-50">
                <h3 className="font-semibold text-gray-900">Active Rations ({activeRations.length})</h3>
              </div>
              {activeRations.map(r => (
                <div key={r.id} className="px-5 py-4 border-b border-gray-50 last:border-0 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{r.name}</p>
                    <p className="text-xs text-gray-400">{r.nutritional_model} · Confirmed: {r.confirmed_at ? formatDate(r.confirmed_at) : "—"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-semibold">Active</span>
                    <button onClick={() => deactivateRation(r.id)} className="text-xs text-gray-500 hover:text-red-600 hover:underline">Deactivate</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MODALS ────────────────────────────────────────────────────────────── */}

      {/* Add feed */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setAddError(null); }} title="Add Feed Item" size="lg"
        footer={<>
          <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleAdd} disabled={addSubmitting} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-semibold">
            {addSubmitting ? <><Loader2 size={15} className="animate-spin" />Saving…</> : "Save Item"}
          </button>
        </>}>
        <div className="space-y-4">
          {addError && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">{addError}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Feed Name" required><input type="text" value={addName} onChange={e => setAddName(e.target.value)} placeholder="e.g. Corn Silage" className={inputClass} /></FormField>
            <FormField label="Category">
              <select value={addCategory} onChange={e => setAddCategory(e.target.value as typeof addCategory)} className={selectClass}>
                <option value="forage">Forage</option><option value="concentrate">Concentrate</option>
                <option value="supplement">Supplement</option><option value="mineral">Mineral</option>
              </select>
            </FormField>
            <FormField label="Current Stock (kg)" required><input type="number" value={addStock} onChange={e => setAddStock(e.target.value)} min="0" placeholder="0" className={inputClass} /></FormField>
            <FormField label="Unit"><input type="text" value={addUnit} onChange={e => setAddUnit(e.target.value)} placeholder="kg" className={inputClass} /></FormField>
            <FormField label="Cost per kg (DZD)"><input type="number" value={addCost} onChange={e => setAddCost(e.target.value)} min="0" step="0.01" placeholder="0" className={inputClass} /></FormField>
            <FormField label="Daily Usage (kg)"><input type="number" value={addUsage} onChange={e => setAddUsage(e.target.value)} min="0" step="0.1" placeholder="0" className={inputClass} /></FormField>
            <FormField label="Reorder Level (kg)"><input type="number" value={addReorder} onChange={e => setAddReorder(e.target.value)} min="0" placeholder="0" className={inputClass} /></FormField>
            <FormField label="Supplier"><input type="text" value={addSupplier} onChange={e => setAddSupplier(e.target.value)} className={inputClass} /></FormField>
            <FormField label="Last Delivery"><input type="date" value={addDelivery} onChange={e => setAddDelivery(e.target.value)} className={inputClass} /></FormField>
          </div>
          <FormField label="Notes"><textarea rows={2} value={addNotes} onChange={e => setAddNotes(e.target.value)} className={textareaClass} /></FormField>
          <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
            <strong>Tip:</strong> Use the same name as a feed in the Feed Library (e.g. "Corn Silage") and SmartHerd will automatically link it to the INRA 2018 default nutritional values. You can always add a laboratory analysis later.
          </div>
        </div>
      </Modal>

      {/* Edit feed */}
      <Modal open={!!editItem} onClose={() => { setEditItem(null); setEditError(null); }}
        title={`Edit — ${editItem?.feed_name ?? ""}`} size="lg"
        footer={<>
          <button onClick={() => setEditItem(null)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleEdit} disabled={editSubmitting} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-semibold">
            {editSubmitting ? <><Loader2 size={15} className="animate-spin" />Saving…</> : "Save Changes"}
          </button>
        </>}>
        <div className="space-y-4">
          {editError && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">{editError}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Feed Name"><input type="text" value={editName} onChange={e => setEditName(e.target.value)} className={inputClass} /></FormField>
            <FormField label="Category">
              <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className={selectClass}>
                <option value="forage">Forage</option><option value="concentrate">Concentrate</option>
                <option value="supplement">Supplement</option><option value="mineral">Mineral</option>
              </select>
            </FormField>
            <FormField label="Current Stock (kg)"><input type="number" value={editStock} onChange={e => setEditStock(e.target.value)} min="0" className={inputClass} /></FormField>
            <FormField label="Unit"><input type="text" value={editUnit} onChange={e => setEditUnit(e.target.value)} className={inputClass} /></FormField>
            <FormField label="Cost per kg (DZD)"><input type="number" value={editCost} onChange={e => setEditCost(e.target.value)} min="0" step="0.01" className={inputClass} /></FormField>
            <FormField label="Daily Usage (kg)"><input type="number" value={editUsage} onChange={e => setEditUsage(e.target.value)} min="0" step="0.1" className={inputClass} /></FormField>
            <FormField label="Reorder Level (kg)"><input type="number" value={editReorder} onChange={e => setEditReorder(e.target.value)} min="0" className={inputClass} /></FormField>
            <FormField label="Supplier"><input type="text" value={editSupplier} onChange={e => setEditSupplier(e.target.value)} className={inputClass} /></FormField>
            <FormField label="Last Delivery"><input type="date" value={editDelivery} onChange={e => setEditDelivery(e.target.value)} className={inputClass} /></FormField>
          </div>
          <FormField label="Notes"><textarea rows={2} value={editNotes} onChange={e => setEditNotes(e.target.value)} className={textareaClass} /></FormField>
          <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700">
            Editing quantity does not affect historical confirmed rations. New calculations will use the updated quantity.
          </div>
        </div>
      </Modal>

      {/* Farm Analysis modal */}
      <Modal open={!!analysisItem} onClose={() => { setAnalysisItem(null); setAError(null); }}
        title={`Laboratory Analysis — ${analysisItem?.feed_name ?? ""}`} size="lg"
        footer={<>
          <button onClick={() => setAnalysisItem(null)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleAnalysis} disabled={aSubmitting} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-semibold">
            {aSubmitting ? <><Loader2 size={15} className="animate-spin" />Saving…</> : <><FlaskConical size={15} />Save Analysis</>}
          </button>
        </>}>
        <div className="space-y-4">
          {aError && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">{aError}</div>}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
            Enter only the values you have from your laboratory report. Leave blank to use SmartHerd's INRA 2018 defaults for missing parameters. <strong>Global defaults are never modified.</strong>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Dry Matter (% fresh matter)"><input type="number" value={aDM}   onChange={e => setADM(e.target.value)}   min="0" max="100" step="0.1" placeholder={`Default: ${analysisItem?.defaults?.dry_matter_pct ?? "—"}`} className={inputClass} /></FormField>
            <FormField label="UFL / kg DM">               <input type="number" value={aUFL}  onChange={e => setAUFL(e.target.value)}  min="0" step="0.01" placeholder={`Default: ${analysisItem?.defaults?.ufl_per_kg_dm ?? "—"}`} className={inputClass} /></FormField>
            <FormField label="PDIN (g / kg DM)">          <input type="number" value={aPDIN} onChange={e => setAPDIN(e.target.value)} min="0" step="0.1" placeholder={`Default: ${analysisItem?.defaults?.pdin_g_per_kg_dm ?? "—"}`} className={inputClass} /></FormField>
            <FormField label="PDIE (g / kg DM)">          <input type="number" value={aPDIE} onChange={e => setAPDIE(e.target.value)} min="0" step="0.1" placeholder={`Default: ${analysisItem?.defaults?.pdie_g_per_kg_dm ?? "—"}`} className={inputClass} /></FormField>
            <FormField label="NDF (% DM)">                <input type="number" value={aNDF}  onChange={e => setANDF(e.target.value)}  min="0" max="100" step="0.1" placeholder={`Default: ${analysisItem?.defaults?.ndf_pct_dm ?? "—"}`} className={inputClass} /></FormField>
            <FormField label="ADF (% DM)">                <input type="number" value={aADF}  onChange={e => setAADF(e.target.value)}  min="0" max="100" step="0.1" placeholder={`Default: ${analysisItem?.defaults?.adf_pct_dm ?? "—"}`} className={inputClass} /></FormField>
            <FormField label="Crude Protein (% DM)">      <input type="number" value={aCP}   onChange={e => setACP(e.target.value)}   min="0" max="100" step="0.1" placeholder={`Default: ${analysisItem?.defaults?.crude_protein_pct_dm ?? "—"}`} className={inputClass} /></FormField>
            <FormField label="Calcium (g / kg DM)">       <input type="number" value={aCa}   onChange={e => setACa(e.target.value)}   min="0" step="0.1" placeholder={`Default: ${analysisItem?.defaults?.calcium_g_per_kg_dm ?? "—"}`} className={inputClass} /></FormField>
            <FormField label="Phosphorus (g / kg DM)">    <input type="number" value={aP}    onChange={e => setAP(e.target.value)}    min="0" step="0.1" placeholder={`Default: ${analysisItem?.defaults?.phosphorus_g_per_kg_dm ?? "—"}`} className={inputClass} /></FormField>
            <FormField label="Laboratory Name">            <input type="text"   value={aLab}  onChange={e => setALab(e.target.value)}  placeholder="e.g. Algerian Agri-Lab" className={inputClass} /></FormField>
            <FormField label="Analysis Date">              <input type="date"   value={aDate} onChange={e => setADate(e.target.value)} className={inputClass} /></FormField>
          </div>
          <FormField label="Notes"><textarea rows={2} value={aNotes} onChange={e => setANotes(e.target.value)} className={textareaClass} /></FormField>
        </div>
      </Modal>

      {/* Confirm ration */}
      <Modal open={!!toConfirm} onClose={() => { setToConfirm(null); setConfirmErr(null); }} title="Confirm Ration"
        footer={<>
          <button onClick={() => setToConfirm(null)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleConfirmRation} disabled={confirming || !rationName.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-semibold">
            {confirming ? <><Loader2 size={15} className="animate-spin" />Confirming…</> : <><CheckCircle2 size={15} />Confirm Ration</>}
          </button>
        </>}>
        <div className="space-y-4">
          {confirmErr && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">{confirmErr}</div>}
          {toConfirm && (
            <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
              <p className="font-semibold text-gray-800">Cow: {toConfirm.cowName} ({toConfirm.cowTag})</p>
              <p className="text-gray-600">Daily cost: <strong>{toConfirm.dailyCostPerCow.toFixed(0)} DZD</strong></p>
              <p className="text-gray-600">Monthly cost: <strong>{toConfirm.monthlyCostPerCow.toFixed(0)} DZD</strong></p>
              <p className="text-gray-600">{toConfirm.feedItems.length} feeds in ration</p>
              <p className="text-xs text-gray-400">Nutritional values and prices are snapshotted now and will not change retroactively.</p>
            </div>
          )}
          <FormField label="Ration Name" required>
            <input type="text" value={rationName} onChange={e => setRationName(e.target.value)}
              placeholder={`e.g. ${toConfirm?.cowName ?? "Cow"} — ${new Date().toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`}
              className={inputClass} />
          </FormField>
        </div>
      </Modal>

      {/* Delete feed */}
      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)}
        onConfirm={async () => { if (toDelete) await deleteFeedItem(toDelete); setToDelete(null); }}
        title="Delete Feed Item" message="Permanently delete this feed? Historical confirmed rations will retain their original data."
        confirmLabel="Delete" danger />
    </div>
  );
}
