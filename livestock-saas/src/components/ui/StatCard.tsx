import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon | string;
  iconBg?: string;
  trend?: number;
  className?: string;
}

export function StatCard({ label, value, sub, icon: Icon, iconBg = "gradient-green", trend, className }: StatCardProps) {
  const isEmoji = typeof Icon === "string";
  return (
    <div className={cn("stat-card", className)}>
      <div className="flex items-start justify-between">
        {Icon && (
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", isEmoji ? "bg-gray-50 text-xl" : iconBg)}>
            {isEmoji ? Icon : <Icon size={20} className="text-white" />}
          </div>
        )}
        {trend !== undefined && (
          <div className={cn(
            "flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full",
            trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
          )}>
            {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
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