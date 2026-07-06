"use client";
import { animals } from "@/data/mockData";
import {
  mockMilkRecords, mockNotifications, mockVaccinationSchedule,
  mockFeedInventory, topProducers, mockProfitabilityData,
} from "@/data/mockData";
import { Beef, Droplets, Baby, Syringe, AlertTriangle, CheckCircle2, Clock, ArrowUp, ArrowDown } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import Link from "next/link";
import { cn, formatDate } from "@/lib/utils";
import { ROUTES } from "@/constants";

const last7 = mockMilkRecords.slice(-7);

function StatCard({ icon: Icon, label, value, sub, color, trend }: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; color: string; trend?: number;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color)}>
          <Icon size={20} className="text-white" />
        </div>
        {trend !== undefined && (
          <div className={cn("flex items-center gap-0.5 text-xs font-medium", trend >= 0 ? "text-emerald-600" : "text-red-500")}>
            {trend >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="text-xs">
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const totalToday     = last7[last7.length - 1]?.total ?? 0;
  const pregnantCount  = animals.filter((a) => a.pregnancyStatus === "pregnant").length;
  const overdueVax     = mockVaccinationSchedule.filter((v) => v.status === "overdue").length;
  const sickAnimals    = animals.filter((a) => a.healthStatus === "sick" || a.healthStatus === "critical");

  return (
    <div className="space-y-6 max-w-[1400px]">

      {/* Alert banner */}
      {(overdueVax > 0 || sickAnimals.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-amber-600 shrink-0" />
          <div className="flex-1 text-sm">
            <span className="font-semibold text-amber-800">Attention needed: </span>
            <span className="text-amber-700">
              {overdueVax > 0 && `${overdueVax} overdue vaccination${overdueVax > 1 ? "s" : ""}`}
              {overdueVax > 0 && sickAnimals.length > 0 && " · "}
              {sickAnimals.length > 0 && `${sickAnimals.length} animal${sickAnimals.length > 1 ? "s" : ""} need medical attention`}
            </span>
          </div>
          <Link href={ROUTES.HEALTH} className="text-xs font-semibold text-amber-700 hover:text-amber-900 shrink-0">
            View →
          </Link>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Beef}    label="Total Animals"  value={animals.length}  sub={`${animals.filter((a) => a.healthStatus === "healthy").length} healthy`} color="gradient-green" trend={5}  />
        <StatCard icon={Droplets}label="Milk Today"     value={`${totalToday}L`}sub="Across all cows"   color="gradient-blue"  trend={3}  />
        <StatCard icon={Baby}    label="Pregnant"       value={pregnantCount}   sub={`${animals.filter((a) => a.pregnancyStatus === "lactating").length} lactating`} color="gradient-amber" />
        <StatCard icon={Syringe} label="Due Vaccines"   value={mockVaccinationSchedule.filter((v) => v.status !== "completed").length} sub={`${overdueVax} overdue`} color="gradient-rose" trend={overdueVax > 0 ? -10 : undefined} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Milk area chart */}
        <div className="lg:col-span-2 chart-container">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Milk Production</h3>
              <p className="text-xs text-gray-400 mt-0.5">Last 7 days · Total liters</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={last7} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="milkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#059669" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={(d) => d.split("-")[2]} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="total" name="Liters" stroke="#059669" strokeWidth={2} fill="url(#milkGrad)" dot={{ fill: "#059669", r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue bar chart */}
        <div className="chart-container">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900">Revenue vs Costs</h3>
            <p className="text-xs text-gray-400 mt-0.5">Monthly comparison</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mockProfitabilityData.slice(-5)} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="revenue" name="Revenue" fill="#059669" radius={[4, 4, 0, 0]} />
              <Bar dataKey="costs"   name="Costs"   fill="#e5e7eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Top producers */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          <div className="p-5 border-b border-gray-50">
            <h3 className="font-semibold text-gray-900">Top Producers</h3>
            <p className="text-xs text-gray-400 mt-0.5">Today's milk yield</p>
          </div>
          <div className="divide-y divide-gray-50">
            {topProducers.map((cow, i) => (
              <div key={cow.name} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/70 transition-colors">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0",
                  i === 0 ? "bg-amber-400" : i === 1 ? "bg-gray-400" : i === 2 ? "bg-orange-400" : "bg-gray-200 text-gray-500"
                )}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{cow.name}</p>
                  <p className="text-xs text-gray-400">{cow.breed}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{cow.liters}L</p>
                  <p className={cn("text-xs font-medium", cow.trend.startsWith("+") ? "text-emerald-600" : "text-red-500")}>
                    {cow.trend}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming vaccinations */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Vaccinations</h3>
              <p className="text-xs text-gray-400 mt-0.5">Upcoming & overdue</p>
            </div>
            <Link href={ROUTES.HEALTH} className="text-xs text-emerald-600 font-medium hover:text-emerald-700">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {mockVaccinationSchedule.slice(0, 5).map((v) => (
              <div key={v.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/70">
                <div className={cn("w-2 h-2 rounded-full shrink-0",
                  v.status === "overdue" ? "bg-red-500" : v.status === "due-soon" ? "bg-amber-500" : "bg-emerald-500"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{v.animalName}</p>
                  <p className="text-xs text-gray-400 truncate">{v.vaccine}</p>
                </div>
                <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full",
                  v.status === "overdue"  ? "bg-red-50 text-red-600"    :
                  v.status === "due-soon" ? "bg-amber-50 text-amber-600": "bg-emerald-50 text-emerald-600"
                )}>
                  {v.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Feed stock */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Feed Inventory</h3>
              <p className="text-xs text-gray-400 mt-0.5">Current stock levels</p>
            </div>
            <Link href={ROUTES.NUTRITION} className="text-xs text-emerald-600 font-medium hover:text-emerald-700">View all</Link>
          </div>
          <div className="p-5 space-y-3">
            {mockFeedInventory.slice(0, 4).map((f) => {
              const pct    = Math.min(100, Math.round((f.currentStock / (f.dailyUsage * 60)) * 100));
              const urgent = f.daysRemaining < 15;
              return (
                <div key={f.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 truncate pr-2">{f.name}</span>
                    <span className={cn("shrink-0 text-xs font-semibold", urgent ? "text-red-600" : "text-gray-500")}>
                      {f.daysRemaining}d
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", urgent ? "bg-red-400" : "bg-emerald-500")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card">
        <div className="p-5 border-b border-gray-50">
          <h3 className="font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {mockNotifications.slice(0, 5).map((n) => (
            <div key={n.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-gray-50/70 transition-colors">
              <div className={cn("mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                n.type === "alert"   ? "bg-red-100"     :
                n.type === "warning" ? "bg-amber-100"   :
                n.type === "success" ? "bg-emerald-100" : "bg-blue-100"
              )}>
                {n.type === "success" ? (
                  <CheckCircle2 size={14} className="text-emerald-600" />
                ) : n.type === "alert" || n.type === "warning" ? (
                  <AlertTriangle size={14} className={n.type === "alert" ? "text-red-600" : "text-amber-600"} />
                ) : (
                  <Clock size={14} className="text-blue-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-800">{n.title}</p>
                  {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{n.message}</p>
              </div>
              <p className="text-xs text-gray-400 shrink-0">{formatDate(n.date)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
