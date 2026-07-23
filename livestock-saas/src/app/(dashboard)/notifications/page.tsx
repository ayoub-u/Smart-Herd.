"use client";
import { CheckCheck, Trash2, AlertTriangle, Info, CheckCircle2, Clock, Bell } from "lucide-react";
import { EmptyState }    from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useState }      from "react";
import { cn, formatDate } from "@/lib/utils";
import { useAuth }           from "@/contexts/AuthContext";
import { useNotifications }  from "@/hooks/useNotifications";
import { ROUTES } from "@/constants";
import Link from "next/link";

const TYPE_STYLE = {
  alert:   { bg:"bg-red-100",     icon:<AlertTriangle size={16} className="text-red-600"/>,   border:"border-l-red-500"   },
  warning: { bg:"bg-amber-100",   icon:<AlertTriangle size={16} className="text-amber-600"/>, border:"border-l-amber-400" },
  info:    { bg:"bg-blue-100",    icon:<Info size={16} className="text-blue-600"/>,           border:"border-l-blue-400"  },
  success: { bg:"bg-emerald-100", icon:<CheckCircle2 size={16} className="text-emerald-600"/>,border:"border-l-emerald-500"},
} as const;

type Filter = "all"|"unread"|"health"|"reproduction"|"feed"|"production"|"system";

export default function NotificationsPage() {
  const { farm } = useAuth();
  const farmId   = farm?.id ?? null;
  const { notifications, unreadCount, loading, markRead, markAllRead, dismiss, clearAll } = useNotifications(farmId);

  const [filter,   setFilter]   = useState<Filter>("all");
  const [clearDlg, setClearDlg] = useState(false);

  const filtered = notifications.filter(n => {
    if (filter==="all")    return true;
    if (filter==="unread") return !n.read;
    return n.category === filter;
  });

  const FILTERS: { value: Filter; label: string; count: number }[] = [
    { value:"all" as Filter,          label:"All",           count:notifications.length },
    { value:"unread" as Filter,       label:"Unread",        count:unreadCount },
    { value:"health" as Filter,       label:"💉 Health",     count:notifications.filter(n=>n.category==="health").length },
    { value:"reproduction" as Filter, label:"❤️ Repro",      count:notifications.filter(n=>n.category==="reproduction").length },
    { value:"feed" as Filter,         label:"🌾 Feed",        count:notifications.filter(n=>n.category==="feed").length },
    { value:"production" as Filter,   label:"🥛 Production",  count:notifications.filter(n=>n.category==="production").length },
  ].filter(f => f.count > 0 || f.value==="all" || f.value==="unread");

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell size={22} className="text-gray-700"/>
            {unreadCount>0&&<span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-0.5">{unreadCount}</span>}
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Notifications</h2>
            <p className="text-xs text-gray-400">{unreadCount} unread · {notifications.length} total</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount>0&&<button onClick={markAllRead} className="flex items-center gap-1.5 text-sm text-emerald-600 font-semibold bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors"><CheckCheck size={15}/>Mark all read</button>}
          {notifications.length>0&&<button onClick={()=>setClearDlg(true)} className="flex items-center gap-1.5 text-sm text-red-500 font-semibold bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition-colors"><Trash2 size={15}/>Clear all</button>}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f=>(
          <button key={f.value} onClick={()=>setFilter(f.value)}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors",
              filter===f.value?"bg-emerald-600 text-white":"bg-white border border-gray-200 text-gray-600 hover:bg-gray-50")}>
            {f.label}
            {f.count>0&&<span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full",filter===f.value?"bg-emerald-500 text-white":"bg-gray-100 text-gray-500")}>{f.count}</span>}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {loading && <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-20 bg-white rounded-2xl border border-gray-100 animate-pulse"/>)}</div>}

        {!loading && filtered.length===0 && (
          <EmptyState icon="🔔" title={filter==="all"?"You're all caught up!":"No notifications in this category"} message="All your farm alerts will appear here automatically."/>
        )}

        {!loading && filtered.map(n=>{
          const style = TYPE_STYLE[n.type];
          return (
            <div key={n.id} className={cn("bg-white rounded-2xl border overflow-hidden hover:shadow-card transition-all",
              !n.read?`border-l-4 border-gray-100 ${style.border}`:"border-gray-100")}>
              <div className="p-4 flex items-start gap-4">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",style.bg)}>{style.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={cn("text-sm font-semibold",n.read?"text-gray-700":"text-gray-900")}>{n.title}</p>
                        {!n.read&&<span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse"/>}
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full",
                          n.type==="alert"?"bg-red-50 text-red-600":n.type==="warning"?"bg-amber-50 text-amber-600":
                          n.type==="success"?"bg-emerald-50 text-emerald-600":"bg-blue-50 text-blue-600"
                        )}>{n.category}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 leading-relaxed">{n.message}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!n.read&&<button onClick={()=>markRead(n.id)} title="Mark as read" className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-700"><CheckCheck size={14}/></button>}
                      <button onClick={()=>dismiss(n.id)} title="Dismiss" className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 text-gray-300 hover:text-red-500"><Trash2 size={13}/></button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400"><Clock size={11}/>Just now</div>
                    {n.animalId&&(
                      <Link href={`${ROUTES.ANIMALS}/${n.animalId}`} className="text-xs text-emerald-600 font-semibold hover:underline">View Animal →</Link>
                    )}
                    {!n.animalId&&n.category==="feed"&&(
                      <Link href={ROUTES.NUTRITION} className="text-xs text-emerald-600 font-semibold hover:underline">View Inventory →</Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {notifications.length>0&&(
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {[
            {type:"alert",   label:"Alerts",   color:"bg-red-50 border-red-100 text-red-700"},
            {type:"warning", label:"Warnings", color:"bg-amber-50 border-amber-100 text-amber-700"},
            {type:"info",    label:"Info",     color:"bg-blue-50 border-blue-100 text-blue-700"},
            {type:"success", label:"Success",  color:"bg-emerald-50 border-emerald-100 text-emerald-700"},
          ].map(s=>(
            <div key={s.type} className={cn("rounded-2xl border p-4 text-center",s.color)}>
              <p className="text-2xl font-bold">{notifications.filter(n=>n.type===s.type).length}</p>
              <p className="text-xs font-semibold mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog open={clearDlg} onClose={()=>setClearDlg(false)} onConfirm={()=>{clearAll();setClearDlg(false);}}
        title="Clear All Notifications" message="This will dismiss all notifications. They will regenerate automatically on your next visit." confirmLabel="Clear All" danger/>
    </div>
  );
}
