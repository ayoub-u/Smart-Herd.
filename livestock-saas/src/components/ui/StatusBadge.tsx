import { cn } from "@/lib/utils";

type BadgeVariant = "green" | "red" | "amber" | "blue" | "violet" | "gray" | "orange" | "pink";

const VARIANTS: Record<BadgeVariant, string> = {
  green:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  red:    "bg-red-50 text-red-700 border-red-200",
  amber:  "bg-amber-50 text-amber-700 border-amber-200",
  blue:   "bg-blue-50 text-blue-700 border-blue-200",
  violet: "bg-violet-50 text-violet-700 border-violet-200",
  gray:   "bg-gray-50 text-gray-600 border-gray-200",
  orange: "bg-orange-50 text-orange-700 border-orange-200",
  pink:   "bg-pink-50 text-pink-700 border-pink-200",
};

const DOT_COLORS: Record<BadgeVariant, string> = {
  green:  "bg-emerald-500",
  red:    "bg-red-500",
  amber:  "bg-amber-500",
  blue:   "bg-blue-500",
  violet: "bg-violet-500",
  gray:   "bg-gray-400",
  orange: "bg-orange-500",
  pink:   "bg-pink-500",
};

interface StatusBadgeProps {
  label: string;
  variant: BadgeVariant;
  dot?: boolean;
  className?: string;
}

export function StatusBadge({ label, variant, dot = false, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border",
      VARIANTS[variant], className
    )}>
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", DOT_COLORS[variant])} />}
      {label}
    </span>
  );
}

// Helper maps for data-driven badge selection
export function healthVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    healthy: "green", sick: "red", recovering: "amber", critical: "red",
  };
  return map[status] ?? "gray";
}

export function pregnancyVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    pregnant: "violet", lactating: "blue", dry: "orange", open: "gray",
  };
  return map[status] ?? "gray";
}

export function vaccinationVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    overdue: "red", "due-soon": "amber", scheduled: "blue", completed: "green",
  };
  return map[status] ?? "gray";
}