import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function daysUntil(dateString: string): number {
  const today = new Date();
  const target = new Date(dateString);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getAge(dateOfBirth: string): string {
  const birth = new Date(dateOfBirth);
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  if (years === 0) return `${months + 12} mo`;
  if (months < 0) return `${years - 1}y ${months + 12}m`;
  return `${years}y ${months}m`;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "healthy":   return "text-emerald-600 bg-emerald-50 border-emerald-200";
    case "sick":      return "text-red-600 bg-red-50 border-red-200";
    case "recovering":return "text-amber-600 bg-amber-50 border-amber-200";
    case "critical":  return "text-red-700 bg-red-100 border-red-300";
    default:          return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

export function getPregnancyColor(status: string): string {
  switch (status) {
    case "pregnant":  return "text-violet-600 bg-violet-50 border-violet-200";
    case "lactating": return "text-blue-600 bg-blue-50 border-blue-200";
    case "dry":       return "text-orange-600 bg-orange-50 border-orange-200";
    default:          return "text-gray-500 bg-gray-50 border-gray-200";
  }
}

export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(value);
}
