"use client";
import { animals, mockProfitabilityData, mockMonthlyMilk, topProducers, healthAnalytics } from "@/data/mockData";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Legend, RadarChart, PolarGrid, PolarAngleAxis, Radar,
  PieChart, Pie, Cell,
} from "recharts";
import { cn } from "@/lib/utils";

const curr = mockProfitabilityData[mockProfitabilityData.length - 1];
const prev = mockProfitabilityData[mockProfitabilityData.length - 2];
const revChange    = (((curr.revenue - prev.revenue) / prev.revenue) * 100).toFixed(1);
const profitChange = (((curr.profit  - prev.profit)  / prev.profit)  * 100).toFixed(1);

const BREED_PIE = [
  { name:"Holstein",  value:4 },
  { name:"Jersey",    value:1 },
  { name:"Simmental", value:1 },
  { name:"Brown Swiss",value:1 },
  { name:"Others",    value:3 },
];
const PIE_COLORS = ["#059669","#3b82f6","#f59e0b","#8b5cf6","#ec4899"];

const RADAR_DATA = [
  { subject:"Milk Yield",     A:85 },
  { subject:"Health",         A:92 },
  { subject:"Reproduction",   A:72 },
  { subject:"Nutrition",      A:88 },
  { subject:"Profitability",  A:78 },
  { subject:"Feed Efficiency",A:81 },
];

const REPRO_KPI = [
  { metric:"Conception Rate",    value:72,  unit:"%" },
  { metric:"Calving Interval",   value:385, unit:"d" },
  { metric:"Days Open",          value:105, unit:"d" },
  { metric:"Services/Conception",value:1.4, unit:""  },
  { metric:"Pregnancy Rate",     value:21,  unit:"%" },
];

function KpiCard({ label, value, change, color }: { label:string; value:string; change:string; color:string }) {
  const pos = parseFloat(change) >= 0;
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className={cn("w-10 h-10 rounded-xl", color)} />
        <div className={cn("flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
          pos ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
        )}>
          {pos ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {Math.abs(parseFloat(change))}%
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 mt-3">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      <p className="text-xs text-gray-400 mt-1">vs last month</p>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Monthly Revenue"  value={`$${curr.revenue.toLocaleString()}`}                           change={revChange}    color="gradient-green" />
        <KpiCard label="Net Profit"       value={`$${curr.profit.toLocaleString()}`}                            change={profitChange} color="gradient-blue"  />
        <KpiCard label="Milk Production"  value={`${mockMonthlyMilk[mockMonthlyMilk.length-1].liters.toLocaleString()}L`} change="3.2"  color="gradient-amber" />
        <KpiCard label="Herd Health"      value="91%"                                                           change="2.1"          color="gradient-rose"  />
      </div>

      {/* Profitability area chart */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-gray-900">Profitability Overview</h3>
            <p className="text-xs text-gray-400 mt-0.5">Revenue, costs and net profit — monthly</p>
          </div>
          <div className="flex gap-4 text-xs">
            {[["#059669","Revenue"],["#d1d5db","Costs"],["#3b82f6","Profit"]].map(([color,label]) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor:color }} />
                <span className="text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={mockProfitabilityData} margin={{ top:5, right:10, left:-5, bottom:0 }}>
            <defs>
              <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#059669" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0}    />
              </linearGradient>
              <linearGradient id="profG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize:12, fill:"#9ca3af" }} />
            <YAxis tick={{ fontSize:12, fill:"#9ca3af" }} />
            <Tooltip formatter={(v, name) => [`$${Number(v).toLocaleString()}`, name]} />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#059669" strokeWidth={2} fill="url(#revG)" />
            <Area type="monotone" dataKey="costs"   name="Costs"   stroke="#d1d5db" strokeWidth={2} fill="none" strokeDasharray="4 4" />
            <Area type="monotone" dataKey="profit"  name="Profit"  stroke="#3b82f6" strokeWidth={2} fill="url(#profG)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly milk bars */}
        <div className="lg:col-span-2 chart-container">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900">Milk Production Trend</h3>
            <p className="text-xs text-gray-400 mt-0.5">Monthly liters produced</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mockMonthlyMilk} margin={{ top:5, right:10, left:-15, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize:12, fill:"#9ca3af" }} />
              <YAxis tick={{ fontSize:12, fill:"#9ca3af" }} />
              <Tooltip formatter={(v) => [`${Number(v).toLocaleString()}L`]} />
              <Bar dataKey="liters" name="Liters" radius={[6,6,0,0]}>
                {mockMonthlyMilk.map((_,i) => (
                  <Cell key={i} fill={i === mockMonthlyMilk.length-1 ? "#047857" : "#6ee7b7"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar */}
        <div className="chart-container">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900">Farm Performance</h3>
            <p className="text-xs text-gray-400 mt-0.5">Overall score by category</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={RADAR_DATA} margin={{ top:0, right:20, bottom:0, left:20 }}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize:10, fill:"#9ca3af" }} />
              <Radar name="Score" dataKey="A" stroke="#059669" fill="#059669" fillOpacity={0.15} strokeWidth={2} />
              <Tooltip formatter={(v) => [`${v}/100`]} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Health analytics */}
        <div className="lg:col-span-2 chart-container">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900">Health Analytics</h3>
            <p className="text-xs text-gray-400 mt-0.5">Healthy / recovering / sick — monthly</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={healthAnalytics} margin={{ top:5, right:10, left:-20, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize:12, fill:"#9ca3af" }} />
              <YAxis tick={{ fontSize:12, fill:"#9ca3af" }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize:"11px" }} />
              <Bar dataKey="healthy"    name="Healthy"    fill="#34d399" stackId="a" />
              <Bar dataKey="recovering" name="Recovering" fill="#fbbf24" stackId="a" />
              <Bar dataKey="sick"       name="Sick"       fill="#f87171" radius={[2,2,0,0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Breed pie */}
        <div className="chart-container">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900">Breed Distribution</h3>
            <p className="text-xs text-gray-400 mt-0.5">Herd composition</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={BREED_PIE} dataKey="value" cx="50%" cy="50%" outerRadius={75} innerRadius={35} paddingAngle={3}>
                {BREED_PIE.map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
              </Pie>
              <Legend wrapperStyle={{ fontSize:"10px" }} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Reproductive KPIs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
        <div className="mb-5">
          <h3 className="font-semibold text-gray-900">Reproductive Performance</h3>
          <p className="text-xs text-gray-400 mt-0.5">Key reproductive KPIs for the herd</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {REPRO_KPI.map((kpi) => {
            const good =
              kpi.metric === "Conception Rate"     ? kpi.value > 60  :
              kpi.metric === "Pregnancy Rate"      ? kpi.value > 18  :
              kpi.metric === "Services/Conception" ? kpi.value < 1.8 :
              kpi.metric === "Calving Interval"    ? kpi.value < 400 : kpi.value < 120;
            return (
              <div key={kpi.metric} className={cn("rounded-2xl p-4 text-center border",
                good ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"
              )}>
                <p className={cn("text-2xl font-bold", good ? "text-emerald-700" : "text-amber-700")}>
                  {kpi.value}{kpi.unit}
                </p>
                <p className="text-xs text-gray-600 mt-1 font-medium">{kpi.metric}</p>
                <p className={cn("text-[10px] mt-1 font-semibold", good ? "text-emerald-600" : "text-amber-600")}>
                  {good ? "✓ Good" : "⚠ Monitor"}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top producers table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Top Producing Cows</h3>
          <p className="text-xs text-gray-400 mt-0.5">Individual performance ranking</p>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>Rank</th><th>Animal</th><th>Breed</th><th>Today (L)</th><th>Avg (L)</th><th>Trend</th><th>Performance</th></tr>
            </thead>
            <tbody>
              {animals
                .filter((a) => a.milkYieldToday > 0)
                .sort((a, b) => b.milkYieldToday - a.milkYieldToday)
                .map((a, i) => {
                  const pct   = Math.round((a.milkYieldToday / 35) * 100);
                  const trend = ((a.milkYieldToday - a.milkYieldAvg) / a.milkYieldAvg * 100).toFixed(1);
                  const pos   = parseFloat(trend) >= 0;
                  return (
                    <tr key={a.id}>
                      <td>
                        <span className={cn("w-7 h-7 rounded-full inline-flex items-center justify-center text-xs font-bold text-white",
                          i===0 ? "bg-amber-400" : i===1 ? "bg-gray-400" : i===2 ? "bg-orange-400" : "bg-gray-200 text-gray-600"
                        )}>{i+1}</span>
                      </td>
                      <td className="font-semibold text-gray-900">{a.name}</td>
                      <td className="text-gray-500 text-xs">{a.breed}</td>
                      <td className="font-bold text-emerald-700">{a.milkYieldToday}L</td>
                      <td className="text-gray-600">{a.milkYieldAvg}L</td>
                      <td>
                        <span className={cn("flex items-center gap-0.5 text-xs font-semibold", pos ? "text-emerald-600" : "text-red-500")}>
                          {pos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {Math.abs(parseFloat(trend))}%
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 bg-gray-100 rounded-full">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width:`${pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-500">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
