"use client";
import { Bell, Search, Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ROUTES } from "@/constants";
import { mockNotifications } from "@/data/mockData";

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  [ROUTES.DASHBOARD]:     { title: "Dashboard",          subtitle: "Good morning! Here's your farm overview." },
  [ROUTES.ANIMALS]:       { title: "Animal Management",  subtitle: "Track and manage your herd"              },
  [ROUTES.MILK]:          { title: "Milk Tracking",      subtitle: "Daily production records and trends"     },
  [ROUTES.REPRODUCTION]:  { title: "Reproduction",       subtitle: "Heat detection, insemination & pregnancy"},
  [ROUTES.HEALTH]:        { title: "Health & Vaccines",  subtitle: "Animal health records and calendar"      },
  [ROUTES.NUTRITION]:     { title: "Nutrition & Feed",   subtitle: "Feed inventory and ration management"    },
  [ROUTES.ANALYTICS]:     { title: "Analytics",          subtitle: "Farm performance and profitability"      },
  [ROUTES.NOTIFICATIONS]: { title: "Notifications",      subtitle: "Alerts, reminders and updates"          },
  [ROUTES.SETTINGS]:      { title: "Settings",           subtitle: "Manage your farm and account"           },
};

export function TopNav() {
  const pathname = usePathname();
  const meta = Object.entries(PAGE_META).find(([key]) =>
    key !== ROUTES.DASHBOARD ? pathname.startsWith(key) : pathname === key
  );
  const { title, subtitle } = meta?.[1] ?? PAGE_META[ROUTES.DASHBOARD];
  const unread = mockNotifications.filter((n) => !n.read).length;

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="text-lg font-bold text-gray-900 leading-none">{title}</h1>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <button className="flex items-center gap-2 text-sm text-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 hover:bg-gray-100 transition-colors">
          <Search size={15} />
          <span className="hidden sm:inline">Search...</span>
          <span className="hidden sm:inline text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-md">⌘K</span>
        </button>

        {/* Notifications bell */}
        <Link
          href={ROUTES.NOTIFICATIONS}
          className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
        >
          <Bell size={18} className="text-gray-500" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </Link>

        {/* Quick add */}
        <Link
          href={ROUTES.ANIMALS}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-2 rounded-xl transition-colors"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Add Animal</span>
        </Link>
      </div>
    </header>
  );
}
