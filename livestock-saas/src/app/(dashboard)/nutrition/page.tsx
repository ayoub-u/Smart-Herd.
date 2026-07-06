"use client";
import { useState } from "react";
import { mockFeedInventory, animals } from "@/data/mockData";
import { AlertTriangle, Plus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { cn } from "@/lib/utils";

const CAT_COLORS: Record<string, string> = {
  forage:"bg-green-100 text-green-700", concentrate:"bg-blue-100 text-blue-700",
  supplement:"bg-purple-100 text-purple-700", mineral:"bg-amber-100 text-amber-700",
};
const PIE_COLORS = ["#059669","#3b82f6","#8b5cf6","#f59e0b"];

const RATION = [
  { name:"Alfalfa Hay",     kg:8,    cost:2.80 },
  { name:"Corn Silage",     kg:15,   cost:1.80 },
  { name:"Concentrate",     kg:6,    cost:4.10 },
  { name:"Wheat Straw",     kg:3,    cost:0.54 },
  { name:"Minerals",        kg:0.15, cost:0.18 },
];

const SCHEDULE = [
  { time:"05:30 AM", meal:"Morning Milking + Concentrate", amount:"3 kg/cow",  barn:"All Barns"      },
  { time:"08:00 AM", meal:"Forage Distribution",           amount:"12 kg/cow", barn:"Barns A, B, C"  },
  { time:"12:00 PM", meal:"Afternoon Concentrate",         amount:"2 kg/cow",  barn:"All Barns"      },
  { time:"03:30 PM", meal:"Evening Milking + Concentrate", amount:"3 kg/cow",  barn:"All Barns"      },
  { time:"06:00 PM", meal:"Night Forage",                  amount:"8 kg/cow",  barn:"All Barns"      },
];

export default function NutritionPage() {
  const [tab, setTab] = useState("inventory");

  const totalValue = mockFeedInventory.reduce((s, f) => s + f.totalValue, 0);
  const lowStock   = mockFeedInventory.filter((f) => f.daysRemaining < 15);
  const dailyCost  = mockFeedInventory.reduce((s, f) => s + f.dailyUsage * f.costPerUnit, 0);

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Feed Items",      icon:"🌾", value:mockFeedInventory.length, sub:`${lowStock.length} low stock`, bg:"bg-green-50 text-green-600"  },
          { label:"Total Value",     icon:"💰", value:`$${totalValue.toFixed(0)}`, sub:"Current inventory",         bg:"bg-blue-50 text-blue-600"    },
          { label:"Daily Feed Cost", icon:"📊", value:`$${dailyCost.toFixed(0)}`, sub:"Per day",                   bg:"bg-amber-50 text-amber-600"  },
          { label:"Low Stock Alerts",icon:"⚠️", value:lowStock.length, sub:"Need reorder",                         bg:"bg-red-50 text-red-600"      },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3", s.bg)}>{s.icon}</div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
            <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Low stock warning */}
      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-600" />
            <p className="font-semibold text-amber-800 text-sm">Low Stock Warning</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((f) => (
              <div key={f.id} className="flex items-center gap-2 bg-white border border-amber-200 rounded-xl px-3 py-1.5">
                <span className="text-xs font-semibold text-amber-700">{f.name}</span>
                <span className="text-xs text-amber-500">{f.daysRemaining}d remaining</span>
                <button className="text-xs text-blue-600 font-medium hover:underline">Order</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {["inventory","schedule","ration","costs"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-4 py-2.5 rounded-xl text-sm font-medium transition-colors capitalize",
              tab===t ? "bg-emerald-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            )}>
            {t==="ration" ? "Ration Calculator" : t==="costs" ? "Feed Costs" : t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {/* Inventory */}
      {tab==="inventory" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockFeedInventory.map((f) => {
            const pct    = Math.min(100, Math.round((f.currentStock / (f.dailyUsage * 60)) * 100));
            const isLow  = f.daysRemaining < 15;
            return (
              <div key={f.id} className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xl",
                      f.category==="forage" ? "bg-green-50" : f.category==="concentrate" ? "bg-blue-50" : f.category==="supplement" ? "bg-purple-50" : "bg-amber-50"
                    )}>{f.category==="forage"?"🌿":f.category==="concentrate"?"🌽":f.category==="supplement"?"💊":"🪨"}</div>
                    <div>
                      <p className="font-semibold text-gray-900">{f.name}</p>
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", CAT_COLORS[f.category])}>{f.category}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-sm font-bold", isLow ? "text-red-600" : "text-gray-900")}>{f.daysRemaining}d left</p>
                    <p className="text-xs text-gray-400">${f.totalValue.toFixed(0)} value</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>{f.currentStock.toLocaleString()} {f.unit}</span><span>{pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", isLow ? "bg-red-400" : pct>50 ? "bg-emerald-500" : "bg-amber-400")} style={{ width:`${pct}%` }} />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t border-gray-50">
                  <div><p className="text-[10px] text-gray-400">Daily Use</p><p className="text-xs font-semibold text-gray-700">{f.dailyUsage} {f.unit}</p></div>
                  <div><p className="text-[10px] text-gray-400">Cost/Unit</p><p className="text-xs font-semibold text-gray-700">${f.costPerUnit}</p></div>
                  <div><p className="text-[10px] text-gray-400">Supplier</p><p className="text-xs font-semibold text-gray-700 truncate">{f.supplier}</p></div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="flex-1 text-xs text-center py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100 transition-colors">Record Usage</button>
                  <button className="flex-1 text-xs text-center py-1.5 rounded-lg bg-blue-50 text-blue-700 font-medium hover:bg-blue-100 transition-colors">Order Stock</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule */}
      {tab==="schedule" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Daily Feeding Schedule</h3>
            <button className="text-sm text-emerald-600 font-medium">Edit Schedule</button>
          </div>
          <div className="divide-y divide-gray-50">
            {SCHEDULE.map((s, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50/70">
                <div className="w-20 shrink-0"><p className="text-sm font-bold text-emerald-600">{s.time}</p></div>
                <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{s.meal}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.barn}</p>
                </div>
                <p className="text-sm font-medium text-gray-700 shrink-0">{s.amount}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ration */}
      {tab==="ration" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
            <h3 className="font-semibold text-gray-900 mb-1">TMR Ration Calculator</h3>
            <p className="text-xs text-gray-500 mb-4">For 30L/day cow, 600kg liveweight</p>
            <div className="space-y-3">
              {RATION.map((r, i) => (
                <div key={r.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor:PIE_COLORS[i%PIE_COLORS.length] }} />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{r.name}</span>
                      <span className="text-sm font-bold text-gray-900">{r.kg} kg</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className="h-full rounded-full" style={{ width:`${(r.kg/32)*100}%`, backgroundColor:PIE_COLORS[i%PIE_COLORS.length] }} />
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">${r.cost.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
              <div><p className="text-xs text-gray-400">Total Ration</p><p className="text-lg font-bold text-gray-900">{RATION.reduce((s,r)=>s+r.kg,0).toFixed(2)} kg</p></div>
              <div className="text-right"><p className="text-xs text-gray-400">Daily Cost/Cow</p><p className="text-lg font-bold text-emerald-600">${RATION.reduce((s,r)=>s+r.cost,0).toFixed(2)}</p></div>
            </div>
            <button className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">Recalculate Ration</button>
          </div>
          <div className="chart-container">
            <h3 className="font-semibold text-gray-900 mb-4">Ration Composition</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={RATION} dataKey="kg" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name.split(" ")[0]} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {RATION.map((_, i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v} kg`]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Costs */}
      {tab==="costs" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="chart-container">
            <h3 className="font-semibold text-gray-900 mb-1">Feed Cost by Item</h3>
            <p className="text-xs text-gray-400 mb-4">Current inventory value ($)</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={mockFeedInventory} margin={{ top:5, right:10, left:-10, bottom:40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize:10, fill:"#9ca3af" }} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize:11, fill:"#9ca3af" }} />
                <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)}`]} />
                <Bar dataKey="totalValue" name="Value ($)" fill="#059669" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-container">
            <h3 className="font-semibold text-gray-900 mb-1">Daily Usage Cost</h3>
            <p className="text-xs text-gray-400 mb-4">Cost per day by feed type</p>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={mockFeedInventory.map((f)=>({ name:f.name.split(" ")[0], value:parseFloat((f.dailyUsage*f.costPerUnit).toFixed(2)) }))} dataKey="value" cx="50%" cy="50%" outerRadius={90}>
                  {mockFeedInventory.map((_,i) => <Cell key={i} fill={["#059669","#3b82f6","#f59e0b","#8b5cf6","#ec4899","#06b6d4"][i%6]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize:"11px" }} />
                <Tooltip formatter={(v) => [`$${v}/day`]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
