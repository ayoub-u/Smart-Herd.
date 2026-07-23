"use client";
import { Beef, Droplets, Baby, Syringe, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import Link from "next/link";
import { cn, formatDate } from "@/lib/utils";
import { ROUTES } from "@/constants";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboard } from "@/hooks/useDashboard";
import { useNotifications } from "@/hooks/useNotifications";
import { useFeedInventory } from "@/hooks/useFeedInventory";

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map(p => <p key={p.name} style={{ color: p.color }} className="text-xs">{p.name}: <span className="font-semibold">{p.value}</span></p>)}
    </div>
  );
}

function LoadingCard() {
  return <div className="bg-white rounded-2xl border border-gray-100 shadow-card h-32 animate-pulse" />;
}

export default function DashboardPage() {
  const { farm } = useAuth();
  const farmId = farm?.id ?? null;
  const dash  = useDashboard(farmId);
  const { notifications } = useNotifications(farmId);
  const { feedItems }     = useFeedInventory(farmId);

  if (dash.loading) {
    return (
      <div className="space-y-6 max-w-[1400px]">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i=><LoadingCard key={i}/>)}</div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">{[1,2,3].map(i=><LoadingCard key={i}/>)}</div>
      </div>
    );
  }

  const alertNotifications = notifications.filter(n => n.type==="alert"||n.type==="warning");

  return (
    <div className="space-y-6 max-w-[1400px]">

      {alertNotifications.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-amber-600 shrink-0"/>
          <div className="flex-1 text-sm">
            <span className="font-semibold text-amber-800">Attention needed: </span>
            <span className="text-amber-700">{alertNotifications.slice(0,2).map(n=>n.title).join(" · ")}</span>
          </div>
          <Link href={ROUTES.NOTIFICATIONS} className="text-xs font-semibold text-amber-700 hover:text-amber-900 shrink-0">View →</Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Beef}     label="Total Animals"  value={dash.totalAnimals}  sub={`${dash.healthyAnimals} healthy`}  iconBg="gradient-green" trend={dash.totalAnimals>0?5:undefined}/>
        <StatCard icon={Droplets} label="Milk Today"     value={`${dash.milkToday}L`} sub="Current yield"               iconBg="gradient-blue"  trend={dash.milkToday>0?3:undefined}/>
        <StatCard icon={Baby}     label="Pregnant"       value={dash.pregnantAnimals} sub={`${dash.lactatingAnimals} lactating`} iconBg="gradient-amber"/>
        <StatCard icon={Syringe}  label="Due Vaccines"   value={dash.overdueVaccines+dash.dueSoonVaccines} sub={`${dash.overdueVaccines} overdue`} iconBg="gradient-rose"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 chart-container">
          <div className="flex items-center justify-between mb-4">
            <div><h3 className="font-semibold text-gray-900">Milk Production</h3><p className="text-xs text-gray-400 mt-0.5">Last 7 days · Total liters</p></div>
          </div>
          {dash.milkLast7.every(d=>d.total===0) ? (
            <EmptyState icon="🥛" title="No milk records yet" message="Add milk records to see production trends." action={<Link href={ROUTES.MILK} className="text-sm text-emerald-600 font-semibold hover:underline">Go to Milk Tracking →</Link>}/>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dash.milkLast7} margin={{top:5,right:10,left:-20,bottom:0}}>
                <defs><linearGradient id="milkGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#059669" stopOpacity={0.15}/><stop offset="95%" stopColor="#059669" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="date" tick={{fontSize:11,fill:"#9ca3af"}} tickFormatter={d=>d.split("-")[2]}/>
                <YAxis tick={{fontSize:11,fill:"#9ca3af"}}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Area type="monotone" dataKey="total" name="Liters" stroke="#059669" strokeWidth={2} fill="url(#milkGrad)" dot={{fill:"#059669",r:3}}/>
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-container">
          <div className="mb-4"><h3 className="font-semibold text-gray-900">Revenue vs Costs</h3><p className="text-xs text-gray-400 mt-0.5">Monthly comparison</p></div>
          {dash.monthlyProfitability.length===0 ? (
            <EmptyState icon="📊" title="No data yet" message="Data will appear as you record production."/>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dash.monthlyProfitability} margin={{top:5,right:5,left:-25,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="month" tick={{fontSize:11,fill:"#9ca3af"}}/>
                <YAxis tick={{fontSize:11,fill:"#9ca3af"}}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Bar dataKey="revenue" name="Revenue" fill="#059669" radius={[4,4,0,0]}/>
                <Bar dataKey="costs"   name="Costs"   fill="#e5e7eb" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top producers */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <div><h3 className="font-semibold text-gray-900">Top Producers</h3><p className="text-xs text-gray-400 mt-0.5">Today's milk yield</p></div>
            <Link href={ROUTES.MILK} className="text-xs text-emerald-600 font-semibold hover:underline">View all</Link>
          </div>
          {dash.topProducers.length===0 ? (
            <div className="p-6"><EmptyState icon="🥛" title="No production data" message="Set milk yields on animal records."/></div>
          ) : dash.topProducers.map((cow,i)=>(
            <div key={cow.name} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/70 border-b border-gray-50 last:border-0">
              <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0",
                i===0?"bg-amber-400":i===1?"bg-gray-400":i===2?"bg-orange-400":"bg-gray-200 text-gray-500")}>{i+1}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{cow.name}</p>
                <p className="text-xs text-gray-400">{cow.tag||"No tag"}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-gray-900">{cow.liters}L</p>
              </div>
            </div>
          ))}
        </div>

        {/* Feed inventory */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <div><h3 className="font-semibold text-gray-900">Feed Inventory</h3><p className="text-xs text-gray-400 mt-0.5">Current stock levels</p></div>
            <Link href={ROUTES.NUTRITION} className="text-xs text-emerald-600 font-semibold hover:underline">View all</Link>
          </div>
          {feedItems.length===0 ? (
            <div className="p-6"><EmptyState icon="🌾" title="No feed items" message="Add feed inventory in Nutrition."/></div>
          ) : (
            <div className="p-5 space-y-3">
              {feedItems.slice(0,4).map(f=>{
                const pct = f.dailyUsage>0?Math.min(100,Math.round((f.currentStock/(f.dailyUsage*60))*100)):100;
                const urgent = f.daysRemaining<15;
                return (
                  <div key={f.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700 truncate pr-2">{f.name}</span>
                      <span className={cn("shrink-0 text-xs font-semibold",urgent?"text-red-600":"text-gray-500")}>{f.daysRemaining}d</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full",urgent?"bg-red-400":"bg-emerald-500")} style={{width:`${pct}%`}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent notifications */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Recent Activity</h3>
            <Link href={ROUTES.NOTIFICATIONS} className="text-xs text-emerald-600 font-semibold hover:underline">View all</Link>
          </div>
          {notifications.length===0 ? (
            <div className="p-6"><EmptyState icon="✅" title="All clear!" message="No alerts at the moment."/></div>
          ) : notifications.slice(0,5).map(n=>(
            <div key={n.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-gray-50/70 border-b border-gray-50 last:border-0">
              <div className={cn("mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                n.type==="alert"?"bg-red-100":n.type==="warning"?"bg-amber-100":n.type==="success"?"bg-emerald-100":"bg-blue-100")}>
                {n.type==="success"?<CheckCircle2 size={14} className="text-emerald-600"/>
                  :n.type==="alert"||n.type==="warning"?<AlertTriangle size={14} className={n.type==="alert"?"text-red-600":"text-amber-600"}/>
                  :<Clock size={14} className="text-blue-600"/>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-800">{n.title}</p>
                  {!n.read&&<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"/>}
                </div>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
