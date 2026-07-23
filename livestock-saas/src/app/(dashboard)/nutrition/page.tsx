"use client";
import { useState } from "react";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { Modal }         from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState }    from "@/components/ui/EmptyState";
import { StatusBadge }   from "@/components/ui/StatusBadge";
import { FormField, inputClass, selectClass, textareaClass } from "@/components/ui/FormField";
import { cn } from "@/lib/utils";
import { useAuth }         from "@/contexts/AuthContext";
import { useFeedInventory } from "@/hooks/useFeedInventory";
import type { FeedInsertPayload } from "@/hooks/useFeedInventory";

const CATEGORY_COLOR: Record<string, string> = {
  forage:"bg-green-50 text-green-700", concentrate:"bg-blue-50 text-blue-700",
  supplement:"bg-violet-50 text-violet-700", mineral:"bg-amber-50 text-amber-700",
};

export default function NutritionPage() {
  const { farm } = useAuth();
  const farmId   = farm?.id ?? null;
  const { feedItems, loading, error, addFeedItem, updateFeedItem, deleteFeedItem, totalCostPerDay } = useFeedInventory(farmId);

  const [showAdd,     setShowAdd]     = useState(false);
  const [toDelete,    setToDelete]    = useState<string|null>(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState<string|null>(null);

  const [name,     setName]     = useState("");
  const [category, setCategory] = useState<"forage"|"concentrate"|"supplement"|"mineral">("forage");
  const [stock,    setStock]    = useState("");
  const [unit,     setUnit]     = useState("kg");
  const [usage,    setUsage]    = useState("");
  const [cost,     setCost]     = useState("");
  const [reorder,  setReorder]  = useState("");
  const [supplier, setSupplier] = useState("");
  const [delivery, setDelivery] = useState("");
  const [notes,    setNotes]    = useState("");

  const totalValue   = feedItems.reduce((s,f) => s + f.totalValue,   0);
  const lowCount     = feedItems.filter(f => f.currentStock <= f.reorderLevel).length;

  async function handleAdd() {
    if (!name||!stock||!unit) { setSubmitError("Name, stock and unit are required."); return; }
    setSubmitting(true); setSubmitError(null);
    const payload: FeedInsertPayload = {
      feed_name: name, category,
      current_stock: parseFloat(stock)||0,
      unit, daily_usage: parseFloat(usage)||0,
      cost_per_unit: parseFloat(cost)||0,
      reorder_level: parseFloat(reorder)||0,
      supplier: supplier||undefined,
      last_delivery_date: delivery||undefined,
      notes: notes||undefined,
    };
    const { error } = await addFeedItem(payload);
    setSubmitting(false);
    if (error) { setSubmitError(error); return; }
    setShowAdd(false);
    setName(""); setStock(""); setUsage(""); setCost(""); setReorder(""); setSupplier(""); setDelivery(""); setNotes("");
  }

  return (
    <div className="space-y-5 max-w-[1400px]">
      {lowCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-amber-600 shrink-0"/>
          <p className="text-sm text-amber-700"><strong>{lowCount} feed item{lowCount>1?"s":""}</strong> at or below reorder level. Restock soon.</p>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label:"Feed Items",     value:feedItems.length,        color:"bg-emerald-50 text-emerald-700" },
          { label:"Low Stock",      value:lowCount,                color:"bg-red-50 text-red-700"         },
          { label:"Daily Cost",     value:`${totalCostPerDay.toFixed(0)} DZD`, color:"bg-blue-50 text-blue-700" },
          { label:"Total Value",    value:`${totalValue.toFixed(0)} DZD`,       color:"bg-violet-50 text-violet-700" },
        ].map(s => (
          <div key={s.label} className={cn("rounded-2xl p-4 text-center", s.color)}>
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs font-semibold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Inventory */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex items-center justify-between">
          <div><h3 className="font-semibold text-gray-900">Feed Inventory</h3><p className="text-xs text-gray-400 mt-0.5">{feedItems.length} items</p></div>
          <button onClick={()=>{setSubmitError(null);setShowAdd(true);}}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
            <Plus size={16}/>Add Item
          </button>
        </div>

        {error && <div className="p-4 text-sm text-red-600 bg-red-50">{error}</div>}

        {loading ? (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4].map(i=><div key={i} className="h-40 bg-gray-50 rounded-xl animate-pulse"/>)}
          </div>
        ) : feedItems.length === 0 ? (
          <EmptyState icon="🌾" title="No feed items" message="Add your feed inventory to track stock levels and costs."/>
        ) : (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {feedItems.map(f => {
              const urgent = f.currentStock <= f.reorderLevel;
              const pct    = f.dailyUsage > 0 ? Math.min(100, Math.round((f.currentStock/(f.dailyUsage*60))*100)) : 100;
              return (
                <div key={f.id} className={cn("border rounded-2xl p-4 space-y-3",urgent?"border-red-200 bg-red-50/30":"border-gray-100 bg-white")}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{f.name}</p>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",CATEGORY_COLOR[f.category]??"")}>{f.category}</span>
                    </div>
                    <button onClick={()=>setToDelete(f.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{f.currentStock}{f.unit}</span>
                      <span className={cn("font-semibold text-xs",urgent?"text-red-600":"text-gray-500")}>{f.daysRemaining}d left</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full",urgent?"bg-red-400":"bg-emerald-500")} style={{width:`${pct}%`}}/>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 pt-1 border-t border-gray-100">
                    <div><p className="text-gray-400">Daily Use</p><p className="font-medium text-gray-700">{f.dailyUsage}{f.unit}</p></div>
                    <div><p className="text-gray-400">Cost/Unit</p><p className="font-medium text-gray-700">{f.costPerUnit} DZD</p></div>
                    <div><p className="text-gray-400">Reorder At</p><p className="font-medium text-gray-700">{f.reorderLevel}{f.unit}</p></div>
                    <div><p className="text-gray-400">Total Value</p><p className="font-medium text-gray-700">{f.totalValue.toFixed(0)} DZD</p></div>
                  </div>
                  {f.supplier&&<p className="text-xs text-gray-400">Supplier: {f.supplier}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={showAdd} onClose={()=>{setShowAdd(false);setSubmitError(null);}} title="Add Feed Item" size="lg"
        footer={<>
          <button onClick={()=>setShowAdd(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleAdd} disabled={submitting} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-semibold">
            {submitting?<><Loader2 size={15} className="animate-spin"/>Saving…</>:"Save Item"}
          </button>
        </>}>
        <div className="space-y-4">
          {submitError&&<div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">{submitError}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Feed Name" required><input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Alfalfa Hay" className={inputClass}/></FormField>
            <FormField label="Category">
              <select value={category} onChange={e=>setCategory(e.target.value as typeof category)} className={selectClass}>
                <option value="forage">Forage</option><option value="concentrate">Concentrate</option>
                <option value="supplement">Supplement</option><option value="mineral">Mineral</option>
              </select>
            </FormField>
            <FormField label="Current Stock" required><input type="number" value={stock} onChange={e=>setStock(e.target.value)} min="0" placeholder="0" className={inputClass}/></FormField>
            <FormField label="Unit"><input type="text" value={unit} onChange={e=>setUnit(e.target.value)} placeholder="kg / bales / L" className={inputClass}/></FormField>
            <FormField label="Daily Usage"><input type="number" value={usage} onChange={e=>setUsage(e.target.value)} min="0" step="0.1" placeholder="0" className={inputClass}/></FormField>
            <FormField label="Cost per Unit (DZD)"><input type="number" value={cost} onChange={e=>setCost(e.target.value)} min="0" step="0.01" placeholder="0" className={inputClass}/></FormField>
            <FormField label="Reorder Level"><input type="number" value={reorder} onChange={e=>setReorder(e.target.value)} min="0" placeholder="0" className={inputClass}/></FormField>
            <FormField label="Supplier"><input type="text" value={supplier} onChange={e=>setSupplier(e.target.value)} placeholder="Supplier name" className={inputClass}/></FormField>
            <FormField label="Last Delivery"><input type="date" value={delivery} onChange={e=>setDelivery(e.target.value)} className={inputClass}/></FormField>
          </div>
          <FormField label="Notes"><textarea rows={2} value={notes} onChange={e=>setNotes(e.target.value)} className={textareaClass}/></FormField>
        </div>
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={()=>setToDelete(null)} onConfirm={async()=>{if(toDelete)await deleteFeedItem(toDelete);setToDelete(null);}}
        title="Delete Feed Item" message="Permanently delete this feed item?" confirmLabel="Delete" danger/>
    </div>
  );
}
