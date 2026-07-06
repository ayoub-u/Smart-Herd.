"use client";
import { useState } from "react";
import { mockNotifications } from "@/data/mockData";
import { animals } from "@/data/mockData";
import type { Notification, NotificationCategory } from "@/types";
import { Bell, CheckCheck, Trash2, AlertTriangle, Info, CheckCircle2, Clock } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import Link from "next/link";
import { ROUTES } from "@/constants";

type FilterType = "all" | "unread" | NotificationCategory;

const TYPE_STYLE = {
  alert:   { bg:"bg-red-50",     icon: <AlertTriangle size={16} className="text-red-500"     /> },
  warning: { bg:"bg-amber-50",   icon: <AlertTriangle size={16} className="text-amber-500"   /> },
  info:    { bg:"bg-blue-50",    icon: <Info          size={16} className="text-blue-500"    /> },
  success: { bg:"bg-emerald-50", icon: <CheckCircle2  size={16} className="text-emerald-500" /> },
} as const;

const CAT_ICON: Record<string, string> = {
  health:"💉", reproduction:"❤️", feed:"🌾", production:"🥛", system:"⚙️",
};

export default function NotificationsPage() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [items,  setItems]  = useState<Notification[]>(mockNotifications);

  const filtered = items.filter((n) => {
    if (filter === "all")    return true;
    if (filter === "unread") return !n.read;
    return n.category === filter;
  });

  const unread = items.filter((n) => !n.read).length;

  const markAllRead = () => setItems((p) => p.map((n) => ({ ...n, read:true })));
  const markRead    = (id: string) => setItems((p) => p.map((n) => n.id === id ? { ...n, read:true } : n));
  const remove      = (id: string) => setItems((p) => p.filter((n) => n.id !== id));

  const FILTERS: { value: FilterType; label: string; count: number }[] = [
    { value:"all",          label:"All",          count: items.length },
    { value:"unread",       label:"Unread",       count: unread },
    { value:"health",       label:"Health",       count: items.filter((n) => n.category==="health").length },
    { value:"reproduction", label:"Reproduction", count: items.filter((n) => n.category==="reproduction").length },
    { value:"feed",         label:"Feed",         count: items.filter((n) => n.category==="feed").length },
    { value:"production",   label:"Production",   count: items.filter((n) => n.category==="production").length },
  ];

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell size={22} className="text-gray-700" />
            {unread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unread}
              </span>
            )}
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Notifications</h2>
            <p className="text-xs text-gray-400">{unread} unread · {items.length} total</p>
          </div>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead}
            className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors">
            <CheckCheck size={15} />Mark all read
          </button>
        )}
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors",
              filter===f.value ? "bg-emerald-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            )}>
            {f.label}
            {f.count > 0 && (
              <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                filter===f.value ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-500"
              )}>{f.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Bell size={36} className="mx-auto text-gray-200 mb-3" />
            <p className="font-medium text-gray-500">No notifications</p>
            <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
          </div>
        )}

        {filtered.map((n) => {
          const style       = TYPE_STYLE[n.type];
          const linkedAnimal = n.animalId ? animals.find((a) => a.id === n.animalId) : null;
          const borderColor =
            n.type === "alert"   ? "border-l-red-500"     :
            n.type === "warning" ? "border-l-amber-400"   :
            n.type === "success" ? "border-l-emerald-500" : "border-l-blue-400";

          return (
            <div key={n.id} className={cn(
              "bg-white rounded-2xl border shadow-card overflow-hidden transition-all duration-200",
              !n.read ? `border-l-4 ${borderColor}` : "border-gray-100"
            )}>
              <div className="p-4 flex items-start gap-4">
                {/* Icon */}
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5", style.bg)}>
                  {style.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={cn("text-sm font-semibold", n.read ? "text-gray-700" : "text-gray-900")}>
                          {n.title}
                        </p>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full",
                          n.type==="alert"   ? "bg-red-50 text-red-600"       :
                          n.type==="warning" ? "bg-amber-50 text-amber-600"   :
                          n.type==="success" ? "bg-emerald-50 text-emerald-600":"bg-blue-50 text-blue-600"
                        )}>
                          {CAT_ICON[n.category]} {n.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 leading-relaxed">{n.message}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!n.read && (
                        <button onClick={() => markRead(n.id)} title="Mark as read"
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                          <CheckCheck size={14} />
                        </button>
                      )}
                      <button onClick={() => remove(n.id)} title="Delete"
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors text-gray-300 hover:text-red-500">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-2.5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Clock size={11} />{formatDate(n.date)}
                    </div>
                    {linkedAnimal && (
                      <Link href={`${ROUTES.ANIMALS}/${linkedAnimal.id}`}
                        className="text-xs text-emerald-600 font-semibold hover:text-emerald-700">
                        View {linkedAnimal.name} →
                      </Link>
                    )}
                    {!linkedAnimal && n.category === "health" && (
                      <Link href={ROUTES.HEALTH} className="text-xs text-emerald-600 font-semibold hover:text-emerald-700">Go to Health →</Link>
                    )}
                    {!linkedAnimal && n.category === "feed" && (
                      <Link href={ROUTES.NUTRITION} className="text-xs text-emerald-600 font-semibold hover:text-emerald-700">View Feed →</Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        {[
          { type:"alert",   label:"Alerts",   color:"bg-red-50 border-red-100 text-red-700"         },
          { type:"warning", label:"Warnings", color:"bg-amber-50 border-amber-100 text-amber-700"   },
          { type:"info",    label:"Info",     color:"bg-blue-50 border-blue-100 text-blue-700"       },
          { type:"success", label:"Success",  color:"bg-emerald-50 border-emerald-100 text-emerald-700" },
        ].map((s) => (
          <div key={s.type} className={cn("rounded-2xl border p-4 text-center", s.color)}>
            <p className="text-2xl font-bold">{items.filter((n) => n.type===s.type).length}</p>
            <p className="text-xs font-semibold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
