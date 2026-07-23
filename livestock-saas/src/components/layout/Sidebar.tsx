"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard, Beef, Droplets, Heart, Syringe, Wheat,
  BarChart3, Bell, Settings, ChevronRight, LogOut, ChevronLeft, Leaf,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES, APP_NAME } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { useAnimals } from "@/hooks/useAnimals";
import { useMilk } from "@/hooks/useMilk";
import { useNotifications } from "@/hooks/useNotifications";

const NAV = [
  { href: ROUTES.DASHBOARD,     label: "Dashboard",        icon: LayoutDashboard },
  { href: ROUTES.ANIMALS,       label: "Animals",          icon: Beef            },
  { href: ROUTES.MILK,          label: "Milk Tracking",    icon: Droplets        },
  { href: ROUTES.REPRODUCTION,  label: "Reproduction",     icon: Heart           },
  { href: ROUTES.HEALTH,        label: "Health & Vaccines",icon: Syringe         },
  { href: ROUTES.NUTRITION,     label: "Nutrition & Feed", icon: Wheat           },
  { href: ROUTES.ANALYTICS,     label: "Analytics",        icon: BarChart3       },
  { href: ROUTES.NOTIFICATIONS, label: "Notifications",    icon: Bell            },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, farm, logout } = useAuth();
  const farmId = farm?.id ?? null;

  // Live data for farm summary card
  const { animals }         = useAnimals(farmId);
  const { milkRecords }     = useMilk(farmId);
  const { unreadCount }     = useNotifications(farmId);

  // Collapse state
  const [collapsed, setCollapsed] = useState(false);

  // Farm summary calculations
  const cattleCount = animals.filter(a => a.type === "cow" || a.type === "bull").length;
  const sheepCount  = animals.filter(a => a.type === "sheep").length;
  const todayStr    = new Date().toISOString().split("T")[0];
  const milkToday   = milkRecords
    .filter(r => r.date === todayStr)
    .reduce((s, r) => s + r.total, 0);

  return (
    <aside className={cn(
      "h-full bg-white border-r border-gray-100 flex flex-col shrink-0 transition-all duration-300",
      collapsed ? "w-[68px]" : "w-[260px]"
    )}>
      {/* Logo + collapse toggle */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl gradient-green flex items-center justify-center shadow-sm shrink-0">
              <Image
                src="/logo.png"
                alt="Logo"
                width={44}
                height={44}
              />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-base leading-none truncate">{APP_NAME}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Livestock Management</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-xl gradient-green flex items-center justify-center shadow-sm mx-auto">
            <Image
              src="/logo.png"
              alt="Logo"
              width={44}
              height={44}
            />
          </div>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors shrink-0",
            collapsed && "mx-auto mt-0"
          )}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* Farm info card — hidden when collapsed */}
      {!collapsed && (
        <div className="mx-4 mt-4 mb-2 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 p-3">
          <p className="text-xs font-semibold text-emerald-800 truncate">{farm?.name ?? "My Farm"}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5 truncate">{farm?.location || farm?.country || "—"}</p>
          <div className="mt-2 flex gap-3">
            <div>
              <p className="text-xs font-bold text-emerald-900">{cattleCount}</p>
              <p className="text-[10px] text-emerald-600">Cattle</p>
            </div>
            <div className="w-px bg-emerald-200" />
            <div>
              <p className="text-xs font-bold text-emerald-900">{sheepCount}</p>
              <p className="text-[10px] text-emerald-600">Sheep</p>
            </div>
            <div className="w-px bg-emerald-200" />
            <div>
              <p className="text-xs font-bold text-emerald-900">{milkToday > 0 ? `${milkToday}L` : "—"}</p>
              <p className="text-[10px] text-emerald-600">Today</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 py-2">Main Menu</p>
        )}
        {NAV.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== ROUTES.DASHBOARD && pathname.startsWith(item.href));
          const isNotif  = item.label === "Notifications";
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "sidebar-link",
                isActive && "active",
                collapsed && "justify-center px-0"
              )}
            >
              <item.icon
                size={18}
                className={cn("shrink-0", isActive ? "text-emerald-600" : "text-gray-400")}
              />
              {!collapsed && <span className="flex-1">{item.label}</span>}
              {!collapsed && isNotif && unreadCount > 0 && (
                <span className="min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
              {collapsed && isNotif && unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
              {!collapsed && isActive && <ChevronRight size={14} className="text-emerald-500 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className={cn("p-2 border-t border-gray-100 space-y-0.5", collapsed && "px-1")}>
        <Link
          href={ROUTES.SETTINGS}
          title={collapsed ? "Settings" : undefined}
          className={cn("sidebar-link", collapsed && "justify-center px-0")}
        >
          <Settings size={18} className="text-gray-400 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
        <button
          onClick={logout}
          title={collapsed ? "Sign Out" : undefined}
          className={cn("sidebar-link w-full text-left hover:bg-red-50 hover:text-red-600", collapsed && "justify-center px-0")}
        >
          <LogOut size={18} className="text-gray-400 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-3 py-2 mt-1">
            <div className="w-8 h-8 rounded-full gradient-green flex items-center justify-center text-white text-sm font-bold shrink-0">
              {user?.avatarInitials ?? "??"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{user?.fullName ?? "User"}</p>
              <p className="text-[11px] text-gray-400 truncate capitalize">{user?.role}</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center py-2">
            <div className="w-8 h-8 rounded-full gradient-green flex items-center justify-center text-white text-sm font-bold">
              {user?.avatarInitials ?? "??"}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
