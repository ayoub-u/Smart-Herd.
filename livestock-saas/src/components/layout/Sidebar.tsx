"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Beef, Droplets, Heart, Syringe, Wheat, BarChart3, Bell, Settings, ChevronRight, Leaf, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES, APP_NAME } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { mockNotifications } from "@/data/mockData";

const NAV = [
  { href: ROUTES.DASHBOARD,      label: "Dashboard",       icon: LayoutDashboard },
  { href: ROUTES.ANIMALS,        label: "Animals",         icon: Beef            },
  { href: ROUTES.MILK,           label: "Milk Tracking",   icon: Droplets        },
  { href: ROUTES.REPRODUCTION,   label: "Reproduction",    icon: Heart           },
  { href: ROUTES.HEALTH,         label: "Health & Vaccines",icon: Syringe        },
  { href: ROUTES.NUTRITION,      label: "Nutrition & Feed",icon: Wheat           },
  { href: ROUTES.ANALYTICS,      label: "Analytics",       icon: BarChart3       },
  { href: ROUTES.NOTIFICATIONS,  label: "Notifications",   icon: Bell            },
];

export function Sidebar() {
  const pathname  = usePathname();
  const { user, farm, logout } = useAuth();
  const unread = mockNotifications.filter((n) => !n.read).length;

  return (
    <aside className="w-[260px] h-full bg-white border-r border-gray-100 flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-gray-100">
        <div className="w-8 h-8 rounded-xl gradient-green flex items-center justify-center shadow-sm">
          <Leaf size={16} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-base leading-none">{APP_NAME}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Livestock Management</p>
        </div>
      </div>

      {/* Farm info card */}
      <div className="mx-4 mt-4 mb-2 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 p-3">
        <p className="text-xs font-semibold text-emerald-800 truncate">{farm?.name ?? "My Farm"}</p>
        <p className="text-[11px] text-emerald-600 mt-0.5 truncate">{farm?.location}, {farm?.country}</p>
        <div className="mt-2 flex gap-3">
          <div><p className="text-xs font-bold text-emerald-900">12</p><p className="text-[10px] text-emerald-600">Cattle</p></div>
          <div className="w-px bg-emerald-200" />
          <div><p className="text-xs font-bold text-emerald-900">2</p><p className="text-[10px] text-emerald-600">Sheep</p></div>
          <div className="w-px bg-emerald-200" />
          <div><p className="text-xs font-bold text-emerald-900">740L</p><p className="text-[10px] text-emerald-600">Today</p></div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 py-2">Main Menu</p>
        {NAV.map((item) => {
          const isActive = pathname === item.href || (item.href !== ROUTES.DASHBOARD && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={cn("sidebar-link", isActive && "active")}>
              <item.icon size={18} className={cn("shrink-0", isActive ? "text-emerald-600" : "text-gray-400")} />
              <span className="flex-1">{item.label}</span>
              {item.label === "Notifications" && unread > 0 && (
                <span className="min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unread}
                </span>
              )}
              {isActive && <ChevronRight size={14} className="text-emerald-500 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-gray-100 space-y-0.5">
        <Link href={ROUTES.SETTINGS} className="sidebar-link">
          <Settings size={18} className="text-gray-400" />
          <span>Settings</span>
        </Link>
        <button onClick={logout} className="sidebar-link w-full text-left hover:bg-red-50 hover:text-red-600">
          <LogOut size={18} className="text-gray-400" />
          <span>Sign Out</span>
        </button>
        {/* User avatar */}
        <div className="flex items-center gap-2.5 px-3 py-2 mt-1">
          <div className="w-8 h-8 rounded-full gradient-green flex items-center justify-center text-white text-sm font-bold shrink-0">
            {user?.avatarInitials ?? "??"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{user?.fullName ?? "User"}</p>
            <p className="text-[11px] text-gray-400 truncate capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
