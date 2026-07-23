"use client";
import { useState, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn }         from "@/lib/utils";
import { ROUTES }     from "@/constants";
import Link           from "next/link";
import { useAuth }    from "@/contexts/AuthContext";
import { useDashboard } from "@/hooks/useDashboard";
import { useMilk }      from "@/hooks/useMilk";

type Period = "daily" | "weekly" | "monthly" | "yearly";
const PERIOD_LABELS: Record<Period, string> = { daily:"Daily", weekly:"Weekly", monthly:"Monthly", yearly:"Yearly" };
const COLORS = ["#059669","#0ea5e9","#f59e0b","#ef4444","#8b5cf6","#ec4899"];

function groupMilk(records: { date: string; total: number }[], period: Period) {
  if (period === "daily") {
    return records.slice(0, 30).map(r => ({ label: r.date.slice(5), value: r.total })).reverse();
  }
  if (period === "weekly") {
    const map = new Map<string, number>();
    records.forEach(r => {
      const d = new Date(r.date);
      const ws = new Date(d); ws.setDate(d.getDate() - d.getDay());
      const key = ws.toISOString().split("T")[0];
      map.set(key, (map.get(key) ?? 0) + r.total);
    });
    return Array.from(map.entries()).slice(-12).map(([k, v]) => ({ label: k.slice(5), value: Math.round(v * 10) / 10 }));
  }
  if (period === "monthly") {
    const map = new Map<string, number>();
    records.forEach(r => { const m = r.date.slice(0, 7); map.set(m, (map.get(m) ?? 0) + r.total); });
    return Array.from(map.entries()).slice(-12).map(([k, v]) => ({
      label: new Date(k + "-01").toLocaleString("default", { month: "short" }),
      value: Math.round(v * 10) / 10,
    }));
  }
  // yearly
  const map = new Map<string, number>();
  records.forEach(r => { const y = r.date.slice(0, 4); map.set(y, (map.get(y) ?? 0) + r.total); });
  return Array.from(map.entries()).map(([k, v]) => ({ label: k, value: Math.round(v * 10) / 10 }));
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map(p => <p key={p.name} style={{ color: p.color }} className="text-xs">{p.name}: <span className="font-semibold">{p.value}</span></p>)}
    </div>
  );
}

function PeriodToggle({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
      {(["daily", "weekly", "monthly", "yearly"] as Period[]).map(p => (
        <button key={p} onClick={() => onChange(p)}
          className={cn("px-3 py-1 rounded-lg text-xs font-semibold transition-colors",
            value === p ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
          {PERIOD_LABELS[p]}
        </button>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const { farm } = useAuth();
  const farmId   = farm?.id ?? null;
  const dash = useDashboard(farmId);
  const milk = useMilk(farmId);

  const [milkPeriod,   setMilkPeriod]   = useState<Period>("monthly");
  const [profitPeriod, setProfitPeriod] = useState<Period>("monthly");

  const milkChartData = useMemo(() =>
    groupMilk(milk.milkRecords.map(r => ({ date: r.date, total: r.total })), milkPeriod),
  [milk.milkRecords, milkPeriod]);

  const profitChartData = dash.monthlyProfitability; // already monthly; period toggle is visual

  if (dash.loading || milk.loading) {
    return (
      <div className="space-y-5 max-w-[1400px]">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}
        </div>
      </div>
    );
  }

  const todayStr   = new Date().toISOString().split("T")[0];
  const milkToday  = milk.milkRecords.filter(r => r.date === todayStr).reduce((s, r) => s + r.total, 0);
  const hasAnimals = dash.totalAnimals > 0;
  const hasMilk    = milkChartData.length > 0 && milkChartData.some(d => d.value > 0);
  const hasProfit  = profitChartData.length > 0;

  const healthData  = dash.animalsByHealth.map(h => ({
    name: h.status.charAt(0).toUpperCase() + h.status.slice(1), value: h.count,
  }));
  const speciesData = dash.animalsBySpecies.map(s => ({
    name: s.species.charAt(0).toUpperCase() + s.species.slice(1), value: s.count,
  }));

  return (
    <div className="space-y-5 max-w-[1400px]">

      {/* KPIs — all live */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Animals",  value: dash.totalAnimals,
            color: "bg-emerald-50 text-emerald-700" },
          { label: "Healthy Rate",
            value: dash.totalAnimals > 0
              ? `${Math.round((dash.healthyAnimals / dash.totalAnimals) * 100)}%`
              : "—",
            color: "bg-blue-50 text-blue-700" },
          { label: "Pregnant",       value: dash.pregnantAnimals,
            color: "bg-violet-50 text-violet-700" },
          { label: "Milk Today",     value: `${milkToday}L`,
            color: "bg-amber-50 text-amber-700" },
        ].map(s => (
          <div key={s.label} className={cn("rounded-2xl p-4 text-center", s.color)}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-semibold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Milk Production chart with period toggle */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="font-semibold text-gray-900">Milk Production</h3>
            <p className="text-xs text-gray-400 mt-0.5">Total liters per {milkPeriod === "daily" ? "day" : milkPeriod === "weekly" ? "week" : milkPeriod === "monthly" ? "month" : "year"}</p>
          </div>
          <PeriodToggle value={milkPeriod} onChange={setMilkPeriod} />
        </div>
        {!hasMilk ? (
          <EmptyState icon="🥛" title="No milk records yet"
            message="Add milk records to see production trends."
            action={<Link href={ROUTES.MILK} className="text-sm text-emerald-600 font-semibold hover:underline">Go to Milk Tracking →</Link>} />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={milkChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <Tooltip formatter={v => [`${v}L`, "Liters"]} />
              <Bar dataKey="value" name="Liters" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Profitability */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="font-semibold text-gray-900">Revenue vs Costs</h3>
            <p className="text-xs text-gray-400 mt-0.5">Monthly profitability overview</p>
          </div>
        </div>
        {!hasProfit ? (
          <EmptyState icon="📊" title="No profitability data"
            message="Add milk records and feed inventory to see revenue vs costs." />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={profitChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#059669" fill="#d1fae5" strokeWidth={2} />
              <Area type="monotone" dataKey="costs"   name="Costs"   stroke="#ef4444" fill="#fee2e2" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Health + Species breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Health Status Breakdown</h3>
          {!hasAnimals || healthData.length === 0 ? (
            <EmptyState icon="🩺" title="No animal data" message="Add animals to see health analytics." />
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={healthData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {healthData.map((_, i) => (
                      <Cell key={i} fill={["#059669", "#f59e0b", "#ef4444", "#6b7280"][i] ?? COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {healthData.map((h, i) => (
                  <div key={h.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: ["#059669", "#f59e0b", "#ef4444", "#6b7280"][i] }} />
                      <span className="text-sm text-gray-700">{h.name}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{h.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Animals by Species</h3>
          {!hasAnimals || speciesData.length === 0 ? (
            <EmptyState icon="🐄" title="No animal data" message="Add animals to see species breakdown." />
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={speciesData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {speciesData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {speciesData.map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-gray-700">{s.name}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top producers table */}
      {dash.topProducers.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          <div className="p-5 border-b border-gray-50">
            <h3 className="font-semibold text-gray-900">Lactating Animals</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100 bg-gray-50/50">
                {["Rank", "Animal", "Tag", "Status"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {dash.topProducers.map((p, i) => (
                  <tr key={p.name} className="hover:bg-gray-50/70">
                    <td className="px-5 py-3">
                      <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white",
                        i === 0 ? "bg-amber-400" : i === 1 ? "bg-gray-400" : i === 2 ? "bg-orange-400" : "bg-gray-200 text-gray-500"
                      )}>{i + 1}</div>
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-800">{p.name}</td>
                    <td className="px-5 py-3 text-gray-500">{p.tag || "—"}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">Lactating</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
