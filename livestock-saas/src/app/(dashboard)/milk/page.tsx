"use client";
import { useState, useMemo } from "react";
import { Plus, Loader2 } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Modal }      from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField, inputClass, selectClass, textareaClass } from "@/components/ui/FormField";
import { cn, formatDate } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useMilk } from "@/hooks/useMilk";
import { useAnimals } from "@/hooks/useAnimals";
import type { MilkInsertPayload } from "@/hooks/useMilk";

type Period = "daily" | "weekly" | "monthly" | "yearly";

const PERIOD_LABELS: Record<Period, string> = {
  daily:"Daily", weekly:"Weekly", monthly:"Monthly", yearly:"Yearly"
};

function groupRecords(records: { date: string; total: number }[], period: Period) {
  if (period === "daily") {
    return records.slice(0,30).map(r=>({
      label: r.date.slice(5), value: r.total,
    })).reverse();
  }
  if (period === "weekly") {
    const map = new Map<string, number>();
    records.forEach(r => {
      const d = new Date(r.date);
      const weekStart = new Date(d); weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().split("T")[0];
      map.set(key, (map.get(key)??0) + r.total);
    });
    return Array.from(map.entries()).slice(-12).map(([k,v])=>({ label: k.slice(5), value: Math.round(v*10)/10 }));
  }
  if (period === "monthly") {
    const map = new Map<string, number>();
    records.forEach(r => {
      const m = r.date.slice(0,7);
      map.set(m, (map.get(m)??0) + r.total);
    });
    return Array.from(map.entries()).slice(-12).map(([k,v])=>({
      label: new Date(k+"-01").toLocaleString("default",{month:"short"}),
      value: Math.round(v*10)/10,
    }));
  }
  // yearly
  const map = new Map<string, number>();
  records.forEach(r => {
    const y = r.date.slice(0,4);
    map.set(y, (map.get(y)??0) + r.total);
  });
  return Array.from(map.entries()).map(([k,v])=>({ label: k, value: Math.round(v*10)/10 }));
}

export default function MilkPage() {
  const { farm } = useAuth();
  const farmId   = farm?.id ?? null;
  const { milkRecords, loading, error, addMilkRecord, deleteMilkRecord, monthlyTotals } = useMilk(farmId);
  const { animals } = useAnimals(farmId);

  const [period,      setPeriod]      = useState<Period>("monthly");
  const [showAdd,     setShowAdd]     = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState<string|null>(null);

  const [date,      setDate]      = useState(new Date().toISOString().split("T")[0]);
  const [morning,   setMorning]   = useState("");
  const [afternoon, setAfternoon] = useState("");
  const [evening,   setEvening]   = useState("");
  const [quality,   setQuality]   = useState<"A"|"B"|"C">("A");
  const [fat,       setFat]       = useState("");
  const [protein,   setProtein]   = useState("");
  const [notes,     setNotes]     = useState("");

  const todayStr   = new Date().toISOString().split("T")[0];
  const todayRecs  = milkRecords.filter(r => r.date === todayStr);
  const todayTotal = todayRecs.reduce((s,r) => s + r.total, 0);
  const weekTotal  = milkRecords.slice(0,7).reduce((s,r) => s + r.total, 0);
  const avgDaily   = milkRecords.length > 0
    ? (milkRecords.reduce((s,r)=>s+r.total,0)/milkRecords.length).toFixed(1)
    : "0";

  const chartData = useMemo(() =>
    groupRecords(milkRecords.map(r=>({ date: r.date, total: r.total })), period),
  [milkRecords, period]);

  const topProducers = useMemo(() =>
    animals.filter(a => a.pregnancyStatus === "lactating").slice(0,5),
  [animals]);

  async function handleAdd() {
    if (!date) { setSubmitError("Date is required."); return; }
    setSubmitting(true); setSubmitError(null);
    const payload: MilkInsertPayload = {
      record_date: date,
      morning_liters:   morning   ? parseFloat(morning)   : 0,
      afternoon_liters: afternoon ? parseFloat(afternoon) : 0,
      evening_liters:   evening   ? parseFloat(evening)   : 0,
      quality_grade: quality,
      fat_percentage:     fat     ? parseFloat(fat)     : undefined,
      protein_percentage: protein ? parseFloat(protein) : undefined,
      notes: notes || undefined,
    };
    const { error } = await addMilkRecord(payload);
    setSubmitting(false);
    if (error) { setSubmitError(error); return; }
    setShowAdd(false);
    setMorning(""); setAfternoon(""); setEvening(""); setFat(""); setProtein(""); setNotes("");
  }

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label:"Today's Total",  value:`${todayTotal}L`,  color:"bg-emerald-50 text-emerald-700" },
          { label:"7-Day Total",    value:`${weekTotal}L`,   color:"bg-blue-50 text-blue-700"       },
          { label:"Daily Average",  value:`${avgDaily}L`,    color:"bg-violet-50 text-violet-700"   },
          { label:"Records",        value:milkRecords.length, color:"bg-amber-50 text-amber-700"    },
        ].map(s=>(
          <div key={s.label} className={cn("rounded-2xl p-4 text-center",s.color)}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-semibold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Chart with period toggle */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-semibold text-gray-900">Milk Production</h3>
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {(["daily","weekly","monthly","yearly"] as Period[]).map(p=>(
              <button key={p} onClick={()=>setPeriod(p)}
                className={cn("px-3 py-1 rounded-lg text-xs font-semibold transition-colors",
                  period===p?"bg-white text-emerald-700 shadow-sm":"text-gray-500 hover:text-gray-700")}>
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
        {chartData.length === 0 ? (
          <EmptyState icon="🥛" title="No data for this period" message="Add milk records to see production trends."/>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{top:5,right:5,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="label" tick={{fontSize:11,fill:"#9ca3af"}}/>
              <YAxis tick={{fontSize:11,fill:"#9ca3af"}}/>
              <Tooltip formatter={v=>[`${v}L`,"Liters"]}/>
              <Bar dataKey="value" name="Liters" fill="#059669" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top producers */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Lactating Animals</h3>
        {topProducers.length === 0 ? (
          <EmptyState icon="🐄" title="No lactating animals" message="Animals with 'Lactating' reproductive status appear here."/>
        ) : (
          <div className="space-y-3">
            {topProducers.map((a,i)=>(
              <div key={a.id} className="flex items-center gap-3">
                <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0",
                  i===0?"bg-amber-400":i===1?"bg-gray-400":i===2?"bg-orange-400":"bg-gray-200 text-gray-500")}>{i+1}</div>
                <div className="flex-1"><p className="text-sm font-medium text-gray-800">{a.name}</p><p className="text-xs text-gray-400">{a.tag||"No tag"} · {a.breed||a.type}</p></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Records table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex items-center justify-between">
          <div><h3 className="font-semibold text-gray-900">Milk Records</h3><p className="text-xs text-gray-400 mt-0.5">{milkRecords.length} records</p></div>
          <button onClick={()=>{setSubmitError(null);setShowAdd(true);}}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
            <Plus size={16}/>Add Entry
          </button>
        </div>
        {error && <div className="p-4 text-sm text-red-600 bg-red-50">{error}</div>}
        {loading ? (
          <div className="p-8 space-y-3">{[1,2,3].map(i=><div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse"/>)}</div>
        ) : milkRecords.length === 0 ? (
          <EmptyState icon="🥛" title="No milk records yet" message="Start recording daily milk production."/>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100 bg-gray-50/50">
                {["Date","Morning","Afternoon","Evening","Total","Quality","Fat%","Protein%",""].map(h=>(
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {milkRecords.map(r=>(
                  <tr key={r.id} className="hover:bg-gray-50/70">
                    <td className="px-4 py-3 font-medium text-gray-800">{formatDate(r.date)}</td>
                    <td className="px-4 py-3 text-gray-600">{r.morning>0?`${r.morning}L`:"—"}</td>
                    <td className="px-4 py-3 text-gray-600">{r.afternoon>0?`${r.afternoon}L`:"—"}</td>
                    <td className="px-4 py-3 text-gray-600">{r.evening>0?`${r.evening}L`:"—"}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{r.total}L</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-semibold",
                        r.quality==="A"?"bg-emerald-50 text-emerald-700":r.quality==="B"?"bg-amber-50 text-amber-700":"bg-red-50 text-red-700")}>
                        Grade {r.quality}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.fatContent>0?`${r.fatContent}%`:"—"}</td>
                    <td className="px-4 py-3 text-gray-600">{r.proteinContent>0?`${r.proteinContent}%`:"—"}</td>
                    <td className="px-4 py-3">
                      <button onClick={()=>deleteMilkRecord(r.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showAdd} onClose={()=>{setShowAdd(false);setSubmitError(null);}} title="Add Milk Record"
        subtitle="Record daily milk production totals."
        footer={<>
          <button onClick={()=>setShowAdd(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleAdd} disabled={submitting} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-semibold">
            {submitting?<><Loader2 size={15} className="animate-spin"/>Saving…</>:"Save Record"}
          </button>
        </>}>
        <div className="space-y-4">
          {submitError&&<div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">{submitError}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Date" required><input type="date" value={date} onChange={e=>setDate(e.target.value)} className={inputClass}/></FormField>
            <FormField label="Quality Grade">
              <select value={quality} onChange={e=>setQuality(e.target.value as "A"|"B"|"C")} className={selectClass}>
                <option value="A">Grade A</option><option value="B">Grade B</option><option value="C">Grade C</option>
              </select>
            </FormField>
            <FormField label="Morning (L)"><input type="number" value={morning} onChange={e=>setMorning(e.target.value)} min="0" step="0.1" placeholder="0" className={inputClass}/></FormField>
            <FormField label="Afternoon (L)"><input type="number" value={afternoon} onChange={e=>setAfternoon(e.target.value)} min="0" step="0.1" placeholder="0" className={inputClass}/></FormField>
            <FormField label="Evening (L)"><input type="number" value={evening} onChange={e=>setEvening(e.target.value)} min="0" step="0.1" placeholder="0" className={inputClass}/></FormField>
            <FormField label="Fat %"><input type="number" value={fat} onChange={e=>setFat(e.target.value)} min="0" step="0.01" placeholder="3.5" className={inputClass}/></FormField>
            <FormField label="Protein %"><input type="number" value={protein} onChange={e=>setProtein(e.target.value)} min="0" step="0.01" placeholder="3.2" className={inputClass}/></FormField>
          </div>
          <FormField label="Notes"><textarea rows={2} value={notes} onChange={e=>setNotes(e.target.value)} className={textareaClass}/></FormField>
          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <p className="text-sm text-emerald-700 font-semibold">
              Total: {((parseFloat(morning)||0)+(parseFloat(afternoon)||0)+(parseFloat(evening)||0)).toFixed(1)}L
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
