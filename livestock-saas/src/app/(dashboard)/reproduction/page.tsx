"use client";
import { useState, useMemo } from "react";
import { Plus, Loader2, Heart } from "lucide-react";
import { Modal }      from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge, pregnancyVariant } from "@/components/ui/StatusBadge";
import { FormField, inputClass, selectClass, textareaClass } from "@/components/ui/FormField";
import { cn, formatDate } from "@/lib/utils";
import { useAuth }          from "@/contexts/AuthContext";
import { useAnimals }       from "@/hooks/useAnimals";
import { useReproduction }  from "@/hooks/useReproduction";
import type { ReproductionInsertPayload } from "@/hooks/useReproduction";

function gestationDays(inseminationDate?: string): number {
  if (!inseminationDate) return 0;
  const diff = Date.now() - new Date(inseminationDate).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function gestationPct(days: number): number {
  return Math.min(100, Math.round((days / 283) * 100));
}

export default function ReproductionPage() {
  const { farm } = useAuth();
  const farmId   = farm?.id ?? null;
  const { animals }                 = useAnimals(farmId);
  const { records, loading, error, addEvent, deleteEvent } = useReproduction(farmId);

  const [showAdd,     setShowAdd]     = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState<string|null>(null);

  const [evAnimal,   setEvAnimal]   = useState("");
  const [evType,     setEvType]     = useState<"heat"|"insemination"|"pregnancy-check"|"birth">("insemination");
  const [evDate,     setEvDate]     = useState(new Date().toISOString().split("T")[0]);
  const [evResult,   setEvResult]   = useState("");
  const [evTech,     setEvTech]     = useState("");
  const [evBull,     setEvBull]     = useState("");
  const [evStraw,    setEvStraw]    = useState("");
  const [evDueDate,  setEvDueDate]  = useState("");
  const [evNotes,    setEvNotes]    = useState("");

  const pregnantAnimals = useMemo(() => animals.filter(a => a.pregnancyStatus === "pregnant"), [animals]);
  const openAnimals     = useMemo(() => animals.filter(a => a.pregnancyStatus === "open"),     [animals]);

  const kpis = [
    { label:"Pregnant",       value:pregnantAnimals.length,                                                  color:"bg-violet-50 text-violet-700" },
    { label:"Open",           value:openAnimals.length,                                                      color:"bg-amber-50 text-amber-700"   },
    { label:"Lactating",      value:animals.filter(a=>a.pregnancyStatus==="lactating").length,                color:"bg-emerald-50 text-emerald-700"},
    { label:"Total Records",  value:records.length,                                                          color:"bg-blue-50 text-blue-700"     },
  ];

  async function handleAdd() {
    if (!evAnimal||!evDate) { setSubmitError("Animal and date are required."); return; }
    setSubmitting(true); setSubmitError(null);
    const payload: ReproductionInsertPayload = {
      animal_id: evAnimal, event_type: evType, event_date: evDate,
      result: evResult||undefined, technician: evTech||undefined,
      bull_name: evBull||undefined, straw_id: evStraw||undefined,
      expected_due_date: evDueDate||undefined, notes: evNotes||undefined,
    };
    const { error } = await addEvent(payload);
    setSubmitting(false);
    if (error) { setSubmitError(error); return; }
    setShowAdd(false);
    setEvAnimal(""); setEvResult(""); setEvTech(""); setEvBull(""); setEvStraw(""); setEvDueDate(""); setEvNotes("");
  }

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className={cn("rounded-2xl p-4 text-center", k.color)}>
            <p className="text-2xl font-bold">{k.value}</p>
            <p className="text-xs font-semibold mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Pregnancy tracker */}
      {pregnantAnimals.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          <div className="p-5 border-b border-gray-50">
            <h3 className="font-semibold text-gray-900">Pregnancy Tracker</h3>
            <p className="text-xs text-gray-400 mt-0.5">{pregnantAnimals.length} pregnant animal{pregnantAnimals.length>1?"s":""}</p>
          </div>
          <div className="divide-y divide-gray-50">
            {pregnantAnimals.map(a => {
              const days = gestationDays(a.inseminationDate);
              const pct  = gestationPct(days);
              return (
                <div key={a.id} className="px-5 py-4 flex items-center gap-4">
                  <div className="text-2xl">🐄</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-800">{a.name}</p>
                      <span className="text-xs text-gray-500">{days}/283 days ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all",
                        pct>90?"bg-red-400":pct>70?"bg-amber-400":"bg-violet-500")}
                        style={{width:`${pct}%`}}/>
                    </div>
                    {a.expectedBirthDate && (
                      <p className="text-xs text-gray-400 mt-1">Expected: {formatDate(a.expectedBirthDate)}</p>
                    )}
                  </div>
                  <StatusBadge label="pregnant" variant="violet"/>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All records */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex items-center justify-between">
          <div><h3 className="font-semibold text-gray-900">Reproduction Records</h3><p className="text-xs text-gray-400 mt-0.5">{records.length} total events</p></div>
          <button onClick={()=>{setSubmitError(null);setShowAdd(true);}}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
            <Plus size={16}/>Add Event
          </button>
        </div>

        {error && <div className="p-4 text-sm text-red-600 bg-red-50">{error}</div>}

        {loading ? (
          <div className="p-8 space-y-3">{[1,2,3].map(i=><div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse"/>)}</div>
        ) : records.length === 0 ? (
          <EmptyState icon="❤️" title="No reproduction records" message="Track heat cycles, inseminations, pregnancy checks and births."/>
        ) : records.map(r => (
          <div key={r.id} className="px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/70">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-semibold",
                    r.type==="insemination"?"bg-blue-50 text-blue-700":
                    r.type==="pregnancy-check"?"bg-violet-50 text-violet-700":
                    r.type==="heat"?"bg-pink-50 text-pink-700":"bg-emerald-50 text-emerald-700")}>
                    {r.type.replace("-"," ").toUpperCase()}
                  </span>
                  <p className="text-sm font-medium text-gray-800">{r.animalName}</p>
                  {r.result&&<span className="text-xs text-gray-500">→ {r.result}</span>}
                </div>
                {r.technician&&<p className="text-xs text-gray-400 mt-1">Tech: {r.technician}</p>}
                {r.bull&&<p className="text-xs text-gray-400">Bull: {r.bull}{r.straws?` · Straw: ${r.straws}`:""}</p>}
                {r.notes&&<p className="text-xs text-gray-400 truncate max-w-md">{r.notes}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-medium text-gray-700">{formatDate(r.date)}</p>
                {r.expectedDueDate&&<p className="text-xs text-violet-600 mt-1">Due: {formatDate(r.expectedDueDate)}</p>}
                <button onClick={()=>deleteEvent(r.id)} className="text-xs text-red-500 hover:underline mt-1">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={showAdd} onClose={()=>{setShowAdd(false);setSubmitError(null);}} title="Add Reproduction Event" size="lg"
        footer={<>
          <button onClick={()=>setShowAdd(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleAdd} disabled={submitting} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-semibold">
            {submitting?<><Loader2 size={15} className="animate-spin"/>Saving…</>:"Save Event"}
          </button>
        </>}>
        <div className="space-y-4">
          {submitError&&<div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">{submitError}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Animal" required>
              <select value={evAnimal} onChange={e=>setEvAnimal(e.target.value)} className={selectClass}>
                <option value="">Select animal…</option>
                {animals.map(a=><option key={a.id} value={a.id}>{a.name} ({a.tag||"no tag"})</option>)}
              </select>
            </FormField>
            <FormField label="Event Type" required>
              <select value={evType} onChange={e=>setEvType(e.target.value as typeof evType)} className={selectClass}>
                <option value="heat">Heat Detection</option>
                <option value="insemination">Insemination</option>
                <option value="pregnancy-check">Pregnancy Check</option>
                <option value="birth">Birth</option>
              </select>
            </FormField>
            <FormField label="Date" required><input type="date" value={evDate} onChange={e=>setEvDate(e.target.value)} className={inputClass}/></FormField>
            <FormField label="Result"><input type="text" value={evResult} onChange={e=>setEvResult(e.target.value)} placeholder="e.g. Positive / Negative" className={inputClass}/></FormField>
            <FormField label="Technician"><input type="text" value={evTech} onChange={e=>setEvTech(e.target.value)} placeholder="Technician name" className={inputClass}/></FormField>
            <FormField label="Bull / Semen"><input type="text" value={evBull} onChange={e=>setEvBull(e.target.value)} placeholder="Bull name or ID" className={inputClass}/></FormField>
            <FormField label="Straw ID"><input type="text" value={evStraw} onChange={e=>setEvStraw(e.target.value)} placeholder="Straw ID" className={inputClass}/></FormField>
            <FormField label="Expected Due Date"><input type="date" value={evDueDate} onChange={e=>setEvDueDate(e.target.value)} className={inputClass}/></FormField>
          </div>
          <FormField label="Notes"><textarea rows={2} value={evNotes} onChange={e=>setEvNotes(e.target.value)} className={textareaClass}/></FormField>
        </div>
      </Modal>
    </div>
  );
}
