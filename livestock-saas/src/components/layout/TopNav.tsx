"use client";
import { Bell, Search, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { ROUTES } from "@/constants";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useAnimals } from "@/hooks/useAnimals";
import { cn } from "@/lib/utils";

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
  const router   = useRouter();
  const { farm } = useAuth();
  const farmId   = farm?.id ?? null;
  const { unreadCount } = useNotifications(farmId);
  const { animals }     = useAnimals(farmId);

  const [searchOpen,  setSearchOpen]  = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const meta = Object.entries(PAGE_META).find(([key]) =>
    key !== ROUTES.DASHBOARD ? pathname.startsWith(key) : pathname === key
  );
  const { title, subtitle } = meta?.[1] ?? PAGE_META[ROUTES.DASHBOARD];

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
    else setSearchQuery("");
  }, [searchOpen]);

  // Keyboard shortcut ⌘K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(o => !o);
      }
      if (e.key === "Escape") setSearchOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Search results — filter animals by name / tag
  const searchResults = searchQuery.trim().length > 1
    ? animals.filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.breed.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6)
    : [];

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 relative z-20">
      <div>
        <h1 className="text-lg font-bold text-gray-900 leading-none">{title}</h1>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative">
          <button
            onClick={() => setSearchOpen(o => !o)}
            className="flex items-center gap-2 text-sm text-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 hover:bg-gray-100 transition-colors"
          >
            <Search size={15} />
            <span className="hidden sm:inline">Search...</span>
            <span className="hidden sm:inline text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-md">⌘K</span>
          </button>

          {searchOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
                <Search size={15} className="text-gray-400 shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search animals by name or tag…"
                  className="flex-1 text-sm outline-none bg-transparent text-gray-900 placeholder-gray-400"
                />
                <button onClick={() => setSearchOpen(false)}>
                  <X size={14} className="text-gray-400 hover:text-gray-700" />
                </button>
              </div>
              {searchQuery.trim().length > 1 && (
                <div className="max-h-64 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">No animals found</p>
                  ) : searchResults.map(a => (
                    <button
                      key={a.id}
                      onClick={() => { router.push(`${ROUTES.ANIMALS}/${a.id}`); setSearchOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors"
                    >
                      <span className="text-lg">{a.type === "cow" ? "🐄" : a.type === "bull" ? "🐂" : "🐑"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{a.name}</p>
                        <p className="text-xs text-gray-400">{a.tag || "No tag"} · {a.breed || a.type}</p>
                      </div>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                        a.healthStatus === "healthy" ? "bg-emerald-50 text-emerald-700" :
                        a.healthStatus === "sick"    ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                      )}>{a.healthStatus}</span>
                    </button>
                  ))}
                </div>
              )}
              {searchQuery.trim().length <= 1 && (
                <p className="text-xs text-gray-400 text-center py-4">Type at least 2 characters</p>
              )}
            </div>
          )}
        </div>

        {/* Notifications bell */}
        <Link
          href={ROUTES.NOTIFICATIONS}
          className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
        >
          <Bell size={18} className="text-gray-500" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
        
      </div>
    </header>
  );
}
